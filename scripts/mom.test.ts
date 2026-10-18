import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { customerWhatsApp, orderStatusLabel } from '../src/lib/order-status';
import { validEmail, orderEmailText, queueOrderEmails, emailConfigured } from '../src/lib/order-email';
import { refundsEnabled, refundResultMatches } from '../src/lib/order-refund';
import { getCheckoutEnabled } from '../src/lib/settings';

test('WhatsApp formats Indonesian phones and safely encodes follow-up', () => {
  assert.ok(customerWhatsApp('0821-1109-1885', 'ANIA-A&B')?.startsWith('https://wa.me/6282111091885?text='));
  assert.ok(customerWhatsApp('+62 821 1109 1885', 'ANIA-123'));
  assert.equal(customerWhatsApp('abc', 'test'), undefined);
  assert.equal(orderStatusLabel('refunded'), 'Refund berhasil');
});
test('email validation rejects header/recipient injection and messages distinguish unpaid from paid', () => {
  assert.ok(validEmail('customer@example.com'));
  for (const email of ['bad', 'a@b.co\r\nBcc:x@y.com', 'a@b.co,c@d.co']) assert.equal(validEmail(email), false);
  const order = { code: 'MOM-TEST', customer_name: 'Test', shipping_cost: 30000, total: 130000 };
  assert.match(orderEmailText(order, [], 'placed'), /bukan bukti pembayaran/);
  assert.match(orderEmailText(order, [], 'paid'), /Pembayaran sudah diterima/);
});
test('outbox events deduplicate and keep shop notification when customer email is absent', async () => {
  const rows: unknown[][] = [];
  const t = { q: async (_sql: string, params: unknown[] = []) => rows.filter(row => row[0] === params[0] && row[1] === params[1] && row[2] === params[2]).map(() => ({ id: 1 })),
    insert: async (_sql: string, params: unknown[] = []) => { rows.push(params); return { insertId: rows.length }; } };
  await queueOrderEmails(t, 1, 'placed', 'customer@example.com');
  await queueOrderEmails(t, 1, 'placed', 'customer@example.com');
  assert.equal(rows.length, 2);
  await queueOrderEmails(t, 2, 'paid', null);
  assert.equal(rows.length, 3); assert.equal(rows[2][2], 'shop');
});
test('money and email switches default off and refund responses match original invoice and amount', () => {
  assert.equal(refundsEnabled(), false); assert.equal(emailConfigured(), false);
  const response = { id: 'rfd-test', invoice_id: 'invoice-test', amount: 130000, currency: 'IDR', status: 'SUCCEEDED' };
  assert.ok(refundResultMatches(response, 'invoice-test', 130000));
  for (const change of [{ amount: 1 }, { invoice_id: 'wrong' }, { currency: 'USD' }, { status: 'unknown' }])
    assert.ok(!refundResultMatches({ ...response, ...change }, 'invoice-test', 130000));
});
test('checkout defaults closed, server rejects before providers, and storefront gates payment', async () => {
  assert.equal(await getCheckoutEnabled(), false);
  const api = await readFile('src/pages/api/checkout.ts', 'utf8');
  const cart = await readFile('src/components/templates/CartSection.astro', 'utf8');
  const order = await readFile('src/pages/order/[code].astro', 'utf8');
  assert.ok(api.indexOf('if (!await getCheckoutEnabled())') < api.indexOf('const body ='));
  assert.match(api, /xendit.isConfigured\(\) && await getCheckoutEnabled\(\)/);
  assert.match(cart, /if \(!checkoutEnabled\) return;/);
  assert.match(order, /checkoutEnabled && order.status === 'pending'/);
});
test('CMS media is dynamic, hover handles the overlay, and deploy migrates before switch', async () => {
  const occasion = await readFile('src/pages/occasions.astro', 'utf8');
  const intro = await readFile('src/components/templates/OccasionIntro.astro', 'utf8');
  const shop = await readFile('src/components/templates/ShopSection.astro', 'utf8');
  const deploy = await readFile('scripts/cpanel-deploy.sh', 'utf8');
  const migration = await readFile('scripts/db-mom.mjs', 'utf8');
  assert.match(occasion, /prerender = false/); assert.match(intro, /media.occasionCover/);
  assert.match(shop, /addEventListener\('pointermove'/); assert.match(shop, /event.pointerType !== 'mouse'/);
  assert.ok(deploy.indexOf('scripts/db-mom.mjs') < deploy.indexOf('mv "$APP_DIR/dist.next"'));
  assert.match(migration, /mom_checkout_pause_v1/);
  assert.match(migration, /if \(!rows.length\)/);
  assert.match(migration, /VALUES \('checkout_enabled','0'\)/);
});
