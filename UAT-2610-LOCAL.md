# Review Lokal - UAT ANIA 2610

Sumber: [2610 UAT Ania](https://docs.google.com/spreadsheets/d/1UzFE28vB7J6OfwifUTTAKK-7XlN3Cx_TWb-nYdBxg9I/edit)

Preview: http://127.0.0.1:4331/

Status: perubahan belum di-stage, commit, atau push. Checklist ini mencatat implementasi kode, bukan persetujuan visual dari client.

## Checklist Spreadsheet

| No. | Bagian | Perubahan lokal |
| --- | --- | --- |
| 1 | Homepage | Teks italic menjadi Celebrate Today with Fresh Blooms sesuai UAT; heading utama tetap. |
| 2 | Homepage | Ikon pengalaman floral diganti motif bunga. |
| 3 | Homepage | Foto kartu produk dan kartu pilihan diperpendek menjadi rasio persegi. |
| 4 | Homepage | Panah pada kartu pilihan ditambahkan; link menuju Shop dengan filter sesuai kartu. |
| 5 | Homepage | Semua item Occasion, Category, dan Flower tersedia dalam baris auto-slide. |
| 6 | Occasion | Heading tidak lagi sticky sehingga tidak menimpa konten saat scroll. |
| 7 | Occasion | Add-on menjadi satu baris auto-slide. |
| 8 | Occasion | Tiga ikon Send To diperbarui untuk partner, colleague, dan difficult time. |
| 9 | Shop | Ikon By Occasion menjadi kalender. |
| 10 | Shop | Judul mengikuti filter Occasion, Flower, Category, dan Add-on yang dipilih. |
| 11 | Detail Produk | Catatan Delivery diperkecil menjadi 10px. |
| 12 | Tombol | Tombol aksi menggunakan minimum tinggi 40px dan radius 4px, termasuk Cart. |
| 13 | Detail Produk | You May Also Like menjadi empat kartu per baris desktop, auto-slide, tanpa nomor halaman. |
| 14 | Detail Produk | Add-on menjadi empat kartu per baris desktop dan auto-slide. |
| 15 | About | Jarak ikon ke teks Behind The Flower menjadi 40px. |
| 16 | About | Tinggi kolase desktop dibatasi 700px; layout mobile tetap bertumpuk. |
| 17 | Sosial | Aset logo Threads bersama diperbaiki. |
| 18 | Contact | Nama, WhatsApp, dan email wajib; submit nonaktif sampai semua field wajib valid, termasuk pesan yang sebelumnya sudah wajib. |
| 19 | Contact | Pengiriman ke email belum diubah: menunggu konfirmasi tujuan dan alur pengiriman. Tetap WhatsApp sementara. |
| 20 | Contact | Alamat memiliki hyperlink email; link email dan telepon tetap dapat diklik. |
| 21 | Search | Garis pembatas hasil dihapus, diganti jarak 60px. |
| 22 | Cart | Delivery Information memakai komponen yang sama dengan detail: metode, kota, tanggal, alamat, nama, WhatsApp, email, dan kurir. Draft dari detail diteruskan ke Cart. |

## Cara Review

- Homepage: http://127.0.0.1:4331/
- Shop: http://127.0.0.1:4331/shop?occasion=graduation
- Detail: http://127.0.0.1:4331/product/a-handful-flower-box
- About: http://127.0.0.1:4331/about
- Contact: http://127.0.0.1:4331/contact
- Cart: http://127.0.0.1:4331/cart
- Tambahkan produk dari detail untuk melihat Delivery Information di Cart.
- Cek tab pilihan dan auto-slide, perubahan judul filter, validasi Contact, serta pergantian Delivery/Pickup.
- Auto-slide berhenti saat hover, fokus keyboard, sentuhan, tab tidak aktif, atau preferensi reduced motion aktif. Pada mobile, kartu dapat digeser horizontal.
- Lihat diff unstaged untuk kode lama versus kode baru. File baru utama: DeliveryFields.astro dan card-carousel.ts.

## Verifikasi

- Build produksi dan Astro check berhasil.
- Enam route preview di atas memberikan HTTP 200.
- Diff whitespace untuk src dan public bersih.
- Pemeriksaan screenshot/browser otomatis belum selesai: Computer Use berhenti karena tidak dapat memastikan URL browser aktif. Layout desktop/mobile dan interaksi masih perlu review visual di preview.
- Tidak melakukan transaksi checkout, mengirim pesan, mengirim email, atau mengubah spreadsheet.
- Perubahan awal pada something.html dan LAPORAN-PERUBAHAN-2197148.md tidak diubah.
