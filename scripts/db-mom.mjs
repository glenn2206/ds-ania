import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { parsePassengerEnvironment } from './cpanel-backup-database.mjs';
const vars = process.argv.includes('--passenger')
  ? parsePassengerEnvironment(readFileSync(process.env.PASSENGER_CONFIG_PATH || '/home/myaniaco/public_html/.htaccess', 'utf8')) : process.env;
if (!vars.DB_USER || !vars.DB_NAME) throw new Error('Database configuration incomplete.');
const mysql = vars.DB_CLIENT === 'mysql';
const cfg = { host: vars.DB_HOST || '127.0.0.1', port: Number(vars.DB_PORT || (mysql ? 3306 : 5432)), user: vars.DB_USER, password: vars.DB_PASS, database: vars.DB_NAME };
const sql = readFileSync(new URL(mysql ? '../db/mom.sql' : '../db/mom.pg.sql', import.meta.url), 'utf8');
async function pauseCheckoutOnce(db) {
  await db.query('BEGIN');
  try {
    const result = await db.query("SELECT skey FROM site_settings WHERE skey='mom_checkout_pause_v1'");
    const rows = mysql ? result[0] : result.rows;
    if (!rows.length) {
      await db.query("DELETE FROM site_settings WHERE skey='checkout_enabled'");
      await db.query("INSERT INTO site_settings (skey,svalue) VALUES ('checkout_enabled','0')");
      await db.query("INSERT INTO site_settings (skey,svalue) VALUES ('mom_checkout_pause_v1','1')");
    }
    await db.query('COMMIT');
  } catch (error) { await db.query('ROLLBACK'); throw error; }
}
if (mysql) {
  const db = await (await import('mysql2/promise')).createConnection({ ...cfg, multipleStatements: true });
  try { await db.query(sql); await pauseCheckoutOnce(db); } finally { await db.end(); }
} else {
  const db = new (await import('pg')).default.Client(cfg); await db.connect();
  try { await db.query(sql); await pauseCheckoutOnce(db); } finally { await db.end(); }
}
console.log('MOM schema ready. One-time checkout pause applied if not already recorded. No orders changed.');
