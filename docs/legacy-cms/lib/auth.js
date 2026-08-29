/** cms/lib/auth.js — login sederhana (1+ user), sesi via cookie bertanda-tangan. */
import bcrypt from 'bcryptjs';
import { q } from '../db.js';

export async function verifyLogin(username, password) {
  const rows = await q('SELECT id, username, pass_hash FROM users WHERE username = ? LIMIT 1', [
    String(username || '').trim(),
  ]);
  if (!rows.length) return null;
  const ok = await bcrypt.compare(String(password || ''), rows[0].pass_hash);
  return ok ? { id: rows[0].id, username: rows[0].username } : null;
}

/** middleware: blokir kalau belum login (kecuali rute yg diizinkan) */
export function requireAuth(req, res, next) {
  if (req.session && req.session.uid) return next();
  if (req.method === 'GET') return res.redirect('/login');
  return res.status(401).json({ error: 'unauthorized' });
}

export async function hashPassword(plain) {
  return bcrypt.hash(String(plain), 10);
}
