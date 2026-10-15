import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ShippingCache, allowShippingRequest } from '../src/lib/shipping-cache';
import { coordinates } from '../src/lib/biteship';

test('cache expiry, failures and bounded eviction', async () => {
  const cache = new ShippingCache<number>(1000, 2);
  const now = Date.now;
  let time = 1000, calls = 0;
  Date.now = () => time;
  try {
    const load = async () => ++calls;
    assert.equal(await cache.get('a', load), 1);
    assert.equal(await cache.get('a', load), 1);
    time += 1001;
    assert.equal(await cache.get('a', load), 2);
    await assert.rejects(cache.get('error', async () => { throw new Error('failure'); }));
    assert.equal(await cache.get('error', load), 3);
    await cache.get('c', load);
    assert.equal(await cache.get('a', load), 5);
  } finally { Date.now = now; }
});
test('request budget limits bursts and resets after one minute', () => {
  const now = Date.now;
  let time = 1000;
  Date.now = () => time;
  try {
    assert.equal(allowShippingRequest('unit', 2), true);
    assert.equal(allowShippingRequest('unit', 2), true);
    assert.equal(allowShippingRequest('unit', 2), false);
    time += 60_001;
    assert.equal(allowShippingRequest('unit', 2), true);
  } finally { Date.now = now; }
});
test('coordinates reject malformed values and out-of-range pins', () => {
  for (const value of [null, {}, { latitude: '', longitude: '' }, { latitude: NaN, longitude: 1 }, { latitude: 100, longitude: 1 }])
    assert.equal(coordinates(value), undefined);
  assert.deepEqual(coordinates({ latitude: -6.25, longitude: 106.85 }), { latitude: -6.25, longitude: 106.85 });
});
