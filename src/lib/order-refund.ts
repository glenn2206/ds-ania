import { randomUUID } from 'node:crypto';
import { env } from './env';
import { tx, one, q } from './db';

export function refundsEnabled() { return env('XENDIT_REFUNDS_ENABLED') === 'true' && Boolean(env('XENDIT_SECRET_KEY')); }
async function provider(path: string, body?: unknown) {
  const response = await fetch(`https://api.xendit.co${path}`, { method: body ? 'POST' : 'GET',
    headers: { Authorization: `Basic ${Buffer.from(`${env('XENDIT_SECRET_KEY')}:`).toString('base64')}`, 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(12_000), ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await response.json();
  if (!response.ok) throw new Error('Xendit menolak atau gagal merespons. Periksa dashboard sebelum mencoba tindakan lain.');
  return data;
}
export function refundResultMatches(data: any, invoiceId: string, amount: number, refundId?: string) {
  return data && typeof data.id === 'string' && /^rfd-/.test(data.id) && (!refundId || data.id === refundId) &&
    data.invoice_id === invoiceId && Number(data.amount) === amount && data.currency === 'IDR' &&
    ['PENDING', 'SUCCEEDED', 'FAILED'].includes(data.status);
}
export async function createOrderRefund(id: number, confirmation: string) {
  if (!refundsEnabled()) throw new Error('Refund API belum diaktifkan. Periksa key, izin refund dan metode pembayaran Xendit.');
  const claim = await tx(async t => {
    const [order] = await t.q('SELECT * FROM orders WHERE id=? FOR UPDATE', [id]);
    if (!order || order.code !== confirmation || !['paid', 'fulfilled', 'refund_requested'].includes(order.status) || !order.xendit_invoice_id)
      throw new Error('Konfirmasi kode, invoice atau status pembayaran tidak valid.');
    const existing = await t.q('SELECT id FROM order_refunds WHERE order_id=?', [id]);
    if (existing.length) throw new Error('Sudah ada proses refund. Sinkronkan/periksa dashboard; jangan membuat refund kedua.');
    const shipment = await t.q('SELECT state FROM order_shipments WHERE order_id=?', [id]);
    if (shipment.some(s => ['creating', 'review', 'booked'].includes(s.state))) throw new Error('Rekonsiliasi/pembatalan booking kurir dahulu.');
    const reference = `ania-refund-${id}-${randomUUID()}`;
    await t.insert('INSERT INTO order_refunds (order_id,reference_id,amount,state) VALUES (?,?,?,?)', [id, reference, order.total, 'creating']);
    await t.q("UPDATE orders SET status='refund_requested', updated_at=CURRENT_TIMESTAMP WHERE id=?", [id]);
    return { order, reference };
  });
  try {
    const invoice = await provider(`/v2/invoices/${encodeURIComponent(claim.order.xendit_invoice_id)}`);
    if (invoice.id !== claim.order.xendit_invoice_id || invoice.currency !== 'IDR' || !['PAID', 'SETTLED'].includes(invoice.status) || Number(invoice.amount) !== Number(claim.order.total))
      throw new Error('Invoice tidak cocok dengan order.');
    const data = await provider('/refunds', { invoice_id: claim.order.xendit_invoice_id, reference_id: claim.reference,
      amount: Number(claim.order.total), currency: 'IDR', reason: 'REQUESTED_BY_CUSTOMER' });
    if (!refundResultMatches(data, claim.order.xendit_invoice_id, Number(claim.order.total))) throw new Error('Respons refund perlu diperiksa manual.');
    await applyResult(id, data);
    return data.status;
  } catch (error) {
    await q("UPDATE order_refunds SET state='review', updated_at=CURRENT_TIMESTAMP WHERE order_id=? AND state='creating'", [id]);
    throw error;
  }
}
async function applyResult(id: number, data: any) {
  await tx(async t => {
    await t.q('SELECT id FROM orders WHERE id=? FOR UPDATE', [id]);
    const [current] = await t.q('SELECT state FROM order_refunds WHERE order_id=? FOR UPDATE', [id]);
    if (!current || ['succeeded', 'failed'].includes(current.state)) return;
    await t.q('UPDATE order_refunds SET state=?, refund_id=?, updated_at=CURRENT_TIMESTAMP WHERE order_id=?', [data.status.toLowerCase(), data.id, id]);
    await t.q('UPDATE orders SET status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?', [data.status === 'SUCCEEDED' ? 'refunded' : 'refund_requested', id]);
  });
}
export async function syncOrderRefund(id: number) {
  if (!refundsEnabled()) throw new Error('Refund API belum diaktifkan.');
  const row = await one('SELECT * FROM order_refunds WHERE order_id=?', [id]);
  const order = await one('SELECT xendit_invoice_id FROM orders WHERE id=?', [id]);
  if (!row?.refund_id || !order) throw new Error('ID refund belum tercatat. Periksa dashboard Xendit memakai reference_id; jangan kirim ulang.');
  const data = await provider(`/refunds/${encodeURIComponent(row.refund_id)}`);
  if (!refundResultMatches(data, order.xendit_invoice_id, Number(row.amount), row.refund_id)) throw new Error('Respons refund tidak cocok.');
  await applyResult(id, data); return data.status;
}
