> ⚠️ **ARSIP — TIDAK DIPAKAI LAGI.**
> CMS ini (app Express terpisah + situs statik + build-time fetch + tombol Publish/rebuild)
> sudah digantikan **arsitektur 1-app**: Astro SSR + panel admin React + PostgreSQL,
> satu codebase, deploy via GitHub Actions. Lihat **`docs/cms-setup.md`**.
> Folder ini disimpan hanya sebagai referensi.

---

# ANIA CMS (produk) — lama

Express + MySQL / PostgreSQL. Untuk edit katalog produk tanpa ngoding. Jalan di cPanel
("Setup Node.js App"). Situs Astro menariknya **saat build** (bukan runtime).

DB: `DB_CLIENT=mysql` (cPanel, `schema.sql`) atau `DB_CLIENT=pg` (lokal, `schema.pg.sql`).
Coba lokal step-by-step: **`docs/cms-local-tryout.md`**.

```
cms/
  server.js        aplikasi Express (entry Passenger)
  worker.mjs       cron: Publish → `npm run build` di SITE_DIR → rsync ke DEPLOY_DIR
  db.js            pool MySQL
  schema.sql       tabel (impor via phpMyAdmin)
  lib/             auth, images (sharp), deployGuard, render
  views/           HTML admin (login, list, form)
  public/          admin.css / admin.js
  scripts/
    create-user.mjs   buat user admin
    seed.mjs          isi DB awal dari products.generated.json + salin foto
```

## Endpoint

| Route | Guna |
|---|---|
| `GET /login`, `POST /login`, `POST /logout` | auth (cookie session) |
| `GET /admin` | daftar produk + tombol **Publish** |
| `GET /admin/products/new`, `GET /admin/products/:id` | form |
| `POST /admin/products[/:id]` | simpan (slug auto, unik) |
| `POST /admin/products/:id/delete` | hapus (foto ikut) |
| `POST /admin/products/:id/images` | upload foto (multipart) → sharp resize 1200/q78 |
| `POST /admin/products/:id/images/reorder`, `DELETE …/images/:imgId` | atur foto |
| `GET /api/products.json?key=CMS_BUILD_KEY` | **feed build** (403 tanpa key) |
| `GET /uploads/<file>` | file foto |
| `POST /publish`, `GET /publish/status?id=` | antre job + poll |

## Setup

Lihat **`docs/cms-cpanel-setup.md`** di repo untuk langkah cPanel lengkap.
Ringkas lokal:

```bash
cd cms
cp .env.example .env      # isi DB_*, SESSION_SECRET, CMS_BUILD_KEY, SITE_DIR, DEPLOY_DIR
npm install
# impor schema.sql ke DB dulu (phpMyAdmin / mysql)
npm run seed             # opsional: isi dari ../src/data/products.generated.json
npm run create-user admin
npm start                # http://localhost:3000
```

## Pagar pengaman

`worker.mjs` memanggil `assertSafeDeployDir(DEPLOY_DIR)` sebelum menulis apa pun:
DEPLOY_DIR **wajib** di dalam `~/` dan **tidak boleh** mengandung `public_html`.
Kalau langgar → job `error`, nol file ditulis.
