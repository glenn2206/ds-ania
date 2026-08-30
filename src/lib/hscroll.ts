/**
 * hscroll.ts — carousel scroll horizontal yang dipakai bareng
 * ("Choose your Flower", OccasionRow, dll):
 *   - auto-geser MULUS terus-menerus (requestAnimationFrame, delta-time)
 *   - loop mulus (konten digandakan 2× → saat lewat 1 salinan, mundur 1 salinan)
 *   - bisa di-drag (mouse) / scroll / swipe manual + tombol panah opsional
 *   - pause saat hover baris / drag / wheel / fokus / tab tidak aktif; lanjut setelah diam
 *
 * `row` = elemen overflow-x:auto berisi tile ×2.
 */
export interface HScrollControls {
  play: () => void;
  pause: () => void;
  bump: () => void;
  reset: () => void;
}

export interface HScrollOpts {
  /** kecepatan auto-geser, px per detik. default 55 */
  pxPerSec?: number;
  /** jeda sebelum lanjut setelah interaksi (ms). default 1600 */
  idleMs?: number;
  prev?: HTMLElement | null;
  next?: HTMLElement | null;
  /** lebar 1 salinan konten. default = scrollWidth / 2 */
  loopHalf?: () => number;
  /** px per klik panah. default = lebar tile pertama + gap */
  step?: () => number;
}

export function initHScroll(row: HTMLElement, opts: HScrollOpts = {}): HScrollControls {
  const pxPerSec = opts.pxPerSec ?? 60;
  const idleMs = opts.idleMs ?? 1600;
  const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const loopHalf = opts.loopHalf ?? (() => row.scrollWidth / 2 || 1);
  const step =
    opts.step ??
    (() => {
      const c = row.querySelector<HTMLElement>(':scope > *:not([hidden])');
      const gap = parseFloat(getComputedStyle(row).columnGap || '20') || 20;
      return c ? c.offsetWidth + gap : 260;
    });

  let pos = 0; // akumulator float (scrollLeft browser dibulatkan → drift kalau tak ditampung)
  let playing = false;
  let raf = 0;
  let idle = 0;
  let last = 0;

  const wrap = () => {
    const w = loopHalf();
    if (pos >= w) pos -= w;
    else if (pos < 0) pos += w;
  };

  const frame = (now: number) => {
    if (!playing) return;
    const dt = last ? Math.min(now - last, 64) : 16;
    last = now;
    pos += (pxPerSec * dt) / 1000;
    wrap();
    row.scrollLeft = pos;
    raf = requestAnimationFrame(frame);
  };

  const play = () => {
    if (playing || REDUCE || document.hidden) return;
    playing = true;
    pos = row.scrollLeft; // resync (mis. habis di-drag)
    last = 0;
    raf = requestAnimationFrame(frame);
  };
  const pause = () => {
    playing = false;
    cancelAnimationFrame(raf);
  };
  const bump = () => {
    pause();
    window.clearTimeout(idle);
    idle = window.setTimeout(play, idleMs);
  };

  // --- drag-to-scroll (mouse), 1:1 ---
  let drag: { x: number; left: number; moved: boolean } | null = null;
  row.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') return; // HP: swipe native
    drag = { x: e.clientX, left: row.scrollLeft, moved: false };
    row.classList.add('is-dragging');
    row.setPointerCapture(e.pointerId);
    pause();
  });
  row.addEventListener('pointermove', (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 3) drag.moved = true;
    row.scrollLeft = drag.left - dx;
    pos = row.scrollLeft;
    wrap();
  });
  const endDrag = (e: PointerEvent) => {
    if (!drag) return;
    try {
      row.releasePointerCapture(e.pointerId);
    } catch {}
    row.classList.remove('is-dragging');
    const moved = drag.moved;
    drag = null;
    if (moved) {
      const kill = (ev: Event) => {
        ev.preventDefault();
        ev.stopPropagation();
      };
      row.addEventListener('click', kill, { capture: true, once: true });
      window.setTimeout(() => row.removeEventListener('click', kill, true), 60);
    }
    bump();
  };
  row.addEventListener('pointerup', endDrag);
  row.addEventListener('pointercancel', endDrag);
  row.addEventListener('dragstart', (e) => e.preventDefault());

  // --- panah (loop tanpa ujung → tak pernah disabled) ---
  opts.prev?.addEventListener('click', () => {
    row.scrollBy({ left: -step(), behavior: 'smooth' });
    bump();
  });
  opts.next?.addEventListener('click', () => {
    row.scrollBy({ left: step(), behavior: 'smooth' });
    bump();
  });

  // --- pause: hanya saat hover BARIS-nya ---
  row.addEventListener('wheel', bump, { passive: true });
  row.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'touch') pause();
  });
  row.addEventListener('pointerleave', (e) => {
    if (e.pointerType !== 'touch') play();
  });
  row.addEventListener('focusin', pause);
  row.addEventListener('focusout', play);
  document.addEventListener('visibilitychange', () => (document.hidden ? pause() : play()));

  // mulai sendiri (setelah layout siap) — caller tak perlu ingat panggil play()
  requestAnimationFrame(() => requestAnimationFrame(play));
  window.setTimeout(play, 250);

  return { play, pause, bump, reset: () => { row.scrollLeft = 0; pos = 0; } };
}
