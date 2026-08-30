/**
 * settings.ts — pengaturan situs key/value (tabel `site_settings`) yang bisa
 * diubah dari panel admin. Saat ini: bar promo di atas navbar.
 *
 * Dibaca oleh Navbar.astro tiap render (cache 60 dtk, sama pola dg lib/products.ts).
 * Ditulis oleh /api/admin/settings. Kalau DB belum siap → pakai DEFAULT_PROMO.
 */
import { q, tx, isConfigured } from './db';

export interface PromoSettings {
  enabled: boolean;
  text: string;
  cta: string;
  href: string;
}

export const DEFAULT_PROMO: PromoSettings = {
  enabled: true,
  text: 'Mother’s Day Graduation Sale',
  cta: '25% Off! Shop Now',
  href: '/shop',
};

const PROMO_KEYS = ['promo_enabled', 'promo_text', 'promo_cta', 'promo_href'] as const;

const TTL = 60_000;
let cache: { at: number; data: PromoSettings } | null = null;

export function invalidatePromo() {
  cache = null;
}

export async function getPromo(): Promise<PromoSettings> {
  if (cache && Date.now() - cache.at < TTL) return cache.data;

  const data: PromoSettings = { ...DEFAULT_PROMO };
  if (isConfigured()) {
    try {
      const rows = await q(`SELECT skey, svalue FROM site_settings WHERE skey LIKE 'promo_%'`);
      const m = Object.fromEntries(rows.map((r) => [r.skey, r.svalue as string]));
      if ('promo_enabled' in m) data.enabled = m.promo_enabled === '1';
      if (m.promo_text) data.text = m.promo_text;
      if (m.promo_cta) data.cta = m.promo_cta;
      if (m.promo_href) data.href = m.promo_href;
    } catch {
      /* tabel belum dibuat / DB down → diamkan, pakai default */
    }
  }

  cache = { at: Date.now(), data };
  return data;
}

/** Simpan (upsert lintas pg/mysql via delete+insert dalam satu transaksi). */
export async function savePromo(p: PromoSettings): Promise<void> {
  const rows: [string, string][] = [
    ['promo_enabled', p.enabled ? '1' : '0'],
    ['promo_text', p.text.trim()],
    ['promo_cta', p.cta.trim()],
    ['promo_href', p.href.trim() || '/shop'],
  ];
  await tx(async (t) => {
    await t.q(`DELETE FROM site_settings WHERE skey IN (?, ?, ?, ?)`, [...PROMO_KEYS]);
    for (const [k, v] of rows) {
      await t.q(`INSERT INTO site_settings (skey, svalue) VALUES (?, ?)`, [k, v]);
    }
  });
  invalidatePromo();
}
