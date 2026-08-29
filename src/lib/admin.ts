/**
 * admin.ts — helper khusus panel admin: guard sesi + parsing form produk.
 */
import type { APIContext, APIRoute } from 'astro';
import { getSession, type Session } from './session';

export function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

/** Bungkus handler API admin: 401 JSON kalau belum login, selain itu panggil fn(ctx, session). */
export function withAdmin(fn: (ctx: APIContext, session: Session) => Promise<Response> | Response): APIRoute {
  return async (ctx) => {
    const s = getSession(ctx.cookies);
    if (!s) return jsonResponse({ error: 'unauthorized' }, 401);
    try {
      return await fn(ctx, s);
    } catch (err) {
      console.error('[admin api]', (err as Error).stack || err);
      return jsonResponse({ error: (err as Error).message || 'server error' }, 500);
    }
  };
}

export const CATEGORIES = ['premium-wrapped', 'bloom-box', 'standing', 'vase', 'accessory'] as const;
export type Category = (typeof CATEGORIES)[number];

export function slugify(s: string): string {
  return String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120);
}

export interface ProductInput {
  name: string;
  slug: string;
  category: Category;
  pill: string;
  flowers: string | null;
  size: string | null;
  price: number | null;
  price_note: string | null;
  stock: number | null;
  description: string | null;
  occasion: string | null;
  drive: string | null;
  featured: string | null;
  status: 'draft' | 'published';
}

const toIntOrNull = (v: unknown): number | null => {
  const s = String(v ?? '').replace(/[^\d-]/g, '');
  if (s === '') return null;
  const n = parseInt(s, 10);
  return Number.isFinite(n) ? n : null;
};

/** Terima objek (JSON) atau FormData → ProductInput ternormalisasi. */
export function readProduct(src: Record<string, any> | FormData): ProductInput {
  const get = (k: string): string => {
    const v = src instanceof FormData ? src.get(k) : src[k];
    return v == null ? '' : String(v).trim();
  };
  const category = CATEGORIES.includes(get('category') as Category)
    ? (get('category') as Category)
    : 'premium-wrapped';
  const price = toIntOrNull(get('price'));
  const stock = toIntOrNull(get('stock'));
  const blankNull = (k: string) => {
    const v = get(k);
    return v === '' ? null : v;
  };
  return {
    name: get('name'),
    slug: slugify(get('slug')),
    category,
    pill: get('pill'),
    flowers: blankNull('flowers'),
    size: blankNull('size'),
    price: price == null ? null : Math.max(0, price),
    price_note: blankNull('price_note'),
    stock,
    description: blankNull('description'),
    occasion: blankNull('occasion'),
    drive: blankNull('drive'),
    featured: blankNull('featured'),
    status: get('status') === 'draft' ? 'draft' : 'published',
  };
}
