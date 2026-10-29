import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getCart, saveCart, cartCount } from '../src/lib/cart-core';
import { addItem } from '../src/lib/cart';
import { isCustomerVisibleProduct } from '../src/data/customer-visibility';
import { buildCatalog, type RawProduct } from '../src/data/catalog';

test('adding one plush doll produces one line and one item; invalid legacy lines are ignored', () => {
  const storage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  const windowProp = Object.getOwnPropertyDescriptor(globalThis, 'window');
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  } });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: new EventTarget() });
  try {
    addItem('addon-plush-doll', 1);
    assert.deepEqual(getCart(), [{ slug: 'addon-plush-doll', qty: 1 }]);
    assert.equal(cartCount(), 1);
    addItem('', 1);
    addItem('addon-plush-doll', NaN);
    assert.equal(cartCount(), 1);
    saveCart([{ slug: '', qty: 1 }, { slug: 'addon-plush-doll', qty: 1 }]);
    assert.deepEqual(getCart(), [{ slug: 'addon-plush-doll', qty: 1 }]);
    addItem('addon-plush-doll', 1);
    assert.deepEqual(getCart(), [{ slug: 'addon-plush-doll', qty: 2 }]);
  } finally {
    if (storage) Object.defineProperty(globalThis, 'localStorage', storage); else Reflect.deleteProperty(globalThis, 'localStorage');
    if (windowProp) Object.defineProperty(globalThis, 'window', windowProp); else Reflect.deleteProperty(globalThis, 'window');
  }
});

test('product-card and buybox buttons no longer share the same add selector', () => {
  const card = readFileSync(new URL('../src/components/organisms/ProductCard.astro', import.meta.url), 'utf8');
  assert.match(card, /data-product-add=\{slug\}/);
  assert.match(card, /querySelectorAll<HTMLButtonElement>\('\[data-product-add\]'\)/);
  assert.doesNotMatch(card, /querySelectorAll<HTMLButtonElement>\('\[data-add\]'\)/);
});

test('filter hover dismissal is independent of card count and ignores touch', () => {
  const shop = readFileSync(new URL('../src/components/templates/ShopSection.astro', import.meta.url), 'utf8');
  assert.match(shop, /closest\('\.shop__main'\)/);
  assert.match(shop, /event.pointerType !== 'mouse'/);
  assert.match(shop, /dismissOnMouse\(raw as PointerEvent\)/);
  assert.doesNotMatch(shop, /const overProduct =/);
});

test('only the requested florist tools are excluded from customer accessories', () => {
  for (const name of ['Plan Clipper Holder', 'Plant Clipper Holder', 'Glass Flower Dome', 'Gunting Florist FT', 'Scissors Secateurs Oasis Yellow'])
    assert.equal(isCustomerVisibleProduct({ category: 'accessory', name, slug: name.toLowerCase().replaceAll(' ', '-') }), false);
  for (const name of ['Plush Doll', 'Balloon', 'Cake', 'Chocolate'])
    assert.equal(isCustomerVisibleProduct({ category: 'accessory', name, slug: name }), true);
  assert.equal(isCustomerVisibleProduct({ category: 'vase', name: 'Glass Flower Dome', slug: 'glass-vase' }), true);
});

test('missing accessory images never fall back to unrelated flowers', () => {
  const row = { slug: 'addon-plush-doll', name: 'Plush Doll', category: 'accessory', pill: 'Add-on',
    flowers: '', size: null, price: 50000, priceNote: null, description: '', occasion: null,
    drive: null, featured: null, sortOrder: 1, images: [] } as RawProduct;
  const catalog = buildCatalog([row, { ...row, slug: 'gunting-florist', name: 'Gunting Florist' }]);
  assert.equal(catalog.addons.length, 1);
  assert.equal(catalog.addons[0].image, '/assets-svg/product-photo-unavailable.svg');
  assert.equal(buildCatalog([{ ...row, images: ['doll.webp'] }]).addons[0].image, '/assets/products/doll.webp');
});
