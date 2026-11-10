# Racik Soal

Aplikasi web pembuat soal berbasis AI untuk guru Madrasah Aliyah Al-Fatah, mengikuti kurikulum Kemenag.
Guru memasukkan materi, memilih jenis ujian dan jumlah soal; aplikasi menyusun **kisi-kisi, soal, kunci,
pembahasan, dan rubrik**, lalu mengekspornya ke **Word** dengan kop madrasah.

| | |
|---|---|
| **Versi** | lihat `package.json` (juga tampil di sidebar aplikasi); riwayat di [CATATAN-VERSI.md](CATATAN-VERSI.md) |
| **Status** | 0.x = tahap uji coba guru. 1.0.0 = dipakai resmi (daftar syaratnya di CATATAN-VERSI.md) |
| **Alamat** | https://raciksoal.alfatahmas.com |
| **Pengguna** | Guru-guru Al-Fatah (±15–20 akun). Penggunaan internal, bukan produk komersial |
| **Admin** | Akun pemilik |
| **Repo** | `zahidjnd/raciksoal` (privat). Backup database: `zahidjnd/raciksoal-backup` (privat) |

> **Rahasia tidak pernah ditulis di repo ini.** Kata sandi, kunci API, dan isi `.env` hanya ada di laptop pemilik
> dan di hosting. Dokumen ini hanya menyebut *nama* pengaturannya.

---

