/**
 * Konten halaman /about ("About Us"). Teks dari index.html, gambar dari /public/assets.
 */

export const whoWeAre = {
  eyebrow: 'Who We Are?',
  title: 'Flowers That Speak Louder Than Words',
  image: '/assets/scene-holding-yellow-bouquet.jpg',
  paragraphs: [
    'At ANIA Flower Boutique, we believe that the most meaningful feelings are not always spoken. In a world that moves quickly, some feelings deserve more than words, a call or even a text message—but flowers have a way of saying what the heart already knows.',
    'From birthdays and anniversaries to congratulations and sympathy, our trained team believes in sharing this beauty and helping build a better world through thoughtful gifts and floral arrangements.',
  ],
  quote: 'Flowers are the earth’s way of smiling.',
  promiseTitle: 'Our Promise',
  promiseBody:
    'From the first click to the final delivery, we’re committed to making every floral gift as beautiful as the moment it’s meant for.',
  checklist: [
    'High Quality Gift and Flower Arrangement',
    'Professionally arranged for 10+ years',
    'Easy online ordering system',
    'Reliable on-time delivery',
  ],
};

export const behindTheFlower = {
  title: 'Behind The Flower',
  subtitle:
    'From the first stem we select to the moment your flowers arrive, there’s a team of people who care about getting every detail right.',
  steps: [
    {
      icon: 'leaf-circle',
      title: 'Select',
      body: 'We carefully select flowers for quality, freshness and character.',
    },
    {
      icon: 'flower',
      title: 'Arrange',
      body: 'Our florists thoughtfully design each arrangement.',
    },
    {
      icon: 'truck-delivery',
      title: 'Prepare & Delivery',
      body: 'Every order is carefully wrapped and prepared for delivery.',
    },
  ],
};

/** kolase foto — bento: 1 besar kiri (2 baris) + 3 kanan */
export const collage = {
  big: '/assets/scene-florist-arranging-box.jpg',
  top: '/assets/bouquet-peach-garden-roses.jpg',
  bl: '/assets/scene-bride-pastel-bouquet.jpg',
  br: '/assets/scene-ania-card-tulips.jpg',
};

export const flowerStory = {
  titleLead: 'A Flower for every ',
  titleItalic: 'Story',
  body:
    'From joyful celebrations to quiet gestures, see how our flowers become part of life’s most meaningful moments.',
  /** akun IG — fallback saat sebuah slide belum punya link post sendiri */
  instagramUrl: 'https://www.instagram.com/ania_flowerboutique/',
  /**
   * tiap slide = sepasang gambar + (opsional) URL post IG terkait.
   * TODO: isi elemen ke-3 dengan permalink post IG masing-masing (butuh data dari klien).
   */
  slides: [
    ['/assets/scene-bride-lace-kebaya.jpg', '/assets/bouquet-yellow-blue-wrap.jpg'],
    ['/assets/scene-bride-pastel-bouquet.jpg', '/assets/bouquet-peach-garden-roses.jpg'],
    ['/assets/bouquet-pink-carnation.jpg', '/assets/bouquet-yellow-poms.jpg'],
  ] as [string, string, string?][],
  socialLabel: 'Visit Our Social Media',
  socials: [
    { icon: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/ania_flowerboutique/' },
    { icon: 'tiktok', label: 'TikTok', href: '#' },
    { icon: 'facebook', label: 'Facebook', href: '#' },
  ],
};
