/**
 * facets.ts — turunkan daftar filter DINAMIS dari isi katalog.
 * Kategori/occasion/bunga yang tidak punya produk → tidak muncul.
 * Dipakai sidebar /shop dan section "Choose your Flower by …" di landing.
 */
import type { CatalogItem } from '../data/catalog';
import type { FilterGroupData } from '../data/shop';

export interface Facet {
  /** label yang ditampilkan */
  label: string;
  /** nilai filter — untuk category = slug; untuk occasion/flower = substring pencocokan ke data-search */
  value: string;
  count: number;
}

// accessory SENGAJA tidak di sini — jadi grup "Add On" sendiri (se-level Flowers)
const CAT_LABEL: Record<string, string> = {
  'premium-wrapped': 'Premium Wrapped Bloom',
  'bloom-box': 'Bloom Box & Basket',
  standing: 'Standing Flower & Board',
  vase: 'Vase Arrangement',
  preserved: 'Preserved Flower',
};

/** token kolom `flowers` (lowercase, tanpa "(...)" & angka) → nama bunga kanonik */
const FLOWER_CANON: Record<string, string> = {
  rose: 'Rose', roses: 'Rose',
  carnation: 'Carnation', carnations: 'Carnation',
  tulip: 'Tulip', tulips: 'Tulip',
  peony: 'Peony', peonies: 'Peony',
  hydrangea: 'Hydrangea', hydrangeas: 'Hydrangea',
  sunflower: 'Sunflower', sunflowers: 'Sunflower',
  orchid: 'Orchid', orchids: 'Orchid', phalaenopsis: 'Orchid', cymbidium: 'Orchid',
  lily: 'Lily', lilies: 'Lily',
  lisianthus: 'Lisianthus',
  chrysanthemum: 'Chrysanthemum', 'chrysanthemum zembla': 'Chrysanthemum',
  'peony mum': 'Chrysanthemum', 'peony mums': 'Chrysanthemum', 'peony chrysanthemum': 'Chrysanthemum',
  gerbera: 'Gerbera',
  daisy: 'Daisy', daisies: 'Daisy',
  ranunculus: 'Ranunculus',
  gompie: 'Gompie',
  hydrangae: 'Hydrangea',
};

/** frasa kolom `occasion` (lowercase) → { label tampil, substring pencocokan } */
const OCCASION_CANON: Record<string, { label: string; match: string }> = {
  'happy birthday': { label: 'Birthday', match: 'birthday' },
  birthday: { label: 'Birthday', match: 'birthday' },
  'i love you': { label: 'Anniversary', match: 'i love you' },
  anniversary: { label: 'Anniversary', match: 'i love you' },
  'happy graduation': { label: 'Graduation', match: 'graduation' },
  graduation: { label: 'Graduation', match: 'graduation' },
  congratulation: { label: 'Congratulations', match: 'congratulation' },
  congratulations: { label: 'Congratulations', match: 'congratulation' },
  'grand opening': { label: 'Grand Opening', match: 'grand opening' },
  'speedy recovery': { label: 'Get Well Soon', match: 'speedy recovery' },
  'get well soon': { label: 'Get Well Soon', match: 'speedy recovery' },
  condolences: { label: 'Sympathy', match: 'condolences' },
  sympathy: { label: 'Sympathy', match: 'condolences' },
  'achievement celebration': { label: 'Achievement', match: 'achievement' },
  'new beginnings': { label: 'New Beginnings', match: 'new beginnings' },
};

const cleanTok = (s: string) =>
  s
    .toLowerCase()
    .replace(/\([^)]*\)/g, '')
    .replace(/[0-9]+/g, '')
    .replace(/\b(stems?|pcs?|imported|garden|spray|assorted)\b/g, '')
    .replace(/[^a-z\s]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

const rank = <T extends { count: number; label: string }>(list: T[]): T[] =>
  list.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

export interface Facets {
  categories: Facet[];
  occasions: Facet[];
  flowers: Facet[];
  addons: Facet[];
}

export function buildFacets(items: CatalogItem[]): Facets {
  const cat = new Map<string, Facet>();
  const flw = new Map<string, Facet>();
  const occ = new Map<string, Facet>();
  const add = new Map<string, Facet>();

  for (const c of items) {
    // add-on (kategori accessory) → grup sendiri, per nama produk
    if (c.category === 'accessory') {
      const key = c.name.trim();
      const f = add.get(key) ?? { label: key, value: key.toLowerCase(), count: 0 };
      f.count++;
      add.set(key, f);
      continue;
    }

    // category
    const cl = CAT_LABEL[c.category];
    if (cl) {
      const f = cat.get(c.category) ?? { label: cl, value: c.category, count: 0 };
      f.count++;
      cat.set(c.category, f);
    }

    // flowers
    const seenF = new Set<string>();
    for (const raw of (c.flowers || '').split(/[,;/&+]+/)) {
      const canon = FLOWER_CANON[cleanTok(raw)];
      if (!canon || seenF.has(canon)) continue;
      seenF.add(canon);
      const f = flw.get(canon) ?? { label: canon, value: canon.toLowerCase(), count: 0 };
      f.count++;
      flw.set(canon, f);
    }

    // occasions
    const seenO = new Set<string>();
    for (const raw of (c.occasion || '').split(/[,;/]+/)) {
      const hit = OCCASION_CANON[raw.trim().toLowerCase()];
      if (!hit || seenO.has(hit.label)) continue;
      seenO.add(hit.label);
      const f = occ.get(hit.label) ?? { label: hit.label, value: hit.match, count: 0 };
      f.count++;
      occ.set(hit.label, f);
    }
  }

  return {
    categories: rank([...cat.values()]),
    occasions: rank([...occ.values()]),
    flowers: rank([...flw.values()]),
    addons: rank([...add.values()]),
  };
}

/** FilterGroupData[] untuk ShopSidebar — hanya grup yang ADA isinya */
export function shopFilterGroups(items: CatalogItem[]): FilterGroupData[] {
  const f = buildFacets(items);
  const groups: FilterGroupData[] = [{ title: 'Explore', group: 'all' }];
  if (f.categories.length)
    groups.push({ title: 'By Category', group: 'category', collapsible: true, items: f.categories });
  if (f.occasions.length)
    groups.push({ title: 'By Occasion', group: 'occasion', collapsible: true, items: f.occasions });
  if (f.flowers.length)
    groups.push({ title: 'By Flowers', group: 'flower', collapsible: true, items: f.flowers });
  if (f.addons.length)
    groups.push({ title: 'Add On', group: 'addon', collapsible: true, items: f.addons });
  groups.push({ title: 'Sale', group: 'sale' });
  return groups;
}
