import { useRef, useState } from 'react';
import type { MediaSettings } from '../../lib/settings';
import type { ChooseTile } from '../../data/choose';
import PhotoAdjuster from './PhotoAdjuster';
import { photoStyleObject } from '../../data/photo-fit';

export default function MediaEditor({ media, occasionTiles = [] }: { media: MediaSettings; occasionTiles?: ChooseTile[] }) {
  const [slides, setSlides] = useState(media.heroSlides);
  const [video, setVideo] = useState(media.aboutVideo);
  const [occasionCover, setOccasionCover] = useState(media.occasionCover);
  const [occasionImages, setOccasionImages] = useState(media.occasionImages);
  const [occasionFits, setOccasionFits] = useState(media.occasionFits ?? {});
  const [adjusting, setAdjusting] = useState<{ key: string; src: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const photosInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  async function upload(files: File[], kind: 'hero' | 'video' | 'occasion', occasionKey?: string) {
    if (!files.length || busy) return;
    setError(false);
    if (kind === 'hero' && slides.length + files.length > 10) { setError(true); setMessage('Carousel maksimal 10 foto.'); return; }
    setBusy(true); setMessage('Mengupload...');
    try {
      const form = new FormData(); form.append('kind', kind);
      files.forEach(file => form.append('files', file));
      const response = await fetch('/api/admin/media', { method: 'POST', body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Upload gagal.');
      if (kind === 'hero') setSlides(current => [...current, ...result.urls]);
      else if (kind === 'occasion' && occasionKey) {
        setOccasionImages(current => ({ ...current, [occasionKey]: result.urls[0] }));
        setOccasionFits(({ [occasionKey]: _old, ...rest }) => rest); // foto baru mulai dari posisi awal
      }
      else if (kind === 'occasion') setOccasionCover(result.urls[0]);
      else setVideo(result.urls[0]);
      setMessage('Upload selesai. Klik Simpan media untuk menerapkan.');
    } catch (err) { setError(true); setMessage((err as Error).message); }
    finally { setBusy(false); if (photosInput.current) photosInput.current.value = ''; if (videoInput.current) videoInput.current.value = ''; if (coverInput.current) coverInput.current.value = ''; }
  }

  async function putMedia(values: Partial<MediaSettings>) {
    const response = await fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ media: values }) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Gagal menyimpan.');
  }

  async function save() {
    setBusy(true); setError(false); setMessage('Menyimpan...');
    try {
      await putMedia({ heroSlides: slides, aboutVideo: video, occasionCover, occasionImages, occasionFits });
      setMessage('Media tersimpan.');
    } catch (err) { setError(true); setMessage((err as Error).message); }
    finally { setBusy(false); }
  }

  function move(index: number, delta: number) {
    setSlides(current => { const next = [...current]; [next[index], next[index + delta]] = [next[index + delta], next[index]]; return next; });
  }

  return <section className="card media-editor" aria-busy={busy}>
    <h2>Carousel beranda, foto Occasion &amp; video About</h2>
    {message && <div role="status" className={`flash flash--sticky flash--${error ? 'err' : 'ok'}`}>{message}</div>}
    <h3>Carousel beranda ({slides.length}/10)</h3>
    <div className="imgs">
      {slides.map((url, index) => <div className="imgs__cell" key={`${index}-${url}`}>
        <img src={url} alt={`Carousel ${index + 1}`} />
        <div className="imgs__bar">
          <button type="button" className="btn" title="Geser ke kiri" aria-label={`Geser foto ${index + 1} ke kiri`} disabled={busy || index === 0} onClick={() => move(index, -1)}>←</button>
          <button type="button" className="btn" title="Geser ke kanan" aria-label={`Geser foto ${index + 1} ke kanan`} disabled={busy || index === slides.length - 1} onClick={() => move(index, 1)}>→</button>
          <button type="button" className="btn btn--danger" title="Hapus dari carousel" aria-label={`Hapus foto ${index + 1}`} disabled={busy || slides.length === 1} onClick={() => setSlides(current => current.filter((_, i) => i !== index))}>×</button>
        </div>
      </div>)}
    </div>
    <input ref={photosInput} type="file" hidden multiple accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={event => upload(Array.from(event.target.files || []), 'hero')} />
    <button type="button" className="imgs__drop media-editor__drop" disabled={busy || slides.length === 10} onClick={() => photosInput.current?.click()} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (slides.length < 10) upload(Array.from(event.dataTransfer.files), 'hero'); }}>+ Upload foto carousel</button>
    <p className="hint">JPG, PNG, WebP. Maksimal 12 MB per foto.</p>
    <h3>Foto kartu Occasions di beranda</h3>
    <p className="hint">Foto Anniversary, Birthday, Get Well Soon, dan kartu lainnya di tab Occasions. Terpisah dari hero halaman Occasion.</p>
    <div className="imgs">
      {occasionTiles.map(tile => {
        const key = new URLSearchParams(tile.href.split('?')[1]).get('occasion')!;
        return <div className="imgs__cell" key={key}>
          <div className="imgs__frame"><img src={occasionImages[key] || tile.image} style={photoStyleObject(occasionFits[key])} alt={tile.label} /></div>
          <p className="imgs__title">{tile.label}</p>
          <div className="imgs__bar">
          <label className="btn btn--sm">Ganti foto
            <input type="file" hidden accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={event => { upload(Array.from(event.target.files || []), 'occasion', key); event.target.value = ''; }} />
          </label>
          <button type="button" className="btn btn--sm" disabled={busy} onClick={() => setAdjusting({ key, src: occasionImages[key] || tile.image })}>Atur foto</button>
          </div>
        </div>;
      })}
    </div>
    <p className="hint">JPG, PNG, WebP, maksimal 12 MB per foto. Setelah Ganti foto, klik Simpan media di bawah. Atur foto langsung tersimpan.</p>
    <h3>Hero halaman Occasion (terpisah)</h3>
    <div className="imgs"><div className="imgs__cell"><img src={occasionCover} alt="Cover Occasion" /></div></div>
    <input ref={coverInput} type="file" hidden accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={event => upload(Array.from(event.target.files || []), 'occasion')} />
    <button type="button" className="btn" disabled={busy} onClick={() => coverInput.current?.click()}>Ganti cover Occasion</button>
    <p className="hint">JPG, PNG, WebP. Maksimal 12 MB. Klik Simpan media; halaman Occasion mengikuti tanpa deploy ulang.</p>
    <h3>Video About (opsional)</h3>
    {video && <video className="media-editor__video" key={video} src={video} controls preload="metadata" playsInline />}
    <input ref={videoInput} type="file" hidden accept="video/mp4,video/webm" disabled={busy} onChange={event => upload(Array.from(event.target.files || []), 'video')} />
    <div className="media-editor__actions">
      <button type="button" className="btn" disabled={busy} onClick={() => videoInput.current?.click()}>+ {video ? 'Ganti video' : 'Upload video'}</button>
      {video && <button type="button" className="btn btn--danger" disabled={busy} onClick={() => setVideo('')}>Hapus video</button>}
    </div>
    <p className="hint">MP4 atau WebM. Maksimal 100 MB.</p>
    <button type="button" className="btn btn--primary" disabled={busy} onClick={save}>Simpan media</button>
    {adjusting && <PhotoAdjuster
      src={adjusting.src}
      frames={['square']}
      value={{ square: occasionFits[adjusting.key] }}
      onClose={() => setAdjusting(null)}
      onSave={async fits => {
        const { [adjusting.key]: _old, ...rest } = occasionFits;
        const next = fits.square ? { ...rest, [adjusting.key]: fits.square } : rest;
        await putMedia({ occasionImages, occasionFits: next });
        setOccasionFits(next);
        setAdjusting(null);
        setError(false); setMessage('Foto tersimpan. Situs ikut dalam ±60 detik.');
      }}
    />}
  </section>;
}
