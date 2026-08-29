/**
 * GET  /api/admin/products/:id/images        → { images: [{id,filename,position}] }
 * POST /api/admin/products/:id/images         (multipart, field "photos") → { images }
 */
import { q, one, insert } from '../../../../../lib/db';
import { withAdmin, jsonResponse } from '../../../../../lib/admin';
import { invalidateCatalog } from '../../../../../lib/products';
import { processUpload } from '../../../../../lib/images';

export const prerender = false;

const MAX_BYTES = 12 * 1024 * 1024;

async function listImages(id: number) {
  return q('SELECT id, filename, position FROM product_images WHERE product_id = ? ORDER BY position, id', [id]);
}

export const GET = withAdmin(async ({ params }) => {
  const id = Number(params.id);
  return jsonResponse({ images: await listImages(id) });
});

export const POST = withAdmin(async ({ params, request }) => {
  const id = Number(params.id);
  const product = await one('SELECT id, slug FROM products WHERE id = ?', [id]);
  if (!product) return jsonResponse({ error: 'Produk tidak ada' }, 404);

  const form = await request.formData();
  const files = form.getAll('photos').filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return jsonResponse({ error: 'Tidak ada file' }, 400);

  const [{ n }] = await q('SELECT COUNT(*) AS n FROM product_images WHERE product_id = ?', [id]);
  let pos = Number(n) || 0;

  for (const file of files) {
    if (file.size > MAX_BYTES) return jsonResponse({ error: `"${file.name}" > 12 MB` }, 400);
    const buf = Buffer.from(await file.arrayBuffer());
    const filename = await processUpload(buf, product.slug, pos);
    await insert('INSERT INTO product_images (product_id, filename, position) VALUES (?,?,?)', [id, filename, pos]);
    pos += 1;
  }

  invalidateCatalog();
  return jsonResponse({ images: await listImages(id) });
});
