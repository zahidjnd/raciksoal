# CLAUDE.md

## Ringkasan proyek
Web pembuatan soal berbasis AI untuk guru madrasah, mengikuti kurikulum Kemenag.
Guru memilih mapel, bab, bentuk soal, dan level kognitif. Web menyusun instruksi ke AI,
lalu menampilkan soal + kunci jawaban + kisi-kisi yang bisa diedit dan diekspor ke Word.

Tahap sekarang: **prototipe untuk pemakaian pribadi**, hanya mapel **Al-Qur'an Hadis (Qurdis) kelas 11 MA**.
Rencana: dipakai 15-20 guru di satu madrasah, lalu jangka panjang dijual.
Detail fitur ada di `PRD.md`.

## Tentang pemilik proyek
- Pemilik adalah guru Qurdis, **pemula dalam pemrograman** (full vibe coding).
- Jelaskan setiap langkah dengan bahasa awam, singkat, dalam Bahasa Indonesia.
- Setelah selesai mengerjakan sesuatu, jelaskan: apa yang dibuat, cara mengetesnya, dan apa langkah berikutnya.
- Kalau ada pilihan teknis, rekomendasikan satu saja beserta alasannya. Jangan beri terlalu banyak opsi.

## Stack
- Next.js (TypeScript) + Tailwind CSS
- PostgreSQL, diakses lewat Prisma atau Drizzle
- Login: Auth.js atau Better Auth (belum dipasang di prototipe awal)
- Ekspor Word: library `docx`
- Model AI: **harus bisa diganti lewat pengaturan** (buat lapisan "adapter"), jangan dikunci ke satu penyedia

## Hosting (batasan penting)
Hosting: DomaiNesia paket Nimbus Go (shared hosting, cPanel).
- Tersedia: Node.js, NPM, Yarn, PM2, PostgreSQL, SSH, Git Deploy Manager, cron jobs
- RAM 1 GB, Entry Process 12 (batas proses serentak)
- PostgreSQL hanya bisa diakses dari hosting itu sendiri (tidak ada remote PostgreSQL)
- Backup bawaan hanya mingguan dan bulanan
- **Jangan menjalankan `next build` di hosting** (RAM kurang). Build di laptop atau GitHub, lalu unggah hasilnya.
- Pembuatan soal bisa 30-60 detik. Tampilkan indikator "sedang membuat soal..." dan jangan asumsikan streaming pasti jalan.

## Aturan keras (jangan dilanggar)
1. Kunci API AI **hanya di server**, disimpan di file `.env`. Jangan ditulis di kode, jangan ke browser, jangan ke GitHub. Pastikan `.env` ada di `.gitignore`.
2. **Jangan membaca, mengubah, atau menampilkan isi `.env`.**
3. Data tiap guru **harus terpisah**: guru A tidak boleh bisa membuka soal guru B. Periksa ini di setiap fitur yang menyimpan atau membaca data.
4. Batasi jumlah pembuatan soal per guru per hari, dan pasang batas waktu (timeout) pada pemanggilan AI.
5. **Ayat Al-Qur'an dan hadis tidak boleh dikarang AI.** Teksnya harus diambil dari data terverifikasi yang disediakan pemilik, lalu AI hanya membuat soal dari teks itu.
6. Setiap hasil soal wajib ada peringatan: "Soal dibuat AI, wajib diperiksa guru sebelum dipakai."
7. Teks Arab: pakai font Arab yang jelas (Amiri atau Scheherazade) dan dukung arah tulisan kanan ke kiri (RTL).
8. Jangan menambah library besar atau mengubah stack tanpa bertanya dulu.
9. Jangan menghapus data atau file tanpa konfirmasi.

## Cara kerja
- Bangun **sedikit demi sedikit**, satu fitur per langkah. Jangan membuat seluruh web sekaligus.
- Gunakan Git. Commit setelah setiap langkah yang berhasil, dengan pesan yang jelas.
- Sebelum mengubah banyak file, jelaskan rencananya dulu dan minta persetujuan.
- Minta AI membalas dalam **format JSON terstruktur**, bukan teks bebas, supaya soal bisa diedit per butir dan diekspor.
- Simpan prompt dan nama model yang dipakai pada setiap hasil, untuk keperluan membandingkan kualitas.
- Kalau terjadi error, jelaskan penyebabnya dengan bahasa sederhana sebelum memperbaiki.

