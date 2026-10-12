import 'dotenv/config';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import sharp from 'sharp';

assert.equal(process.env.DB_HOST, '127.0.0.1', 'Local fixture only');
const base = 'http://127.0.0.1:4331';
const session = Buffer.from(JSON.stringify({ uid: 1, uname: 'seo-local-test', exp: Math.floor(Date.now() / 1000) + 300 })).toString('base64url');
const signature = crypto.createHmac('sha256', process.env.SESSION_SECRET || 'dev-insecure-change-me').update(session).digest('base64url');
const headers = { Cookie: `ania_admin=${session}.${signature}` };
const payload = { name: 'SEO local fixture', slug: 'seo-local-fixture-' + Date.now(), category: 'premium-wrapped', price: 1000, status: 'published' };
const request = (path, body, method = 'PUT') => fetch(base + path, { method, headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
let id;
try {
  const created = await request('/api/admin/products', payload, 'POST');
  assert.equal(created.status, 200);
  id = (await created.json()).id;
  const url = `/api/admin/products/${id}`;
  assert.equal((await fetch(base + url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })).status, 401);
  const image = await sharp('public/assets/hero-bouquet-on-table.jpg').resize(64).jpeg().toBuffer();
  const form = new FormData();
  for (let i = 0; i < 2; i++) form.append('photos', new File([image], `fixture-${i}.jpg`, { type: 'image/jpeg' }));
  const uploaded = await fetch(base + url + '/images', { method: 'POST', headers, body: form });
  assert.equal(uploaded.status, 200);
  const images = (await uploaded.json()).images;
  assert.equal(images.length, 2);
  const alts = [{ id: images[0].id, alt: 'Pink roses & ribbon <detail>' }, { id: images[1].id, alt: 'Flower box viewed from above' }];
  for (const invalid of [[{ id: images[0].id, alt: 'x'.repeat(301) }], [{ id: 99999999, alt: 'Foreign image' }]]) {
    assert.equal((await request(url, { ...payload, image_alts: invalid })).status, 400);
  }
  assert.equal((await request(url, { ...payload, image_alts: alts })).status, 200);
  const list = async () => (await (await fetch(base + url + '/images', { headers })).json()).images;
  assert.equal((await list())[0].alt_text, alts[0].alt);
  const detailResponse = await fetch(base + '/product/' + payload.slug);
  assert.equal(detailResponse.status, 200);
  const detail = await detailResponse.text();
  assert.ok(detail.includes('alt="Pink roses &#38; ribbon <detail>"'));
  assert.ok(detail.includes('alt="Flower box viewed from above"'));
  assert.ok((await (await fetch(base + '/shop')).text()).includes('alt="Pink roses &#38; ribbon <detail>"'));
  const reordered = await request(url + '/images/reorder', { order: [images[1].id, images[0].id] }, 'POST');
  assert.equal(reordered.status, 200);
  assert.equal((await reordered.json()).images[0].alt_text, alts[1].alt);
  const renamed = { ...payload, slug: payload.slug + '-renamed' };
  assert.equal((await request(url, renamed)).status, 200);
  assert.equal((await list())[0].alt_text, alts[1].alt);
  assert.equal((await request(url, { ...renamed, image_alts: images.map((image) => ({ id: image.id, alt: '' })) })).status, 200);
  assert.ok((await (await fetch(base + '/product/' + renamed.slug)).text()).includes('alt="SEO local fixture"'));
  console.log('PASS: auth, validation, save/read, escaped gallery/card alt, reorder, rename and empty fallback.');
} finally {
  if (id) assert.equal((await fetch(base + `/api/admin/products/${id}`, { method: 'DELETE', headers })).status, 200);
}
