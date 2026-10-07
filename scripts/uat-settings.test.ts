import test from 'node:test';
import assert from 'node:assert/strict';
import { readDiscount, applyDiscount } from '../src/lib/discounts';
import { readMedia, safeMediaUrl } from '../src/lib/settings';
import { toProduct } from '../src/data/shop';
import { readProduct } from '../src/lib/admin';
import { allProducts } from '../src/data/catalog';

test('discount validation rejects fractional, negative and excessive values', () => {
  assert.equal(readDiscount(''), 0);
  assert.equal(readDiscount('25'), 25);
  for (const value of [-1, 100, 1.5, 'NaN', Infinity]) assert.throws(() => readDiscount(value));
  assert.throws(() => readProduct({ name: 'Test', discount_percent: 100 }));
});

test('discount applies once, preserves original price and marks sale cards', () => {
  const original = { ...allProducts[0], price: 950000 };
  const item = applyDiscount(original, 25);
  assert.equal(item.price, 712500);
  assert.equal(item.compareAt, 950000);
  assert.equal(original.price, 950000);
  assert.equal(toProduct(item).state, 'sale');
  assert.equal(toProduct({ ...item, soldOut: true }).state, 'soldout');
  assert.equal(applyDiscount({ ...original, price: null }, 25).compareAt, undefined);
  assert.equal(applyDiscount(original, 0), original);
});

test('media validates slide count, URL protocols and direct video files', () => {
  const input = { heroSlides: ['/assets/test.jpg', 'https://example.com/photo.jpg'], aboutVideo: 'https://example.com/video.mp4' };
  assert.deepEqual(readMedia(input), input);
  for (const url of ['javascript:alert(1)', '//evil.example/a.jpg', '/\\evil/a.jpg', 'http://example.com/a.jpg'])
    assert.equal(safeMediaUrl(url), false);
  assert.throws(() => readMedia({ heroSlides: [] }));
  assert.throws(() => readMedia({ heroSlides: Array(11).fill('/assets/photo.jpg') }));
  assert.throws(() => readMedia({ ...input, aboutVideo: 'https://youtube.com/watch?v=test' }));
  assert.throws(() => readMedia({ ...input, heroSlides: ['javascript:alert(1)'] }));
});
