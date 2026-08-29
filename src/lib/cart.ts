/**
 * cart.ts — keranjang belanja client-side (localStorage). Situs tetap statik.
 * Bagian ringan (getCart/count/rupiah) ada di cart-core.ts; di sini yang butuh katalog.
 * Event global "cart:change" tiap kali berubah → dipakai badge navbar & halaman cart.
 */
import { allProducts, addons, type CatalogItem } from '../data/catalog';
import { getCart, saveCart, cartCount, rupiah, type CartLine } from './cart-core';

export { getCart, rupiah };
export type { CartLine };

/** produk yang bisa masuk keranjang = katalog + add-on */
const purchasable: CatalogItem[] = [...allProducts, ...addons];

export const findProduct = (slug: string): CatalogItem | undefined =>
  purchasable.find((p) => p.slug === slug);

export function addItem(slug: string, qty = 1) {
  const lines = getCart();
  const l = lines.find((x) => x.slug === slug);
  if (l) l.qty += qty;
  else lines.push({ slug, qty });
  saveCart(lines);
}

export function setQty(slug: string, qty: number) {
  let lines = getCart();
  if (qty <= 0) lines = lines.filter((x) => x.slug !== slug);
  else {
    const l = lines.find((x) => x.slug === slug);
    if (l) l.qty = qty;
  }
  saveCart(lines);
}

export const removeItem = (slug: string) => saveCart(getCart().filter((x) => x.slug !== slug));

export const count = cartCount;

export const unitPrice = (slug: string): number => {
  const p = findProduct(slug);
  return typeof p?.price === 'number' ? p.price : 0;
};

export const lineTotal = (l: CartLine): number => unitPrice(l.slug) * l.qty;

export const subtotal = (): number => getCart().reduce((n, l) => n + lineTotal(l), 0);

/** Isi contoh saat kunjungan pertama (belum pernah ada key) supaya cart tidak kosong. */
export function seedIfFirstVisit() {
  if (localStorage.getItem('ania:cart') !== null) return;
  saveCart([
    { slug: 'a-handful-flower-box', qty: 2 },
    { slug: 'blush-amethyst-orchestra', qty: 1 },
  ]);
}