## Urutan pembangunan
1. Tes hosting: satu halaman, satu tombol, simpan dan baca satu data dari PostgreSQL, panggil satu API AI, deploy.
2. Form pembuatan soal Qurdis kelas 11, panggil AI, tampilkan hasil.
3. Ekspor Word dengan kop dan layout rapi.
4. Uji beberapa model AI dengan materi yang sama.
5. Login guru dan simpan riwayat soal.
6. Kisi-kisi otomatis.
7. Backup database otomatis tiap malam lewat cron, salinan disimpan di luar hosting.

Status terkini dan keputusan penting dicatat di bagian bawah file ini.

## Catatan keputusan
- 2026-10-14: Next.js 15 + Drizzle (`pg`), bukan Prisma (lebih ringan untuk RAM 1 GB).
- 2026-10-14: Adapter AI = satu `fetch` format OpenAI (`src/lib/ai.ts`), diatur lewat `AI_BASE_URL`/`AI_API_KEY`/`AI_MODEL`. Penyedia awal: DeepSeek.
- 2026-10-14: Build `output: "standalone"` di laptop. Subdomain tujuan: raciksoal.alfatahmas.com.
- 2026-10-14: DB lokal via Docker (`raciksoal-db`). Perubahan tabel lewat file SQL di `drizzle/`.

- 2026-10-14: Hosting membatasi cron jadi `*/7` (bukan tiap menit) → update/restart butuh s.d. 7 menit.
  Restart manual: buat file kosong `~/raciksoal-app/restart`. Status proses tanpa SSH: `~/raciksoal-app/status.txt`.
  Next.js mengganti nama proses jadi `next-server`, jadi proses dimatikan lewat `app.pid`.
- 2026-10-14: Deploy = push ke `main` → GitHub Actions build → branch `deploy` → cron hosting
  menjalankan `~/raciksoal-app/jalan.sh` (salinan: `deploy/jalan.sh`): tarik build, nyalakan ulang, jaga agar tetap hidup.
  Tidak pakai PM2 (hemat proses/RAM). Node 24 via Runtime Manager. Passenger nonaktif di paket ini.
- 2026-10-14: Subdomain diteruskan ke Node (127.0.0.1:3101) lewat `.htaccess` [P]. Hosting punya cache depan,
  jadi halaman di-set `force-dynamic`.
- 2026-10-14: Repo privat `zahidjnd/raciksoal`, hosting pakai deploy key hanya-baca (`~/raciksoal-app/kunci/`).
- 2026-10-14: Migrasi DB otomatis saat server menyala (`src/instrumentation.ts`). `.env` hosting: `~/raciksoal-app/.env`,
  diubah → aplikasi restart sendiri dalam 1 menit.

- 2026-10-14: User DB hosting = `alfatah2_app` (cPanel tolak user bernama sama dengan database).
- 2026-10-14: Kolom waktu WAJIB `timestamp(..., { withTimezone: true })`. Tanpa itu jam tampil +7 jam
  (terlihat di `tes_data`, tabel tes sementara, dibiarkan).

- 2026-10-14: Data bab = file JSON di `src/data/` (bab 3 dari PPT pemilik; teks Arab dicek cocok persis 26/26).
  Penjaga ayat (`src/lib/soal.ts`): setiap teks Arab dari AI harus substring persis data bab, kalau tidak → soal ditandai merah.
  AI menampilkan ayat lewat `dalil_id`, bukan mengetik ulang. Kunci PG diratakan aplikasi. Tes: `npm test` (juga jalan di CI).
- 2026-10-14: Pembuatan soal jalan di belakang (`hasil_soal.status`), browser cek tiap 3 detik → aman dari timeout proxy hosting.
  Batas 30x/hari untuk seluruh web (belum ada login).
- 2026-10-14: Soal dibuat BERTAHAP, maks 10 soal per panggilan AI (`bagiTahap`), karena output AI maks ±8.000 token
  (25 soal Latihan dulu terpotong). Tiap tahap diberi daftar soal sebelumnya agar tidak mirip. Maks 40 soal per permintaan.
- 2026-10-14: PDF materi: teks Arabnya rusak saat diekstrak → jangan pernah ambil ayat dari PDF.

## Status
- Langkah 1–8 SELESAI (per 2026-10-15).
- BERIKUTNYA, LANGKAH 9 (disetujui pemilik 2026-10-15, belum dikerjakan): AYAT OTOMATIS DARI DATA MUSHAF.
  Pemilik ingin verifikasi dilonggarkan. Keputusan: JANGAN pakai AI sebagai pemeriksa ayat/hadis (AI sumber salahnya).
  Rencana: simpan teks Al-Qur'an lengkap (±1,5 MB) di aplikasi. Guru cukup ketik "QS An-Nur: 2" → teks Arab terisi
  otomatis tanpa centang. Unggah PPT/Word: teks Arab dicocokkan ke mushaf (normalisasi: abaikan harakat/tanda waqaf),
  kalau ketemu → sumber terisi & teks DIGANTI teks mushaf resmi; basmalah/doa/nama surat diabaikan. HADIS tetap
  kotak + centang guru (belum ada data hadis berharakat yang bisa jadi patokan pasti).
  Langkah pertama: cek sumber & LISENSI teks mushaf dan terjemah Kemenag (web akan dijual), pilih yang aman.
  Setelah itu perbarui aturan 5 jadi "ayat dari data mushaf, hadis dari guru".
