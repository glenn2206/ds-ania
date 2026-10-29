/**
 * POST /api/checkout — buat order + (bila Xendit aktif) invoice pembayaran.
 *
 * Body: {
 *   items:   [{ slug, qty }],
 *   customer:{ name, phone, email? },
 *   shipping:{ mode, destination?:{latitude,longitude}, areaId?, postal?, label?, address?, date?, courierCode?, serviceCode?, cost? }
 *   note?: string
 * }
 * Resp: { code, invoiceUrl: string | null, total }
 *
 * Harga/stok dari DB. Delivery wajib memakai quote Instant yang cocok di server.
 * Pickup selalu gratis; kegagalan provider tidak boleh menjadi ongkir buatan klien.
 */
import type { APIRoute } from 'astro';
import crypto from 'node:crypto';
import { tx } from '../../lib/db';
import { getCatalog } from '../../lib/products';
import { getRates, coordinates, ShippingError } from '../../lib/biteship';
import { env } from '../../lib/env';
import * as xendit from '../../lib/xendit';
import { saveDelivery } from '../../lib/order-shipping';
import { validEmail, queueOrderEmails, scheduleOrderEmails } from '../../lib/order-email';
import { getCheckoutEnabled } from '../../lib/settings';
import { isInstantService } from '../../lib/delivery-policy';

export const prerender = false;

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

const genCode = () => 'ANIA-' + crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);

