import type { APIRoute } from 'astro';
import { searchAddresses } from '../../lib/address-search';
import { allowShippingRequest } from '../../lib/shipping-cache';

export const prerender = false;
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});
export const POST: APIRoute = async ({ request, clientAddress }) => {
  if (!allowShippingRequest(`geocode:${clientAddress}`, 8)) return json({ error: 'Too many address searches. Please wait a minute.' }, 429);
  if (Number(request.headers.get('content-length')) > 2048) return json({ error: 'Invalid search.' }, 400);
  const body = await request.json().catch(() => null);
  if (!body || typeof body.q !== 'string' || body.q.trim().length < 4 || body.q.length > 160)
    return json({ error: 'Enter a street or place and city (4-160 characters).' }, 400);
  try { return json({ matches: await searchAddresses(body.q) }); }
  catch { return json({ error: 'Address search unavailable. Try again later or choose a pin manually.' }, 503); }
};
