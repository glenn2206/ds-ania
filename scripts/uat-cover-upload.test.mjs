import 'dotenv/config';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import { unlink } from 'node:fs/promises';
import sharp from 'sharp';

const base = process.env.UAT_BASE || 'http://127.0.0.1:4336';
assert.match(base, /^http:\/\/127\.0\.0\.1:\d+$/); assert.equal(process.env.DB_HOST, '127.0.0.1');
const body = Buffer.from(JSON.stringify({ uid: 1, uname: 'cover-local-test', exp: Math.floor(Date.now() / 1000) + 300 })).toString('base64url');
const mac = crypto.createHmac('sha256', process.env.SESSION_SECRET || 'dev-insecure-change-me').update(body).digest('base64url');
const headers = { Cookie: `ania_admin=${body}.${mac}` };
const original = (await (await fetch(base + '/api/admin/settings', { headers })).json()).media;
let url;
try {
  const buffer = await sharp('public/assets/hero-bouquet-on-table.jpg').png().toBuffer();
  const form = new FormData(); form.append('kind', 'occasion'); form.append('files', new File([buffer], 'cover.png', { type: 'image/png' }));
  const uploaded = await fetch(base + '/api/admin/media', { method: 'POST', headers, body: form });
  assert.equal(uploaded.status, 200); url = (await uploaded.json()).urls[0];
  const image = await fetch(base + url); assert.equal(image.status, 200); assert.equal(image.headers.get('content-type'), 'image/jpeg');
  const saved = await fetch(base + '/api/admin/settings', { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ media: { ...original, occasionCover: url } }) });
  assert.equal(saved.status, 200);
  assert.ok((await (await fetch(base + '/occasions')).text()).includes(url), 'Cover updates immediately without rebuild');
  console.log('PASS: Occasion upload -> save CMS -> dynamic public cover, no rebuild. Original media restored.');
} finally {
  const restored = await fetch(base + '/api/admin/settings', { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ media: original }) });
  assert.equal(restored.status, 200);
  if (url) { assert.match(url, /^\/uploads\/site-hero-[\w-]+\.jpg$/); await unlink(path.join(process.env.UPLOADS_DIR || path.resolve('uploads'), path.basename(url))); }
}
