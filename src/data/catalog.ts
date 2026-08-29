/**
 * catalog.ts — bentuk & transform data produk.
 *
 * DUA sumber:
 *  1. LIVE  → src/lib/products.ts (query PostgreSQL/MySQL, dipakai halaman SSR).
 *  2. SNAPSHOT → src/data/products.generated.json (di-commit). Dipakai untuk:
 *       - fallback saat DB tidak terkonfigurasi / gagal,
 *       - data yang di-bundle ke browser (src/lib/cart.ts — tampilan saja; harga
 *         final selalu dihitung ulang server-side di /api/checkout),
 *       - bagian kurasi (occasions) & halaman design-system.
 *
 * Export sinkron di bawah (`premiumWrapped`, `allProducts`, dst.) = SNAPSHOT.
 * Untuk data live pakai `getCatalog()` dari src/lib/products.ts.
 */
import raw from './products.generated.json';

export interface CatalogItem {
  /** id baris DB — hanya ada pada data live (getCatalog), undefined pada snapshot */
  id?: number;
  slug: string;
  name: string;
  category: 'premium-wrapped' | 'bloom-box' | 'standing' | 'vase' | 'accessory';
  pill: string;
  flowers: string;
  size?: string;
  price: number | null;
  priceNote?: string;
  description: string;
  occasion?: string;
  drive?: string;
  image: string;
  image2?: string;
  featured?: string;
  /** nama file foto (mentah, tanpa prefix) */
  images?: string[];
  /** URL foto siap pakai untuk galeri detail (sudah ada prefix) */
  gallery?: string[];
  /** sisa stok; undefined = tidak dilacak (selalu tersedia) */
  stock?: number;
  /** turunan: false hanya bila stock dilacak dan == 0 */
  soldOut?: boolean;
}

export interface RawProduct {
  slug: string;
  name: string;
  category: CatalogItem['category'];
  pill: string;
  flowers: string;
  size: string | null;
  price: number | null;
  priceNote: string | null;
  description: string;
  occasion: string | null;
  drive: string | null;
  featured: string | null;
  sortOrder: number;
  images: string[];
  stock?: number | null;
}

const A = (f: string) => `/assets/${f}`;
// pool foto bouquet generik (/public/assets) — untuk item yang belum punya foto asli
export const POOL = [
  'bouquet-rose-allure.jpg',
  'bouquet-rouge-elegance.jpg',
  'bouquet-vibrant-longevity.jpg',
  'bouquet-blush-amethyst.jpg',
  'bouquet-love-symphony.jpg',
  'bouquet-hello-sunshine.jpg',
  'bouquet-peach-garden-roses.jpg',
  'bouquet-pink-carnation.jpg',
  'bouquet-yellow-poms.jpg',
  'scene-red-coral-arrangement.jpg',
  'bouquet-handful-box.jpg',
  'scene-bride-pastel-bouquet.jpg',
];
export const pool = (i: number) => A(POOL[((i % POOL.length) + POOL.length) % POOL.length]);

/**
 * RawProduct → CatalogItem.
 * @param imgPrefix prefix URL untuk nama file di `r.images`.
 *   snapshot: '/assets/products/'  ·  live (upload CMS): '/uploads/'
 */
export function toItem(r: RawProduct, i: number, imgPrefix = '/assets/products/'): CatalogItem {
  const imgs = (r.images ?? []).map((f) => (f.startsWith('/') ? f : imgPrefix + f));
  const wantsSwatch = r.category === 'premium-wrapped' || r.category === 'bloom-box';

  let image2: string | undefined;
  if (imgs.length >= 2) image2 = imgs[1];
  else if (imgs.length === 1) image2 = imgs[0];
  else if (wantsSwatch) image2 = pool(i + 1);

  const stock = r.stock == null ? undefined : Number(r.stock);
  const item: CatalogItem = {
    slug: r.slug,
    name: r.name,
    category: r.category,
    pill: r.pill,
    flowers: r.flowers || '—',
    price: typeof r.price === 'number' ? r.price : null,
    description: r.description,
    image: imgs[0] ?? pool(i),
    images: r.images ?? [],
    gallery: imgs,
  };
  if (r.size) item.size = r.size;
  if (r.priceNote) item.priceNote = r.priceNote;
  if (r.occasion) item.occasion = r.occasion;
  if (r.drive) item.drive = r.drive;
  if (r.featured) item.featured = r.featured;
  if (image2) item.image2 = image2;
  if (stock !== undefined) {
    item.stock = stock;
    item.soldOut = stock <= 0;
  }
  return item;
}

export function buildCatalog(rows: RawProduct[]) {
  const all = rows
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((r, i) => toItem(r, i));
  const premiumWrapped = all.filter((c) => c.category === 'premium-wrapped');
  const bloomBox = all.filter((c) => c.category === 'bloom-box');
  const standing = all.filter((c) => c.category === 'standing');
  const vase = all.filter((c) => c.category === 'vase');
  const addons = all.filter((c) => c.category === 'accessory');
  return {
    premiumWrapped,
    bloomBox,
    standing,
    vase,
    addons,
    allProducts: [...premiumWrapped, ...bloomBox, ...standing, ...vase],
  };
}

const snapshot = buildCatalog(raw as unknown as RawProduct[]);

export const premiumWrapped: CatalogItem[] = snapshot.premiumWrapped;
export const bloomBox: CatalogItem[] = snapshot.bloomBox;
export const standing: CatalogItem[] = snapshot.standing;
export const vase: CatalogItem[] = snapshot.vase;
/** Add-on (Cute Extras) — bukan bunga; dipakai tombol "+" & cart. Tidak masuk allProducts. */
export const addons: CatalogItem[] = snapshot.addons;
export const allProducts: CatalogItem[] = snapshot.allProducts;

/* copy dari sheet "lain lain" */
export const howToOrder = [
  'Lengkapi form pemesanan dan lampirkan bukti pembayaran.',
  'Pesanan diproses setelah kami kirim konfirmasi.',
  'Pengiriman H+1 (D-1): selesaikan paling lambat pukul 14.00 sehari sebelumnya.',
  'Pesanan H+1 yang masuk setelah pukul 15.00 diproses hari berikutnya setelah pukul 14.00.',
  'Same-day: pesanan sebelum pukul 08.00 dikirim setelah pukul 14.00.',
];
