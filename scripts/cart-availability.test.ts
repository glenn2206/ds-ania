import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { POST as pricing } from '../src/pages/api/pricing';
import { POST as shipping } from '../src/pages/api/shipping';
import { getCatalog } from '../src/lib/products';

test('pricing excludes stale lines without hiding valid products in a mixed cart', async () => {
  const catalog = await getCatalog();
  const product = catalog.allProducts.find(item => typeof item.price === 'number' && item.price > 0)!;
  assert.ok(product);
  const missing = 'nonexistent-cart-regression-product';
  const response = await pricing({ request: new Request('http://localhost/api/pricing', {
    method: 'POST', body: JSON.stringify({ items: [{ slug: product.slug, qty: 1 }, { slug: missing, qty: 1 }] }),
  }) } as any);
  assert.equal(response.status, 200);
  const data = await response.json();
  assert.deepEqual(data.items.map((item: any) => item.slug), [product.slug]);
  assert.equal(data.subtotal, product.price);
});

test('paused shipping rejects even a stale cart before any provider request', async () => {
  const response = await shipping({ clientAddress: 'cart-regression-local', request: new Request('http://localhost/api/shipping', {
    method: 'POST', body: JSON.stringify({ destination: { latitude: -6.28, longitude: 106.62 }, items: [{ slug: 'nonexistent-cart-regression-product', qty: 1 }] }),
  }) } as any);
  assert.equal(response.status, 503);
  assert.match((await response.json()).error, /Checkout sedang dinonaktifkan/);
  const source = await readFile('src/pages/api/shipping.ts', 'utf8');
  assert.ok(source.indexOf("error: 'Product unavailable.'") < source.indexOf('json(await getRates'));
});

test('cart has no auto-seeding, renders unknown lines and gates delivery on live pricing', async () => {
  const source = await readFile('src/components/templates/CartSection.astro', 'utf8');
  const cart = await readFile('src/lib/cart.ts', 'utf8');
  assert.ok(!source.includes('seedIfFirstVisit'));
  assert.ok(!cart.includes('seedIfFirstVisit'));
  assert.ok(!source.includes('if (!p) return;'));
  assert.ok(source.includes("p?.name || l.slug"));
  const rates = source.slice(source.indexOf('const loadRates'), source.indexOf("checkDelivery.addEventListener"));
  assert.ok(rates.indexOf('await refreshPrices()') < rates.indexOf('await getRates('));
  assert.ok(rates.indexOf('if (unavailableLines().length)') < rates.indexOf('await getRates('));
  assert.ok(source.includes('checkoutBtn.disabled = !checkoutEnabled || missing'));
});
