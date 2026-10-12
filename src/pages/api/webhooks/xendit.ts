/**
 * POST /api/webhooks/xendit — callback invoice Xendit.
 * Header `x-callback-token` harus == XENDIT_WEBHOOK_TOKEN.
 * PAID    → order 'paid' + paid_at + potong stok (idempoten: hanya dari 'pending').
 * EXPIRED → order 'expired' (dari 'pending').
 *
 * Daftarkan URL ini di Xendit Dashboard → Settings → Webhooks → Invoices.
 */
import type { APIRoute } from 'astro';
import { tx } from '../../../lib/db';
import { verifyCallbackToken } from '../../../lib/xendit';
import { invalidateCatalog } from '../../../lib/products';

export const prerender = false;

const ok = (d: unknown = { ok: true }) =>
  new Response(JSON.stringify(d), { headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request }) => {
  if (!verifyCallbackToken(request.headers.get('x-callback-token')))
    return new Response(JSON.stringify({ error: 'bad token' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

  const body = await request.json().catch(() => null);
  if (!body) return new Response(JSON.stringify({ error: 'invalid json' }), { status: 400 });

  const externalId: string = body.external_id || '';
  const status: string = String(body.status || '').toUpperCase();
  if (!externalId) return ok({ ignored: 'no external_id' });

  const result = await tx(async (t) => {
    // Serialize callbacks for the same order before checking status or deducting stock.
    const [order] = await t.q('SELECT id, status FROM orders WHERE code = ? FOR UPDATE', [externalId]);
    if (!order) return { ignored: 'unknown order' };
    if (order.status !== 'pending') return { ignored: `already ${order.status}` };

    if (status === 'PAID' || status === 'SETTLED') {
      await t.q(
        "UPDATE orders SET status='paid', paid_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending'",
        [order.id],
      );
      const items = await t.q('SELECT product_id, qty FROM order_items WHERE order_id = ?', [order.id]);
      for (const it of items) {
        if (it.product_id == null) continue;
        // hanya kurangi kalau stok dilacak (bukan NULL)
        await t.q('UPDATE products SET stock = stock - ? WHERE id = ? AND stock IS NOT NULL', [
          Number(it.qty),
          it.product_id,
        ]);
      }
      return { applied: 'paid' };
    }

    if (status === 'EXPIRED') {
      await t.q("UPDATE orders SET status='expired', updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='pending'", [order.id]);
      return { applied: 'expired' };
    }

    return { ignored: status };
  });
  if (result.applied === 'paid') invalidateCatalog();
  return ok(result);
};
