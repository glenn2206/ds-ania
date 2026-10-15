// Bounded, process-local cache; failed requests are never cached.
export class ShippingCache<T> {
  private values = new Map<string, { value: T; expires: number }>();
  private pending = new Map<string, Promise<T>>();
  constructor(private ttl: number, private limit = 500) {}
  async get(key: string, load: () => Promise<T>): Promise<T> {
    const hit = this.values.get(key);
    if (hit && hit.expires > Date.now()) return hit.value;
    this.values.delete(key);
    const running = this.pending.get(key);
    if (running) return running;
    if (this.pending.size >= 20) throw new Error('Shipping is busy. Please try again shortly.');
    const request = load().then((value) => {
      if (this.values.size >= this.limit) this.values.delete(this.values.keys().next().value!);
      this.values.set(key, { value, expires: Date.now() + this.ttl });
      return value;
    }).finally(() => this.pending.delete(key));
    this.pending.set(key, request);
    return request;
  }
}
const windows = new Map<string, { count: number; expires: number }>();
export function allowShippingRequest(key: string, limit = 20): boolean {
  const now = Date.now();
  for (const [id, window] of windows) if (window.expires <= now) windows.delete(id);
  const current = windows.get(key);
  if (current) return ++current.count <= limit;
  if (windows.size >= 2000) return false;
  windows.set(key, { count: 1, expires: now + 60_000 });
  return true;
}
