import 'dotenv/config';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import nodemailer from 'nodemailer';
import { q, insert, tx } from '../src/lib/db';
import { queueOrderEmails, dispatchOrderEmails } from '../src/lib/order-email';
import { createOrderRefund, syncOrderRefund } from '../src/lib/order-refund';

assert.ok(['localhost', '127.0.0.1'].includes(process.env.DB_HOST || ''), 'Local database only');
process.env.XENDIT_REFUNDS_ENABLED = 'true'; process.env.XENDIT_SECRET_KEY = 'local-refund-no-network';
process.env.ORDER_EMAIL_ENABLED = 'true'; process.env.SMTP_HOST = 'local.invalid'; process.env.SMTP_USER = 'local';
process.env.SMTP_PASS = 'local'; process.env.SMTP_FROM = 'test@example.com'; process.env.ORDER_EMAIL_TO = 'shop@example.com';
const originalFetch = globalThis.fetch;
const originalTransport = nodemailer.createTransport;
const code = `MOM-LOCAL-${randomUUID().slice(0, 8)}`;
let id: number | undefined;
let refundPosts = 0, emails = 0;
let refundStatus = 'PENDING';
globalThis.fetch = async (input, init) => {
  const url = new URL(String(input));
  assert.equal(url.hostname, 'api.xendit.co', 'Unexpected provider');
  if (url.pathname.startsWith('/v2/invoices/')) return Response.json({ id: 'invoice-local', status: 'PAID', amount: 130000, currency: 'IDR' });
  if (init?.method === 'POST') { refundPosts++; const body = JSON.parse(String(init.body)); assert.equal(body.invoice_id, 'invoice-local'); assert.equal(body.amount, 130000); }
  return Response.json({ id: 'rfd-local', invoice_id: 'invoice-local', amount: 130000, currency: 'IDR', status: refundStatus });
};
nodemailer.createTransport = (() => ({ sendMail: async () => { emails++; return { accepted: ['test@example.com'] }; }, close() {} })) as unknown as typeof nodemailer.createTransport;
try {
  id = (await insert("INSERT INTO orders(code,status,customer_name,customer_phone,customer_email,subtotal,shipping_cost,total,xendit_invoice_id) VALUES (?,'paid','LOCAL TEST','088888888888','customer@example.com',100000,30000,130000,'invoice-local')", [code])).insertId;
  assert.ok(id);
  await tx(async t => { await queueOrderEmails(t, id!, 'paid', 'customer@example.com'); await queueOrderEmails(t, id!, 'paid', 'customer@example.com'); });
  await Promise.all([dispatchOrderEmails(id), dispatchOrderEmails(id)]);
  assert.equal(emails, 2, 'Each recipient sent once despite concurrent dispatch');
  await dispatchOrderEmails(id); assert.equal(emails, 2);
  const attempts = await Promise.allSettled([createOrderRefund(id, code), createOrderRefund(id, code)]);
  assert.equal(attempts.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal(refundPosts, 1, 'Only one money-moving request');
  assert.equal((await q('SELECT status FROM orders WHERE id=?', [id]))[0].status, 'refund_requested');
  refundStatus = 'SUCCEEDED'; await syncOrderRefund(id);
  assert.equal((await q('SELECT status FROM orders WHERE id=?', [id]))[0].status, 'refunded');
  await assert.rejects(createOrderRefund(id, code)); assert.equal(refundPosts, 1);
  console.log('PASS: isolated local order; 2 mock emails once; concurrent refunds submit once; pending -> succeeded; second refund blocked. No provider requests or real money.');
} finally {
  globalThis.fetch = originalFetch; nodemailer.createTransport = originalTransport;
  if (id) {
    await q('DELETE FROM order_emails WHERE order_id=?', [id]); await q('DELETE FROM order_refunds WHERE order_id=?', [id]);
    await q('DELETE FROM orders WHERE id=? AND code=?', [id, code]);
  }
}
