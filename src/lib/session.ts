/**
 * session.ts — sesi admin lewat cookie bertanda-tangan HMAC (tanpa Express).
 * Dipakai halaman & API route Astro via `context.cookies` / `Astro.cookies`.
 */
import crypto from 'node:crypto';
import type { AstroCookies } from 'astro';
import { env } from './env';

const COOKIE = 'ania_admin';
const MAX_AGE = 14 * 24 * 60 * 60; // detik
const secret = () => env('SESSION_SECRET', 'dev-insecure-change-me');

export interface Session {
  uid: number;
  uname: string;
}

function sign(data: string): string {
  return crypto.createHmac('sha256', secret()).update(data).digest('base64url');
}

function serialize(payload: Session): string {
  const body = Buffer.from(
    JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + MAX_AGE }),
  ).toString('base64url');
  return `${body}.${sign(body)}`;
}

function parse(token: string | undefined): Session | null {
  if (!token) return null;
  const [body, mac] = token.split('.');
  if (!body || !mac) return null;
  const expected = sign(body);
  if (mac.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(mac), Buffer.from(expected)))
    return null;
  try {
    const o = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!o || typeof o.uid !== 'number' || typeof o.exp !== 'number') return null;
    if (o.exp * 1000 < Date.now()) return null;
    return { uid: o.uid, uname: String(o.uname || '') };
  } catch {
    return null;
  }
}

export function getSession(cookies: AstroCookies): Session | null {
  return parse(cookies.get(COOKIE)?.value);
}

export function setSession(cookies: AstroCookies, s: Session) {
  cookies.set(COOKIE, serialize(s), {
    httpOnly: true,
    sameSite: 'lax',
    secure: env('PUBLIC_SITE_URL').startsWith('https'),
    path: '/',
    maxAge: MAX_AGE,
  });
}

export function clearSession(cookies: AstroCookies) {
  cookies.delete(COOKIE, { path: '/' });
}
