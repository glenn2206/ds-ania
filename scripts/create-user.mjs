/**
 * scripts/create-user.mjs — buat / reset user admin.
 *   node scripts/create-user.mjs <username>
 * Password interaktif (tersembunyi). Otomasi: set env CMS_ADMIN_PASSWORD.
 */
import 'dotenv/config';
import readline from 'node:readline';
import bcrypt from 'bcryptjs';
import { q, end } from './_db.mjs';

const username = (process.argv[2] || '').trim();
if (!username) {
  console.error('Pakai: node scripts/create-user.mjs <username>   (atau set CMS_ADMIN_PASSWORD)');
  process.exit(1);
}

function askHidden(prompt) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const out = process.stdout;
    rl.question(prompt, (a) => {
      rl.close();
      out.write('\n');
      resolve(a);
    });
    rl._writeToOutput = (s) => {
      if (s.includes('\n')) out.write(s);
      else out.write('*');
    };
  });
}

const pw = process.env.CMS_ADMIN_PASSWORD || (await askHidden(`Password untuk "${username}": `));
if (pw.length < 6) {
  console.error('Minimal 6 karakter.');
  process.exit(1);
}

const hash = await bcrypt.hash(pw, 10);
const existing = await q('SELECT id FROM users WHERE username = ?', [username]);
if (existing.length) {
  await q('UPDATE users SET pass_hash = ? WHERE username = ?', [hash, username]);
  console.log(`OK — password "${username}" di-reset.`);
} else {
  await q('INSERT INTO users (username, pass_hash) VALUES (?, ?)', [username, hash]);
  console.log(`OK — user "${username}" dibuat.`);
}
await end();