- Lain-lain tertunda: uji pemisahan data dengan login akun guru kedua (belum dibuktikan lewat login); tambah bab
  bawaan lain; data uji di DB laptop (materi "Uji: Menjaga Pandangan", set 22–35) boleh dibersihkan bila pemilik setuju.
- Langkah 1 SELESAI (2026-10-14).
- Langkah 2 (2026-10-14): form + buat soal + tampil hasil jalan untuk Bab 3. Belum: bab lain.
- Langkah 2b (2026-10-14): edit per butir (`simpanSoal`, editan tetap dicek penjaga Arab) dan ganti satu soal
  (`gantiSatuSoal`, bentuk/level/TP sama, maks 30x per set). `soal` = versi terbaru; `jawaban_ai` = semua jawaban mentah AI.
  Catatan: skenario masih bisa berulang di set besar → solusi tuntas: kisi-kisi dulu baru soal (langkah 6).
- Langkah 3 (2026-10-14): ekspor Word (`src/lib/word.ts`, rute `/api/word?id=..&jenis=soal|kunci`).
  Lembar soal = cetakan `public/word/template-soal.docx` yang dibuat dari FORMAT_AFTS milik madrasah oleh
  `scripts/buat-template-word.py` (kop PERSIS asli; hanya {{judul}}, {{tp}}, {{isi}} yang diisi). Kop berubah → jalankan ulang skrip.
  Dua file: lembar soal siswa (tanpa peringatan AI, keputusan pemilik) dan kunci+pembahasan+rubrik guru (dengan peringatan).
- 2026-10-14: Bobot skor per bentuk di form (bawaan AFTS: PG 2, PGK 5, B/S 3, Uraian 8). Skor diisi APLIKASI
  (`terapkanBobot`), rubrik uraian diskalakan agar jumlahnya = bobot. Set lama (tanpa `pengaturan.bobot`) tidak diubah.
- Langkah 4 (2026-10-14): banyak model lewat .env (model 1 = `AI_*`, model 2 = `AI2_*`, ... s.d. 9; lihat `.env.example`).
  Form: pilih model atau "Bandingkan semua model" (pengaturan sama, satu set per model). Tiap set menyimpan
  `info` {detik, tokenMasuk, tokenKeluar}. `AIn_EXTRA_BODY` = JSON khusus penyedia (mis. matikan "berpikir"
  `deepseek-flash`, yang kalau tidak dimatikan menghabiskan batas 8000 token untuk berpikir). Error 429/5xx dicoba ulang 2x.
- 2026-10-15: Cadangan otomatis (fallback, `tanyaDenganCadangan` di actions.ts): model gagal (saldo habis 402, kunci,
  model salah, sibuk, timeout, jawaban rusak) → pindah ke model berikutnya sesuai urutan nomor di .env. Catatan
  kegagalan disimpan di `info.catatan` dan tampil sebagai kotak kuning. Mode "Bandingkan" TIDAK pakai cadangan.
  Uji: konfigurasi `uji-cadangan` di `.claude/launch.json` (port 3002, model utama sengaja palsu).
  DeepSeek (Okt 2026) hanya menerima `deepseek-flash` dan `deepseek-v4-pro`; `deepseek-chat` sudah tidak berlaku.
- 2026-10-15: Catatan tambahan guru untuk AI (`pengaturan.catatan`, maks 500 huruf), diikuti selama tidak melanggar aturan.
- 2026-10-15: DIRENCANAKAN setelah login (langkah 5): "materi sendiri" per guru: tempel teks atau unggah Word/PowerPoint
  (PDF hanya teks Latin; teks Arab dari file TIDAK dipakai), plus kotak "Ayat & hadis terverifikasi" yang ditempel guru
  + centang konfirmasi → jadi korpus penjaga ayat. Disimpan per guru dan bisa dipakai ulang.
