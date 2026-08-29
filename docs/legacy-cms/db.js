/**
 * cms/db.js — satu lapis DB untuk MySQL (cPanel) & PostgreSQL (lokal / opsional).
 *
 *   DB_CLIENT = mysql | pg     (default: tebak dari DATABASE_URL, fallback mysql)
 *
 * API:
 *   q(sql, params)      → array of rows      (placeholder pakai '?' — otomatis jadi $1.. utk pg)
 *   insert(sql, params) → { insertId }       (pg: otomatis tambah RETURNING id)
 *   end()               → tutup pool
 *   CLIENT              → 'mysql' | 'pg'
 */
import 'dotenv/config';

export const CLIENT =
  (process.env.DB_CLIENT ||
    (/^postgres/.test(process.env.DATABASE_URL || '') ? 'pg' : 'mysql')).toLowerCase();

const cfg = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || (CLIENT === 'pg' ? 5432 : 3306)),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

let _pg = null;
let _mysql = null;

async function pgPool() {
  if (_pg) return _pg;
  const { default: pg } = await import('pg');
  _pg = new pg.Pool({ ...cfg, max: 5 });
  return _pg;
}
async function mysqlPool() {
  if (_mysql) return _mysql;
  const mysql = await import('mysql2/promise');
  _mysql = mysql.createPool({
    ...cfg,
    waitForConnections: true,
    connectionLimit: 5,
    charset: 'utf8mb4',
  });
  return _mysql;
}

/** '?' → '$1','$2',… (aman: SQL di CMS ini tak punya '?' di dalam string literal) */
function toPg(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

export async function q(sql, params = []) {
  if (CLIENT === 'pg') {
    const pool = await pgPool();
    const { rows } = await pool.query(toPg(sql), params);
    return rows;
  }
  const pool = await mysqlPool();
  const [rows] = await pool.query(sql, params);
  return rows;
}

export async function insert(sql, params = []) {
  if (CLIENT === 'pg') {
    const pool = await pgPool();
    const finalSql = /returning/i.test(sql) ? sql : `${sql.replace(/;?\s*$/, '')} RETURNING id`;
    const { rows } = await pool.query(toPg(finalSql), params);
    return { insertId: rows[0]?.id };
  }
  const pool = await mysqlPool();
  const [res] = await pool.query(sql, params);
  return { insertId: res.insertId };
}

export async function end() {
  if (_pg) await _pg.end();
  if (_mysql) await _mysql.end();
}
