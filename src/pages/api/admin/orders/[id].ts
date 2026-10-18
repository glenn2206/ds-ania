/** PATCH /api/admin/orders/:id  { status } — ubah status order manual. */
import { tx } from '../../../../lib/db';
import { withAdmin, jsonResponse } from '../../../../lib/admin';
import { orderStatuses } from '../../../../lib/order-status';

export const prerender = false;

const ALLOWED: readonly string[] = orderStatuses;

export const PATCH = withAdmin(async ({ params, request }) => {
  const id = Number(params.id);

  const body = await request.json().catch(() => ({}));
  const status = String(body.status || '');
  if (!ALLOWED.includes(status)) return jsonResponse({ error: 'status tidak valid' }, 400);

  return tx(async t => {
    const [order] = await t.q('SELECT id, status FROM orders WHERE id=? FOR UPDATE', [id]);
    if (!order) return jsonResponse({ error: 'Order tidak ada' }, 404);
    const refunds = await t.q('SELECT id FROM order_refunds WHERE order_id=?', [id]);
    if (order.status === 'refunded' || refunds.length) return jsonResponse({ error: 'Order memiliki proses refund. Gunakan sinkronisasi refund; status tidak boleh ditimpa manual.' }, 409);
    if (status === 'refund_requested' && !['paid', 'fulfilled', 'refund_requested'].includes(order.status))
      return jsonResponse({ error: 'Refund hanya dapat diminta untuk order yang sudah lunas.' }, 409);
    const [shipment] = await t.q('SELECT state FROM order_shipments WHERE order_id=?', [id]);
    if (shipment && ['creating', 'review', 'booked'].includes(shipment.state) && status !== 'fulfilled')
      return jsonResponse({ error: 'Booking kurir sudah diproses. Rekonsiliasi/pembatalan kurir melalui Biteship dahulu; mengganti status bukan pembatalan atau refund.' }, 409);
    await t.q('UPDATE orders SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [status, id]);
    return jsonResponse({ ok: true, status });
  });
});
