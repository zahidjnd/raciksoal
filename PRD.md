# PRD: Racik Soal (Web Pembuatan Soal AI, Kurikulum Kemenag)

> Diperbarui 2026-11-09 (versi 0.27.0). Versi awal (14 Oktober 2026, MVP Qurdis kelas 11) ada di riwayat Git.

## 1. Tujuan
Membantu guru MA Al-Fatah membuat soal yang sesuai standar Kemenag dengan cepat: kisi-kisi, soal, kunci jawaban,
pembahasan, dan rubrik, tanpa guru menulis instruksi AI yang panjang. Standar penulisan soal sudah tertanam di sistem
(`ATURAN-SOAL.md`), sehingga hasilnya konsisten. Web ini untuk internal Al-Fatah.

## 2. Pengguna dan tahapan
1. **Tahap 1 (selesai, Oktober 2026):** pemilik sendiri, mapel Qurdis kelas 11.
2. **Tahap 2 (selesai, versi 0.x):** uji coba 15–20 guru Al-Fatah, semua mapel madrasah.
3. **Versi 1.0.0 (sekarang, sejak 24 November 2026):** dipakai resmi. Berikutnya: aplikasi kedua **Koreksi LJK**.

## 3. Ruang lingkup
**Mapel:** 20 mapel MA Al-Fatah (daftar di `src/lib/mapel.ts`), kelas X–XII. Mapel lain tetap bisa diketik guru.
Ijtimaiyyah, PJOK, dan BK sengaja tidak dimasukkan.

### Termasuk
- Materi milik guru: tempel teks, Word, PowerPoint, PDF; dianalisa AI menjadi judul, TP, pokok materi; disimpan & dipakai ulang.
- Jenis: Ulangan Harian, AFTS, ASAS (format resmi Al-Fatah), Latihan, Latihan TKA.
- Bentuk: Pilihan Ganda, PG Kompleks, Benar/Salah (atau Kategori untuk TKA), Menjodohkan, Isian, Uraian.
- Kisi-kisi otomatis, level kognitif (LOTS/MOTS/HOTS) dengan komposisi tepat, skor otomatis.
- Pemeriksaan oleh aplikasi + perbaikan otomatis (ayat, kunci, isian bocor, soal kembar, tahun sejarah, dll.).
- Edit, Ganti, Ubah dengan instruksi, Tambah soal serupa, Tulis soal sendiri, urutkan, hapus soal.
- Unduh Word (lembar soal berkop, kunci & pembahasan, kisi-kisi), Paket A–D, kunci ringkas, cetak.
- Login guru, riwayat & pencarian set, batas pemakaian, halaman admin, backup malam.

### Sengaja ditunda
- Bank soal (menyalin/menggabung soal antar set).
- Rumus matematika & tabel di dalam soal.
- Database buku dan pencarian otomatis (RAG).

## 4. Alur guru
1. Pilih mapel & kelas, masukkan materi (atau pakai materi sebelumnya), periksa hasil analisa (TP, ayat/hadis).
2. Pilih jenis ujian (kartu), jumlah soal per bentuk, dan bila perlu catatan untuk AI.
3. Tekan **Buat soal**, tunggu (±1 menit untuk 25 soal; soal tampil bertahap).
4. Periksa hasil: tanda merah, edit, ganti, ubah, tambah, urutkan.
5. Unduh Word (pilih paket & file).

## 5. Sumber materi
- AI membuat soal **hanya dari materi guru**; pengetahuan umum hanya untuk cerita/stimulus.
- **Ayat** diambil otomatis dari data mushaf (Tanzil). **Hadis** dari 9 kitab diambil otomatis dari data hadis (0.36.0);
  hadis lain = teks guru + sumber + centang. Teks Arab yang bukan ayat/hadis
  ditandai satu klik "Bukan ayat/hadis"; istilah Arab ≤ 3 kata diterima apa adanya.
- TP: yang tertulis di materi dipakai apa adanya; usulan AI wajib dicentang guru.

## 6. Aturan kualitas soal
Lengkapnya di `ATURAN-SOAL.md` (dasar tiap aturan di `RUJUKAN.md`). Yang diperiksa aplikasi (bukan sekadar diminta ke AI):
teks Arab, kunci PG sesuai hasil hitung, pilihan terlarang, kunci terpanjang, PGK 2–4 kunci, HOTS wajib stimulus, isian bocor,
menjodohkan, pembahasan yang menunjuk urutan pilihan, tahun di mapel sejarah.

## 7. Format hasil dari AI
JSON terstruktur per butir: bentuk, pertanyaan, pilihan/pernyataan/pasangan, kunci, pembahasan, level, TP, (rubrik), dalil_id.
Skor, urutan kunci, dan komposisi level diisi aplikasi.

## 8. Data yang disimpan
- Akun guru & sesi (Better Auth), materi per guru (salinan ikut tersimpan di set).
- Set soal: pengaturan, kisi-kisi, soal, prompt & jawaban mentah AI, model, waktu & token.
- Pemakaian AI per guru (batas harian), pengaturan web (nama madrasah).

## 9. Persyaratan non-fungsional
- Mudah dipakai guru yang tidak terbiasa teknologi, nyaman di HP maupun laptop, mode terang & gelap.
- Teks Arab terbaca jelas (Amiri di web, Traditional Arabic di Word), arah kanan ke kiri.
- Model AI dapat diganti lewat pengaturan, dengan cadangan otomatis bila model utama gagal.
- Biaya API terkendali: batas per guru per hari & per web; batas waktu setiap panggilan.
- Data tiap guru terpisah (diuji `npm run uji:pemisahan` sebelum setiap rilis).
- Backup database setiap malam, terenkripsi, disimpan di luar hosting.

## 10. Ukuran keberhasilan
- Soal bisa dipakai dengan perbaikan minimal; tanda merah jarang.
- Ayat dan hadis 100% sesuai teks terverifikasi.
- Satu set soal jauh lebih cepat daripada menulis manual.
- Guru uji coba memakai untuk ASAS Ganjil 2026.

## 11. Risiko
- Kesalahan konten keislaman/fakta pada hasil AI. Mitigasi: teks terverifikasi, pemeriksa aplikasi, review guru wajib.
- Materi guru terlalu pendek → soal berulang/bocor. Mitigasi: peringatan materi sedikit, perbaikan otomatis.
- Batas hosting (RAM 1 GB, 12 proses serentak). Mitigasi: batas set serentak per guru & per web.
- Saldo API habis. Mitigasi: model cadangan, pita peringatan admin.
