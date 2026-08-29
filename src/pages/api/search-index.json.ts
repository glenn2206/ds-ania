/**
 * GET /api/search-index.json — indeks ringan untuk overlay pencarian (client-side).
 * Live dari DB (cache 60 dtk di getCatalog).
 */
import type { APIRoute } from 'astro';
import { getCatalog } from '../../lib/products';

export const prerender = false;

export const GET: APIRoute = async () => {
  const cat = await getCatalog();
  const all = [...cat.allProducts, ...cat.addons];
  const items = all.map((c) => ({
    slug: c.slug,
    name: c.name,
    pill: c.pill,
    category: c.category,
    flowers: c.flowers,
    occasion: c.occasion ?? '',
    description: c.description,
    price: typeof c.price === 'number' ? c.price : null,
    priceNote: c.priceNote ?? null,
    image: c.image,
    image2: c.image2 ?? null,
    soldOut: Boolean(c.soldOut),
    href: `/product/${c.slug}`,
  }));
  return new Response(JSON.stringify({ items }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=60' },
  });
};
