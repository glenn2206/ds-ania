/** PATCH /api/admin/orders/:id  { status } — ubah status order manual. */
import { one, q } from '../../../../lib/db';
import { withAdmin, jsonResponse } from '../../../../lib/admin';

export const prerender = false;

const ALLOWED = ['pending', 'paid', 'fulfilled', 'expired', 'cancelled', 'failed'];

export const PATCH = withAdmin(async ({ params, request }) => {
  const id = Number(params.id);
  const order = await one('SELECT id FROM orders WHERE id = ?', [id]);
  if (!order) return jsonResponse({ error: 'Order tidak ada' }, 404);

  const body = await request.json().catch(() => ({}));
  const status = String(body.status || '');
  if (!ALLOWED.includes(status)) return jsonResponse({ error: 'status tidak valid' }, 400);

  await q('UPDATE orders SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [status, id]);
  return jsonResponse({ ok: true, status });
});
