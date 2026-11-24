import { useState } from 'react';
import { ADDON_SLUG, isBuiltin, type CategoryItem } from '../../data/categories';

interface Props {
  categories: CategoryItem[];
  /** jumlah produk per slug */
  counts: Record<string, number>;
  /** foto kartu beranda yang sedang tampil per slug (termasuk foto bawaan) */
  tiles: Record<string, string>;
}

interface Row extends CategoryItem { key: number; isNew?: boolean }

const slugify = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g, '').trim().replace(/[\s-]+/g, '-').slice(0, 40).replace(/-$/, '');

let nextKey = 0;
const toRows = (list: CategoryItem[]): Row[] => list.map((c) => ({ ...c, key: nextKey++ }));

export default function CategoryEditor({ categories, counts, tiles }: Props) {
  const [rows, setRows] = useState<Row[]>(() => toRows(categories));
  const [flash, setFlash] = useState<{ ok: boolean; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const patch = (key: number, p: Partial<Row>) => setRows((r) => r.map((x) => (x.key === key ? { ...x, ...p } : x)));
  const move = (i: number, dir: -1 | 1) =>
    setRows((r) => {
      const next = [...r];
      [next[i], next[i + dir]] = [next[i + dir], next[i]];
      return next;
    });
  const add = () => setRows((r) => [...r, { key: nextKey++, slug: '', label: '', visible: true, isNew: true }]);

  const upload = async (key: number, file?: File) => {
    if (!file) return;
    setUploading(true);
    setFlash(null);
    try {
      const form = new FormData();
      form.append('kind', 'occasion');
      form.append('files', file);
      const res = await fetch('/api/admin/media', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload gagal.');
      patch(key, { image: data.urls[0] });
      setFlash({ ok: true, msg: 'Foto siap. Klik Simpan.' });
    } catch (err) {
      setFlash({ ok: false, msg: (err as Error).message });
    } finally {
      setUploading(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFlash(null);
    try {
      const body = rows.map(({ slug, label, visible, image, isNew }) => ({ slug: isNew ? slugify(label) : slug, label, visible, image }));
      const res = await fetch('/api/admin/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categories: body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan.');
      setRows(toRows(data.categories));
      setFlash({ ok: true, msg: 'Tersimpan. Situs ikut dalam ±60 detik.' });
    } catch (err) {
      setFlash({ ok: false, msg: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save}>
      {flash && <div className={`flash flash--${flash.ok ? 'ok' : 'err'}`} role="status">{flash.msg}</div>}
      <div className="card cats">
        <table className="admin-table">
          <thead>
            <tr><th>Foto</th><th>Nama</th><th>Urutan</th><th>Tampil</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const used = counts[r.slug] || 0;
              const locked = !r.isNew && (isBuiltin(r.slug) || used > 0);
              return (
                <tr key={r.key}>
                  <td>
                    {r.slug !== ADDON_SLUG && (
                      <div className="cats__photo">
                        {(r.image || tiles[r.slug]) && <img src={r.image || tiles[r.slug]} alt={`Foto ${r.label}`} />}
                        <label className="btn btn--sm">
                          Ganti foto
                          <input type="file" hidden accept="image/jpeg,image/png,image/webp" disabled={uploading || saving} onChange={(e) => { upload(r.key, e.target.files?.[0]); e.target.value = ''; }} />
                        </label>
                        {r.image && <button type="button" className="btn btn--sm" title="Kembali ke foto awal" aria-label={`Hapus foto ${r.label}`} onClick={() => patch(r.key, { image: undefined })}>✕</button>}
                      </div>
                    )}
                  </td>
                  <td>
                    <div className="field"><input value={r.label} maxLength={60} required aria-label="Nama kategori" placeholder="Nama kategori" onChange={(e) => patch(r.key, { label: e.target.value })} /></div>
                  </td>
                  <td className="cats__order">
                    <button type="button" className="btn btn--sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Naikkan ${r.label}`}>↑</button>
                    <button type="button" className="btn btn--sm" disabled={i === rows.length - 1} onClick={() => move(i, 1)} aria-label={`Turunkan ${r.label}`}>↓</button>
                  </td>
                  <td>
                    <input
                      type="checkbox"
                      checked={r.visible}
                      disabled={r.slug === ADDON_SLUG}
                      aria-label={`Tampilkan ${r.label}`}
                      onChange={(e) => patch(r.key, { visible: e.target.checked })}
                    />
                  </td>
                  <td>
                    {!locked && (
                      <button type="button" className="btn btn--sm btn--danger" onClick={() => setRows((x) => x.filter((y) => y.key !== r.key))}>Hapus</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="admin-row">
        <button type="button" className="btn" onClick={add}>+ Kategori baru</button>
        <button className="btn btn--primary" type="submit" disabled={saving || uploading}>{uploading ? 'Mengunggah…' : saving ? 'Menyimpan…' : 'Simpan'}</button>
      </div>
    </form>
  );
}
