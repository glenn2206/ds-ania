/**
 * product-meta.ts — atribut produk tambahan di site_settings (pola sama dg diskon & alt foto).
 *   product_hashtags_<id> → "#A #B"
 *   photo_fit_<id>        → { [imageId]: { shop?, square?, detail? } }
 */
import { q, isConfigured, type Querier } from './db';
import { writeSetting } from './settings';
import { readHashtags } from '../data/hashtags';
import { readPhotoFits, type PhotoFits } from '../data/photo-fit';

const TAGS = 'product_hashtags_';
const FIT = 'photo_fit_';
export const hashtagKey = (id: number) => `${TAGS}${id}`;
export const photoFitKey = (id: number) => `${FIT}${id}`;

async function saveOrClear(t: Querier, key: string, value: string) {
  if (value) await writeSetting(t, key, value);
  else await t.q('DELETE FROM site_settings WHERE skey = ?', [key]);
}

/* ---------------------------------------------------------------- hashtag */
export async function getAllHashtags(): Promise<Map<number, string[]>> {
  if (!isConfigured()) return new Map();
  const rows = await q("SELECT skey, svalue FROM site_settings WHERE skey LIKE 'product_hashtags_%'");
  const out = new Map<number, string[]>();
  for (const r of rows) {
    try { out.set(Number(r.skey.slice(TAGS.length)), readHashtags(r.svalue)); }
    catch { /* abaikan nilai rusak tanpa menyembunyikan katalog */ }
  }
  return out;
}

export const saveHashtags = (t: Querier, id: number, tags: string[]) => saveOrClear(t, hashtagKey(id), tags.join(' '));

/* --------------------------------------------------------------- foto fit */
function parseFits(value: string): Record<string, PhotoFits> {
  const out: Record<string, PhotoFits> = {};
  let entries: [string, unknown][] = [];
  try { entries = Object.entries(JSON.parse(value) ?? {}); } catch { return out; }
  for (const [id, fit] of entries) {
    try { if (/^\d+$/.test(id)) out[id] = readPhotoFits(fit); }
    catch { /* lewati entri rusak */ }
  }
  return out;
}

export async function getAllPhotoFits(): Promise<Map<number, Record<string, PhotoFits>>> {
  if (!isConfigured()) return new Map();
  const rows = await q("SELECT skey, svalue FROM site_settings WHERE skey LIKE 'photo_fit_%'");
  return new Map(rows.map((r) => [Number(r.skey.slice(FIT.length)), parseFits(r.svalue)]));
}

export async function getProductPhotoFits(id: number): Promise<Record<string, PhotoFits>> {
  const rows = await q('SELECT svalue FROM site_settings WHERE skey = ?', [photoFitKey(id)]);
  return rows.length ? parseFits(rows[0].svalue) : {};
}

export async function savePhotoFit(t: Querier, id: number, imageId: number, fit: PhotoFits) {
  const rows = await t.q('SELECT svalue FROM site_settings WHERE skey = ?', [photoFitKey(id)]);
  const all = rows.length ? parseFits(rows[0].svalue) : {};
  if (Object.keys(fit).length) all[imageId] = fit;
  else delete all[imageId];
  await saveOrClear(t, photoFitKey(id), Object.keys(all).length ? JSON.stringify(all) : '');
}
