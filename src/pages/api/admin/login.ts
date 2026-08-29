/** POST /api/admin/login — form login admin. */
import type { APIRoute } from 'astro';
import { verifyLogin } from '../../../lib/auth';
import { setSession } from '../../../lib/session';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData();
  const user = await verifyLogin(String(form.get('username') || ''), String(form.get('password') || ''));
  if (!user) return redirect('/admin/login?err=' + encodeURIComponent('Username / password salah.'));
  setSession(cookies, { uid: user.id, uname: user.username });
  return redirect('/admin');
};
