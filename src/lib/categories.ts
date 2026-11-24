/**
 * categories.ts — baca/simpan kategori CMS.
 *   site_settings.product_categories       → JSON CategoryItem[]
 *   site_settings.product_category_<id>    → slug kategori tambahan milik produk
 *
 * Kolom products.category dibatasi CHECK/ENUM ke 5 slug bawaan. Kategori tambahan disimpan
 * sebagai override per produk supaya tidak butuh migrasi / hak ALTER di hosting.
 */
import { q, tx, isConfigured, type Querier } from './db';
import { writeSetting } from './settings';
import { DEFAULT_CATEGORIES, isBuiltin, readCategories, type CategoryItem } from '../data/categories';

const KEY = 'product_categories';
const PREFIX = 'product_category_';
/** nilai kolom DB untuk produk berkategori tambahan (override yang menentukan tampilan) */
const COLUMN_FALLBACK = 'premium-wrapped';
const TTL = 60_000;
let cache: { at: number; data: CategoryItem[] } | null = null;

export class CategoryInUseError extends Error {}

export const categoryKey = (productId: number) => `${PREFIX}${productId}`;

/** nilai yang boleh ditulis ke products.category */
export const categoryColumn = (slug: string) => (isBuiltin(slug) ? slug : COLUMN_FALLBACK);

/** `fresh` (panel admin): tanpa cache, dan error DB dilempar supaya editor tidak menyimpan daftar default. */
export async function getCategories(fresh = false): Promise<CategoryItem[]> {
  if (!fresh && cache && Date.now() - cache.at < TTL) return cache.data;
  let data = DEFAULT_CATEGORIES;
  if (isConfigured()) {
    try {
      const rows = await q('SELECT svalue FROM site_settings WHERE skey = ?', [KEY]);
      if (rows.length) data = readCategories(JSON.parse(rows[0].svalue));
    } catch (error) {
      if (fresh) throw error;
      /* DB down / nilai rusak → default */
    }
  }
  cache = { at: Date.now(), data };
  return data;
}

const overridesFrom = (rows: Record<string, any>[]) =>
  new Map<number, string>(
    rows
      .filter((r) => /^product_category_\d+$/.test(r.skey))
      .map((r) => [Number(r.skey.slice(PREFIX.length)), String(r.svalue)]),
  );

const OVERRIDE_SQL = "SELECT skey, svalue FROM site_settings WHERE skey LIKE 'product_category_%'";

/** id produk → slug kategori tambahan */
export async function getCategoryOverrides(): Promise<Map<number, string>> {
  return isConfigured() ? overridesFrom(await q(OVERRIDE_SQL)) : new Map();
}

export async function saveProductCategory(t: Querier, productId: number, slug: string) {
  if (isBuiltin(slug)) await t.q('DELETE FROM site_settings WHERE skey = ?', [categoryKey(productId)]);
  else await writeSetting(t, categoryKey(productId), slug);
}

/** Simpan daftar; menolak penghapusan kategori yang masih dipakai produk. */
export async function saveCategories(list: CategoryItem[]) {
  await tx(async (t) => {
    const kept = new Set(list.map((c) => c.slug));
    const products = new Set((await t.q('SELECT id FROM products')).map((r) => Number(r.id)));
    const used = new Map<string, number>();
    for (const [id, slug] of overridesFrom(await t.q(OVERRIDE_SQL)))
      if (products.has(id)) used.set(slug, (used.get(slug) || 0) + 1);
    for (const [slug, count] of used)
      if (!kept.has(slug)) throw new CategoryInUseError(`Kategori "${slug}" masih dipakai ${count} produk. Pindahkan produknya dulu.`);
    await writeSetting(t, KEY, JSON.stringify(list));
  });
  cache = null;
}
