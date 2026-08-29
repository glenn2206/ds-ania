/**
 * GET  /api/shipping?q=<teks>            → { areas: [{id,name,postal_code}] }   (autocomplete)
 * POST /api/shipping  { destAreaId?|destPostal?, items:[{slug,qty}] }
 *                                        → { options:[{courier,service,price,etd}], estimated }
 *
 * Token Biteship dipakai HANYA di sini (server). Berat/nilai barang dihitung dari DB.
 */
import type { APIRoute } from 'astro';
import { searchAreas, getRates } from '../../lib/biteship';
import { getCatalog } from '../../lib/products';

export const prerender = false;

const DEFAULT_WEIGHT = 1500; // gram / bouquet

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export const GET: APIRoute = async ({ url }) => {
  const q = url.searchParams.get('q') || '';
  return json({ areas: await searchAreas(q) });
};

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => ({}));
  const destAreaId: string | undefined = body.destAreaId || undefined;
  const destPostal: number | undefined = body.destPostal ? Number(body.destPostal) : undefined;
  if (!destAreaId && !destPostal) return json({ error: 'destinasi kosong' }, 400);

  const wanted: { slug: string; qty: number }[] = Array.isArray(body.items) ? body.items : [];
  const cat = await getCatalog();
  const bySlug = new Map([...cat.allProducts, ...cat.addons].map((p) => [p.slug, p]));

  const items = wanted.length
    ? wanted.map((it) => {
        const p = bySlug.get(String(it.slug));
        const qty = Math.max(1, Math.floor(Number(it.qty) || 1));
        return {
          name: p?.name || String(it.slug || 'item'),
          value: typeof p?.price === 'number' ? p!.price : 300000,
          weight: DEFAULT_WEIGHT,
          quantity: qty,
        };
      })
    : [{ name: 'bouquet', value: 300000, weight: DEFAULT_WEIGHT, quantity: 1 }];

  const res = await getRates({ destAreaId, destPostal, items });
  return json(res);
};
