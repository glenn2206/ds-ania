import crypto from 'node:crypto';
import { tx, type Querier } from './db';
import { env } from './env';
import { office } from '../data/contact';
import { BookingError, bookingRequest, coordinates, getRates, getShippingOrigin } from './biteship';

export class OrderShippingError extends Error {
  constructor(message: string, public status = 409) { super(message); }
}
export const bookingEnabled = () => env('BITESHIP_BOOKING_ENABLED') === 'true';
const mode = () => env('BITESHIP_TOKEN').startsWith('biteship_live.') ? 'live' : 'test';
const pickupPhone = () => env('BITESHIP_ORIGIN_PHONE', office.phone).replace(/[\s()+-]/g, '');
const digest = (value: unknown) => crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');
const parse = (value: string | null) => { try { return JSON.parse(value || 'null'); } catch { return null; } };
const fail = (message: string, status = 409): never => { throw new OrderShippingError(message, status); };
const secret = () => {
  const value = env('SESSION_SECRET');
  if (!value || value === 'dev-insecure-change-me') fail('SESSION_SECRET harus dikonfigurasi sebelum booking.', 503);
  return value;
};
const sign = (value: string) => crypto.createHmac('sha256', secret()).update(value).digest('base64url');
function signQuote(value: unknown) {
  const encoded = Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encoded}.${sign(encoded)}`;
}
function readQuote(token: unknown) {
  if (typeof token !== 'string' || token.length > 40000) fail('Konfirmasi tarif tidak valid.', 400);
  const [encoded, mac, extra] = (token as string).split('.');
  if (!encoded || !mac || extra) fail('Konfirmasi tarif tidak valid.', 400);
  const expected = sign(encoded);
  if (mac.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) fail('Konfirmasi tarif tidak valid.', 400);
  const value = parse(Buffer.from(encoded, 'base64url').toString('utf8'));
  if (!value || !Number.isFinite(value.expires) || value.expires < Date.now()) fail('Tarif kedaluwarsa. Klik cek tarif lagi.');
  return value;
}
export function deliverySnapshot(shipping: any) {
  const pin = coordinates(shipping.destination);
  if (!pin || !['gojek', 'grab'].includes(shipping.courierCode) || shipping.serviceCode !== 'instant') fail('Data Instant tidak valid.', 400);
  return { destination: pin, address: String(shipping.label || shipping.address || '').trim(),
    courier: shipping.courierCode, service: 'instant', date: String(shipping.date || ''), weight: 1500 };
}
export async function saveDelivery(t: Querier, orderId: number, code: string, shipping: any) {
  await t.q('INSERT INTO order_shipments (order_id,snapshot,reference_id) VALUES (?,?,?)',
    [orderId, JSON.stringify(deliverySnapshot(shipping)), `ANIA-SHIP-${orderId}-${code}`]);
}

// Dependencies allow the real DB locking flow to be tested without contacting any courier.
export function shippingService(deps = { tx, getRates, bookingRequest }) {
  async function load(t: Querier, id: number) {
    const [order] = await t.q('SELECT * FROM orders WHERE id=? FOR UPDATE', [id]);
    if (!order) fail('Order tidak ada.', 404);
    const [shipment] = await t.q('SELECT * FROM order_shipments WHERE order_id=? FOR UPDATE', [id]);
    if (!shipment) fail('Order lama/pickup belum memiliki data Instant terstruktur. Jangan booking dari CMS; periksa manual.');
    return { order, shipment };
  }
  function eligible(order: any, shipment: any) {
    if (!bookingEnabled()) fail('Booking CMS belum diaktifkan oleh pengelola.', 503);
    if (order.status !== 'paid' || !order.paid_at || !order.xendit_invoice_id) fail('Booking hanya untuk order lunas yang terkonfirmasi melalui Xendit.');
    if (!['ready', 'rejected'].includes(shipment.state) || shipment.provider_id) fail('Order sudah dipesan atau perlu rekonsiliasi. Jangan membuat booking kedua.');
  }
  const source = (shipment: any, items: any[]) => digest([shipment.snapshot, items]);
  const readItems = (t: Querier, id: number) => t.q('SELECT name,unit_price,qty FROM order_items WHERE order_id=? ORDER BY id', [id]);

  async function quote(id: number, recipient: { name: string; phone: string }) {
    const input = await deps.tx(async t => {
      const { order, shipment } = await load(t, id);
      eligible(order, shipment);
      const snapshot = parse(shipment.snapshot);
      if (!coordinates(snapshot?.destination) || !snapshot.address || !['gojek', 'grab'].includes(snapshot.courier) || snapshot.service !== 'instant') fail('Data pengiriman tidak lengkap.');
      const name = String(recipient.name || '').trim();
      const phone = String(recipient.phone || '').replace(/[\s()+-]/g, '');
      if (!name || name.length > 200 || !/^(0|62)\d{8,13}$/.test(phone)) fail('Nama dan nomor WhatsApp penerima harus valid.', 400);
      const origin = getShippingOrigin();
      const originPhone = pickupPhone();
      if (!/^(0|62)\d{8,13}$/.test(originPhone)) fail('Nomor kontak pickup BITESHIP_ORIGIN_PHONE belum valid.', 503);
      const items = await readItems(t, id);
      if (!items.length || items.some(i => !Number.isInteger(Number(i.qty)) || Number(i.qty) < 1 || Number(i.unit_price) <= 0)) fail('Item pengiriman tidak valid.');
      const payload = {
        origin_contact_name: origin.name, origin_contact_phone: originPhone, origin_address: origin.address,
        origin_coordinate: { latitude: origin.latitude, longitude: origin.longitude },
        destination_contact_name: name, destination_contact_phone: phone, destination_address: snapshot.address,
        destination_coordinate: snapshot.destination, courier_company: snapshot.courier, courier_type: 'instant',
        delivery_type: 'now', reference_id: shipment.reference_id, order_note: `Order ${order.code}. Bunga, tangani dengan hati-hati.`,
        items: items.map(i => ({ name: i.name, value: Number(i.unit_price), quantity: Number(i.qty), weight: 1500 })),
      };
      return { payload, source: source(shipment, items), date: snapshot.date, paidShipping: Number(order.shipping_cost), mode: mode() };
    });
    const rates = await deps.getRates({ destination: input.payload.destination_coordinate, items: input.payload.items, fresh: true });
    const option = rates.options.find(o => o.courierCode === input.payload.courier_company && o.serviceCode === 'instant');
    if (!option) return fail('Kurir Instant pilihan pelanggan tidak tersedia. Jangan ganti layanan tanpa konfirmasi.');
    const expires = Date.now() + 90_000;
    return { ...input, price: option.price, expires, token: signQuote({ id, ...input, price: option.price, expires }) };
  }
  async function book(id: number, token: unknown, actor: string) {
    if (!bookingEnabled()) fail('Booking CMS belum diaktifkan oleh pengelola.', 503);
    const quote = readQuote(token);
    if (quote.id !== id || quote.mode !== mode()) fail('Konfirmasi bukan untuk order/environment ini.');
    await deps.tx(async t => {
      const { order, shipment } = await load(t, id);
      eligible(order, shipment);
      const items = await readItems(t, id);
      if (quote.expires < Date.now()) fail('Tarif kedaluwarsa. Klik cek tarif lagi.');
      const origin = getShippingOrigin();
      if (digest(quote.payload.origin_coordinate) !== digest({ latitude: origin.latitude, longitude: origin.longitude }) ||
          quote.payload.origin_address !== origin.address || quote.payload.origin_contact_name !== origin.name ||
          quote.payload.origin_contact_phone !== pickupPhone()) fail('Konfigurasi pickup berubah. Periksa tarif lagi.');
      if (quote.source !== source(shipment, items) || quote.paidShipping !== Number(order.shipping_cost) || quote.payload.reference_id !== shipment.reference_id) fail('Data order berubah. Periksa ulang tarif.');
      // Persist the claim BEFORE POST. A timeout/crash must never allow blind rebooking.
      const snapshot = { ...parse(shipment.snapshot), booking: quote.payload };
      await t.q("UPDATE order_shipments SET state='creating',provider_mode=?,booked_by=?,snapshot=?,last_error=NULL,updated_at=CURRENT_TIMESTAMP WHERE order_id=?", [mode(), actor, JSON.stringify(snapshot), id]);
    });
    let data;
    try {
      data = await deps.bookingRequest('/orders', quote.payload);
      if (!data.id || data.reference_id !== quote.payload.reference_id || data.courier?.company !== quote.payload.courier_company || data.courier?.type !== 'instant') throw new BookingError('Respons booking tidak lengkap. Periksa dashboard Biteship.');
    } catch (error) {
      const state = error instanceof BookingError && !error.uncertain ? 'rejected' : 'review';
      await deps.tx(async t => {
        await t.q('UPDATE order_shipments SET state=?,last_error=?,updated_at=CURRENT_TIMESTAMP WHERE order_id=? AND provider_id IS NULL',
          [state, error instanceof BookingError ? error.message : 'Hasil booking tidak pasti. Periksa dashboard Biteship.', id]);
      });
      fail(state === 'review' ? 'Hasil booking tidak pasti. Jangan pesan ulang; cocokkan Reference ID di dashboard dan sinkronkan ID Biteship.' : 'Booking ditolak. Perbaiki konfigurasi/saldo, lalu cek tarif lagi.', 503);
    }
    await store(id, data);
    return summary(data);
  }
  function summary(data: any) {
    const link = typeof data.courier?.link === 'string' && data.courier.link.startsWith('https://') ? data.courier.link : null;
    return { id: data.id, status: data.status || 'unknown', waybill: data.courier?.waybill_id || null, link,
      price: Number.isFinite(data.price) ? data.price : null };
  }
  async function store(id: number, data: any) {
    const result = summary(data);
    await deps.tx(async t => {
      await t.q("UPDATE order_shipments SET state='booked',provider_id=?,provider_data=?,last_error=NULL,updated_at=CURRENT_TIMESTAMP WHERE order_id=?",
        [result.id, JSON.stringify(result), id]);
    });
  }
  async function sync(id: number, recoveryId?: string) {
    const input = await deps.tx(async t => {
      const { shipment } = await load(t, id);
      if (shipment.provider_mode !== mode()) fail('Gunakan key Biteship dari environment booking yang sama.');
      if (shipment.state === 'creating' && Date.now() - new Date(shipment.updated_at).getTime() < 60_000) fail('Booking masih diproses. Tunggu sebelum sinkronisasi.');
      const providerId = shipment.provider_id || recoveryId;
      if (!providerId || !/^[a-zA-Z0-9_-]{8,120}$/.test(providerId)) fail('Isi ID order Biteship dari dashboard, bukan nomor resi.', 400);
      return { providerId, reference: shipment.reference_id };
    });
    const data = await deps.bookingRequest(`/orders/${encodeURIComponent(input.providerId)}`);
    if (data.id !== input.providerId || data.reference_id !== input.reference || !['gojek', 'grab'].includes(data.courier?.company) || data.courier?.type !== 'instant') fail('ID Biteship tidak cocok dengan Reference ID order ini.');
    await store(id, data);
    return summary(data);
  }
  return { quote, book, sync };
}
export const orderShipping = shippingService();
