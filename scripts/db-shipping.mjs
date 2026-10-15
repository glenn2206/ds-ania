import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { parsePassengerEnvironment } from './cpanel-backup-database.mjs';
const vars = process.argv.includes('--passenger')
  ? parsePassengerEnvironment(readFileSync(process.env.PASSENGER_CONFIG_PATH || '/home/myaniaco/public_html/.htaccess', 'utf8'))
  : process.env;
if (!vars.DB_USER || !vars.DB_NAME) throw new Error('Database configuration is incomplete; deployment stopped.');
const mysql = vars.DB_CLIENT === 'mysql';
const cfg = { host: vars.DB_HOST || '127.0.0.1', port: Number(vars.DB_PORT || (mysql ? 3306 : 5432)), user: vars.DB_USER, password: vars.DB_PASS, database: vars.DB_NAME };
const sql = readFileSync(new URL(mysql ? '../db/shipping.sql' : '../db/shipping.pg.sql', import.meta.url), 'utf8');
if (mysql) {
  const db = await (await import('mysql2/promise')).createConnection(cfg);
  try { await db.query(sql); } finally { await db.end(); }
} else {
  const db = new (await import('pg')).default.Client(cfg);
  await db.connect();
  try {
    await db.query(sql);
    const { rows } = await db.query("SELECT has_table_privilege(current_user,'order_shipments','SELECT') AS can_select, has_table_privilege(current_user,'order_shipments','INSERT') AS can_insert, has_table_privilege(current_user,'order_shipments','UPDATE') AS can_update");
    if (!rows[0]?.can_select || !rows[0]?.can_insert || !rows[0]?.can_update)
      throw new Error('Runtime user needs SELECT, INSERT and UPDATE on order_shipments; deployment stopped.');
  } finally { await db.end(); }
}
console.log('order_shipments migration OK (no existing orders modified).');
