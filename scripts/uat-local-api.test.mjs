import 'dotenv/config';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import pg from 'pg';

assert.equal(process.env.DB_HOST, '127.0.0.1', 'This test must only use the local database.');
const base = 'http://127.0.0.1:4331';
const body = Buffer.from(JSON.stringify({ uid: 1, uname: 'local-uat-test', exp: Math.floor(Date.now() / 1000) + 300 })).toString('base64url');
const mac = crypto.createHmac('sha256', process.env.SESSION_SECRET || 'dev-insecure-change-me').update(body).digest('base64url');
const headers = { 'Content-Type': 'application/json', Cookie: `ania_admin=${body}.${mac}` };
const client = new pg.Client({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT), user: process.env.DB_USER, password: process.env.DB_PASS, database: process.env.DB_NAME });
await client.connect();
const product = (await client.query("SELECT * FROM products WHERE price > 0 AND status = 'published' ORDER BY id LIMIT 1")).rows[0];
assert.ok(product);
const key = `product_discount_${product.id}`;
const original = (await client.query('SELECT skey, svalue FROM site_settings WHERE skey IN ($1, $2)', [key, 'site_media'])).rows;
const request = async (path, data, method = 'PUT') => {
  const response = await fetch(base + path, { method, headers, body: JSON.stringify(data) });
  return { status: response.status, data: await response.json() };
};
const originalSettings = await (await fetch(base + '/api/admin/settings', { headers })).json();
try {
  assert.equal((await fetch(base + '/api/admin/settings')).status, 401);
  assert.equal((await request('/api/admin/settings', { media: { heroSlides: ['javascript:alert(1)'] } })).status, 400);
  const media = { heroSlides: ['/assets/hero-bride-with-bouquet.jpg', '/assets/hero-bouquet-on-table.jpg'], aboutVideo: '/assets/uat-video.mp4' };
  assert.equal((await request('/api/admin/settings', { media })).status, 200);
  assert.deepEqual((await (await fetch(base + '/api/admin/settings', { headers })).json()).media, media);
  assert.match(await (await fetch(base + '/')).text(), /hero-bride-with-bouquet/);
  assert.match(await (await fetch(base + '/about')).text(), /uat-video\.mp4/);
  assert.equal((await request(`/api/admin/products/${product.id}`, { ...product, discount_percent: 100 })).status, 400);
  assert.equal((await request(`/api/admin/products/${product.id}`, { ...product, discount_percent: 25 })).status, 200);
  const pricing = await request('/api/pricing', { items: [{ slug: product.slug, qty: 2 }] }, 'POST');
  const unit = Math.round(Number(product.price) * .75);
  assert.equal(pricing.data.items[0].unitPrice, unit);
  assert.equal(pricing.data.subtotal, unit * 2);
  const html = await (await fetch(base + '/shop?filter=sale')).text();
  assert.match(html, /data-sale="true"/);
  assert.match(html, /<h1[^>]*>Sale<\/h1>/);
  const detail = await (await fetch(base + '/product/' + product.slug)).text();
  assert.ok(/<del[\s>]/.test(detail), 'Detail must show the original price.');
  const missingAddress = await request('/api/checkout', { customer: { name: 'Local test', phone: '000' }, shipping: { mode: 'delivery' }, items: [{ slug: product.slug, qty: 1 }] }, 'POST');
  assert.equal(missingAddress.status, 400);
  console.log('PASS: authorization, media save/read/render, invalid discount, Sale, pricing, detail price, required address. No order created.');
} finally {
  await request(`/api/admin/products/${product.id}`, { ...product, discount_percent: Number(original.find((row) => row.skey === key)?.svalue || 0) });
  await request('/api/admin/settings', { media: originalSettings.media });
  await client.query('BEGIN');
  try {
    await client.query('DELETE FROM site_settings WHERE skey IN ($1, $2)', [key, 'site_media']);
    for (const row of original) await client.query('INSERT INTO site_settings (skey,svalue) VALUES ($1,$2)', [row.skey, row.svalue]);
    await client.query('UPDATE products SET updated_at=$1 WHERE id=$2', [product.updated_at, product.id]);
    await client.query('COMMIT');
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  await client.end();
}
