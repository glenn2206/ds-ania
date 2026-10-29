// Verified pickup pins supplied by ANIA. Never use demo city centres for rates.
export const checkoutBranches = [
  { id: 'jakarta', name: 'Bloomingfields Jakarta', address: 'Jl. Raya Kb. Jeruk No.18, RT.10/RW.1, Kb. Jeruk, Kec. Kb. Jeruk, Kota Jakarta Barat, Daerah Khusus Ibukota Jakarta 11530', latitude: -6.1984118, longitude: 106.7677326, mapsUrl: 'https://share.google/OzNMYxJvPvrUo0DIm', active: true },
  { id: 'bali', name: 'Bloomingfields Bali', address: 'Jl. Bikini Utama No.10, Padangsambian Klod, Kec. Denpasar Bar., Kota Denpasar, Bali 80119', latitude: -8.6754898, longitude: 115.1862615, mapsUrl: 'https://share.google/zmSsuZA4RBee3NhaI', active: true },
  { id: 'tangerang', name: 'Bloomingfields CR6, The HOOD Tangerang', address: 'Jl. Symphonia, Boulevard W No.001, Cijantra, Kec. Pagedangan, Kabupaten Tangerang, Banten 15336', latitude: -6.274889, longitude: 106.6092373, mapsUrl: 'https://share.google/ki1xX7qniKCxdUVIq', active: false },
] as const;

export type CheckoutBranch = typeof checkoutBranches[number];
export type BranchPin = { latitude: number; longitude: number };
export class BranchError extends Error { status = 400; }
export function activeBranch(id: unknown): CheckoutBranch {
  const branch = checkoutBranches.find(b => b.id === id && b.active);
  if (!branch) throw new BranchError('Choose an active pickup branch. Tangerang is coming soon.');
  return branch;
}
export function nearestBranch(pin: BranchPin): CheckoutBranch {
  if (!pin || !Number.isFinite(pin.latitude) || !Number.isFinite(pin.longitude) || Math.abs(pin.latitude) > 90 || Math.abs(pin.longitude) > 180)
    throw new BranchError('Choose a valid delivery pin first.');
  const rad = (n: number) => n * Math.PI / 180;
  const distance = (b: CheckoutBranch) => Math.sin(rad(b.latitude - pin.latitude) / 2) ** 2 + Math.cos(rad(pin.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(rad(b.longitude - pin.longitude) / 2) ** 2;
  return checkoutBranches.filter(b => b.active).reduce((a, b) => distance(a) <= distance(b) ? a : b);
}
export function resolveBranch(id: unknown, pin?: BranchPin): CheckoutBranch {
  if (id === 'auto' && pin) return nearestBranch(pin);
  return activeBranch(id);
}
