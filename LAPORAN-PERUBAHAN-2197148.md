# Laporan Perubahan Website ANIA Flower Boutique

## Informasi Versi

- Commit hasil: `21971487f3d1c04195df930c29d7ed3df35e10da`
- Dibandingkan dengan: `23d45e065afeaa131a6ddd2c3a75d98df2f9ed51`
- Tanggal: 30 September 2026
- Cakupan: 21 file berubah, 338 penambahan, 305 penghapusan, dan 4 aset baru

## Ringkasan Pekerjaan

### 1. Hero Homepage

- Kalimat penutup hero diperbarui menjadi **Crafted with Care.**
- Daftar checklist lama diganti menjadi satu informasi manfaat yang tampil bergantian.
- Empat manfaat tetap dipertahankan tanpa mengurangi isi:
  - Same-Day Flower Delivery
  - Individually Crafted by Professional Florists
  - More than 10 years Floral Design Experience
  - Order Flowers Online Easily
- Ditambahkan indikator garis tipis untuk menunjukkan pergantian informasi.
- Tombol disederhanakan menjadi **Shop Now** dan **Contact Us**.

### 2. Batas Lebar dan Spacing Halaman

- Ditambahkan batas lebar utama maksimal `1440px` agar tampilan tetap rapi pada monitor sangat lebar.
- Navbar, hero, katalog, isi halaman, dan footer disejajarkan ke container yang sama.
- Jarak vertikal dan horizontal dirapikan pada ukuran desktop maupun mobile.

### 3. Katalog dan Filter Produk

- Judul halaman produk diubah dari **All Products / More Explore** menjadi **Explore**.
- Deretan tombol samping lama diganti menjadi satu tombol vertikal **Filter**.
- Panel filter dibuat penuh dari bawah navbar sampai bagian bawah layar.
- Navbar tetap terlihat saat panel filter terbuka.
- Panel dilengkapi latar overlay, tombol tutup, scroll internal, tutup saat klik area luar, dan dukungan tombol Escape.
- Katalog tidak lagi bergeser atau terpotong saat filter dibuka.
- Isi filter dikelompokkan dalam Category, Occasion, Flowers, Add On, dan Sale.

### 4. Detail Produk

- Area foto dibuat lebih proporsional, berlatar putih, dan memiliki sudut membulat.
- Tombol panah galeri ditempatkan di dalam sisi kiri dan kanan foto.
- Indikator perpindahan foto dipindahkan ke dalam area galeri.
- Ukuran foto dan panel informasi disesuaikan agar informasi utama lebih banyak terlihat dalam satu layar.
- Input pengirim dirapikan menjadi susunan grid yang lebih ringkas.

### 5. Halaman About

- Susunan galeri dibuat mengikuti referensi Figma: satu foto portrait besar di kiri dan dua foto landscape di kanan.
- Ditambahkan tiga aset foto baru untuk proses perangkaian bunga dan kartu ANIA.
- Galeri berubah menjadi satu kolom pada layar kecil agar tidak terpotong.

### 6. Cart dan Checkout Minimal

- Tampilan checkout dibuat lebih ringkas dalam satu container maksimal `1100px`.
- Daftar produk dan ringkasan pembayaran disusun dua kolom pada desktop.
- Form menggunakan floating label untuk Sender Name, Sender WhatsApp, dan Sender Email.
- Hanya nama dan WhatsApp yang wajib; email bersifat opsional.
- Data kontak sementara tersimpan di browser agar tidak hilang saat halaman dimuat ulang.
- Susunan berubah menjadi satu kolom pada layar mobile.
- Alur pengiriman, pembayaran, dan fallback WhatsApp yang sudah ada tetap dipertahankan.

### 7. Kontak dan Media Sosial

- Tautan Instagram diperbarui ke akun `ania_flowerboutique`.
- Tautan TikTok diperbarui ke akun `ania_flowerboutique`.
- Facebook diganti menjadi Threads beserta ikon baru.
- Tombol WhatsApp melayang dan tombol **Ask a Florist Now** diarahkan ke `https://wa.me/message/6WBHTFZZLZICF1`.

### 8. Footer

- Tagline footer diubah menjadi **For Those Unspoken Words**.
- Tautan Instagram, TikTok, dan Threads ditampilkan bersama.
- Posisi elemen footer diselaraskan dengan container utama.

## Aset Baru

- `public/assets-svg/32_threads.svg`
- `public/assets/about-ania-care-card.jpg`
- `public/assets/about-florist-arranging.jpg`
- `public/assets/about-florist-finishing.jpg`

## Dokumentasi Screenshot

Screenshot yang menyertai laporan ini mencakup:

1. Hero dan navigasi homepage.
2. Katalog dengan satu tombol filter.
3. Panel filter dalam keadaan terbuka.
4. Detail produk dan galeri.
5. Bagian utama halaman About.
6. Kolase foto About sesuai susunan Figma.
7. Cart dan checkout ringkas.
8. Footer, tautan media sosial, serta tombol kontak.

## Hasil Pengecekan

- Build produksi Astro berhasil tanpa error.
- Container utama sudah diuji pada layar lebar dan berhenti pada lebar maksimal `1440px`.
- Halaman utama yang diperiksa: `/`, `/shop`, `/product/a-handful-flower-box`, `/about`, dan `/cart`.
- Tidak dibuat commit baru saat laporan ini disusun.

