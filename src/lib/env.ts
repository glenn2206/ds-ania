/**
 * env.ts — akses variabel lingkungan yang seragam server-side.
 *
 * Di produksi (adapter Node) → `process.env` (di-set lewat cPanel "Setup Node.js App"
 * atau `app.mjs` yang memuat .env). Saat `astro dev` / `astro build` → `import.meta.env`
 * (Vite memuat file .env). Fungsi ini menutupi keduanya.
 */
const meta = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

export function env(key: string, fallback = ''): string {
  const v = process.env[key] ?? meta[key];
  return v == null || v === '' ? fallback : String(v);
}

export function envInt(key: string, fallback: number): number {
  const n = parseInt(env(key, ''), 10);
  return Number.isFinite(n) ? n : fallback;
}

export const isProd = env('NODE_ENV') === 'production' || Boolean(process.env.PORT);
