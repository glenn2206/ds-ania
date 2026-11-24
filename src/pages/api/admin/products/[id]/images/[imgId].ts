/**
 * PUT    /api/admin/products/:id/images/:imgId  body { fit } → { images } (atur posisi foto)
 * DELETE /api/admin/products/:id/images/:imgId → { images } (urutan sisanya dirapikan)
 */
import { q, one, tx } from '../../../../../../lib/db';
import { withAdmin, jsonResponse } from '../../../../../../lib/admin';
import { invalidateCatalog } from '../../../../../../lib/products';
import { removeUpload, renameForOrder } from '../../../../../../lib/images';
import { listProductImages } from '../../../../../../lib/image-alt';
import { savePhotoFit } from '../../../../../../lib/product-meta';
import { readPhotoFits } from '../../../../../../data/photo-fit';

export const prerender = false;

export const PUT = withAdmin(async ({ params, request }) => {
  const id = Number(params.id);
  const imgId = Number(params.imgId);
  if (!(await one('SELECT id FROM product_images WHERE id = ? AND product_id = ?', [imgId, id])))
    return jsonResponse({ error: 'Foto tidak ditemukan. Muat ulang halaman.' }, 404);
  const body = await request.json().catch(() => ({}));
  let fit;
  try { fit = readPhotoFits(body?.fit); }
  catch (error) { return jsonResponse({ error: (error as Error).message }, 400); }
  await tx((t) => savePhotoFit(t, id, imgId, fit));
  invalidateCatalog();
  return jsonResponse({ images: await listProductImages(id) });
});

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
  const images = await listProductImages(id);
  return jsonResponse({ images });
});
