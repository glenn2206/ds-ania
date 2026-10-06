/** Native scrolling keeps links and add-to-cart controls usable without duplicated cards. */
export function initCardCarousel(row: HTMLElement) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let timer = 0;
  let hovered = false;
  let focused = false;
  let touching = false;
  const stop = () => { window.clearTimeout(timer); };
  const schedule = () => {
    stop();
    if (reduceMotion.matches || document.hidden || hovered || focused || touching) return;
    timer = window.setTimeout(() => {
      const first = Array.from(row.children).find((child) => !(child as HTMLElement).hidden) as HTMLElement | undefined;
      const gap = parseFloat(getComputedStyle(row).columnGap) || 0;
      const max = row.scrollWidth - row.clientWidth;
      if (first && max > 1) {
        const next = row.scrollLeft >= max - 2 ? 0 : Math.min(max, row.scrollLeft + first.offsetWidth + gap);
        row.scrollTo({ left: next, behavior: 'smooth' });
      }
      schedule();
    }, 4000);
  };
  row.addEventListener('pointerenter', (event) => { if (event.pointerType !== 'touch') { hovered = true; stop(); } });
  row.addEventListener('pointerleave', () => { hovered = false; schedule(); });
  row.addEventListener('focusin', () => { focused = true; stop(); });
  row.addEventListener('focusout', (event) => {
    focused = event.relatedTarget instanceof Node && row.contains(event.relatedTarget);
    schedule();
  });
  row.addEventListener('touchstart', () => { touching = true; stop(); }, { passive: true });
  const endTouch = () => { touching = false; schedule(); };
  row.addEventListener('touchend', endTouch, { passive: true });
  row.addEventListener('touchcancel', endTouch, { passive: true });
  row.addEventListener('wheel', schedule, { passive: true });
  document.addEventListener('visibilitychange', schedule);
  reduceMotion.addEventListener('change', schedule);
  schedule();
  return { reset: () => { row.scrollLeft = 0; schedule(); } };
}
