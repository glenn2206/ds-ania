/**
 * Data halaman Shop (/shop). Produk dari katalog asli (Google Sheet) —
 * lihat src/data/catalog.ts.
 */
import type { Product } from './home';
import { premiumWrapped, type CatalogItem } from './catalog';

/** CatalogItem → Product (bentuk yang dipakai <ProductCard>) */
export function toProduct(c: CatalogItem): Product {
  return {
    image: c.image,
    title: c.name,
    pill: c.pill,
    price: c.price ?? 'By request',
    swatchImages: c.image2 ? [c.image, c.image2] : undefined,
  };
}

/** Katalog aktif = "Premium Wrapped Bloom" (25 produk). */
export const shopProducts: Product[] = premiumWrapped.map(toProduct);

export interface FilterItem {
  label: string;
  value: string;
}
export interface FilterGroupData {
  title: string;
  group?: string;
  /** label saja (nilai diturunkan otomatis) atau pasangan {label,value} eksplisit */
  items?: (string | FilterItem)[];
  collapsible?: boolean;
  active?: string;
}

export const filters: FilterGroupData[] = [
  { title: 'All Products', group: 'all' },
  { title: 'Sale', group: 'sale' },
  {
    title: 'Category',
    group: 'category',
    collapsible: true,
    active: 'Premium Wrapped Bloom',
    items: [
      'Bloom Box & Basket',
      'Premium Wrapped Bloom',
      'Standing Flower & Flower Board',
      'Vase',
      'Accessories',
      'Preserved Flower',
    ],
  },
  {
    title: 'For Occassions',
    group: 'occasion',
    collapsible: true,
    items: [
      'Anniversary',
      'Birthday',
      'Graduation',
      'Newborn',
      'Congratulations',
      'Wedding',
      'Get Well Soon',
      'Condolences',
      'Corporate',
      'Seasonal',
      'Just Because',
      'Just For Me',
    ],
  },
  {
    title: 'Flowers',
    group: 'flower',
    collapsible: true,
    items: ['Rose', 'Carnation', 'Daisy', 'Hydrangea', 'Chrysanthemum', 'Sunflower', 'Orchid', 'Tulip', 'Lisianthus', 'Peony'],
  },
  {
    title: 'Add On',
    group: 'addon',
    collapsible: true,
    items: ['Cake', 'Plush Doll', 'Chocolate', 'Balloon', 'Fairy Lights', 'Special Greeting Cards'],
  },
];
