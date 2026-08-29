/**
 * POST /api/admin/deploy — picu GitHub Actions (repository_dispatch "publish")
 * untuk build + deploy ulang situs. Berguna setelah update KODE (konten produk
 * sudah live tanpa deploy).
 *
 * Butuh env:  GITHUB_REPO=owner/nama  ·  GITHUB_DEPLOY_TOKEN=<PAT contents:write>
 */
import { withAdmin, jsonResponse } from '../../../lib/admin';
import { env } from '../../../lib/env';

export const prerender = false;

export const POST = withAdmin(async () => {
  const repo = env('GITHUB_REPO');
  const token = env('GITHUB_DEPLOY_TOKEN');
  if (!repo || !token)
    return jsonResponse({ error: 'Deploy otomatis belum dikonfigurasi (GITHUB_REPO / GITHUB_DEPLOY_TOKEN).' }, 400);

  const res = await fetch(`https://api.github.com/repos/${repo}/dispatches`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'ania-cms',
    },
    body: JSON.stringify({ event_type: 'publish' }),
  });
  if (!res.ok) {
    const t = await res.text();
    return jsonResponse({ error: `GitHub ${res.status}: ${t.slice(0, 200)}` }, 502);
  }
  return jsonResponse({ ok: true, note: 'Deploy dijalankan. Cek tab Actions di GitHub (~1–2 menit).' });
});
