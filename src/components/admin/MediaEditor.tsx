import { useRef, useState } from 'react';
import type { MediaSettings } from '../../lib/settings';

export default function MediaEditor({ media }: { media: MediaSettings }) {
  const [slides, setSlides] = useState(media.heroSlides);
  const [video, setVideo] = useState(media.aboutVideo);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const photosInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);

  async function upload(files: File[], kind: 'hero' | 'video') {
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
      else setVideo(result.urls[0]);
      setMessage('Upload selesai. Klik Simpan media untuk menerapkan.');
    } catch (err) { setError(true); setMessage((err as Error).message); }
    finally { setBusy(false); if (photosInput.current) photosInput.current.value = ''; if (videoInput.current) videoInput.current.value = ''; }
  }

  async function save() {
    setBusy(true); setError(false); setMessage('Menyimpan...');
    try {
      const response = await fetch('/api/admin/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ media: { heroSlides: slides, aboutVideo: video } }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Gagal menyimpan.');
      setMessage('Media tersimpan.');
    } catch (err) { setError(true); setMessage((err as Error).message); }
    finally { setBusy(false); }
  }

  function move(index: number, delta: number) {
    setSlides(current => { const next = [...current]; [next[index], next[index + delta]] = [next[index + delta], next[index]]; return next; });
  }

  return <section className="card media-editor" aria-busy={busy}>
    <h2>Carousel beranda &amp; video About</h2>
    {message && <div role="status" className={`flash flash--${error ? 'err' : 'ok'}`}>{message}</div>}
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
    <h3>Video About (opsional)</h3>
    {video && <video className="media-editor__video" key={video} src={video} controls preload="metadata" playsInline />}
    <input ref={videoInput} type="file" hidden accept="video/mp4,video/webm" disabled={busy} onChange={event => upload(Array.from(event.target.files || []), 'video')} />
    <div className="media-editor__actions">
      <button type="button" className="btn" disabled={busy} onClick={() => videoInput.current?.click()}>+ {video ? 'Ganti video' : 'Upload video'}</button>
      {video && <button type="button" className="btn btn--danger" disabled={busy} onClick={() => setVideo('')}>Hapus video</button>}
    </div>
    <p className="hint">MP4 atau WebM. Maksimal 100 MB.</p>
    <button type="button" className="btn btn--primary" disabled={busy} onClick={save}>Simpan media</button>
  </section>;
}
