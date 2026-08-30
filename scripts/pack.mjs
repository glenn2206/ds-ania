/**
 * scripts/pack.mjs — bikin arsip untuk upload manual ke cPanel (File Manager → Extract).
 *
 *   npm run build      # WAJIB dulu — menghasilkan dist/
 *   npm run pack        # → ania-app.tgz  (dan ania-app.zip kalau bisa)
 *
 * Isi: dist/ app.mjs package.json package-lock.json db/ scripts/
 *      src/data/products.generated.json
 * TIDAK termasuk: node_modules (di-install di server via "Run NPM Install"),
 *                 .env (isi lewat UI Environment Variables), uploads/, .git/
 */
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

if (!existsSync('dist/server/entry.mjs')) {
  console.error('dist/ belum ada — jalankan `npm run build` dulu.');
  process.exit(1);
}

const items = [
  'dist',
  'app.mjs',
  'package.json',
  'package-lock.json',
  'db',
  'scripts',
  'src/data/products.generated.json',
];

const run = (cmd, args) => spawnSync(cmd, args, { stdio: 'inherit', shell: false });

// tar.gz — didukung File Manager cPanel ("Extract")
const tar = run('tar', ['-czf', 'ania-app.tgz', ...items]);
if (tar.status === 0) console.log('✓ ania-app.tgz');
else console.error('tar gagal (status ' + tar.status + ')');

// zip — kalau ada utilitas zip / PowerShell
let zipped = false;
if (run('zip', ['-rq', 'ania-app.zip', ...items]).status === 0) zipped = true;
else if (process.platform === 'win32') {
  const ps = run('powershell', [
    '-NoProfile',
    '-Command',
    `Compress-Archive -Force -Path ${items.map((i) => `'${i}'`).join(',')} -DestinationPath 'ania-app.zip'`,
  ]);
  zipped = ps.status === 0;
}
console.log(zipped ? '✓ ania-app.zip' : '(zip dilewati — pakai ania-app.tgz)');
console.log('\nUpload file itu ke ~/ania-app/ di cPanel File Manager, lalu Extract.');
