# Catatan Versi Racik Soal

Nomor versi **X.Y.Z**: X = perubahan besar, Y = fitur baru, Z = perbaikan kecil.
Versi **0.x** = masih tahap uji coba; **1.0.0** = dipakai resmi guru-guru Al Fatah.

Rencana:
- **0.8.0** — fitur utama lengkap, belum siap diuji guru.
- **0.9.0** — siap uji coba guru, setelah daftar persiapan di bawah beres.
- **0.9.x** — perbaikan dari masukan guru selama uji coba.
- **1.0.0** — dipakai resmi.

## Persiapan menuju 0.9.0 (siap uji coba guru)
- [x] Cek semua fitur baru langsung di hosting.
- [x] Buktikan pemisahan data antar guru lewat login dua akun guru (guru B tidak bisa membuka soal guru A).
- [x] Coba satu set untuk tiap jenis (Ulangan Harian, AFTS, ASAS, Latihan, Latihan TKA) di hosting + unduh Word-nya.
- [x] Buat akun guru uji coba di Kelola guru.
- [x] Hitung kesiapan saldo AI untuk 15–20 guru.
- [x] Panduan singkat untuk guru (halaman **Panduan** di sidebar, sejak 0.12.0).

Keterbatasan yang sudah diketahui (tidak menghalangi uji coba): dari file PDF hanya teks Latin dan ayat yang
dikenali mushaf yang dipakai (teks Arab PDF lain, termasuk hadis, dibuang; buku PDF Kemenag teks Arabnya rusak semua);
hadis karangan dalam mode Bahasa Arab belum bisa dideteksi otomatis (hanya dicegah lewat instruksi ke AI).

---

## 0.11.1 — 4 November 2026
- Sidebar menandai **halaman yang sedang dibuka**: riwayat set yang sedang dilihat (latar sorot + judul tebal), juga
  menu admin Semua set, Kelola guru, dan Pengaturan. Jadi selalu terlihat sedang berada di mana.
- Tombol **Set baru** kini berlatar polos dengan tanda **+** di lingkaran hijau, supaya tidak tampak seperti "sedang dibuka".

## 0.11.0 — 4 November 2026
Hasil audit 4 November (lihat `AUDIT-2026-11-04.md`).
- **Ganti nama dan hapus set** lewat riwayat di sidebar, seperti claude.ai: tombol **⋯** di tiap riwayat (di laptop
  muncul saat kursor diarahkan, di HP selalu terlihat) atau **klik kanan**. Ganti nama langsung di barisnya (Enter =
  simpan, Esc = batal). Set yang dihapus hilang dari riwayat dan tidak bisa dibuka lagi, tetapi **jatah hari ini tidak
  kembali**; admin masih melihatnya di Semua set dengan label "dihapus guru". Tombol ⋯ berbentuk tombol (garis dan
  latar) dan hilang lagi setelah menunya ditutup.
- **Tambah dan hapus soal** di dalam set (tombol **Lainnya** di kartu soal): "Tambah soal serupa di bawahnya" (dibuat AI,
  bentuk/level/TP sama, ikut batas 30x per set) dan "Hapus soal ini". Nomor soal dan kisi-kisi ikut menyesuaikan.
- Tampilan HP lebih ringkas: **kop ujian** (semester, tahun, tanggal, waktu) dilipat jadi satu baris ringkasan;
  **nomor soal** di halaman hasil jadi satu baris yang bisa digeser; tanggal ujian ditulis gaya Indonesia
  ("Senin, 7 Desember 2026").
- Peringatan "Teks Arab tidak cocok" menampilkan potongan Arab satu per baris, kanan ke kiri.
- Form Edit soal: tombol **Simpan/Batal** juga ada di atas.
- Riwayat di sidebar menampilkan **tanggal dan jumlah soal**, supaya set yang judulnya sama bisa dibedakan.
- Perbaikan di balik layar:
  - Editan guru tidak lagi hilang bila bersamaan dengan "Ganti/Ubah soal" yang sedang menunggu AI.
  - Jatah 10 set/hari tidak bisa terlewati dengan klik ganda; maksimal 2 set dibuat bersamaan per guru.
  - Pembuatan soal punya batas waktu total 10 menit; lewat dari itu set ditandai gagal (jatah kembali), guru tidak
    menunggu tanpa akhir.

