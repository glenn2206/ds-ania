import 'dotenv/config';
import assert from 'node:assert/strict';
import { test, after } from 'node:test';
import crypto from 'node:crypto';
import { tx, q, end } from '../src/lib/db';
import { saveDelivery, shippingService } from '../src/lib/order-shipping';
import { BookingError, bookingRequest } from '../src/lib/biteship';

assert.ok(['localhost', '127.0.0.1'].includes(process.env.DB_HOST || '127.0.0.1'), 'Local DB only');
process.env.BITESHIP_BOOKING_ENABLED = 'true';
process.env.BITESHIP_TOKEN = 'biteship_test.unit-test-only';
process.env.BITESHIP_ORIGIN_PHONE = '088888888888';
process.env.SESSION_SECRET = 'unit-test-booking-signature-not-for-production';
const recipient = { name: 'Fictional recipient', phone: '088888888888' };
const shipping = { mode: 'delivery', destination: { latitude: -6.28, longitude: 106.62 }, address: 'Fictional UAT destination', courierCode: 'grab', serviceCode: 'instant' };
const created: number[] = [];
let calls = 0;
let lastPayload: any;
let reply: (endpoint: string, body?: any) => Promise<any>;
const rates = { options: [{ courier: 'Grab', service: 'Instant', courierCode: 'grab', serviceCode: 'instant', price: 30000, etd: '1 hour' }], estimated: false as const };
const service = shippingService({ tx, getRates: async opts => { assert.equal(opts.fresh, true); return rates; },
  bookingRequest: async (endpoint, body) => { calls++; lastPayload = body; return reply(endpoint, body); } });
async function fixture(overrides: Record<string, any> = {}, withShipping = true) {
  const code = 'BOOK-UAT-' + crypto.randomBytes(5).toString('hex');
  const order = await tx(async t => {
    const { insertId } = await t.insert("INSERT INTO orders(code,status,customer_name,customer_phone,shipping_cost,total,paid_at,xendit_invoice_id) VALUES (?,'paid',?,?,30000,130000,CURRENT_TIMESTAMP,?)",
      [code, recipient.name, recipient.phone, 'fictional-invoice']);
    const id = insertId!;
    await t.q('INSERT INTO order_items(order_id,slug,name,unit_price,qty,line_total) VALUES (?,?,?,100000,1,100000)', [id, 'fictional', 'Fictional bouquet']);
    if (withShipping) await saveDelivery(t, id, code, shipping);
    return id;
  });
  created.push(order);
  for (const [key, value] of Object.entries(overrides)) {
    assert.ok(['status', 'paid_at', 'xendit_invoice_id'].includes(key));
    await q(`UPDATE orders SET ${key}=? WHERE id=?`, [value, order]);
  }
  return order;
}
function success(body: any) {
  return { id: 'fictional-provider-id', reference_id: body.reference_id, status: 'confirmed', price: 31000, courier: { company: 'grab', type: 'instant', waybill_id: 'TEST-RESI', link: 'https://example.com/tracking' } };
}
after(async () => {
  for (const id of created) await q('DELETE FROM orders WHERE id=?', [id]);
  await end();
});

test('payment and pickup/legacy gates prevent any courier booking', async () => {
  const start = calls;
  for (const values of [{ status: 'pending' }, { paid_at: null }, { xendit_invoice_id: null }, { status: 'fulfilled' }]) {
    await assert.rejects(service.quote(await fixture(values), recipient), /Xendit/);
  }
  await assert.rejects(service.quote(await fixture({}, false), recipient), /lama\/pickup/);
  const id = await fixture();
  process.env.BITESHIP_BOOKING_ENABLED = 'false';
  await assert.rejects(service.quote(id, recipient), /belum diaktifkan/);
  process.env.BITESHIP_BOOKING_ENABLED = 'true';
  assert.equal(calls, start);
});

