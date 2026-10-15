import assert from 'node:assert/strict';

// Loaded only by the dedicated local demo process, never by app.mjs or a build.
assert.equal(process.env.ANIA_LOCAL_BOOKING_DEMO, '1', 'Demo preload requires explicit local mode');
assert.ok(['localhost', '127.0.0.1'].includes(process.env.DB_HOST || '127.0.0.1'), 'Local DB only');
assert.ok(['localhost', '127.0.0.1'].includes(new URL(process.env.PUBLIC_SITE_URL).hostname), 'Local site only');
assert.equal(process.env.BITESHIP_TOKEN, 'biteship_test.local-demo-no-network');
assert.equal(process.env.XENDIT_SECRET_KEY, 'local-demo-payments-disabled');

const originalFetch = globalThis.fetch;
const orders = new Map();
globalThis.fetch = async (input, init) => {
  const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
  if (url.hostname === 'api.xendit.co') {
    if (url.pathname !== '/v2/invoices' || !process.env.LOCAL_PAYMENT_PORTAL) throw new Error('LOCAL DEMO: real payment requests are blocked');
    const portal = new URL(process.env.LOCAL_PAYMENT_PORTAL);
    assert.equal(portal.hostname, '127.0.0.1');
    return originalFetch(new URL('/invoices', portal), { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-local-demo-token': process.env.LOCAL_PAYMENT_TOKEN }, body: String(init?.body) });
  }
  if (url.hostname !== 'api.biteship.com') return originalFetch(input, init);
  const authorization = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined)).get('Authorization');
  assert.equal(authorization, 'biteship_test.local-demo-no-network', 'Real Biteship credentials are forbidden in this demo');
  const method = init?.method || 'GET';
  if (url.pathname === '/v1/rates/couriers' && method === 'POST') {
    return Response.json({ success: true, pricing: [
      { courier_code: 'grab', courier_service_code: 'instant', courier_name: 'Grab', courier_service_name: 'Instant', price: 30000, duration: 'SIMULASI' },
      { courier_code: 'gojek', courier_service_code: 'instant', courier_name: 'Gojek', courier_service_name: 'Instant', price: 32000, duration: 'SIMULASI' },
    ] });
  }
  if (url.pathname === '/v1/orders' && method === 'POST') {
    const body = JSON.parse(String(init.body));
    let allowed = /^ANIA-SHIP-\d+-DEMO-BOOK-/.test(body.reference_id);
    if (!allowed && process.env.LOCAL_PAYMENT_PORTAL) {
      const result = await originalFetch(new URL('/can-book', process.env.LOCAL_PAYMENT_PORTAL), { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-local-demo-token': process.env.LOCAL_PAYMENT_TOKEN }, body: JSON.stringify({ reference: body.reference_id }) });
      allowed = result.ok && (await result.json()).allowed === true;
    }
    if (!allowed)
      return Response.json({ success: false, error: 'Use only DEMO-BOOK orders in this demo' }, { status: 400 });
    assert.ok(['grab', 'gojek'].includes(body.courier_company));
    assert.equal(body.courier_type, 'instant');
    const id = `mock_${body.reference_id}`;
    if (orders.has(id)) return Response.json({ success: false, code: 40002060 }, { status: 400 });
    const order = { success: true, id, reference_id: body.reference_id, status: 'confirmed', price: 30000,
      courier: { company: body.courier_company, type: 'instant', waybill_id: `MOCK-${orders.size + 1}` } };
    orders.set(id, { order, reads: 0 });
    console.log(`[LOCAL MOCK] Courier simulated for ${body.reference_id}; NO real booking.`);
    return Response.json(order);
  }
  if (url.pathname.startsWith('/v1/orders/') && method === 'GET') {
    const record = orders.get(decodeURIComponent(url.pathname.slice('/v1/orders/'.length)));
    if (!record) return Response.json({ success: false, error: 'Demo order missing; restart creates a new demo fixture' }, { status: 404 });
    record.order.status = ['picking_up', 'dropping_off', 'delivered'][Math.min(record.reads++, 2)];
    return Response.json(record.order);
  }
  throw new Error('LOCAL DEMO: unsupported Biteship call blocked');
};
console.log('[LOCAL MOCK] Biteship simulated; all real Xendit and Biteship requests blocked.');
