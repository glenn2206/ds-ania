/**
 * biteship.ts — ongkir & autocomplete alamat via Biteship.
 *
 * DIPAKAI DI SISI SERVER (endpoint /api/shipping). Token dari BITESHIP_TOKEN (server-only,
 * TIDAK ter-bundle ke browser). Klien memanggil /api/shipping, bukan Biteship langsung.
 *
 * Kompat lama: bila hanya PUBLIC_BITESHIP_TOKEN yang diisi, itu tetap dipakai sebagai
 * fallback supaya BuyBox versi client-side lama tidak langsung mati.
 */
import { env } from './env';

const TOKEN = env('BITESHIP_TOKEN') || env('PUBLIC_BITESHIP_TOKEN');
const BASE = 'https://api.biteship.com/v1';

/** Titik asal = butik ANIA (default: Pesanggrahan, Jaksel 12250). Override via .env. */
export const ORIGIN_AREA_ID =
  env('BITESHIP_ORIGIN_AREA_ID') || env('PUBLIC_BITESHIP_ORIGIN_AREA_ID') ||
  'IDNP6IDNC148IDND843IDZ12250';

export interface Area {
  id: string;
  name: string;
  postal_code: number;
}

export async function searchAreas(input: string): Promise<Area[]> {
  if (!TOKEN || input.trim().length < 3) return [];
  try {
    const r = await fetch(
      `${BASE}/maps/areas?countries=ID&type=single&input=${encodeURIComponent(input)}`,
      { headers: { Authorization: TOKEN } },
    );
    const j = await r.json();
    return j.success && Array.isArray(j.areas) ? j.areas : [];
  } catch {
    return [];
  }
}

export interface RateOption {
  courier: string;
  service: string;
  price: number;
  etd: string;
}

export interface RateItem {
  name: string;
  value: number;
  weight: number; // gram
  quantity: number;
}

export async function getRates(opts: {
  destAreaId?: string;
  destPostal?: number;
  items: RateItem[];
}): Promise<{ options: RateOption[]; estimated: boolean }> {
  if (!TOKEN) return { options: fallbackRates(opts), estimated: true };
  try {
    const body: Record<string, unknown> = {
      origin_area_id: ORIGIN_AREA_ID,
      couriers: 'grab,gojek,jne,jnt,sicepat,anteraja,pos,ninja',
      items: opts.items,
    };
    if (opts.destAreaId) body.destination_area_id = opts.destAreaId;
    else if (opts.destPostal) body.destination_postal_code = opts.destPostal;

    const r = await fetch(`${BASE}/rates/couriers`, {
      method: 'POST',
      headers: { Authorization: TOKEN, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const j = await r.json();

    if (j.success && Array.isArray(j.pricing) && j.pricing.length) {
      const options: RateOption[] = j.pricing
        .map((p: any) => ({
          courier: p.courier_name,
          service: p.courier_service_name,
          price: p.price,
          etd: p.duration || p.shipment_duration_range || '',
        }))
        .sort((a: RateOption, b: RateOption) => a.price - b.price);
      return { options, estimated: false };
    }
    return { options: fallbackRates(opts), estimated: true };
  } catch {
    return { options: fallbackRates(opts), estimated: true };
  }
}

/** Estimasi zona sederhana dari kode pos (dipakai kalau rates API tidak tersedia). */
function fallbackRates(opts: { destPostal?: number; destAreaId?: string }): RateOption[] {
  const p =
    opts.destPostal ?? Number(String(opts.destAreaId || '').match(/IDZ(\d+)/)?.[1] ?? 0);
  const dki = p >= 10000 && p < 20000;
  const jabodetabek = dki || (p >= 16000 && p < 17800);
  const jabar = p >= 40000 && p < 47000;
  const base = jabodetabek ? 20000 : jabar ? 35000 : 55000;
  return [
    { courier: 'GoSend', service: 'Instant', price: base + 10000, etd: '1–3 hours' },
    { courier: 'Grab', service: 'Same Day', price: base, etd: 'today' },
    { courier: 'JNE', service: 'REG', price: Math.round(base * 0.7), etd: '2–3 days' },
  ];
}
