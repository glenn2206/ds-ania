import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import react from '@astrojs/react';

const configuredSite = process.env.PUBLIC_SITE_URL?.trim() || 'http://localhost:4321';
let site = 'http://localhost:4321';

try {
  site = new URL(configuredSite).toString();
} catch {
  console.warn(`[config] Ignoring invalid PUBLIC_SITE_URL: ${JSON.stringify(configuredSite)}`);
}

/**
 * Satu app: Astro SSR (adapter Node standalone) + React untuk panel admin.
 *
 * - `output: 'server'` → semua halaman SSR by default (konten produk selalu live dari DB).
 * - Halaman marketing statik (`/about`, `/faq`, `/terms`, `/contact`) pakai
 *   `export const prerender = true` di masing-masing file.
 * - Build → `dist/server/entry.mjs` (dijalankan `app.mjs`) + `dist/client/` (aset statik,
 *   ikut disajikan oleh server standalone).
 */
export default defineConfig({
  site,
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [react()],
  vite: {
    // paket native / CJS — jangan di-bundle ke server output
    ssr: { external: ['sharp', 'pg', 'pg-native', 'mysql2', 'bcryptjs'] },
  },
});
