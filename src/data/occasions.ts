/**
 * Konten halaman /occasions ("For Occasions").
 * Baris produk diturunkan dari katalog asli (src/data/catalog.ts) berdasarkan
 * kolom `occasion`, dipetakan ke bentuk <ProductCard> lewat toProduct().
 */
import { allProducts, type CatalogItem } from './catalog';
import { toProduct } from './shop';
import type { Product } from './home';
import { addonExtras } from './care';

/** produk per baris occasion (kelipatan 3 supaya paging rapi) */
export const PER_PAGE = 3;
const ROW_SIZE = 9;

export const intro = {
  eyebrow: 'What’s the Occasion?',
  title: 'Tell us the moment, and we’ll help you find flowers that say it beautifully.',
  image: '/assets/scene-holding-yellow-bouquet.jpg',
  primary: { label: 'Shop Fresh Blooms', href: '/shop' },
  secondary: { label: 'Let’s Talk Flowers', href: '/contact' },
};

const bySlug = new Map(allProducts.map((c) => [c.slug, c]));

/**
 * Susun satu baris occasion:
 *  - `lead` = slug kurasi (tampil duluan),
 *  - lalu produk lain yang cocok `re` (kolom occasion katalog),
 *  - terakhir sisa katalog sebagai cadangan — dipotong ke ROW_SIZE (9 = 3 halaman).
 * Kartu pertama tiap halaman ditandai Sale (harga coret = harga / 0.75) — sesuai PromoBar "25% Off".
 */
function buildRow(lead: string[], re: RegExp): Product[] {
  const seen = new Set<string>();
  const out: CatalogItem[] = [];
  const add = (c?: CatalogItem) => {
    if (c && !seen.has(c.slug)) {
      seen.add(c.slug);
      out.push(c);
    }
  };

  lead.forEach((s) => add(bySlug.get(s)));
  allProducts.filter((p) => re.test(p.occasion ?? '')).forEach(add);
  allProducts.forEach(add); // cadangan agar selalu cukup 9

  return out.slice(0, ROW_SIZE).map((c, i) => {
    const p: Product = { ...toProduct(c), slug: c.slug, href: `/product/${c.slug}` };
    if (i % PER_PAGE === 0 && typeof c.price === 'number') {
      p.state = 'sale';
      p.compareAt = Math.round(c.price / 0.75 / 10000) * 10000;
    }
    return p;
  });
}

export interface OccasionRow {
  eyebrow: string;
  title: string;
  products: Product[];
}

export const occasionRows: OccasionRow[] = [
  {
    eyebrow: 'Birthday Flower',
    title: 'Happy Birthday!',
    products: buildRow(['a-handful-flower-box', 'blush-amethyst-orchestra', 'love-symphony'], /birthday/i),
  },
  {
    eyebrow: 'Anniversary',
    title: 'I Love You',
    products: buildRow(['rose-allure', 'blushing-blooms', 'romantic-glow'], /i love you|anniversary/i),
  },
  {
    eyebrow: 'Graduation',
    title: 'Happy Graduation!',
    products: buildRow(['roselle-verdant', 'hello-sunshine', 'catch-your-eyes'], /graduation/i),
  },
  {
    eyebrow: 'Sympathy',
    title: 'Deepest Condolences',
    products: buildRow(['sympathy-flower-board', 'ivory-haven', 'seraphic-peace'], /condolence|sympathy/i),
  },
  {
    eyebrow: 'Just For Me',
    title: 'Proud of My Self',
    products: buildRow(['petal-crown', 'blush-meadow', 'sunflower-bliss'], /just because|speedy recovery|achievement|new beginnings/i),
  },
];

export const addOnExtras = addonExtras;

export interface SendToCard {
  icon: string;
  title: string;
  body: string;
  bestFor: string;
}

export const sendTo: SendToCard[] = [
  {
    icon: 'heart',
    title: 'Your Romantic Partner',
    body: 'For your partner, romantic and meaningful blooms are always a beautiful choice. Classic roses are timeless, while their favourite flowers or a bouquet in their favourite colour can make the gesture feel even more personal.',
    bestFor: 'Best for: Anniversaries · Valentine’s Day · Birthdays · Just Because',
  },
  {
    icon: 'flower',
    title: 'Your Parents',
    body: 'Soft, elegant arrangements in cheerful or sophisticated colours are a lovely way to show appreciation. Consider flowers that feel warm, graceful, and thoughtful rather than overly romantic.',
    bestFor: 'Best for: Mother’s Day · Father’s Day · Birthdays · Thank You',
  },
  {
    icon: 'sun',
    title: 'A Friend',
    body: 'Colourful bouquets and playful arrangements work beautifully for friends. Choose something that reflects their personality or simply brings a little happiness to their day.',
    bestFor: 'Best for: Birthdays · Congratulations · Get Well Soon',
  },
  {
    icon: 'leaf-circle',
    title: 'A Colleague or Business Partner',
    body: 'For corporate gifting, opt for sophisticated arrangements with a refined colour palette. Minimal, elegant designs are ideal when you want to express appreciation without feeling too personal.',
    bestFor: 'Best for: Congratulations · Thank You · New Business · Corporate Events',
  },
  {
    icon: 'clock',
    title: 'Someone Going Through a Difficult Time',
    body: 'Let the flowers speak gently. Choose elegant, understated arrangements in soft or calming tones. The gesture is more important than the size — thoughtful flowers can quietly communicate that you’re thinking of them.',
    bestFor: 'Best for: Sympathy · Condolences · Get Well Soon · Thinking of You',
  },
];

export const unspoken = {
  eyebrow: 'For Those Unspoken Words',
  title: 'Let your Flowers Speak First',
  body: 'Because the most meaningful messages aren’t always spoken, they’re beautifully delivered. From love and gratitude to congratulations and comfort, our handcrafted bouquets will help you say what words can’t.',
  cta: { label: 'Let’s Talk Flowers', href: '/contact' },
};
