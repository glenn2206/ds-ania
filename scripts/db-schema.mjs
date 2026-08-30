/**
 * scripts/db-schema.mjs — buat/segarkan tabel dari db/schema.*.sql
 *   node scripts/db-schema.mjs            (baca DB_CLIENT dari .env)
 *   node scripts/db-schema.mjs --drop     (DROP tabel dulu — HATI-HATI, hapus semua data)
 *
 * PostgreSQL: butuh database-nya sudah ada
 *   psql -U postgres -c "CREATE DATABASE ania;"
 */
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const CLIENT = (process.env.DB_CLIENT || 'pg').toLowerCase() === 'mysql' ? 'mysql' : 'pg';
const drop = process.argv.includes('--drop');
const cfg = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || (CLIENT === 'pg' ? 5432 : 3306)),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

const DROP_SQL = `
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS site_settings;
DROP TABLE IF EXISTS users;
`;

const file = CLIENT === 'pg' ? 'schema.pg.sql' : 'schema.sql';
const sql = readFileSync(path.resolve('db', file), 'utf8');

if (CLIENT === 'pg') {
  const pg = (await import('pg')).default;
  const client = new pg.Client(cfg);
  await client.connect();
  if (drop) await client.query(DROP_SQL);
  await client.query(sql);
  await client.end();
} else {
  const mysql = await import('mysql2/promise');
  const conn = await mysql.createConnection({ ...cfg, multipleStatements: true });
  if (drop) await conn.query(DROP_SQL);
  await conn.query(sql);
  await conn.end();
}
console.log(`db-schema: ${CLIENT} · ${file}${drop ? ' (setelah DROP)' : ''} — OK`);
