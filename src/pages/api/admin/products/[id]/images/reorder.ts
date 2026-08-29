/** POST /api/admin/products/:id/images/reorder — body { order: [imgId,…] } → { images } */
import { q, one } from '../../../../../../lib/db';
import { withAdmin, jsonResponse } from '../../../../../../lib/admin';
import { invalidateCatalog } from '../../../../../../lib/products';
import { renameForOrder } from '../../../../../../lib/images';

export const prerender = false;

export const POST = withAdmin(async ({ params, request }) => {
  const id = Number(params.id);
  const product = await one('SELECT id, slug FROM products WHERE id = ?', [id]);
  if (!product) return jsonResponse({ error: 'Produk tidak ada' }, 404);

  const body = await request.json().catch(() => ({}));
  const order: number[] = Array.isArray(body.order) ? body.order.map(Number) : [];
  const imgs = await q('SELECT * FROM product_images WHERE product_id = ?', [id]);
  const byId = new Map(imgs.map((i) => [Number(i.id), i]));
  const seq = order.map((x) => byId.get(x)).filter(Boolean) as any[];
  if (seq.length !== imgs.length) return jsonResponse({ error: 'order mismatch' }, 400);

  const renamed = await renameForOrder(seq.map((i) => i.filename), product.slug);
  for (let i = 0; i < seq.length; i++)
    await q('UPDATE product_images SET filename=?, position=? WHERE id=?', [renamed[i], i, seq[i].id]);

  invalidateCatalog();
  const images = await q(
    'SELECT id, filename, position FROM product_images WHERE product_id = ? ORDER BY position, id',
    [id],
  );
  return jsonResponse({ images });
});
