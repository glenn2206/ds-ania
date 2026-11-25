import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_CATEGORIES, readCategories, sortByCategory } from '../src/data/categories';
import { readHashtags } from '../src/data/hashtags';
import { panPhoto, photoStyle, readPhotoFit, readPhotoFits, DEFAULT_FIT } from '../src/data/photo-fit';
import { savePhotoFit } from '../src/lib/product-meta';
import { categoryColumn } from '../src/lib/categories';
import { buildFacets } from '../src/lib/facets';
import { chooseTilesFrom } from '../src/data/choose';
import { readProduct } from '../src/lib/admin';
import { readMedia } from '../src/lib/settings';
import { allProducts } from '../src/data/catalog';

const extra = { slug: 'wedding', label: 'Wedding', visible: true };

test('categories keep built-ins, allow extras and reject bad rows', () => {
  assert.deepEqual(readCategories([...DEFAULT_CATEGORIES, extra]).at(-1), extra);
  assert.throws(() => readCategories(DEFAULT_CATEGORIES.filter((c) => c.slug !== 'vase')), /tidak bisa dihapus/);
  assert.throws(() => readCategories([...DEFAULT_CATEGORIES, { ...extra, slug: 'vase' }]));
  assert.throws(() => readCategories([...DEFAULT_CATEGORIES, { ...extra, label: 'vase arrangement' }]));
  for (const bad of [{ slug: '', label: 'X' }, { slug: 'A B', label: 'X' }, { slug: 'x', label: '' }, null])
    assert.throws(() => readCategories([...DEFAULT_CATEGORIES, bad]));
  const hidden = readCategories(DEFAULT_CATEGORIES.map((c) => ({ ...c, visible: false })));
  assert.equal(hidden.find((c) => c.slug === 'accessory')!.visible, true);
  assert.equal(hidden.find((c) => c.slug === 'vase')!.visible, false);
});

test('extra categories never reach the constrained DB column', () => {
  assert.equal(categoryColumn('vase'), 'vase');
  assert.equal(categoryColumn('wedding'), 'premium-wrapped');
});

test('facets follow CMS order, labels and visibility', () => {
  const items = [{ ...allProducts[0], category: 'wedding' }, { ...allProducts[0], category: 'vase' }];
  const list = [extra, ...DEFAULT_CATEGORIES.map((c) => (c.slug === 'vase' ? { ...c, label: 'Vas' } : c))];
  assert.deepEqual(buildFacets(items, list).categories.map((c) => c.label), ['Wedding', 'Vas']);
  assert.deepEqual(buildFacets(items, list.map((c) => ({ ...c, visible: c.slug !== 'wedding' }))).categories.map((c) => c.value), ['vase']);
});

test('shop default order groups by CMS category and keeps product order inside', () => {
  const items = [['a', 'vase'], ['b', 'premium-wrapped'], ['c', 'vase'], ['d', 'gone'], ['e', 'premium-wrapped']].map(([id, category]) => ({ id, category }));
  assert.equal(sortByCategory(items, DEFAULT_CATEGORIES).map((i) => i.id).join(''), 'beacd');
  assert.equal(sortByCategory(items, [...DEFAULT_CATEGORIES].reverse()).map((i) => i.id).join(''), 'acbed');
});

