# Booking Instant dari CMS

## Alur

Xendit callback terverifikasi -> `paid` + `paid_at` -> admin menyiapkan bunga ->
cek tarif terbaru -> konfirmasi biaya/penerima -> POST Order API -> simpan ID Biteship.
Tidak ada pemanggilan kurir dari webhook pembayaran. Sinkronisasi status hanya atas
permintaan admin, bukan polling. Panduan operasional ada di `/admin/panduan#pesan-kurir`.
Pembayaran pelanggan sudah termasuk bunga dan ongkir. Booking admin memakai saldo
Biteship toko; tidak membuat invoice baru atau menagih pelanggan lagi. Saldo Xendit
dan saldo Biteship terpisah.

## Sebelum deploy

1. Backup database. Jalankan `npm run db:shipping` dengan akun pemilik database pada
   environment tujuan sebelum kode baru berjalan. Migrasi hanya menambah tabel
   `order_shipments`; tidak mengubah order lama. Instalasi baru lewat `db:schema`
   juga membuat tabel ini. Jangan gunakan `--drop`.
   Auto-deploy cPanel menjalankan migrasi ini menggunakan konfigurasi Passenger
   setelah backup/build dan sebelum mengganti aplikasi. Jika migrasi atau izin
   gagal, deploy berhenti dan versi aplikasi lama tetap berjalan; periksa log dan
   minta pemilik database menyiapkan tabel/izin, lalu ulangi deploy.
2. Jika akun runtime berbeda dari pemilik tabel PostgreSQL, berikan hanya
   SELECT, INSERT, UPDATE pada `order_shipments` kepada user aplikasi.
3. Isi key Biteship live dengan Order API aktif. Jangan gunakan key sandbox untuk
   operasional. Periksa saldo dan layanan Instant Gojek/Grab.
4. `BITESHIP_ORIGIN_PHONE` kosong memakai nomor website 0821-1109-1885 sebagai
   default pickup yang disetujui pengelola. Isi variabel ini jika memakai kontak
   staf cabang yang berbeda. Periksa `BITESHIP_ORIGIN_NAME`, `BITESHIP_ORIGIN_ADDRESS`,
   `BITESHIP_ORIGIN_LATITUDE`, `BITESHIP_ORIGIN_LONGITUDE` untuk cabang Tangerang.
5. Pastikan `SESSION_SECRET` bukan default development, lalu set
   `BITESHIP_BOOKING_ENABLED=true` hanya setelah siap operasional. Restart aplikasi.
   Jangan menaruh secret pada variabel PUBLIC_. Default booking adalah nonaktif.
6. Uji UI dan akses admin tanpa booking nyata. Uji booking sandbox terpisah dengan
   persetujuan. Booking live memerlukan keputusan operasional admin, bukan tes otomatis.

## Pengamanan dan batasan

- Endpoint admin membutuhkan sesi dan Origin same-origin. Payload, item, harga,
  courier dan pin tidak diambil mentah dari tombol browser. Review ditandatangani
  HMAC dan berlaku 90 detik. Hanya Gojek/Grab Instant, tidak COD/asuransi.
- Pembayaran harus punya status paid, paid_at dan invoice Xendit. paid manual tidak
  memberi paid_at. Kontak pemesan tidak selalu penerima: admin meninjau/mengganti
  nama dan WhatsApp penerima sebelum konfirmasi.
- Checkout baru menyimpan pin, alamat dan kurir terstruktur. Order lama tanpa
  snapshot/pickup ditolak, tidak mengekstrak koordinat dari teks catatan.
- Claim transaksi dengan lock baris order disimpan sebelum POST provider.
  Klik paralel, request ulang dan restart tidak membolehkan pembuatan kedua.
  Reference ID deterministik/unik juga dikirim ke Biteship.
- 4xx penolakan pasti dapat dicoba lagi dengan quote baru. Timeout, 5xx, respons
  tidak lengkap dan duplicate reference menjadi review. Tidak ada blind retry.
- Hasil sukses yang gagal tersimpan di DB tetap terkunci creating. Cocokkan Reference
  ID di dashboard, lalu sinkronkan ID setelah >= 1 menit. Jangan reset state atau
  mengganti reference untuk melewati penguncian. ID silang ditolak.
- State booked tetap terminal untuk pembuatan, termasuk provider cancelled. Booking
  ulang/pembatalan/refund ditangani terpisah secara operasional.
- Perubahan tarif ditampilkan sebelum konfirmasi; harga final dari provider disimpan
  terpisah, bukan mengganti total/invoice yang sudah dibayar. Selisih ditanggung atau
  diselesaikan toko, tidak menagih pelanggan otomatis.
- Berat masih 1.500 gram per item seperti quote checkout. Jangan booking rangkaian
  dengan berat/dimensi berbeda atau tidak muat motor; gunakan penanganan manual.
- Tidak ada webhook Biteship, auto-fulfilled atau pembatalan kurir dari CMS.

Referensi: https://biteship.com/id/docs/api/orders/create dan
https://biteship.com/id/docs/api/orders/retrieve.
