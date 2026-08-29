/**
 * cms/scripts/seed.mjs — isi DB dari src/data/products.generated.json (repo Astro),
 * dan salin foto public/assets/products/*.jpg → cms/uploads.
 *
 *   node scripts/seed.mjs [path/ke/products.generated.json]
 *
 * Default cari di ../ania-site/src/data/products.generated.json lalu ../src/data/...
 * Idempoten: upsert per slug. TIDAK menghapus produk yg sudah ada.
 */
import 'dotenv/config';
import path from 'node:path';
import { existsSync, readFileSync, readdirSync, copyFileSync, mkdirSync } from 'node:fs';
import { q, end } from '../db.js';

const candidates = [
  process.argv[2],
  path.resolve('..', 'ania-site', 'src', 'data', 'products.generated.json'),
  path.resolve('..', 'src', 'data', 'products.generated.json'),
  path.resolve('src', 'data', 'products.generated.json'),
].filter(Boolean);

const jsonPath = candidates.find((p) => existsSync(p));
if (!jsonPath) {
  console.error('products.generated.json tidak ketemu. Beri path sebagai argumen.');
  process.exit(1);
}
const rows = JSON.parse(readFileSync(jsonPath, 'utf8'));
const siteRoot = path.resolve(path.dirname(jsonPath), '..', '..'); // .../ania-site
const photoSrc = path.join(siteRoot, 'public', 'assets', 'products');
const uploadDir = path.resolve('uploads');
mkdirSync(uploadDir, { recursive: true });

let nProd = 0;
let nImg = 0;
for (const r of rows) {
  const vals = [
    r.name, r.category, r.pill || '', r.flowers || null, r.size || null,
    r.price ?? null, r.priceNote || null, r.description || null, r.occasion || null,
    r.drive || null, r.featured || null, r.sortOrder ?? 0,
  ];
  const existing = await q('SELECT id FROM products WHERE slug = ?', [r.slug]);
  if (existing.length) {
    await q(
      `UPDATE products SET name=?,category=?,pill=?,flowers=?,size=?,price=?,price_note=?,
         description=?,occasion=?,drive=?,featured=?,sort_order=? WHERE slug=?`,
      [...vals, r.slug],
    );
  } else {
    await q(
      `INSERT INTO products (name,category,pill,flowers,size,price,price_note,description,occasion,drive,featured,sort_order,slug,status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?, 'published')`,
      [...vals, r.slug],
    );
  }
  const [p] = await q('SELECT id FROM products WHERE slug = ?', [r.slug]);
  nProd += 1;

  const have = await q('SELECT filename FROM product_images WHERE product_id = ?', [p.id]);
  const haveSet = new Set(have.map((x) => x.filename));
  let pos = have.length;
  for (const file of r.images || []) {
    // salin foto ke uploads (rename ke <slug>-<pos+1>.jpg biar konsisten dgn CMS)
    const from = path.join(photoSrc, file);
    const finalName = `${r.slug}-${pos + 1}.jpg`;
    if (!haveSet.has(finalName)) {
      if (existsSync(from)) copyFileSync(from, path.join(uploadDir, finalName));
      await q('INSERT INTO product_images (product_id, filename, position) VALUES (?,?,?)', [p.id, finalName, pos]);
      nImg += 1;
      pos += 1;
    }
  }
}

console.log(`seed: ${nProd} produk, ${nImg} foto → DB + ${uploadDir}`);
await end();
