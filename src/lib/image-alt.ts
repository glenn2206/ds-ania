import { q, type Querier } from './db';
import { writeSetting } from './settings';

export interface ImageAltInput { id: number; alt: string }
export const imageAltKey = (productId: number) => `image_alts_${productId}`;

export function readImageAltInputs(value: unknown): ImageAltInput[] {
  if (!Array.isArray(value) || value.length > 500) throw new Error('Daftar deskripsi foto tidak valid.');
  const seen = new Set<number>();
  return value.map((item) => {
    if (!item || !Number.isSafeInteger(item.id) || item.id <= 0 || seen.has(item.id) || typeof item.alt !== 'string' || item.alt.length > 300)
      throw new Error('Deskripsi foto maksimal 300 karakter dan ID foto harus valid.');
    seen.add(item.id);
    return { id: item.id, alt: item.alt.trim().replace(/\s+/g, ' ') };
  });
}

function parseAlts(value: string): Record<string, string> {
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([id, alt]) => /^\d+$/.test(id) && typeof alt === 'string' && alt.length <= 300).map(([id, alt]) => [id, String(alt)]));
  } catch { return {}; }
}

export async function getProductImageAlts(productId: number): Promise<Record<string, string>> {
  const rows = await q('SELECT svalue FROM site_settings WHERE skey = ?', [imageAltKey(productId)]);
  return rows.length ? parseAlts(rows[0].svalue) : {};
}

export async function getAllImageAlts(): Promise<Map<number, Record<string, string>>> {
  const rows = await q("SELECT skey, svalue FROM site_settings WHERE skey LIKE 'image_alts_%'");
  return new Map(rows.map((row) => [Number(row.skey.slice('image_alts_'.length)), parseAlts(row.svalue)]));
}

export async function saveImageAlts(t: Querier, productId: number, inputs: ImageAltInput[]) {
  await writeSetting(t, imageAltKey(productId), JSON.stringify(Object.fromEntries(inputs.filter((item) => item.alt).map((item) => [item.id, item.alt]))));
}

export async function listProductImages(productId: number) {
  const images = await q('SELECT id, filename, position FROM product_images WHERE product_id = ? ORDER BY position, id', [productId]);
  const alts = await getProductImageAlts(productId);
  return images.map((image) => ({ ...image, alt_text: alts[image.id] || '' }));
}
