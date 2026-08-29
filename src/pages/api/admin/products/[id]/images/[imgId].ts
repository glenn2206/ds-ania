/** DELETE /api/admin/products/:id/images/:imgId → { images } (urutan sisanya dirapikan) */
import { q, one } from '../../../../../../lib/db';
import { withAdmin, jsonResponse } from '../../../../../../lib/admin';
import { invalidateCatalog } from '../../../../../../lib/products';
import { removeUpload, renameForOrder } from '../../../../../../lib/images';

export const prerender = false;

export const DELETE = withAdmin(async ({ params }) => {
  const id = Number(params.id);
  const imgId = Number(params.imgId);
  const product = await one('SELECT id, slug FROM products WHERE id = ?', [id]);
  const img = await one('SELECT * FROM product_images WHERE id = ? AND product_id = ?', [imgId, id]);
  if (!product || !img) return jsonResponse({ error: 'Tidak ditemukan' }, 404);

  await removeUpload(img.filename);
  await q('DELETE FROM product_images WHERE id = ?', [imgId]);

  const rest = await q('SELECT * FROM product_images WHERE product_id = ? ORDER BY position, id', [id]);
  if (rest.length) {
    const renamed = await renameForOrder(rest.map((i) => i.filename), product.slug);
    for (let i = 0; i < rest.length; i++)
      await q('UPDATE product_images SET filename=?, position=? WHERE id=?', [renamed[i], i, rest[i].id]);
  }

  invalidateCatalog();
  const images = await q(
    'SELECT id, filename, position FROM product_images WHERE product_id = ? ORDER BY position, id',
    [id],
  );
  return jsonResponse({ images });
});
