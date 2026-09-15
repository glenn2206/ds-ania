/**
 * scripts/gen-figma-reference.mjs — one-off: cetak blok referensi warna & font
 * something.html (dengan frekuensi pemakaian + status match kode kita) buat
 * ditempel manual ke src/styles/global.css sebagai single source of truth.
 * Jalankan: node scripts/gen-figma-reference.mjs
 *
 * PENTING: output mentah script ini belum di-konsolidasi. Blok yang sudah
 * ditempel di global.css sudah digabung manual (warna/font yang selisihnya
 * cuma beberapa poin RGB / 2px disatukan ke 1 nilai kanonis — lihat catatan
 * "digabung" di global.css). Kalau generate ulang & tempel ulang, cek lagi
 * mana yang perlu digabung, jangan asal timpa mentah-mentah.
 */
import { join } from 'node:path';
import { ourFonts, ourColors, figmaFonts, figmaColors, figmaNamedVars } from './lib/design-audit.mjs';

const root = process.cwd();
const figmaPath = join(root, 'something.html');

// warna brand icon pembayaran/WhatsApp — bukan bagian palette situs, dikecualikan
const BRAND_ICON_COLORS = new Set([
  '#253B80', '#179BD7', '#222D65', '#0F6EB6', '#006DBA', // PayPal / visa gradient
  '#58B03A', '#55B330', '#DE0D3D', '#E30138', // Mastercard
  '#4285F4', '#34A853', '#FBBC04', '#EA4335', // Google Pay
  '#22CE5A', // WhatsApp
]);

const fFonts = figmaFonts(figmaPath);
const fColorsMap = figmaColors(figmaPath);
const fNamed = figmaNamedVars(figmaPath);
const myColors = ourColors(root);
const myFonts = ourFonts(root);

const pad = (s, n) => String(s).padEnd(n, ' ');

console.log('/* ===== WARNA — diekstrak dari something.html, urut paling sering dipakai ===== */');
const colorRows = [...fColorsMap.values()]
  .filter((r) => !BRAND_ICON_COLORS.has(r.hex))
  .sort((a, b) => b.count - a.count);
for (const r of colorRows) {
  const named = fNamed.get(r.hex);
  const usedByUs = myColors.get(r.hex);
  const status = usedByUs ? `dipakai ${usedByUs.count}x di kode kita` : 'BELUM DIPAKAI di kode kita';
  const nameTag = named ? ` [Figma: ${named}]` : '';
  console.log(`  ${r.hex}  /* ${r.count}x di something.html${nameTag} — ${status} */`);
}

console.log('\n/* ===== FONT — diekstrak dari something.html, urut paling sering dipakai ===== */');
const fontRows = [...fFonts.values()].sort((a, b) => b.count - a.count);
const ourKeys = new Set([...myFonts.values()].map((r) => `${r.family}|${r.weight}|${r.size}`));
for (const r of fontRows) {
  const k = `${r.family}|${r.weight}|${r.size}`;
  const status = ourKeys.has(k) ? 'dipakai di kode kita' : 'BELUM DIPAKAI di kode kita';
  console.log(`  ${pad(r.family, 20)} ${pad(r.weight, 3)} ${pad(r.size + 'px', 6)} /* ${r.count}x di something.html — ${status} */`);
}
