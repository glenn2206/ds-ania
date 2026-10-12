import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readImageAltInputs } from '../src/lib/image-alt';
import { toItem, type RawProduct } from '../src/data/catalog';
import { toProduct } from '../src/data/shop';

test('photo descriptions validate IDs, length and normalize whitespace', () => {
  assert.deepEqual(readImageAltInputs([{ id: 1, alt: '  Pink roses\n with ribbon  ' }]), [{ id: 1, alt: 'Pink roses with ribbon' }]);
  for (const invalid of [null, {}, [{ id: -1, alt: 'x' }], [{ id: 1, alt: 3 }], [{ id: 1, alt: 'x'.repeat(301) }], [{ id: 1, alt: 'a' }, { id: 1, alt: 'b' }]]) {
    assert.throws(() => readImageAltInputs(invalid));
  }
});
test('gallery and cards use each photo description or product-name fallback', () => {
  const raw: RawProduct = { slug: 'test', name: 'Flower Box', category: 'bloom-box', pill: '', flowers: '', size: null, price: 1000, priceNote: null, description: '', occasion: null, drive: null, featured: null, sortOrder: 0, images: ['one.jpg', 'two.jpg'], imageAlts: ['Pink roses in a box', ''] };
  const item = toItem(raw, 0);
  assert.deepEqual(item.imageAlts, ['Pink roses in a box', 'Flower Box']);
  assert.equal(toProduct(item).imageAlt, 'Pink roses in a box');
  assert.equal(toItem({ ...raw, imageAlts: undefined }, 0).imageAlt, 'Flower Box');
});
