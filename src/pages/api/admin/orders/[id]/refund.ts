import { withAdmin, jsonResponse } from '../../../../../lib/admin';
import { createOrderRefund, syncOrderRefund } from '../../../../../lib/order-refund';
export const prerender = false;
export const POST = withAdmin(async ({ params, request }) => {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) return jsonResponse({ error: 'Order tidak valid.' }, 400);
  const body = await request.json().catch(() => ({}));
  if (body.action !== 'sync' && body.action !== 'create') return jsonResponse({ error: 'Aksi tidak valid.' }, 400);
  try {
    const status = body.action === 'sync' ? await syncOrderRefund(id) : await createOrderRefund(id, String(body.confirmation || ''));
    return jsonResponse({ ok: true, status });
  } catch (error) { return jsonResponse({ error: error instanceof Error ? error.message : 'Refund perlu diperiksa manual.' }, 409); }
});
