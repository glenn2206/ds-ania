import type { GuideSection } from './admin-guide';

const stages = [
  {
    key: 'produk', title: 'Pelanggan memilih produk', route: '/product/{slug}', file: '01-customer-product.jpg',
    intro: 'Mulai dari halaman produk. Foto contoh memakai produk DEMO lokal; harga dan nama pada screenshot bukan katalog transaksi nyata.',
    steps: ['Buka produk dari Shop, lalu lihat foto dan deskripsinya.', 'Pilih varian Standard atau Premium sesuai kebutuhan.', 'Periksa harga dan pilih Delivery untuk pengiriman atau Pickup untuk ambil sendiri.'],
    result: 'Produk dan varian yang akan dibeli sudah sesuai.',
  },
  {
    key: 'pin', title: 'Pelanggan menentukan pin tujuan', route: '/product/{slug}', file: '02-customer-pin.jpg',
    intro: 'Kurir Instant membutuhkan pin yang tepat. Screenshot memakai koordinat contoh, bukan lokasi pelanggan nyata; jangan menyalin pin demo untuk pesanan asli.',
    steps: ['Klik Choose delivery pin untuk membuka peta.', 'Pilih titik di peta, atau gunakan Use my location hanya bila perangkat berada di tujuan dan pelanggan menyetujui izin lokasi. Koordinat juga dapat dimasukkan lalu klik Find.', 'Periksa titiknya, lalu klik Use this pin. Jika mengirim ke orang lain, gunakan lokasi penerima, bukan lokasi pemesan.'],
    result: 'Koordinat tujuan terlihat di bawah tombol Change delivery pin.',
  },
  {
    key: 'alamat', title: 'Pelanggan mengisi alamat dan kontak', route: '/product/{slug}', file: '03-customer-delivery.jpg',
    intro: 'Pin tidak menggantikan alamat tertulis. Isi alamat lengkap agar kurir mengetahui gedung, unit, rumah, serta petunjuk tujuan yang benar.',
    steps: ['Isi Receive on dan Full Delivery Address dengan tanggal serta alamat lengkap.', 'Isi Sender Name dan Sender WhatsApp yang aktif. Sender Email bersifat opsional.', 'Klik Check Instant Delivery, periksa ongkir, lalu klik Check Out Now untuk masuk ke keranjang.'],
    result: 'Data pengiriman terisi dan biaya Instant terlihat.',
  },
  {
    key: 'checkout', title: 'Pelanggan memeriksa keranjang dan checkout', route: '/cart', file: '04-customer-cart.jpg',
    intro: 'Checkout dilakukan pelanggan, bukan admin. Total pembayaran sudah mencakup bunga dan ongkir; contoh simulasi ini berjumlah Rp130.000.',
    steps: ['Periksa produk, jumlah, tanggal, alamat, dan kontak pada keranjang.', 'Klik Check Instant Delivery dan pilih layanan Instant yang tersedia. Contoh mock: bunga Rp100.000 dan ongkir Grab Rp30.000.', 'Pastikan total sesuai, lalu klik Proceed to Checkout untuk membuat pesanan dan membuka pembayaran.'],
    result: 'Pesanan dibuat dan halaman pembayaran terbuka.',
  },
  {
    key: 'bayar', title: 'Pelanggan menyelesaikan pembayaran', route: 'Halaman pembayaran provider', file: '05-customer-mock-payment.jpg',
    intro: 'FOTO SIMULASI: ini portal LOCAL MOCK, bukan halaman Xendit. Tidak ada uang, metode pembayaran nyata, atau saldo yang digunakan pada latihan ini.',
    steps: ['Pada live, pastikan halaman resmi Xendit, kode pesanan, dan nominal benar; pelanggan memilih metode pembayaran yang tersedia.', 'Pada latihan lokal saja, klik Simulasikan pembayaran berhasil. Tombol ini mengirim callback PAID simulasi melalui handler webhook aplikasi.', 'Tunggu kembali ke halaman order. Jangan menganggap pesanan lunas hanya karena halaman pembayaran sudah terbuka.'],
    result: 'Callback pembayaran berhasil diproses dan status order menjadi paid.',
  },
  {
    key: 'lunas', title: 'Pelanggan melihat konfirmasi lunas', route: '/order/{code}', file: '06-customer-paid.jpg',
    intro: 'Setelah pembayaran terkonfirmasi, pelanggan melihat Lunas - pesanan diproses. Pembayaran tidak langsung memanggil kurir karena admin perlu menyiapkan rangkaian dahulu.',
    steps: ['Periksa status Lunas pada halaman order.', 'Cocokkan kode order, item, alamat, dan total termasuk ongkir.', 'Simpan link order untuk melihat hasil proses berikutnya; pelanggan tidak perlu membayar ongkir kedua kali saat admin booking.'],
    result: 'Kode contoh ANIA-933F9C berstatus lunas dengan total tetap Rp130.000.',
  },
  {
    key: 'admin-daftar', title: 'Admin membuka pesanan paid', route: '/admin/orders', file: '07-admin-orders.jpg',
    intro: 'Mulai proses admin dari daftar order. Gunakan kode pesanan yang sama dengan pelanggan agar tidak memproses pesanan lain yang namanya mirip.',
    steps: ['Login ke CMS, lalu klik menu Order.', 'Cari kode pesanan dan pastikan status paid serta nominalnya cocok.', 'Klik kode order untuk membuka detail pesanan.'],
    result: 'Detail order pelanggan yang benar terbuka.',
  },
  {
    key: 'admin-periksa', title: 'Admin memeriksa dan menyiapkan rangkaian', route: '/admin/orders/{id}', file: '08-admin-paid-detail.jpg',
    intro: 'Admin tidak checkout ulang. Periksa pembayaran dan persiapkan rangkaian sebelum meminta kurir. Paid manual bukan pengganti konfirmasi pembayaran provider.',
    steps: ['Periksa item, pembayaran, tanggal permintaan, asal pickup, alamat tujuan, dan pin.', 'Siapkan rangkaian; pastikan berat dan ukurannya sesuai layanan motor. Periksa kontak pickup dan ubah nama/WhatsApp penerima bila berbeda dari pemesan.', 'Saat tanggal sesuai dan rangkaian siap dikirim, klik Cek tarif sebelum pesan. Jangan memesan lebih awal untuk pesanan tanggal mendatang.'],
    result: 'Data penerima benar dan rangkaian siap dijemput.',
  },
  {
    key: 'admin-konfirmasi', title: 'Admin meninjau dan mengonfirmasi booking', route: '/admin/orders/{id}', file: '09-admin-review-booking.jpg',
    intro: 'Dialog menampilkan tarif terbaru dan selisih dengan ongkir yang sudah dibayar pelanggan. Screenshot berlabel SANDBOX / SIMULASI; tidak ada kurir nyata dipanggil.',
    steps: ['Periksa kurir, tanggal, kontak pickup, penerima, alamat, pin, tarif terbaru, dan selisih biaya. Review berlaku 90 detik.', 'Pastikan siap kirim sekarang. Booking meminta penjemputan sekarang, bukan menjadwalkan otomatis mengikuti tanggal permintaan.', 'Centang konfirmasi pemeriksaan lalu klik Pesan Kurir Instant. Pada live biaya memakai saldo Biteship toko, bukan invoice baru untuk pelanggan.'],
    result: 'Permintaan booking diproses satu kali untuk order tersebut.',
  },
  {
    key: 'admin-booked', title: 'Admin memastikan booking berhasil', route: '/admin/orders/{id}', file: '10-admin-booked.jpg',
    intro: 'Booking berhasil menampilkan ID provider, resi, dan status kurir. Label booked (test), ID mock_, dan resi MOCK pada foto adalah penanda latihan lokal.',
    steps: ['Pastikan status booking CMS booked dan ID pengiriman tersimpan.', 'Cocokkan kurir, kontak, dan tarif akhir yang ditampilkan.', 'Jangan membuat booking kedua. Bila timeout atau status creating/review, cek dashboard dan ikuti SOP rekonsiliasi, bukan klik ulang secara membabi buta.'],
    result: 'Satu booking tercatat dengan ID dan resi yang dapat diperiksa.',
  },
  {
    key: 'pickup', title: 'Admin memantau kurir menuju pickup', route: '/admin/orders/{id}', file: '11-admin-picking-up.jpg',
    intro: 'Status picking_up berarti kurir menuju titik penjemputan. Sinkronisasi hanya membaca status pengiriman; tidak membuat booking baru.',
    steps: ['Klik Sinkronkan status Biteship saat perlu memeriksa perkembangan.', 'Periksa status picking_up dan waktu pembaruan.', 'Siapkan barang di titik pickup dan pastikan staf dapat dihubungi kurir.'],
    result: 'Admin mengetahui bahwa kurir sedang menuju lokasi pickup.',
  },
  {
    key: 'antar', title: 'Admin memantau pengantaran', route: '/admin/orders/{id}', file: '12-admin-dropping-off.jpg',
    intro: 'Status dropping_off menunjukkan barang sedang diantar. Dalam demo status maju setiap sinkronisasi; pada live status mengikuti keadaan sebenarnya dari Biteship.',
    steps: ['Sinkronkan status saat perlu melihat perkembangan terbaru, tanpa polling berulang.', 'Periksa apakah status berubah menjadi dropping_off.', 'Pantau kendala operasional melalui dashboard Biteship dan komunikasikan seperlunya kepada penerima.'],
    result: 'Pengiriman tercatat sedang menuju penerima.',
  },
  {
    key: 'diterima', title: 'Admin memeriksa status delivered', route: '/admin/orders/{id}', file: '13-admin-delivered.jpg',
    intro: 'Delivered adalah status kurir yang menyatakan pengiriman selesai. Pada latihan ini status tersebut disimulasikan, bukan bukti barang benar-benar diterima.',
    steps: ['Klik Sinkronkan status Biteship untuk mengambil status terbaru.', 'Pastikan status kurir menunjukkan delivered.', 'Pada operasional nyata, periksa bukti atau konfirmasi penerimaan sesuai prosedur toko sebelum menutup pesanan.'],
    result: 'Status kurir delivered terlihat dan penerimaan telah diperiksa oleh admin.',
  },
  {
    key: 'fulfilled', title: 'Admin menutup order sebagai fulfilled', route: '/admin/orders/{id}', file: '14-admin-fulfilled.jpg',
    intro: 'Status kurir dan status order website terpisah. Saat ini delivered tidak otomatis mengubah pesanan menjadi fulfilled; admin menyimpannya setelah memastikan penerimaan.',
    steps: ['Setelah penerimaan terkonfirmasi, buka bagian Status di detail order.', 'Pilih fulfilled dari pilihan status.', 'Klik Simpan status dan pastikan pilihan fulfilled tetap tersimpan setelah halaman diperbarui.'],
    result: 'Order website selesai dan halaman pelanggan dapat menampilkan Selesai dikirim.',
  },
  {
    key: 'customer-selesai', title: 'Pelanggan melihat pesanan selesai', route: '/order/{code}', file: '15-customer-delivered.jpg',
    intro: 'Akhir alur adalah halaman pelanggan berstatus Selesai dikirim. Kode order dan nominal harus tetap sama dari checkout sampai pesanan selesai.',
    steps: ['Buka kembali atau refresh link order pelanggan.', 'Pastikan tertulis Selesai dikirim setelah admin menyimpan fulfilled.', 'Cocokkan kode pesanan dan total; contoh tetap ANIA-933F9C, Rp130.000 termasuk ongkir.'],
    result: 'Pelanggan melihat pesanan selesai tanpa tagihan ongkir tambahan.',
  },
];

export const orderFlowGuide: GuideSection[] = stages.map((stage, index) => ({
  id: `alur-${stage.key}`, group: 'alur-order', title: stage.title,
  route: stage.route, intro: stage.intro, steps: stage.steps, result: stage.result,
  image: { file: stage.file, alt: stage.title, caption: 'SIMULASI LOKAL - data fiktif. Bukan bukti pembayaran atau pengiriman live. ' + stage.title + '.' },
  notes: index === 0 ? ['Seluruh 15 foto memakai order contoh yang sama. Tidak ada uang dipindahkan, saldo dipotong, atau kurir nyata dipesan.', 'Latihan memverifikasi alur internal, bukan key live, aktivasi API, saldo, tarif aktual, ketersediaan driver, maupun bukti serah-terima nyata.'] : undefined,
}));
