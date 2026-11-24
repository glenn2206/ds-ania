/** PUT /api/admin/categories — simpan daftar kategori. Body { categories: [{ slug, label, visible }] } */
import { withAdmin, jsonResponse } from '../../../lib/admin';
import { readCategories } from '../../../data/categories';
import { CategoryInUseError, getCategories, saveCategories } from '../../../lib/categories';
import { invalidateCatalog } from '../../../lib/products';

export const prerender = false;

export const PUT = withAdmin(async ({ request }) => {
  const body = await request.json().catch(() => ({}));
  let list;
  try { list = readCategories(body?.categories); }
  catch (error) { return jsonResponse({ error: (error as Error).message }, 400); }
  try { await saveCategories(list); }
  catch (error) {
    if (error instanceof CategoryInUseError) return jsonResponse({ error: error.message }, 409);
    throw error;
  }
  invalidateCatalog();
  return jsonResponse({ ok: true, categories: await getCategories(true) });
});
