/** scripts/_db.mjs — cermin ringan src/lib/db.ts untuk skrip Node (tanpa tsx). */
import 'dotenv/config';

export const CLIENT = (process.env.DB_CLIENT || 'pg').toLowerCase() === 'mysql' ? 'mysql' : 'pg';
const cfg = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || (CLIENT === 'pg' ? 5432 : 3306)),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
};

let _pg = null;
let _mysql = null;
async function pool() {
  if (CLIENT === 'pg') {
    if (!_pg) {
      const pg = (await import('pg')).default;
      _pg = new pg.Pool({ ...cfg, max: 4 });
    }
    return _pg;
  }
  if (!_mysql) {
    const mysql = await import('mysql2/promise');
    _mysql = mysql.createPool({ ...cfg, connectionLimit: 4, charset: 'utf8mb4' });
  }
  return _mysql;
}
const toPg = (sql) => {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
};

export async function q(sql, params = []) {
  const p = await pool();
  if (CLIENT === 'pg') {
    const { rows } = await p.query(toPg(sql), params);
    return rows;
  }
  const [rows] = await p.query(sql, params);
  return rows;
}
export async function insert(sql, params = []) {
  const p = await pool();
  if (CLIENT === 'pg') {
    const finalSql = /returning/i.test(sql) ? sql : `${sql.replace(/;?\s*$/, '')} RETURNING id`;
    const { rows } = await p.query(toPg(finalSql), params);
    return { insertId: rows[0]?.id };
  }
  const [res] = await p.query(sql, params);
  return { insertId: res.insertId };
}
export async function end() {
  if (_pg) await _pg.end();
  if (_mysql) await _mysql.end();
}
