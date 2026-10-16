import { ShippingCache } from './shipping-cache';

export interface AddressMatch { label: string; latitude: number; longitude: number }
const cache = new ShippingCache<AddressMatch[]>(24 * 60 * 60_000, 300);
let busy = false;
let lastRequest = 0;

export function parseAddressMatches(data: unknown): AddressMatch[] {
  const features = (data as { features?: unknown[] })?.features;
  if (!Array.isArray(features)) throw new Error('Invalid address response');
  const matches: AddressMatch[] = [];
  for (const feature of features.slice(0, 10)) {
    const item = feature as { geometry?: { type?: string; coordinates?: unknown[] }; properties?: Record<string, unknown> };
    const p = item?.properties;
    const [longitude, latitude] = item?.geometry?.coordinates || [];
    if (!p || String(p.countrycode).toUpperCase() !== 'ID' || item.geometry?.type !== 'Point' ||
      typeof latitude !== 'number' || typeof longitude !== 'number' || !Number.isFinite(latitude) || !Number.isFinite(longitude) ||
      latitude < -11.5 || latitude > 6.5 || longitude < 94 || longitude > 142) continue;
    const label = [...new Set(['name', 'street', 'housenumber', 'district', 'city', 'county', 'state', 'postcode']
      .map(key => p[key]).filter((value): value is string => typeof value === 'string' && value.length > 0))].join(', ').slice(0, 500);
    if (label && !matches.some(match => match.label === label && match.latitude === latitude && match.longitude === longitude))
      matches.push({ label, latitude, longitude });
  }
  return matches.slice(0, 5);
}

export async function searchAddresses(query: string): Promise<AddressMatch[]> {
  const q = query.trim().replace(/\s+/g, ' ');
  if (q.length < 4 || q.length > 160) throw new Error('Enter a street or place and city (4-160 characters).');
  return cache.get(q.toLowerCase(), async () => {
    // Public Photon is best-effort: no autocomplete, retries or concurrent uncached calls.
    if (busy || Date.now() - lastRequest < 1500) throw new Error('Address search is busy. Please wait and try again.');
    busy = true;
    lastRequest = Date.now();
    try {
      const url = new URL('https://photon.komoot.io/api/');
      url.search = new URLSearchParams({ q, countrycode: 'ID', limit: '5' }).toString();
      const response = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { Accept: 'application/json', 'User-Agent': 'ANIA-AddressSearch/1.0 (https://myania.com)' } });
      if (!response.ok) throw new Error('Address search unavailable');
      return parseAddressMatches(await response.json());
    } finally { busy = false; }
  });
}
