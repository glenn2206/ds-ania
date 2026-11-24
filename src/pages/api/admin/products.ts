/** POST /api/admin/products — buat produk baru. Body JSON (ProductInput). */
import { q, one, tx } from '../../../lib/db';
import { saveDiscount } from '../../../lib/discounts';
import { withAdmin, jsonResponse, readProduct, slugify } from '../../../lib/admin';
import { invalidateCatalog } from '../../../lib/products';
import { categoryColumn, getCategories, saveProductCategory } from '../../../lib/categories';
import { saveHashtags } from '../../../lib/product-meta';

export const prerender = false;

export const POST = withAdmin(async ({ request }) => {
  let b;
  const allowed = (await getCategories(true)).map((c) => c.slug);
  try { b = readProduct(await request.json().catch(() => ({})), allowed); }
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
      [slug, b.name, categoryColumn(b.category), b.pill, b.flowers, b.size, b.price, b.price_note, b.stock,
       b.description, b.occasion, b.drive, b.featured, nextSort, b.status],
    );
    if (b.discount_percent) await saveDiscount(t, result.insertId!, b.discount_percent);
    await saveProductCategory(t, result.insertId!, b.category);
    if (b.hashtags.length) await saveHashtags(t, result.insertId!, b.hashtags);
    return result.insertId;
  });
  invalidateCatalog();
  return jsonResponse({ id: insertId, slug });
});
