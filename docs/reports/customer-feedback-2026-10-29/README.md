# Pemeriksaan Feedback Pelanggan ANIA

## Status

Publikasi perubahan ini sudah disetujui pengelola. Hasil pemeriksaan di bawah
berdasarkan versi lokal; keberhasilan deployment dan tampilan live perlu
diverifikasi terpisah setelah push.
Checkout tidak diaktifkan dalam pekerjaan ini. Pengujian provider memakai mock;
tidak ada pembayaran atau booking kurir nyata yang dibuat.

Verifikasi: 29 tes cart, selector tombol, filter, aksesori, media, pembayaran dan
pengiriman lulus. Empat tes panduan admin juga lulus memakai server lokal port
4337, termasuk proteksi login, render 45 bagian, unduhan SOP dan 25 screenshot
lama yang sudah ada di panduan. Build berhasil. Screenshot lama tersebut bukan
bukti visual perbaikan feedback kali ini.

## Before / After

| Poin pelanggan | Sebelum | Setelah di kode lokal | Bukti yang tersedia |
| --- | --- | --- | --- |
| Tambah satu Plush Doll muncul dua item | Selector tombol kartu produk juga menangkap tombol BuyBox. Satu klik dapat menambahkan baris slug kosong selain produk yang benar. | Selector kartu produk dipisahkan. Slug kosong ditolak, baris keranjang lama yang tidak valid diabaikan. Klik tambahan yang disengaja tetap menambah kuantitas. | Tes cart dan pemisahan selector. Screenshot interaksi belum tersedia. |
| Pengiriman hanya Instant | Tarif sudah disaring, tetapi penjelasan layanan dan validasi eksplisit checkout belum seragam. | UI menyebut Instant Delivery. Checkout dan snapshot pengiriman hanya menerima kode Grab/Gojek Instant. Tidak fallback ke Same Day/Regular. | Tes tarif campuran, penolakan layanan, dan booking mock. |
| Hari ini abu-abu | Kalender minimum dan default besok. | Minimum dan default hari ini berdasarkan Asia/Jakarta. Tanggal tidak menjamin kesiapan rangkaian atau ketersediaan kurir. | Tes pergantian tanggal dan tahun Jakarta. Screenshot kalender belum tersedia. |
| Filter tidak menutup konsisten | Penutupan bergantung hitbox kartu, sehingga ruang kosong pada hasil satu produk tidak memicu penutupan. | Hover mouse di area produk/overlay menutup filter tanpa bergantung jumlah produk. Touch tidak menutup melalui hover. | Tes source binding. Interaksi mouse/touch nyata belum diverifikasi ulang. |
| Foto add-on tampil bunga | Beranda dan rekomendasi produk memakai daftar foto tetap; foto produk kosong juga mengambil foto bouquet generik. | Beranda dan rekomendasi detail memakai foto/nama/harga/slug dari katalog yang sama dengan CMS. Foto aksesori kosong memakai placeholder, bukan bouquet lain. | Tes transform katalog dan konsistensi kartu. Foto CMS live belum diverifikasi ulang. |
| Aksesori alat florist tidak perlu tampil | Aksesori alat ikut katalog/filter pelanggan. | Clipper holder, glass flower dome, gunting/scissors/secateurs kategori accessory difilter dari katalog pelanggan. Data CMS tidak dihapus. | Tes nama produk yang diminta, katalog, dan pemeliharaan add-on hadiah. |
| Ganti foto Occasions | Sudah ada pengaturan per kartu dari pekerjaan sebelumnya. | Tetap di CMS > Pengaturan > Foto kartu Occasions di beranda, terpisah dari hero. | Tes validasi media dan pemetaan foto berdasarkan nilai Occasion. |
| Checkout sementara belum tersedia | Checkout sengaja OFF sesuai permintaan pengelola. | Tetap OFF; pemberitahuan dan blokir server dipertahankan. | Pemeriksaan HTTP endpoint checkout/shipping lokal harus mengembalikan 503. |

## Panduan Tiga Poin

### 1. Pengiriman Instant

1. Pilih Instant Delivery pada halaman produk/keranjang.
2. Isi alamat lengkap lalu tentukan pin penerima.
3. Saat checkout aktif, klik Check Instant Delivery di keranjang akhir.
4. Pilih Grab/Gojek Instant yang benar-benar tersedia. Jangan ganti ke Regular.
5. Jika tidak tersedia, periksa pin/alamat atau tawarkan Pickup/WhatsApp.

### 2. Checkout Nonaktif

1. Masuk CMS, buka Pengaturan situs > Kesiapan checkout.
2. Checkbox Checkout aktif yang kosong berarti transaksi baru dan cek ongkir diblokir.
3. Jangan ubah hanya untuk menyembunyikan pemberitahuan.
4. Setelah pembayaran, kurir, cabang dan kesiapan toko diverifikasi serta disetujui,
   centang Checkout aktif dan klik Simpan kesiapan checkout.