test('quote is non-booking; signed review binds recipient, items, price, order and expiry', async () => {
  const id = await fixture();
  const start = calls;
  const quote = await service.quote(id, recipient);
  assert.equal(calls, start);
  assert.equal(quote.payload.delivery_type, 'now');
  assert.equal(quote.payload.courier_type, 'instant');
  assert.equal(quote.payload.destination_contact_name, recipient.name);
  assert.equal(quote.payload.items[0].weight, 1500);
  await assert.rejects(service.book(id + 1, quote.token, 'test'), /order\/environment/);
  await assert.rejects(service.book(id, quote.token + 'tamper', 'test'), /tidak valid/);
  await q('UPDATE order_items SET qty=2 WHERE order_id=?', [id]);
  await assert.rejects(service.book(id, quote.token, 'test'), /Data order berubah/);
  const next = await service.quote(id, recipient);
  const now = Date.now;
  Date.now = () => now() + 91_000;
  try { await assert.rejects(service.book(id, next.token, 'test'), /kedaluwarsa/); }
  finally { Date.now = now; }
  assert.equal(calls, start);
});

test('parallel admin clicks and repeats create only one provider order; actual price is separate', async () => {
  const id = await fixture();
  const quote = await service.quote(id, recipient);
  let release!: () => void;
  let reached!: () => void;
  const wait = new Promise<void>(resolve => { release = resolve; });
  const started = new Promise<void>(resolve => { reached = resolve; });
  reply = async (_url, body) => { reached(); await wait; return success(body); };
  const start = calls;
  const first = service.book(id, quote.token, 'UAT-admin');
  await started;
  await assert.rejects(service.book(id, quote.token, 'UAT-admin-2'), /booking kedua/);
  release();
  const result = await first;
  assert.equal(result.price, 31000);
  assert.equal(calls, start + 1);
  assert.equal(lastPayload.destination_contact_phone, recipient.phone);
  assert.match(lastPayload.reference_id, /^ANIA-SHIP-/);
  const [row] = await q('SELECT * FROM order_shipments WHERE order_id=?', [id]);
  assert.equal(row.state, 'booked');
  assert.equal(row.booked_by, 'UAT-admin');
  assert.equal(JSON.parse(row.snapshot).booking.destination_contact_name, recipient.name);
  assert.equal((await q('SELECT shipping_cost,total FROM orders WHERE id=?', [id]))[0].total, 130000);
  await assert.rejects(service.book(id, quote.token, 'test'), /booking kedua/);
  // Fixture IDs are unique in DB even though fake provider returns the same ID in tests.
  await q('UPDATE order_shipments SET provider_id=NULL WHERE order_id=?', [id]);
});

test('timeout persists review; no blind retry; recovery validates reference and environment', async () => {
  const id = await fixture();
  const quote = await service.quote(id, recipient);
  reply = async () => { throw new BookingError('timeout'); };
  await assert.rejects(service.book(id, quote.token, 'test'), /tidak pasti/);
  assert.equal((await q('SELECT state FROM order_shipments WHERE order_id=?', [id]))[0].state, 'review');
  await assert.rejects(service.quote(id, recipient), /booking kedua/);
  reply = async () => ({ ...success(quote.payload), reference_id: 'another-order' });
  await assert.rejects(service.sync(id, 'fictional-provider-id'), /tidak cocok/);
  process.env.BITESHIP_TOKEN = 'biteship_live.dummy';
  await assert.rejects(service.sync(id, 'fictional-provider-id'), /environment/);
  process.env.BITESHIP_TOKEN = 'biteship_test.unit-test-only';
  reply = async () => ({ ...success(quote.payload), status: 'delivered' });
  assert.equal((await service.sync(id, 'fictional-provider-id')).status, 'delivered');
  await assert.rejects(service.quote(id, recipient), /booking kedua/);
  await q('UPDATE order_shipments SET provider_id=NULL WHERE order_id=?', [id]);
});

test('definite rejection allows a new review but retains the same unique reference', async () => {
  const id = await fixture();
  const quote = await service.quote(id, recipient);
  reply = async () => { throw new BookingError('rejected', false); };
  await assert.rejects(service.book(id, quote.token, 'test'), /ditolak/);
  assert.equal((await q('SELECT state FROM order_shipments WHERE order_id=?', [id]))[0].state, 'rejected');
  const retry = await service.quote(id, recipient);
  assert.equal(retry.payload.reference_id, quote.payload.reference_id);
});