- 2026-10-15: RENCANA LANGKAH 5 (disetujui pemilik): Better Auth (Drizzle/PostgreSQL), nama pengguna + kata sandi,
  tanpa pendaftaran bebas (akun guru dibuat admin; reset kata sandi oleh admin). Admin pertama hanya untuk `ADMIN_USERNAME`
  di .env (+ `BETTER_AUTH_SECRET`). Sesi 30 hari. Batas 10 set/guru/hari (+ batas total web sebagai pengaman saldo).
  Set soal lama → milik admin. Dikerjakan bertahap: 5a login + pemisahan data (`guru_id`, satu fungsi pemeriksa
  pemilik untuk lihat/edit/ganti/unduh), 5b kelola akun guru + ganti kata sandi, 5c riwayat + batas per guru,
  5d halaman admin (semua set, peringatan cadangan 24 jam) + info teknis/pilihan model/bandingkan HANYA untuk admin.
- Langkah 5a (2026-10-15): login Better Auth 1.7.7 (versi dikunci). Tabel `pengguna`, `sesi`, `akun_login`, `verifikasi`
  (nama properti camelCase = nama field Better Auth). Semua halaman/aksi/unduhan wajib masuk; pemilik dicek lewat
  `bolehAkses` (src/lib/akses.ts, dites) di `ambilSet`, `cekHasil`, dan rute Word. Set orang lain dijawab "tidak ditemukan".
  Admin pertama: form di /masuk hanya saat belum ada pengguna & username = ADMIN_USERNAME; set lama tanpa pemilik → admin.
  Login lewat server action (`src/app/masuk/actions.ts`) + pembatas 5x salah/15 menit per nama pengguna (di memori).
  Email wajib di Better Auth → diisi otomatis `<username>@raciksoal.local`. Tidak pakai middleware (proxy hosting
  mengubah Host, redirect absolut bisa salah) — pemeriksaan di halaman/aksi. `.claude/launch.json` berisi env uji laptop.
- Langkah 5b (2026-10-15): /admin/guru (khusus admin: tambah guru, reset kata sandi + keluarkan semua sesinya,
  nonaktif/aktifkan via ban Better Auth) dan /akun (ganti kata sandi sendiri). Menu bersama di `src/app/kepala.tsx`.
  JANGAN pakai `changePassword({ revokeOtherSessions: true })`: itu mengganti sesi perangkat ini dan guru terlempar
  keluar; pakai `revokeOtherSessions()` terpisah. Pesan error Better Auth diterjemahkan di `src/lib/pesan-auth.ts`.
  Catatan uji: jangan jalankan `npm run build` saat server dev menyala (berbagi folder `.next`, tombol jadi mati).
- Langkah 5c (2026-10-15): /riwayat (100 set terbaru milik pengguna sendiri, klik → /?id=). Batas harian di
  `mulaiBuatSoal`: 10 set/guru/hari (admin bebas) + 100 set/hari seluruh web; hari = WIB; set "gagal" tidak dihitung.
  Sisa jatah tampil di form (`ambilJatah`), diperbarui saat set selesai/gagal. Batas lama 30/hari dihapus.
- Langkah 5d (2026-10-15): pembagian peran ditegakkan di SERVER: `ambilDaftarModel` kosong untuk guru;
  `mulaiBuatSoal` memaksa guru ke model utama (slot pertama) tanpa mode bandingkan; `cekHasil` tidak mengirim
  model/info/rincian error ke guru (pesan gagal umum). /admin/set = semua set semua guru (200 terbaru).
  Pita peringatan merah di header admin (`PeringatanAdmin` di kepala.tsx): set gagal / cadangan dipakai 24 jam terakhir.
  LANGKAH 5 SELESAI.
- Langkah 6a (2026-10-15): KISI-KISI DULU, BARU SOAL. `kerjakan`: 1 panggilan AI menyusun kisi-kisi semua nomor
  (`buatPermintaanKisi`; kolom `hasil_soal.kisi` = `BarisKisi[]`: bentuk, tp, materi, indikator gaya Kemenag, level,
  dalil_id, stimulus/skenario), dicek `periksaKisi` (jumlah per bentuk pas, dalil dikenal, teks Arab dicek penjaga ayat
  → `peringatan`), lalu tiap tahap soal ditulis mengikuti potongan kisi-kisinya; bentuk/TP/level soal disamakan dengan
  kisi (`samakanDenganKisi`). Kategori level per nomor DITENTUKAN APLIKASI (`rencanaLevel`: komposisi tepat, rata ke
  semua bentuk, urut mudah→sulit) karena AI tidak bisa menghitung komposisi (uji: minta 12/16/12, AI sendiri 13/8/19).
  Ganti soal: indikator tetap, skenario baru dicatat di kisi. Edit TP/level oleh guru ikut ke kisi. Set lama: tanpa kisi.
  Uji 40 soal PAS Sulit: 76 detik, 0 ditandai, level tepat. Skenario masih ada 2–3 yang mirip per 40 soal (jauh berkurang).
  Catatan uji: setelah mengedit file, MUAT ULANG halaman dev (HMR bisa membuat aksi server "is not defined").
