import 'dotenv/config';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import net from 'node:net';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import pg from 'pg';
import { localPaymentPortal } from './local-payment-portal.mjs';

assert.ok(['localhost', '127.0.0.1'].includes(process.env.DB_HOST || '127.0.0.1'), 'Demo requires a local DB');
assert.ok(!process.env.DB_CLIENT || process.env.DB_CLIENT === 'pg', 'This demo fixture uses local PostgreSQL');
const port = Number(process.env.LOCAL_BOOKING_DEMO_PORT || 4332);
assert.ok(Number.isInteger(port) && port >= 1024 && port <= 65535);
const base = `http://127.0.0.1:${port}`;
const root = fileURLToPath(new URL('../', import.meta.url));
const db = new pg.Client({ host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 5432), user: process.env.DB_USER, password: process.env.DB_PASS, database: process.env.DB_NAME });
const fixtureIds = [];
let productId;
let customerProductId;
let paymentPortal;
let server;
let cleaned = false;
async function cleanup() {
  if (cleaned) return;
  cleaned = true;
  for (const id of fixtureIds) {
    await db.query('DELETE FROM order_emails WHERE order_id=$1', [id]);
    await db.query('DELETE FROM order_refunds WHERE order_id=$1', [id]);
    await db.query('DELETE FROM orders WHERE id=$1', [id]);
  }
  if (customerProductId) await db.query('DELETE FROM products WHERE id=$1', [customerProductId]);
  if (productId) await db.query('DELETE FROM products WHERE id=$1', [productId]);
  if (paymentPortal) await paymentPortal.close();
  await db.end();
  console.log('Local demo fixtures removed. Existing orders were not changed.');
}

