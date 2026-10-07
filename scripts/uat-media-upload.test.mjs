import 'dotenv/config';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import { unlink } from 'node:fs/promises';
import sharp from 'sharp';

assert.equal(process.env.DB_HOST, '127.0.0.1', 'Local test only');
const base = process.env.UAT_BASE || 'http://127.0.0.1:4331';
assert.match(base, /^http:\/\/127\.0\.0\.1:\d+$/);
const body = Buffer.from(JSON.stringify({ uid: 1, uname: 'local-test', exp: Math.floor(Date.now() / 1000) + 300 })).toString('base64url');
const mac = crypto.createHmac('sha256', process.env.SESSION_SECRET || 'dev-insecure-change-me').update(body).digest('base64url');
const headers = { Cookie: `ania_admin=${body}.${mac}` };
const original = (await (await fetch(base + '/api/admin/settings', { headers })).json()).media;
const uploaded = [];
async function upload(kind, files, authenticated = true) {
  const form = new FormData(); form.append('kind', kind);
  files.forEach(file => form.append('files', file));
  return fetch(base + '/api/admin/media', { method: 'POST', headers: authenticated ? headers : {}, body: form });
}
try {
  assert.equal((await upload('hero', [], false)).status, 401);
  assert.equal((await upload('unknown', [])).status, 400);
  assert.equal((await upload('hero', [new File(['not an image'], 'wrong.jpg', { type: 'image/jpeg' })])).status, 400);
  assert.equal((await upload('video', [new File(['not a video'], 'wrong.mp4', { type: 'video/mp4' })])).status, 400);
  const buffer = await sharp('public/assets/hero-bouquet-on-table.jpg').png().toBuffer();
  const imageResponse = await upload('hero', [new File([buffer], 'carousel.png', { type: 'image/png' })]);
  assert.equal(imageResponse.status, 200);
  uploaded.push(...(await imageResponse.json()).urls);
  const image = await fetch(base + uploaded[0]);
  assert.equal(image.status, 200);
  assert.equal(image.headers.get('content-type'), 'image/jpeg');
  assert.ok((await sharp(Buffer.from(await image.arrayBuffer())).metadata()).width > 0);
  // Container-header fixture exercises transport/ranges, not video decoding.
  const video = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypisom'), Buffer.alloc(128)]);
  const videoResponse = await upload('video', [new File([video], 'transport-test.mp4', { type: 'video/mp4' })]);
  assert.equal(videoResponse.status, 200);
  uploaded.push(...(await videoResponse.json()).urls);
  const videoUrl = base + uploaded[1];
  const head = await fetch(videoUrl, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(head.headers.get('content-length'), String(video.length));
  assert.equal((await head.arrayBuffer()).byteLength, 0);
  const range = await fetch(videoUrl, { headers: { Range: 'bytes=4-7' } });
  assert.equal(range.status, 206);
  assert.equal(await range.text(), 'ftyp');
  assert.equal(range.headers.get('content-range'), `bytes 4-7/${video.length}`);
  const suffix = await fetch(videoUrl, { headers: { Range: 'bytes=-10' } });
  assert.equal(suffix.status, 206);
  assert.equal((await suffix.arrayBuffer()).byteLength, 10);
  for (const value of ['bytes=999999-', 'bytes=-0', 'bytes=8-2', 'bytes=1-2,4-5']) {
    assert.equal((await fetch(videoUrl, { headers: { Range: value } })).status, 416);
  }
  const saved = await fetch(base + '/api/admin/settings', { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ media: { heroSlides: [uploaded[0]], aboutVideo: uploaded[1] } }) });
  assert.equal(saved.status, 200);
  assert.ok((await (await fetch(base + '/')).text()).includes(uploaded[0]));
  assert.ok((await (await fetch(base + '/about')).text()).includes(uploaded[1]));
  console.log('PASS: upload auth/validation, image conversion, save/render, video HEAD and byte ranges.');
} finally {
  const restored = await fetch(base + '/api/admin/settings', { method: 'PUT', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ media: original }) });
  assert.equal(restored.status, 200);
  for (const url of uploaded) {
    assert.match(url, /^\/uploads\/site-(hero|about)-[\w-]+\.(jpg|mp4)$/);
    await unlink(path.join(process.env.UPLOADS_DIR || path.resolve(process.env.APP_ROOT || process.cwd(), 'uploads'), path.basename(url)));
  }
}
