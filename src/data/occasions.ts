/**
 * Konten halaman /occasions ("For Occasions").
 * Baris produk diturunkan dari katalog LIVE (getCatalog, src/lib/products.ts)
 * berdasarkan kolom `occasion` di CMS, dipetakan ke <ProductCard> lewat toProduct().
 */
import type { CatalogItem } from './catalog';
import { toProduct } from './shop';
import type { Product } from './home';

export const intro = {
  eyebrow: 'What’s the Occasion?',
  title: 'Tell us the moment, and we’ll help you find flowers that say it beautifully.',
  image: '/assets/scene-holding-yellow-bouquet.jpg',
  primary: { label: 'Shop Fresh Blooms', href: '/shop' },
  secondary: { label: 'Let’s Talk Flowers', href: '/contact' },
};

export interface OccasionRow {
  eyebrow: string;
  title: string;
  products: Product[];
}

/**
 * Definisi baris occasion. Judul tetap di kode; PRODUK diambil dari CMS —
 * produk masuk baris bila kolom "Occasion" di admin cocok dengan `match`.
 * Urutan mengikuti sort order produk di CMS.
 */
const OCCASION_DEFS: { eyebrow: string; title: string; match: RegExp }[] = [
  { eyebrow: 'Birthday Flower', title: 'Happy Birthday!', match: /birthday/i },
  { eyebrow: 'Anniversary', title: 'I Love You', match: /i love you|anniversary/i },
  { eyebrow: 'Graduation', title: 'Happy Graduation!', match: /graduation/i },
  { eyebrow: 'Sympathy', title: 'Deepest Condolences', match: /condolence|sympathy/i },
  { eyebrow: 'Just For Me', title: 'Proud of My Self', match: /just because|speedy recovery|achievement|new beginnings/i },
];

/**
 * Susun baris occasion dari katalog live (getCatalog().allProducts).
 * Harga coret / label Sale hanya dari diskon yang diset di CMS (toProduct).
 * Baris tanpa produk yang cocok disembunyikan.
 */
export function buildOccasionRows(products: CatalogItem[]): OccasionRow[] {
  return OCCASION_DEFS.map(({ eyebrow, title, match }) => ({
    eyebrow,
    title,
    products: products
      .filter((c) => match.test(c.occasion ?? ''))
      .map((c) => ({ ...toProduct(c), slug: c.slug, href: `/product/${c.slug}` })),
  })).filter((row) => row.products.length > 0);
}


export interface SendToCard {
  icon: string;
  title: string;
  body: string;
  bestFor: string;
}

export const sendTo: SendToCard[] = [
  {
    icon: 'partner',
    title: 'Your Romantic Partner',
    body: 'For your partner, romantic and meaningful blooms are always a beautiful choice. Classic roses are timeless, while their favourite flowers or a bouquet in their favourite colour can make the gesture feel even more personal.',
    bestFor: 'Best for: Anniversaries · Valentine’s Day · Birthdays · Just Because',
  },
  {
    icon: 'parents',
    title: 'Your Parents',
    body: 'Soft, elegant arrangements in cheerful or sophisticated colours are a lovely way to show appreciation. Consider flowers that feel warm, graceful, and thoughtful rather than overly romantic.',
    bestFor: 'Best for: Mother’s Day · Father’s Day · Birthdays · Thank You',
  },
  {
    icon: 'friend',
    title: 'A Friend',
    body: 'Colourful bouquets and playful arrangements work beautifully for friends. Choose something that reflects their personality or simply brings a little happiness to their day.',
    bestFor: 'Best for: Birthdays · Congratulations · Get Well Soon',
  },
  {
    icon: 'colleague',
    title: 'A Colleague or Business Partner',
    body: 'For corporate gifting, opt for sophisticated arrangements with a refined colour palette. Minimal, elegant designs are ideal when you want to express appreciation without feeling too personal.',
    bestFor: 'Best for: Congratulations · Thank You · New Business · Corporate Events',
  },
  {
    icon: 'difficult',
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