test('changed pickup and invalid recipient are rejected before creating a courier order', async () => {
  const id = await fixture();
  const start = calls;
  await assert.rejects(service.quote(id, { name: '', phone: 'bad' }), /harus valid/);
  const quote = await service.quote(id, recipient);
  const phone = process.env.BITESHIP_ORIGIN_PHONE;
  process.env.BITESHIP_ORIGIN_PHONE = '089999999999';
  try { await assert.rejects(service.book(id, quote.token, 'test'), /pickup berubah/); }
  finally { process.env.BITESHIP_ORIGIN_PHONE = phone; }
  assert.equal(calls, start);
});

test('empty pickup override uses the approved website number without booking', async () => {
  const id = await fixture();
  const savedPhone = process.env.BITESHIP_ORIGIN_PHONE;
  const start = calls;
  try {
    delete process.env.BITESHIP_ORIGIN_PHONE;
    assert.equal((await service.quote(id, recipient)).payload.origin_contact_phone, '082111091885');
    process.env.BITESHIP_ORIGIN_PHONE = '';
    assert.equal((await service.quote(id, recipient)).payload.origin_contact_phone, '082111091885');
    process.env.BITESHIP_ORIGIN_PHONE = '089999999999';
    assert.equal((await service.quote(id, recipient)).payload.origin_contact_phone, '089999999999');
    assert.equal(calls, start);
  } finally {
    if (savedPhone === undefined) delete process.env.BITESHIP_ORIGIN_PHONE;
    else process.env.BITESHIP_ORIGIN_PHONE = savedPhone;
  }
});

test('DB failure after provider success keeps the claim locked and can be reconciled', async () => {
  const id = await fixture();
  let failStore = false;
  let payload: any;
  const crashService = shippingService({
    tx: async fn => {
      if (failStore) { failStore = false; throw new Error('Simulated DB outage'); }
      return tx(fn);
    },
    getRates: async () => rates,
    bookingRequest: async (_endpoint, body) => {
      if (body) { payload = body; failStore = true; }
      return success(payload);
    },
  });
  const quote = await crashService.quote(id, recipient);
  await assert.rejects(crashService.book(id, quote.token, 'test'), /DB outage/);
  assert.equal((await q('SELECT state FROM order_shipments WHERE order_id=?', [id]))[0].state, 'creating');
  await assert.rejects(crashService.book(id, quote.token, 'test'), /booking kedua/);
  await assert.rejects(crashService.sync(id, 'fictional-provider-id'), /masih diproses/);
  await q("UPDATE order_shipments SET updated_at='2020-01-01' WHERE order_id=?", [id]);
  assert.equal((await crashService.sync(id, 'fictional-provider-id')).status, 'confirmed');
  await q('UPDATE order_shipments SET provider_id=NULL WHERE order_id=?', [id]);
});

test('provider adapter classifies rejection vs uncertain/duplicate without real API calls', async () => {
  const saved = globalThis.fetch;
  try {
    for (const scenario of [{ status: 400, code: 40000001, uncertain: false }, { status: 403, code: 0, uncertain: false }, { status: 500, code: 0, uncertain: true }, { status: 400, code: 40002060, uncertain: true }]) {
      globalThis.fetch = async () => Response.json({ success: false, code: scenario.code }, { status: scenario.status });
      await assert.rejects(bookingRequest('/orders', {}), (error: any) => error instanceof BookingError && error.uncertain === scenario.uncertain);
    }
    globalThis.fetch = async () => { throw new Error('network'); };
    await assert.rejects(bookingRequest('/orders', {}), (error: any) => error.uncertain === true);
    globalThis.fetch = async (url, init) => {
      assert.equal(String(url), 'https://api.biteship.com/v1/orders');
      assert.equal(init?.method, 'POST');
      assert.equal(new Headers(init?.headers).get('Authorization'), 'biteship_test.unit-test-only');
      return Response.json({ success: true, id: 'test-id' });
    };
    assert.equal((await bookingRequest('/orders', {})).id, 'test-id');
  } finally { globalThis.fetch = saved; }
});
