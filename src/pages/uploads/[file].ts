/**
 * GET /uploads/<file> — sajikan foto produk.
 * Prioritas: UPLOADS_DIR (foto upload admin) → fallback dist/client/assets/products/
 * (foto bawaan hasil build, dipakai saat DB di-seed tanpa upload foto terpisah).
 * Nama file selalu <slug>-<n>.jpg — basename saja, tak ada sub-folder.
 */
import type { APIRoute } from 'astro';
import path from 'node:path';
import { stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { Readable } from 'node:stream';
import { UPLOADS_DIR } from '../../lib/images';
import { env } from '../../lib/env';

export const prerender = false;

const TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

// foto bawaan hasil build — lokasi absolut dari app.mjs (CLIENT_DIR), fallback ke cwd
const APP_ROOT = env('APP_ROOT') || process.cwd();
const CLIENT_DIR = env('CLIENT_DIR') || path.resolve(APP_ROOT, 'dist/client');
const FALLBACK_DIRS = [
  path.join(CLIENT_DIR, 'assets/products'),
  path.resolve(APP_ROOT, 'public/assets/products'),
];

async function tryServe(full: string, contentType: string, head: boolean, range: string | null): Promise<Response | null> {
  try {
    const s = await stat(full);
    if (!s.isFile()) return null;
    let start = 0;
    let end = s.size - 1;
    const partial = !head && range !== null;
    if (partial) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(range!);
      if (!match || (!match[1] && !match[2])) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${s.size}` } });
      if (!match[1]) start = Math.max(0, s.size - Number(match[2]));
      else { start = Number(match[1]); if (match[2]) end = Math.min(end, Number(match[2])); }
      if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start > end || start >= s.size || (match[1] === '' && Number(match[2]) === 0)) return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${s.size}` } });
    }
    const headers: Record<string, string> = {
        'Content-Type': contentType,
        'Content-Length': String(Math.max(0, end - start + 1)),
        'Accept-Ranges': 'bytes',
        // Upload and reorder reuse filenames, so stale photos must not remain cached.
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'Last-Modified': s.mtime.toUTCString(),
      };
    if (partial) headers['Content-Range'] = `bytes ${start}-${end}/${s.size}`;
    return new Response(head || s.size === 0 ? null : Readable.toWeb(createReadStream(full, { start, end })) as ReadableStream, {
      status: partial ? 206 : 200,
      headers,
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    console.error('[uploads] Unable to read product photo:', error);
    return new Response('Unable to load image', { status: 500 });
  }
}

export const GET: APIRoute = async ({ params, request }) => {
  const name = params.file || '';
  const ext = path.extname(name).toLowerCase();
  if (!name || !TYPES[ext] || name.includes('..') || name.includes('/') || name.includes('\\') || name.includes('\0')) return new Response('Not found', { status: 404 });

  const head = request.method === 'HEAD';
  let res = await tryServe(path.join(UPLOADS_DIR, name), TYPES[ext], head, request.headers.get('range'));
  for (const dir of TYPES[ext].startsWith('video/') ? [] : FALLBACK_DIRS) {
    if (res) break;
    res = await tryServe(path.join(dir, name), TYPES[ext], head, request.headers.get('range'));
  }
  return res || new Response('Not found', { status: 404 });
};

export const HEAD = GET;
