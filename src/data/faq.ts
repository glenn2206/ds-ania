/**
 * Konten halaman /faq. Item ke-2 (Delivery) teksnya asli dari index.html,
 * sisanya placeholder — tinggal ganti `q` / `a` di sini.
 */

export const faqTitle = 'Frequently Asked Question';

export interface FaqItem {
  q: string;
  category: string;
  a: string[];
  /** terbuka saat halaman dibuka */
  open?: boolean;
}

export const faqItems: FaqItem[] = [
  {
    q: 'How Do I Place an Order?',
    category: 'Ordering',
    a: [
      'Pick your bouquet, add it to the cart, then fill in the delivery form and complete your purchase.',
      'Your order is processed once we send a confirmation — attach your payment proof in the order form to speed things up.',
    ],
  },
  {
    q: 'How Long Does Delivery Take, and How Much Will It Cost?',
    category: 'Delivery',
    open: true,
    a: [
      'Our delivery starts from 10 a.m. - 10 p.m. (Western Indonesian Time/ WIB) for Same Day Delivery Service.',
      "If you need the flowers before 10 a.m. please complete your purchase at least the day before (D-1) delivery date. Some flowers might need longer preparation time, please check each product Delivery Notice on Product's Description before adding it to the cart.",
    ],
  },
  {
    q: 'What Payment Methods Do You Accept?',
    category: 'Payment',
    a: [
      'We accept bank transfer and major cards — Visa, Mastercard, JCB — as well as GoPay and PayPal.',
      'Orders are confirmed after payment is received and verified.',
    ],
  },
  {
    q: 'Can I Change or Cancel My Order?',
    category: 'Orders',
    a: [
      'Changes and cancellations are possible before your order enters preparation. Contact us as early as possible via WhatsApp with your order details.',
    ],
  },
];
