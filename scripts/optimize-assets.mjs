/**
 * scripts/optimize-assets.mjs
 * Sekali jalan: kompres + resize + rename semua gambar di public/assets.
 *  - products/*.jpg      → resize maxW 1200, JPEG q78 (in-place)
 *  - file flat terpakai  → rename ke nama kontekstual + JPEG q80
 *  - file flat lainnya   → dihapus
 *
 * Jalankan:  node scripts/optimize-assets.mjs
 */
import { readdir, readFile, writeFile, unlink, rename, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve(process.cwd(), 'public/assets');
const PRODUCTS = path.join(ROOT, 'products');

/** old flat filename → { name: new .jpg, w: maxWidth, q?: quality } */
const RENAME = {
  // hero (lebar, banyak ruang kosong kiri)
  '6_web_3_1.png': { name: 'hero-bouquet-on-table.jpg', w: 1800 },
  '7_chatgpt_image_aug_8__2026__12_16_17_am_1.png': { name: 'hero-bride-with-bouquet.jpg', w: 1800 },

  // scene / lifestyle
  '566_image_18.png': { name: 'scene-holding-yellow-bouquet.jpg', w: 1300 },
  '484__mg_9998_1.png': { name: 'scene-florist-arranging-box.jpg', w: 1200 },
  '355_image_15.png': { name: 'scene-bride-pastel-bouquet.jpg', w: 1100 },
  '483_image_17.png': { name: 'scene-ania-card-tulips.jpg', w: 1100 },
  '470_whatsapp_image_2026_08_08_at_01_38_38_1.png': { name: 'scene-bride-lace-kebaya.jpg', w: 1100 },
  '122_image_13.png': { name: 'scene-red-coral-arrangement.jpg', w: 1300 },

  // bouquet (pool katalog + tile + add-on + story)
  '388_img_8993_1.png': { name: 'bouquet-peach-garden-roses.jpg', w: 1100 },
  '477_whatsapp_image_2026_08_08_at_01_38_38_2.png': { name: 'bouquet-yellow-blue-wrap.jpg', w: 1100 },
  '390_img_8995_1.png': { name: 'bouquet-pink-carnation.jpg', w: 1100 },
  '376_img_8996_1.png': { name: 'bouquet-yellow-poms.jpg', w: 1100 },
  '224_rose_allure_1_2.png': { name: 'bouquet-rose-allure.jpg', w: 1100 },
  '223_rouge_e_le_gance_1.png': { name: 'bouquet-rouge-elegance.jpg', w: 1100 },
  '219_vibrant_longevity__1_2.png': { name: 'bouquet-vibrant-longevity.jpg', w: 1100 },
  '211_blush_amethyst_orchestra_1_1.png': { name: 'bouquet-blush-amethyst.jpg', w: 1100 },
  '360_love_symphony_2_1.png': { name: 'bouquet-love-symphony.jpg', w: 1100 },
  '15_blush_amethyst_orchestra_1_1.png': { name: 'bouquet-blush-amethyst-box.jpg', w: 1100 },
  '19_hello_sunshine_1_1.png': { name: 'bouquet-hello-sunshine.jpg', w: 1100 },
  '24_love_symphony_2_1.png': { name: 'bouquet-love-symphony-wrap.jpg', w: 1100 },
  '11_a_handful_flower_box_3_1.png': { name: 'bouquet-handful-box.jpg', w: 1100 },

  // avatar testimoni (dipakai ~48px → cukup 160px)
  '57_profile.png': { name: 'profile-claudia.jpg', w: 160, q: 82 },
  '58_profile.png': { name: 'profile-daniel.jpg', w: 160, q: 82 },
  '59_profile.png': { name: 'profile-michelle.jpg', w: 160, q: 82 },
  '113_chatgpt_image_aug_7__2026__07_49_55_pm_7.png': { name: 'profile-rangga.jpg', w: 160, q: 82 },
};

const KB = (n) => `${(n / 1024).toFixed(0)} KB`;

async function optimizeInPlace(dir, maxW, q) {
  const files = (await readdir(dir)).filter((f) => /\.(jpe?g|png)$/i.test(f));
  let before = 0;
  let after = 0;
  for (const f of files) {
    const p = path.join(dir, f);
    const input = await readFile(p); // baca penuh dulu (Windows: jangan baca+tulis path sama)
    before += input.length;
    const buf = await sharp(input)
      .rotate()
      .resize({ width: maxW, height: maxW, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: q, mozjpeg: true })
      .toBuffer();
    // tulis sebagai .jpg; kalau nama asli .png → ganti ekstensi + hapus asli
    const outName = f.replace(/\.png$/i, '.jpg');
    await writeFile(path.join(dir, outName), buf);
    if (outName !== f) await unlink(p);
    after += buf.length;
  }
  return { count: files.length, before, after };
}

async function run() {
  // 1) products/ — resize + kompres in-place
  const prod = await optimizeInPlace(PRODUCTS, 1200, 78);
  console.log(`products/  ${prod.count} file  ${KB(prod.before)} → ${KB(prod.after)}`);

  // 2) file flat: rename terpakai, hapus sisanya
  const flat = (await readdir(ROOT)).filter((f) => /\.(png|jpe?g)$/i.test(f));
  let kept = 0;
  let removed = 0;
  let before = 0;
  let after = 0;
  for (const f of flat) {
    const src = path.join(ROOT, f);
    const input = await readFile(src);
    before += input.length;
    const spec = RENAME[f];
    if (!spec) {
      await unlink(src);
      removed++;
      continue;
    }
    const buf = await sharp(input)
      .rotate()
      .resize({ width: spec.w, height: spec.w, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: spec.q ?? 80, mozjpeg: true })
      .toBuffer();
    await writeFile(path.join(ROOT, spec.name), buf);
    if (spec.name !== f) await unlink(src);
    after += buf.length;
    kept++;
  }
  console.log(`flat/      kept ${kept}, removed ${removed}  ${KB(before)} → ${KB(after)}`);

  // 3) laporan sisa nama lama yang belum ada (kalau ada typo di RENAME)
  const missing = Object.keys(RENAME).filter((f) => !existsSync(path.join(ROOT, RENAME[f].name)));
  if (missing.length) console.warn('BELUM TERBUAT:', missing);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
