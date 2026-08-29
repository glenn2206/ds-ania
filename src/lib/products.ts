/**
 * products.ts — data produk LIVE dari database (dipakai halaman SSR).
 *
 * - getCatalog()        → { premiumWrapped, bloomBox, standing, vase, addons, allProducts }
 * - getProductBySlug()  → CatalogItem | null
 * - getLiveState()      → { [slug]: { price, priceNote, stock, soldOut, status } }
 *
 * Cache in-memory 60 dtk → 1 query/menit berapa pun traffic-nya.
 * DB tidak terkonfigurasi / query gagal → fallback ke snapshot (src/data/catalog.ts).
 */
import { q, isConfigured } from './db';
import {
  buildCatalog,
  toItem,
  type CatalogItem,
  type RawProduct,
  premiumWrapped as snapPremium,
  bloomBox as snapBloom,
  standing as snapStanding,
  vase as snapVase,
  addons as snapAddons,
  allProducts as snapAll,
} from '../data/catalog';

export type Catalog = ReturnType<typeof buildCatalog>;

const SNAPSHOT: Catalog = {
  premiumWrapped: snapPremium,
  bloomBox: snapBloom,
  standing: snapStanding,
  vase: snapVase,
  addons: snapAddons,
  allProducts: snapAll,
};

const TTL = 60_000;
let cache: { at: number; data: Catalog } | null = null;
let inflight: Promise<Catalog> | null = null;

interface DbProduct {
  id: number;
  slug: string;
  name: string;
  category: RawProduct['category'];
  pill: string | null;
  flowers: string | null;
  size: string | null;
  price: number | string | null;
  price_note: string | null;
  stock: number | string | null;
  description: string | null;
  occasion: string | null;
  drive: string | null;
  featured: string | null;
  sort_order: number | string | null;
  status: string;
}

function rowToRaw(p: DbProduct, images: string[], i: number): RawProduct {
  return {
    slug: p.slug,
    name: p.name,
    category: p.category,
    pill: p.pill || '',
    flowers: p.flowers || '',
    size: p.size || null,
    price: p.price == null ? null : Number(p.price),
    priceNote: p.price_note || null,
    description: p.description || '',
    occasion: p.occasion || null,
    drive: p.drive || null,
    featured: p.featured || null,
    sortOrder: p.sort_order == null ? i : Number(p.sort_order),
    images,
    stock: p.stock == null ? null : Number(p.stock),
  };
}

async function fetchCatalog(): Promise<Catalog> {
  if (!isConfigured()) return SNAPSHOT;
  try {
    const rows = (await q(
      `SELECT id, slug, name, category, pill, flowers, size, price, price_note, stock,
              description, occasion, drive, featured, sort_order, status
         FROM products WHERE status = 'published' ORDER BY sort_order, id`,
    )) as DbProduct[];
    if (!rows.length) return SNAPSHOT;

    const imgRows = await q(
      'SELECT product_id, filename FROM product_images ORDER BY product_id, position',
    );
    const byProduct = new Map<number, string[]>();
    for (const im of imgRows) {
      const pid = Number(im.product_id);
      if (!byProduct.has(pid)) byProduct.set(pid, []);
      byProduct.get(pid)!.push(im.filename);
    }

    const idBySlug = new Map(rows.map((p) => [p.slug, Number(p.id)]));
    const rawList = rows.map((p, i) => rowToRaw(p, byProduct.get(Number(p.id)) || [], i));
    // gunakan transform yang sama, tapi foto CMS disajikan dari /uploads/
    const all = rawList
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((r, i) => {
        const item = toItem(r, i, '/uploads/');
        item.id = idBySlug.get(r.slug);
        return item;
      });
    const pick = (c: CatalogItem['category']) => all.filter((x) => x.category === c);
    const premiumWrapped = pick('premium-wrapped');
    const bloomBox = pick('bloom-box');
    const standing = pick('standing');
    const vase = pick('vase');
    return {
      premiumWrapped,
      bloomBox,
      standing,
      vase,
      addons: pick('accessory'),
      allProducts: [...premiumWrapped, ...bloomBox, ...standing, ...vase],
    };
  } catch (err) {
    console.error('[products] DB query gagal, pakai snapshot:', (err as Error).message);
    return SNAPSHOT;
  }
}

export async function getCatalog(): Promise<Catalog> {
  if (cache && Date.now() - cache.at < TTL) return cache.data;
  if (inflight) return inflight;
  inflight = fetchCatalog()
    .then((data) => {
      cache = { at: Date.now(), data };
      return data;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/** buang cache (dipanggil setelah admin menyimpan perubahan) */
export function invalidateCatalog() {
  cache = null;
}

export async function getProductBySlug(slug: string): Promise<CatalogItem | null> {
  if (!slug) return null;
  const cat = await getCatalog();
  return (
    cat.allProducts.find((p) => p.slug === slug) ||
    cat.addons.find((p) => p.slug === slug) ||
    null
  );
}

export interface LiveState {
  price: number | null;
  priceNote: string | null;
  stock: number | null;
  soldOut: boolean;
  status: string;
}

/** status harga+stok live untuk overlay di halaman produk (dipakai /api/product-state) */
export async function getLiveState(slugs?: string[]): Promise<Record<string, LiveState>> {
  const out: Record<string, LiveState> = {};
  if (!isConfigured()) {
    for (const c of [...SNAPSHOT.allProducts, ...SNAPSHOT.addons]) {
      if (slugs && !slugs.includes(c.slug)) continue;
      out[c.slug] = {
        price: c.price,
        priceNote: c.priceNote ?? null,
        stock: c.stock ?? null,
        soldOut: Boolean(c.soldOut),
        status: 'published',
      };
    }
    return out;
  }
  let sql =
    "SELECT slug, price, price_note, stock, status FROM products WHERE status = 'published'";
  const params: any[] = [];
  if (slugs && slugs.length) {
    sql += ` AND slug IN (${slugs.map(() => '?').join(',')})`;
    params.push(...slugs);
  }
  const rows = await q(sql, params);
  for (const r of rows) {
    const stock = r.stock == null ? null : Number(r.stock);
    out[r.slug] = {
      price: r.price == null ? null : Number(r.price),
      priceNote: r.price_note || null,
      stock,
      soldOut: stock != null && stock <= 0,
      status: r.status,
    };
  }
  return out;
}
