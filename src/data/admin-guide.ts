export const guideUpdated = '8 Oktober 2026';

export const guideGroups = [
  { id: 'akses', title: 'Mulai di sini', description: 'Login, menu, dan aturan penyimpanan.' },
  { id: 'produk', title: 'Kelola produk', description: 'Tambah, edit, harga, stok, diskon, dan foto.' },
  { id: 'order', title: 'Kelola order', description: 'Periksa pesanan dan perbarui status dengan aman.' },
  { id: 'pengaturan', title: 'Pengaturan situs', description: 'Promo, carousel beranda, dan video About.' },
  { id: 'bantuan', title: 'Pemeriksaan dan bantuan', description: 'Cek hasil perubahan dan atasi masalah umum.' },
] as const;

export const guideRoutes = [
  ['Login', '/admin/login', 'Masuk ke CMS dengan akun admin.'],
  ['Daftar produk', '/admin', 'Lihat katalog dan pilih produk yang ingin diubah.'],
  ['Produk baru', '/admin/products/new', 'Buat produk, lalu lanjut upload foto.'],
  ['Edit produk', '/admin/products/{id}', 'Halaman ini dibuka dengan klik nama produk.'],
  ['Daftar order', '/admin/orders', 'Lihat pesanan dan filter status.'],
  ['Detail order', '/admin/orders/{id}', 'Halaman ini dibuka dengan klik kode order.'],
  ['Pengaturan', '/admin/settings', 'Ubah promo, carousel, dan video About.'],
  ['Panduan', '/admin/panduan', 'SOP yang sedang Anda baca.'],
];

export interface GuideSection {
  id: string;
  group: typeof guideGroups[number]['id'];
  title: string;
  route?: string;
  href?: string;
  intro: string;
  steps: string[];
  result?: string;
  notes?: string[];
  fields?: { name: string; description: string; example: string }[];
  image?: { file: string; alt: string; caption: string };
}

