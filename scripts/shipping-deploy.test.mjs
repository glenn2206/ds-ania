import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

test('cPanel migrates shipping after backup/build and before switching application', () => {
  const script = readFileSync(new URL('./cpanel-deploy.sh', import.meta.url), 'utf8');
  const backup = script.indexOf('scripts/cpanel-backup-database.mjs');
  const build = script.indexOf('npm run build');
  const migrate = script.indexOf('scripts/db-shipping.mjs');
  const replace = script.indexOf('mv "$APP_DIR/dist.next"');
  assert.ok(backup >= 0 && build > backup && migrate > build && replace > migrate);
  assert.match(script, /set -Eeuo pipefail/);
  assert.match(script, /db-shipping\.mjs" --passenger/);
});
