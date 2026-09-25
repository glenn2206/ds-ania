# Deploy ke cPanel — satu app Astro SSR (langkah demi langkah)

Arsitektur: **satu aplikasi** Astro `output: 'server'` (adapter Node standalone) +
panel admin React + PostgreSQL/MySQL. Tidak ada app kedua, tidak ada tombol
"Publish/rebuild" untuk konten — perubahan produk **live dari DB**. cPanel mengecek
branch `main`, lalu mem-build dan men-deploy **kode** otomatis setelah `git push`.

```
cPanel (~ = /home/CPUSER)
  public_html/                     PRODUCTION LAMA — JANGAN disentuh
  ~/ania-app/                      aplikasi live                         →  Node.js App
  ~/ania-repo/                     shallow clone GitHub untuk auto-deploy
  ~/ania-uploads/                  foto produk (di LUAR ~/ania-app, tahan deploy ulang)
  subdomain  dev.NAMADOMAIN   →   Node.js App di ~/ania-app
  database   CPUSER_ania_dev       PostgreSQL atau MySQL
```

> Ganti `CPUSER` = user cPanel-mu, `NAMADOMAIN` = domainmu.
> Semua di sini **DEV**. Untuk production nanti: ulangi dengan subdomain / DB / folder
> lain, tetap **bukan** `public_html`.

Prasyarat: **Setup Node.js App** (Node 18/20), **Cron Jobs**, akses buat **PostgreSQL** atau
**MySQL** database. Repo sudah di GitHub.

---

## 1. Subdomain

cPanel → **Domains → Create A New Domain** → `dev.NAMADOMAIN`.
Document Root biarkan default (mis. `~/dev.NAMADOMAIN`) — Passenger yang akan pegang
setelah Node App dibuat. Aktifkan AutoSSL kalau ada.

## 2. Database

**PostgreSQL** (cPanel → **PostgreSQL Databases**) — disarankan, sama dengan lokal:
1. Create Database `ania_dev` → jadi `CPUSER_ania_dev`.
2. Add User `ania` + password kuat → **catat**.
3. Add User To Database → **ALL PRIVILEGES**.

*(atau **MySQL Databases** dengan langkah setara — nanti set `DB_CLIENT=mysql`, `DB_PORT=3306`.)*

Catat: DB name, user, password. Host = `127.0.0.1`.

## 3. Folder upload (di luar app)

SSH:
```bash
mkdir -p ~/ania-uploads
```

## 4. Node.js App

cPanel → **Software → Setup Node.js App → Create Application**
- Node.js version: **20** (atau 18)
- Application mode: **Production**
- Application root: `ania-app`
- Application URL: `dev.NAMADOMAIN`
- Application startup file: `app.mjs`

**Create.** Catat path virtualenv yang muncul (mis. `~/nodevenv/ania-app/20/bin`).

Di bagian **Environment variables** app ini, tambahkan:

| Nama | Nilai |
|---|---|
| `PUBLIC_SITE_URL` | `https://dev.NAMADOMAIN` |
| `DB_CLIENT` | `pg` (atau `mysql`) |
| `DB_HOST` | `127.0.0.1` |
| `DB_PORT` | `5432` (mysql: `3306`) |
| `DB_USER` | `CPUSER_ania` |
| `DB_PASS` | *(password DB)* |
| `DB_NAME` | `CPUSER_ania_dev` |
| `SESSION_SECRET` | hasil `openssl rand -hex 32` |
| `UPLOADS_DIR` | `/home/CPUSER/ania-uploads` |
| `BITESHIP_TOKEN` | token Biteship (kosong = estimasi lokal) |
| `XENDIT_SECRET_KEY` | Secret Key Xendit |
| `XENDIT_WEBHOOK_TOKEN` | token bebas (dipakai verifikasi webhook) |
| `GITHUB_REPO` | `owner/nama-repo` *(opsional — tombol "Deploy ulang" di admin)* |
| `GITHUB_DEPLOY_TOKEN` | PAT `contents:write` *(opsional)* |

## 5. Auto-deploy tanpa SSH

Akun hosting saat ini tidak memiliki shell access. Karena itu deployment memakai Cron
Jobs cPanel, bukan SSH GitHub Actions. Cron melakukan shallow clone ke `~/ania-repo`,
mengecek commit `main`, lalu menjalankan `scripts/cpanel-deploy.sh` hanya ketika SHA
berubah. Output disimpan di `~/tmp/ania-deploy.log`.

Pilih **Once Per Five Minutes** dan gunakan command berikut:

