/** POST /api/admin/products — buat produk baru. Body JSON (ProductInput). */
import { q, one, tx } from '../../../lib/db';
import { saveDiscount } from '../../../lib/discounts';
import { withAdmin, jsonResponse, readProduct, slugify } from '../../../lib/admin';
import { invalidateCatalog } from '../../../lib/products';

export const prerender = false;

export const POST = withAdmin(async ({ request }) => {
  let b;
  try { b = readProduct(await request.json().catch(() => ({}))); }
  catch (error) { return jsonResponse({ error: (error as Error).message }, 400); }
  if (!b.name) return jsonResponse({ error: 'Nama wajib.' }, 400);

  let slug = b.slug || slugify(b.name);
  if (!slug) return jsonResponse({ error: 'Slug tidak valid.' }, 400);
  if (await one('SELECT id FROM products WHERE slug = ?', [slug]))
    slug = `${slug}-${Date.now().toString(36).slice(-4)}`;

  const [{ m }] = await q('SELECT COALESCE(MAX(sort_order), -1) + 1 AS m FROM products');
  const nextSort = Number(m) || 0;

  const insertId = await tx(async (t) => {
    const result = await t.insert(
      `INSERT INTO products
         (slug,name,category,pill,flowers,size,price,price_note,stock,description,occasion,drive,featured,sort_order,status)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [slug, b.name, b.category, b.pill, b.flowers, b.size, b.price, b.price_note, b.stock,
       b.description, b.occasion, b.drive, b.featured, nextSort, b.status],
    );
    if (b.discount_percent) await saveDiscount(t, result.insertId!, b.discount_percent);
    return result.insertId;
  });
  invalidateCatalog();
  return jsonResponse({ id: insertId, slug });
});
