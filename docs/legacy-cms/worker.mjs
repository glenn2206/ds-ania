/**
 * cms/worker.mjs — dijalankan berkala (cron di cPanel; manual/loop saat lokal):
 *   cPanel:  * * * * *  cd ~/ania-cms && ~/nodevenv/ania-cms/20/bin/node worker.mjs >> ~/ania-cms/worker.log 2>&1
 *   lokal:   node worker.mjs        (jalankan tiap kali klik Publish, atau: while true; do node worker.mjs; sleep 5; done)
 *
 * Ambil 1 job 'queued' → BUILD_CMD di SITE_DIR → salin dist/ → DEPLOY_DIR (copy, bukan rsync).
 * Guard: DEPLOY_DIR wajib di dalam ~/ dan BUKAN public_html (cms/lib/deployGuard.js).
 * Lock file mencegah 2 build barengan.
 */
import 'dotenv/config';
import { spawn } from 'node:child_process';
import { existsSync, writeFileSync, unlinkSync } from 'node:fs';
import { rm, mkdir, cp, readdir } from 'node:fs/promises';
import path from 'node:path';
import { q, end } from './db.js';
import { assertSafeDeployDir } from './lib/deployGuard.js';

const LOCK = path.resolve('.worker.lock');
const SITE_DIR = process.env.SITE_DIR;
const DEPLOY_DIR = process.env.DEPLOY_DIR;
const BUILD_CMD = process.env.BUILD_CMD || 'npm run build';

function run(cmd, cwd, onData) {
  return new Promise((resolve) => {
    const p = spawn(cmd, { cwd, env: process.env, shell: true });
    let out = '';
    const add = (d) => { out += d; onData?.(d.toString()); };
    p.stdout.on('data', add);
    p.stderr.on('data', add);
    p.on('close', (code) => resolve({ code, out }));
    p.on('error', (e) => resolve({ code: 1, out: out + '\n' + e.message }));
  });
}

/** kosongkan isi target (bukan foldernya), lalu salin isi src ke dalamnya */
async function deployCopy(srcDir, destDir) {
  await mkdir(destDir, { recursive: true });
  for (const entry of await readdir(destDir)) {
    await rm(path.join(destDir, entry), { recursive: true, force: true });
  }
  for (const entry of await readdir(srcDir)) {
    await cp(path.join(srcDir, entry), path.join(destDir, entry), { recursive: true });
  }
}

async function main() {
  if (existsSync(LOCK)) return;
  const busy = await q("SELECT id FROM jobs WHERE status = 'running' LIMIT 1");
  if (busy.length) return;
  const [job] = await q("SELECT id FROM jobs WHERE status = 'queued' ORDER BY id LIMIT 1");
  if (!job) return;

  writeFileSync(LOCK, String(process.pid));
  let log = '';
  const push = async (s) => {
    log += s;
    await q('UPDATE jobs SET log = ? WHERE id = ?', [log.slice(-60000), job.id]);
  };

  try {
    await q("UPDATE jobs SET status='running', started_at=NOW(), log='' WHERE id=?", [job.id]);
    await push(`[${new Date().toISOString()}] mulai publish\n`);

    if (!SITE_DIR || !existsSync(SITE_DIR)) throw new Error(`SITE_DIR tidak ada: ${SITE_DIR}`);
    const safeDeploy = assertSafeDeployDir(DEPLOY_DIR); // ← lempar kalau public_html / di luar home
    await push(`SITE_DIR=${SITE_DIR}\nDEPLOY_DIR=${safeDeploy}\n\n`);

    await push(`$ ${BUILD_CMD}  (cwd: ${SITE_DIR})\n`);
    const b = await run(BUILD_CMD, SITE_DIR, push);
    if (b.code !== 0) throw new Error(`build gagal (exit ${b.code})`);

    const distDir = path.join(SITE_DIR, 'dist');
    if (!existsSync(distDir)) throw new Error('dist/ tidak terbentuk');

    await push(`\nmenyalin dist/ → ${safeDeploy}/ …\n`);
    await deployCopy(distDir, safeDeploy);

    await push(`\n[selesai] situs DEV ter-update.\n`);
    await q("UPDATE jobs SET status='done', finished_at=NOW() WHERE id=?", [job.id]);
  } catch (e) {
    await push(`\n[ERROR] ${e.message}\n`);
    await q("UPDATE jobs SET status='error', finished_at=NOW() WHERE id=?", [job.id]);
  } finally {
    try { unlinkSync(LOCK); } catch {}
    await end();
  }
}

main();
