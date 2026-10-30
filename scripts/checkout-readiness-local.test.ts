import 'dotenv/config';
import assert from 'node:assert/strict';
import test from 'node:test';
import crypto from 'node:crypto';

test('local CMS toggle is reflected by uncached readiness and cart renders', async () => {
  assert.ok(['localhost', '127.0.0.1'].includes(process.env.DB_HOST || '127.0.0.1'), 'Local DB only');
  const base = process.env.UAT_BASE_URL || 'http://127.0.0.1:4337';
  assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Local app only');
  const payload = Buffer.from(JSON.stringify({ uid: 1, uname: 'readiness-local-test', exp: Math.floor(Date.now() / 1000) + 120 })).toString('base64url');
  const signature = crypto.createHmac('sha256', process.env.SESSION_SECRET || 'dev-insecure-change-me').update(payload).digest('base64url');
  const headers = { Cookie: `ania_admin=${payload}.${signature}`, 'Content-Type': 'application/json' };
  const original = await (await fetch(base + '/api/checkout-status')).json();
  try {
    for (const enabled of [false, true, false]) {
      const save = await fetch(base + '/api/admin/settings', { method: 'PUT', headers, body: JSON.stringify({ checkout: { enabled } }) });
      assert.equal(save.status, 200);
      const state = await fetch(base + '/api/checkout-status');
      assert.equal(state.headers.get('cache-control'), 'no-store');
      assert.deepEqual(await state.json(), { enabled });
      const cart = await (await fetch(base + '/cart')).text();
      assert.ok(cart.includes(`data-checkout-enabled="${enabled}"`));
      if (!enabled) {
        const rates = await fetch(base + '/api/shipping', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
        assert.equal(rates.status, 503);
      }
    }
  } finally {
    const restore = await fetch(base + '/api/admin/settings', { method: 'PUT', headers, body: JSON.stringify({ checkout: original }) });
    assert.equal(restore.status, 200);
  }
});
