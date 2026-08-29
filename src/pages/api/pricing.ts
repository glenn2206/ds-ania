/**
 * POST /api/pricing — harga OTORITATIF untuk keranjang & checkout.
 * Body: { items: [{ slug, qty }] }
 * Resp: { items: [{ slug, name, image, unitPrice, qty, lineTotal, soldOut, priceNote }], subtotal, currency }
 *
 * Klien tidak pernah dipercaya soal harga — semua dihitung ulang dari DB di sini.
 */
import type { APIRoute } from 'astro';
import { getCatalog } from '../../lib/products';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid json' }, 400);
  }
  const wanted: { slug: string; qty: number }[] = Array.isArray(body?.items)
    ? body.items
        .map((x: any) => ({ slug: String(x?.slug || ''), qty: Math.max(1, Math.floor(Number(x?.qty) || 1)) }))
        .filter((x: any) => x.slug)
    : [];

  const cat = await getCatalog();
  const bySlug = new Map([...cat.allProducts, ...cat.addons].map((p) => [p.slug, p]));

  const items = wanted
    .map(({ slug, qty }) => {
      const p = bySlug.get(slug);
      if (!p) return null;
      const unitPrice = typeof p.price === 'number' ? p.price : 0;
      return {
        slug,
        name: p.name,
        image: p.image,
        unitPrice,
        qty,
        lineTotal: unitPrice * qty,
        soldOut: Boolean(p.soldOut),
        priceNote: p.priceNote ?? null,
      };
    })
    .filter(Boolean) as any[];

  const subtotal = items.reduce((n, l) => n + l.lineTotal, 0);
  return json({ items, subtotal, currency: 'IDR' });
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}