## Daftar isi
1. [Fitur](#1-fitur)
2. [Prinsip yang tidak boleh dilanggar](#2-prinsip-yang-tidak-boleh-dilanggar)
3. [Teknologi yang dipakai](#3-teknologi-yang-dipakai)
4. [Arsitektur dan alur kerja](#4-arsitektur-dan-alur-kerja)
5. [Struktur folder](#5-struktur-folder)
6. [Database](#6-database)
7. [Pengaturan (`.env`)](#7-pengaturan-env)
8. [Menjalankan di laptop](#8-menjalankan-di-laptop)
9. [Pengujian](#9-pengujian)
10. [Rilis dan deploy](#10-rilis-dan-deploy)
11. [Hosting: pengoperasian](#11-hosting-pengoperasian)
12. [Backup dan pemulihan](#12-backup-dan-pemulihan)
13. [Tugas admin](#13-tugas-admin)
14. [Pemecahan masalah](#14-pemecahan-masalah)
15. [Model AI dan biaya](#15-model-ai-dan-biaya)
16. [Mengubah aplikasi dengan aman](#16-mengubah-aplikasi-dengan-aman)
17. [Lisensi dan sumber data](#17-lisensi-dan-sumber-data)
18. [Peta dokumen](#18-peta-dokumen)
19. [Batasan yang diketahui](#19-batasan-yang-diketahui)

---

## 1. Fitur

### Untuk guru
**Materi**
- Pilih **mapel dan kelas** (X, XI, XII), lalu masukkan materi: **tempel teks**, **lampirkan file** `.docx` / `.pptx` /
  `.pdf` (dibaca di browser, tidak diunggah), atau **pakai materi sebelumnya**.
- **Analisa materi** oleh AI: mengusulkan judul, Tujuan Pembelajaran (TP), dan pokok materi. Guru memeriksa dan
  mengedit kartu materinya; materi tersimpan otomatis saat soal dibuat.
- **Ayat Al-Qur'an otomatis dari mushaf**: kotak "Ambil ayat" (mis. `QS An-Nur: 30-31`), dan ayat di file guru
  dicocokkan ke data mushaf lalu diganti teks resminya. Hadis ditempel guru sendiri lalu dicentang sebagai sudah diperiksa.
- **Teks Arab bukan dalil**: tulisan Arab paling banyak 3 kata (istilah, mis. مُعْجِزَةٌ atau ق) diterima apa adanya tanpa
  verifikasi; teks Arab yang lebih panjang tetapi bukan ayat/hadis (mis. mahfuzhat) cukup diklik **"Bukan ayat/hadis"**.
- **TP**: yang tertulis di materi dipakai apa adanya (hijau); TP usulan AI (materi tanpa TP) wajib dibaca & dicentang guru.
- **Mapel**: 20 mapel MA Al-Fatah (`src/lib/mapel.ts`), mapel lain bisa diketik. Bahasa Arab & Nahwu: teks Arab bebas.
- **Gambar materi** (0.30.0): gambar di file Word/PowerPoint ditawarkan untuk dipilih, atau guru mengunggah / menempel
  (Ctrl+V) gambar sendiri, maks. 10 per materi, boleh diberi keterangan. Gambar dikecilkan jadi JPEG di browser, AI
  **melihat** gambarnya (DeepSeek bisa membaca gambar) dan boleh memakainya sebagai stimulus soal. AI tidak membuat gambar.
- Satu set boleh menggabung **hingga 5 materi** (untuk AFTS/ASAS), asal satu mapel dan satu kelas.
- Halaman **Kelola materi** (`/materi`): daftar, ubah, hapus materi (maks. 300 per guru).

**Membuat set soal**
- **Jenis**: Ulangan Harian, AFTS (Asesmen Formatif Tengah Semester), ASAS (Asesmen Sumatif Akhir Semester),
  Latihan, dan Latihan TKA (gaya Tes Kemampuan Akademik).
- **Bentuk soal**: Pilihan Ganda, Pilihan Ganda Kompleks, Benar/Salah, Menjodohkan, Isian Singkat, Uraian. Maks.
  **50 soal** per set. Benar/Salah & Menjodohkan memakai gaya lama Al-Fatah (satu pernyataan/pasangan per nomor); Latihan
  TKA memakai Kategori (3 pernyataan) dan PG kompleks 2–4 kunci seperti contoh resmi.
- **ASAS**: kartu ASAS langsung mengisi format surat Kepala MA (eksak 35 soal / non-eksak 45 soal, skor 100).
- **Komposisi level kognitif** LOTS/MOTS/HOTS (untuk TKA: Pemahaman/Penerapan/Penalaran) dan **tingkat kesulitan**
  (Mudah/Sedang/Sulit).
- **Skor otomatis** per bentuk agar total 100, atau atur sendiri.
- **Catatan untuk AI** (maks. 500 huruf): diikuti sebagai prioritas tertinggi, kecuali 4 hal yang dikunci (lihat bagian 2).
- **Kop ujian**: semester, tahun pelajaran, hari/tanggal, waktu (bisa diubah lagi setelah soal jadi).
- Pembuatan berjalan di latar belakang (±30–90 detik); **kisi-kisi tampil lebih dulu**, lalu soal muncul bertahap.

**Memeriksa dan memperbaiki**
- Peringatan wajib: *"Soal dibuat AI, wajib diperiksa guru sebelum dipakai."*
- Soal yang melanggar aturan **ditandai merah**, mis. teks Arab tidak terverifikasi, kunci PG tidak sama dengan hasil
  hitung, pilihan terlarang, kunci terpanjang mencolok, jawaban isian sudah tertulis di soal lain, HOTS tanpa stimulus,
  tahun di mapel sejarah yang tidak ada di materi. Soal merah **diperbaiki otomatis sekali** sebelum set selesai
  (isian bocor: 3 calon sekaligus, dipakai yang bersih); kalau masih melanggar, soal awal tetap merah untuk guru.
- **Aturan per mapel** (`src/lib/mapel.ts`): Bahasa Inggris = semua isi untuk siswa dan petunjuk Word berbahasa
  Inggris (pembahasan tetap Indonesia); SKI, Al-Quds wal Maqdisiyyah, Sejarah = tahun wajib dari materi.
- Per soal: **Edit** (formulir lengkap), **Ganti** (soal baru dari AI), **Ubah** (minta perubahan, mis. "lebih sulit"),
  **Tambah soal serupa**, **Hapus**, **pindah ↑/↓**, **Tulis soal sendiri** (tanpa AI). Kisi-kisi ikut menyesuaikan.
- **Kunci ringkas** (semua kunci dalam satu kotak + tombol Salin).

**Mengunduh**
- Tiga file Word: **lembar soal siswa** (kop madrasah, tanpa peringatan AI), **kunci & pembahasan + rubrik**
  (pegangan guru, dengan peringatan AI), **kisi-kisi** (A4 mendatar).
- **Paket A–D**: urutan soal (di dalam tiap bagian) dan pilihan jawaban diacak; acakan tetap sama setiap diunduh.
  Lembar kunci tiap paket memuat padanan nomor ke Paket A.
- **Cetak tampilan** (PDF tanpa kop) dari browser.

**Lainnya**
- **Riwayat** set (cari, saring jenis/mapel), ganti nama dan hapus set lewat menu ⋯ di sidebar.
- **Akun**: ganti kata sandi sendiri. **Panduan** (`/panduan`): petunjuk singkat di dalam aplikasi.
- Mode terang/gelap (tersimpan per perangkat). Nyaman di HP maupun laptop.

### Untuk admin
- **Kelola guru** (`/admin/guru`): tambah akun, reset kata sandi (sekaligus membuka kunci salah sandi),
  nonaktifkan/aktifkan, ringkasan pemakaian per guru (set hari ini, ganti/ubah hari ini, set & token 30 hari).
- **Semua set** (`/admin/set`): set semua guru, saringan guru/status/jenis/mapel, termasuk set yang dihapus guru.
- **Pengaturan** (`/admin/pengaturan`): nama madrasah untuk kop Word.
- **Pita merah peringatan** di atas halaman: set gagal / model cadangan dipakai (24 jam terakhir), backup gagal
  atau lebih dari 36 jam.
- Admin dapat memilih model AI dan mode **"Bandingkan semua model"**, serta melihat info teknis (model, waktu, token).
  Guru tidak melihat semua ini.

---

## 2. Prinsip yang tidak boleh dilanggar

Prinsip ini ditegakkan di **server**, bukan hanya di tampilan.

| # | Prinsip | Cara ditegakkan |
|---|---|---|
| 1 | **Kunci API hanya di server** | Disimpan di `.env` (tidak masuk Git, tidak dikirim ke browser). Semua panggilan AI lewat `src/lib/ai.ts` di server |
| 2 | **Ayat dan hadis tidak dikarang AI** | Ayat diambil dari data mushaf Tanzil (`public/quran/`). Hadis dari teks yang ditempel & dicentang guru. AI hanya menunjuk dalil lewat `dalil_id`; **setiap teks Arab dari AI dicek** harus persis ada di data bab, kalau tidak soal ditandai merah. AI tidak pernah dipakai sebagai pemeriksa ayat/hadis |
| 3 | **Data tiap guru terpisah** | Setiap aksi yang membaca/mengubah set atau materi memeriksa pemilik (`bolehAkses`, `src/lib/akses.ts`). Set orang lain dijawab "tidak ditemukan". Dibuktikan oleh `npm run uji:pemisahan` |
| 4 | **Pemakaian AI dibatasi** | Batas harian per guru dan seluruh web, batas waktu per panggilan dan per set (bagian 4.5) |
| 5 | **Hasil AI wajib diperiksa guru** | Peringatan tampil di setiap hasil dan di lembar kunci |
| 6 | **Teks Arab terbaca benar** | Web: huruf Amiri, arah kanan-ke-kiri per baris. Word: Traditional Arabic 16 pt, paragraf RTL |

Empat hal yang **tidak bisa diubah lewat "Catatan untuk AI"**: (1) ayat/hadis dari luar data bab, (2) jumlah,
bentuk, dan kategori level tiap nomor (ditentukan aplikasi), (3) format jawaban JSON, (4) isi terlarang (SARA,
politik praktis, pornografi, propaganda, kekerasan, merek dagang).

---

## 3. Teknologi yang dipakai

| Bagian | Teknologi | Alasan dipilih |
|---|---|---|
| Bahasa | **TypeScript** 5 di atas **Node.js 24** | Satu bahasa untuk tampilan dan server; kesalahan tipe ketahuan sebelum jalan |
| Kerangka web | **Next.js 15.5** (App Router) + **React 19** | Halaman dan server dalam satu aplikasi; *server action* untuk semua aksi (tanpa API terpisah) |
| Tampilan | **Tailwind CSS 4**; huruf **Plus Jakarta Sans**, **Source Serif 4** (judul), **Amiri** (Arab) | Gaya konsisten lewat token warna di `globals.css`; lihat [DESIGN.md](DESIGN.md) |
| Database | **PostgreSQL 16** | Tersedia di hosting (cPanel); data JSON (soal, kisi) disimpan sebagai `jsonb` |
| Akses database | **Drizzle ORM** + driver `pg` | Lebih ringan dari Prisma, penting untuk RAM hosting 1 GB. Perubahan tabel = file SQL di `drizzle/` |
| Login | **Better Auth 1.7.7** (plugin `username`, `admin`) | Nama pengguna + kata sandi, peran admin/guru, nonaktif akun. Versi dikunci |
| AI | Adapter sendiri format **OpenAI Chat Completions** (`src/lib/ai.ts`) | Model bisa diganti lewat `.env` tanpa ubah kode; hingga 9 model, dengan cadangan otomatis. Saat ini **DeepSeek** |
| Word | **docx** 9 + cetakan `public/word/template-soal.docx` | Kop madrasah persis aslinya; isi soal disisipkan |
| Baca file guru | **jszip** (Word/PowerPoint), **pdfjs-dist** 6 (PDF) | Dibaca di browser, file tidak diunggah ke server |
| Data Al-Qur'an | **Tanzil "Simple"** (`public/quran/quran-simple.txt`) | Lisensi jelas untuk aplikasi, ejaan imla'i berharakat (mirip bahan ajar guru) |
| Tes | Penguji bawaan Node (`node --test`) + skrip uji pemisahan | Tanpa library tes tambahan |
| Build | **GitHub Actions** (`output: "standalone"`) | Hosting tidak kuat menjalankan `next build` (RAM 1 GB) |
| Hosting | **DomaiNesia Nimbus Go** (cPanel): Node, PostgreSQL, cron, Apache | Proses dijaga skrip cron sendiri (tanpa PM2, hemat RAM/proses) |
| Laptop | **Docker** (database lokal `raciksoal-db`) | Database laptop terpisah dari hosting |

Daftar library dan versi persisnya: `package.json` (dikunci oleh `package-lock.json`; CI memakai `npm ci`).

---

## 4. Arsitektur dan alur kerja

### 4.1 Gambaran besar

```
 Browser guru (HP/laptop)
   │  halaman + server action (Next.js), cek status tiap 3 detik saat soal dibuat
   ▼
 Apache hosting (raciksoal.alfatahmas.com, .htaccess [P])
   │  diteruskan ke 127.0.0.1:3101
   ▼
 Aplikasi Node (Next.js standalone)  ──►  Penyedia AI (format OpenAI, mis. DeepSeek)
   │  Drizzle
   ▼
 PostgreSQL hosting  ──(02.00 WIB, pg_dump + enkripsi)──►  GitHub privat raciksoal-backup
```

Kode dikirim ke hosting lewat: **push `main` → GitHub Actions build → branch `deploy` → cron hosting menarik dan
menyalakan ulang** (bagian 10).

### 4.2 Alur membuat satu set soal
1. Guru menekan **Buat soal** → `mulaiBuatSoal` (`src/app/actions.ts`):
   - memeriksa sesi, membersihkan isian (`bersihkanPengaturan`), memastikan materi milik guru itu (`babMilik`);
   - menghitung jatah harian dan menyimpan set berstatus `proses` **dalam satu transaksi berkunci**
     (`pg_advisory_xact_lock`), sehingga klik ganda tidak melewati batas;
   - guru dipaksa memakai model utama; hanya admin yang boleh memilih model atau "Bandingkan".
2. Pekerjaan berat (`kerjakan`) berjalan **di latar belakang di dalam proses server**; browser memanggil
   `cekHasil` tiap 3 detik (aman dari batas waktu proxy hosting).
3. **Kisi-kisi dulu**: satu panggilan AI menyusun rencana semua nomor (TP, materi, indikator, level, dalil,
   stimulus). Kategori level tiap nomor **ditentukan aplikasi** (`rencanaLevel`), bukan AI. Nomor soal grup
   (wacana bersama) juga dari aplikasi (`rencanaGrup`). Jumlah kunci PG kompleks, kunci Benar/Salah, dan blok
   Menjodohkan juga direncanakan aplikasi (`pasangKunciPgk`).
4. **Kisi-kisi diperiksa ulang** oleh satu panggilan AI (`buatPeriksaKembar`): baris yang menguji keterampilan sama
   di bentuk berbeda ditulis ulang; aplikasi hanya menerima perubahan indikator/materi/stimulus (`terapkanKembar`).
5. **Soal ditulis bertahap**, maks. 10 soal per panggilan (`bagiTahap`), mengikuti potongan kisi-kisinya; tiap
   tahap diberi daftar soal sebelumnya agar tidak mirip. Draf tampil di layar setelah tiap tahap.
6. Tiap soal diperiksa: `rapikanSoal` → `periksaSoal` (penjaga ayat & pemeriksa lain) → `samakanDenganKisi`; soal
   merah dikirim balik ke AI sekali (**perbaikan otomatis**, hasilnya diperiksa ulang aplikasi). Lalu kunci PG diratakan
   (`ratakanKunci`), Menjodohkan disusun aplikasi (`susunMenjodohkan`/`susunMjLama`), skor diterapkan (`terapkanBobot`).
7. Set disimpan `selesai` beserta **prompt, jawaban mentah AI, nama model, waktu, dan token** (untuk audit dan
   perbandingan model).
8. Gagal di tengah → model berikutnya dicoba (cadangan). Lewat **10 menit** total → set `gagal` dan jatah kembali.
   Server dinyalakan ulang saat set masih `proses` → set itu ditandai `gagal` saat server menyala.

### 4.3 Penjaga ayat
- **Data mushaf**: `src/lib/mushaf.ts` membaca `quran-simple.txt`; `ambil` (rujukan → teks) dan `cari`
  (teks Arab → ayat resmi). Pencocokan memakai **kerangka huruf** (harakat, tanda waqaf, variasi alif/ya/waw/hamzah
  diabaikan; ة→ه) supaya teks PPT guru bergaya mushaf Indonesia tetap dikenali.
- **Saat materi disimpan**, server mencocokkan ulang semua dalil ke mushaf: cocok → teks dan sumber diganti versi
  mushaf; tidak cocok (hadis) → wajib dicentang guru, kecuali ditandai **"Bukan ayat/hadis"** (`bukan: true`, tanpa
  sumber & centang; AI diberi tahu itu bukan dalil, lembar siswa tanpa keterangan sumber). Tulisan Arab ≤ 3 kata
  (`istilahArab`) tetap di teks materi tanpa verifikasi dan tidak dicocokkan ke mushaf.
- **Saat soal dibuat/diedit**, setiap potongan Arab harus substring persis dari data bab (`arabTakTerverifikasi`),
  kalau tidak soal ditandai merah. Mode **Bahasa Arab** (`bab.teksArab = "bahasa"`): Arab boleh ditulis AI, tetapi
  potongan yang dikenali sebagai ayat dan tidak persis data terverifikasi tetap ditandai.
- **PDF**: teks Arab dari PDF tidak pernah dipakai apa adanya; hanya ayat yang dikenali mushaf (diganti teks
  mushaf), sisanya dibuang.

### 4.4 Login, peran, dan pemisahan data
- Login hanya lewat halaman **/masuk** (server action `masuk` → `auth.api.signInUsername`). Rute HTTP bawaan
  Better Auth (`/api/auth/...`) **sengaja tidak dipasang**, supaya tidak ada jalan masuk yang melewati pembatas.
- **Pembatas salah sandi** (`src/lib/pembatas.ts`): 5 kali salah per perangkat + nama → dikunci 15 menit;
  30 kali salah dari semua perangkat → nama itu dikunci 15 menit. Reset kata sandi oleh admin membuka kuncinya.
  Disimpan di memori (hilang saat server restart).
- Sesi berlaku 30 hari. Tidak ada pendaftaran bebas: akun guru dibuat admin. Admin pertama hanya bisa dibuat saat
  database belum punya pengguna, untuk nama `ADMIN_USERNAME`.
- Peran: `admin` (`peran = 'admin'`) atau guru (`'user'`). Akun nonaktif = `nonaktif = true`.
- Pemeriksaan pemilik dilakukan di setiap pintu: `ambilSet`/`denganSetTerkunci`, `cekHasil`, `ubahIdentitas`,
  `ubahNamaSet`, `hapusSet`, rute Word, dan query materi (`guruId = saya`). Tidak memakai middleware.

### 4.5 Batas pemakaian

| Batas | Nilai | Letak |
|---|---|---|
| Set per guru per hari (WIB, set gagal tidak dihitung) | 10 (admin bebas) | `BATAS_PER_GURU`, `src/lib/pembatas.ts` |
| Set per hari seluruh web | 100 | `BATAS_TOTAL` |
| Set diproses bersamaan | 2 per guru, 10 seluruh web | `BATAS_PROSES_*`, `actions.ts` |
| Ganti/Ubah/Tambah per set (permanen) | 30 | `BATAS_GANTI_PER_SET`, `actions.ts` |
| Ganti/Ubah/Tambah per guru per hari | 60 (admin bebas) | `BATAS_UBAH_PER_GURU` |
| Analisa materi per guru per hari | 30 (admin bebas) | `BATAS_ANALISA` |
| Soal per set / per panggilan AI | 50 / 10 | `MAKS_SOAL`, `MAKS_PER_TAHAP`, `src/lib/prompt.ts` |
| Batas waktu satu panggilan AI | `AI_TIMEOUT_MS` (bawaan 180 dtk), dicoba ulang 2× untuk 429/5xx | `src/lib/ai.ts` |
| Batas waktu total satu set / satu soal | 10 menit / 4 menit | `TENGGAT_SET`, `TENGGAT_SATU_SOAL` |

Pemakaian Ganti/Ubah/Tambah dan analisa dicatat di tabel `pemakaian_ai`. Sisa jatah tampil di form (set) dan di
menu **Lainnya** kartu soal (ganti/ubah).

### 4.6 Penulisan bersamaan
Semua perubahan isi set lewat `denganSetTerkunci` (transaksi + `SELECT … FOR UPDATE`). Ganti/Ubah/Tambah memanggil
AI **di luar** kunci, lalu menulis ke isi terbaru; kalau soal itu berubah selama AI bekerja, guru diminta memuat ulang.

---

## 5. Struktur folder

```
raciksoal/
├── src/
│   ├── app/                      Halaman dan server action (Next.js App Router)
│   │   ├── page.tsx              Halaman utama: Buat Soal / hasil set (?id=)
│   │   ├── buat-soal.tsx         Form buat soal, halaman hasil, jendela Unduh
│   │   ├── kartu-soal.tsx        Kartu satu soal: Edit, Ganti, Ubah, Tambah, Hapus, Tulis sendiri
│   │   ├── kotak-materi.tsx      Tempel/lampirkan/pilih materi + analisa
│   │   ├── actions.ts            Server action utama: buat set, cek hasil, edit/ganti soal, analisa, jatah
│   │   ├── kepala.tsx            Kerangka halaman (sidebar), pita peringatan admin
│   │   ├── laci-sidebar.tsx      Sidebar laci (HP) / tetap (laptop)
│   │   ├── baris-riwayat.tsx     Baris riwayat + menu ⋯ (ganti nama, hapus)
│   │   ├── masuk/                Halaman login + pembatas
│   │   ├── akun/                 Ganti kata sandi
│   │   ├── materi/               Kelola materi
│   │   ├── riwayat/              Semua riwayat + pencarian
│   │   ├── panduan/              Panduan guru (statis)
│   │   ├── admin/guru|set|pengaturan/   Halaman khusus admin
│   │   ├── api/word/route.ts     Unduhan Word: ?id=&jenis=soal|kunci|kisi[&paket=A..D]
│   │   ├── globals.css           Token warna (terang & gelap), gaya dasar, gaya cetak
│   │   └── layout.tsx            Huruf, tema (cookie), kaki halaman sumber Tanzil
│   ├── lib/                      Logika inti (sebagian besar fungsi murni, ada tesnya)
│   │   ├── ai.ts                 Adapter AI (format OpenAI), daftar model dari .env, coba ulang
│   │   ├── prompt.ts             Instruksi AI, aturan per jenis/kesulitan, rencana level & grup, batas isian
│   │   ├── soal.ts               Tipe Soal/Bab, pemeriksa soal & kisi, penjaga Arab, kunci, Menjodohkan
│   │   ├── mapel.ts              Daftar mapel Al-Fatah & sifat mapel (Bahasa Arab, eksak, Inggris, sejarah)
│   │   ├── mushaf.ts, surah.ts   Data mushaf: cari/ambil ayat, nama surah & rujukan
│   │   ├── materi.ts             Merapikan materi guru, draf dari file, ayat dari PDF
│   │   ├── office.ts             Membaca .docx/.pptx/.pdf (di browser)
│   │   ├── word.ts               Menyusun 3 file Word
│   │   ├── paket.ts, kunci.ts, skor.ts   Paket A–D, kunci ringkas, skor otomatis
│   │   ├── auth.ts, sesi.ts, akses.ts, pembatas.ts   Login, pengguna saat ini, aturan akses, pembatas
│   │   └── bab.ts, sekolah.ts, nama-file.ts, pesan-auth.ts
│   ├── db/schema.ts, db/index.ts Tabel database (Drizzle) dan koneksi (pool maks. 3)
│   ├── data/                     Bab bawaan lama (Qurdis XI Bab 3), hanya untuk set lama
│   └── instrumentation*.ts       Saat server menyala: migrasi database + tandai set macet
├── drizzle/                      File migrasi SQL (dijalankan otomatis saat server menyala)
├── public/quran/                 Data mushaf Tanzil (JANGAN diubah isinya)
├── public/word/                  Cetakan Word lembar soal (kop madrasah)
├── scripts/
│   ├── uji-pemisahan.mts         Tes pemisahan data antar guru (server laptop)
│   └── buat-template-word.py     Membuat ulang cetakan Word dari format AFTS madrasah
├── deploy/                       Salinan skrip hosting: jalan.sh, backup.sh, htaccess, panduan pulih
├── dokumen/                      Riwayat pengembangan, hasil audit, hitungan biaya AI
│                                 (rujukan/ & proposal/ sengaja tidak di-commit)
├── .github/workflows/build.yml   Build di GitHub → branch deploy
└── .claude/launch.json           Konfigurasi server laptop (dev, uji-cadangan, uji-pulih)
```

---

## 6. Database

PostgreSQL 16. Skema di `src/db/schema.ts`; perubahan lewat file `drizzle/00NN_*.sql` yang **diterapkan otomatis**
saat server menyala (`src/instrumentation-node.ts`, catatan migrasi di tabel `public.__drizzle_migrations`).

| Tabel | Isi |
|---|---|
| `pengguna` | Akun (nama, username, `peran`, `nonaktif`). Email otomatis `<username>@raciksoal.local` (wajib di Better Auth) |
| `akun_login` | Hash kata sandi (scrypt) per akun |
| `sesi` | Sesi login aktif (30 hari) |
| `verifikasi` | Tabel bawaan Better Auth |
| `hasil_soal` | Satu baris = satu set: pemilik, status (`proses`/`selesai`/`gagal`), pengaturan, **salinan bab**, soal, kisi, prompt, jawaban mentah AI, model, info (detik, token, catatan cadangan), jumlah ganti, nama, waktu dihapus (hapus lunak) |
| `materi` | Materi milik guru (`bab` jsonb: mapel, kelas, judul, TP, isi, dalil terverifikasi) |
| `pemakaian_ai` | Catatan Ganti/Ubah/Tambah dan analisa materi (untuk batas harian) |
| `gambar` | Gambar materi/soal (JPEG ≤ 1280 px, kolom `bytea`), per guru; dibuka lewat `/api/gambar/[id]` (pemilik/admin saja). Tidak pernah dihapus; maks. 300 per guru |
| `pengaturan_web` | Pengaturan admin (nama madrasah) |
| `tes_data` | Sisa tes langkah 1, tidak dipakai |

Catatan penting:
- Kolom waktu **wajib** `timestamp(..., { withTimezone: true })`; tanpa itu jam tampil bergeser 7 jam.
- Set menyimpan **salinan materi** (`hasil_soal.bab`), jadi set tetap utuh walau materinya diubah/dihapus.
- Set yang dihapus guru tidak benar-benar hilang (`dihapus` terisi). Pulihkan lewat database: `dihapus = null`.

---

## 7. Pengaturan (`.env`)

Contoh lengkap dengan penjelasan: [`.env.example`](.env.example). File `.env` **tidak boleh** masuk Git.
Di hosting letaknya `~/raciksoal-app/.env`; mengubahnya membuat aplikasi menyala ulang sendiri (≤ 7 menit).

| Nama | Fungsi |
|---|---|
| `DATABASE_URL` | Alamat database PostgreSQL |
| `BETTER_AUTH_SECRET` | Kunci rahasia acak untuk sesi login |
| `BETTER_AUTH_URL` | Alamat web (laptop: `http://localhost:3000`) |
| `ADMIN_USERNAME` | Nama pengguna yang boleh menjadi admin pertama |
| `AI_BASE_URL`, `AI_API_KEY`, `AI_MODEL` | Model AI utama (slot 1) |
| `AI_EXTRA_BODY` | JSON tambahan khusus penyedia (mis. mematikan mode "berpikir") |
| `AIn_GAMBAR=0` | Model nomor n tidak bisa melihat gambar: gambar materi tidak dikirim, AI hanya membaca keterangannya |
| `AI_MAX_TOKENS`, `AI_TIMEOUT_MS` | Batas panjang jawaban (bawaan 8000) dan batas waktu per panggilan |
| `AI2_*` … `AI9_*` | Model cadangan / pembanding, urutan nomor = urutan cadangan |
| `BACKUP_PASSPHRASE` | Sandi pengunci backup (hanya hosting; **simpan juga di luar hosting**) |

---

## 8. Menjalankan di laptop

Prasyarat: Node.js 24, Docker Desktop, Git.

```bash
docker start raciksoal-db        # database lokal (PostgreSQL 16, port 5432)
npm ci                           # pasang library sesuai package-lock.json
npm run dev                      # http://localhost:3000
```

- Salin `.env.example` menjadi `.env` dan isi nilainya (sekali saja).
- Akun uji laptop tercatat di `.claude/akun-uji.local.txt` (tidak di-commit).
- Kalau port 5432 sedang dipakai container lain, hentikan dulu container itu. Kalau setelah dinyalakan kolom port
  `raciksoal-db` hanya tertulis `5432/tcp`, jalankan `docker network connect bridge raciksoal-db` lalu nyalakan ulang.
- Konfigurasi siap pakai di `.claude/launch.json`: `dev` (port 3000), `uji-cadangan` (3002, model utama sengaja
  palsu untuk menguji cadangan), `uji-pulih` (3003, memakai database hasil pemulihan backup).
- Jangan menjalankan `npm run build` saat server dev menyala (keduanya memakai folder `.next`).
- Setelah mengedit file, muat ulang halaman; HMR kadang membuat server action "is not defined".

---

## 9. Pengujian

| Perintah | Isi | Di mana |
|---|---|---|
| `npm test` | Tes fungsi murni: penjaga ayat & mushaf, pemeriksa soal, kunci, skor, paket, pembatas login (`src/lib/*.test.mts`) | Laptop **dan** GitHub (build gagal bila tes gagal) |
| `npm run uji:pemisahan` | Guru B mencoba ±30 cara membuka/mengubah/mengunduh set & materi guru A, plus memastikan pintu `/api/auth` tertutup. Semua harus ditolak dan data A utuh | Laptop saja (butuh server dev + database + 2 akun guru) |
| `npx next lint` | Pemeriksa gaya kode. Error lint = build GitHub gagal | Laptop |

Menjalankan uji pemisahan (server dev menyala):

```bash
UJI_A=nama.guru.a:sandi UJI_B=nama.guru.b:sandi npm run uji:pemisahan
```

Aksi server atau rute **baru** yang menerima id set/materi wajib ditambahkan ke `scripts/uji-pemisahan.mts`.

---

## 10. Rilis dan deploy

### 10.1 Nomor versi
`X.Y.Z`: Z = perbaikan kecil, Y = fitur baru, X = perubahan besar. Setiap rilis:

```bash
npm test && npx next lint                               # wajib lulus
npm run uji:pemisahan                                   # bila menyentuh aksi/rute/halaman (lihat bagian 9)
npm version X.Y.Z --no-git-tag-version                  # naikkan versi
# tulis perubahan (bahasa sederhana) di CATATAN-VERSI.md, lalu:
git add -A && git commit -m "Versi X.Y.Z: ..."
git tag vX.Y.Z && git push origin main && git push origin vX.Y.Z
```

### 10.2 Jalur otomatis setelah push
1. **GitHub Actions** (`.github/workflows/build.yml`): `npm ci` → `npm test` → `npm run build` (standalone) →
   hasil dirakit (`.next/standalone` + `static` + `public` + `drizzle`, tanpa `.env`) → di-push paksa ke branch
   **`deploy`**. Build lama dibatalkan bila ada push baru.
2. **Cron hosting** tiap 7 menit menjalankan `~/raciksoal-app/jalan.sh`: menarik branch `deploy` (deploy key
   hanya-baca), dan bila ada versi baru mematikan proses lama lalu menyalakan `server.js` di `127.0.0.1:3101`.
3. Saat server menyala: migrasi database dijalankan, set macet ditandai gagal.

Jadi perubahan tampil di hosting **≤ 7 menit** setelah build GitHub sukses. Cek status build:
`gh run list --limit 1`.

---

## 11. Hosting: pengoperasian

### 11.1 Letak file di hosting
| Lokasi | Isi |
|---|---|
| `~/raciksoal-app/jalan.sh` | Penjaga aplikasi (salinan: `deploy/jalan.sh`), cron `*/7` |
| `~/raciksoal-app/backup.sh` | Backup malam (salinan: `deploy/backup.sh`), cron `0 2 * * *` |
| `~/raciksoal-app/.env` | Pengaturan rahasia hosting |
| `~/raciksoal-app/app/` | Hasil build (isi branch `deploy`) |
| `~/raciksoal-app/app.log` | Log aplikasi (error server ada di sini) |
| `~/raciksoal-app/status.txt` | Daftar proses yang berjalan (diperbarui tiap cron; alamat database disamarkan) |
| `~/raciksoal-app/backup-status.txt`, `backup.log` | Hasil backup terakhir |
| `~/raciksoal-app/kunci/` | Deploy key (baca: repo kode; tulis: repo backup) |
| `~/raciksoal-backup/lokal/` | 7 salinan backup terakhir (terkunci) |
| `~/raciksoal.alfatahmas.com/.htaccess` | Penerus ke port 3101 (salinan: `deploy/htaccess`) |

Node 24 dipasang lewat Runtime Manager cPanel; aplikasi dijalankan dengan `--max-old-space-size=256`.
Hosting punya cache depan, karena itu halaman memakai `force-dynamic`.

### 11.2 Tindakan umum (tanpa SSH, cukup cPanel → File Manager)
| Tujuan | Caranya |
|---|---|
| Menyalakan ulang aplikasi | Buat file kosong `~/raciksoal-app/restart` (diproses ≤ 7 menit) |
| Backup sekarang | Buat file kosong `~/raciksoal-app/jalankan-backup` |
| Melihat apakah aplikasi hidup | Buka `status.txt` (ada baris `next-server`) atau buka alamat web |
| Melihat penyebab error | Buka `app.log` (baris paling bawah) |
| Mengubah pengaturan/kunci AI | Edit `~/raciksoal-app/.env` → aplikasi menyala ulang sendiri |
| Menambah file di `public/` | Setelah deploy, pastikan file benar ada di `~/raciksoal-app/app/public/` |

---

## 12. Backup dan pemulihan

- **Jadwal**: setiap malam 02.00 WIB. `pg_dump` → gzip → dienkripsi `openssl aes-256-cbc -pbkdf2 -iter 200000`
  dengan `BACKUP_PASSPHRASE` → dikirim ke repo privat `zahidjnd/raciksoal-backup` (satu file
  `raciksoal.sql.gz.enc`, satu commit per malam = riwayat semua versi) + 7 salinan lokal di hosting.
- **Pemantauan**: pita merah admin muncul bila backup terakhir gagal atau lebih dari 36 jam.
- **Tanpa `BACKUP_PASSPHRASE` backup tidak bisa dibuka.** Sandi ini disimpan pemilik di luar hosting.
- **Membuka & memulihkan**: langkah lengkap di [deploy/pulihkan-backup.md](deploy/pulihkan-backup.md):
  bagian 2 (buka kunci), 3a (latihan di laptop), **3c (uji pulih lengkap, berkala)**, 3b (pulih sungguhan di hosting).
- **Riwayat uji pulih**: 15 Okt 2026 dan 5 Nov 2026, keduanya lulus (data utuh, aplikasi jalan di atasnya).
  Ulangi tiap beberapa bulan.

---

## 13. Tugas admin

| Situasi | Yang dilakukan |
|---|---|
| Guru baru | Kelola guru → Tambah akun guru (nama, username, kata sandi awal ≥ 8). Minta guru menggantinya di Akun |
| Guru lupa sandi / terkunci 5× salah | Kelola guru → **Reset kata sandi**. Kunci 15 menit ikut terbuka, semua sesinya dikeluarkan |
| Guru berhenti | Kelola guru → **Nonaktifkan** (set & materinya tetap tersimpan; bisa diaktifkan lagi) |
| Pita merah "set gagal / cadangan dipakai" | Buka Semua set → set berlabel gagal. Penyebab umum: saldo AI habis, penyedia sibuk, model salah di `.env` (bagian 14) |
| Pita merah "backup" | Lihat `backup-status.txt` dan `backup.log` di hosting (bagian 14) |
| Guru minta set yang terhapus dikembalikan | Ubah `hasil_soal.dihapus` menjadi `null` lewat database |
| Nama madrasah di kop berubah | Pengaturan → Nama madrasah |
| Kop/logo madrasah berubah | Jalankan ulang `scripts/buat-template-word.py` dengan format AFTS baru, lalu rilis |
| Memantau biaya | Kelola guru: token 30 hari per guru dan total; bandingkan dengan saldo di dasbor penyedia AI |

---

## 14. Pemecahan masalah

| Gejala | Kemungkinan penyebab | Tindakan |
|---|---|---|
| Web tidak bisa dibuka / 503 | Aplikasi mati, sedang menyala ulang, atau build baru belum selesai | Tunggu ≤ 7 menit; cek `status.txt`; buat file `restart`; cek `app.log` |
| Perubahan kode tidak muncul di hosting | Build GitHub gagal (sering karena error lint/tes) | `gh run list`; perbaiki, push lagi |
| Semua guru gagal membuat soal | Saldo AI habis (402), kunci API salah/kedaluwarsa, nama model berubah | Cek dasbor penyedia; perbaiki `.env` hosting. Admin melihat rincian error di halaman set |
| Soal lama "sedang meracik" lalu gagal | Penyedia AI lambat, lewat 10 menit, atau server restart | Coba lagi (jatah kembali). Bila sering: periksa model cadangan |
| Soal ditandai merah | Teks Arab tidak cocok dengan data terverifikasi | Guru memeriksa: Edit/Ganti soal, atau tambahkan dalil yang benar ke materi |
| Unduh Word error 500 | Lihat `app.log`; dulu terjadi karena huruf Arab di nama file (sudah diperbaiki) | Laporkan dengan nomor set dan versi |
| Guru tidak bisa masuk | Salah sandi 5× (kunci 15 menit), akun nonaktif | Reset kata sandi / aktifkan di Kelola guru |
| Backup gagal | `BACKUP_PASSPHRASE` kosong, database tidak bisa diakses, kunci GitHub ditolak | Lihat `backup.log`; picu ulang dengan `jalankan-backup` |
| Database laptop tidak tersambung | Docker mati / port bentrok | Bagian 8 |
| Tombol tidak berfungsi saat dev | HMR setelah edit | Muat ulang halaman; matikan dev sebelum `npm run build` |

Saat melapor masalah, sertakan **versi** (tertulis di sidebar), nomor set (`?id=` di alamat), dan waktu kejadian.

---

## 15. Model AI dan biaya

- **Mengganti model utama**: ubah `AI_BASE_URL` / `AI_API_KEY` / `AI_MODEL` di `.env` hosting. Penyedia apa pun yang
  kompatibel dengan format OpenAI Chat Completions bisa dipakai.
- **Cadangan otomatis**: isi `AI2_*`, `AI3_*`, … Bila model utama gagal (saldo habis, kunci ditolak, sibuk, timeout,
  jawaban rusak), aplikasi mencoba model berikutnya sesuai nomor. Catatan kegagalan tampil sebagai kotak kuning (admin)
  dan pita merah.
- **Membandingkan model** (admin): pilih "Bandingkan semua model" di Buat Soal; satu set dibuat per model dengan
  pengaturan sama, lengkap dengan waktu dan token.
- **DeepSeek (Okt 2026)** hanya menerima `deepseek-flash` dan `deepseek-v4-pro`. Untuk `deepseek-flash`, mode
  "berpikir" sebaiknya dimatikan lewat `AI_EXTRA_BODY` agar batas 8000 token tidak habis untuk berpikir.
- **Biaya**: pantau token 30 hari di Kelola guru. Pasang juga batas pengeluaran di dasbor penyedia AI.

---

## 16. Mengubah aplikasi dengan aman

- **Tabel database**: ubah `src/db/schema.ts` → `npm run db:generate` → file baru di `drizzle/` → di-commit;
  diterapkan otomatis saat server menyala (laptop maupun hosting). Jangan mengubah file migrasi lama.
- **Bentuk soal baru**: jangan menjumlah bentuk satu per satu; selalu pakai `jumlahSoal()` dan urutan `NAMA_BENTUK`
  (`prompt.ts`), dan samakan `URUTAN_BENTUK` di `soal.ts` (pernah ada bug karena bentuk baru terlewat).
- **Aturan penulisan soal**: ubah dulu [ATURAN-SOAL.md](ATURAN-SOAL.md), baru instruksi AI di `buatSistem`
  (`src/lib/prompt.ts`).
- **Tampilan**: pakai token warna di `globals.css` (`hijau`, `krem`, `pudar`, `bahaya`, `peringatan`, `kartu`, …),
  bukan warna Tailwind langsung, supaya mode gelap ikut benar. Lihat [DESIGN.md](DESIGN.md).
- **Nama tombol**: Panduan (`src/app/panduan/page.tsx`) menyebut nama tombol persis; ikut ubah bila tombol berganti nama.
- **Aksi baru yang membaca/mengubah data guru**: wajib memeriksa pemilik dan ditambahkan ke uji pemisahan.
- **Library baru / ganti stack**: dibicarakan dulu dengan pemilik (hosting RAM 1 GB, 12 proses).
- **`history.replaceState`**: selalu `history.replaceState(history.state, ...)`; dengan `null`, Next memuat ulang
  halaman dan pengecekan status terputus.

---

## 17. Lisensi dan sumber data

- **Teks Al-Qur'an**: Tanzil Project (https://tanzil.net), versi Simple. Boleh dipakai di web/aplikasi dengan syarat
  **teks tidak diubah** dan **sumber + tautan dicantumkan** (ada di kaki halaman dan kotak ayat).
  File `public/quran/quran-simple.txt` tidak boleh disunting.
- **Mushaf Standar Indonesia digital & terjemah Kemenag** tidak dibundel (belum ada lisensi tertulis). Terjemah dalil
  diisi guru.
- Aplikasi dipakai untuk kebutuhan internal madrasah. Ketentuan PMA 44/2016 tentang penerbitan mushaf menjadi
  pertimbangan bila cakupan penggunaan berubah.

---

## 18. Peta dokumen

| File | Isi |
|---|---|
| `README.md` | Dokumen ini: gambaran lengkap dan tata cara |
| [CATATAN-VERSI.md](CATATAN-VERSI.md) | Perubahan tiap versi (bahasa sederhana) + daftar persiapan 1.0.0 |
| [PRD.md](PRD.md) | Tujuan, tahapan, dan ruang lingkup produk |
| [ATURAN-SOAL.md](ATURAN-SOAL.md) | Aturan baku penyusunan soal (Bloom, kaidah, per bentuk, gaya TKA) |
| [RUJUKAN.md](RUJUKAN.md) | Dasar setiap aturan soal (peraturan resmi, kaidah, keputusan madrasah) |
| [DESIGN.md](DESIGN.md) | Arah tampilan: warna, huruf, bentuk, tema |
| [dokumen/audit/](dokumen/audit/) | Hasil audit (fitur 4 Nov, mutu soal 7 Nov, tampilan 19 Okt) beserta statusnya |
| [deploy/pulihkan-backup.md](deploy/pulihkan-backup.md) | Membuka, menguji, dan memulihkan backup |
| [dokumen/Hitungan-Biaya-AI-RacikSoal.pdf](dokumen/Hitungan-Biaya-AI-RacikSoal.pdf) | Perkiraan biaya & token AI setahun (realistis dan batas atas), cara menghitung ulang |
| `CLAUDE.md` | Catatan kerja untuk asisten AI: aturan proyek, keputusan yang berlaku, jebakan teknis (ringkas) |
| [dokumen/riwayat-pengembangan.md](dokumen/riwayat-pengembangan.md) | Catatan harian lengkap 14 Okt – 9 Nov 2026: alasan tiap keputusan teknis |
| `.env.example` | Contoh pengaturan dengan penjelasan |

---

## 19. Batasan yang diketahui

- Pembuatan soal berjalan **di dalam proses web** (bukan antrean terpisah); server restart = set yang sedang dibuat gagal.
- Pembatas login dan sebagian penghitung berada di memori (kembali nol saat restart).
- Hadis karangan dalam mode Bahasa Arab tidak terdeteksi otomatis (hanya dicegah lewat instruksi AI).
- Mapel sejarah: hanya angka tahun yang diperiksa aplikasi; nama tokoh & tempat dijaga lewat instruksi AI saja.
- Materi pendek dengan nama/tahun yang berulang membuat jawaban isian sering "bocor" ke soal lain (ditandai merah).
- Teks Arab dari buku PDF Kemenag rusak saat diekstrak; hanya ayat yang dikenali mushaf yang dipakai.
- Belum ada: bank soal, katalog CP/TP resmi. Gambar, tabel, dan rumus dari PDF belum terbaca (gambar PDF: tempel tangkapan layar).
- AI tidak bisa membuat gambar (grafik fungsi, diagram baru): gambar soal hanya dari materi guru.
- Word tidak bisa "boleh pindah kolom tapi jangan pindah halaman"; sesekali soal terbelah di dasar halaman.
- PDF berkop tidak bisa dibuat di hosting (butuh Word/LibreOffice di server); guru menyimpan file Word sebagai PDF.
