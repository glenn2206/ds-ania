/**
 * cms/lib/images.js — proses foto upload:
 *  auto-rotate EXIF → resize fit inside 1200 → JPEG mozjpeg q78 → simpan
 *  sebagai <slug>-<position+1>.jpg di ~/ania-cms/uploads
 * (parameter sama persis dgn scripts/lib/optimize.mjs di repo Astro).
 */
import sharp from 'sharp';
import path from 'node:path';
import { readFile, writeFile, unlink, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';

export const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads');

export async function ensureUploadDir() {
  await mkdir(UPLOAD_DIR, { recursive: true });
}

/** proses satu file (path sementara dari multer) → simpan final, kembalikan nama file */
export async function processUpload(tmpPath, slug, position) {
  await ensureUploadDir();
  const filename = `${slug}-${Number(position) + 1}.jpg`;
  const dest = path.join(UPLOAD_DIR, filename);
  const input = await readFile(tmpPath);
  const out = await sharp(input)
    .rotate()
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 78, mozjpeg: true })
    .toBuffer();
  await writeFile(dest, out);
  await unlink(tmpPath).catch(() => {});
  return filename;
}

export async function removeUpload(filename) {
  const p = path.join(UPLOAD_DIR, path.basename(filename));
  if (existsSync(p)) await unlink(p).catch(() => {});
}

/** rename semua file agar cocok dgn slug/urutan baru (dipanggil setelah reorder/slug berubah) */
export async function renameForOrder(oldNames, slug) {
  const results = [];
  // 2 fase supaya tidak bentrok nama
  const tmp = [];
  for (let i = 0; i < oldNames.length; i++) {
    const from = path.join(UPLOAD_DIR, path.basename(oldNames[i]));
    const t = path.join(UPLOAD_DIR, `__tmp_${i}_${Date.now()}.jpg`);
    if (existsSync(from)) {
      await writeFile(t, await readFile(from));
      await unlink(from).catch(() => {});
    }
    tmp.push(t);
  }
  for (let i = 0; i < tmp.length; i++) {
    const finalName = `${slug}-${i + 1}.jpg`;
    const to = path.join(UPLOAD_DIR, finalName);
    if (existsSync(tmp[i])) {
      await writeFile(to, await readFile(tmp[i]));
      await unlink(tmp[i]).catch(() => {});
    }
    results.push(finalName);
  }
  return results;
}
