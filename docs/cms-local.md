# Coba di lokal — Astro SSR + panel admin + PostgreSQL

Satu app. Tidak ada folder `cms/` terpisah. Prasyarat: Node 18+, PostgreSQL jalan
(`postgres` / `postgres` @ `localhost:5432`).

> Uji end-to-end di mesin dev sudah lulus — lihat tabel di bawah.

---

## 1. Dependency + .env

```bash
npm install
cp .env.example .env
```

Isi `.env` untuk lokal:

```
PUBLIC_SITE_URL=http://localhost:4321
DB_CLIENT=pg
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=ania
SESSION_SECRET=<node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
UPLOADS_DIR=                       # kosong → ./uploads
BITESHIP_TOKEN=<token test Biteship kamu>   # kosong → ongkir pakai estimasi lokal
XENDIT_SECRET_KEY=<Secret Key TEST Xendit>  # kosong → checkout tetap bikin order (tanpa invoice)
XENDIT_WEBHOOK_TOKEN=<bebas, mis. testtok123>
```

## 2. Database

```bash
# psql biasanya di: C:/Program Files/PostgreSQL/<versi>/bin
export PATH="$PATH:/c/Program Files/PostgreSQL/18/bin"; export PGPASSWORD=postgres
psql -U postgres -h localhost -c "CREATE DATABASE ania;"

npm run db:schema                  # buat tabel (db/schema.pg.sql)
npm run db:seed                    # 49 produk + 80 foto → DB & ./uploads (dari src/data/products.generated.json)
CMS_ADMIN_PASSWORD=admin123 npm run db:user admin   # user admin (atau tanpa env → password diminta)
```

Reset kapan pun: `node scripts/db-schema.mjs --drop` lalu ulangi `db:schema` + `db:seed` + `db:user`.

## 3. Jalankan

**Dev (hot reload):**
```bash
npm run dev            # http://localhost:4321
```

**Produksi lokal (seperti di cPanel):**
```bash
npm run build
npm start              # app.mjs → dist/server/entry.mjs, dengar di PORT (default 4321)
```

## 4. Yang bisa dicoba

| URL | |
|---|---|
| `http://localhost:4321/` `/shop` `/product/<slug>` | **SSR live dari DB** (cache 60 dtk) |
| `http://localhost:4321/admin` | panel — login `admin` / `admin123` |
| `/admin/products/new` | tambah produk → simpan → lanjut upload foto (drag & drop, resize 1200/q78) |
| edit harga / **stok** / status | tersimpan → tampil di situs **±60 dtk, tanpa build** |
| `/cart` → Proceed to Checkout | `/api/checkout` bikin order; kalau `XENDIT_SECRET_KEY` diisi → redirect ke invoice |
| `/admin/orders` | daftar & status order |
| `/order/<code>` | halaman status order (tujuan redirect Xendit) |

### Simulasi webhook pembayaran (tanpa Xendit asli)

```bash
# buat order dulu lewat /cart, catat kodenya (mis. ANIA-XXXXXX)
curl -X POST http://localhost:4321/api/webhooks/xendit \
  -H 'Content-Type: application/json' -H 'x-callback-token: testtok123' \
  -d '{"external_id":"ANIA-XXXXXX","status":"PAID"}'
# → order jadi 'paid', stok item yang dilacak berkurang. Replay = diabaikan (idempoten).
```

## 5. Snapshot fallback

`src/data/products.generated.json` di-commit sebagai cadangan (dipakai kalau DB tak
terjangkau, dan di-bundle ke browser untuk tampilan cart). Setelah perubahan besar
struktur katalog:

```bash
npm run snapshot      # tulis ulang JSON dari DB + salin foto baru ke public/assets/products/
git add src/data/products.generated.json public/assets/products
```

---

## Hasil uji di mesin ini (referensi)

| Langkah | Hasil |
|---|---|
| `db:schema` (pg) | 5 tabel: users, products, product_images, orders, order_items |
| `db:seed` | 49 produk (25/6/10/4 + 4 add-on), 80 foto |
| build (`astro build`, output server) | ✓ — 7 halaman prerender, sisanya SSR |
| `npm start` | `/ /shop /product/love-symphony /about /cart` → 200; `/product/ngawur` → 404 |
| login | salah → balik + error; benar → 302 `/admin`; `/admin` tanpa sesi → 302 `/admin/login` |
| buat produk + update harga/stok + upload foto | id 50, foto `test-tulip-deluxe-1.jpg`, muncul di `/shop` & `/product/…` tanpa build |
| hapus produk | 404 + file foto ikut terhapus |
| `/api/shipping?q=Kebayoran` | autocomplete Biteship live (token test) |
| `/api/checkout` (tanpa Xendit key) | order `ANIA-…` dibuat, harga+ongkir dihitung ulang server-side |
| webhook token salah / benar | 401 / order `paid` + stok 5 → 3 |
| webhook replay | `already paid`, stok tetap 3 |
