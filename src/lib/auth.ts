/** auth.ts — verifikasi login + hash password (bcrypt). */
import bcrypt from 'bcryptjs';
import { q } from './db';

export async function verifyLogin(username: string, password: string) {
  const rows = await q('SELECT id, username, pass_hash FROM users WHERE username = ? LIMIT 1', [
    String(username || '').trim(),
  ]);
  if (!rows.length) return null;
  const ok = await bcrypt.compare(String(password || ''), rows[0].pass_hash);
  return ok ? { id: Number(rows[0].id), username: rows[0].username as string } : null;
}

export async function hashPassword(plain: string) {
  return bcrypt.hash(String(plain), 10);
}
