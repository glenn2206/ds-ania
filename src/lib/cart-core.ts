/**
 * cart-core.ts — akses keranjang TANPA import katalog (bundle ringan utk navbar).
 */
const KEY = 'ania:cart';

export interface CartLine {
  slug: string;
  qty: number;
}

export function getCart(): CartLine[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (!Array.isArray(v)) return [];
    const lines = new Map<string, CartLine>();
    for (const line of v) {
      if (!line || typeof line.slug !== 'string' || !line.slug.trim() ||
          !Number.isSafeInteger(line.qty) || line.qty < 1) continue;
      const qty = (lines.get(line.slug)?.qty ?? 0) + line.qty;
      if (Number.isSafeInteger(qty)) lines.set(line.slug, { slug: line.slug, qty });
    }
    return [...lines.values()];
  } catch {
    return [];
  }
}

export function saveCart(lines: CartLine[]) {
  localStorage.setItem(KEY, JSON.stringify(lines));
  window.dispatchEvent(new CustomEvent('cart:change', { detail: lines }));
}

export const cartCount = (): number => getCart().reduce((n, l) => n + l.qty, 0);

export const rupiah = (n: number) => 'Rp ' + Math.round(n).toLocaleString('en-US');

export { KEY as CART_KEY };