```bash
/usr/bin/flock -n /home/myaniaco/tmp/ania-deploy.lock /bin/bash -lc 'set -e; R=/home/myaniaco/ania-repo; A=/home/myaniaco/ania-app; G=/usr/local/cpanel/3rdparty/bin/git; if [ ! -d "$R/.git" ]; then "$G" clone --depth=1 --branch main https://github.com/glenn2206/ds-ania.git "$R"; fi; "$G" -C "$R" fetch --depth=1 origin main; SHA=$("$G" -C "$R" rev-parse origin/main); if [ ! -f "$A/.deployed-sha" ]; then echo "$SHA" > "$A/.deployed-sha"; exit 0; fi; [ "$SHA" != "$(cat "$A/.deployed-sha")" ] || exit 0; "$G" -C "$R" checkout -B main origin/main; APP_DIR="$A" REPO_DIR="$R" PUBLIC_SITE_URL=https://conscientious-rose-beaver.180-235-151-42.cpanel.site /bin/bash "$R/scripts/cpanel-deploy.sh" "$SHA"' >> /home/myaniaco/tmp/ania-deploy.log 2>&1
```

Eksekusi pertama hanya membuat shallow clone dan mencatat SHA saat ini. Ini mencegah
kode live tertimpa commit lama sebelum perubahan lokal terbaru dipush.

GitHub Actions tetap menjalankan `npm ci` dan `npm run build` sebagai build check.

## 6. Deploy berikutnya

```bash
git push origin main
```
Workflow **Build check** memvalidasi build. Dalam maksimal lima menit, cron cPanel
mengambil commit baru, menjalankan build, mengganti `dist` secara atomik, memasang
production dependencies, lalu me-restart Passenger lewat `tmp/restart.txt`.

## 7. Tabel + data awal (SSH, sekali)

```bash
cd ~/ania-app
source ~/nodevenv/ania-app/20/bin/activate
npm run db:schema                       # buat tabel
npm run db:seed                         # 49 produk + 80 foto → DB + ~/ania-uploads
npm run db:user admin                   # buat admin (password diminta)
```
Lalu **Restart** app di UI Node.js App.

## 8. Webhook Xendit

Xendit Dashboard → **Settings → Webhooks**:
- URL invoice: `https://dev.NAMADOMAIN/api/webhooks/xendit`
- **Verification Token** = nilai `XENDIT_WEBHOOK_TOKEN` di langkah 4.

## 9. Uji

1. `https://dev.NAMADOMAIN` → situs tampil (SSR).
2. `https://dev.NAMADOMAIN/admin` → login `admin`.
3. Edit harga / stok sebuah produk → buka halaman produk → berubah dalam ±60 detik,
   tanpa deploy.
4. `/cart` → checkout uji → invoice Xendit → bayar (mode test) → `/order/<code>` jadi
   "Lunas", stok berkurang, order muncul di `/admin/orders`.
5. Ubah kode lalu `git push` → build check → cron deploy → app restart otomatis.

## 10. Pagar aman production

- [ ] `DEPLOY_PATH` = `/home/CPUSER/ania-app` — **bukan** `public_html`.
- [ ] `dev.NAMADOMAIN` subdomain baru; DB berakhiran `_dev`.
- [ ] `UPLOADS_DIR` di `~/ania-uploads` (luar `~/ania-app`) — deploy tak menghapus foto.
- [ ] `https://NAMADOMAIN` (production lama) tidak berubah; `ls -la ~/public_html` mtime tetap.
- [ ] `.env` **tidak** ikut ter-deploy (di-`--exclude` oleh rsync + ada di `.gitignore`);
      semua secret via UI Environment Variables Node App.

---

## Catatan

**Foto & aset statik.** Server standalone menyajikan `dist/client/` (JS/CSS/`_astro`) dan
route `/uploads/<file>` membaca dari `UPLOADS_DIR`. Untuk optimasi lanjut, buat alias
Apache/`.htaccess` agar `/_astro` & `/uploads` dilayani langsung tanpa lewat Node.

**Kalau build gagal di server** (RAM/CPU shared hosting): jangan build di cPanel — biarkan
**GitHub Actions** yang build (langkah 6). Server hanya `npm ci --omit=dev` + restart, ringan.

**MySQL vs PostgreSQL.** `src/lib/db.ts` mendukung keduanya lewat `DB_CLIENT`. Skema:
`db/schema.pg.sql` / `db/schema.sql`. `npm run db:schema` memilih otomatis.

**Snapshot.** `src/data/products.generated.json` dipakai sebagai fallback bila DB down.
Segarkan sesekali: `npm run snapshot` lalu commit.
