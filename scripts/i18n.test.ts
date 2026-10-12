import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeSearchQuery, translateText } from '../src/lib/i18n';

test('English source copy is preserved and Indonesian UI labels are localized', () => {
  assert.equal(translateText(' Looking for the Perfect Flowers Today? ', 'en'), ' Looking for the Perfect Flowers Today? ');
  assert.equal(translateText('SHOP', 'id'), 'BELANJA');
  assert.equal(translateText('City / Regency:', 'id'), 'Kota / Kabupaten:');
  assert.equal(translateText('  Contact Us  ', 'id'), '  Hubungi Kami  ');
  assert.equal(translateText('Blush Amethyst Orchestra', 'id'), 'Blush Amethyst Orchestra');
  assert.equal(translateText('Rp 950,000', 'id'), 'Rp 950,000');
});
test('search accepts Indonesian flower, occasion and colour names', () => {
  assert.equal(normalizeSearchQuery('Mawar putih'), 'rose white');
  assert.equal(normalizeSearchQuery('Bunga matahari untuk wisuda'), 'sunflower untuk graduation');
  assert.equal(normalizeSearchQuery('Ulang tahun'), 'birthday');
  assert.equal(normalizeSearchQuery('Love Symphony'), 'love symphony');
});
test('dynamic search counts, errors and accessible photo labels translate both ways', () => {
  assert.equal(translateText('3 results', 'id'), '3 hasil');
  assert.equal(translateText('1 hasil', 'en'), '1 result');
  assert.equal(translateText('Please check: Name, Email.', 'id'), 'Periksa: Nama, Email.');
  assert.equal(translateText('Photo 2', 'id'), 'Foto 2');
  assert.equal(translateText('Pilih kota dan lengkapi alamat penerima.', 'en'), 'Please select a city and complete the delivery address.');
  assert.equal(translateText('Delivery: JNE REG — Rp 14,000 (est.)', 'id'), 'Pengiriman: JNE REG — Rp 14,000 (estimasi)');
});
