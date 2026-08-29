/**
 * cms/lib/deployGuard.js — pagar pengaman "jangan otak-atik production".
 * Worker WAJIB memanggil assertSafeDeployDir(DEPLOY_DIR) sebelum rsync/hapus apa pun.
 */
import path from 'node:path';
import os from 'node:os';

export function assertSafeDeployDir(dir) {
  if (!dir) throw new Error('DEPLOY_DIR belum diset di cms/.env');
  const resolved = path.resolve(dir);
  const home = os.homedir();

  // (a) harus di dalam home user
  if (!(resolved === home || resolved.startsWith(home + path.sep))) {
    throw new Error(`ditolak: DEPLOY_DIR "${resolved}" di luar home (${home})`);
  }
  // (b) tidak boleh mengandung segmen "public_html" (docroot produksi)
  const segs = resolved.split(/[\\/]+/);
  if (segs.includes('public_html')) {
    throw new Error(`ditolak: DEPLOY_DIR mengandung "public_html" — itu docroot produksi`);
  }
  // (c) bukan home itu sendiri / bukan hanya 1 level di bawah root
  if (resolved === home || segs.length < 3) {
    throw new Error(`ditolak: DEPLOY_DIR terlalu di atas ("${resolved}")`);
  }
  return resolved;
}
