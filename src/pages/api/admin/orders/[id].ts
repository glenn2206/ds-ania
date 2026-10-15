/** PATCH /api/admin/orders/:id  { status } — ubah status order manual. */
import { tx } from '../../../../lib/db';
import { withAdmin, jsonResponse } from '../../../../lib/admin';

export const prerender = false;

const ALLOWED = ['pending', 'paid', 'fulfilled', 'expired', 'cancelled', 'failed'];

export const PATCH = withAdmin(async ({ params, request }) => {
  const id = Number(params.id);

  const body = await request.json().catch(() => ({}));
  const status = String(body.status || '');
  if (!ALLOWED.includes(status)) return jsonResponse({ error: 'status tidak valid' }, 400);

  return tx(async t => {
    const [order] = await t.q('SELECT id FROM orders WHERE id=? FOR UPDATE', [id]);
    if (!order) return jsonResponse({ error: 'Order tidak ada' }, 404);
    const [shipment] = await t.q('SELECT state FROM order_shipments WHERE order_id=?', [id]);
    if (shipment && ['creating', 'review', 'booked'].includes(shipment.state) && status !== 'fulfilled')
      return jsonResponse({ error: 'Booking kurir sudah diproses. Rekonsiliasi/pembatalan kurir melalui Biteship dahulu; mengganti status bukan pembatalan atau refund.' }, 409);
    await t.q('UPDATE orders SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [status, id]);
    return jsonResponse({ ok: true, status });
  });
});
