/**
 * app.mjs — entry produksi. Ini yang dijalankan:
 *   - lokal : `npm start`
 *   - cPanel: "Setup Node.js App" → Application startup file = app.mjs
 *
 * Memuat .env ke process.env lalu menyalakan server SSR hasil `astro build`
 * (adapter Node standalone → dist/server/entry.mjs, dengar di process.env.PORT).
 */
import 'dotenv/config';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Passenger kadang menjalankan app dengan cwd berbeda → simpan lokasi absolut
// folder build supaya route /uploads bisa fallback ke foto bawaan.
process.env.APP_ROOT = fileURLToPath(new URL('.', import.meta.url));
process.env.CLIENT_DIR = fileURLToPath(new URL('./dist/client', import.meta.url));

const entry = new URL('./dist/server/entry.mjs', import.meta.url);
if (!existsSync(entry)) {
  console.error('dist/server/entry.mjs tidak ada — jalankan `npm run build` dulu.');
  process.exit(1);
}
await import(entry.href);
