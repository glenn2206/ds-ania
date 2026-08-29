/**
 * xendit.ts — pembuatan invoice via Xendit REST API (server-only).
 *   XENDIT_SECRET_KEY      Secret Key (test/live) — Basic auth
 *   XENDIT_WEBHOOK_TOKEN   Verification Token untuk callback (dibaca di /api/webhooks/xendit)
 *
 * Kosong → isConfigured() false; checkout tetap membuat order (status pending) tanpa invoice.
 */
import { env } from './env';

const KEY = env('XENDIT_SECRET_KEY');
const API = 'https://api.xendit.co';

export function isConfigured(): boolean {
  return Boolean(KEY);
}

function authHeader(): string {
  return 'Basic ' + Buffer.from(`${KEY}:`).toString('base64');
}

export interface InvoiceInput {
  externalId: string;
  amount: number;
  description: string;
  payerEmail?: string;
  customerName?: string;
  successUrl: string;
  failureUrl: string;
  items?: { name: string; quantity: number; price: number }[];
  invoiceDurationSec?: number;
}

export interface InvoiceResult {
  id: string;
  invoiceUrl: string;
  status: string;
}

export async function createInvoice(input: InvoiceInput): Promise<InvoiceResult> {
  if (!KEY) throw new Error('XENDIT_SECRET_KEY belum diisi');

  const payload: Record<string, unknown> = {
    external_id: input.externalId,
    amount: Math.round(input.amount),
    description: input.description,
    currency: 'IDR',
    success_redirect_url: input.successUrl,
    failure_redirect_url: input.failureUrl,
    invoice_duration: input.invoiceDurationSec ?? 86400,
  };
  if (input.payerEmail) payload.payer_email = input.payerEmail;
  if (input.customerName) payload.customer = { given_names: input.customerName };
  if (input.items?.length)
    payload.items = input.items.map((it) => ({
      name: it.name,
      quantity: it.quantity,
      price: Math.round(it.price),
    }));

  const res = await fetch(`${API}/v2/invoices`, {
    method: 'POST',
    headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const j: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Xendit ${res.status}: ${j?.message || j?.error_code || 'gagal membuat invoice'}`);
  }
  return { id: j.id, invoiceUrl: j.invoice_url, status: j.status };
}

/** cocokkan token callback Xendit dengan XENDIT_WEBHOOK_TOKEN */
export function verifyCallbackToken(token: string | null): boolean {
  const expected = env('XENDIT_WEBHOOK_TOKEN');
  return Boolean(expected) && token === expected;
}
