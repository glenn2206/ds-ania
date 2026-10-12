import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parsePassengerEnvironment } from './cpanel-backup-database.mjs';

test('Passenger backup reads existing unquoted and quoted environment directives', () => {
  const vars = parsePassengerEnvironment('SetEnv DB_CLIENT pg\r\n  SetEnv DB_HOST "127.0.0.1"\r\nSetEnv DB_NAME \'fixture_db\'\nSetEnv DB_PASS "dummy password+@()"\n');
  assert.deepEqual(vars, { DB_CLIENT: 'pg', DB_HOST: '127.0.0.1', DB_NAME: 'fixture_db', DB_PASS: 'dummy password+@()' });
});

test('Passenger backup preserves escaped quotes and ignores unrelated configuration', () => {
  const vars = parsePassengerEnvironment('# SetEnv DB_PASS ignored\nPassengerAppRoot "/home/example/app"\nSetEnv DB_PASS "dummy\\\"quote\\\\slash"\nSetEnv DB_PORT 5432\n');
  assert.deepEqual(vars, { DB_PASS: 'dummy"quote\\slash', DB_PORT: '5432' });
});