## 0.10.2 — 24 Oktober 2026
- **Skor per soal otomatis.** Guru cukup mengatur jumlah soal per jenis; aplikasi menghitung skor tiap soal (bilangan
  bulat) mengikuti perbandingan bawaan AFTS supaya total **100**, dan memperbaruinya setiap jumlah berubah. Skor yang
  dipakai tampil kecil di tiap baris ("2 poin/soal"). Jenis yang jumlahnya 0 tampil pudar.
- Tombol **Atur skor** membuka stepper skor per soal bila guru mau mengatur sendiri; tombol **Pas-kan 100** menyesuaikan
  skor buatan guru ke 100 tanpa mengubah perbandingannya; kembali dengan **Skor otomatis**.
- Keterbatasan: karena skor harus bulat, ada jumlah yang tidak bisa pas 100 (mis. 30 PG saja = 3,33 per soal; dipakai
  terdekat, 90, dan ada pesan penjelasan). Solusi: ubah jumlah soal atau campur dengan jenis lain.
- Panel jumlah soal dirapikan: satu baris per jenis dengan garis tipis, satu kalimat ringkasan di bawah.

## 0.10.1 — 24 Oktober 2026
- Kotak angka (jumlah soal, skor per soal, persen level, waktu ujian, skor di formulir Edit) kini memakai tombol
  **−** dan **+** yang besar (44 px di HP) menggantikan panah kecil bawaan browser. Ditahan = naik/turun terus,
  angkanya tetap bisa diketik langsung, tombol mati di batas (0 dan maksimal). Di HP, kotak jumlah dan skor tiap
  bentuk soal ditaruh di bawah namanya supaya muat.

## 0.10.0 — 24 Oktober 2026
Dua bentuk soal baru, cocok untuk kosakata Bahasa Arab/Inggris, istilah, dan tokoh–peristiwa:
- **Isian singkat**: kalimat dengan bagian kosong ("...."), jawaban singkat, plus daftar jawaban lain yang diterima
  (pegangan guru di lembar kunci). Skor bawaan 3 per soal.
- **Menjodohkan**: 5 premis di lajur kiri dan 6 jawaban di lajur kanan (satu pengecoh). AI hanya menulis pasangan
  yang benar; **aplikasi yang mengacak lajur kanan dan menyusun kuncinya**, jadi kunci selalu cocok. Skor dihitung
  **per pasangan** (bobot bawaan 5 = 1 poin tiap pasangan benar).
- Muncul di form (kotak jumlah dan skor), kartu soal web (tampilan dua lajur dan formulir Edit), serta Word: tabel
  Menjodohkan di lembar siswa (premis Arab ditulis kanan-ke-kiri) dan kunci pasangan di lembar kunci.
- "Ubah soal" dan "Ganti soal" juga berlaku untuk kedua bentuk. Latihan TKA tidak memakai bentuk ini.
- Catatan: satu soal Menjodohkan dihitung seberat 2 soal biasa saat soal dibuat bertahap (lebih sedikit per tahap).
  Pemeriksaan otomatis menandai merah bila premis/jawaban kurang, kembar, atau kunci tidak sah.

## 0.9.6 — 23 Oktober 2026
- Lembar soal Word: aturan "soal jangan terpotong" dilonggarkan supaya kolom terisi lebih penuh dan guru tidak perlu
  merapikan banyak. Teks soal + pilihan A dan B tetap satu rombongan, pilihan D dan E tetap berdua, sedangkan
  pilihan C dan sisanya boleh pindah kolom atau halaman. Wacana soal grup boleh terpotong; tiga baris terakhirnya
  tetap ikut soal pertama.
