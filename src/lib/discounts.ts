import { q, isConfigured, type Querier } from './db';
import { writeSetting } from './settings';
import type { CatalogItem } from '../data/catalog';

export function readDiscount(value: unknown): number {
  if (value == null || value === '') return 0;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 99) throw new Error('Diskon harus bilangan bulat 0-99%.');
  return n;
}

export async function getDiscounts(): Promise<Map<number, number>> {
  if (!isConfigured()) return new Map();
  const rows = await q("SELECT skey, svalue FROM site_settings WHERE skey LIKE 'product_discount_%'");
  const discounts = new Map<number, number>();
  for (const row of rows) {
    try { discounts.set(Number(row.skey.slice('product_discount_'.length)), readDiscount(row.svalue)); }
    catch { /* Ignore invalid legacy values without hiding the catalog. */ }
  }
  return discounts;
}

export async function saveDiscount(t: Querier, id: number, percent: number) {
  await writeSetting(t, `product_discount_${id}`, String(percent));
}

export function applyDiscount(item: CatalogItem, percent: number): CatalogItem {
  if (!percent || item.price == null || item.price <= 0) return item;
  return { ...item, compareAt: item.price, discountPercent: percent, price: Math.round(item.price * (100 - percent) / 100) };
}
