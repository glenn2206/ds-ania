import 'dotenv/config';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { stat, readFile } from 'node:fs/promises';
import crypto from 'node:crypto';
import { guideGroups, guideRoutes, guideSections } from '../src/data/admin-guide';

test('admin booking explains separate balance, insufficient funds and safe retry', async () => {
  const component = await readFile('src/components/admin/OrderShipping.astro', 'utf8');
  assert.match(component, /aria-label="Catatan saldo dan ongkir"/);
  assert.match(component, /Top up tidak otomatis memesan kurir/);
  assert.match(component, /creating\/review/);
  assert.match(component, /Rp60\.000/);
  assert.match(component, /Rp65\.000/);
  const notes = guideSections.find(section => section.id === 'pesan-kurir')!.notes!.join(' ');
  assert.match(notes, /order pelanggan tetap paid/);
  assert.match(notes, /top up tidak otomatis membuat booking/);
  assert.match(notes, /rekonsiliasi dahulu/);
  assert.match(notes, /tidak otomatis menagih pelanggan lagi/);
});

test('tracking guide distinguishes admin sync from customer order status', () => {
  const section = guideSections.find(section => section.id === 'lacak-pengiriman')!;
  assert.ok(section);
  const text = [section.intro, ...section.steps, ...section.notes!].join(' ');
  assert.match(text, /Sinkronkan status Biteship/);
  assert.match(text, /belum memiliki tombol lacak Biteship/);
  assert.match(text, /tautan HTTPS/);
  assert.match(text, /tidak otomatis muncul di CMS/);
  assert.match(text, /Reference ID yang cocok/);
  assert.ok(section.fields!.some(field => field.name === 'delivered (kurir)' && field.example.includes('Tidak otomatis')));
});

test('SOP has complete steps, unique anchors, all groups and existing screenshots', async () => {
  assert.equal(guideSections.length, 44);
  assert.equal(new Set(guideSections.map(section => section.id)).size, guideSections.length);
  for (const group of guideGroups) assert.ok(guideSections.some(section => section.group === group.id));
  const screenshots = guideSections.flatMap(section => section.image ? [section.image] : []);
  assert.equal(screenshots.length, 25);
  assert.equal(guideSections.filter(section => section.group === 'alur-order').length, 15);
  for (const section of guideSections) {
    assert.ok(section.steps.length >= 3, section.id);
    assert.ok(section.intro.length > 40, section.id);
    assert.ok(guideGroups.some(group => group.id === section.group));
  }
  for (const image of screenshots) {
    assert.match(image.file, /^\d{2}-[a-z-]+\.jpg$/);
    assert.ok((await stat(`public/assets/admin-guide/${image.file}`)).size > 1000);
    assert.ok(image.alt && image.caption);
  }
  assert.ok(guideRoutes.some(([, route]) => route === '/admin/panduan'));
});

test('SOP route and download require login and include all sections and images', async () => {
  const base = process.env.UAT_BASE_URL || 'http://127.0.0.1:4331';
  for (const pathname of ['/admin/panduan', '/admin/panduan/unduh']) {
    const unauthenticated = await fetch(base + pathname, { redirect: 'manual' });
    assert.equal(unauthenticated.status, 302);
    assert.equal(unauthenticated.headers.get('location'), '/admin/login');
  }
  const body = Buffer.from(JSON.stringify({ uid: 1, uname: 'sop-local-test', exp: Math.floor(Date.now() / 1000) + 300 })).toString('base64url');
  const mac = crypto.createHmac('sha256', process.env.SESSION_SECRET || 'dev-insecure-change-me').update(body).digest('base64url');
  const headers = { Cookie: `ania_admin=${body}.${mac}` };
  const response = await fetch(base + '/admin/panduan', { headers });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  const html = await response.text();
  for (const section of guideSections) assert.ok(html.includes(`id="${section.id}"`), section.id);
  const download = await fetch(base + '/admin/panduan/unduh', { headers });
  assert.equal(download.status, 200);
  assert.match(download.headers.get('content-disposition') || '', /SOP-Admin-ANIA\.md/);
  const markdown = await download.text();
  for (const section of guideSections) assert.ok(markdown.includes(section.title));
  assert.equal((markdown.match(/!\[/g) || []).length, 25);
  assert.ok(!markdown.includes('AniaAdmin#'));
  for (const section of guideSections.filter(section => section.image)) {
    const image = await fetch(base + '/assets/admin-guide/' + section.image!.file);
    assert.equal(image.status, 200);
    assert.match(image.headers.get('content-type') || '', /image\/jpeg/);
  }
});
