/**
 * categories.ts — kategori produk (murni, tanpa DB; aman dipakai di browser & test).
 * Daftar aktif diatur dari CMS (/admin/categories) dan disimpan di site_settings;
 * DEFAULT_CATEGORIES dipakai selama belum pernah disimpan / DB tidak terjangkau.
 */
export interface CategoryItem {
  slug: string;
  label: string;
  /** tampil di menu filter, tile homepage, footer, dan grid Explore */
  visible: boolean;
  /** foto kartu tab Kategori di beranda; kosong = foto bawaan */
  image?: string;
}

/** slug yang diterima kolom products.category (CHECK/ENUM di DB). Tidak bisa dihapus dari CMS. */
export const BUILTIN_SLUGS = ['premium-wrapped', 'bloom-box', 'standing', 'vase', 'accessory'] as const;
/** add-on punya grup filter sendiri ("Add On"), bukan bagian "By Category" */
export const ADDON_SLUG = 'accessory';

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { slug: 'premium-wrapped', label: 'Premium Wrapped Bloom', visible: true },
  { slug: 'bloom-box', label: 'Bloom Box & Basket', visible: true },
  { slug: 'standing', label: 'Standing Flower & Board', visible: true },
  { slug: 'vase', label: 'Vase Arrangement', visible: true },
  { slug: 'preserved', label: 'Preserved Flower', visible: true },
  { slug: ADDON_SLUG, label: 'Accessories', visible: true },
];

export const isBuiltin = (slug: string) => (BUILTIN_SLUGS as readonly string[]).includes(slug);

/** Kelompokkan per kategori mengikuti urutan CMS; urutan di dalam kategori tidak berubah. */
export function sortByCategory<T extends { category: string }>(items: T[], categories: CategoryItem[]): T[] {
  const order = new Map(categories.map((c, i) => [c.slug, i]));
  const rank = (item: T) => order.get(item.category) ?? categories.length;
  return [...items].sort((a, b) => rank(a) - rank(b));
}

const MAX = 30;

/** Validasi daftar kategori dari CMS. Melempar Error berisi pesan untuk admin. */
export function readCategories(input: unknown): CategoryItem[] {
  if (!Array.isArray(input) || !input.length || input.length > MAX)
    throw new Error(`Kategori harus 1 sampai ${MAX} baris.`);
  const slugs = new Set<string>();
  const labels = new Set<string>();
  const out = input.map((row) => {
    const slug = String(row?.slug ?? '').trim();
    const label = String(row?.label ?? '').trim().replace(/\s+/g, ' ');
    if (!label || label.length > 60) throw new Error('Nama kategori wajib diisi, maksimal 60 karakter.');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 40) throw new Error(`Slug kategori "${slug}" tidak valid.`);
    if (slugs.has(slug)) throw new Error(`Slug kategori "${slug}" dobel.`);
    if (labels.has(label.toLowerCase())) throw new Error(`Nama kategori "${label}" dobel.`);
    slugs.add(slug);
    labels.add(label.toLowerCase());
    const image = String(row?.image ?? '').trim();
    if (image && (image.length > 300 || !/^\/(?:uploads|assets)\/[\w./-]+\.(?:jpe?g|png|webp)$/i.test(image) || image.includes('..')))
      throw new Error(`Foto kategori "${label}" tidak valid.`);
    // add-on selalu aktif: dipakai section Add On di beberapa halaman
    return { slug, label, visible: slug === ADDON_SLUG ? true : row.visible !== false, ...(image ? { image } : {}) };
  });
  for (const slug of BUILTIN_SLUGS)
    if (!slugs.has(slug)) throw new Error(`Kategori bawaan "${slug}" tidak bisa dihapus. Sembunyikan saja.`);
  return out;
}
