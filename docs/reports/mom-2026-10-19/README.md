# MOM Follow-Up - 19 Oktober 2026

Status: implementasi lokal, belum commit/push/deploy. Preview http://127.0.0.1:4336/admin/settings.

## Yang Ditambahkan

- Toggle global kesiapan checkout di CMS. Server menolak checkout baru dan cek ongkir ketika nonaktif; order/webhook lama tetap berjalan.
- Sidebar Shop menutup ketika pointer mouse memasuki area produk, termasuk ketika pointer ditangkap overlay. Touch tetap memakai tombol/klik luar/Escape.
- Upload cover Occasion di Pengaturan media. Cover dibaca dari CMS pada halaman dinamis, tanpa rebuild. Foto produk berbeda dari cover halaman.
- Menu Aksi tabel order: detail, WhatsApp pelanggan, status/Cancelled, Refund Xendit.
- Refund penuh sekali per order, termasuk ongkir. Konfirmasi kode order, cek invoice lunas, pengamanan transaksi/duplikat, sinkronisasi hasil, dan status refunded hanya setelah SUCCEEDED. Tidak membatalkan kurir atau mengembalikan stok otomatis.
- Outbox email untuk order dibuat dan pembayaran dikonfirmasi: customer bila email diisi, serta ANIA. Pengiriman latar belakang, deduplikasi per peristiwa/penerima, dan retry manual setelah pemeriksaan untuk hasil tidak pasti.
- Panduan admin diperbarui: kesiapan checkout, cover Occasion, follow up/refund dan email konfirmasi.

## Belum Siap Live

- Bali: belum ada asal/pin/kontak pickup valid. Toggle ini global, bukan aktivasi cabang Bali; demo tidak dipakai untuk kurir nyata.
- Email: isi SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, ORDER_EMAIL_TO=team@myania.com. Verifikasi mailbox/SPF/DKIM dan inbox nyata sebelum ORDER_EMAIL_ENABLED=true. Tidak ada email nyata dikirim dalam pengujian.
- Refund: XENDIT_REFUNDS_ENABLED default false. Perlu verifikasi izin key dan dukungan channel invoice serta pengujian sandbox/dashboard. Belum ada refund live atau aktivasi izin key pada pengerjaan ini. Versi awal hanya refund penuh, bukan sebagian.
- Migrasi `node scripts/db-mom.mjs` diperlukan sebelum menjalankan versi baru. Migrasi PostgreSQL lokal berhasil; cPanel belum dimigrasi. Pengguna DB production perlu hak migrasi/akses tabel order_emails dan order_refunds. Auto-deploy menjalankan migrasi sebelum mengganti aplikasi; kegagalan menghentikan deploy.

## Verifikasi

- 24 unit/source tests terkait MOM, media, alamat, lokasi, keranjang dan urutan deploy: lulus.
- 4 tes panduan admin (44 bagian dan 25 screenshot): lulus melalui server lokal 4336.
- Integrasi DB lokal terisolasi dengan fetch/SMTP mock: dua dispatcher bersamaan hanya mengirim dua email (satu tiap penerima); dua refund bersamaan hanya membuat satu POST provider; pending ke succeeded; permintaan kedua ditolak. Fixture dibersihkan, order lama tidak diubah.
- Uji upload cover -> simpan CMS -> render /occasions langsung: lulus; media lama dipulihkan dan file uji dibersihkan.
- Toggle lokal kini OFF sesuai instruksi lanjutan: delivery dan pickup ditolak, kedua endpoint mengembalikan 503, tombol checkout produk/keranjang nonaktif, tautan bayar order disembunyikan. Default bila setting belum ada/DB tidak siap juga OFF. 13 tes pengaman checkout dan build lulus.
- Website live belum diperbarui. URL invoice Xendit lama yang sudah dibagikan tidak otomatis kedaluwarsa dengan toggle ini; perlu penanganan dashboard terpisah.
- Browser: menu Aksi/WhatsApp dan kontrol refund/email tampil, tombol uang/email nonaktif tanpa konfigurasi; sidebar ditutup lewat gerakan pointer dari panel ke produk tanpa klik close.
- Tes lama `uat-media-upload.test.mjs` masih gagal pada byte-range video suffix di server dev: request bytes=-10 mendapat bytes 0-10/140 (11 byte). Ini terpisah dari cover Occasion; jangan anggap seluruh regresi media lulus. Kode serving video tidak diubah pada pekerjaan ini.

## Bukti Tampilan

- 01-checkout-toggle.jpg
- 02-order-actions.jpg
- 03-refund-email-gates.jpg
- 04-filter-open.jpg
- 05-filter-pointer-closed.jpg

## Referensi Integrasi

- https://developers.xendit.co/api-reference/payments-api/ (refund memakai invoice_id atau payment_request_id)
- https://docs.xendit.co/apidocs/refund-payment-request
- https://nodemailer.com/smtp
