export async function readCheckoutStatus(fetcher: typeof fetch = fetch): Promise<boolean> {
  const response = await fetcher('/api/checkout-status', { cache: 'no-store', signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error('Checkout readiness unavailable.');
  const data = await response.json();
  if (typeof data.enabled !== 'boolean') throw new Error('Invalid checkout readiness.');
  return data.enabled;
}

export function watchCheckoutStatus(initial: boolean, changed: (enabled: boolean) => void) {
  let known = initial;
  let pending = false;
  const refresh = async () => {
    if (pending || document.visibilityState === 'hidden') return;
    pending = true;
    try {
      const enabled = await readCheckoutStatus();
      if (known !== enabled) { known = enabled; changed(enabled); }
    } catch { /* Keep last known UI state. Server still validates every request. */ }
    finally { pending = false; }
  };
  window.addEventListener('focus', refresh);
  window.addEventListener('pageshow', refresh);
  document.addEventListener('visibilitychange', refresh);
  window.addEventListener('storage', event => { if (event.key === 'ania:checkout-status') void refresh(); });
  void refresh();
}