export const POST: APIRoute = async ({ request }) => {
  if (!await getCheckoutEnabled()) return json({ error: 'Checkout sedang dinonaktifkan. Hubungi ANIA melalui WhatsApp.' }, 503);
  const body = await request.json().catch(() => null);
  if (!body) return json({ error: 'invalid json' }, 400);
  if (!['delivery', 'pickup'].includes(body.shipping?.mode)) return json({ error: 'Choose delivery or pickup.' }, 400);
  if (body.shipping.mode === 'delivery' && !isInstantService(body.shipping.courierCode, body.shipping.serviceCode))
    return json({ error: 'Delivery is only available via Grab or Gojek Instant.' }, 400);
  if (body.shipping.mode === 'delivery' && !coordinates(body.shipping.destination))
    return json({ error: 'Choose a delivery pin before checking out.' }, 400);
  if (!Array.isArray(body.items) || !body.items.length || body.items.length > 50 ||
      body.items.some((item: any) => !item || typeof item.slug !== 'string' || !Number.isInteger(item.qty) || item.qty < 1 || item.qty > 100))
    return json({ error: 'Invalid cart items.' }, 400);

  const name = String(body.customer?.name || '').trim();
  const phone = String(body.customer?.phone || '').trim();
  const email = String(body.customer?.email || '').trim() || null;
  if (email && !validEmail(email)) return json({ error: 'Email tidak valid.' }, 400);
  if (!name || !phone) return json({ error: 'Nama & WhatsApp wajib.' }, 400);
  if (body.shipping?.mode === 'delivery' && !String(body.shipping.address || '').trim())
    return json({ error: 'Alamat lengkap penerima wajib.' }, 400);

  const wanted: { slug: string; qty: number }[] = Array.isArray(body.items)
    ? body.items
        .map((x: any) => ({ slug: String(x?.slug || ''), qty: Math.max(1, Math.floor(Number(x?.qty) || 1)) }))
        .filter((x: any) => x.slug)
    : [];
  if (!wanted.length) return json({ error: 'Keranjang kosong.' }, 400);

  const cat = await getCatalog();
  const bySlug = new Map([...cat.allProducts, ...cat.addons].map((p) => [p.slug, p]));

  const lines: { slug: string; productId: number | null; name: string; unit: number; qty: number; lineTotal: number }[] = [];
  for (const { slug, qty } of wanted) {
    const p = bySlug.get(slug);
    if (!p) return json({ error: `Produk "${slug}" tidak tersedia.` }, 400);
    if (p.soldOut || (typeof p.stock === 'number' && p.stock < qty))
      return json({ error: `Stok "${p.name}" tidak cukup.` }, 409);
    const unit = typeof p.price === 'number' ? p.price : 0;
    if (unit <= 0) return json({ error: `"${p.name}" harus dipesan lewat WhatsApp (harga on request).` }, 400);
    lines.push({ slug, productId: p.id ?? null, name: p.name, unit, qty, lineTotal: unit * qty });
  }
  const subtotal = lines.reduce((n, l) => n + l.lineTotal, 0);

  // ongkir
  const sh = body.shipping || {};
  const destAreaId: string | undefined = sh.areaId || undefined;
  const destPostal: number | undefined = sh.postal ? Number(sh.postal) : undefined;
  let shippingCost = 0;
  let courier = 'pickup';
  let service = 'Pickup at ANIA';
  if (sh.mode === 'delivery') {
    try {
      const rates = await getRates({
        destination: sh.destination,
        items: lines.map((l) => ({ name: l.slug, value: l.unit, weight: 1500, quantity: l.qty })),
      });
      const match = rates.options.find((o) => o.courierCode === sh.courierCode && o.serviceCode === sh.serviceCode);
      if (!match || match.price !== sh.cost)
        return json({ error: 'Instant delivery quote changed or is unavailable. Please check delivery again.' }, 409);
      shippingCost = match.price;
      courier = match.courier;
      service = match.service;
    } catch (error) {
      return json({ error: error instanceof Error ? error.message : 'Delivery unavailable.' }, error instanceof ShippingError ? error.status : 503);
    }
  }

  const total = subtotal + shippingCost;
  const code = genCode();

  const orderId = await tx(async (t) => {
    const { insertId } = await t.insert(
      `INSERT INTO orders
         (code,status,customer_name,customer_phone,customer_email,ship_address,ship_area_id,ship_postal,
          courier,courier_service,shipping_cost,subtotal,total,note)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        code, 'pending', name, phone, email,
        String(sh.label || sh.address || ''), destAreaId || null, destPostal ? String(destPostal) : null,
        courier || null, service || null, shippingCost, subtotal, total,
        [sh.date ? `Terima: ${sh.date}` : '', sh.mode === 'delivery' ? `Pin: ${sh.destination.latitude},${sh.destination.longitude}` : '', body.note ? String(body.note) : ''].filter(Boolean).join(' · ') || null,
      ],
    );
    for (const l of lines) {
      await t.q(
        `INSERT INTO order_items (order_id, product_id, slug, name, unit_price, qty, line_total)
         VALUES (?,?,?,?,?,?,?)`,
        [insertId, l.productId, l.slug, l.name, l.unit, l.qty, l.lineTotal],
      );
    }
    if (sh.mode === 'delivery') await saveDelivery(t, insertId as number, code, sh);
    await queueOrderEmails(t, insertId as number, 'placed', email);
    return insertId as number;
  });

  // invoice Xendit (opsional)
  let invoiceUrl: string | null = null;
  if (xendit.isConfigured() && await getCheckoutEnabled()) {
    const siteUrl = env('PUBLIC_SITE_URL', new URL(request.url).origin).replace(/\/$/, '');
    try {
      const inv = await xendit.createInvoice({
        externalId: code,
        amount: total,
        description: `Order ${code} — ANIA Flower Boutique`,
        payerEmail: email || undefined,
        customerName: name,
        successUrl: `${siteUrl}/order/${code}`,
        failureUrl: `${siteUrl}/order/${code}`,
        items: [
          ...lines.map((l) => ({ name: l.name, quantity: l.qty, price: l.unit })),
          ...(shippingCost > 0 ? [{ name: `Ongkir ${courier} ${service}`.trim(), quantity: 1, price: shippingCost }] : []),
        ],
      });
      invoiceUrl = inv.invoiceUrl;
      await tx(async (t) => {
        await t.q('UPDATE orders SET xendit_invoice_id=?, xendit_invoice_url=? WHERE id=?', [
          inv.id, inv.invoiceUrl, orderId,
        ]);
      });
    } catch (err) {
      console.error('[checkout] Xendit gagal:', (err as Error).message);
      // order tetap ada sebagai pending; klien akan fallback ke WhatsApp
    }
  }

  scheduleOrderEmails(orderId);
  return json({ code, invoiceUrl, total });
};
