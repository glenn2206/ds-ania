/**
 * Data section "Choose your Flower by …" (landing).
 * Tab (Occasions / Category / Flower) + tile per tab. Tab & pagination dinamis
 * di ChooseFlowerSection.astro (client-side).
 */

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
  label: string;
  olive?: boolean;
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
const tiles = (labels: { label: string; olive?: boolean }[]): ChooseTile[] =>
  labels.map((l, i) => ({ image: img(i), label: l.label, olive: l.olive }));

export const chooseTiles: Record<ChooseTab, ChooseTile[]> = {
  Occasions: tiles([
    { label: 'Graduation', olive: true },
    { label: 'Anniversary' },
    { label: 'Just For Me' },
    { label: 'Birthday' },
    { label: 'Get Well Soon' },
    { label: 'Sympathy' },
    { label: 'Wedding' },
    { label: 'New Baby' },
    { label: 'Thank You' },
  ]),
  Category: tiles([
    { label: 'Premium Wrapped Bloom' },
    { label: 'Bloom Box & Basket' },
    { label: 'Standing Flower & Board' },
    { label: 'Vase Arrangement' },
    { label: 'Preserved Flower' },
    { label: 'Accessories' },
  ]),
  Flower: tiles([
    { label: 'Roses' },
    { label: 'Tulips' },
    { label: 'Peonies' },
    { label: 'Hydrangea' },
    { label: 'Sunflower' },
    { label: 'Orchid' },
    { label: 'Lily' },
    { label: 'Carnation' },
    { label: 'Lisianthus' },
  ]),
};

export const CHOOSE_PER_PAGE = 3;
