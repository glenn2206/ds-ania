import { env } from './env';
import { ShippingCache, allowShippingRequest } from './shipping-cache';
import { shippingOrigin } from '../data/shipping-origin';
import { isInstantService } from './delivery-policy';

const BASE = 'https://api.biteship.com/v1';
const areasCache = new ShippingCache<Area[]>(24 * 60 * 60_000);
const ratesCache = new ShippingCache<RateResult>(90_000, 200);
export class ShippingError extends Error {
  constructor(message: string, public status = 503) { super(message); }
}
export interface Coordinates { latitude: number; longitude: number }
export function coordinates(value: unknown): Coordinates | undefined {
  if (!value || typeof value !== 'object') return;
  const { latitude, longitude } = value as Coordinates;
  if (typeof latitude !== 'number' || typeof longitude !== 'number' ||
      !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return;
  return { latitude, longitude };
}
export interface Area {
  id: string; name: string; postal_code: number;
  administrative_division_level_2_name?: string;
  administrative_division_level_3_name?: string;
  administrative_division_level_4_name?: string;
}
export interface RateOption {
  courier: string; service: string; price: number; etd: string;
  courierCode: string; serviceCode: string;
}
export interface RateItem { name: string; value: number; weight: number; quantity: number }
export interface RateResult { options: RateOption[]; estimated: false }

async function provider(endpoint: string, init?: RequestInit): Promise<any> {
  const token = env('BITESHIP_TOKEN');
  if (!token || !/^biteship_(live|test)\./.test(token))
    throw new ShippingError('Delivery is not configured. Please choose pickup or contact ANIA.');
  if (!allowShippingRequest('provider', 30))
    throw new ShippingError('Too many delivery requests. Please wait a minute.', 429);
  let response: Response;
  try {
    response = await fetch(`${BASE}${endpoint}`, {
      ...init, signal: AbortSignal.timeout(10_000),
      headers: { Authorization: token, 'Content-Type': 'application/json' },
    });
  } catch { throw new ShippingError('Delivery service is unavailable. Please try again later.'); }
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success) {
    const message = String(data?.error || data?.message || '').toLowerCase();
    const reason = /balance|saldo/.test(message) ? 'balance' :
      [401, 403].includes(response.status) ? 'authentication' : 'provider';
    console.warn('[biteship]', { status: response.status, reason });
    throw new ShippingError('Delivery service is unavailable. Please choose pickup or contact ANIA.');
  }
  return data;
}
export async function searchAreas(input: string): Promise<Area[]> {
  const query = input.trim().replace(/\s+/g, ' ').toLowerCase();
  if (query.length < 3) return [];
  if (query.length > 80) throw new ShippingError('Location search is too long.', 400);
  return areasCache.get(query, async () => {
    const data = await provider(`/maps/areas?countries=ID&type=single&input=${encodeURIComponent(query)}`);
    if (!Array.isArray(data.areas)) throw new ShippingError('Invalid delivery area response.');
    return data.areas;
  });
}
export function getShippingOrigin() {
  const point = coordinates({ latitude: Number(env('BITESHIP_ORIGIN_LATITUDE', String(shippingOrigin.latitude))), longitude: Number(env('BITESHIP_ORIGIN_LONGITUDE', String(shippingOrigin.longitude))) });
  if (!point) throw new ShippingError('The store pickup pin is not configured. Please choose pickup or contact ANIA.');
  return { ...point, name: env('BITESHIP_ORIGIN_NAME', shippingOrigin.name), address: env('BITESHIP_ORIGIN_ADDRESS', shippingOrigin.address) };
}
export async function getRates(opts: { destination?: Coordinates; items: RateItem[]; fresh?: boolean }): Promise<RateResult> {
  const destination = coordinates(opts.destination);
  if (!destination) throw new ShippingError('Choose a delivery pin before checking Instant delivery.', 400);
  const lat = env('BITESHIP_ORIGIN_LATITUDE', String(shippingOrigin.latitude));
  const lng = env('BITESHIP_ORIGIN_LONGITUDE', String(shippingOrigin.longitude));
  const origin = lat && lng ? coordinates({ latitude: Number(lat), longitude: Number(lng) }) : undefined;
  if (!origin) throw new ShippingError('The store pickup pin is not configured. Please choose pickup or contact ANIA.');
  if (!opts.items.length || opts.items.some(i => !Number.isFinite(i.weight) || i.weight <= 0 ||
      !Number.isFinite(i.quantity) || i.quantity < 1 || !Number.isFinite(i.value) || i.value < 0))
    throw new ShippingError('Invalid delivery items.', 400);
  const items = [...opts.items].sort((a, b) => a.name.localeCompare(b.name));
  const body = {
    origin_latitude: origin.latitude, origin_longitude: origin.longitude,
    destination_latitude: destination.latitude, destination_longitude: destination.longitude,
    couriers: 'gojek,grab', items,
  };
  const load = async () => {
    const data = await provider('/rates/couriers', { method: 'POST', body: JSON.stringify(body) });
    if (!Array.isArray(data.pricing)) throw new ShippingError('Invalid delivery rate response.');
    const options = data.pricing.filter((p: any) =>
      isInstantService(p.courier_code, p.courier_service_code) &&
      Number.isFinite(p.price) && p.price > 0
    ).map((p: any) => ({
      courier: p.courier_name, service: p.courier_service_name,
      courierCode: p.courier_code, serviceCode: p.courier_service_code,
      price: p.price, etd: p.duration || p.shipment_duration_range || '',
    })).sort((a: RateOption, b: RateOption) => a.price - b.price);
    return { options, estimated: false as const };
  };
  return opts.fresh ? load() : ratesCache.get(JSON.stringify(body), load);
}

export class BookingError extends Error {
  constructor(message: string, public uncertain = true) { super(message); }
}
export async function bookingRequest(endpoint: string, body?: unknown): Promise<any> {
  const token = env('BITESHIP_TOKEN');
  if (!/^biteship_(live|test)\./.test(token)) throw new BookingError('Key Biteship belum dikonfigurasi.', false);
  let response: Response;
  try {
    response = await fetch(`${BASE}${endpoint}`, {
      method: body ? 'POST' : 'GET', headers: { Authorization: token, 'Content-Type': 'application/json' },
      ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(20_000),
    });
  } catch { throw new BookingError('Respons Biteship tidak pasti. Periksa dashboard sebelum mencoba lagi.'); }
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success) {
    // Duplicate reference can mean a previous timed-out request actually succeeded.
    const uncertain = !data || response.status >= 500 || [408, 409].includes(response.status) || Number(data.code) === 40002060;
    console.warn('[biteship booking]', { status: response.status, code: data?.code, uncertain });
    throw new BookingError(uncertain ? 'Hasil booking perlu diperiksa di dashboard Biteship.' : 'Biteship menolak booking. Periksa key, saldo, alamat, dan layanan di dashboard.', uncertain);
  }
  return data;
}
