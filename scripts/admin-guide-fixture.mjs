import 'dotenv/config';
import assert from 'node:assert/strict';
import pg from 'pg';

assert.equal(process.env.DB_HOST, '127.0.0.1', 'Documentation fixtures are local only.');
const client = new pg.Client({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT), user: process.env.DB_USER, password: process.env.DB_PASS, database: process.env.DB_NAME });
await client.connect();
const code = 'SOP-DEMO-DOCUMENTATION';
try {
  if (process.argv[2] === 'remove') {
    await client.query('DELETE FROM orders WHERE code=$1 AND customer_name=$2', [code, 'Pelanggan Contoh SOP']);
    console.log('Documentation fixture removed.');
  } else if (process.argv[2] === 'create') {
    const existing = await client.query('SELECT id FROM orders WHERE code=$1', [code]);
    if (existing.rows.length) throw new Error('Fixture already exists; remove it first.');
    await client.query('BEGIN');
    const result = await client.query(`INSERT INTO orders (code,status,customer_name,customer_phone,customer_email,ship_address,courier,courier_service,shipping_cost,subtotal,total,note)
      VALUES ($1,'pending','Pelanggan Contoh SOP','0000000000','contoh@example.com','Alamat contoh untuk dokumentasi, bukan alamat pelanggan.','Kurir contoh','Reguler',20000,950000,970000,'DATA CONTOH SOP. Bukan order nyata. Jangan diproses atau dibayar.') RETURNING id`, [code]);
    await client.query(`INSERT INTO order_items (order_id,slug,name,unit_price,qty,line_total) VALUES ($1,'produk-contoh-sop','Flower Box Contoh SOP',950000,1,950000)`, [result.rows[0].id]);
    await client.query('COMMIT');
    console.log(`Documentation fixture ID: ${result.rows[0].id}`);
  } else throw new Error('Use create or remove.');
} catch (error) { await client.query('ROLLBACK'); throw error; }
finally { await client.end(); }
