# ANIA Flower Boutique — Astro (SSR) + CMS

Satu app: **Astro `output: 'server'`** (adapter Node standalone) + panel admin **React**
+ **PostgreSQL/MySQL**. Situs & panel & API di satu codebase; deploy via GitHub Actions.
Atomic design dipertahankan: **atom → molekul → organisme → template → page**.

## Jalankan

```bash
npm install
cp .env.example .env          # isi DB_*, SESSION_SECRET, (opsional) BITESHIP/XENDIT
npm run db:schema             # buat tabel (butuh DB PostgreSQL/MySQL sudah ada)
npm run db:seed               # 49 produk + 80 foto dari src/data/products.generated.json
npm run db:user admin         # user admin panel
npm run dev                   # http://localhost:4321   ·  panel: /admin
npm run build && npm start    # mode produksi (seperti cPanel) — app.mjs
```

Panduan lengkap: **`docs/cms-local.md`** (lokal) · **`docs/cms-setup.md`** (cPanel).

## Environment variables

`.env` tidak di-commit (`.gitignore`). Template: `.env.example`. Semua server-only
kecuali `PUBLIC_*`. Di cPanel: isi lewat UI "Setup Node.js App".

| Var | Guna |
|---|---|
| `PUBLIC_SITE_URL` | URL publik (untuk redirect Xendit, cookie secure). |
| `DB_CLIENT` `DB_HOST` `DB_PORT` `DB_USER` `DB_PASS` `DB_NAME` | Database. `DB_CLIENT=pg` atau `mysql`. |
| `SESSION_SECRET` | Kunci tanda-tangan cookie sesi admin. |
| `UPLOADS_DIR` | Folder foto produk (di luar `dist/`). Kosong → `./uploads`. |
| `BITESHIP_TOKEN` `BITESHIP_ORIGIN_AREA_ID` | Ongkir & autocomplete alamat (server, `/api/shipping`). Kosong → estimasi lokal. |
| `XENDIT_SECRET_KEY` `XENDIT_WEBHOOK_TOKEN` | Invoice pembayaran + verifikasi webhook. Kosong → checkout tetap bikin order (tanpa invoice). |
| `GITHUB_REPO` `GITHUB_DEPLOY_TOKEN` | Opsional — tombol "Deploy ulang" di admin (repository_dispatch). |

## Data produk

**Live dari DB** (tabel `products` + `product_images`), di-cache 60 dtk di
`src/lib/products.ts` (`getCatalog()`). Perubahan di `/admin` tampil di situs **tanpa
build ulang**.

`src/data/products.generated.json` (di-commit) = **fallback** saat DB tak terjangkau,
sekaligus data yang di-bundle ke browser untuk tampilan cart (harga final selalu
dihitung ulang server-side di `/api/checkout`). Segarkan: `npm run snapshot`.

CMS Express lama disimpan sebagai arsip di **`docs/legacy-cms/`** (tidak dipakai).

## Halaman & endpoint

| | |
|---|---|
| `/` `/shop` `/product/[slug]` `/search`(overlay) | SSR — katalog live |
| `/about` `/faq` `/terms` `/contact` `/occasions` | prerender (statik) |
| `/cart` → `/api/checkout` → Xendit → `/order/[code]` | alur beli |
| `/admin` `/admin/products/*` `/admin/orders/*` | panel (login `/admin/login`) |
| `/api/pricing` `/api/shipping` `/api/search-index.json` `/uploads/[file]` | publik |
| `/api/admin/*` | panel (butuh sesi) |
| `/api/webhooks/xendit` | callback pembayaran (verifikasi `x-callback-token`) |

## Struktur

```
src/
  styles/global.css          design token + class komponen situs
  styles/admin.css           panel CMS (terpisah)
  layouts/Base.astro         kerangka HTML situs
  layouts/Site.astro         Base + Navbar + SearchOverlay + Footer
  layouts/Admin.astro        kerangka panel (tanpa Navbar/Footer situs)
  lib/
    db.ts                    lapis DB (pg | mysql) — q/one/insert/tx
    products.ts              getCatalog()/getProductBySlug()/getLiveState() + cache 60s + fallback snapshot
    catalog.ts (data/)       tipe + transform RawProduct→CatalogItem, export snapshot sinkron
    session.ts auth.ts admin.ts   sesi cookie HMAC + login bcrypt + guard withAdmin
    images.ts                sharp resize 1200/q78 → UPLOADS_DIR
    biteship.ts xendit.ts    integrasi ongkir & pembayaran (server-only)
  data/home.ts               konten Home statik (tiles, testimonial, featuredSlugs)
  components/
    admin/ProductEditor.tsx  island React: form produk + kelola foto
    atoms/                    mandiri, tidak impor komponen lain
      Button Badge Pill Swatch Field Textarea Stepper Progress Pager
      LangToggle NavLink Divider Avatar Icon
    molecules/                memanggil atom
      PriceGroup CardTitleBlock TestimonialAuthor CategoryTileBar SectionHeader IconLink Tabs
    organisms/                memanggil molekul (+ atom)
      ProductCard CategoryTile WhyAniaCard TestimonialCard OccasionCard
      InfoPanel OrderItemCard Navbar Footer
    templates/                memanggil organisme — 1 section = 1 file
      Hero ProductGridSection ChooseFlowerSection AddOnSection
      WhyAniaSection TestimonialSection UnspokenWordsSection
  pages/
    index.astro shop.astro product/[slug].astro   SSR
    about/faq/terms/contact/occasions.astro        prerender
    admin/**  api/**  order/[code].astro  uploads/[file].ts
db/
  schema.pg.sql schema.sql   tabel (users, products, product_images, orders, order_items)
scripts/
  db-schema.mjs seed.mjs create-user.mjs snapshot.mjs
app.mjs                        entry produksi (memuat .env → dist/server/entry.mjs)
.github/workflows/deploy.yml   push → build → rsync ke cPanel → restart
public/
  assets/        foto produk fallback (path: /assets/…)   ·  runtime: /uploads/…
  assets-svg/    ikon & logo (path: /assets-svg/…)
```

## Konvensi

- **Styling**: satu `global.css` global. Komponen `.astro` hanya merender markup ber-class + terima **props**. Sedikit `<style>` scoped dipakai hanya untuk layout khusus komponen (mis. `Navbar`).
- **Komposisi lewat tag**: organisme isinya cuma `<Badge>` / `<CardTitleBlock>` / `<Swatch>` dsb — minim kode.
- **Ikon**: selalu `<Icon name="…" />` dari `/assets-svg` (peta nama di `atoms/Icon.astro`) — jangan gambar SVG sendiri.
- **Angka harga**: number (`700000`) diformat jadi `Rp 700,000`, atau string siap-tampil.
- Ukuran / padding / margin section mengikuti `index.html` (Figma export) — dicatat di komentar tiap file.

## Referensi lama (masih ada)

- `index.html` — Figma export, sumber kebenaran ukuran & warna.
- `design-system.html` — dokumentasi pra-Astro (statis). Digantikan oleh `/design-system`.
