import test from 'node:test';
import assert from 'node:assert/strict';
import { readDiscount, applyDiscount } from '../src/lib/discounts';
import { readMedia, safeMediaUrl } from '../src/lib/settings';
import { toProduct } from '../src/data/shop';
import { readProduct } from '../src/lib/admin';
import { allProducts } from '../src/data/catalog';
import { chooseTilesFrom } from '../src/data/choose';

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
  assert.deepEqual(readMedia(input), { ...input, occasionCover: '/assets/scene-holding-yellow-bouquet.jpg', occasionImages: {} });
  assert.equal(readMedia({ ...input, occasionCover: '/uploads/cover.jpg' }).occasionCover, '/uploads/cover.jpg');
  assert.throws(() => readMedia({ ...input, occasionCover: 'javascript:alert(1)' }));
  for (const url of ['javascript:alert(1)', '//evil.example/a.jpg', '/\\evil/a.jpg', 'http://example.com/a.jpg'])
    assert.equal(safeMediaUrl(url), false);
  assert.throws(() => readMedia({ heroSlides: [] }));
  assert.throws(() => readMedia({ heroSlides: Array(11).fill('/assets/photo.jpg') }));
  assert.throws(() => readMedia({ ...input, aboutVideo: 'https://youtube.com/watch?v=test' }));
  assert.throws(() => readMedia({ ...input, heroSlides: ['javascript:alert(1)'] }));
});

test('occasion card photos validate separately from the landing hero', () => {
  const input = { heroSlides: ['/assets/test.jpg'], occasionImages: { birthday: '/uploads/birthday.webp' } };
  assert.deepEqual(readMedia(input).occasionImages, input.occasionImages);
  for (const value of [[], null, { birthday: 'javascript:alert(1)' }, { birthday: '/uploads/movie.mp4' }, { birthday: 42 }])
    assert.throws(() => readMedia({ ...input, occasionImages: value }));
});

test('occasion card override follows the facet value, not carousel position', () => {
  const birthday = { label: 'Birthday', value: 'birthday', count: 1 };
  const anniversary = { label: 'Anniversary', value: 'i love you', count: 2 };
  const images = { birthday: '/uploads/birthday.webp' };
  const facets = { occasions: [birthday, anniversary], categories: [birthday], flowers: [birthday], addons: [] };
  const first = chooseTilesFrom(facets, images);
  const reordered = chooseTilesFrom({ ...facets, occasions: [anniversary, birthday] }, images);
  assert.equal(first.Occasions[0].image, images.birthday);
  assert.equal(reordered.Occasions[1].image, images.birthday);
  assert.equal(first.Occasions[0].href, '/shop?occasion=birthday');
  assert.notEqual(first.Category[0].image, images.birthday);
  assert.notEqual(first.Flower[0].image, images.birthday);
});