test('category tile uses its CMS photo and falls back to the default', () => {
  const list = readCategories(DEFAULT_CATEGORIES.map((c) => (c.slug === 'vase' ? { ...c, image: '/uploads/site-hero-1.jpg' } : c)));
  const items = ['vase', 'standing'].map((category) => ({ ...allProducts[0], category }));
  const tiles = chooseTilesFrom(buildFacets(items, list)).Category;
  assert.equal(tiles.find((t) => t.href.endsWith('cat=vase'))!.image, '/uploads/site-hero-1.jpg');
  assert.match(tiles.find((t) => t.href.endsWith('cat=standing'))!.image, /^\/assets\//);
  for (const image of ['javascript:alert(1)', 'https://x.test/a.jpg', '/uploads/../a.jpg', '/uploads/a.svg', '/uploads/a.jpg);x'])
    assert.throws(() => readCategories(DEFAULT_CATEGORIES.map((c) => ({ ...c, image }))));
});

test('product input validates category against the CMS list', () => {
  assert.equal(readProduct({ name: 'A' }).category, 'premium-wrapped');
  assert.equal(readProduct({ name: 'A', category: 'wedding' }, ['wedding']).category, 'wedding');
  assert.throws(() => readProduct({ name: 'A', category: 'wedding' }));
});

test('hashtags normalise, dedupe and limit', () => {
  assert.deepEqual(readHashtags('#Birthday, romantic  #birthday;#Pastel-Pink <b>'), ['#Birthday', '#romantic', '#PastelPink', '#b']);
  assert.deepEqual(readHashtags(''), []);
  assert.throws(() => readHashtags(Array.from({ length: 16 }, (_, i) => `t${i}`).join(' ')));
});

test('photo fit rejects out-of-range values and renders only when changed', () => {
  const square = { x: 20, y: 80, zoom: 1.5, fit: 'cover' as const };
  assert.equal(photoStyle({ shop: DEFAULT_FIT }, 'shop'), undefined);
  // tiap layout berdiri sendiri
  assert.match(photoStyle({ square }, 'square')!, /object-position:20% 80%;scale:1.5/);
  assert.equal(photoStyle({ square }, 'shop'), undefined);
  assert.deepEqual(readPhotoFits({ square, shop: DEFAULT_FIT, other: 'x' }), { square });
  assert.throws(() => readPhotoFits({ square: { ...square, zoom: 9 } }));
  for (const bad of [{ ...DEFAULT_FIT, x: 101 }, { ...DEFAULT_FIT, zoom: 0.5 }, { ...DEFAULT_FIT, fit: 'x;color:red' }, { ...DEFAULT_FIT, y: '1' }, null])
    assert.throws(() => readPhotoFit(bad));
  for (const bad of [null, [], 'x']) assert.throws(() => readPhotoFits(bad));
});

test('dragging follows the cursor and never changes zoom', () => {
  const natural = { width: 800, height: 1200 };
  const square = { width: 380, height: 380 };
  // foto tegak di bingkai persegi: hanya atas-bawah yang punya ruang (190px)
  assert.deepEqual(panPhoto(DEFAULT_FIT, 40, 19, square, natural), { ...DEFAULT_FIT, y: 40 });
  assert.deepEqual(panPhoto(DEFAULT_FIT, 0, 9999, square, natural), { ...DEFAULT_FIT, y: 0 });
  for (const zoom of [1, 1.3, 2.5])
    for (const [dx, dy] of [[500, 500], [-30, 10], [0, -900]])
      for (const box of [square, { width: 300, height: 380 }, { width: 253.4, height: 380 }]) {
        const out = panPhoto({ ...DEFAULT_FIT, zoom }, dx, dy, box, natural);
        assert.equal(out.zoom, zoom);
        assert.deepEqual(readPhotoFit(out), out);
      }
  // setelah diperbesar manual, kiri-kanan ikut bisa digeser sejauh kursor
  const zoomed = panPhoto({ ...DEFAULT_FIT, zoom: 2 }, 38, 0, square, natural);
  assert.equal(zoomed.x, 40);
  // rasio sama dengan bingkai: pas, tidak bisa digeser
  assert.deepEqual(panPhoto(DEFAULT_FIT, 50, 50, { width: 200, height: 300 }, natural), DEFAULT_FIT);
  assert.deepEqual(panPhoto(DEFAULT_FIT, 10, 10, square, { width: 0, height: 0 }), DEFAULT_FIT);
});

test('occasion card positions validate, reach the tile and stay off other cards', () => {
  const base = { heroSlides: ['/assets/a.jpg'] };
  const fit = { x: 10, y: 20, zoom: 1.5, fit: 'cover' as const };
  assert.deepEqual(readMedia({ ...base, occasionFits: { birthday: fit, graduation: DEFAULT_FIT } }).occasionFits, { birthday: fit });
  assert.equal('occasionFits' in readMedia(base), false);
  for (const bad of [null, [], { birthday: { ...fit, zoom: 9 } }, { '': fit }]) assert.throws(() => readMedia({ ...base, occasionFits: bad }));
  const tiles = chooseTilesFrom(buildFacets([{ ...allProducts[0], occasion: 'Happy Birthday, Happy Graduation' }]), {}, { birthday: fit }).Occasions;
  assert.deepEqual(tiles.find((t) => t.label === 'Birthday')!.fit, fit);
  assert.equal(tiles.find((t) => t.label === 'Graduation')!.fit, undefined);
});

test('saving one photo keeps the other photos and clears on reset', async () => {
  const db = new Map<string, string>();
  const t: any = { q: async (sql: string, [key, value]: string[]) => {
    if (sql.startsWith('SELECT')) return db.has(key) ? [{ svalue: db.get(key) }] : [];
    if (sql.startsWith('DELETE')) db.delete(key); else db.set(key, value);
    return [];
  } };
  const square = { x: 1, y: 2, zoom: 2, fit: 'cover' as const };
  await savePhotoFit(t, 9, 1, { square });
  await savePhotoFit(t, 9, 2, { shop: square });
  assert.deepEqual(JSON.parse(db.get('photo_fit_9')!), { 1: { square }, 2: { shop: square } });
  await savePhotoFit(t, 9, 1, {});
  assert.deepEqual(JSON.parse(db.get('photo_fit_9')!), { 2: { shop: square } });
  await savePhotoFit(t, 9, 2, {});
  assert.equal(db.size, 0);
});
