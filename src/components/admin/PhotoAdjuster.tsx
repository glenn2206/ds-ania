import { useEffect, useRef, useState } from 'react';
import { DEFAULT_FIT, MIN_ROOM, PHOTO_FRAMES, panPhoto, photoRoom, photoStyleObject, type PhotoFit, type PhotoFits, type PhotoFrame } from '../../data/photo-fit';

interface Props {
  src: string;
  /** layout yang memakai foto ini */
  frames: readonly PhotoFrame[];
  /** keterangan bila hanya satu layout */
  note?: string;
  value?: PhotoFits;
  /** simpan ke server; melempar Error bila gagal */
  onSave: (fits: PhotoFits) => Promise<void>;
  onClose: () => void;
}

const round = (n: number) => Math.round(n * 100) / 100;

/** Dialog atur foto: pilih layout, seret, zoom, simpan. Tidak mengubah file asli. */
export default function PhotoAdjuster({ src, frames: keys, note, value, onSave, onClose }: Props) {
  const [fits, setFits] = useState<PhotoFits>(value ?? {});
  const frames = PHOTO_FRAMES.filter((f) => keys.includes(f.key));
  const [active, setActive] = useState<PhotoFrame>(frames[0].key);
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLImageElement>(null);
  const drag = useRef<{ px: number; py: number; fit: PhotoFit } | null>(null);
  const fit = fits[active] ?? DEFAULT_FIT;
  const patch = (p: Partial<PhotoFit>) => setFits((f) => ({ ...f, [active]: { ...(f[active] ?? DEFAULT_FIT), ...p } }));

  useEffect(() => {
    dialog.current?.showModal();
    // foto dari cache bisa selesai dimuat sebelum onLoad terpasang
    const { naturalWidth, naturalHeight } = photo.current!;
    if (naturalWidth) setNatural({ width: naturalWidth, height: naturalHeight });
  }, []);

  const moveBy = (from: PhotoFit, dx: number, dy: number) =>
    patch(panPhoto(from, dx, dy, frame.current!.getBoundingClientRect(), natural));

  // arah yang bisa digeser; ukuran bingkai cukup dari rasionya
  const ratio = PHOTO_FRAMES.find((f) => f.key === active)!.ratio;
  const [rw, rh] = ratio.split('/').map(Number);
  const room = photoRoom(fit, { width: (380 * rw) / rh, height: 380 }, natural);
  const canX = Math.abs(room.x) >= MIN_ROOM;
  const canY = Math.abs(room.y) >= MIN_ROOM;
  const hint = canX && canY
    ? 'Seret foto untuk menggeser'
    : canY
      ? 'Seret ke atas atau bawah. Naikkan Zoom kalau mau ke kiri/kanan.'
      : canX
        ? 'Seret ke kiri atau kanan. Naikkan Zoom kalau mau ke atas/bawah.'
        : 'Foto sudah pas. Naikkan Zoom kalau mau digeser.';

  const onKey = (e: React.KeyboardEvent) => {
    const step = { ArrowLeft: [-8, 0], ArrowRight: [8, 0], ArrowUp: [0, -8], ArrowDown: [0, 8] }[e.key];
    if (!step) return;
    e.preventDefault();
    moveBy(fit, step[0], step[1]);
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try { await onSave(fits); }
    catch (err) { setError((err as Error).message); setSaving(false); }
  };

  return (
    <dialog
      ref={dialog}
      className="adjust"
      aria-label="Atur foto"
      onKeyDown={(e) => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') e.preventDefault(); }}
      onDragStart={(e) => e.preventDefault()}
      onCancel={(e) => { e.preventDefault(); onClose(); }}
    >
      <h2>Atur foto</h2>

      {frames.length > 1 ? (
        <div className="adjust__tabs" role="group" aria-label="Pilih tampilan">
          {frames.map((f) => (
            <button key={f.key} type="button" aria-pressed={f.key === active} onClick={() => setActive(f.key)}>{f.label}</button>
          ))}
        </div>
      ) : (
        note && <p className="hint adjust__hint">{note}</p>
      )}

      <div
        ref={frame}
        className="adjust__frame"
        style={{ aspectRatio: ratio }}
        tabIndex={0}
        role="application"
        aria-label="Seret foto atau pakai tombol panah"
        onKeyDown={onKey}
        onMouseDown={(e) => { e.preventDefault(); e.currentTarget.focus(); }}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); drag.current = { px: e.clientX, py: e.clientY, fit }; }}
        onPointerMove={(e) => { const d = drag.current; if (d) moveBy(d.fit, e.clientX - d.px, e.clientY - d.py); }}
        onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}
      >
        <img ref={photo} src={src} alt="" draggable={false} onLoad={(e) => setNatural({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })} style={photoStyleObject(fit)} />
      </div>
      <p className="hint adjust__hint" role="status">{hint}</p>

      <label className="adjust__zoom">
        Zoom
        <input type="range" min="1" max="3" step="0.05" value={fit.zoom} onChange={(e) => patch({ zoom: round(Number(e.target.value)) })} />
      </label>

      <div className="adjust__tools">
        <button type="button" className="btn btn--sm" aria-pressed={fit.fit === 'contain'} onClick={() => patch({ ...DEFAULT_FIT, fit: fit.fit === 'contain' ? 'cover' : 'contain' })}>Foto utuh</button>
        <button type="button" className="btn btn--sm" onClick={() => patch(DEFAULT_FIT)}>Reset</button>
        {frames.length > 1 && <button type="button" className="btn btn--sm" onClick={() => setFits({ shop: fit, square: fit, detail: fit })}>Samakan semua</button>}
      </div>

      {error && <div className="flash flash--err" role="alert">{error}</div>}
      <div className="adjust__actions">
        <button type="button" className="btn" onClick={onClose}>Batal</button>
        <button type="button" className="btn btn--primary" disabled={saving} onClick={save}>{saving ? 'Menyimpan…' : 'Simpan'}</button>
      </div>
    </dialog>
  );
}
