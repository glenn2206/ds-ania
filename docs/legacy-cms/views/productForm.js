import { page, esc } from '../lib/render.js';

const CATS = ['premium-wrapped', 'bloom-box', 'standing', 'vase', 'accessory'];

export function productFormView({ user, product = {}, images = [], isNew = false, error = '' }) {
  const v = (k) => esc(product[k] ?? '');
  const catOpts = CATS.map(
    (c) => `<option value="${c}"${product.category === c ? ' selected' : ''}>${c}</option>`,
  ).join('');

  const imgList = images
    .map(
      (im) => `<li class="imgcard" data-img-id="${im.id}">
      <img src="/uploads/${esc(im.filename)}" alt="">
      <div class="imgcard__act">
        <button type="button" class="mini" data-move="up">↑</button>
        <button type="button" class="mini" data-move="down">↓</button>
        <button type="button" class="mini mini--danger" data-del>✕</button>
      </div>
    </li>`,
    )
    .join('');

  return page({
    title: isNew ? 'Produk baru' : product.name || 'Edit produk',
    user,
    body: `
<p><a class="link" href="/admin">← Semua produk</a></p>
<h1>${isNew ? 'Produk baru' : esc(product.name)}</h1>
${error ? `<p class="err">${esc(error)}</p>` : ''}

<form method="post" action="${isNew ? '/admin/products' : `/admin/products/${product.id}`}" class="form form--wide">
  <div class="grid2">
    <label>Nama <input name="name" value="${v('name')}" required></label>
    <label>Slug (URL) <input name="slug" value="${v('slug')}" placeholder="otomatis dari nama"></label>
    <label>Kategori
      <select name="category">${catOpts}</select>
    </label>
    <label>Pill (badge kartu) <input name="pill" value="${v('pill')}" placeholder="mis. Premium Wrapped"></label>
    <label>Harga (angka, kosong = By request) <input name="price" value="${v('price')}" inputmode="numeric"></label>
    <label>Catatan harga <input name="price_note" value="${v('price_note')}"></label>
    <label>Ukuran <input name="size" value="${v('size')}"></label>
    <label>Featured <input name="featured" value="${v('featured')}"></label>
  </div>
  <label>Bunga (pisah koma) <input name="flowers" value="${v('flowers')}"></label>
  <label>Occasion (pisah koma) <input name="occasion" value="${v('occasion')}"></label>
  <label>Link Google Drive foto asli <input name="drive" value="${v('drive')}"></label>
  <label>Deskripsi <textarea name="description" rows="5">${v('description')}</textarea></label>
  <label>Status
    <select name="status">
      <option value="published"${product.status !== 'draft' ? ' selected' : ''}>published (tampil di situs)</option>
      <option value="draft"${product.status === 'draft' ? ' selected' : ''}>draft (sembunyi)</option>
    </select>
  </label>
  <div class="rowbar">
    <button class="btn" type="submit">Simpan</button>
    ${
      isNew
        ? ''
        : `<button class="btn btn--danger" formaction="/admin/products/${product.id}/delete" formmethod="post"
             onclick="return confirm('Hapus produk ini?')">Hapus</button>`
    }
  </div>
</form>

${
  isNew
    ? '<p class="muted">Simpan dulu, lalu tambahkan foto.</p>'
    : `
<h2>Foto <span class="muted">(urutan = urutan galeri)</span></h2>
<ul class="imggrid" data-images data-product="${product.id}">${imgList || ''}</ul>
<form class="uploader" data-uploader data-product="${product.id}">
  <input type="file" name="photos" accept="image/*" multiple>
  <button class="btn btn--ghost" type="submit">Upload foto</button>
</form>`
}
`,
  });
}
