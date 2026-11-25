/**
 * photo-fit.ts — pengaturan tampilan foto per layout (non-destruktif, file asli tidak diubah).
 * Dipakai bersama oleh editor CMS dan halaman situs supaya preview = hasil.
 */
export interface PhotoFit {
  /** titik fokus 0–100 (%) */
  x: number;
  y: number;
  /** 1–3 */
  zoom: number;
  /** cover = penuhi bingkai (terpotong), contain = foto utuh */
  fit: 'cover' | 'contain';
}

/** Rasio bingkai beda antar layout, jadi tiap layout punya pengaturan sendiri. */
export const PHOTO_FRAMES = [
  { key: 'shop', label: 'Belanja', ratio: '320 / 406' },
  { key: 'square', label: 'Momen & Beranda', ratio: '1 / 1' },
  { key: 'detail', label: 'Detail produk', ratio: '4 / 5' },
] as const;
export type PhotoFrame = (typeof PHOTO_FRAMES)[number]['key'];
export type PhotoFits = Partial<Record<PhotoFrame, PhotoFit>>;

export const DEFAULT_FIT: PhotoFit = { x: 50, y: 50, zoom: 1, fit: 'cover' };

export const isDefaultFit = (f?: PhotoFit) =>
  !f || (f.x === 50 && f.y === 50 && f.zoom === 1 && f.fit === 'cover');

const num = (v: unknown, min: number, max: number) => {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max) throw new Error('Pengaturan foto tidak valid.');
  return Math.round(v * 100) / 100;
};

export function readPhotoFit(v: any): PhotoFit {
  if (!v || typeof v !== 'object' || (v.fit !== 'cover' && v.fit !== 'contain')) throw new Error('Pengaturan foto tidak valid.');
  return { x: num(v.x, 0, 100), y: num(v.y, 0, 100), zoom: num(v.zoom, 1, 3), fit: v.fit };
}

/** Validasi pengaturan satu foto; layout yang masih default tidak disimpan. */
export function readPhotoFits(v: any): PhotoFits {
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('Pengaturan foto tidak valid.');
  const out: PhotoFits = {};
  for (const { key } of PHOTO_FRAMES) {
    if (v[key] === undefined) continue;
    const fit = readPhotoFit(v[key]);
    if (!isDefaultFit(fit)) out[key] = fit;
  }
  return out;
}

/** versi objek untuk React (selalu lengkap supaya preview ikut saat di-reset) */
export const photoStyleObject = (f: PhotoFit = DEFAULT_FIT) => ({
  objectFit: f.fit,
  objectPosition: `${f.x}% ${f.y}%`,
  scale: String(f.zoom),
  transformOrigin: `${f.x}% ${f.y}%`,
});

export interface PanBox { width: number; height: number }

/** bagian foto di luar bingkai per sumbu, px (negatif = ruang kosong, ±0 = pas, tidak bisa digeser) */
export function photoRoom(f: PhotoFit, box: PanBox, natural: PanBox): { x: number; y: number } {
  if (!natural.width || !natural.height || !box.width || !box.height) return { x: 0, y: 0 };
  const base = (f.fit === 'cover' ? Math.max : Math.min)(box.width / natural.width, box.height / natural.height);
  return { x: natural.width * base * f.zoom - box.width, y: natural.height * base * f.zoom - box.height };
}
/** kurang dari ini dianggap pas */
export const MIN_ROOM = 2;

/** Geser foto sejauh dx,dy piksel dari `from`: foto mengikuti kursor, zoom tidak pernah berubah. */
export function panPhoto(from: PhotoFit, dx: number, dy: number, box: PanBox, natural: PanBox): PhotoFit {
  const room = photoRoom(from, box, natural);
  const shift = (at: number, delta: number, left: number) =>
    Math.abs(left) < MIN_ROOM ? at : Math.round(Math.min(100, Math.max(0, at - (delta / left) * 100)) * 100) / 100;
  return { ...from, x: shift(from.x, dx, room.x), y: shift(from.y, dy, room.y) };
}

/** inline style untuk <img>. `scale` terpisah dari transform → efek hover kartu tetap jalan. */
export function photoStyle(fits: PhotoFits | undefined, frame: PhotoFrame): string | undefined {
  const f = fits?.[frame];
  if (!f || isDefaultFit(f)) return undefined;
  return `object-fit:${f.fit};object-position:${f.x}% ${f.y}%;scale:${f.zoom};--ph-x:${f.x}%;--ph-y:${f.y}%`;
}
