# Catatan Versi Racik Soal

Nomor versi **X.Y.Z**: X = perubahan besar, Y = fitur baru, Z = perbaikan kecil.
Versi **0.x** = masih tahap uji coba; **1.0.0** = dipakai resmi guru-guru Al Fatah.

Rencana:
- **0.8.0** — fitur utama lengkap, belum siap diuji guru.
- **0.9.0** — siap uji coba guru, setelah daftar persiapan di bawah beres.
- **0.9.x** — perbaikan dari masukan guru selama uji coba.
- **1.0.0** — dipakai resmi.

## Persiapan menuju 0.9.0 (siap uji coba guru)
- [ ] Cek semua fitur baru langsung di hosting.
- [ ] Buktikan pemisahan data antar guru lewat login dua akun guru (guru B tidak bisa membuka soal guru A).
- [ ] Coba satu set untuk tiap jenis (Ulangan Harian, AFTS, ASAS, Latihan, Latihan TKA) di hosting + unduh Word-nya.
- [ ] Buat akun guru uji coba di Kelola guru.
- [ ] Hitung kesiapan saldo AI untuk 15–20 guru.
- [ ] Panduan singkat untuk guru (opsional).

Keterbatasan yang sudah diketahui (tidak menghalangi uji coba): dari file PDF hanya teks Latin dan ayat yang
dikenali mushaf yang dipakai (teks Arab PDF lain, termasuk hadis, dibuang; buku PDF Kemenag teks Arabnya rusak semua);
hadis karangan dalam mode Bahasa Arab belum bisa dideteksi otomatis (hanya dicegah lewat instruksi ke AI).

---

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
