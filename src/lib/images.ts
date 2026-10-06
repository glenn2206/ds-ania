/**
 * images.ts — proses foto upload dari panel admin.
 *   auto-rotate EXIF → resize fit inside 1200 → JPEG mozjpeg q78
 *   → simpan sebagai <slug>-<position+1>.jpg di UPLOADS_DIR
 *
 * UPLOADS_DIR default ./uploads (lokal). Di cPanel set ke /home/USER/ania-uploads
 * supaya deploy ulang tidak menghapus foto.
 */
import path from 'node:path';
import { readFile, writeFile, unlink, mkdir, rename } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { env } from './env';

export const UPLOADS_DIR = env('UPLOADS_DIR') || path.resolve(env('APP_ROOT') || process.cwd(), 'uploads');

export async function ensureUploadsDir() {
  await mkdir(UPLOADS_DIR, { recursive: true });
}

/** proses satu buffer/file → simpan final, kembalikan nama file */
export async function processUpload(
  input: Buffer | string,
  slug: string,
  position: number,
): Promise<string> {
  await ensureUploadsDir();
  const sharp = (await import('sharp')).default;
  const buf = typeof input === 'string' ? await readFile(input) : input;
  const filename = `${slug}-${Number(position) + 1}.jpg`;
  const dest = path.join(UPLOADS_DIR, filename);
  const out = await sharp(buf)
    .rotate()
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 78, mozjpeg: true })
    .toBuffer();
  await writeFile(dest, out);
  if (typeof input === 'string') await unlink(input).catch(() => {});
  return filename;
}

export async function removeUpload(filename: string) {
  const p = path.join(UPLOADS_DIR, path.basename(filename));
  if (existsSync(p)) await unlink(p).catch(() => {});
}

/** rename semua file agar cocok slug/urutan baru (2 fase agar tidak bentrok nama) */
export async function renameForOrder(oldNames: string[], slug: string): Promise<string[]> {
  const tmp: string[] = [];
  for (let i = 0; i < oldNames.length; i++) {
    const from = path.join(UPLOADS_DIR, path.basename(oldNames[i]));
    const t = path.join(UPLOADS_DIR, `__tmp_${i}_${Date.now()}.jpg`);
    if (existsSync(from)) {
      await rename(from, t).catch(async () => {
        await writeFile(t, await readFile(from));
        await unlink(from).catch(() => {});
      });
    }
    tmp.push(t);
  }
  const results: string[] = [];
  for (let i = 0; i < tmp.length; i++) {
    const finalName = `${slug}-${i + 1}.jpg`;
    const to = path.join(UPLOADS_DIR, finalName);
    if (existsSync(tmp[i])) {
      await rename(tmp[i], to).catch(async () => {
        await writeFile(to, await readFile(tmp[i]));
        await unlink(tmp[i]).catch(() => {});
      });
    }
    results.push(finalName);
  }
  return results;
}