// Refuse an occupied port rather than posting a mock callback to another app.
await new Promise((resolve, reject) => {
  const probe = net.createServer();
  probe.once('error', reject);
  probe.listen(port, '127.0.0.1', () => probe.close(resolve));
});
await db.connect();
try {
  await db.query(await readFile(new URL('../db/shipping.pg.sql', import.meta.url), 'utf8'));
  await db.query(await readFile(new URL('../db/mom.pg.sql', import.meta.url), 'utf8'));
  const suffix = crypto.randomBytes(4).toString('hex').toUpperCase();
  productId = (await db.query("INSERT INTO products(slug,name,status,price,stock) VALUES($1,'LOCAL MOCK bouquet - not for sale','draft',100000,10) RETURNING id", ['local-mock-' + suffix.toLowerCase()])).rows[0].id;
  const source = (await db.query("SELECT * FROM products WHERE slug='a-handful-flower-box' LIMIT 1")).rows[0];
  assert.ok(source, 'Demo source product missing');
  const customerSlug = 'demo-flower-box-' + suffix.toLowerCase();
  customerProductId = (await db.query("INSERT INTO products(slug,name,category,pill,status,price,stock,description) VALUES($1,'DEMO - A Handful Flower Box',$2,$3,'published',100000,10,'Produk contoh lokal. Tidak untuk transaksi nyata.') RETURNING id", [customerSlug, source.category, source.pill])).rows[0].id;
  await db.query('INSERT INTO product_images(product_id,filename,position) SELECT $1,filename,position FROM product_images WHERE product_id=$2', [customerProductId, source.id]);
  for (const label of ['PAID', 'PENDING', 'TRY']) {
    const code = `DEMO-BOOK-${label}-${suffix}`;
    const invoice = `LOCAL-MOCK-${label}-${suffix}`;
    const id = (await db.query("INSERT INTO orders(code,customer_name,customer_phone,ship_address,courier,courier_service,shipping_cost,subtotal,total,xendit_invoice_id) VALUES($1,'DEMO - bukan pelanggan nyata','088888888888','ALAMAT FIKTIF untuk simulasi lokal','Grab','Instant',30000,100000,130000,$2) RETURNING id", [code, invoice])).rows[0].id;
    fixtureIds.push(id);
    await db.query('INSERT INTO order_items(order_id,product_id,slug,name,unit_price,qty,line_total) VALUES($1,$2,$3,$4,100000,1,100000)', [id, productId, 'local-mock-' + suffix.toLowerCase(), 'DEMO bouquet - bukan pesanan nyata']);
    await db.query('INSERT INTO order_shipments(order_id,snapshot,reference_id) VALUES($1,$2,$3)', [id, JSON.stringify({ destination: { latitude: -6.28, longitude: 106.62 }, address: 'ALAMAT FIKTIF untuk simulasi lokal', courier: 'grab', service: 'instant', date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }), weight: 1500 }), `ANIA-SHIP-${id}-${code}`]);
  }
  const callbackToken = crypto.randomBytes(32).toString('hex');
  paymentPortal = await localPaymentPortal({ port: port + 1, appBase: base, db, productId: customerProductId, token: callbackToken, onOrder: id => fixtureIds.push(id) });
  const childEnv = { ...process.env, ANIA_LOCAL_BOOKING_DEMO: '1', NODE_ENV: 'development',
    ORDER_EMAIL_ENABLED: 'false', XENDIT_REFUNDS_ENABLED: 'false',
    PUBLIC_SITE_URL: base, BITESHIP_BOOKING_ENABLED: 'true', BITESHIP_TOKEN: 'biteship_test.local-demo-no-network',
    BITESHIP_ORIGIN_PHONE: '088888888888', XENDIT_SECRET_KEY: 'local-demo-payments-disabled', XENDIT_WEBHOOK_TOKEN: callbackToken,
    LOCAL_PAYMENT_PORTAL: paymentPortal.origin, LOCAL_PAYMENT_TOKEN: callbackToken,
    SESSION_SECRET: process.env.SESSION_SECRET && process.env.SESSION_SECRET !== 'dev-insecure-change-me' ? process.env.SESSION_SECRET : crypto.randomBytes(32).toString('hex') };
  delete childEnv.PORT;
  server = spawn(process.execPath, ['--import', new URL('./local-booking-provider.mjs', import.meta.url).href, fileURLToPath(new URL('../node_modules/astro/astro.js', import.meta.url)), 'dev', '--host', '127.0.0.1', '--port', String(port)], { cwd: root, env: childEnv, stdio: 'inherit' });
  server.once('error', error => { console.error(error.message); });
  server.once('exit', code => { void cleanup().then(() => process.exit(code || 0)); });
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null) throw new Error('Demo server stopped before startup');
    try {
      const response = await fetch(base + '/admin/login', { signal: AbortSignal.timeout(1000) });
      if (response.ok) break;
    } catch {}
    if (attempt === 59) throw new Error('Demo server did not start');
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  for (const label of ['PAID', 'TRY']) {
    const code = `DEMO-BOOK-${label}-${suffix}`;
    for (let i = 0; i < 2; i++) {
      const response = await fetch(base + '/api/webhooks/xendit', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-callback-token': callbackToken }, body: JSON.stringify({ external_id: code, id: `LOCAL-MOCK-${label}-${suffix}`, status: 'PAID', amount: 130000, paid_amount: 130000, currency: 'IDR' }) });
      assert.equal(response.status, 200);
      const result = await response.json();
      assert.equal(i === 0 ? result.applied : result.ignored, i === 0 ? 'paid' : 'already paid');
    }
  }
  const paid = (await db.query('SELECT status,paid_at FROM orders WHERE id=$1', [fixtureIds[0]])).rows[0];
  assert.equal(paid.status, 'paid'); assert.ok(paid.paid_at);
  assert.equal((await db.query('SELECT stock FROM products WHERE id=$1', [productId])).rows[0].stock, 8);
  console.log(`\nLOCAL MOCK READY - NO REAL PAYMENT OR COURIER\nPaid order (ready for you): ${base}/admin/orders/${fixtureIds[2]}\nVerification order: ${base}/admin/orders/${fixtureIds[0]}\nPending gate: ${base}/admin/orders/${fixtureIds[1]}\nThe paid orders used the real webhook handler; duplicate callbacks deducted stock only once per order.\nUse the normal local admin login. Check quote, confirm mock booking, then sync status 3 times.\nCtrl+C stops this demo and removes its fixtures. The normal server on port 4331 is unchanged.\n`);
  console.log(`Customer demo product: ${base}/product/${customerSlug}\nPayment portal is MOCK ONLY on ${paymentPortal.origin}`);
  process.on('SIGINT', () => server.kill());
  process.on('SIGTERM', () => server.kill());
} catch (error) {
  if (server) server.kill();
  await cleanup();
  throw error;
}
