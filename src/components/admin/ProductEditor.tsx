import { useCallback, useRef, useState } from 'react';

/* ------------------------------------------------------------------ types */
export interface ProductRow {
  id: number;
  slug: string;
  name: string;
  category: string;
  pill: string | null;
  flowers: string | null;
  size: string | null;
  price: number | string | null;
  price_note: string | null;
  stock: number | string | null;
  description: string | null;
  occasion: string | null;
  drive: string | null;
  featured: string | null;
  status: string;
}
export interface ImageRow {
  id: number;
  filename: string;
  position: number;
}
interface Props {
  mode: 'new' | 'edit';
  product: ProductRow | null;
  images: ImageRow[];
}

const CATEGORIES = [
  ['premium-wrapped', 'Premium Wrapped Bloom'],
  ['bloom-box', 'Bloom Box & Basket'],
  ['standing', 'Standing Flower & Board'],
  ['vase', 'Vase'],
  ['accessory', 'Accessories / Add-on'],
];

const str = (v: unknown) => (v == null ? '' : String(v));

/* ------------------------------------------------------------------ view */
export default function ProductEditor({ mode, product, images: initialImages }: Props) {
  const [form, setForm] = useState({
    name: str(product?.name),
    slug: str(product?.slug),
    category: str(product?.category) || 'premium-wrapped',
    pill: str(product?.pill),
    price: str(product?.price),
    stock: str(product?.stock),
    flowers: str(product?.flowers),
    size: str(product?.size),
    price_note: str(product?.price_note),
    occasion: str(product?.occasion),
    featured: str(product?.featured),
    drive: str(product?.drive),
    description: str(product?.description),
    status: str(product?.status) || 'published',
  });
  const [images, setImages] = useState<ImageRow[]>(initialImages || []);
  const [flash, setFlash] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [over, setOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  /* ---- save form ---- */
  const save = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setSaving(true);
      setFlash(null);
      try {
        const url = mode === 'new' ? '/api/admin/products' : `/api/admin/products/${product!.id}`;
        const method = mode === 'new' ? 'POST' : 'PUT';
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Gagal menyimpan');
        if (mode === 'new') {
          window.location.href = `/admin/products/${data.id}`;
          return;
        }
        setForm((f) => ({ ...f, slug: data.slug ?? f.slug }));
        setFlash({ kind: 'ok', msg: 'Tersimpan. Situs ikut ter-update dalam ±60 detik.' });
      } catch (err) {
        setFlash({ kind: 'err', msg: (err as Error).message });
      } finally {
        setSaving(false);
      }
    },
    [form, mode, product],
  );

  /* ---- images ---- */
  const upload = useCallback(
    async (files: FileList | null) => {
      if (!files || !files.length || !product) return;
      setUploading(true);
      setFlash(null);
      try {
        const fd = new FormData();
        Array.from(files).forEach((f) => fd.append('photos', f));
        const res = await fetch(`/api/admin/products/${product.id}/images`, { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Upload gagal');
        setImages(data.images);
      } catch (err) {
        setFlash({ kind: 'err', msg: (err as Error).message });
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = '';
      }
    },
    [product],
  );

  const move = useCallback(
    async (idx: number, dir: -1 | 1) => {
      const next = [...images];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return;
      [next[idx], next[j]] = [next[j], next[idx]];
      setImages(next);
      const res = await fetch(`/api/admin/products/${product!.id}/images/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: next.map((im) => im.id) }),
      });
      if (res.ok) setImages((await res.json()).images);
    },
    [images, product],
  );

  const del = useCallback(
    async (id: number) => {
      if (!confirm('Hapus foto ini?')) return;
      const res = await fetch(`/api/admin/products/${product!.id}/images/${id}`, { method: 'DELETE' });
      if (res.ok) setImages((await res.json()).images);
    },
    [product],
  );

  const removeProduct = useCallback(async () => {
    if (!product) return;
    if (!confirm(`Hapus produk "${form.name}" beserta fotonya? Tidak bisa dibatalkan.`)) return;
    const res = await fetch(`/api/admin/products/${product.id}`, { method: 'DELETE' });
    if (res.ok) window.location.href = '/admin';
    else setFlash({ kind: 'err', msg: 'Gagal menghapus' });
  }, [product, form.name]);

  /* ---- render ---- */
  return (
    <form onSubmit={save}>
      {flash && <div className={`flash flash--${flash.kind === 'ok' ? 'ok' : 'err'}`}>{flash.msg}</div>}

      <div className="card">
        <h2>Detail produk</h2>
        <div className="form-grid">
          <div className="field field--full">
            <label>Nama *</label>
            <input value={form.name} onChange={set('name')} required />
          </div>
          <div className="field">
            <label>Slug</label>
            <input value={form.slug} onChange={set('slug')} placeholder="otomatis dari nama" />
            <span className="hint">URL: /product/{form.slug || '…'}</span>
          </div>
          <div className="field">
            <label>Kategori</label>
            <select value={form.category} onChange={set('category')}>
              {CATEGORIES.map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Harga (Rp)</label>
            <input value={form.price} onChange={set('price')} inputMode="numeric" placeholder="kosong = By request" />
          </div>
          <div className="field">
            <label>Stok</label>
            <input value={form.stock} onChange={set('stock')} inputMode="numeric" placeholder="kosong = ∞ (tidak dilacak)" />
          </div>
          <div className="field">
            <label>Pill (label kartu)</label>
            <input value={form.pill} onChange={set('pill')} />
          </div>
          <div className="field">
            <label>Status</label>
            <select value={form.status} onChange={set('status')}>
              <option value="published">published</option>
              <option value="draft">draft (sembunyi dari situs)</option>
            </select>
          </div>
          <div className="field">
            <label>Bunga</label>
            <input value={form.flowers} onChange={set('flowers')} placeholder="Rose, Hydrangea, …" />
          </div>
          <div className="field">
            <label>Ukuran</label>
            <input value={form.size} onChange={set('size')} />
          </div>
          <div className="field">
            <label>Occasion</label>
            <input value={form.occasion} onChange={set('occasion')} />
          </div>
          <div className="field">
            <label>Featured (label)</label>
            <input value={form.featured} onChange={set('featured')} />
          </div>
          <div className="field">
            <label>Catatan harga</label>
            <input value={form.price_note} onChange={set('price_note')} placeholder="mis. mulai dari …" />
          </div>
          <div className="field">
            <label>Link Drive (opsional)</label>
            <input value={form.drive} onChange={set('drive')} />
          </div>
          <div className="field field--full">
            <label>Deskripsi</label>
            <textarea value={form.description} onChange={set('description')} />
          </div>
        </div>
      </div>

      {mode === 'edit' && product && (
        <div className="card">
          <h2>Foto ({images.length})</h2>
          {images.length > 0 && (
            <div className="imgs" style={{ marginBottom: 14 }}>
              {images.map((im, i) => (
                <div className="imgs__cell" key={im.id}>
                  <img src={`/uploads/${im.filename}`} alt="" loading="lazy" />
                  <div className="imgs__bar">
                    <button type="button" className="btn btn--sm" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                    <button type="button" className="btn btn--sm" disabled={i === images.length - 1} onClick={() => move(i, 1)}>↓</button>
                    <button type="button" className="btn btn--sm btn--danger" onClick={() => del(im.id)}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div
            className={`imgs__drop${over ? ' is-over' : ''}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => { e.preventDefault(); setOver(false); upload(e.dataTransfer.files); }}
          >
            {uploading ? 'Mengunggah…' : 'Klik atau tarik foto ke sini (JPG/PNG, otomatis di-resize 1200px)'}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => upload(e.target.files)} />
          <p className="hint" style={{ marginTop: 8 }}>Foto pertama = gambar utama. Urutkan dengan ↑ ↓.</p>
        </div>
      )}

      <div className="admin-row">
        <div>
          {mode === 'edit' && (
            <button type="button" className="btn btn--danger" onClick={removeProduct}>Hapus produk</button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <a className="btn" href="/admin">Kembali</a>
          <button className="btn btn--primary" type="submit" disabled={saving}>
            {saving ? 'Menyimpan…' : mode === 'new' ? 'Simpan & lanjut ke foto' : 'Simpan perubahan'}
          </button>
        </div>
      </div>
    </form>
  );
}
