/**
 * scripts/seed.mjs — isi DB dari src/data/products.generated.json + salin foto
 * public/assets/products/*.jpg → UPLOADS_DIR (default ./uploads).
 *
 *   node scripts/seed.mjs
 *
 * Idempoten: upsert per slug. Tidak menghapus produk / foto yang sudah ada.
 */
import 'dotenv/config';
import path from 'node:path';
import { existsSync, readFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { q, end } from './_db.mjs';

const jsonPath = path.resolve('src/data/products.generated.json');
if (!existsSync(jsonPath)) {
  console.error('src/data/products.generated.json tidak ada.');
  process.exit(1);
}
const rows = JSON.parse(readFileSync(jsonPath, 'utf8'));
// sumber foto: public/assets/products (repo) atau dist/client/assets/products (hasil build)
const photoSrc = [path.resolve('public/assets/products'), path.resolve('dist/client/assets/products')].find(
  (p) => existsSync(p),
) || path.resolve('public/assets/products');
const uploadDir = process.env.UPLOADS_DIR || path.resolve('uploads');
mkdirSync(uploadDir, { recursive: true });

let nProd = 0;
let nImg = 0;
for (const r of rows) {
  const vals = [
    r.name,
    r.category,
    r.pill || '',
    r.flowers || null,
    r.size || null,
    r.price ?? null,
    r.priceNote || null,
    r.stock ?? null,
    r.description || null,
    r.occasion || null,
    r.drive || null,
    r.featured || null,
    r.sortOrder ?? 0,
  ];
  const existing = await q('SELECT id FROM products WHERE slug = ?', [r.slug]);
  if (existing.length) {
    await q(
      `UPDATE products SET name=?,category=?,pill=?,flowers=?,size=?,price=?,price_note=?,stock=?,
         description=?,occasion=?,drive=?,featured=?,sort_order=? WHERE slug=?`,
      [...vals, r.slug],
    );
  } else {
    await q(
      `INSERT INTO products (name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,slug,status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'published')`,
      [...vals, r.slug],
    );
  }
  const [p] = await q('SELECT id FROM products WHERE slug = ?', [r.slug]);
  nProd += 1;

  const have = await q('SELECT filename FROM product_images WHERE product_id = ?', [p.id]);
  const haveSet = new Set(have.map((x) => x.filename));
  let pos = have.length;
  for (const file of r.images || []) {
    const finalName = `${r.slug}-${pos + 1}.jpg`;
    if (haveSet.has(finalName)) continue;
    const from = path.join(photoSrc, file);
    if (existsSync(from)) copyFileSync(from, path.join(uploadDir, finalName));
    await q('INSERT INTO product_images (product_id, filename, position) VALUES (?,?,?)', [
      p.id,
      finalName,
      pos,
    ]);
    nImg += 1;
    pos += 1;
  }
}

console.log(`seed: ${nProd} produk, ${nImg} foto → DB + ${uploadDir}`);
await end();
