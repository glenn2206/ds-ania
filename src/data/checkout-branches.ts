import { shippingOrigin } from './shipping-origin';

// Preview-only branches: city centres are not pickup pins and must never quote/book.
export const checkoutBranches = [
  { id: 'tangerang', name: 'Tangerang', address: shippingOrigin.address, latitude: shippingOrigin.latitude, longitude: shippingOrigin.longitude, preview: false },
  { id: 'jakarta-demo', name: 'Jakarta (demo)', address: 'Alamat dan pin toko Jakarta belum diisi. Contoh area kota saja.', latitude: -6.2, longitude: 106.8167, preview: true },
  { id: 'bali-demo', name: 'Bali (demo)', address: 'Alamat dan pin toko Bali belum diisi. Contoh area kota saja.', latitude: -8.65, longitude: 115.2167, preview: true },
] as const;
