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

  // --- drag-to-scroll (mouse) — TAP/klik biasa tetap tembus ke link ---
  // Kunci: JANGAN capture pointer & JANGAN pasang .is-dragging sampai jari
  // benar-benar bergeser > THRESHOLD. Sebelum itu, event mengalir normal → <a> bisa diklik.
  const THRESHOLD = 6;
  let drag: { id: number; x: number; left: number; moved: boolean; captured: boolean } | null = null;

  row.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch' || e.button !== 0) return; // HP: swipe native; hanya klik kiri
    drag = { id: e.pointerId, x: e.clientX, left: row.scrollLeft, moved: false, captured: false };
    pause();
  });
  row.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved) {
      if (Math.abs(dx) <= THRESHOLD) return; // masih diam → biarkan jadi klik
      drag.moved = true;
      row.classList.add('is-dragging');
      try {
        row.setPointerCapture(drag.id);
        drag.captured = true;
      } catch {}
    }
    e.preventDefault();
    row.scrollLeft = drag.left - dx;
    pos = row.scrollLeft;
    wrap();
  });
  const endDrag = (id?: number) => {
    if (!drag || (id !== undefined && id !== drag.id)) return;
    if (drag.captured) {
      try {
        row.releasePointerCapture(drag.id);
      } catch {}
    }
    const moved = drag.moved;
    drag = null;
    row.classList.remove('is-dragging');
    if (moved) {
      // habis di-drag → telan 1 klik berikutnya biar link tidak kebuka
      const kill = (ev: Event) => {
        ev.preventDefault();
        ev.stopPropagation();
      };
      row.addEventListener('click', kill, { capture: true, once: true });
      window.setTimeout(() => row.removeEventListener('click', kill, true), 200);
    }
    bump();
  };
  row.addEventListener('pointerup', (e) => endDrag(e.pointerId));
  row.addEventListener('pointercancel', (e) => endDrag(e.pointerId));
  row.addEventListener('lostpointercapture', () => endDrag());
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
