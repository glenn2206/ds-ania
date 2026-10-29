import test from 'node:test';
import assert from 'node:assert/strict';
import { deliveryToday, isInstantService } from '../src/lib/delivery-policy';
import { deliverySnapshot } from '../src/lib/order-shipping';
import { toHomeAddons } from '../src/data/home';
import { addons } from '../src/data/catalog';

test('delivery only permits exact Grab/Gojek Instant service codes', () => {
  assert.equal(isInstantService('grab', 'instant'), true);
  assert.equal(isInstantService('gojek', 'instant'), true);
  for (const [courier, service] of [['grab', 'same_day'], ['gojek', 'regular'], ['jne', 'instant'], ['grab', 'Instant'], ['grab', ''], [null, null]])
    assert.equal(isInstantService(courier, service), false);
});

test('delivery date uses Jakarta today, including around midnight', () => {
  assert.equal(deliveryToday(new Date('2026-10-28T16:59:59Z')), '2026-10-28');
  assert.equal(deliveryToday(new Date('2026-10-28T17:00:00Z')), '2026-10-29');
  assert.equal(deliveryToday(new Date('2026-12-31T17:00:00Z')), '2027-01-01');
});

test('shipment snapshots reject non-Instant delivery', () => {
  const input = { destination: { latitude: -6.28, longitude: 106.61 }, address: 'Test', courierCode: 'grab', serviceCode: 'instant' };
  assert.equal(deliverySnapshot(input).service, 'instant');
  assert.throws(() => deliverySnapshot({ ...input, serviceCode: 'same_day' }));
  assert.throws(() => deliverySnapshot({ ...input, courierCode: 'jne' }));
});

test('homepage add-on photo, name, price and link use the same live product', () => {
  const live = addons.map(item => ({ ...item, image: `/uploads/${item.slug}.webp`, name: `CMS ${item.name}`, price: 123000 }));
  const cards = toHomeAddons(live);
  assert.equal(cards.length, 3);
  for (const card of cards) {
    const product = live.find(item => item.slug === card.slug)!;
    assert.equal(card.image, product.image);
    assert.equal(card.title, product.name);
    assert.equal(card.price, 'Rp 123,000');
  }
  assert.equal(toHomeAddons(live.filter(item => item.slug !== 'addon-plush-doll')).some(card => card.slug === 'addon-plush-doll'), false);
  assert.deepEqual(toHomeAddons([]), []);
});