export const guideSections: GuideSection[] = [
  {
    id: 'login', group: 'akses', title: 'Masuk ke admin', route: '/admin/login',
    intro: 'Gunakan akun admin yang diberikan pengelola situs. Password tidak dicantumkan di panduan agar tidak ikut tersebar saat panduan dibagikan.',
    steps: [
      'Buka alamat situs yang benar, lalu tambahkan /admin/login di belakangnya. Untuk latihan lokal gunakan http://127.0.0.1:4331/admin/login.',
      'Isi Username dan Password sesuai akun Anda. Perhatikan huruf besar, huruf kecil, dan spasi yang tidak sengaja ikut tersalin.',
      'Klik Masuk. Jika berhasil, halaman Daftar Produk akan terbuka.',
      'Jika muncul Username / password salah, ketik ulang dengan teliti. Jika tetap gagal, hubungi pengelola akun; jangan membuat atau menebak akun baru.',
    ],
    result: 'Menu Produk, Order, Pengaturan, dan Panduan terlihat di bagian atas CMS.',
    notes: ['Jika Anda sudah login, membuka /admin/login akan langsung mengarah ke Daftar Produk.', 'Alamat 127.0.0.1 adalah situs lokal di komputer ini, bukan website live. Perubahan lokal tidak otomatis mengubah data website live.'],
    image: { file: '00-login.jpg', alt: 'Halaman login ANIA CMS dengan kolom Username dan Password kosong', caption: 'Isi akun Anda sendiri pada halaman login. Jangan membagikan password melalui screenshot.' },
  },
  {
    id: 'menu-dan-simpan', group: 'akses', title: 'Kenali menu dan cara menyimpan',
    intro: 'Pilih menu sesuai tugas. Setiap bagian mempunyai cara simpan yang berbeda; selesai mengisi belum berarti perubahan sudah tersimpan.',
    steps: [
      'Produk untuk mengelola katalog. Order untuk melihat pesanan. Pengaturan untuk promo dan media. Panduan untuk membuka SOP ini.',
      'Gunakan Lihat situs untuk membuka tampilan pelanggan di tab lain. Pada editor produk, gunakan Lihat di situs untuk memeriksa produk yang sedang diedit.',
      'Sebelum pindah halaman, simpan perubahan teks dan tunggu pesan berhasil. Jika muncul pesan error, jangan anggap perubahan sudah masuk.',
      'Setelah selesai bekerja, klik Keluar, terutama pada komputer bersama.',
    ],
    fields: [
      { name: 'Detail produk', description: 'Nama, harga, stok, diskon, dan kolom lainnya harus disimpan.', example: 'Simpan perubahan' },
      { name: 'Foto produk', description: 'Upload, ubah urutan, dan hapus foto langsung diproses saat dilakukan. Bukan menunggu tombol simpan form.', example: 'Preview muncul setelah upload selesai' },
      { name: 'Status order', description: 'Pilihan status baru berlaku setelah tombol simpan diklik.', example: 'Simpan status' },
      { name: 'Bar promo', description: 'Tombol ini menyimpan promo saja, bukan carousel atau video.', example: 'Simpan' },
      { name: 'Carousel dan video', description: 'Upload membuat preview. Urutan, penghapusan dari daftar, dan pilihan video diterapkan setelah simpan.', example: 'Simpan media' },
    ],
    notes: ['Kembali, menutup tab, atau reload tidak menyimpan teks form yang belum disimpan.', 'Jangan menjalankan Deploy ulang untuk sekadar menyimpan produk, foto, carousel, atau video.'],
  },
  {
    id: 'daftar-produk', group: 'produk', title: 'Pilih produk yang ingin diedit', route: '/admin', href: '/admin',
    intro: 'Daftar Produk menampilkan nama, kategori, harga, stok, jumlah foto, dan status. Klik nama produk, bukan slug di bawahnya, untuk membuka editor.',
    steps: [
      'Klik menu Produk di bagian atas.',
      'Cari nama produk dalam daftar. Untuk daftar panjang di komputer, pencarian browser Ctrl+F atau Cmd+F dapat membantu.',
      'Periksa nama dan kategori agar tidak memilih produk yang mirip tetapi berbeda.',
      'Klik nama produk untuk membuka halaman edit. Catat bahwa angka pada /admin/products/{id} adalah ID produk, bukan nomor urutan di tabel.',
    ],
    notes: ['Harga berupa tanda kosong berarti harga belum diisi. Stok berupa simbol tak terbatas berarti stok tidak dilacak.', 'Jumlah Foto hanya menunjukkan berapa file foto yang tercatat. Periksa preview untuk memastikan file benar-benar tampil.'],
    image: { file: '01-produk.jpg', alt: 'Daftar produk ANIA CMS dengan kolom nama kategori harga stok foto dan status', caption: 'Klik nama produk pada kolom Nama untuk membuka halaman edit.' },
  },
  {
    id: 'tambah-produk', group: 'produk', title: 'Tambah produk baru', route: '/admin/products/new', href: '/admin/products/new',
    intro: 'Simpan produk terlebih dahulu agar bagian upload foto tersedia. Disarankan mulai dengan draft supaya produk belum tampil ke pelanggan saat isinya masih disiapkan.',
    steps: [
      'Dari menu Produk, klik + Produk baru.',
      'Isi Nama, pilih Kategori, lalu lengkapi harga, stok, label, bunga, ukuran, occasion, dan deskripsi sesuai produk.',
      'Ubah Status ke draft (sembunyi dari situs). Form baru awalnya memilih published, jadi periksa bagian ini sebelum menyimpan.',
      'Slug boleh dikosongkan untuk produk baru; sistem akan membuatnya dari nama. Jika diisi sendiri, gunakan kata pendek dengan tanda hubung, misalnya flower-box-pink.',
      'Klik Simpan & lanjut ke foto. Tunggu sampai halaman edit produk baru terbuka.',
      'Upload foto pada bagian Foto. Pilih foto utama dan atur urutannya mengikuti SOP Foto Produk.',
      'Setelah isi dan foto lengkap, pilih Status published lalu klik Simpan perubahan.',
      'Klik Lihat di situs. Periksa foto, nama, harga, deskripsi, dan ketersediaan sebelum membagikan link produk.',
    ],
    result: 'Produk tercatat di daftar. Setelah published, produk dapat tampil pada katalog pelanggan.',
    notes: ['Nama wajib diisi. Produk draft tidak tampil pada situs pelanggan, sehingga preview publik produk draft bisa tidak tersedia.', 'Link Drive tidak otomatis mengambil atau mengupload foto. Foto tetap harus diupload pada bagian Foto.'],
    image: { file: '02-produk-baru.jpg', alt: 'Form produk baru yang belum diisi dengan tombol Simpan dan lanjut ke foto', caption: 'Pilih draft selama persiapan. Bagian Foto muncul setelah produk pertama kali disimpan.' },
  },
  {
    id: 'isi-produk', group: 'produk', title: 'Panduan mengisi setiap kolom produk', route: '/admin/products/{id}',
    intro: 'Gunakan informasi yang benar dan konsisten dengan katalog. Kolom yang tidak diperlukan boleh dikosongkan, kecuali Nama.',
    steps: ['Buka editor dengan klik nama produk di menu Produk.', 'Cocokkan isi kolom dengan penjelasan berikut. Periksa harga, stok, diskon, dan status paling akhir.', 'Klik Simpan perubahan, tunggu pesan Tersimpan, lalu cek Lihat di situs.'],
    fields: [
      { name: 'Nama *', description: 'Nama produk yang ditampilkan kepada pelanggan. Wajib diisi.', example: 'A Handful Flower Box' },
      { name: 'Slug', description: 'Bagian alamat detail produk. Pertahankan slug produk lama agar link yang sudah dibagikan tidak berubah.', example: 'a-handful-flower-box' },
      { name: 'Kategori', description: 'Kelompok produk: Premium Wrapped Bloom, Bloom Box & Basket, Standing Flower & Board, Vase, atau Accessories / Add-on.', example: 'Bloom Box & Basket' },
      { name: 'Harga (Rp)', description: 'Harga asli sebelum diskon. Isi angka utuh tanpa Rp, titik, atau koma. Kosong berarti By request.', example: '950000' },
      { name: 'Stok', description: 'Angka sisa stok. Kosong berarti tidak dilacak, bukan habis. Isi 0 jika habis.', example: '5' },
      { name: 'Diskon (%)', description: 'Persentase bulat 0 sampai 99. Gunakan 0 untuk tanpa diskon.', example: '25' },
      { name: 'Pill (label kartu)', description: 'Label kecil pada kartu produk. Bukan kategori utama.', example: 'Bloom Box' },
      { name: 'Status', description: 'published untuk tampil; draft untuk disembunyikan.', example: 'draft saat persiapan' },
      { name: 'Bunga', description: 'Jenis bunga dalam rangkaian. Pisahkan beberapa jenis dengan koma.', example: 'Rose, Hydrangea, Carnation' },
      { name: 'Ukuran', description: 'Ukuran yang mudah dimengerti pelanggan; sertakan satuan.', example: 'Diameter 40-50 cm' },
      { name: 'Occasion', description: 'Momen yang sesuai dengan produk. Gunakan penamaan konsisten agar pencarian/filter relevan.', example: 'Happy Birthday, Happy Graduation' },
      { name: 'Featured (label)', description: 'Label kurasi tambahan jika diperlukan. Mengisinya tidak menjamin produk otomatis menjadi pilihan di semua bagian beranda.', example: 'Kosongkan bila tidak digunakan' },
      { name: 'Catatan harga', description: 'Keterangan tambahan tentang harga bila diperlukan.', example: 'Mulai dari Rp 950.000' },
      { name: 'Link Drive (opsional)', description: 'Referensi folder/file Drive. Bukan sumber upload otomatis.', example: 'Link folder aset produk' },
      { name: 'Deskripsi', description: 'Penjelasan rangkaian, bahan, warna, dan ketentuan produk. Hindari memasukkan password atau data pribadi.', example: 'Rangkaian mawar pink dalam flower box...' },
    ],
    image: { file: '03-edit-produk.jpg', alt: 'Editor produk Blushing Blooms beserta detail dan bagian Foto', caption: 'Contoh isi produk yang sudah tersimpan. Sesuaikan kolom dengan produk Anda sendiri.' },
  },
  {
    id: 'edit-produk', group: 'produk', title: 'Edit produk yang sudah ada', route: '/admin/products/{id}',
    intro: 'Untuk koreksi nama, deskripsi, kategori, ukuran, atau label, edit produk yang sama. Tidak perlu membuat produk baru.',
    steps: ['Klik Produk, lalu klik nama produk yang akan diubah.', 'Ubah hanya kolom yang diperlukan. Jangan mengubah Slug kecuali perubahan alamat produk memang disengaja.', 'Klik Simpan perubahan di bagian bawah halaman.', 'Tunggu pesan Tersimpan. Situs ikut ter-update dalam sekitar 60 detik.', 'Klik Lihat di situs di bagian atas editor. Muat ulang halaman pelanggan dan periksa perubahan.'],
    result: 'Nilai baru tetap terlihat setelah editor dimuat ulang, dan tampil pada halaman pelanggan setelah cache diperbarui.',
    notes: ['Jika Slug berubah, alamat detail produk ikut berubah. Cek ulang link yang pernah dibagikan; tidak ada jaminan pengalihan otomatis dari alamat lama.', 'Jika ada error, catat pesannya sebelum mencoba lagi. Jangan klik simpan berulang-ulang saat request masih berjalan.'],
  },
  {
    id: 'harga-diskon', group: 'produk', title: 'Ubah harga dan diskon', route: '/admin/products/{id}',
    intro: 'Sistem menghitung harga diskon dari Harga (Rp). Harga yang diisi harus harga asli, bukan harga yang sudah dipotong.',
    steps: ['Buka produk yang ingin diubah.', 'Isi Harga (Rp) dengan angka, misalnya 950000 untuk Rp 950.000.', 'Isi Diskon (%) dengan angka bulat. Contoh: 25 untuk diskon 25 persen; 0 untuk menonaktifkan diskon.', 'Klik Simpan perubahan dan tunggu pesan berhasil.', 'Periksa halaman produk dan Shop. Jika harga asli Rp 950.000 dengan diskon 25 persen, harga jual menjadi Rp 712.500.', 'Untuk mengecek produk diskon, buka /shop?filter=sale. Jika diskon dihentikan, ubah Diskon (%) menjadi 0 dan simpan lagi.'],
    result: 'Produk dengan harga positif dan diskon aktif masuk filter Sale; harga asli dan harga diskon tampil pada detail produk.',
    notes: ['Diskon 100, angka negatif, dan pecahan seperti 12.5 tidak diterima.', 'Harga kosong berarti By request. Diskon tidak dihitung pada produk tanpa harga atau dengan harga 0.', 'Mengganti teks promo menjadi 25% Off tidak otomatis memberi semua produk diskon 25 persen. Diskon diatur per produk.', 'Perubahan harga katalog tidak mengubah nilai order yang sudah dibuat.'],
  },
  {
    id: 'stok-status', group: 'produk', title: 'Atur stok dan tampilkan atau sembunyikan produk', route: '/admin/products/{id}',
    intro: 'Stok dan Status berbeda. Stok mengatur ketersediaan; Status mengatur apakah produk tampil pada katalog.',
    steps: ['Buka editor produk.', 'Untuk stok terbatas, isi jumlah yang benar, misalnya 5. Untuk produk habis, isi 0. Jangan kosongkan kolom untuk menandai habis.', 'Jika stok tidak ingin dihitung, kosongkan Stok. Pilihan ini berarti produk tidak dibatasi oleh angka stok.', 'Pilih published jika produk siap ditampilkan. Pilih draft untuk menyembunyikan produk tanpa menghapus datanya.', 'Klik Simpan perubahan, lalu cek di katalog pelanggan.'],
    fields: [
      { name: 'Stok kosong', description: 'Stok tidak dilacak; ditampilkan dengan simbol tak terbatas di daftar admin.', example: 'Tidak dibatasi angka stok' },
      { name: 'Stok 0', description: 'Tidak tersedia atau sold out.', example: 'Isi 0, bukan kosong' },
      { name: 'Stok 5', description: 'Sisa stok yang dilacak berjumlah lima.', example: 'Isi angka utuh' },
      { name: 'draft', description: 'Produk disembunyikan, tetapi isi dan foto tetap disimpan.', example: 'Persiapan atau nonaktif sementara' },
      { name: 'published', description: 'Produk masuk katalog; kondisi sold out masih mengikuti stok.', example: 'Produk siap tampil' },
    ],
    notes: ['Jangan menulis nilai negatif atau teks seperti ready pada kolom Stok.', 'Pembayaran terkonfirmasi melalui callback Xendit mengurangi stok yang dilacak. Mengubah status order secara manual tidak melakukan pengurangan atau pengembalian stok.'],
  },
  {
    id: 'foto-produk', group: 'produk', title: 'Upload dan urutkan foto produk', route: '/admin/products/{id}',
    intro: 'Foto pertama menjadi gambar utama. Perubahan foto produk langsung diproses, terpisah dari penyimpanan detail produk.',
    steps: ['Buka produk yang sudah disimpan, lalu scroll ke bagian Foto.', 'Klik area Klik atau tarik foto ke sini, lalu pilih foto dari komputer. Anda juga dapat menyeret file foto ke area tersebut.', 'Gunakan JPG atau PNG, maksimal 12 MB per file. Beberapa foto dapat dipilih sekaligus.', 'Tunggu tulisan Mengunggah selesai dan preview foto muncul. Sistem mengoptimalkan foto menjadi JPEG hingga 1200 px tanpa memperbesar foto kecil.', 'Gunakan tombol panah naik untuk memajukan urutan, dan panah turun untuk memundurkan urutan. Foto paling awal menjadi gambar utama.', 'Untuk menghapus foto, klik tombol silang di bawah foto tersebut. Baca konfirmasi Hapus foto ini sebelum menyetujui.', 'Buka ulang editor untuk memastikan urutan tersimpan. Periksa foto utama dan galeri pada Lihat di situs.'],
    result: 'Preview foto terlihat tanpa ikon gambar rusak; galeri pelanggan menampilkan foto sesuai urutan.',
    notes: ['Upload, perubahan urutan, dan penghapusan foto diproses langsung. Tombol Simpan perubahan tetap diperlukan jika Anda juga mengedit harga, nama, atau kolom detail.', 'Hapus foto produk menghapus file, bukan sekadar menyembunyikannya. Simpan file asli di komputer/Drive sebelum menghapus.', 'Upload foto pengganti lebih dulu sebelum menghapus foto lama agar produk tidak kosong.', 'Jika upload beberapa foto gagal di tengah jalan, reload untuk mengecek foto yang sudah masuk sebelum mengulangi upload.'],
    image: { file: '04-foto-produk.jpg', alt: 'Preview foto produk dengan tombol urutan dan hapus serta area upload', caption: 'Bagian Foto pada editor produk. Foto pertama adalah gambar utama; tombol silang menghapus foto setelah konfirmasi.' },
  },
  {
    id: 'hapus-produk', group: 'produk', title: 'Nonaktifkan atau hapus produk', route: '/admin/products/{id}',
    intro: 'Untuk berhenti menjual sementara, gunakan draft. Hapus produk hanya jika penghapusan permanen memang sudah disetujui.',
    steps: ['Buka produk dan pastikan nama produknya benar.', 'Pilihan aman untuk nonaktif sementara: ubah Status ke draft dan klik Simpan perubahan.', 'Jika harus menghapus permanen, simpan salinan detail dan file foto terlebih dahulu.', 'Klik Hapus produk di bagian bawah editor. Baca nama produk pada konfirmasi.', 'Batalkan jika ragu. Setujui hanya jika data dan foto produk memang boleh dihapus permanen.', 'Setelah berhasil, CMS kembali ke Daftar Produk. Pastikan produk sudah tidak tampil di katalog pelanggan.'],
    notes: ['Tidak ada tombol Undo atau tempat sampah pemulihan pada CMS ini. Hapus produk juga menghapus foto produknya.', 'Jangan menghapus produk hanya untuk mengganti foto, stok, atau harga; gunakan editor.'],
  },
  {
    id: 'daftar-order', group: 'order', title: 'Lihat dan filter order', route: '/admin/orders', href: '/admin/orders',
    intro: 'Daftar Order berisi kode, pelanggan, total, status, dan tanggal. Contoh screenshot menggunakan order SOP, bukan pesanan yang harus diproses.',
    steps: ['Klik menu Order.', 'Klik Semua untuk melihat pesanan dari berbagai status, atau klik pending, paid, fulfilled, expired, atau cancelled untuk memfilter.', 'Periksa kode order dan nama pelanggan sebelum membuka detail.', 'Klik kode order pada kolom Kode. Halaman detail akan terbuka.', 'Jika order yang dicari tidak ada pada filter aktif, kembali ke Semua. Gunakan pencarian browser pada daftar yang ditampilkan jika diperlukan.'],
    result: 'Daftar sesuai filter yang dipilih, dan kode order membuka detail pesanan yang benar.',
    notes: ['Daftar menampilkan maksimal 200 order terbaru untuk filter aktif. Order lebih lama mungkin tidak tampil; minta bantuan pengelola jika diperlukan.', 'Status failed tersedia di detail order tetapi tidak mempunyai tombol filter tersendiri. Gunakan Semua atau route /admin/orders?status=failed.', 'CMS saat ini tidak menyediakan tombol membuat atau menghapus order pada halaman ini.'],
    image: { file: '05-order.jpg', alt: 'Daftar order yang menampilkan tombol filter dan order contoh SOP', caption: 'Klik status untuk memfilter, lalu klik kode order untuk membuka detail. Baris contoh hanya untuk dokumentasi.' },
  },
  {
    id: 'detail-order', group: 'order', title: 'Periksa detail order sebelum diproses', route: '/admin/orders/{id}',
    intro: 'Gunakan kode order sebagai acuan komunikasi internal. Pastikan pembayaran dan informasi pelanggan sudah sesuai sebelum menyiapkan pengiriman.',
    steps: ['Buka order melalui kode pada Daftar Order.', 'Periksa bagian Status. Jika tersedia, tautan Invoice Xendit dapat dibuka untuk memeriksa invoice terkait. Jangan melakukan pembayaran dari akun admin untuk mengetes order.', 'Periksa bagian Item: nama produk, jumlah, subtotal, ongkir, dan total. Contoh Rp 950.000 + Rp 20.000 = Rp 970.000.', 'Periksa Pelanggan & pengiriman: nama, nomor telepon, email jika ada, alamat, dan catatan.', 'Jika informasi kurang lengkap atau tidak cocok, konfirmasi melalui kanal operasional resmi sebelum diproses.', 'Klik Semua order untuk kembali ke daftar.'],
    result: 'Admin mengetahui produk, jumlah, total, status pembayaran, dan informasi pengiriman order yang benar.',
    notes: ['Nama, alamat, item, dan total bersifat tampilan baca pada halaman ini; tidak ada form edit untuk kolom tersebut.', 'Jangan menyebarkan screenshot detail order nyata kepada pihak yang tidak berkepentingan. Tutupi nomor telepon, email, dan alamat jika diperlukan.', 'Tautan Invoice Xendit hanya muncul apabila order memang memiliki URL invoice. Order contoh SOP tidak memiliki invoice.'],
    image: { file: '06-detail-order.jpg', alt: 'Detail order contoh dengan pilihan status rincian item dan data pelanggan fiktif', caption: 'DATA CONTOH SOP. Nama, kontak, alamat, dan item pada gambar ini bukan data pelanggan nyata.' },
  },
  {
    id: 'status-order', group: 'order', title: 'Ubah status order dengan aman', route: '/admin/orders/{id}',
    intro: 'Alur operasional yang umum adalah pending, lalu paid setelah pembayaran benar-benar terkonfirmasi, lalu fulfilled setelah pesanan selesai dipenuhi. Perubahan manual bukan transaksi pembayaran.',
    steps: ['Buka detail order dan cocokkan kode order dengan bukti atau catatan kerja.', 'Periksa kondisi sebenarnya terlebih dahulu. Jangan mengubah pending ke paid hanya karena pelanggan mengatakan sudah membayar.', 'Untuk pesanan paid yang sudah benar-benar selesai dipenuhi sesuai prosedur tim, pilih fulfilled.', 'Klik Simpan status. Tunggu tulisan Tersimpan.', 'Muat ulang halaman detail dan cek statusnya. Kembali ke daftar dan gunakan filter status terkait untuk memeriksa lagi.', 'Untuk koreksi paid, expired, cancelled, atau failed, pastikan ada konfirmasi dari penanggung jawab sebelum menyimpan.'],
    fields: [
      { name: 'pending', description: 'Menunggu pembayaran/konfirmasi. Jangan diperlakukan sebagai pembayaran berhasil.', example: 'Order baru belum terbayar' },
      { name: 'paid', description: 'Pembayaran terkonfirmasi. Normalnya diperbarui melalui callback Xendit yang valid.', example: 'Verifikasi invoice sebelum proses' },
      { name: 'fulfilled', description: 'Pesanan sudah selesai dipenuhi sesuai prosedur tim.', example: 'Selesai diproses/diserahkan' },
      { name: 'expired', description: 'Batas pembayaran invoice telah berakhir.', example: 'Invoice kedaluwarsa' },
      { name: 'cancelled', description: 'Pesanan dibatalkan berdasarkan keputusan operasional.', example: 'Pembatalan disetujui' },
      { name: 'failed', description: 'Pesanan/proses gagal; perlu diperiksa penyebabnya.', example: 'Jangan dianggap paid' },
    ],
    notes: ['Simpan status hanya mengubah label status di database. Tidak memproses pembayaran, refund, mengirim notifikasi, memotong stok, atau mengembalikan stok.', 'Jangan menandai paid manual untuk simulasi pembayaran. Callback pembayaran hanya diproses dari pending; perubahan manual dapat mengganggu pencatatan pembayaran dan stok.', 'Mengubah paid kembali ke pending bukan cara melakukan refund. Hubungi penanggung jawab pembayaran untuk alur pembatalan/refund dan rekonsiliasi stok.'],
  },
  {
    id: 'promo', group: 'pengaturan', title: 'Ubah bar promo di atas navbar', route: '/admin/settings', href: '/admin/settings',
    intro: 'Bar promo adalah pengumuman di bagian atas website. Teks promo dan diskon produk diatur terpisah.',
    steps: ['Klik Pengaturan, lalu cari Bar promo (di atas navbar).', 'Pada Tampilkan bar pilih Ya - tampil untuk menampilkan, atau Tidak - sembunyikan untuk mematikan.', 'Isi Teks promo, misalnya Graduation Sale.', 'Isi Teks tombol, misalnya Shop Now. Teks ini adalah label tombol, bukan pengaturan diskon.', 'Isi Link tujuan. Gunakan /shop untuk katalog, atau /shop?filter=sale untuk daftar produk diskon. Untuk alamat luar, gunakan URL HTTPS lengkap.', 'Periksa preview di bawah tombol simpan.', 'Klik Simpan pada bagian promo dan tunggu pesan Tersimpan.', 'Buka Lihat situs, cek teks di bagian atas, lalu cek tombol promo menuju halaman yang benar.'],
    result: 'Bar promo tampil/sembunyi sesuai pilihan, teks benar, dan tombol mengarah ke tujuan yang sesuai.',
    notes: ['Klik Simpan media tidak menyimpan promo. Gunakan tombol Simpan di bagian promo.', 'Mengubah teks atau tujuan promo tidak memberi diskon otomatis pada produk.', 'Preview di CMS tidak berarti perubahan sudah tersimpan. Halaman dinamis mengikuti perubahan sekitar 60 detik; halaman statik mengikuti setelah deploy yang disetujui.'],
    image: { file: '07-promo.jpg', alt: 'Pengaturan bar promo dengan pilihan tampil teks link tujuan dan preview', caption: 'Atur isi promo, cek preview, lalu klik Simpan pada bagian ini.' },
  },
  {
    id: 'carousel', group: 'pengaturan', title: 'Upload foto carousel beranda', route: '/admin/settings', href: '/admin/settings',
    intro: 'Carousel beranda adalah foto yang bergantian pada bagian hero. Sekarang admin dapat upload langsung dari komputer, tanpa menulis link gambar.',
    steps: ['Klik Pengaturan, lalu scroll ke Carousel beranda & video About.', 'Klik + Upload foto carousel dan pilih foto, atau seret foto ke area upload.', 'Gunakan JPG, PNG, atau WebP dengan ukuran maksimal 12 MB per foto. Jumlah total carousel harus 1 sampai 10 foto.', 'Tunggu Mengupload selesai dan preview foto baru muncul. Foto dioptimalkan menjadi JPEG hingga 2400 px.', 'Periksa isi foto. Jika tidak sesuai, gunakan tombol silang di bawah foto untuk mengeluarkannya dari daftar.', 'Atur urutan menggunakan panah kiri atau kanan di bawah setiap preview. Foto pertama menjadi slide awal.', 'Klik Simpan media. Tunggu Media tersimpan sebelum meninggalkan halaman.', 'Muat ulang Pengaturan untuk memastikan daftar tersimpan. Buka beranda dan periksa foto serta perpindahan slide.'],
    result: 'Foto carousel tersimpan, tampil pada beranda, dan urutannya sesuai daftar di CMS.',
    notes: ['Upload hanya menyiapkan file dan preview. Tanpa Simpan media, daftar carousel baru belum diterapkan ke website.', 'Untuk mengganti foto saat daftar sudah berisi 10, keluarkan salah satu foto dari daftar, kemudian upload pengganti dan simpan.', 'Foto terakhir tidak dapat dihapus. Upload foto pengganti lebih dahulu jika masih ada slot kosong, lalu keluarkan foto lama.', 'Tombol silang carousel mengeluarkan foto dari daftar, bukan menghapus file fisik. Perubahan daftar baru berlaku setelah Simpan media.', 'Foto hero sebaiknya cukup lebar, tajam, dan tidak memiliki tulisan penting di tepi karena tampilan desktop dan ponsel dapat memotong tepi foto.'],
    image: { file: '08-media.jpg', alt: 'Pengaturan upload foto carousel dengan preview urutan serta upload video About', caption: 'Foto dapat diurutkan lewat panah. Carousel dan video memakai satu tombol Simpan media.' },
  },
  {
    id: 'video-about', group: 'pengaturan', title: 'Upload atau ganti video About', route: '/admin/settings', href: '/admin/settings',
    intro: 'Video About bersifat opsional. Gunakan file video langsung, bukan link YouTube, Google Drive, atau file foto.',
    steps: ['Buka Pengaturan, lalu cari Video About (opsional).', 'Klik + Upload video jika belum ada video. Jika sudah ada, klik + Ganti video.', 'Pilih satu file MP4 atau WebM dengan ukuran maksimal 100 MB.', 'Tunggu upload selesai. Pada koneksi lambat, upload video dapat memerlukan waktu lebih lama daripada foto; jangan tutup tab saat upload berjalan.', 'Cek preview player. Putar video, periksa suara jika ada, dan coba geser posisi pemutaran.', 'Klik Simpan media dan tunggu pesan Media tersimpan.', 'Buka /about pada tampilan pelanggan. Cek kembali video, terutama pada ponsel.', 'Jika ingin menyembunyikan video, klik Hapus video lalu Simpan media.'],
    result: 'Video yang dipilih tampil pada About. Jika dihapus dari pengaturan dan disimpan, video tidak ditampilkan.',
    notes: ['Simpan media menyimpan carousel dan video sekaligus. Periksa keduanya sebelum menyimpan.', 'Video lama di website tidak diganti hanya dengan memilih file; simpan setelah upload selesai.', 'File MP4 yang valid belum tentu menggunakan codec yang didukung semua browser. Jika tidak dapat diputar, gunakan MP4 dengan video H.264 dan audio AAC, atau minta pengelola mengonversi file.', 'Hapus video mengosongkan pilihan video, bukan menghapus file fisik di penyimpanan.'],
  },
  {
    id: 'cek-hasil', group: 'bantuan', title: 'Cek hasil setelah mengedit',
    intro: 'Jangan hanya melihat pesan simpan. Pastikan informasi tersimpan dan tampilan pelanggan benar.',
    steps: ['Tunggu pesan berhasil pada bagian yang diedit: Tersimpan untuk produk/promo, Tersimpan untuk status order, atau Media tersimpan untuk carousel/video.', 'Muat ulang halaman CMS dan pastikan nilainya tetap sesuai. Jangan reload sebelum menyimpan form yang masih diperlukan.', 'Buka Lihat situs pada tab lain. Untuk produk, gunakan Lihat di situs dari editornya.', 'Untuk produk, cek nama, kategori, foto utama, galeri, harga, diskon, stok, dan deskripsi. Untuk promo, cek tampil/sembunyi dan tujuan tombol.', 'Untuk carousel, cek foto pertama dan slide berikutnya. Untuk video, cek halaman About, pemutaran, suara, dan seek.', 'Jika belum berubah, tunggu sekitar 60 detik lalu reload halaman pelanggan. Jika masih tidak sesuai, ikuti bantuan di bawah.', 'Periksa juga pada ponsel untuk memastikan foto, teks, dan video tidak terpotong secara tidak wajar.'],
    notes: ['Data lokal dan live berbeda. Memperbarui CMS lokal tidak memperbarui data CMS live.', 'Jika sedang review lokal, jangan menekan Deploy ulang. Menyimpan konten CMS bukan commit atau push kode.'],
  },
  {
    id: 'deploy', group: 'bantuan', title: 'Kapan memakai Deploy ulang', route: '/admin', href: '/admin',
    intro: 'Deploy ulang memicu proses build/deploy melalui GitHub Actions. Tombol ini untuk penanggung jawab website, bukan langkah wajib setiap kali mengedit konten.',
    steps: ['Untuk perubahan produk, foto, carousel, video About, atau status order: simpan dari masing-masing halaman; tidak perlu Deploy ulang.', 'Untuk promo pada halaman dinamis, tunggu cache sekitar 60 detik. Pada halaman statik seperti FAQ, Kontak, dan Terms, pembaruan promo memerlukan build/deploy.', 'Jika update kode atau halaman statik memang telah disetujui untuk live, koordinasikan dengan penanggung jawab sebelum menekan tombol.', 'Penanggung jawab dapat membuka Produk, klik Deploy ulang, lalu membaca konfirmasi build + deploy lewat GitHub Actions.', 'Setelah pemicu berhasil, cek tab Actions pada repository yang dikonfigurasi. Pesan Deploy dijalankan hanya berarti proses sudah diminta, bukan bukti deploy selesai.', 'Periksa hasil workflow dan halaman live. Jika gagal, periksa log dengan pengelola teknis.'],
    notes: ['Jangan menekan Deploy ulang pada saat review lokal atau sebelum izin publikasi diberikan.', 'Jika muncul Deploy otomatis belum dikonfigurasi, hubungi pengelola teknis. Admin konten tidak perlu mengubah token atau konfigurasi server.', 'Durasi deploy bergantung pada workflow. Jangan menganggap live sudah diperbarui hanya karena tombol selesai merespons.'],
  },
  {
    id: 'masalah-umum', group: 'bantuan', title: 'Solusi masalah yang sering muncul',
    intro: 'Mulai dari pemeriksaan sederhana. Jika tetap gagal, kirim kode produk/order dan pesan error kepada pengelola tanpa menyertakan password atau data pelanggan lengkap.',
    steps: ['Catat halaman yang sedang dibuka, tindakan terakhir, dan pesan error yang muncul.', 'Cocokkan masalah dengan tabel di bawah.', 'Setelah mencoba solusi, cek ulang CMS dan tampilan pelanggan. Jika masih gagal, hentikan percobaan berulang dan hubungi pengelola.'],
    fields: [
      { name: 'Username / password salah', description: 'Periksa ejaan, huruf besar/kecil, Caps Lock, dan spasi. Jika gagal lagi, hubungi pengelola akun.', example: 'Jangan kirim screenshot password' },
      { name: 'Kembali ke login / unauthorized', description: 'Sesi tidak berlaku. Login kembali, lalu ulangi tindakan yang belum tersimpan.', example: 'Simpan ulang setelah login' },
      { name: 'Produk tidak tampil', description: 'Periksa published, halaman kategori/filter yang sedang aktif, slug, dan cache. Draft memang disembunyikan.', example: 'Buka Shop tanpa filter' },
      { name: 'Produk sold out', description: 'Periksa Stok. Angka 0 berarti habis; kosong berarti tidak dilacak.', example: 'Isi stok nyata lalu simpan' },
      { name: 'Diskon tidak tampil', description: 'Periksa harga positif dan diskon 1-99; 0 menonaktifkan diskon. Simpan lalu cek Sale.', example: '/shop?filter=sale' },
      { name: 'Upload ditolak', description: 'Periksa format dan ukuran file. Foto maksimal 12 MB, video maksimal 100 MB. Jangan sekadar mengganti ekstensi file.', example: 'Ekspor ulang JPG/MP4 yang valid' },
      { name: 'Carousel sudah 10 foto', description: 'Keluarkan satu foto dari daftar sebelum upload pengganti. Simpan media setelah selesai.', example: 'Batas total 10 foto' },
      { name: 'Preview baru ada tetapi situs belum berubah', description: 'Carousel/video perlu Simpan media. Teks produk perlu Simpan perubahan. Tunggu cache dan reload.', example: 'Pastikan ada pesan berhasil' },
      { name: 'Foto berupa ikon rusak', description: 'Reload untuk cek apakah file tetap rusak. Catat produk atau carousel terkait dan laporkan ke pengelola; file/path atau izin hosting perlu diperiksa.', example: 'Jangan langsung hapus semua foto' },
      { name: 'Video tidak dapat diputar', description: 'Coba browser lain. Pastikan file dapat diputar dari komputer dan gunakan codec umum. Jika hanya live yang gagal, minta pengelola mengecek batas upload dan penyajian file.', example: 'MP4 H.264 + AAC' },
      { name: 'permission denied for relation site_settings', description: 'Ini masalah izin database, bukan salah teks promo. Pengelola teknis perlu memperbaiki izin tabel.', example: 'Laporkan pesan error apa adanya' },
      { name: 'Order tidak ada dalam daftar', description: 'Pilih Semua atau filter yang sesuai. Daftar terbatas pada 200 order terbaru per filter.', example: 'Gunakan kode order untuk pelacakan' },
      { name: 'Gagal menyimpan status', description: 'Cek koneksi dan sesi, reload untuk melihat status terakhir, lalu koordinasikan sebelum mencoba lagi.', example: 'Jangan mengulang perubahan paid tanpa verifikasi' },
      { name: 'Deploy gagal atau belum dikonfigurasi', description: 'Jangan mengubah pengaturan secara acak. Minta pengelola mengecek workflow/log hosting.', example: 'Data konten dan proses deploy berbeda' },
    ],
  },
  {
    id: 'rutinitas', group: 'bantuan', title: 'Urutan kerja harian yang disarankan',
    intro: 'Gunakan urutan ini sebagai ringkasan setelah memahami SOP detail di atas.',
    steps: ['Login dan pastikan sedang membuka situs yang benar: lokal untuk latihan, live untuk operasional.', 'Buka Order: cek pending yang perlu ditindaklanjuti dan paid yang siap diproses. Cocokkan invoice dan data pengiriman.', 'Setelah pesanan benar-benar selesai, perbarui ke fulfilled dan cek hasil simpan.', 'Buka Produk: perbarui stok nyata, harga, atau diskon jika ada perubahan yang telah disetujui.', 'Jika ada kampanye, buka Pengaturan: siapkan promo, foto carousel, dan video yang sesuai. Simpan promo dan media dengan tombol masing-masing.', 'Cek website pelanggan di desktop dan ponsel. Pastikan tujuan promo, harga, stok, foto, dan video benar.', 'Catat perubahan penting untuk tim, lalu Keluar jika menggunakan komputer bersama.'],
    notes: ['Jangan gunakan order contoh SOP sebagai pesanan operasional.', 'Panduan ini mengikuti versi CMS lokal per 8 Oktober 2026. Tampilan live mengikuti versi kode yang sudah dipublikasikan; fitur lokal belum otomatis tersedia di live.'],
  },
];
