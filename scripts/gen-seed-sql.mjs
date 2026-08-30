/**
 * scripts/gen-seed-sql.mjs — bikin db/seed.pg.sql dari products.generated.json,
 * plus baris admin. Untuk di-paste di phpPgAdmin saat tidak ada akses Terminal.
 *
 *   node scripts/gen-seed-sql.mjs [passwordAdmin]
 *   (default password: ania-admin)
 *
 * Hasil db/seed.pg.sql idempoten: jalankan berapa kali pun aman.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';

const pw = process.argv[2] || 'ania-admin';
const hash = await bcrypt.hash(pw, 10);

const rows = JSON.parse(readFileSync(path.resolve('src/data/products.generated.json'), 'utf8'));
const q = (v) => {
  if (v === null || v === undefined || v === '') return 'NULL';
  if (typeof v === 'number') return String(v);
  return `'${String(v).replace(/'/g, "''")}'`;
};

let sql = `-- db/seed.pg.sql — dihasilkan otomatis. Jalankan SETELAH db/schema.pg.sql.
-- Aman diulang (ON CONFLICT / hapus-lalu-isi untuk foto).

`;

for (const r of rows) {
  sql += `INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
VALUES (${q(r.slug)},${q(r.name)},${q(r.category)},${q(r.pill || '')},${q(r.flowers)},${q(r.size)},${q(r.price)},${q(r.priceNote)},${q(r.stock)},${q(r.description)},${q(r.occasion)},${q(r.drive)},${q(r.featured)},${q(r.sortOrder ?? 0)},'published')
ON CONFLICT (slug) DO UPDATE SET
  name=EXCLUDED.name, category=EXCLUDED.category, pill=EXCLUDED.pill, flowers=EXCLUDED.flowers,
  size=EXCLUDED.size, price=EXCLUDED.price, price_note=EXCLUDED.price_note, stock=EXCLUDED.stock,
  description=EXCLUDED.description, occasion=EXCLUDED.occasion, drive=EXCLUDED.drive,
  featured=EXCLUDED.featured, sort_order=EXCLUDED.sort_order, updated_at=now();
`;
}

// foto: hapus lalu isi ulang per slug yang punya foto
const slugsWithImgs = rows.filter((r) => (r.images || []).length).map((r) => r.slug);
if (slugsWithImgs.length) {
  sql += `\nDELETE FROM product_images WHERE product_id IN (SELECT id FROM products WHERE slug IN (${slugsWithImgs
    .map(q)
    .join(',')}));\n`;
  for (const r of rows) {
    (r.images || []).forEach((f, i) => {
      sql += `INSERT INTO product_images (product_id, filename, position) SELECT id, ${q(f)}, ${i} FROM products WHERE slug = ${q(
        r.slug,
      )};\n`;
    });
  }
}

sql += `\nINSERT INTO users (username, pass_hash) VALUES ('admin', ${q(hash)})
ON CONFLICT (username) DO UPDATE SET pass_hash = EXCLUDED.pass_hash;
`;

const out = path.resolve('db/seed.pg.sql');
writeFileSync(out, sql);
console.log(`gen-seed-sql: ${rows.length} produk → ${out}`);
console.log(`  admin / ${pw}`);
