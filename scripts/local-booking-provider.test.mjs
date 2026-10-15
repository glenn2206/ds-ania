import assert from 'node:assert/strict';
import { test } from 'node:test';
process.env.ANIA_LOCAL_BOOKING_DEMO = '1';
process.env.DB_HOST = '127.0.0.1';
process.env.PUBLIC_SITE_URL = 'http://127.0.0.1:4332';
process.env.BITESHIP_TOKEN = 'biteship_test.local-demo-no-network';
process.env.XENDIT_SECRET_KEY = 'local-demo-payments-disabled';
let networkCalls = 0;
globalThis.fetch = async () => { networkCalls++; throw new Error('Network forbidden in this test'); };
await import('./local-booking-provider.mjs');
const headers = { Authorization: process.env.BITESHIP_TOKEN, 'Content-Type': 'application/json' };
const post = body => fetch('https://api.biteship.com/v1/orders', { method: 'POST', headers, body: JSON.stringify(body) });

test('demo never contacts a real payment/shipping provider; duplicate booking is rejected', async () => {
  await assert.rejects(fetch('https://api.xendit.co/v2/invoices'), /blocked/);
  const rate = await fetch('https://api.biteship.com/v1/rates/couriers', { method: 'POST', headers, body: '{}' });
  assert.equal((await rate.json()).pricing[0].price, 30000);
  const input = { reference_id: 'ANIA-SHIP-123-DEMO-BOOK-TEST', courier_company: 'grab', courier_type: 'instant' };
  const order = await (await post(input)).json();
  assert.match(order.id, /^mock_/);
  assert.equal((await (await post(input)).json()).code, 40002060);
  assert.equal((await post({ ...input, reference_id: 'ANIA-SHIP-1-REAL-CUSTOMER' })).status, 400);
  for (const status of ['picking_up', 'dropping_off', 'delivered']) {
    const result = await fetch('https://api.biteship.com/v1/orders/' + order.id, { headers });
    assert.equal((await result.json()).status, status);
  }
  await assert.rejects(fetch('https://api.biteship.com/v1/orders', { headers: { Authorization: 'biteship_live.not-permitted' } }));
  assert.equal(networkCalls, 0);
});
