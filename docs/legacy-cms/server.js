/**
 * cms/server.js — CMS produk ANIA (Express). Entry untuk cPanel "Setup Node.js App".
 * Admin di /login + /admin. Feed build di /api/products.json?key=... . Publish → antri job.
 */
import 'dotenv/config';
import express from 'express';
import cookieSession from 'cookie-session';
import multer from 'multer';
import path from 'node:path';
import os from 'node:os';
import { existsSync } from 'node:fs';

import { q, insert } from './db.js';
import { verifyLogin, requireAuth } from './lib/auth.js';
import { UPLOAD_DIR, ensureUploadDir, processUpload, removeUpload, renameForOrder } from './lib/images.js';
import { loginView } from './views/login.js';
import { productListView } from './views/products.js';
import { productFormView } from './views/productForm.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(express.json({ limit: '2mb' }));
app.use(
  cookieSession({
    name: 'ania_cms',
    secret: process.env.SESSION_SECRET || 'dev-insecure-change-me',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 14 * 24 * 60 * 60 * 1000,
  }),
);
app.use('/', express.static(path.resolve('public')));
app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '365d', immutable: true }));

const upload = multer({ dest: path.join(os.tmpdir(), 'ania-cms-up'), limits: { fileSize: 12 * 1024 * 1024 } });

const slugify = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120);

const FIELDS = ['name', 'slug', 'category', 'pill', 'flowers', 'size', 'price', 'price_note',
  'description', 'occasion', 'drive', 'featured', 'status'];

function readBody(b) {
  const o = {};
  for (const f of FIELDS) o[f] = (b[f] ?? '').toString().trim();
  o.price = o.price === '' ? null : Math.max(0, parseInt(o.price.replace(/\D/g, ''), 10) || 0);
  if (!['premium-wrapped', 'bloom-box', 'standing', 'vase', 'accessory'].includes(o.category))
    o.category = 'premium-wrapped';
  if (o.status !== 'draft') o.status = 'published';
  for (const k of ['size', 'price_note', 'occasion', 'drive', 'featured', 'flowers', 'description'])
    if (o[k] === '') o[k] = null;
  return o;
}

// ---------- auth ----------
app.get('/login', (req, res) => {
  if (req.session.uid) return res.redirect('/admin');
  res.send(loginView());
});
app.post('/login', async (req, res) => {
  const u = await verifyLogin(req.body.username, req.body.password);
  if (!u) return res.status(401).send(loginView({ error: 'Username / password salah.' }));
  req.session.uid = u.id;
  req.session.uname = u.username;
  res.redirect('/admin');
});
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
});

const currentUser = (req) => (req.session.uid ? { id: req.session.uid, username: req.session.uname } : null);

// ---------- admin: list ----------
app.get('/admin', requireAuth, async (req, res) => {
  const products = await q(
    `SELECT p.*, (SELECT COUNT(*) FROM product_images WHERE product_id = p.id) AS image_count
     FROM products p ORDER BY p.sort_order, p.id`,
  );
  const [lastJob] = await q('SELECT * FROM jobs ORDER BY id DESC LIMIT 1');
  res.send(productListView({ user: currentUser(req), products, lastJob }));
});

