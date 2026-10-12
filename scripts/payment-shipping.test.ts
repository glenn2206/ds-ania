import assert from 'node:assert/strict';
import { test } from 'node:test';

// Dummy credentials only: all provider requests in this suite are mocked.
process.env.XENDIT_SECRET_KEY = 'dummy-unit-test-key';
process.env.XENDIT_WEBHOOK_TOKEN = 'dummy-unit-test-callback';
process.env.BITESHIP_TOKEN = 'dummy-unit-test-key';
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

test('Biteship maps real-rate responses and marks provider failures as estimates', async () => {
  const original = globalThis.fetch;
  const input = { destAreaId: 'IDZ12250', items: [{ name: 'Bouquet', value: 950000, weight: 1500, quantity: 1 }] };
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(String(url), 'https://api.biteship.com/v1/rates/couriers');
      assert.equal(JSON.parse(String(options?.body)).destination_area_id, input.destAreaId);
      return Response.json({ success: true, pricing: [
        { courier_name: 'Grab', courier_service_name: 'Instant', price: 30000, duration: '1 hour' },
        { courier_name: 'JNE', courier_service_name: 'REG', price: 14000, duration: '2 days' },
      ] });
    };
    const real = await biteship.getRates(input);
    assert.equal(real.estimated, false);
    assert.deepEqual(real.options.map(o => o.price), [14000, 30000]);
    globalThis.fetch = async () => Response.json({ success: false, error: 'Insufficient balance' }, { status: 400 });
    const fallback = await biteship.getRates(input);
    assert.equal(fallback.estimated, true);
    assert.equal(fallback.options.length, 3);
    globalThis.fetch = async () => { throw new Error('Network unavailable'); };
    assert.equal((await biteship.getRates(input)).estimated, true);
  } finally { globalThis.fetch = original; }
});
