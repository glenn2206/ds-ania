import { page, esc } from '../lib/render.js';

const rupiah = (n) => (typeof n === 'number' ? 'Rp ' + n.toLocaleString('id-ID') : 'By request');

export function productListView({ user, products, lastJob }) {
  const rows = products
    .map(
      (p) => `<tr>
      <td><a href="/admin/products/${p.id}">${esc(p.name)}</a><br><small>${esc(p.slug)}</small></td>
      <td>${esc(p.category)}</td>
      <td>${rupiah(p.price)}</td>
      <td>${p.image_count}</td>
      <td><span class="tag tag--${p.status}">${esc(p.status)}</span></td>
    </tr>`,
    )
    .join('');

  const jobLine = lastJob
    ? `<p class="muted">Publish terakhir: <b>${esc(lastJob.status)}</b> — ${esc(
        new Date(lastJob.created_at).toLocaleString('id-ID'),
      )}</p>`
    : '';

  return page({
    title: 'Produk',
    user,
    body: `
<div class="rowbar">
  <h1>Produk <span class="muted">(${products.length})</span></h1>
  <div class="rowbar__actions">
    <a class="btn btn--ghost" href="/admin/products/new">+ Produk baru</a>
    <button class="btn" id="publishBtn" data-publish>Publish ke situs</button>
  </div>
</div>
${jobLine}
<pre class="publog" id="publog" hidden></pre>
<table class="tbl">
  <thead><tr><th>Nama</th><th>Kategori</th><th>Harga</th><th>Foto</th><th>Status</th></tr></thead>
  <tbody>${rows || '<tr><td colspan="5" class="muted">Belum ada produk.</td></tr>'}</tbody>
</table>`,
  });
}
