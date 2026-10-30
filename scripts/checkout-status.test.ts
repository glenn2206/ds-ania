import assert from 'node:assert/strict';
import test from 'node:test';
import { readCheckoutStatus, watchCheckoutStatus } from '../src/lib/checkout-status';

test('readiness accepts only a successful boolean response', async () => {
  assert.equal(await readCheckoutStatus(async () => Response.json({ enabled: true })), true);
  assert.equal(await readCheckoutStatus(async () => Response.json({ enabled: false })), false);
  await assert.rejects(readCheckoutStatus(async () => Response.json({ enabled: 'true' })));
  await assert.rejects(readCheckoutStatus(async () => Response.json({}, { status: 503 })));
});

test('returning to cart follows OFF -> ON -> OFF without any shipping requests', async () => {
  const before = { window: globalThis.window, document: globalThis.document, fetch: globalThis.fetch };
  const win = new EventTarget();
  const doc = Object.assign(new EventTarget(), { visibilityState: 'visible' });
  Object.assign(globalThis, { window: win, document: doc });
  let enabled = false;
  let calls = 0;
  const changes: boolean[] = [];
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/checkout-status');
    assert.equal(options?.cache, 'no-store');
    calls++;
    return Response.json({ enabled });
  };
  const settle = () => new Promise(resolve => setImmediate(resolve));
  try {
    watchCheckoutStatus(false, value => changes.push(value));
    await settle();
    enabled = true;
    win.dispatchEvent(new Event('focus'));
    await settle();
    assert.deepEqual(changes, [true]);
    doc.visibilityState = 'hidden';
    const last = calls;
    win.dispatchEvent(new Event('focus'));
    await settle();
    assert.equal(calls, last);
    enabled = false;
    doc.visibilityState = 'visible';
    doc.dispatchEvent(new Event('visibilitychange'));
    await settle();
    assert.deepEqual(changes, [true, false]);
    win.dispatchEvent(new Event('pageshow'));
    await settle();
    assert.deepEqual(changes, [true, false]);
  } finally { Object.assign(globalThis, before); }
});
