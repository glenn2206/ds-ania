import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { writeFile } from 'node:fs/promises';
import sharp from 'sharp';
import { withAdmin, jsonResponse } from '../../../lib/admin';
import { ensureUploadsDir, UPLOADS_DIR, removeUpload } from '../../../lib/images';

export const prerender = false;

export const POST = withAdmin(async ({ request }) => {
  if (Number(request.headers.get('content-length')) > 125 * 1024 * 1024) return jsonResponse({ error: 'Upload terlalu besar.' }, 413);
  const form = await request.formData();
  const video = form.get('kind') === 'video';
  if (!video && form.get('kind') !== 'hero') return jsonResponse({ error: 'Jenis media tidak valid.' }, 400);
  const files = form.getAll('files');
  if (!files.length || files.length > (video ? 1 : 10)) return jsonResponse({ error: 'Jumlah file tidak valid.' }, 400);
  const outputs: { filename: string; buffer: Buffer }[] = [];
  try {
    for (const file of files) {
      if (!(file instanceof File) || !file.size || file.size > (video ? 100 : 12) * 1024 * 1024) throw new Error(video ? 'Video maksimal 100 MB.' : 'Foto maksimal 12 MB per file.');
      const buffer = Buffer.from(await file.arrayBuffer());
      let extension = 'jpg';
      let output = buffer;
      if (video) {
        const mp4 = file.type === 'video/mp4' && /\.mp4$/i.test(file.name) && buffer.subarray(4, 8).toString() === 'ftyp';
        const webm = file.type === 'video/webm' && /\.webm$/i.test(file.name) && buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
        if (!mp4 && !webm) throw new Error('Gunakan file video MP4 atau WebM yang valid.');
        extension = mp4 ? 'mp4' : 'webm';
      } else {
        const metadata = await sharp(buffer, { limitInputPixels: 40_000_000 }).metadata();
        if (!['jpeg', 'png', 'webp'].includes(metadata.format || '')) throw new Error('Gunakan foto JPG, PNG, atau WebP.');
        output = await sharp(buffer, { limitInputPixels: 40_000_000 }).rotate().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
      }
      outputs.push({ filename: `site-${video ? 'about' : 'hero'}-${randomUUID()}.${extension}`, buffer: output });
    }
  } catch (error) {
    return jsonResponse({ error: (error as Error).message || 'File tidak valid.' }, 400);
  }
  await ensureUploadsDir();
  try {
    for (const output of outputs) await writeFile(path.join(UPLOADS_DIR, output.filename), output.buffer);
  } catch (error) {
    for (const output of outputs) await removeUpload(output.filename);
    throw error;
  }
  return jsonResponse({ urls: outputs.map(({ filename }) => `/uploads/${filename}`) });
});
