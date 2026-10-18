import nodemailer from 'nodemailer';
import { env } from './env';
import { q, one, tx, type Querier } from './db';

export function validEmail(value: string) { return value.length <= 200 && /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(value); }
export function emailConfigured() {
  return env('ORDER_EMAIL_ENABLED') === 'true' && Boolean(env('SMTP_HOST') && env('SMTP_USER') && env('SMTP_PASS')) &&
    validEmail(env('SMTP_FROM')) && validEmail(env('ORDER_EMAIL_TO'));
}
export async function queueOrderEmails(t: Querier, orderId: number, event: 'placed' | 'paid', email: string | null) {
  for (const kind of ['customer', 'shop']) {
    if (kind === 'customer' && (!email || !validEmail(email))) continue;
    const rows = await t.q('SELECT id FROM order_emails WHERE order_id=? AND event=? AND recipient_kind=?', [orderId, event, kind]);
    if (!rows.length) await t.insert('INSERT INTO order_emails (order_id,event,recipient_kind,recipient,state) VALUES (?,?,?,?,?)',
      [orderId, event, kind, kind === 'customer' ? email : null, 'pending']);
  }
}
export function orderEmailText(order: Record<string, any>, items: Record<string, any>[], event: string) {
  const state = event === 'paid' ? 'Pembayaran sudah diterima.' : 'Pesanan diterima. Email ini bukan bukti pembayaran.';
  return [`ANIA Flower Boutique - ${order.code}`, state, `Pelanggan: ${order.customer_name}`,
    ...items.map(item => `${item.name} x ${item.qty}: Rp ${Number(item.line_total).toLocaleString('id-ID')}`),
    `Ongkir: Rp ${Number(order.shipping_cost).toLocaleString('id-ID')}`, `Total: Rp ${Number(order.total).toLocaleString('id-ID')}`,
    `Pengiriman: ${order.courier || 'Pickup'} ${order.courier_service || ''}`, `Alamat: ${order.ship_address || 'Pickup di toko'}`,
    'Hubungi ANIA melalui WhatsApp untuk bantuan.'].join('\n');
}
export function scheduleOrderEmails(orderId: number) {
  // Durable rows already exist; SMTP must not delay checkout or webhook acknowledgement.
  setImmediate(() => { void dispatchOrderEmails(orderId).catch(() => console.error('[email] Confirmation needs admin review.')); });
}
export async function dispatchOrderEmails(orderId: number) {
  if (!emailConfigured()) return;
  const order = await one('SELECT * FROM orders WHERE id=?', [orderId]);
  if (!order) return;
  const items = await q('SELECT * FROM order_items WHERE order_id=? ORDER BY id', [orderId]);
  const rows = await q("SELECT * FROM order_emails WHERE order_id=? AND state='pending' ORDER BY id", [orderId]);
  const port = Number(env('SMTP_PORT', '465'));
  const transport = nodemailer.createTransport({ host: env('SMTP_HOST'), port, secure: port === 465, requireTLS: port !== 465,
    auth: { user: env('SMTP_USER'), pass: env('SMTP_PASS') }, connectionTimeout: 5000, greetingTimeout: 5000, socketTimeout: 8000,
    disableFileAccess: true, disableUrlAccess: true });
  try {
    for (const row of rows) {
      const claimed = await tx(async t => {
        const [current] = await t.q('SELECT state FROM order_emails WHERE id=? FOR UPDATE', [row.id]);
        if (current?.state !== 'pending') return false;
        await t.q("UPDATE order_emails SET state='sending', updated_at=CURRENT_TIMESTAMP WHERE id=?", [row.id]); return true;
      });
      if (!claimed) continue;
      try {
        const to = row.recipient_kind === 'shop' ? env('ORDER_EMAIL_TO') : row.recipient;
        if (!validEmail(to)) throw new Error('Invalid recipient');
        const info = await transport.sendMail({ from: env('SMTP_FROM'), to,
          subject: `${row.event === 'paid' ? 'Pembayaran diterima' : 'Pesanan diterima'} - ${order.code}`,
          text: orderEmailText(order, items, row.event), messageId: `<order-${orderId}-${row.event}-${row.recipient_kind}@myania.com>` });
        if (!info.accepted?.length) throw new Error('Not accepted');
        await q("UPDATE order_emails SET state='sent', sent_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE id=?", [row.id]);
      } catch {
        // SMTP timeouts can occur after delivery: never blindly resend these rows.
        await q("UPDATE order_emails SET state='review', updated_at=CURRENT_TIMESTAMP WHERE id=?", [row.id]);
      }
    }
  } finally { transport.close(); }
}
