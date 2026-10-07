/**
 * Konten Home page — dipisah dari markup supaya template tetap tipis.
 * Ganti path/nilai di sini; komponen tidak perlu disentuh.
 */

import { premiumWrapped, type CatalogItem } from './catalog';

export interface Product {
  image: string;
  title: string;
  pill?: string;
  price: number | string;
  compareAt?: number | string;
  state?: 'default' | 'sale' | 'soldout' | 'hover';
  swatchImages?: string[];
  slug?: string;
  href?: string;
}

/** 4 produk unggulan untuk grid "Flowers They'll Never Forget". */
export const featuredSlugs = ['blush-amethyst-orchestra', 'love-symphony', 'hello-sunshine', 'catch-your-eyes'];

const cardOf = (c: CatalogItem): Product => ({
  slug: c.slug,
  href: `/product/${c.slug}`,
  image: c.image,
  title: c.name,
  pill: c.pill,
  price: c.price ?? 'By request',
  compareAt: c.compareAt,
  state: c.soldOut ? 'soldout' : c.discountPercent ? 'sale' : undefined,
  swatchImages: c.image2 ? [c.image, c.image2] : undefined,
});

/** pilih 4 unggulan dari daftar premium-wrapped (live atau snapshot); jatuh ke 4 pertama bila slug hilang. */
export function toFeatured(list: CatalogItem[]): Product[] {
  const picked = featuredSlugs
    .map((s) => list.find((p) => p.slug === s))
    .filter((c): c is CatalogItem => Boolean(c));
  const need = list.filter((p) => !picked.includes(p)).slice(0, 4 - picked.length);
  return [...picked, ...need].slice(0, 4).map(cardOf);
}

/** snapshot default (dipakai bila halaman tidak meneruskan data live) */
export const products: Product[] = toFeatured(premiumWrapped);

/** slide hero — pakai foto lebar (subjek di kanan, ruang kosong di kiri untuk teks) */
export const heroSlides = [
  '/assets/hero-bouquet-on-table.jpg',
  '/assets/hero-bride-with-bouquet.jpg',
  '/assets/hero-bouquet-on-table.jpg',
];

export const tiles = [
  { image: '/assets/bouquet-blush-amethyst-box.jpg', label: 'Graduation', olive: true },
  { image: '/assets/bouquet-rose-allure.jpg', label: 'Anniversary' },
  { image: '/assets/bouquet-hello-sunshine.jpg', label: 'Just For Me' },
];

export const addons = [
  { slug: 'addon-plush-doll', image: '/assets/bouquet-rouge-elegance.jpg', title: 'Plush Doll', price: 'Rp 50,000' },
  { slug: 'addon-balloon', image: '/assets/bouquet-rose-allure.jpg', title: 'Balloon', price: 'Rp 100,000' },
  { slug: 'addon-cake', image: '/assets/bouquet-vibrant-longevity.jpg', title: 'Cake', price: 'Rp 300,000' },
];

export const whyAnia = [
  {
    icon: 'heart',
    title: 'Happy Customer Guarantee',
    body: 'If your flowers arrive damaged, we’ll make it right with a replacement.',
    mutedBody: true,
  },
  {
    icon: 'flower',
    title: 'Fresh Flower Guarantee',
    body: 'Fresh flowers, carefully selected for every order, prepared with care.',
    soft: true,
  },
  {
    icon: 'clock',
    title: 'Last Minute Order',
    body: 'Beautiful flowers are ready, even at the last minute.',
  },
  {
    icon: 'flower',
    title: 'Free Consultation',
    body: 'Get complimentary advice to find the perfect arrangement flower for you.',
  },
];

export const testimonials = [
  {
    quote:
      'ANIA Flower Boutique truly helped me express feelings that were difficult to put into words. The flowers were fresh, the arrangements were absolutely beautiful, and the delivery was right on time. Highly recommended for special moments.',
    avatar: '/assets/profile-claudia.jpg',
    name: 'Claudia S',
    city: 'Jakarta Utara',
  },
  {
    quote:
      'I ordered for an anniversary, and the result exceeded my expectations. The design was elegant, looked premium, and my partner absolutely loved it. The ordering process was also easy, and the response was quick.',
    avatar: '/assets/profile-daniel.jpg',
    name: 'Daniel K',
    city: 'Tangerang',
  },
  {
    quote:
      'The service was outstanding. I ordered a standing flower arrangement for a congratulatory message, and the result was very neat and classy. ANIA truly understands how to convey messages through flowers.',
    avatar: '/assets/profile-michelle.jpg',
    name: 'Michelle T',
    city: 'Bekasi',
  },
  {
    quote:
      'Fresh, on time, and beautifully wrapped. The bouquet lasted well over a week and looked exactly like the photo. Will order again for the next occasion.',
    avatar: '/assets/profile-rangga.jpg',
    name: 'Rangga P',
    city: 'Jakarta Selatan',
  },
];