- Karena Word tidak membedakan pindah kolom dan pindah halaman, sesekali soal bisa terbelah di dasar halaman;
  geser sendiri di Word bila perlu. Berlaku juga untuk set lama (perubahan ada di pembuatan file Word).

## 0.9.5 — 23 Oktober 2026
- Perbaikan: pada baris Arab di Word dan di layar, **angka dan kata Latin** (misalnya "(1)" atau "Teks 1:") tidak lagi
  ikut berukuran besar seperti huruf Arab. Huruf Arab tetap Traditional Arabic 16 pt, angka dan kata Latin kembali
  ke ukuran teks biasa; arah tulisan dan rata kanan tidak berubah.
- Perbaikan: judul bagian di lembar Word ("II. PILIHAN GANDA KOMPLEKS…", "III. … KATEGORI") dan petunjuknya tidak
  lagi tertinggal sendirian di dasar kolom; selalu ikut ke kolom soal pertamanya.

## 0.9.4 — 23 Oktober 2026
- Tampilan kartu soal lebih lega: tombol **Ganti soal** dan kotak **Ubah soal** dipindah ke tombol **Lainnya**.
  Kunci & pembahasan dan Edit tetap terlihat.
- Saat soal sedang dibuat dan draf sudah muncul, kotak tunggu besar diganti satu baris status ringkas
  ("Masih meracik: 10 dari 25 soal sudah jadi").

## 0.9.3 — 23 Oktober 2026
- Perbaikan: unduh Word gagal ("HTTP ERROR 500") untuk bab yang judulnya berhuruf Arab (mis. set Bahasa Arab "…أدوات الاستفهام").
  Penyebabnya nama file diambil dari judul bab, dan huruf Arab tidak boleh langsung masuk header unduhan.
  Kini unduhan berhasil; nama file di komputer memakai judul aslinya (termasuk huruf Arab).

## 0.9.2 — 23 Oktober 2026
- Perbaikan: baris yang hampir seluruhnya Arab (mis. ucapan dalam hiwar) kini tampil **dari kanan ke kiri dan rata kanan**,
  di layar maupun di file Word. Titik dua, nomor rumpang "(1)", dan angka tidak lagi lompat ke tempat yang salah.
- Jarak kosong berlebih antar baris dialog dirapatkan; AI diminta tidak menyisipkan baris kosong di antara ucapan.
- Soal lama ikut membaik tanpa perlu dibuat ulang.

## 0.9.1 — 22 Oktober 2026
- Perbaikan: percakapan (hiwar/dialog), daftar, dan puisi kini tampil **satu bagian per baris**, di layar maupun di
  file Word (sebelumnya menyambung jadi satu paragraf panjang).
- AI diminta menulis dialog satu penutur per baris ("Nama: ucapan"). Soal lama tidak berubah; untuk memperbaikinya
  pakai "Ubah soal" (mis. "tulis hiwar per baris, satu penutur per baris") atau Edit.

## 0.9.0 — 22 Oktober 2026
**Siap uji coba guru.** Tidak ada perubahan fitur dari 0.8.3; semua persiapan sudah beres:
- Semua fitur baru sudah dicek langsung di hosting, termasuk satu set untuk tiap jenis soal dan unduhan Word-nya.
- Pemisahan data antar guru terbukti: guru tidak bisa membuka, mengubah, atau mengunduh soal dan materi guru lain
  (set orang lain dijawab "tidak ditemukan", sama seperti set yang memang tidak ada).
- Perkiraan saldo AI untuk 15–20 guru sudah dihitung (satu set 25 soal ± Rp300; Rp300–500 ribu cukup untuk sebulan uji coba).
- Rencana berikutnya (0.9.x): perbaikan dari masukan guru. Calon fitur setelah itu: rumus matematika/kimia,
  bentuk Menjodohkan dan Isian, komposisi kesulitan per butir.

