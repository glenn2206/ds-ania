import 'dotenv/config';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import pg from 'pg';

const base = 'http://127.0.0.1:4331';
assert.ok(['localhost', '127.0.0.1'].includes(process.env.DB_HOST || '127.0.0.1'), 'Local DB only');
const db = new pg.Client({ host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 5432), user: process.env.DB_USER, password: process.env.DB_PASS, database: process.env.DB_NAME });
await db.connect();
const body = Buffer.from(JSON.stringify({ uid: 1, uname: 'booking-local-UAT', exp: Math.floor(Date.now() / 1000) + 300 })).toString('base64url');
const mac = crypto.createHmac('sha256', process.env.SESSION_SECRET || 'dev-insecure-change-me').update(body).digest('base64url');
const cookie = `ania_admin=${body}.${mac}`;
const code = 'HTTP-BOOK-UAT-' + crypto.randomBytes(5).toString('hex');
let id;
try {
  id = (await db.query("INSERT INTO orders(code,status,customer_name,customer_phone) VALUES ($1,'paid','Fictional HTTP fixture','0000000000') RETURNING id", [code])).rows[0].id;
  const endpoint = `${base}/api/admin/orders/${id}/shipping`;
  const post = (value, headers = {}) => fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(value) });
  assert.equal((await post({ action: 'book', confirmed: true })).status, 401);
  assert.equal((await post({ action: 'book', confirmed: true }, { Cookie: cookie, Origin: 'https://untrusted.example' })).status, 403);
  assert.equal((await post({ action: 'invalid' }, { Cookie: cookie, Origin: base })).status, 400);
  // No quote or booking with real provider credentials: this case must fail at the payment/snapshot/config gate.
  const gated = await post({ action: 'quote', name: 'Test', phone: '088888888888' }, { Cookie: cookie, Origin: base });
  assert.ok([409, 503].includes(gated.status));
  await db.query("INSERT INTO order_shipments(order_id,snapshot,reference_id,state,provider_mode) VALUES ($1,'{}',$2,'review','test')", [id, code]);
  const status = await fetch(`${base}/api/admin/orders/${id}`, { method: 'PATCH', headers: { Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'pending' }) });
  assert.equal(status.status, 409);
  const page = await fetch(`${base}/admin/orders/${id}`, { headers: { Cookie: cookie } });
  assert.equal(page.status, 200);
  const html = await page.text();
  assert.ok(html.includes('Sinkronkan status Biteship'));
  assert.ok(html.includes('Jangan membuat booking ulang'));
  assert.ok(!html.includes('biteship_live.'));
  assert.ok(!html.includes('biteship_test.'));
  console.log('PASS: admin login/Origin guards, payment/snapshot gate, status lock and recovery UI. No provider requests.');
} finally {
  if (id) await db.query('DELETE FROM orders WHERE id=$1', [id]);
  await db.end();
}
