import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import pg from 'pg';

const base = process.env.UAT_BASE_URL || 'http://127.0.0.1:4331';
assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname), 'Local test server only');
assert.ok(['127.0.0.1', 'localhost'].includes(process.env.DB_HOST || '127.0.0.1'), 'Local database only');
assert.ok(process.env.XENDIT_WEBHOOK_TOKEN, 'Webhook token must be configured');
const db = new pg.Client({ host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 5432), user: process.env.DB_USER,
  password: process.env.DB_PASS, database: process.env.DB_NAME });
await db.connect();
const code = 'UAT-' + randomUUID().slice(0, 12);
const orders = [];
let productId;
const callback = async (externalId, status) => {
  const r = await fetch(`${base}/api/webhooks/xendit`, { method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-callback-token': process.env.XENDIT_WEBHOOK_TOKEN },
    body: JSON.stringify({ external_id: externalId, status }), signal: AbortSignal.timeout(15000) });
  assert.equal(r.status, 200);
  return r.json();
};
try {
  productId = (await db.query("INSERT INTO products(slug,name,status,price,stock) VALUES($1,'Payment webhook fixture','draft',10000,10) RETURNING id", [code.toLowerCase()])).rows[0].id;
  for (const suffix of ['paid', 'expired']) {
    const order = (await db.query("INSERT INTO orders(code,customer_name,customer_phone,subtotal,total) VALUES($1,'Local UAT fixture','0000000000',20000,20000) RETURNING id", [code + '-' + suffix])).rows[0].id;
    orders.push(order);
    await db.query("INSERT INTO order_items(order_id,product_id,slug,name,unit_price,qty,line_total) VALUES($1,$2,$3,'Local fixture',10000,2,20000)", [order, productId, code.toLowerCase()]);
  }
  // Parallel HTTP calls deliberately exercise retry races; no provider or payment is contacted.
  const replies = await Promise.all(Array.from({ length: 8 }, () => callback(code + '-paid', 'PAID')));
  assert.equal(replies.filter(r => r.applied === 'paid').length, 1);
  assert.equal((await db.query('SELECT stock FROM products WHERE id=$1', [productId])).rows[0].stock, 8);
  const paid = (await db.query('SELECT status,paid_at FROM orders WHERE id=$1', [orders[0]])).rows[0];
  assert.equal(paid.status, 'paid');
  assert.ok(paid.paid_at);
  assert.equal((await callback(code + '-paid', 'SETTLED')).ignored, 'already paid');
  assert.equal((await callback(code + '-expired', 'EXPIRED')).applied, 'expired');
  assert.equal((await callback(code + '-expired', 'PAID')).ignored, 'already expired');
  assert.equal((await db.query('SELECT stock FROM products WHERE id=$1', [productId])).rows[0].stock, 8);
  assert.equal((await callback(code + '-missing', 'PAID')).ignored, 'unknown order');
  console.log('PASS: parallel callbacks deduct stock once; paid/expired/unknown-order handling verified locally.');
} finally {
  for (const id of orders) await db.query('DELETE FROM orders WHERE id=$1', [id]);
  if (productId) await db.query('DELETE FROM products WHERE id=$1', [productId]);
  await db.end();
  console.log('Local payment fixtures removed; no provider invoices or courier bookings created.');
}
