import type { APIRoute } from 'astro';
import { getCheckoutEnabled } from '../../lib/settings';

export const prerender = false;
// Public readiness only. No provider credentials or admin settings are exposed.
export const GET: APIRoute = async () => new Response(JSON.stringify({ enabled: await getCheckoutEnabled() }), {
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
});
