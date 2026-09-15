/**
 * scripts/lib/design-audit.mjs — mesin audit font & warna: bandingin kode kita
 * (src/**\/*.astro + global.css) vs something.html (Figma export, dev-only).
 * Dipakai oleh src/pages/design-audit.astro (live tiap request, SSR).
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir, exts, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    let st;
    try { st = statSync(p); } catch { continue; }
    if (st.isDirectory()) {
      if (name !== 'node_modules' && !name.startsWith('.')) walk(p, exts, out);
    } else if (exts.some((e) => name.endsWith(e))) {
      out.push(p);
    }
  }
  return out;
}

const key = (family, weight, size) => `${family.trim()}|${weight}|${Math.round(size)}`;

/** Semua kombinasi font:weight size/lh 'Family' di kode kita (component <style> + global.css). */
export function ourFonts(root) {
  const files = [
    ...walk(join(root, 'src', 'components'), ['.astro']),
    ...walk(join(root, 'src', 'pages'), ['.astro']),
    join(root, 'src', 'styles', 'global.css'),
  ];
  const map = new Map();
  // literal: font:600 14px/1.35 'Open Sans'
  const reLit = /font:\s*(\d{3})\s+(\d+(?:\.\d+)?)px[^;]*?'([^']+)'/g;
  // via var(--font-display|serif|sans): font:400 60px/1.1 var(--font-display)
  const reVar = /font:\s*(\d{3})\s+(\d+(?:\.\d+)?)px[^;]*?var\(--font-(display|serif|sans)\)/g;
  const VAR_FAMILY = { display: 'Cormorant Garamond', serif: 'Crimson Text', sans: 'Open Sans' };
  const add = (family, weight, size, f) => {
    const k = key(family, weight, size);
    if (!map.has(k)) map.set(k, { family: family.trim(), weight: +weight, size: Math.round(+size), count: 0, files: new Set() });
    const e = map.get(k);
    e.count++;
    e.files.add(f.replace(root, '').replace(/\\/g, '/'));
  };
  for (const f of files) {
    let text;
    try { text = readFileSync(f, 'utf8'); } catch { continue; }
    let m;
    while ((m = reLit.exec(text))) add(m[3], m[1], m[2], f);
    while ((m = reVar.exec(text))) add(VAR_FAMILY[m[3]], m[1], m[2], f);
  }
  return map;
}

/** Semua warna hex #RRGGBB dipakai literal di kode kita (bukan var(--...)). */
export function ourColors(root) {
  const files = [
    ...walk(join(root, 'src', 'components'), ['.astro']),
    ...walk(join(root, 'src', 'pages'), ['.astro']),
    join(root, 'src', 'styles', 'global.css'),
  ];
  const map = new Map();
  const re = /#[0-9A-Fa-f]{6}\b/g;
  for (const f of files) {
    let text;
    try { text = readFileSync(f, 'utf8'); } catch { continue; }
    let m;
    while ((m = re.exec(text))) {
      const hex = m[0].toUpperCase();
      if (!map.has(hex)) map.set(hex, { hex, count: 0, locs: [] });
      const upTo = text.slice(0, m.index);
      const lineNo = upTo.split('\n').length;
      map.get(hex).locs.push(`${f.replace(root, '').replace(/\\/g, '/')}:${lineNo}`);
      map.get(hex).count++;
    }
  }
  return map;
}

/** Token warna resmi (:root{ --x:#hex }) di global.css. */
export function ourTokens(root) {
  const text = readFileSync(join(root, 'src', 'styles', 'global.css'), 'utf8');
  const map = new Map();
  const re = /--([\w-]+)\s*:\s*(#[0-9A-Fa-f]{6})\b/g;
  let m;
  while ((m = re.exec(text))) map.set(m[2].toUpperCase(), `--${m[1]}`);
  return map;
}

/** Semua kombinasi font-size/font-family/font-weight di something.html (inline style Figma export). */
export function figmaFonts(figmaPath) {
  const map = new Map();
  if (!existsSync(figmaPath)) return map;
  const text = readFileSync(figmaPath, 'utf8');
  const re = /font-size: (\d+(?:\.\d+)?)px; font-family: ([A-Za-z ]+); font-weight: (\d+)/g;
  let m;
  while ((m = re.exec(text))) {
    const [, size, family, weight] = m;
    const k = key(family, weight, size);
    if (!map.has(k)) map.set(k, { family: family.trim(), weight: +weight, size: Math.round(+size), count: 0 });
    map.get(k).count++;
  }
  return map;
}

/** Semua warna hex #RRGGBB di something.html. */
export function figmaColors(figmaPath) {
  const map = new Map();
  if (!existsSync(figmaPath)) return map;
  const text = readFileSync(figmaPath, 'utf8');
  const re = /#[0-9A-Fa-f]{6}\b/g;
  let m;
  while ((m = re.exec(text))) {
    const hex = m[0].toUpperCase();
    if (!map.has(hex)) map.set(hex, { hex, count: 0 });
    map.get(hex).count++;
  }
  return map;
}

/** Nama variabel Figma bernama (var(--Nama, #hex)) → map hex→nama, buat label token. */
export function figmaNamedVars(figmaPath) {
  const map = new Map();
  if (!existsSync(figmaPath)) return map;
  const text = readFileSync(figmaPath, 'utf8');
  const re = /var\(--([\w-]+),\s*(#[0-9A-Fa-f]{6})\)/g;
  let m;
  while ((m = re.exec(text))) map.set(m[2].toUpperCase(), `--${m[1]}`);
  return map;
}
