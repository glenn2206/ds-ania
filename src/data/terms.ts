/**
 * Konten halaman /terms. Body masih placeholder (lorem) mengikuti desain —
 * ganti isi `body` per section saat teks resmi siap.
 */

export const termsTitle = 'Terms & Condition';

const LOREM =
  'Lorem ipsum dolor sit amet consectetur. Dis adipiscing feugiat augue nulla turpis nibh commodo. Commodo nisi diam adipiscing ipsum quis. Viverra lorem sed eget consectetur augue quis. Sollicitudin magna nibh tellus nec velit sed nulla. Interdum congue pellentesque molestie facilisi aliquet erat. Sagittis suspendisse mi erat nisi volutpat odio sed duis. Lacus augue diam massa nec lectus et mattis.';
const LOREM_LONG = `${LOREM} Lorem ipsum dolor sit amet consectetur. Dis adipiscing feugiat augue nulla turpis nibh commodo. Commodo nisi diam adipiscing ipsum quis. Viverra lorem sed eget consectetur augue quis.`;

export interface TermsSection {
  heading: string;
  body: string[];
}

export const termsSections: TermsSection[] = [
  { heading: 'General', body: [LOREM] },
  { heading: 'Ordering & Payment', body: [LOREM, LOREM_LONG] },
  { heading: 'Delivery & Fulfilment', body: [LOREM] },
  { heading: 'Cancellations & Refunds', body: [LOREM, LOREM_LONG] },
];
