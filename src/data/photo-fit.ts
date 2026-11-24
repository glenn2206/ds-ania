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

/**
 * Geser foto sejauh dx,dy piksel dari `from`; foto mengikuti kursor.
 * Bila foto sudah pas dengan bingkai (tidak ada sisa untuk digeser), zoom dinaikkan secukupnya.
 */
export function panPhoto(from: PhotoFit, dx: number, dy: number, box: PanBox, natural: PanBox): PhotoFit {
  if (!natural.width || !natural.height || !box.width || !box.height) return from;
  const fitBox = from.fit === 'cover' ? Math.max : Math.min;
  const base = fitBox(box.width / natural.width, box.height / natural.height);
  const size = { x: natural.width * base, y: natural.height * base };
  const rest = (axis: 'x' | 'y', zoom: number) => size[axis] * zoom - (axis === 'x' ? box.width : box.height);
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

  if (from.fit === 'contain') {
    const shift = (at: number, delta: number, left: number) => (Math.abs(left) < 1 ? at : r2(clamp(at - (delta / left) * 100, 0, 100)));
    return { ...from, x: shift(from.x, dx, rest('x', from.zoom)), y: shift(from.y, dy, rest('y', from.zoom)) };
  }

  // geser kecil ke samping saat menarik atas-bawah (atau sebaliknya) tidak memicu zoom
  const roomX = rest('x', from.zoom) >= 1;
  const roomY = rest('y', from.zoom) >= 1;
  if (!roomX && Math.abs(dx) < Math.abs(dy)) dx = 0;
  if (!roomY && Math.abs(dy) < Math.abs(dx)) dy = 0;

  // jarak pusat foto dari pusat bingkai setelah digeser
  const cx = (0.5 - from.x / 100) * Math.max(0, rest('x', from.zoom)) + dx;
  const cy = (0.5 - from.y / 100) * Math.max(0, rest('y', from.zoom)) + dy;
  const need = Math.max((2 * Math.abs(cx) + box.width) / size.x, (2 * Math.abs(cy) + box.height) / size.y);
  const zoom = clamp(Math.ceil(need * 100) / 100, from.zoom, Math.max(from.zoom, AUTO_ZOOM_MAX));
  const at = (c: number, left: number) => (left < 1 ? 50 : r2(clamp((0.5 - c / left) * 100, 0, 100)));
  return { ...from, zoom, x: at(cx, rest('x', zoom)), y: at(cy, rest('y', zoom)) };
}
/** batas zoom otomatis saat menyeret; di atas ini pakai slider */
const AUTO_ZOOM_MAX = 1.6;

/** inline style untuk <img>. `scale` terpisah dari transform → efek hover kartu tetap jalan. */
export function photoStyle(fits: PhotoFits | undefined, frame: PhotoFrame): string | undefined {
  const f = fits?.[frame];
  if (!f || isDefaultFit(f)) return undefined;
  return `object-fit:${f.fit};object-position:${f.x}% ${f.y}%;scale:${f.zoom};--ph-x:${f.x}%;--ph-y:${f.y}%`;
}
