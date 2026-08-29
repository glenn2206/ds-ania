/**
 * scripts/snapshot.mjs — tulis ulang src/data/products.generated.json DARI database.
 *
 *   node scripts/snapshot.mjs
 *
 * JSON ini di-commit dan dipakai sebagai:
 *   - fallback saat DB tak terjangkau (src/lib/products.ts),
 *   - data yang di-bundle ke browser (src/lib/cart.ts — tampilan saja),
 *   - sumber `npm run db:seed` untuk instalasi baru.
 * Jalankan tiap kali struktur katalog berubah signifikan lalu commit hasilnya.
 */
import 'dotenv/config';
import { writeFileSync, existsSync, copyFileSync, statSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { q, end } from './_db.mjs';

const OUT = path.resolve('src/data/products.generated.json');
const UPLOADS = process.env.UPLOADS_DIR || path.resolve('uploads');
const PUBLIC_PRODUCTS = path.resolve('public/assets/products');
mkdirSync(PUBLIC_PRODUCTS, { recursive: true });

const products = await q(
  `SELECT * FROM products WHERE status = 'published' ORDER BY sort_order, id`,
);
const imgs = await q('SELECT product_id, filename FROM product_images ORDER BY product_id, position');
const byProd = new Map();
for (const im of imgs) {
  if (!byProd.has(im.product_id)) byProd.set(im.product_id, []);
  byProd.get(im.product_id).push(im.filename);
}

const rows = products.map((p, i) => ({
  slug: p.slug,
  name: p.name,
  category: p.category,
  pill: p.pill || '',
  flowers: p.flowers || '',
  size: p.size || null,
  price: p.price == null ? null : Number(p.price),
  priceNote: p.price_note || null,
  stock: p.stock == null ? null : Number(p.stock),
  description: p.description || '',
  occasion: p.occasion || null,
  drive: p.drive || null,
  featured: p.featured || null,
  sortOrder: p.sort_order ?? i,
  images: byProd.get(p.id) || [],
}));

// sinkronkan foto ke public/assets/products/ supaya fallback offline tetap punya gambar
let copied = 0;
for (const r of rows) {
  for (const f of r.images) {
    const src = path.join(UPLOADS, f);
    const dst = path.join(PUBLIC_PRODUCTS, f);
    if (!existsSync(src)) continue;
    if (!existsSync(dst) || statSync(src).size !== statSync(dst).size) {
      copyFileSync(src, dst);
      copied += 1;
    }
  }
}

writeFileSync(OUT, JSON.stringify(rows, null, 2) + '\n');
const withPhotos = rows.filter((r) => r.images.length).length;
console.log(`snapshot: ${rows.length} produk → ${OUT} (${withPhotos} berfoto, ${copied} foto disalin ke public/)`);
await end();
