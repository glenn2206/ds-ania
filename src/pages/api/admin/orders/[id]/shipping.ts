import { withAdmin, jsonResponse } from '../../../../../lib/admin';
import { orderShipping, OrderShippingError } from '../../../../../lib/order-shipping';
import { ShippingError, BookingError } from '../../../../../lib/biteship';
import { env } from '../../../../../lib/env';

export const prerender = false;
export const POST = withAdmin(async ({ params, request }, session) => {
  const allowedOrigins = new Set([new URL(request.url).origin]);
  // cPanel may terminate HTTPS before forwarding to the Node app over HTTP.
  try { allowedOrigins.add(new URL(env('PUBLIC_SITE_URL')).origin); } catch {}
  if (!allowedOrigins.has(request.headers.get('origin') || '')) return jsonResponse({ error: 'Origin tidak valid.' }, 403);
  const id = Number(params.id);
  if (!Number.isSafeInteger(id) || id <= 0) return jsonResponse({ error: 'ID tidak valid.' }, 400);
  const body = await request.json().catch(() => null);
  try {
    if (body?.action === 'quote') return jsonResponse(await orderShipping.quote(id, { name: body.name, phone: body.phone }));
    if (body?.action === 'book' && body.confirmed === true) return jsonResponse(await orderShipping.book(id, body.token, session.uname));
    if (body?.action === 'sync') return jsonResponse(await orderShipping.sync(id, String(body.providerId || '')));
    return jsonResponse({ error: 'Tindakan tidak valid.' }, 400);
  } catch (error) {
    if (error instanceof OrderShippingError || error instanceof ShippingError) return jsonResponse({ error: error.message }, error.status);
    if (error instanceof BookingError) return jsonResponse({ error: error.message }, 503);
    console.error('[shipping admin] Unable to complete operation');
    return jsonResponse({ error: 'Tidak dapat menyimpan hasil. Periksa dashboard Biteship sebelum mencoba lagi.' }, 503);
  }
});
