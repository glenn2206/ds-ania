/** POST /api/admin/logout */
import type { APIRoute } from 'astro';
import { clearSession } from '../../../lib/session';

export const prerender = false;

export const POST: APIRoute = async ({ cookies, redirect }) => {
  clearSession(cookies);
  return redirect('/admin/login');
};