## 0.8.3 — 22 Oktober 2026
- Soal kini **tampil bertahap** saat dibuat: kisi-kisi muncul lebih dulu, lalu soal muncul per tahap (±10 soal)
  sebagai **draf** yang bisa dibaca sambil menunggu.
- Draf belum menampilkan kunci dan belum bisa diedit; kunci, urutan pilihan, dan skor ditetapkan setelah semua selesai.
  Setelah selesai, halaman berubah ke tampilan hasil biasa (edit, ganti, ubah soal, unduh Word).

## 0.8.2 — 22 Oktober 2026
- Perbaikan: kalau server mati atau dinyalakan ulang saat soal sedang dibuat, set itu dulu tertahan "sedang meracik"
  selamanya. Kini begitu server menyala lagi, set seperti itu otomatis ditandai **gagal**: guru melihat pesan
  "silakan coba lagi", jatah harian tidak berkurang, dan admin mendapat pita peringatan.

## 0.8.1 — 22 Oktober 2026
- Kotak Materi di halaman utama kini menerima file **PDF** (selain Word dan PowerPoint). File dibaca di perangkat guru.
- Teks Latin dari PDF masuk ke Isi materi. Teks Arab dari PDF tidak dipakai langsung: aplikasi mencari ayat yang sama
  di data mushaf; kalau ketemu, yang dipakai teks mushaf (kotak hijau), kalau tidak, dibuang dan guru diberi tahu.
- PDF hasil scan (gambar) atau yang dikunci kata sandi ditolak dengan pesan yang jelas.

## 0.8.0 — 20 Oktober 2026
Versi pertama yang diberi nomor. Isi aplikasi sampai saat ini:

**Membuat soal**
- Pilih mapel & kelas, isi identitas ujian (semester, tahun pelajaran, hari/tanggal, waktu), masukkan materi, pilih jenis soal.
- Jenis soal: Ulangan Harian, AFTS, ASAS, Latihan, dan Latihan TKA (soal grup dengan wacana bersama, tanpa uraian).
- Bentuk soal: Pilihan Ganda, PG Kompleks (2–3 jawaban benar), Kategori (4 pernyataan: Benar/Salah, Fakta/Opini, dll.), Uraian.
- Kisi-kisi disusun dulu, baru soal; komposisi level (LOTS/MOTS/HOTS) ditentukan aplikasi.
- Catatan untuk AI bebas seperti chat; AI membalas dengan "Tanggapan AI" di atas hasil.
- Aturan penulisan soal baku untuk semua mapel MA (lihat ATURAN-SOAL.md), termasuk gaya TKA.

**Materi**
- Tempel teks atau lampirkan Word/PowerPoint di halaman utama; AI menganalisa (judul, usulan TP, pokok materi).
- Ayat Al-Qur'an diambil dari data mushaf (Tanzil); hadis wajib diperiksa & dicentang guru; AI tidak boleh mengarang dalil.
- Mode Bahasa Arab: kalimat Arab boleh, yang mirip ayat tetap dijaga.
- Materi tersimpan otomatis, bisa dipakai lagi dan digabung (maks 5) untuk AFTS/ASAS.

**Hasil & Word**
- Edit, ganti, dan "ubah soal" per nomor; penjaga ayat menandai teks Arab yang tidak cocok.
- Unduh Word: lembar soal (kop madrasah, identitas ujian), kunci & pembahasan, kisi-kisi.
- Identitas ujian bisa diubah setelah soal jadi tanpa membuat ulang.

**Akun & keamanan**
- Login guru, akun dibuat admin, data tiap guru terpisah; batas 10 set per guru per hari.
- Admin: kelola guru, semua set, pengaturan nama madrasah, peringatan model AI & backup.
- Backup database otomatis tiap malam ke luar hosting.

**Tampilan**
- Gaya claude.ai (krem & hijau), mode gelap, sidebar laci di HP, halaman Buat Soal lebar.
