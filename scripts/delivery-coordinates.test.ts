import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { parseDeliveryCoordinates } from '../src/lib/delivery-coordinates';
import { checkoutBranches } from '../src/data/checkout-branches';

test('coordinates accept Jakarta and Bali pins without requiring Enter', () => {
  assert.deepEqual(parseDeliveryCoordinates(' -6.2749375, 106.6091875 '), { latitude: -6.2749375, longitude: 106.6091875 });
  assert.deepEqual(parseDeliveryCoordinates('-8.65,115.2167'), { latitude: -8.65, longitude: 115.2167 });
  assert.deepEqual(parseDeliveryCoordinates('0, 0'), { latitude: 0, longitude: 0 });
});

test('mock branches stay local and cannot quote or checkout', async () => {
  assert.deepEqual(checkoutBranches.filter(branch => branch.preview).map(branch => branch.id), ['jakarta-demo', 'bali-demo']);
  const fields = await readFile('src/components/organisms/DeliveryFields.astro', 'utf8');
  const cart = await readFile('src/components/templates/CartSection.astro', 'utf8');
  assert.match(fields, /cart && import\.meta\.env\.DEV/);
  assert.match(cart, /if \(previewBranch\(\)\) return;/);
  assert.match(cart, /checkoutBtn\.disabled = missing \|\| previewBranch\(\)/);
  assert.match(cart, /checkDelivery\.disabled = previewBranch\(\)/);
});

test('invalid or incomplete coordinates are rejected', () => {
  for (const text of ['', '-6.2', '-6.2,', '-91,106', '-8,181', 'NaN,106', '-8,115extra', 'Infinity,0'])
    assert.equal(parseDeliveryCoordinates(text), undefined, text);
});

test('address precedes pin, product does not request rates, typed pin uses input events', async () => {
  const fields = await readFile('src/components/organisms/DeliveryFields.astro', 'utf8');
  const buybox = await readFile('src/components/organisms/BuyBox.astro', 'utf8');
  const picker = await readFile('src/lib/delivery-pin.ts', 'utf8');
  assert.ok(fields.indexOf('data-sendto-row') < fields.indexOf('data-pin-picker'));
  assert.match(fields, /\{cart && <>/);
  assert.ok(!buybox.includes('/api/shipping'));
  assert.ok(!buybox.includes('getRates'));
  assert.match(picker, /coordinateInput\.addEventListener\('input'/);
  assert.match(picker, /confirm\.disabled = false/);
  assert.match(picker, /onChange\(\{\}\)/);
  assert.match(picker, /animate: false/);
});