- Langkah 6b (2026-10-15): Word kisi-kisi (`buatWordKisi` di word.ts, `/api/word?id=..&jenis=kisi`): A4 mendatar,
  tanpa kop (madrasah tidak punya format resmi), identitas + daftar TP + rekap LOTS/MOTS/HOTS + peringatan AI,
  tabel No. Soal | TP | Materi | Indikator | Level | Bentuk (judul kolom diulang tiap halaman). Set lama → 404.
  Cek tampilan Word di laptop: `npx tsx` skrip → docx, Word COM → PDF, PyMuPDF → PNG.
  LANGKAH 6 SELESAI.
- Langkah 8a (2026-10-15): MATERI SENDIRI. Tabel `materi` (per guru, `bab` jsonb = Bab tanpa id; id = `materi-<n>`
  saat dibaca). Halaman /materi (daftar, hapus) dan /materi/[id|baru] (judul, TP per baris "TP x.y: ..." atau nomor
  otomatis, isi maks 30.000 huruf, kotak Ayat & Hadis Terverifikasi + centang wajib). `rapikanMateri` (src/lib/materi.ts,
  dites): teks Arab di judul/TP/isi yang tidak ada di kotak ayat DIBUANG dan dilaporkan (aturan 5). `babMilik`
  (src/lib/bab.ts, sengaja bukan "use server") hanya mengembalikan materi milik guru itu (aturan 3). Set menyimpan salinan
  `hasil_soal.bab` → set tetap utuh walau materi diubah/dihapus; set lama (bab kosong) → DAFTAR_BAB. Maks 50 materi/guru.
  tsconfig `allowImportingTsExtensions` supaya file lib bisa saling impor `./x.ts` (perlu untuk `npm test`).
  BUG DIPERBAIKI: `history.replaceState(null, ...)` membuat Next memuat ulang halaman (GET ?_rsc) yang memutus
  pengecekan status → tampilan macet "0 detik" walau set selesai. Selalu pakai `history.replaceState(history.state, ...)`.
- Langkah 8b (2026-10-15): unggah .docx/.pptx di form Materi Saya, DIBACA DI BROWSER (`bacaFileOffice`,
  src/lib/office.ts, jszip 3.10.2 = sudah ada lewat docx, kini tercatat di package.json; tidak diunggah ke hosting).
  Paragraf Latin → ditambahkan ke Isi; paragraf yang hampir seluruhnya Arab → USULAN kotak ayat (kuning, sumber &
  terjemah kosong) dan centang verifikasi dikosongkan lagi. PDF/.doc/.ppt ditolak dengan pesan. Uji PPT Bab 3 pemilik:
  26/26 ayat terbaca persis sama dengan data terverifikasi (+ basmalah & doa kafaratul majelis). LANGKAH 8 SELESAI.
- Langkah 7 (2026-10-15): backup malam `~/raciksoal-app/backup.sh` (salinan `deploy/backup.sh`), cron `0 2 * * *`.
  pg_dump → gzip → `openssl enc -aes-256-cbc -pbkdf2 -iter 200000` dengan `BACKUP_PASSPHRASE` (.env hosting, diisi
  pemilik, disimpan juga di luar hosting). Dikirim ke repo privat `zahidjnd/raciksoal-backup` (deploy key TULIS khusus
  repo itu: `kunci/backup`); 7 salinan di `~/raciksoal-backup/lokal`. Hasil → `backup-status.txt` → pita merah admin
  (`PeringatanBackup` di kepala.tsx: gagal / > 36 jam). Backup manual: file kosong `~/raciksoal-app/jalankan-backup`.
  `status.txt` menyamarkan alamat database. Cara pulihkan: `deploy/pulihkan-backup.md`.
  Uji pulih 2026-10-15: backup pertama (157 KB) dibuka pemilik dan dipulihkan ke Docker laptop → 2 pengguna,
  22 set, 5 migrasi, utuh. Uji pulih ulang sesekali (mis. tiap beberapa bulan).
- 2026-10-14: Atas permintaan pemilik, teks Arab di WORD memakai Traditional Arabic 16 pt (bawaan Windows, sama
  dengan format AFTS), pengecualian dari aturan 7. Tampilan WEB tetap Amiri.
