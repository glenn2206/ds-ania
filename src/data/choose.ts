/**
 * Data section "Choose your Flower by …" (landing).
 * Tab (Occasions / Category / Flower) — tile-nya DINAMIS, diturunkan dari isi
 * katalog lewat `chooseTilesFrom(facets)` di ChooseFlowerSection.astro.
 */
import type { Facets } from '../lib/facets';
import type { PhotoFit } from './photo-fit';

export const chooseHeadingLead = 'Find the Perfect Flowers for Every Moment.';

export const chooseTabs = ['Occasions', 'Category', 'Flower'] as const;
export type ChooseTab = (typeof chooseTabs)[number];

export const chooseSub: Record<ChooseTab, string> = {
  Occasions:
    'Find flowers for birthdays, anniversaries, congratulations, romance & every meaningful moment.',
  Category:
    'Browse by arrangement style — wrapped bouquets, bloom boxes, standing flowers, vases & more.',
  Flower:
    'Pick by your favourite bloom — roses, tulips, peonies, hydrangeas, sunflowers & beyond.',
};

export interface ChooseTile {
  image: string;
  /** posisi foto dari CMS */
  fit?: PhotoFit;
  label: string;
  olive?: boolean;
  /** klik tile → halaman shop dengan filter sudah aktif */
  href: string;
}

// pool foto yang sudah ada di /public/assets — dirotasi untuk tile
const POOL = [
  'bouquet-blush-amethyst-box.jpg',
  'bouquet-rose-allure.jpg',
  'bouquet-hello-sunshine.jpg',
  'bouquet-rouge-elegance.jpg',
  'bouquet-vibrant-longevity.jpg',
  'bouquet-love-symphony.jpg',
  'bouquet-blush-amethyst.jpg',
  'bouquet-handful-box.jpg',
  'scene-holding-yellow-bouquet.jpg',
];
const img = (i: number) => `/assets/${POOL[i % POOL.length]}`;

const PARAM: Record<ChooseTab, string> = { Occasions: 'occasion', Category: 'cat', Flower: 'flower' };

/** rakit tile per tab dari facet katalog — hanya yang ADA produknya */
export function chooseTilesFrom(facets: Facets, occasionImages: Record<string, string> = {}, occasionFits: Record<string, PhotoFit> = {}): Record<ChooseTab, ChooseTile[]> {
  const make = (tab: ChooseTab, facetList: { label: string; value: string; image?: string }[], offset: number): ChooseTile[] =>
    facetList.map((f, i) => ({
      image: (tab === 'Occasions' && Object.prototype.hasOwnProperty.call(occasionImages, f.value) ? occasionImages[f.value] : f.image) || img(i + offset),
      ...(tab === 'Occasions' && Object.prototype.hasOwnProperty.call(occasionFits, f.value) ? { fit: occasionFits[f.value] } : {}),
      label: f.label,
      href: `/shop?${PARAM[tab]}=${encodeURIComponent(f.value)}`,
    }));

  return {
    Occasions: make('Occasions', facets.occasions, 0),
    Category: make('Category', facets.categories, 3),
    Flower: make('Flower', facets.flowers, 6),
  };
}

export const CHOOSE_PER_PAGE = 3;
