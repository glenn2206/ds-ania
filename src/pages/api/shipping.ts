/**
 * GET  /api/shipping?q=<teks>            → { areas: [{id,name,postal_code}] }   (autocomplete)
 * POST /api/shipping  { destination:{latitude,longitude}, items:[{slug,qty}] }
 *                                        → { options:[{courier,service,price,etd}], estimated }
 *
 * Token Biteship dipakai HANYA di sini (server). Berat/nilai barang dihitung dari DB.
 */
import type { APIRoute } from 'astro';
import { searchAreas, getRates, coordinates, ShippingError } from '../../lib/biteship';
import { allowShippingRequest } from '../../lib/shipping-cache';
import { getCatalog } from '../../lib/products';
import { getCheckoutEnabled } from '../../lib/settings';

export const prerender = false;

const DEFAULT_WEIGHT = 1500; // gram / bouquet

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

export const GET: APIRoute = async ({ url, clientAddress }) => {
  if (!allowShippingRequest(`search:${clientAddress}`)) return json({ error: 'Too many searches. Please wait a minute.' }, 429);
  const q = url.searchParams.get('q') || '';
  try { return json({ areas: await searchAreas(q) }); }
  catch (error) { return json({ error: error instanceof Error ? error.message : 'Address search unavailable.' }, error instanceof ShippingError ? error.status : 503); }
};

export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!await getCheckoutEnabled()) return json({ error: 'Checkout sedang dinonaktifkan. Hubungi ANIA melalui WhatsApp.' }, 503);
  if (!allowShippingRequest(`rates:${clientAddress}`, 12)) return json({ error: 'Too many delivery checks. Please wait a minute.' }, 429);
  const body = await request.json().catch(() => ({}));
  if (!body || typeof body !== 'object') return json({ error: 'Invalid request.' }, 400);
  if (!coordinates(body.destination)) return json({ error: 'Choose a delivery pin first.' }, 400);

  const wanted: { slug: string; qty: number }[] = Array.isArray(body.items) ? body.items : [];
  if (!wanted.length || wanted.length > 50 || wanted.some(it => !it || !Number.isInteger(it.qty) || it.qty < 1 || it.qty > 100))
    return json({ error: 'Invalid delivery items.' }, 400);
  const cat = await getCatalog();
  const bySlug = new Map([...cat.allProducts, ...cat.addons].map((p) => [p.slug, p]));
  if (wanted.some(it => !bySlug.has(it.slug))) return json({ error: 'Product unavailable.' }, 400);

  if (wanted.some(it => typeof bySlug.get(it.slug)?.price !== 'number' || Number(bySlug.get(it.slug)?.price) <= 0))
    return json({ error: 'Please contact ANIA for products priced by request.' }, 400);
  const items = wanted.map(it => ({ name: it.slug, value: Number(bySlug.get(it.slug)!.price), weight: DEFAULT_WEIGHT, quantity: it.qty }));

  try { return json(await getRates({ destination: body.destination, items })); }
  catch (error) { return json({ error: error instanceof Error ? error.message : 'Delivery unavailable.' }, error instanceof ShippingError ? error.status : 503); }
};