// ---------- admin: new / edit form ----------
app.get('/admin/products/new', requireAuth, (req, res) => {
  res.send(productFormView({ user: currentUser(req), isNew: true, product: { status: 'published' } }));
});
app.get('/admin/products/:id', requireAuth, async (req, res) => {
  const [product] = await q('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!product) return res.status(404).send('Tidak ada');
  const images = await q('SELECT * FROM product_images WHERE product_id = ? ORDER BY position', [product.id]);
  res.send(productFormView({ user: currentUser(req), product, images }));
});

// ---------- admin: create ----------
app.post('/admin/products', requireAuth, async (req, res) => {
  const b = readBody(req.body);
  let slug = b.slug ? slugify(b.slug) : slugify(b.name);
  if (!slug) return res.status(400).send(productFormView({ user: currentUser(req), isNew: true, product: b, error: 'Nama wajib.' }));
  const dup = await q('SELECT id FROM products WHERE slug = ?', [slug]);
  if (dup.length) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  const [{ m }] = await q('SELECT COALESCE(MAX(sort_order), -1) + 1 AS m FROM products');
  const nextSort = Number(m) || 0;
  const { insertId } = await insert(
    `INSERT INTO products (slug,name,category,pill,flowers,size,price,price_note,description,occasion,drive,featured,sort_order,status)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [slug, b.name, b.category, b.pill || '', b.flowers, b.size, b.price, b.price_note, b.description, b.occasion, b.drive, b.featured, nextSort, b.status],
  );
  res.redirect(`/admin/products/${insertId}`);
});

// ---------- admin: update ----------
app.post('/admin/products/:id', requireAuth, async (req, res) => {
  const [product] = await q('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!product) return res.status(404).send('Tidak ada');
  const b = readBody(req.body);
  let slug = b.slug ? slugify(b.slug) : product.slug;
  if (slug !== product.slug) {
    const dup = await q('SELECT id FROM products WHERE slug = ? AND id <> ?', [slug, product.id]);
    if (dup.length) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  }
  await q(
    `UPDATE products SET slug=?,name=?,category=?,pill=?,flowers=?,size=?,price=?,price_note=?,description=?,occasion=?,drive=?,featured=?,status=?
     WHERE id=?`,
    [slug, b.name, b.category, b.pill || '', b.flowers, b.size, b.price, b.price_note, b.description, b.occasion, b.drive, b.featured, b.status, product.id],
  );
  // kalau slug berubah → rename file foto biar konsisten
  if (slug !== product.slug) {
    const imgs = await q('SELECT * FROM product_images WHERE product_id = ? ORDER BY position', [product.id]);
    const renamed = await renameForOrder(imgs.map((i) => i.filename), slug);
    for (let i = 0; i < imgs.length; i++)
      await q('UPDATE product_images SET filename=?, position=? WHERE id=?', [renamed[i], i, imgs[i].id]);
  }
  res.redirect(`/admin/products/${product.id}`);
});

// ---------- admin: delete ----------
app.post('/admin/products/:id/delete', requireAuth, async (req, res) => {
  const imgs = await q('SELECT filename FROM product_images WHERE product_id = ?', [req.params.id]);
  for (const im of imgs) await removeUpload(im.filename);
  await q('DELETE FROM products WHERE id = ?', [req.params.id]); // images cascade
  res.redirect('/admin');
});

// ---------- images ----------
app.post('/admin/products/:id/images', requireAuth, upload.array('photos', 12), async (req, res) => {
  const [product] = await q('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!product) return res.status(404).json({ error: 'no product' });
  await ensureUploadDir();
  const [{ n }] = await q('SELECT COUNT(*) AS n FROM product_images WHERE product_id = ?', [product.id]);
  let pos = Number(n) || 0;
  for (const f of req.files || []) {
    const filename = await processUpload(f.path, product.slug, pos);
    await q('INSERT INTO product_images (product_id, filename, position) VALUES (?,?,?)', [product.id, filename, pos]);
    pos += 1;
  }
  res.redirect(`/admin/products/${product.id}`);
});

app.post('/admin/products/:id/images/reorder', requireAuth, async (req, res) => {
  const [product] = await q('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!product) return res.status(404).json({ error: 'no product' });
  const order = Array.isArray(req.body.order) ? req.body.order.map(Number) : [];
  const imgs = await q('SELECT * FROM product_images WHERE product_id = ?', [product.id]);
  const byId = new Map(imgs.map((i) => [i.id, i]));
  const seq = order.map((id) => byId.get(id)).filter(Boolean);
  if (seq.length !== imgs.length) return res.status(400).json({ error: 'order mismatch' });
  const renamed = await renameForOrder(seq.map((i) => i.filename), product.slug);
  for (let i = 0; i < seq.length; i++)
    await q('UPDATE product_images SET filename=?, position=? WHERE id=?', [renamed[i], i, seq[i].id]);
  res.json({ ok: true });
});

app.delete('/admin/products/:id/images/:imgId', requireAuth, async (req, res) => {
  const [product] = await q('SELECT * FROM products WHERE id = ?', [req.params.id]);
  const [img] = await q('SELECT * FROM product_images WHERE id = ? AND product_id = ?', [req.params.imgId, req.params.id]);
  if (!product || !img) return res.status(404).json({ error: 'not found' });
  await removeUpload(img.filename);
  await q('DELETE FROM product_images WHERE id = ?', [img.id]);
  // rapikan urutan + nama
  const rest = await q('SELECT * FROM product_images WHERE product_id = ? ORDER BY position', [product.id]);
  const renamed = await renameForOrder(rest.map((i) => i.filename), product.slug);
  for (let i = 0; i < rest.length; i++)
    await q('UPDATE product_images SET filename=?, position=? WHERE id=?', [renamed[i], i, rest[i].id]);
  res.json({ ok: true });
});

// ---------- build feed ----------
app.get('/api/products.json', async (req, res) => {
  if (!process.env.CMS_BUILD_KEY || req.query.key !== process.env.CMS_BUILD_KEY)
    return res.status(403).json({ error: 'forbidden' });
  const products = await q(
    `SELECT * FROM products WHERE status = 'published' ORDER BY sort_order, id`,
  );
  const imgs = await q('SELECT product_id, filename FROM product_images ORDER BY position');
  const byProd = new Map();
  for (const im of imgs) {
    if (!byProd.has(im.product_id)) byProd.set(im.product_id, []);
    byProd.get(im.product_id).push(im.filename);
  }
  const out = products.map((p, i) => ({
    slug: p.slug,
    name: p.name,
    category: p.category,
    pill: p.pill || '',
    flowers: p.flowers || '',
    size: p.size || null,
    price: p.price == null ? null : Number(p.price),
    priceNote: p.price_note || null,
    description: p.description || '',
    occasion: p.occasion || null,
    drive: p.drive || null,
    featured: p.featured || null,
    sortOrder: p.sort_order ?? i,
    images: byProd.get(p.id) || [],
  }));
  res.set('Cache-Control', 'no-store').json(out);
});

// ---------- publish (antri; worker cron yang build) ----------
app.post('/publish', requireAuth, async (req, res) => {
  const running = await q("SELECT id FROM jobs WHERE status IN ('queued','running') LIMIT 1");
  if (running.length) return res.json({ id: running[0].id, queued: true, note: 'sudah ada job berjalan' });
  const { insertId } = await insert("INSERT INTO jobs (kind, status) VALUES ('publish','queued')");
  res.json({ id: insertId, queued: true });
});
app.get('/publish/status', requireAuth, async (req, res) => {
  const [job] = await q('SELECT id, status, log, created_at, finished_at FROM jobs WHERE id = ?', [req.query.id]);
  if (!job) return res.status(404).json({ error: 'no job' });
  res.json(job);
});

app.get('/', (req, res) => res.redirect(req.session.uid ? '/admin' : '/login'));
app.use((req, res) => res.status(404).send('404'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`ANIA CMS on :${PORT}`));
