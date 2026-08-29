/**
 * db.ts — satu lapis DB untuk PostgreSQL (lokal & cPanel) dan MySQL (cPanel).
 *
 *   DB_CLIENT = pg | mysql        (default: pg)
 *
 * API:
 *   q(sql, params)       → array of rows       (placeholder '?' → otomatis $1.. untuk pg)
 *   one(sql, params)     → row pertama | null
 *   insert(sql, params)  → { insertId }        (pg: otomatis tambah RETURNING id bila perlu)
 *   tx(fn)               → transaksi (fn menerima { q, insert })
 *   isConfigured()       → true jika env DB lengkap
 *
 * Catatan pg: COUNT()/agregat balik sebagai string → selalu Number() sebelum aritmetika.
 */
import { env, envInt } from './env';

export const CLIENT = (env('DB_CLIENT', 'pg').toLowerCase() === 'mysql' ? 'mysql' : 'pg') as
  | 'pg'
  | 'mysql';

const cfg = {
  host: env('DB_HOST', '127.0.0.1'),
  port: envInt('DB_PORT', CLIENT === 'pg' ? 5432 : 3306),
  user: env('DB_USER'),
  password: env('DB_PASS'),
  database: env('DB_NAME'),
};

export function isConfigured(): boolean {
  return Boolean(cfg.user && cfg.database);
}

type Row = Record<string, any>;
export interface Querier {
  q: (sql: string, params?: any[]) => Promise<Row[]>;
  insert: (sql: string, params?: any[]) => Promise<{ insertId: number | undefined }>;
}

let _pg: any = null;
let _mysql: any = null;

async function pgPool() {
  if (_pg) return _pg;
  const pg = (await import('pg')).default;
  _pg = new pg.Pool({ ...cfg, max: 5, idleTimeoutMillis: 30_000 });
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

/** '?' → '$1','$2',… (SQL di app ini tidak punya '?' di dalam string literal) */
function toPg(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

async function runQuery(exec: any, sql: string, params: any[]): Promise<Row[]> {
  if (CLIENT === 'pg') {
    const { rows } = await exec.query(toPg(sql), params);
    return rows;
  }
  const [rows] = await exec.query(sql, params);
  return rows as Row[];
}

async function runInsert(exec: any, sql: string, params: any[]) {
  if (CLIENT === 'pg') {
    const finalSql = /returning/i.test(sql) ? sql : `${sql.replace(/;?\s*$/, '')} RETURNING id`;
    const { rows } = await exec.query(toPg(finalSql), params);
    return { insertId: rows[0]?.id as number | undefined };
  }
  const [res]: any = await exec.query(sql, params);
  return { insertId: res.insertId as number | undefined };
}

async function pool() {
  return CLIENT === 'pg' ? pgPool() : mysqlPool();
}

export async function q(sql: string, params: any[] = []): Promise<Row[]> {
  return runQuery(await pool(), sql, params);
}

export async function one(sql: string, params: any[] = []): Promise<Row | null> {
  const rows = await q(sql, params);
  return rows[0] ?? null;
}

export async function insert(sql: string, params: any[] = []) {
  return runInsert(await pool(), sql, params);
}

/** Transaksi. `fn` dipanggil dengan { q, insert } yang terikat ke koneksi transaksi. */
export async function tx<T>(fn: (t: Querier) => Promise<T>): Promise<T> {
  const p = await pool();
  if (CLIENT === 'pg') {
    const client = await p.connect();
    try {
      await client.query('BEGIN');
      const t: Querier = {
        q: (sql, params = []) => runQuery(client, sql, params),
        insert: (sql, params = []) => runInsert(client, sql, params),
      };
      const out = await fn(t);
      await client.query('COMMIT');
      return out;
    } catch (e) {
      await client.query('ROLLBACK').catch(() => {});
      throw e;
    } finally {
      client.release();
    }
  }
  const conn = await p.getConnection();
  try {
    await conn.beginTransaction();
    const t: Querier = {
      q: (sql, params = []) => runQuery(conn, sql, params),
      insert: (sql, params = []) => runInsert(conn, sql, params),
    };
    const out = await fn(t);
    await conn.commit();
    return out;
  } catch (e) {
    await conn.rollback().catch(() => {});
    throw e;
  } finally {
    conn.release();
  }
}

export async function end() {
  if (_pg) await _pg.end();
  if (_mysql) await _mysql.end();
  _pg = _mysql = null;
}
