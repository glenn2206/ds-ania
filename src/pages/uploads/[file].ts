/**
 * GET /uploads/<file> — sajikan foto produk.
 * Prioritas: UPLOADS_DIR (foto upload admin) → fallback dist/client/assets/products/
 * (foto bawaan hasil build, dipakai saat DB di-seed tanpa upload foto terpisah).
 * Nama file selalu <slug>-<n>.jpg — basename saja, tak ada sub-folder.
 */
import type { APIRoute } from 'astro';
import path from 'node:path';
import { stat, readFile } from 'node:fs/promises';
import { UPLOADS_DIR } from '../../lib/images';
import { env } from '../../lib/env';

export const prerender = false;

const TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

// foto bawaan hasil build — lokasi absolut dari app.mjs (CLIENT_DIR), fallback ke cwd
const APP_ROOT = env('APP_ROOT') || process.cwd();
const CLIENT_DIR = env('CLIENT_DIR') || path.resolve(APP_ROOT, 'dist/client');
const FALLBACK_DIRS = [
  path.join(CLIENT_DIR, 'assets/products'),
  path.resolve(APP_ROOT, 'public/assets/products'),
];

async function tryServe(full: string, contentType: string, head: boolean): Promise<Response | null> {
  try {
    const s = await stat(full);
    if (!s.isFile()) return null;
    const buf = await readFile(full);
    return new Response(head ? null : new Uint8Array(buf), {
      headers: {
        'Content-Type': contentType,
        'Content-Length': String(s.size),
        // Upload and reorder reuse filenames, so stale photos must not remain cached.
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'Last-Modified': s.mtime.toUTCString(),
      },
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
  let res = await tryServe(path.join(UPLOADS_DIR, name), TYPES[ext], head);
  for (const dir of FALLBACK_DIRS) {
    if (res) break;
    res = await tryServe(path.join(dir, name), TYPES[ext], head);
  }
  return res || new Response('Not found', { status: 404 });
};

export const HEAD = GET;
