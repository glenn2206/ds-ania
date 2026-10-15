import assert from 'node:assert/strict';
import { test } from 'node:test';

// Dummy credentials only: all provider requests in this suite are mocked.
process.env.XENDIT_SECRET_KEY = 'dummy-unit-test-key';
process.env.XENDIT_WEBHOOK_TOKEN = 'dummy-unit-test-callback';
process.env.BITESHIP_TOKEN = 'biteship_test.unit-test-key';
process.env.BITESHIP_ORIGIN_LATITUDE = '-6.25';
process.env.BITESHIP_ORIGIN_LONGITUDE = '106.85';
const xendit = await import('../src/lib/xendit');
const biteship = await import('../src/lib/biteship');

test('Xendit builds an IDR invoice request and returns the payment URL', async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    assert.equal(String(url), 'https://api.xendit.co/v2/invoices');
    assert.equal(options?.method, 'POST');
    assert.equal(new Headers(options?.headers).get('Authorization'),
      'Basic ' + Buffer.from('dummy-unit-test-key:').toString('base64'));
    const payload = JSON.parse(String(options?.body));
    assert.equal(payload.amount, 950000);
    assert.equal(payload.external_id, 'UNIT-TEST');
    assert.equal(payload.currency, 'IDR');
    assert.equal(payload.invoice_duration, 86400);
    assert.equal(payload.success_redirect_url, 'https://example.com/order/UNIT-TEST');
    assert.equal(payload.items[0].price, 950000);
    return Response.json({ id: 'mock-invoice', invoice_url: 'https://example.com/pay', status: 'PENDING' });
  };
  try {
    const result = await xendit.createInvoice({
      externalId: 'UNIT-TEST', amount: 950000, description: 'Unit test',
      successUrl: 'https://example.com/order/UNIT-TEST', failureUrl: 'https://example.com/order/UNIT-TEST',
      items: [{ name: 'Bouquet', quantity: 1, price: 950000 }],
    });
    assert.equal(result.invoiceUrl, 'https://example.com/pay');
    assert.equal(result.id, 'mock-invoice');
  } finally { globalThis.fetch = original; }
});

test('Xendit surfaces provider failures and rejects unauthenticated callbacks', async () => {
  assert.equal(xendit.verifyCallbackToken(null), false);
  assert.equal(xendit.verifyCallbackToken('wrong'), false);
  assert.equal(xendit.verifyCallbackToken('dummy-unit-test-callback'), true);
  const original = globalThis.fetch;
  globalThis.fetch = async () => Response.json({ message: 'Insufficient permissions' }, { status: 403 });
  try {
    await assert.rejects(xendit.createInvoice({
      externalId: 'UNIT-TEST', amount: 950000, description: 'Unit test',
      successUrl: 'https://example.com', failureUrl: 'https://example.com',
    }), /Xendit 403: Insufficient permissions/);
  } finally { globalThis.fetch = original; }
});

test('Biteship only returns Instant, sends coordinates and reuses successful quotes', async () => {
  const original = globalThis.fetch;
  const input = { destination: { latitude: -6.24, longitude: 106.84 }, items: [{ name: 'Bouquet', value: 950000, weight: 1500, quantity: 1 }] };
  let calls = 0;
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(String(url), 'https://api.biteship.com/v1/rates/couriers');
      calls++;
      const body = JSON.parse(String(options?.body));
      assert.ok([-6.24, -6.23].includes(body.destination_latitude));
      assert.equal(body.origin_latitude, -6.25);
      assert.equal(body.couriers, 'gojek,grab');
      assert.equal(body.origin_area_id, undefined);
      return Response.json({ success: true, pricing: [
        { courier_code: 'grab', courier_service_code: 'instant', courier_name: 'Grab', courier_service_name: 'Instant', price: 30000, duration: '1 hour' },
        { courier_code: 'grab', courier_service_code: 'same_day', courier_name: 'Grab', courier_service_name: 'Same Day', price: 15000 },
        { courier_code: 'jne', courier_service_code: 'reg', courier_name: 'JNE', courier_service_name: 'REG', price: 14000 },
      ] });
    };
    const real = await biteship.getRates(input);
    assert.equal(real.estimated, false);
    assert.deepEqual(real.options.map(o => o.price), [30000]);
    await biteship.getRates(input);
    assert.equal(calls, 1);
    await Promise.all([biteship.getRates({ ...input, destination: { latitude: -6.23, longitude: 106.84 } }), biteship.getRates({ ...input, destination: { latitude: -6.23, longitude: 106.84 } })]);
    assert.equal(calls, 2);
    globalThis.fetch = async () => { throw new Error('Unexpected provider call'); };
    await assert.rejects(biteship.getRates({ items: input.items }), /delivery pin/);
    const savedOrigin = process.env.BITESHIP_ORIGIN_LATITUDE;
    process.env.BITESHIP_ORIGIN_LATITUDE = 'invalid';
    await assert.rejects(biteship.getRates(input), /pickup pin is not configured/);
    process.env.BITESHIP_ORIGIN_LATITUDE = savedOrigin;
  } finally { globalThis.fetch = original; }
});

test('Biteship provider failure never becomes an empty search or fabricated quote', async () => {
  const original = globalThis.fetch;
  const input = { destination: { latitude: -6.21, longitude: 106.82 }, items: [{ name: 'Flower', value: 10000, weight: 1500, quantity: 1 }] };
  try {
    globalThis.fetch = async () => Response.json({ success: false, error: 'Insufficient balance' }, { status: 400 });
    await assert.rejects(biteship.getRates(input), /unavailable/);
    await assert.rejects(biteship.searchAreas('Jakarta'), /unavailable/);
    globalThis.fetch = async () => { throw new Error('Network unavailable'); };
    await assert.rejects(biteship.getRates(input), /unavailable/);
    let calls = 0;
    globalThis.fetch = async () => { calls++; return Response.json({ success: true, areas: [{ id: 'area', name: 'Jakarta', postal_code: 12770 }] }); };
    assert.equal((await biteship.searchAreas(' Jakarta ')).length, 1);
    await biteship.searchAreas('jakarta');
    assert.equal(calls, 1);
  } finally { globalThis.fetch = original; }
});

test('default Instant pickup uses the confirmed Tangerang branch', async () => {
  const original = globalThis.fetch;
  const savedLat = process.env.BITESHIP_ORIGIN_LATITUDE;
  const savedLng = process.env.BITESHIP_ORIGIN_LONGITUDE;
  delete process.env.BITESHIP_ORIGIN_LATITUDE;
  delete process.env.BITESHIP_ORIGIN_LONGITUDE;
  let calls = 0;
  globalThis.fetch = async (_url, options) => {
    calls++;
    const body = JSON.parse(String(options?.body));
    assert.equal(body.origin_latitude, -6.2749375);
    assert.equal(body.origin_longitude, 106.6091875);
    return Response.json({ success: true, pricing: [] });
  };
  try {
    await biteship.getRates({ destination: { latitude: -6.28, longitude: 106.61 }, items: [{ name: 'Bouquet', value: 950000, weight: 1500, quantity: 1 }] });
    assert.equal(calls, 1);
  } finally {
    globalThis.fetch = original;
    if (savedLat === undefined) delete process.env.BITESHIP_ORIGIN_LATITUDE;
    else process.env.BITESHIP_ORIGIN_LATITUDE = savedLat;
    if (savedLng === undefined) delete process.env.BITESHIP_ORIGIN_LONGITUDE;
    else process.env.BITESHIP_ORIGIN_LONGITUDE = savedLng;
  }
});
