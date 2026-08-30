/**
 * GET  /api/admin/settings  → pengaturan situs saat ini (bar promo).
 * PUT  /api/admin/settings  → simpan bar promo. Body JSON:
 *      { promo: { enabled: boolean, text: string, cta: string, href: string } }
 */
import { withAdmin, jsonResponse } from '../../../lib/admin';
import { getPromo, savePromo, type PromoSettings } from '../../../lib/settings';

export const prerender = false;

export const GET = withAdmin(async () => {
  return jsonResponse({ promo: await getPromo() });
});

export const PUT = withAdmin(async ({ request }) => {
  const body = (await request.json().catch(() => ({}))) as { promo?: Partial<PromoSettings> };
  const p = body.promo ?? {};

  const text = String(p.text ?? '').trim();
  const cta = String(p.cta ?? '').trim();
  let href = String(p.href ?? '').trim() || '/shop';
  // hanya path internal atau URL http(s) penuh — cegah javascript: dll.
  if (!/^\/[^\s]*$/.test(href) && !/^https?:\/\//i.test(href)) href = '/shop';

  const enabled = p.enabled === true || p.enabled === 'true' || p.enabled === 1 || p.enabled === '1';

  if (enabled && !text && !cta) {
    return jsonResponse({ error: 'Isi minimal teks atau tombol promo.' }, 400);
  }

  await savePromo({ enabled, text, cta, href });
  return jsonResponse({ ok: true, promo: await getPromo() });
});
