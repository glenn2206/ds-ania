import test from 'node:test';
import assert from 'node:assert/strict';
import { activeBranch, nearestBranch, resolveBranch } from '../src/data/checkout-branches';
import { deliverySnapshot } from '../src/lib/order-shipping';
import { getRates } from '../src/lib/biteship';

test('nearest active branch is Jakarta/Bali; coming-soon Tangerang cannot be used', () => {
  assert.equal(nearestBranch({ latitude: -8.68, longitude: 115.19 }).id, 'bali');
  assert.equal(nearestBranch({ latitude: -6.274889, longitude: 106.6092373 }).id, 'jakarta');
  assert.equal(resolveBranch('jakarta', { latitude: -8.68, longitude: 115.19 }).id, 'jakarta');
  for (const id of ['tangerang', 'bali-demo', 'unknown', undefined]) assert.throws(() => activeBranch(id));
  assert.throws(() => resolveBranch('auto'));
  assert.throws(() => nearestBranch({ latitude: NaN, longitude: 115 }));
});
test('snapshot stores canonical origin and ignores forged client origin fields', () => {
  const input = { branchId: 'bali', destination: { latitude: -8.68, longitude: 115.19 }, address: 'Test', courierCode: 'grab', serviceCode: 'instant', branch: { id: 'jakarta' }, origin: { latitude: 0 } };
  assert.deepEqual(deliverySnapshot(input).branch, activeBranch('bali'));
  assert.throws(() => deliverySnapshot({ ...input, branchId: 'tangerang' }));
  assert.throws(() => deliverySnapshot({ ...input, branchId: undefined }));
});
test('rate cache is separated by selected origin; inactive origin never calls provider', async () => {
  process.env.BITESHIP_TOKEN = 'biteship_test.branch-unit';
  const previous = globalThis.fetch;
  const origins: number[] = [];
  globalThis.fetch = async (_url, init) => { origins.push(JSON.parse(String(init?.body)).origin_latitude); return Response.json({ success: true, pricing: [] }); };
  const input = { destination: { latitude: -8.67, longitude: 115.2 }, items: [{ name: 'Branch UAT', value: 10000, weight: 1500, quantity: 1 }] };
  try {
    await getRates({ ...input, branchId: 'bali' });
    await getRates({ ...input, branchId: 'bali' });
    await getRates({ ...input, branchId: 'jakarta' });
    await assert.rejects(getRates({ ...input, branchId: 'tangerang' }));
    assert.deepEqual(origins, [-8.6754898, -6.1984118]);
  } finally { globalThis.fetch = previous; }
});
