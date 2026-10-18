import { withAdmin, jsonResponse } from '../../../../../lib/admin';
import { tx } from '../../../../../lib/db';
import { dispatchOrderEmails, emailConfigured } from '../../../../../lib/order-email';
export const prerender = false;
export const POST = withAdmin(async ({ params, request }) => {
  const id = Number(params.id);
  const body = await request.json().catch(() => ({}));
  if (!Number.isInteger(id) || id < 1 || body.confirm !== true) return jsonResponse({ error: 'Konfirmasi diperlukan.' }, 400);
  if (!emailConfigured()) return jsonResponse({ error: 'SMTP/email belum dikonfigurasi atau belum diaktifkan.' }, 409);
  await tx(async t => {
    await t.q('SELECT id FROM orders WHERE id=? FOR UPDATE', [id]);
    // Review includes SMTP timeouts: operator must check the recipient before retrying.
    const rows = await t.q('SELECT id, state, updated_at FROM order_emails WHERE order_id=? FOR UPDATE', [id]);
    for (const row of rows) {
      if (row.state === 'review' || (row.state === 'sending' && Date.now() - new Date(row.updated_at).getTime() > 300_000))
        await t.q("UPDATE order_emails SET state='pending', updated_at=CURRENT_TIMESTAMP WHERE id=?", [row.id]);
    }
  });
  try { await dispatchOrderEmails(id); return jsonResponse({ ok: true }); }
  catch { return jsonResponse({ error: 'Pengiriman perlu diperiksa. Lihat status email.' }, 503); }
});