5. Refresh halaman keranjang. Hilangkan centang dan simpan untuk menutup kembali.

Toggle ini tidak menonaktifkan tautan invoice Xendit lama dan tidak membatalkan
booking kurir yang sudah ada.

### 3. Foto Kartu Occasions

1. Masuk CMS > Pengaturan.
2. Cari Foto kartu Occasions di beranda.
3. Klik Ganti foto pada Anniversary, Birthday, Get Well Soon, atau kartu lain.
4. Pilih JPG/PNG/WebP maksimal 12 MB, lalu tunggu upload selesai.
5. Klik Simpan media dan refresh tab Occasions di beranda.

Foto add-on diedit di Produk, bukan pengaturan kartu Occasions. Foto pertama adalah
gambar utama produk. Cache katalog dapat membutuhkan sekitar 60 detik.

Panduan yang sama tersedia di `/admin/panduan#panduan-checkout-dan-foto` setelah
menjalankan versi lokal ini atau setelah perubahan dideploy.

## Checklist Pemeriksaan Mandiri Setelah Update Live

1. Refresh penuh halaman (Ctrl+F5). Buka keranjang, kosongkan produk percobaan
   secara manual, lalu buka detail Plush Doll. Klik Add to Cart tepat satu kali.
   Hasil yang diharapkan: satu baris Plush Doll, jumlah 1, badge keranjang 1,
   tanpa baris produk kosong. Ulangi dari tombol kartu produk dan tombol plus
   add-on, masing-masing dengan kondisi awal keranjang kosong.
2. Buka Shop dan filter Plush Doll yang hasilnya satu produk. Buka panel filter,
   gerakkan mouse ke kanan ke kartu maupun ruang kosong. Panel harus menutup
   pada kedua area. Bandingkan dengan kategori yang berisi banyak produk.
   Di perangkat sentuh, panel tetap ditutup dengan tombol/overlay, bukan hover.
3. Buka kalender pada detail produk dan keranjang. Hari ini berdasarkan waktu
   Jakarta harus dapat dipilih; hari yang sudah lewat tidak dapat dipilih.
4. Di Shop dan filter Add On, pastikan clipper holder, glass flower dome,
   gunting/scissors/secateurs tidak tampil. Plush Doll, Balloon, Cake dan
   Chocolate tetap tersedia jika status produknya published. Data alat florist
   di CMS tidak dihapus.
5. Cocokkan foto Plush Doll di beranda, rekomendasi detail, serta halaman detail
   Plush Doll. Semua harus memakai foto utama produk yang sama dari CMS.
   Jika belum ada foto, harus placeholder, bukan foto bouquet lain.
6. CMS > Pengaturan > Foto kartu Occasions di beranda: ganti satu foto pada kartu
   yang benar, simpan media, lalu refresh beranda. Kartu lain dan hero Occasion
   tidak boleh ikut berubah.
7. Checkout tetap OFF: pesan sementara belum tersedia harus tetap muncul,
   tombol checkout/cek ongkir tidak boleh membuat transaksi. Ini perilaku yang
   disengaja, bukan kegagalan Xendit atau bukti bahwa kurir Instant tidak tersedia.
8. Hanya setelah aktivasi checkout secara terpisah disetujui: isi alamat,
   pilih pin dan klik Check Instant Delivery di keranjang akhir. Opsi yang
   muncul hanya Grab/Gojek Instant. Jika tidak tersedia, tidak boleh muncul
   Regular/Same Day sebagai pengganti. Jangan membayar atau memesan kurir nyata
   hanya untuk pemeriksaan tampilan ini.

Jangan mengaktifkan checkout hanya untuk menyelesaikan checklist. Konfigurasi
berada di CMS > Pengaturan > Kesiapan checkout > Checkout aktif > Simpan kesiapan
checkout. Invoice lama tetap harus ditangani terpisah melalui Xendit.

## Screenshot Yang Masih Dibutuhkan

- Keranjang kosong, klik sekali Plush Doll, lalu cart berisi satu item/qty satu.
- Filter hasil Plush Doll satu produk: panel terbuka dan sesudah mouse pindah ke kanan.
- Kalender produk dengan hari ini bisa dipilih.
- Foto add-on beranda dan detail produk yang sama dari CMS.
- Sidebar Add On tanpa aksesori alat florist yang ditandai.
- CMS Kesiapan checkout dan pengaturan foto per kartu Occasions.

Belum ada screenshot baru: browser automation melaporkan Local Browser Use nonaktif.
Screenshot lama atau ilustrasi tidak dipakai sebagai bukti perubahan baru.
