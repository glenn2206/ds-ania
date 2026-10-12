import { readFile, writeFile, mkdir, rename, unlink, chmod } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function parsePassengerEnvironment(config) {
  const vars = {};
  for (const line of config.split(/\r?\n/)) {
    const match = line.match(/^\s*SetEnv\s+(\w+)\s+(.+?)\s*$/);
    if (!match) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    vars[match[1]] = value.replace(/\\(["'\\])/g, '$1');
  }
  return vars;
}

async function main() {
// Read the existing Passenger environment; never copy credentials into the dump or logs.
const configPath = process.env.PASSENGER_CONFIG_PATH ||
  '/home/myaniaco/public_html/.htaccess';
const backupDir = process.env.BACKUP_DIR || '/home/myaniaco/ania-backups';
const date = process.argv[2] || new Date().toISOString().slice(0, 10);
if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Invalid backup date');
const suffix = process.argv[3] || '';
if (suffix && !/^[a-zA-Z0-9-]{1,64}$/.test(suffix)) throw new Error('Invalid backup suffix');
const config = await readFile(configPath, 'utf8');
const vars = parsePassengerEnvironment(config);
for (const key of ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASS', 'DB_NAME']) {
  if (!vars[key]) throw new Error(`Missing ${key} in Passenger configuration`);
}
if (vars.DB_CLIENT !== 'pg') throw new Error('PostgreSQL backup only');
await mkdir(backupDir, { recursive: true, mode: 0o700 });
await chmod(backupDir, 0o700);
const basename = `ania-testing-database-${date}${suffix ? `-${suffix}` : ''}`;
const target = path.join(backupDir, `${basename}.sql.gz`);
const temporary = path.join(backupDir, `${basename}.sql.tmp`);
try {
  const result = spawnSync('pg_dump', ['--no-password', '--no-owner', '--no-acl',
    '--host', vars.DB_HOST, '--port', vars.DB_PORT, '--username', vars.DB_USER,
    '--dbname', vars.DB_NAME, '--format=plain', '--file', temporary], {
    env: { ...process.env, PGPASSWORD: vars.DB_PASS }, encoding: 'utf8', timeout: 120000,
  });
  if (result.error || result.status !== 0) {
    console.error(result.error?.message || result.stderr.trim());
    throw new Error('Database backup failed; no valid backup has been published');
  }
  const sql = await readFile(temporary);
  if (!sql.toString().includes('CREATE TABLE') || !sql.toString().includes('COPY public.products'))
    throw new Error('Database dump does not include expected structure and catalog data');
  await writeFile(`${target}.next`, gzipSync(sql), { mode: 0o600 });
  await rename(`${target}.next`, target);
  console.log(`Database backup verified: ${target} (${sql.length} SQL bytes)`);
} finally {
  await unlink(temporary).catch(() => {});
}
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href)
  await main();
