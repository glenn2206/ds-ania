/** PUT /api/admin/products/:id — update. DELETE — hapus (foto ikut). */
import { q, one } from '../../../../lib/db';
import { withAdmin, jsonResponse, readProduct, slugify } from '../../../../lib/admin';
import { invalidateCatalog } from '../../../../lib/products';
import { removeUpload, renameForOrder } from '../../../../lib/images';

export const prerender = false;

export const PUT = withAdmin(async ({ params, request }) => {
  const id = Number(params.id);
  const product = await one('SELECT * FROM products WHERE id = ?', [id]);
  if (!product) return jsonResponse({ error: 'Produk tidak ada' }, 404);

  const b = readProduct(await request.json().catch(() => ({})));
  if (!b.name) return jsonResponse({ error: 'Nama wajib.' }, 400);

  let slug = b.slug || product.slug;
  if (slug !== product.slug && (await one('SELECT id FROM products WHERE slug = ? AND id <> ?', [slug, id])))
    slug = `${slugify(slug)}-${Date.now().toString(36).slice(-4)}`;

  await q(
    `UPDATE products SET slug=?,name=?,category=?,pill=?,flowers=?,size=?,price=?,price_note=?,stock=?,
       description=?,occasion=?,drive=?,featured=?,status=?,updated_at=CURRENT_TIMESTAMP
     WHERE id=?`,
    [slug, b.name, b.category, b.pill, b.flowers, b.size, b.price, b.price_note, b.stock,
     b.description, b.occasion, b.drive, b.featured, b.status, id],
  );

  // slug berubah → rename file foto biar konsisten
  if (slug !== product.slug) {
    const imgs = await q('SELECT * FROM product_images WHERE product_id = ? ORDER BY position, id', [id]);
    if (imgs.length) {
      const renamed = await renameForOrder(imgs.map((i) => i.filename), slug);
      for (let i = 0; i < imgs.length; i++)
        await q('UPDATE product_images SET filename=?, position=? WHERE id=?', [renamed[i], i, imgs[i].id]);
    }
  }

  invalidateCatalog();
  return jsonResponse({ ok: true, slug });
});

export const DELETE = withAdmin(async ({ params }) => {
  const id = Number(params.id);
  const imgs = await q('SELECT filename FROM product_images WHERE product_id = ?', [id]);
  for (const im of imgs) await removeUpload(im.filename);
  await q('DELETE FROM products WHERE id = ?', [id]); // product_images cascade
  invalidateCatalog();
  return jsonResponse({ ok: true });
});
