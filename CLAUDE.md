# CLAUDE.md

## Ringkasan proyek
Web pembuatan soal berbasis AI untuk guru madrasah, mengikuti kurikulum Kemenag.
Guru memilih mapel, bab, bentuk soal, dan level kognitif. Web menyusun instruksi ke AI,
lalu menampilkan soal + kunci jawaban + kisi-kisi yang bisa diedit dan diekspor ke Word.

Tahap sekarang: **prototipe untuk pemakaian pribadi**, hanya mapel **Al-Qur'an Hadis (Qurdis) kelas 11 MA**.
Rencana: setelah lancar dipakai pemilik, dipakai 15-20 guru di Al Fatah. TIDAK untuk dijual (jangan diungkit).
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
5. **Ayat Al-Qur'an dan hadis tidak boleh dikarang AI.** Ayat diambil dari data mushaf di aplikasi (Tanzil, `public/quran/`);
   hadis dari teks yang ditempel & dicentang guru. AI hanya membuat soal dari teks itu. AI tidak pernah dipakai sebagai pemeriksa ayat/hadis.
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
- VERSI (sejak 2026-10-20, mulai 0.8.0): sebelum setiap push, naikkan versi (`npm version X.Y.Z --no-git-tag-version`;
  Z = perbaikan kecil, Y = fitur baru), tulis perubahannya dalam bahasa sederhana di `CATATAN-VERSI.md`, commit, beri
  penanda git `vX.Y.Z`, lalu kabari pemilik versinya. Nomor versi tampil di sidebar (dari package.json).
  0.9.0 = setelah daftar "Persiapan menuju 0.9.0" di CATATAN-VERSI.md beres (siap uji coba guru); 1.0.0 = setelah daftar
  "Persiapan menuju 1.0.0" beres (target setelah ASAS Ganjil, ±Desember 2026).
- SEBELUM SETIAP PUSH yang menyentuh server action / rute / halaman: jalankan `npm run uji:pemisahan` di laptop (server dev +
  Docker menyala; akun `guru.uji.ayat` = A, `guru.uji.b` = B, sandi di `.claude/akun-uji.local.txt`). Aksi/rute BARU yang
  menerima id set/materi WAJIB ditambahkan ke skrip itu.
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
- Langkah 1–9 SELESAI (per 2026-10-15).
- Langkah 9 (2026-10-15): AYAT OTOMATIS DARI DATA MUSHAF (pilihan pemilik: Tanzil "Simple" = ejaan imla'i berharakat,
  seperti teks PPT-nya). File asli Tanzil `public/quran/quran-simple.txt` (JANGAN diubah isinya, lisensi; basmalah
  kepala surah dipisah saat dibaca). `src/lib/surah.ts` = 114 nama surah + pembaca rujukan ("QS An-Nur: 2", "24:2-3",
  "An-Nur/24: 2", nama lain mis. Al-Insyirah); `src/lib/mushaf.ts` (server) = `ambil` (rujukan → teks) dan `cari`
  (teks Arab → ayat resmi + sumber, boleh potongan/beberapa ayat). Pencocokan memakai KERANGKA HURUF: harakat, tanda
  waqaf, alif/ya/waw/hamzah dibuang, ة→ه (perlu karena PPT guru bergaya mushaf Indonesia/Utsmani: الذى, زكوة, ى).
  Uji PPT laptop pemilik: 7/7 ayat ketemu, hadis tidak. Form Materi: kotak "Ambil ayat" (+ daftar surah), kotak hijau
  "dari mushaf" (teks/sumber tidak bisa diketik), unggah PPT → ayat jadi hijau, basmalah dibuang, sisanya kuning.
  SERVER mencocokkan ulang semua dalil saat simpan (`rapikanMateri(…, mushaf().cari)`): cocok → teks & sumber diganti
  versi mushaf, `mushaf: true`; centang hanya wajib bila ada dalil yang tidak cocok (hadis). Terjemah tetap diisi guru.
  Tulisan sumber Tanzil + tautan wajib (lisensi): footer layout.tsx dan kotak ayat. Akun uji laptop:
  `.claude/akun-uji.local.txt` (tidak di-commit).
  BUG DEPLOY DIPERBAIKI: build.yml dulu `cp -r public out/public`, padahal standalone sudah membuat out/public
  (template Word ikut terlacak) → file baru di public masuk ke out/public/public dan tidak ada di hosting.
  Kini `cp -r public/. out/public/`. Setelah menambah file di public/, cek di hosting (cPanel) bahwa file benar ada.
  HASIL CEK LISENSI (2026-10-15):
  - PMA 44/2016: "mushaf" = ayat lengkap ATAU sebagian, cetak maupun DIGITAL (Psl 1); yang diterbitkan/diedarkan
    wajib Tanda Tashih/Izin Edar LPMQ (Psl 2) dan mengacu Mushaf Standar Indonesia (Psl 4). Teks Al-Qur'an tidak
    berhak cipta, tapi khat/tanda baca/harakat edisi tertentu = hak cipta penerbitnya (Psl 8). Aturan teknis
    khusus aplikasi belum ada. → Untuk pemakaian pribadi/internal Al Fatah: aman, lanjut.
  - Tanzil (tanzil.net): boleh dipakai di web/aplikasi, teks tidak boleh diubah, wajib cantumkan sumber + tautan
    tanzil.net (lisensi tertulis paling jelas). Teks Mushaf Standar Indonesia digital & terjemah Kemenag: TIDAK
    ditemukan lisensi tertulis → jangan dibundel; terjemah tetap diisi guru sampai ada izin LPMQ.
  - Teks Arab di PPT pemilik = ejaan imla'i berharakat (mirip Tanzil "Simple"), BUKAN rasm Utsmani
    (فاحشة vs فٰحشة). Pencocokan ke mushaf harus mengabaikan juga beda alif/alif maqshurah/hamzah, bukan hanya harakat.
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
  Uji pulih 2026-11-05 (lulus): 22 backup malam beruntun di GitHub; backup manual 16.56 (491 KB) → container terpisah
  `raciksoal-uji-pulih` port 5434 → 10 tabel, 10 migrasi, 4 akun, 36 set (621 soal), 7 materi; aplikasi `uji-pulih`
  (launch.json, port 3003) jalan di atasnya, pemilik masuk + buka set + unduh Word. Langkah: `deploy/pulihkan-backup.md` 3c.
- 2026-10-14: Atas permintaan pemilik, teks Arab di WORD memakai Traditional Arabic 16 pt (bawaan Windows, sama
  dengan format AFTS), pengecualian dari aturan 7. Tampilan WEB tetap Amiri.
- Langkah 10a (2026-10-19): UI GAYA APLIKASI AI (pilihan pemilik, contoh A). Rencana: 10a kerangka sidebar, 10b Buat Soal
  ala kotak ketik AI + tombol pilihan, 10c hasil "mode periksa" (deret nomor, kunci dilipat, unduh menempel), 10d sentuhan
  akhir. "Minta perubahan" per soal = fitur AI terpisah, nanti. Selama langkah 10: commit di laptop, JANGAN push sampai pemilik setuju.
  10a: `Kerangka` (src/app/kepala.tsx) membungkus semua halaman setelah masuk: sidebar kiri (Set baru, 15 set terakhir via
  `ambilRiwayat` = fungsi bersama dengan /riwayat, disaring per guru; menu; Keluar), di HP dilipat dengan <details> ☰.
  Tautan ke "/" dan "/?id=" sengaja <a> biasa (BuatSoal membaca ?id= hanya saat dimuat). Sidebar belum ikut berubah
  saat set baru selesai dibuat (baru muncul setelah pindah halaman).
- Langkah 10b (2026-10-19): Buat Soal ala kotak ketik AI (`buat-soal.tsx`): sapaan + kotak "Catatan untuk AI" besar,
  tombol pilihan Bab/Tujuan/Kesulitan (select biasa bergaya chip), "N soal ▾" dan "⚙ Lanjutan" (komposisi level + model admin)
  membuka panel di bawah kotak; tombol bulat ↑ terkunci dengan alasan tertulis (jumlah/komposisi salah). Form hanya tampil
  bila belum ada set dibuka atau set gagal; saat proses tampil kotak "⏳ Sedang membuat soal...".
  PENTING: setelah `mulaiBuatSoal` berhasil → `location.assign("/?id=..")` (muat penuh, sama seperti buka dari riwayat).
  `router.replace` di tengah pengecekan status MEMUTUSNYA (macet "0 detik"); `history.replaceState` + `router.refresh()`
  mengembalikan alamat ke "/". `router.refresh()` hanya dipanggil setelah status selesai/gagal (sidebar ⏳ → selesai).
  Uji laptop: set 36–38 (2 soal PG, admin.uji) sengaja dibuat untuk tes ini.
- Langkah 10c (2026-10-19): halaman hasil "mode periksa": judul bab + info, peringatan AI (aturan 6), deret nomor (tombol,
  merah = ditandai; `lompat` pindah ke tab Soal lalu gulir ke `#soal-N`), tab Soal | Kisi-kisi (TabelKisi tidak dilipat lagi),
  kunci & pembahasan DILIPAT per kartu (`KartuSoal` prop `semuaKunci` + tombol per soal), bilah unduh Word `sticky bottom-0`
  (di HP label diringkas agar satu baris).
- Langkah 10d (2026-10-19): sentuhan akhir: kotak tunggu berputar "Sedang meracik soal..." (Tailwind animate-spin),
  tombol "Pilih file Word/PowerPoint" (input file asli `sr-only`, label jadi tombol), tombol utama/sekunder `rounded-full`,
  kartu `rounded-xl`, judul halaman `h1 text-xl` di Riwayat/Materi/Akun/Kelola Guru/Semua Set, halaman Masuk berkartu.
  Set uji laptop 39 (2 PG). LANGKAH 10 SELESAI DI LAPTOP, belum di-push (menunggu pemilik mencoba).
- Langkah 11 (2026-10-19): "MINTA PERUBAHAN" per soal. Kotak kecil + tombol "✨ Ubah" di tiap kartu (`kartu-soal.tsx`).
  Server = `gantiSatuSoal(id, no, instruksi)` (tanpa instruksi = ganti biasa): pemeriksa pemilik `ambilSet`/`bolehAkses`
  dan batas 30x per set DIPAKAI BERSAMA dengan "Ganti". Instruksi maks 300 huruf (`bersihkanInstruksi`, """ dibuang),
  dikutip di prompt dengan pesan "ikuti selama tidak bertentangan dengan aturan" (`buatPenggantiPengguna`). AI menerima
  soal lama utuh; bentuk dikunci, level/TP boleh berubah bila valid, indikator+stimulus+TP+level ikut ke kisi-kisi.
  Hasil tetap lewat `periksaSoal` (penjaga ayat). Saat "ubah", pilihan TIDAK diacak ulang. Kalau AI mengembalikan soal
  yang sama (biasanya karena menolak instruksi yang melanggar aturan, mis. minta Ayat Kursi), guru diberi tahu.
  Uji laptop set 39: "lebih sulit + santri putri Aisyah" → berubah, level C5, kisi ikut; ayat di luar bab diketik guru
  → soal ditandai merah; batas 30x → pesan. Soal 2 set 39 sengaja dibiarkan bertanda merah (bekas uji).
  Belum di-push (menunggu pemilik).
- 2026-10-19 ANTISLOP (mode after): audit `anti-slop/audit-001-2026-10-19.md` (12 temuan). Diperbaiki 2–8: kontras
  (footer Tanzil abu-600, placeholder abu-500 di globals.css), cincin fokus kotak Catatan AI, tombol HP min 44px (globals.css
  + `max-md:min-h-11` pada tautan-tombol), "Membuka set soal..." + `awalId` dari searchParams (page.tsx) agar form kosong tidak
  berkedip, `error.tsx` (Coba lagi = router.refresh + reset) dan `not-found.tsx` berbahasa Indonesia, "✨ Ubah" → "Ubah soal".
  MENUNGGU ARAH DESAIN pemilik untuk no. 1, 9, 10, 11, 12 (DESIGN.md: warna, huruf, bentuk tombol, alasan mode terang).
  PENTING: `next build` menjalankan lint; error lint = build GitHub gagal = hosting tidak berubah. Sebelum push, jalankan
  `npx next lint` (atau `npm run build` saat server dev MATI). `<a href="/">` sengaja dipakai → wajib komentar eslint-disable.
- 2026-10-19 DESAIN (DESIGN.md, pilihan pemilik: hijau saja, TANPA EMAS, bersih): token warna `hijau` #006316 (logo
  Kemenag di kop), `hijau-tua`, `hijau-muda` di `@theme` globals.css (JANGAN pakai `emerald-*` lagi); huruf Plus Jakarta
  Sans (`--font-latin`, next/font); tombol aksi `rounded-lg`, tombol pilihan `rounded-full`; tanpa emoji hiasan di tombol;
  `garis-judul` (@utility) di setiap h1 (rata tengah + `after:mx-auto`); hanya mode terang. Audit antislop 001 tertutup semua.
- 2026-10-19 GAYA CLAUDE.AI (pilihan pemilik, menggantikan motif garis judul): DESIGN.md diperbarui. Token krem di
  `@theme` (krem #FAF9F5 latar, krem-tua sidebar, krem-sorot, garis, tinta, pudar #5F5E5A); judul h1 serif Source Serif 4
  (`--font-judul`, @layer base); input/select/textarea putih di @layer base; kartu `bg-white`; semua tombol `rounded-lg`.
  Sidebar ala Claude: Set baru + menu di atas, Riwayat, profil (lingkaran huruf awal hijau → /akun) + Keluar di bawah.
  Buat Soal: sapaan serif besar + tombol cepat `CEPAT` (UH 25, PAS 25, Latihan 10 PG bobot 10) yang hanya mengisi
  pengaturan. Logo/nama/huruf khusus Anthropic TIDAK dipakai. Komposisi PAS resmi belum diketahui (preset PAS = 25 soal bawaan).
- 2026-10-19 RAPIKAN PROPORSI: garis tepi bawaan = token `batas` #DDDBD2 (@layer base; Tailwind v4 bawaannya warna teks
  = terlalu gelap); dua tinggi kontrol: `h-8` (32px) kecil & `h-10` (40px) standar, input/select 40px di @layer base, HP 44px;
  h1 24px / h2 18px serif; Riwayat & Semua Set = satu kartu `divide-y`; warna abu `gray-*` diganti `pudar`/`krem`
  (JANGAN pakai `gray-*` lagi). Ukur ulang 12 halaman: garis 1 warna, tinggi hanya 32/40 (HP 44), kontras & luberan lulus.
- 2026-10-19 BUAT SOAL MODEL KARTU (pilihan pemilik, contoh DataByte): `JENIS` (4 kartu tujuan, role=radio, klik =
  tujuan + komposisi level) dan `CONTOH_CATATAN` di buat-soal.tsx; pilihan Tujuan di kotak ketik & tombol cepat `CEPAT`
  DIHAPUS; tautan Materi saya pindah ke kalimat petunjuk. Baris kontrol kotak ketik pas-pasan di lebar 768px:
  pilihan Bab `max-w-[11rem]`, tombol Buat soal `ml-auto` (jangan tambah tombol lagi di baris itu tanpa cek ulang).
- 2026-10-19 MODE GELAP (pilihan pemilik: ikon bulan/matahari, TANPA otomatis, bawaan terang): `src/app/tombol-tema.tsx`
  menulis cookie `tema` (1 tahun, per perangkat, tidak dihapus saat Keluar); `layout.tsx` membaca cookie di server →
  `<html data-tema="gelap">` (tanpa kedipan). Nilai gelap = blok `[data-tema="gelap"]` di globals.css untuk token yang sama.
  Token baru: `kartu`, `hijau-teks`, `bahaya(-muda/-garis)`, `peringatan(-muda/-garis)`. WAJIB pakai token; JANGAN
  `bg-white`/`text-hijau` (untuk tulisan)/`red-*`/`amber-*`/`gray-*`. Uji: pindai 9 tampilan di KEDUA mode, lulus semua.
  Belum: simpan pilihan per akun di database (kalau ingin ikut ke semua perangkat guru).
- 2026-10-19 SIDEBAR LACI (pilihan pemilik, contoh Claude Android): `src/app/laci-sidebar.tsx` (client) membungkus isi
  sidebar dari `Kerangka`: satu elemen untuk laptop (fixed kiri, `md:pl-64` di pembungkus; kaki halaman Tanzil digeser
  lewat `body:has(aside[aria-label="Menu"]) > footer` di globals.css) dan HP (laci dari kiri + latar gelap, tutup ✕/
  ketuk luar/Esc/klik tautan, body overflow hidden). Visibilitas laci diatur PENGATUR WAKTU 200 ms (bukan transisi CSS
  visibility; di halaman latar belakang transisi tidak jalan → laci macet). Baris di daftar yang digulir WAJIB `shrink-0`
  (tanpa itu flex-col memeras baris jadi 24px). Uji: HP 375x600/700 & laptop 1280x700, kedua tema.
- 2026-10-19 SCROLLBAR ala claude.ai: `scrollbar-width: thin` + `scrollbar-color: var(--color-gulir) transparent` untuk `*`
  di @layer base globals.css (`*:hover` → `gulir-tegas`). Token `gulir`/`gulir-tegas` punya nilai gelap. Tanpa ::-webkit-*.
- 2026-10-19 LEBAR SIDEBAR: 288px (`xl:w-72`, `xl:pl-72`, footer 18rem @1280px) di layar >= 1280px; 256px di 768–1279px
  (lg:w-72 sempat dicoba: di 1024px tombol Buat soal turun baris). Peran (Admin/Guru) jadi baris kecil di bawah nama.
- 2026-10-20 HALAMAN MASUK DIRAPIKAN: kartu di tengah layar, lingkaran "R", slogan "Racik soal lebih cepat, hasilnya
  tetap cermat" (tanpa nama mapel, karena nanti semua mapel), ikon mata (SVG) lihat kata sandi, pesan salah = kotak
  merah `role="alert"`, catatan bawah cukup "Hubungi admin." Tanpa nama madrasah dan tanpa catatan Tanzil (disembunyikan
  lewat `body:has(#halaman-masuk) > footer` di globals.css; halaman ini tidak memuat teks Al-Qur'an). Pilihan pemilik.
- 2026-10-20 ATURAN BAKU SOAL: `ATURAN-SOAL.md` (disetujui pemilik, semua mapel MA + gaya TKA). Ubah aturan di sana dulu,
  baru di `buatSistem` (prompt.ts). Dikerjakan bertahap A–F (commit terpisah, BELUM di-push, uji coba guru lain
  menunggu semua tuntas):
  B: instruksi AI universal (`identitasBab`: mapel & kelas dari bab; data lama tanpa mapel = Qurdis XI); aturan dalil
  hanya dikirim bila materi punya dalil (tanpa dalil: AI dilarang mengutip ayat/hadis). Materi saya: kolom Mapel (+ saran
  `DAFTAR_MAPEL`) & Kelas wajib. Kop Word: penanda {{mapel}}/{{kelas}} (`scripts/buat-template-word.py --mapel-kelas`).
  Catatan guru = PRIORITAS TERTINGGI kecuali 4 kunci (`KUNCI_CATATAN`); AI membalas `tanggapan` di panggilan kisi-kisi
  → `info.tanggapan` → kotak "Tanggapan AI" di atas hasil (guru juga melihatnya). """ dibuang dari catatan.
  C: pilihan yang semuanya angka (`pilihanAngka`, format Indonesia) DIURUTKAN, tidak diacak; PGK 2 atau 3 kunci
  (`KUNCI_PGK`), petunjuk "(Pilih semua jawaban yang tepat)", penskoran PGK & Kategori 1/0 (semua benar = skor penuh).
  D: kode bentuk "BS" dipertahankan, tapi soal baru = PG kompleks KATEGORI: `pernyataan` (4), `label` (salah satu
  `LABEL_KATEGORI`), `kunci` array label. `kategoriBaru(s)` membedakan dari B/S lama (1 pernyataan) yang tetap tampil.
  E: jenis "Latihan TKA" (`TKA`): tanpa uraian (ditolak server), level bernama Pemahaman/Penerapan/Penalaran.
  Soal grup: nomor grup dari `rencanaGrup` (aplikasi, bukan AI), wacana ditulis AI di jawaban kisi-kisi
  (`pasangWacana`), disalin ke `grup`/`wacana` tiap soal & baris kisi; edit wacana ikut ke seluruh grup; ganti/ubah soal
  tetap di grupnya. Grup hanya dalam satu bentuk.
  F: Materi saya "Teks Arab: dalil / Bahasa Arab" (`bab.teksArab = "bahasa"`): Arab boleh ditulis AI, tapi potongan
  yang dikenali `mushaf().cari` sebagai ayat dan tidak persis data terverifikasi tetap ditandai (`pemeriksaArab`).
  Uji laptop: set 44 (catatan "Tanpa teks Arab"), 45 (PGK + Kategori), 46–47 (TKA, grup), 48 (Bahasa Arab TKA),
  materi-3 "Uji: Al-Madrasah" (Bahasa Arab). Belum: hadis karangan dalam mode Bahasa Arab tidak bisa dideteksi otomatis
  (hanya dicegah lewat instruksi).
- 2026-10-20 MATERI DI HALAMAN UTAMA (pilihan pemilik): urutan form = mapel & kelas (`PilihMapel`, `DAFTAR_MAPEL` +
  "Lainnya", diingat di localStorage) → `KotakMateri` (src/app/kotak-materi.tsx: tempel teks / lampirkan banyak
  .docx/.pptx / "Pakai materi sebelumnya" yang disaring mapel+kelas) → kartu jenis → kotak catatan.
  `analisaMateri` (actions.ts): `susunDraf` (materi.ts; paragraf urut, ayat → mushaf, basmalah dibuang, Arab lain →
  usulan hadis wajib centang, kecuali Bahasa Arab) lalu AI (`buatAnalisaMateri`) mengusulkan judul, TP, pokok,
  sumber/terjemah; `terapkanAnalisa` hanya memakai sumber/terjemah yang TERTULIS di teks guru. Batas 30 analisa/guru/hari
  (di memori). Draf jadi kartu yang bisa diedit; DISIMPAN OTOMATIS (`simpanMateri`) saat "Buat soal". Terjemah dalil kini
  opsional, sumber wajib. Maks 5 materi per set (`gabungBab`: TP & dalil dinomori ulang; `hasil_soal.bab_id` =
  "materi-3,materi-5"); harus satu mapel & kelas. BAB III BAWAAN tidak bisa dipilih lagi (`babMilik` hanya materi);
  file JSON-nya TETAP untuk set lama. Menu "Materi saya" dihapus dari sidebar → tautan "Kelola materi" (halaman /materi
  tetap). "Pakai materi ini lagi" di halaman hasil → `/?materi=...`.
  IDENTITAS UJIAN: `pengaturan.identitas` {semester, tahun, tanggal, waktu} (bawaan: dari tanggal, 90 menit), panel
  "Identitas ▾" di Buat Soal dan "Identitas ujian di kop Word" di halaman hasil (`ubahIdentitas`, tanpa AI). Nama
  madrasah: /admin/pengaturan (tabel `pengaturan_web`, migrasi 0007; bawaan "MADRASAH ALIYAH AL-FATAH"). Kop Word
  kini punya penanda {{sekolah}} {{hari}} {{waktu}} (skrip `--mapel-kelas` juga menambahkannya). Logo & alamat tetap.
  Uji laptop: materi-4 Fikih "Bab 2: Thaharah" (set 49), set 50 = gabungan materi-1 + materi-5.
- 2026-10-22 PDF DI KOTAK MATERI (persetujuan pemilik, library baru `pdfjs-dist` 6.4.299, dimuat hanya saat PDF dipilih,
  dibaca di browser; `legacy` build hanya untuk npm test). `paragrafPdf` (office.ts): item per baris, Arab kanan→kiri,
  NFKC (bentuk sambung), lafaz Allah Word "ّللا"→الله; baris Latin berdekatan digabung; blok Arab bertanda `TANDA_PDF`.
  Server (`susunDraf` → `ayatDariPdf`, materi.ts): blok utuh lalu per baris, juga versi terbalik, dicocokkan `mushaf().cari`;
  cocok → teks MUSHAF, tidak cocok → DIBUANG (+ pesan jumlah baris). Teks Arab PDF tidak pernah dipakai apa adanya
  (bukan usulan hadis). Hasil uji: PDF dari Word → QS An-Nur 30–31 utuh; 4 buku PDF Qurdis Kemenag (X, XI, 11, 12) teks
  Arabnya rusak semua (huruf tertukar) → 0 ayat, teks Latin terbaca. Form lama /materi tetap .docx/.pptx saja.
- 2026-10-22 SET MACET: `kerjakan` jalan di dalam proses server, jadi server restart (deploy, RAM, crash) membuat set
  tertahan "proses" selamanya. Saat server menyala (`src/instrumentation-node.ts`, setelah migrasi) SEMUA set "proses"
  ditandai "gagal" ("Terhenti karena server dinyalakan ulang...") → guru melihat pesan coba lagi, jatah kembali, admin
  dapat pita merah. Aman karena hanya ada satu proses server. Uji laptop: set 52 (palsu, salinan set terakhir) → gagal.
- 2026-10-22 SOAL TAMPIL BERTAHAP (ide dari Teachy, disetujui pemilik): `kerjakan` menyimpan draf `soal`
  (`periksaSoal`, TANPA `ratakanKunci`/`terapkanBobot`) setelah tiap tahap, status tetap "proses". Selama proses halaman
  menampilkan kisi-kisi (`<details>`, terbuka sampai draf pertama ada) + `KartuSoal draf` (tanpa kunci/edit/ganti/ubah;
  server memang menolak edit & Word sebelum "selesai"). `cekHasil(id, denganBab)`: bab dikirim sekali saja selama
  proses, browser mempertahankannya. Uji laptop set 53 (25 soal): kisi 10 dtk, draf 10 soal 23 dtk, 20 soal 39 dtk,
  selesai 49 dtk. Belum dicek tampilan HP (panel browser tidak tampil saat uji).
- 2026-10-22 BARIS BARU (0.9.1, temuan pemilik di soal Bahasa Arab: hiwar menyambung): tiga sebab → (1) `prompt.ts` kini
  menyuruh AI menulis dialog/hiwar, daftar, puisi, langkah SATU BAGIAN PER BARIS ("\n" di JSON); (2) web memakai
  `whitespace-pre-line` pada pertanyaan, pilihan, pernyataan, pembahasan (`kartu-soal.tsx`); (3) Word: `teks()` di
  `word.ts` (kini export) memecah per "\n" jadi `TextRun({break:1})` (library docx TIDAK mengubah \n sendiri).
  Set lama tidak berubah (teksnya sudah satu baris): pakai "Ubah soal" ("tulis hiwar per baris") atau Edit. Tabel
  sungguhan belum ada (daftar fitur nanti, bersama rumus). Uji laptop: set 51 soal 1 (diedit jadi 4 baris), docx contoh.
- 2026-10-23 BARIS ARAB RTL (0.9.2, temuan pemilik: hiwar Arab acak urutannya, harus dari kanan): sebab = potongan Arab
  di paragraf LTR (titik dua, nomor, angka terlempar). Kini `pecahBaris` (soal.ts; baris kosong dibuang, `arab` =
  `paragrafArab`) dipakai web (`TeksBaris` di kartu-soal.tsx: baris pertama sebaris dengan nomor, baris Arab berikutnya
  blok `dir="rtl"` rata kanan font Amiri) dan Word (`butirBaris`/`parBaris` di word.ts: tiap baris satu paragraf,
  baris Arab `bidirectional` + `AlignmentType.START` + run RTL utuh). Berlaku untuk pertanyaan, pilihan, wacana,
  pernyataan (web), pembahasan (web). Baris campur Latin+Arab (hampir semua Latin) tetap LTR dengan potongan `bdi`.
  Set lama ikut membaik (perbaikan ada di tampilan). Kendala diketahui: kunci/rubrik/pernyataan di Word masih memakai
  `teks()` (pindah baris dalam satu paragraf, belum RTL). Uji laptop: set 51 soal 1 + docx contoh (4 paragraf bidi).
- 2026-10-23 UNDUH WORD ERROR 500 (0.9.3, bug LAMA, terlihat di hosting set 30 judul berhuruf Arab; log: "Cannot convert
  argument to a ByteString ... 1575"): nama file dari `bab.judul` masuk header Content-Disposition mentah. Kini
  `headerUnduh` (src/lib/nama-file.ts, dites) mengirim `filename` ASCII + `filename*=UTF-8''...` (nama asli).
  0.9.5: baris Arab di Word TIDAK lagi satu run utuh (itu membuat "(1)"/"Teks 1" berfont Arab 16 pt): `parBaris`
  memakai `teks()` (potongan Arab 16 pt + sisanya Times 11 pt) di dalam paragraf `bidirectional`; web: blok RTL
  berisi `<Teks>`. Judul bagian Word + petunjuknya `keepNext` (tidak tertinggal di dasar kolom). Aturan menahan
  soal (`keepNext` per soal) SENGAJA tidak diubah: Word tidak bisa "boleh pindah kolom tapi jangan pindah halaman".
  0.9.6: pemilik minta DILONGGARKAN (susah merapikan manual): `keepNext` hanya stem→A, A→B, D→E; wacana soal grup
  hanya `TAHAN_WACANA`=3 baris terakhir + jarak ikut soal (header→baris 1). Akibat: soal bisa terbelah di antara B
  dan C, juga di dasar halaman (Word tak membedakan kolom/halaman). Cek keepNext di XML: library docx menulis
  `<w:keepNext w:val="false"/>` untuk false, jadi periksa nilainya, jangan hanya adanya tag.
  0.10.0 BENTUK BARU Menjodohkan (`MJ`) dan Isian (`ISIAN`): urutan bentuk di SEMUA tempat = PG, PGK, BS, MJ, ISIAN,
  URAIAN (`URUTAN_BENTUK` soal.ts, `NAMA_BENTUK` prompt.ts; Word/form mengikuti kunci NAMA_BENTUK). MJ: AI menulis
  `pasangan` (5 benar) + `pengecoh` (1); `susunMenjodohkan` (soal.ts) mengacak lajur kanan (tidak boleh sejajar dengan
  premis, ada cadangan geser) dan menyusun `premis`/`jawaban`/`kunci` huruf; dipanggil di `kerjakan` DAN `gantiSatuSoal`.
  `keFormatAI` = kebalikannya untuk "Ubah soal". Skor MJ per pasangan (bobot/5; bawaan 5). ISIAN: `kunci` + `kunciAlt`
  (hanya pegangan guru), `periksaIsian` (bagian kosong, ≤ 6 kata, jawaban tak bocor). MJ & ISIAN ditolak di Latihan TKA
  (`TANPA_TKA` di buat-soal.tsx + bersihkanPengaturan). `bagiTahap`: MJ berbobot 2 (`BERAT_TAHAP`).
  PELAJARAN: JANGAN menjumlah bentuk satu per satu (bug nyata: `PG+PGK+BS+URAIAN` di kerjakan membuat bentuk baru
  terlewat → baris kisi kosong → set gagal "reading 'bentuk'"). Pakai `jumlahSoal()` (prompt.ts, dites). Skrip Python
  lewat heredoc: `\n` menjadi baris baru sungguhan; pakai `chr(92)` atau alat Edit untuk teks ber-backslash.
  Uji laptop: set 56 (Bahasa Arab, 2 MJ + 2 ISIAN: tampil, Edit, Ubah soal, 3 unduhan Word OK); set 55 gagal (bug di atas).
  CATATAN UJI: Word COM (`ExportAsFixedFormat`) macet bila Word pemilik sedang terbuka; proses WINWORD buatan skrip
  harus dimatikan satu per satu (jangan sentuh dokumen pemilik).
  CARA LIHAT LOG HOSTING tanpa SSH: `~/raciksoal-app/app.log` (lewat konektor cPanel `read_file`). Uji laptop: judul set 51
  diubah sementara jadi Arab → soal/kunci/kisi 200; judul dikembalikan.
- 2026-11-04 AUDIT (`AUDIT-2026-11-04.md`, pemilik bilang "gas sesuai saran"), dirilis 0.11.0 + 0.11.1:
  Tampilan: kop ujian di form Buat Soal kini DILIPAT (<details>, tetap di bawah mapel & kelas, ringkasan terlihat);
  tanggal ditulis ulang gaya Indonesia (`hariTanggal` dipindah ke prompt.ts, dipakai word.ts juga); deret nomor soal
  satu baris geser di HP; peringatan Arab penjaga ayat dipecah per baris RTL (`TeksPeringatan`, kartu-soal.tsx);
  Simpan/Batal juga di atas form Edit; riwayat sidebar 2 baris (label + tanggal · jumlah soal).
  Fitur: ganti nama set (`hasil_soal.nama`, riwayat/judul/nama file Word) dan hapus set = HAPUS LUNAK
  (`hasil_soal.dihapus`, migrasi 0008): tetap dihitung di jatah harian, ditolak di cekHasil/ambilSet/identitas/Word,
  admin melihat label "dihapus guru"; pulihkan lewat DB (`dihapus = null`). Set "proses" tidak bisa dihapus.
  Tambah soal serupa (`tambahSoalSerupa`, AI, di bawah soal itu, ikut batas 30x per set, maks MAKS_SOAL) dan hapus soal
  (`hapusSoal`, min 1 soal); kisi-kisi ikut dan dinomori ulang (`nomoriUlang`).
  Kode: semua penulisan isi set lewat `denganSetTerkunci` (transaksi + SELECT FOR UPDATE). Ganti/ubah/tambah: AI
  dipanggil di LUAR kunci, lalu ditulis ke isi terbaru; kalau soal itu berubah selama AI bekerja → pesan "muat ulang".
  `mulaiBuatSoal`: hitung jatah + insert dalam satu transaksi dengan `pg_advisory_xact_lock(4210)`; plus batas set
  "proses" serentak 2/guru (admin bebas) dan 10/web. Batas waktu total: `TENGGAT_SET` 10 menit per set,
  `TENGGAT_SATU_SOAL` 4 menit (ganti/ubah/tambah/analisa); `tanyaAI(..., sampai)` memendekkan timeout & coba ulang.
  Uji laptop: set 56 (hapus soal 2, tambah setelah soal 3, edit soal 2 tetap ada, nama "UH Bahasa Arab — uji nama"),
  set 55 dihapus (set gagal bekas uji), set 57 (1 PG, cek Buat soal masih jalan). Belum diuji: balapan klik ganda
  sungguhan dan tenggat (perlu model lambat palsu).
  REVISI (pilihan pemilik, gaya claude.ai): Ganti nama & Hapus set HANYA lewat riwayat sidebar: tombol ⋯ (laptop
  muncul saat diarahkan, HP selalu tampil) atau klik kanan → menu (`src/app/baris-riwayat.tsx`). Ganti nama langsung di
  baris (Enter/klik luar = simpan, Esc = batal). Tombol di judul halaman hasil dan "Hapus dari riwayat" di set gagal
  DIHAPUS. Uji laptop: set 57 diganti nama lalu dihapus lewat menu.
  0.11.1: sidebar menandai halaman yang dibuka (`TautanMenu` = usePathname untuk menu; riwayat lewat prop `setAktif`
  dari page.tsx → `BarisRiwayat aktif`); tombol Set baru berlatar polos, "+" di lingkaran hijau, tidak pernah ditandai.
- 2026-11-04 PAKET KECIL sebelum uji coba guru (pemilik "gas 1 per satu"), dirilis 0.12.0:
  (1) Login: kunci salah kata sandi per PERANGKAT+nama (5x/15 mnt) + per nama dari semua perangkat (30x), di
  `src/lib/pembatas.ts` (dites). IP = nilai TERAKHIR X-Forwarded-For (yang paling depan bisa dipalsukan).
  (2) Kartu soal: pesan "Tersimpan ✓" 4 detik setelah Edit (juga setelah Ganti/Ubah berhasil).
  (3) /admin/guru: ringkasan pemakaian per akun (set hari ini dari jatah, 30 hari, token, set terakhir) + total web.
  `BATAS_PER_GURU`/`BATAS_TOTAL` kini di pembatas.ts (dipakai actions.ts juga). "Terakhir masuk" SENGAJA tidak dipakai:
  baris `sesi` terhapus saat guru Keluar → yang tampil "set terakhir" dari hasil_soal.
  (4) /panduan (src/app/panduan/page.tsx): panduan singkat statis, tautan "Panduan" di sidebar untuk semua akun.
  Nama tombol di panduan ditulis persis seperti layar: kalau tombol diganti nama, ubah juga panduannya.
- 2026-11-05 GELOMBANG 1 (pemilik "gas gelombang 1", setelah uji coba guru), dirilis 0.13.0:
  (1) Kunci ringkas: `kunciRingkas` (src/lib/kunci.ts, dites) = kunci per bentuk, nomor global, PG sebaris; kotak + tombol
  Salin di halaman hasil. `navigator.clipboard` diblokir di sebagian browser (juga panel browser Claude) → cadangan:
  pilih teks <pre> + `document.execCommand("copy")`.
  (2) Tombol ↑/↓ di kartu soal (`pindahSoal`, lewat `denganSetTerkunci`): tukar dengan tetangga HANYA bila bentuk sama
  (urutan bagian di Word baku) dan bukan soal grup; kisi-kisi ikut ditukar + `nomoriUlang`.
  (3) Pencarian/saringan riwayat (`src/app/saring-set.tsx`: formulir GET biasa, `bacaSaringan` membersihkan nilai alamat,
  `syaratSaringan` → SQL berparameter; mapel set lama = "Al-Qur'an Hadis"). /riwayat: cari, jenis, mapel. /admin/set:
  + guru, status (termasuk "dihapus guru"). `ambilRiwayat(guruId, batas, saring?)`. Tautan "Lihat & cari semua riwayat"
  di sidebar selalu tampil bila ada set.
  (4) Cetak dari web: blok mode gelap globals.css kini `@media screen` (cetak selalu terang); `@media print` di akhir
  globals.css + `print:hidden` (bilah HP, latar laci, deret nomor, tab, bilah unduh, identitas, teks bantuan) + semua
  `button` disembunyikan; pembungkus Kerangka punya kelas `kerangka`. Tombol "Cetak" (window.print) di bilah tab.
  Cek tampilan cetak tanpa mode cetak: salin aturan @media print dari document.styleSheets ke <style> sementara.
  CATATAN UJI: kata sandi `admin.uji` di DB laptop sudah tidak cocok dengan `.claude/akun-uji.local.txt` (diganti saat
  pemilik mencoba); /admin/set dengan saringan belum dicoba di browser. Akun guru uji masih cocok.
  (5) MENU UNDUH (pilihan pemilik): bilah bawah halaman hasil = SATU tombol hijau "Unduh" (`MenuUnduh` di buat-soal.tsx,
  terbuka ke atas): "Semua file (3 Word)" = 3 unduhan berurutan jeda 800 ms (sengaja BUKAN ZIP: guru di HP bingung
  membuka ZIP), lalu tiap file satu per satu, lalu "Cetak tampilan ini (PDF)" (tanpa kop, cek cepat). Tombol Cetak
  terpisah di bilah tab DIHAPUS. PDF berkop tidak bisa dibuat di hosting (butuh Word/LibreOffice di server); guru
  disarankan menyimpan Word sebagai PDF. Panduan bagian 3 ikut diperbarui (+ Kunci ringkas, ↑/↓, cari riwayat).
  Uji tanpa benar-benar mengunduh: ganti sementara `HTMLAnchorElement.prototype.click` untuk mencatat alamat, lalu fetch.
- 2026-11-05 GELOMBANG 2 langkah 1: PAKET A/B/C/D (pemilik "1 1 aja, nomor 1 dulu"), dirilis 0.14.0 bersama jendela Unduh:
  `susunPaket(soal, setId, paket)` (src/lib/paket.ts, dites, dipakai server & browser): Paket A = urutan asli; paket lain
  pakai pengacak bersemi (mulberry32, seed dari id set + paket) → hasil SAMA setiap diunduh dan ikut editan terbaru,
  TANPA kolom/tabel baru. Diacak: urutan soal di dalam tiap bagian bentuk (soal grup = satu unit), pilihan PG/PGK lewat
  `ratakanKunci` (kunci tetap merata, pilihan angka tetap urut; aman karena prompt melarang pembahasan menyebut huruf),
  lajur kanan MJ lewat `keFormatAI` → `susunMenjodohkan`. `asal[i]` = indeks soal di Paket A.
  Word: `/api/word?...&paket=A..D` (tanpa parameter = file lama tanpa label). Lembar soal: "PAKET B" di atas soal pertama
  (BUKAN di kop, supaya kop asli utuh). Kunci: judul "— PAKET B" + "PADANAN NOMOR PAKET B → PAKET A" di akhir. Kisi-kisi
  hanya urutan Paket A. Menu Unduh: "Jumlah paket" 1–4 (diingat per set di localStorage `raciksoal-paket-<id>`);
  Semua file = soal tiap paket + kunci tiap paket + kisi. Kunci ringkas menampilkan kunci tiap paket.
  Cek isi docx di browser tanpa menyimpan file: fetch → baca ZIP (DecompressionStream "deflate-raw") → word/document.xml.
  Uji laptop: set 51, 2 paket: soal B no.1 = soal A no.6, kunci isi sama, padanan lengkap.
  REVISI UI (pilihan pemilik, tanpa ZIP): menu Unduh sesak diganti JENDELA (`JendelaUnduh`, <dialog> bawaan +
  showModal: Esc/latar gelap/fokus dari browser; HP = panel dari bawah selebar layar). Dua pilihan: (1) Paket A–D
  multi-pilih, (2) centang file (soal/kunci/kisi); daftar "Akan diunduh N file" + tombol "Unduh N file"; tautan kecil
  "Cetak tampilan ini". Pilihan paket per set di localStorage `raciksoal-paket-<id>` (JSON array); hanya ["A"] = file
  tanpa label paket. Kunci ringkas mengikuti paket terpilih. Setter memakai bentuk FUNGSI (lama => baru): klik beruntun
  cepat dulu saling menimpa (terlihat saat uji otomatis).
- 2026-11-05 GELOMBANG 2 langkah 2: SOAL MANUAL (LJK & lembar penilaian uraian DICORET pemilik: madrasah punya LJK
  sendiri; rubrik sudah di file kunci). Dirilis 0.15.0. `tambahSoalManual(id, isian)` (actions.ts): tanpa AI, tidak
  memakai jatah/batas 30x; `rapikanSoal` + `kurangLengkap` (pesan isian kurang) + `periksaSoal` (penjaga ayat) lewat
  `denganSetTerkunci`; disisipkan di AKHIR bagian bentuknya, baris kisi "(soal tulisan guru)" + `nomoriUlang`; TKA menolak
  MJ/ISIAN/URAIAN. UI: `TulisSoalSendiri` (kartu-soal.tsx) = tombol bergaris putus "+ Tulis soal <bentuk> sendiri" di akhir
  tiap bagian + pilihan "bentuk lain" di bawah; formulir = `FormSoal` (prop `judul`) dengan `soalKosong`; skor bawaan =
  skor soal sebentuk di set, atau BOBOT_BAWAAN. Uji laptop set 51: PG manual masuk no. 11, kisi 26 baris, lalu dihapus lagi.
- 2026-11-05 PERAPIAN KEAMANAN (pemilik "gas 1-4"), dirilis 0.16.0. Daftar "Persiapan menuju 1.0.0" di CATATAN-VERSI.md.
  (1) `scripts/uji-pemisahan.mts` (`npm run uji:pemisahan`, env UJI_A/UJI_B = nama:sandi, hanya localhost): masuk lewat
  `/api/auth/sign-in/username`, memanggil server action lewat HTTP (header `Next-Action`, id dari
  `.next/server/server-reference-manifest.json`; mode dev: halaman dibuka dulu agar aksinya terkompilasi), 30 pemeriksaan.
  Dibuktikan bisa gagal: pemeriksa pemilik `cekHasil` dirusak sementara → GAGAL. Akun `guru.uji.b` dibuat langsung di DB
  laptop (hash `better-auth/crypto` hashPassword). Tidak jalan di GitHub (tanpa DB/server).
  (2) Tabel `pemakaian_ai` (migrasi 0009): baris per Ganti/Ubah/Tambah yang BERHASIL (ditulis di transaksi yang sama)
  dan per analisa materi (dihitung saat mencoba). `BATAS_UBAH_PER_GURU` 60 & `BATAS_ANALISA` 30 di pembatas.ts; admin
  bebas. `ambilSet` kini juga mengembalikan `saya`. Penghitung analisa di memori DIHAPUS.
  0.16.1: rute `src/app/api/auth/[...all]/route.ts` DIHAPUS (pintu HTTP Better Auth melewati pembatas halaman Masuk;
  aplikasi hanya memakai `auth.api...` di server). JANGAN dipasang lagi tanpa pembatas. Tes kini masuk lewat formulir
  /masuk (isian tersembunyi `$ACTION_...`, seperti browser tanpa JS) dan mengecek 5 pintu /api/auth → 404 (34 pemeriksaan).
  Diuji di browser: masuk, kunci 5x salah, tambah guru, nonaktif/aktifkan, reset sandi, ganti sandi Akun, Keluar.
  CATATAN DOCKER LAPTOP: port 5432 juga dipakai `datainduk-db-1` (proyek lain, autostart). Untuk uji: hentikan itu,
  nyalakan `raciksoal-db`; kalau port tidak muncul (`5432/tcp` saja) → `docker network connect bridge raciksoal-db` lalu
  start ulang. Setelah selesai, kembalikan: stop raciksoal-db, start datainduk-db-1.
- 2026-11-05 (0.16.2, pilihan pemilik): "Reset kata sandi" admin MEMBUKA kunci salah sandi nama itu (`pembatasMasuk.buka`).
  Pembatas kini satu objek bersama `pembatasMasuk` di pembatas.ts (disimpan di globalThis), dipakai masuk/actions.ts dan
  admin/guru/actions.ts. Diuji: guru.uji.ayat dikunci 5x salah → admin reset (sandi sama) → langsung bisa masuk.
- 2026-11-05 (0.16.3): `cekHasil` mengirim `jatahUbah` {set, batasSet, hari, batasHari} (hari = null untuk admin; null
  selama proses). `KartuSoal` prop `jatahUbah`: baris sisa di menu Lainnya; habis → Ganti/Tambah/Ubah `disabled` + alasan
  (server tetap memeriksa). Pesan habis per set = `PESAN_BATAS_SET` (actions.ts). Diuji set 54: jumlah_ganti 30 → pesan
  set; 60 baris pemakaian_ai → pesan hari; data uji dibersihkan (set 54 jumlah_ganti = 1).
- 2026-11-05 (0.16.4): cek HP 375px saat set dibuat (set uji 58, 12 soal). Baris status "Masih meracik" (buat-soal.tsx)
  `sticky top-[57px] md:top-3` (57px = tinggi bilah menu HP di laci-sidebar.tsx; ubah bersama bila bilah berubah).
  `TabelKisi`: petunjuk geser `md:hidden`. Sidebar sudah ikut berubah saat set selesai (`router.refresh()`, sejak 10b).
  Cara melihat keadaan draf tanpa AI: salin `soal` set ke tabel sementara, set `status='proses'` + soal dipotong, lalu
  kembalikan (jangan restart server selama itu: set proses ditandai gagal saat server menyala).
- 2026-11-05 (0.16.5) UJI MODEL di laptop (deepseek-flash, gemini-3.5-flash-lite, claude-opus-5-5 di slot 1/2/3 .env laptop):
  Claude lewat endpoint format OpenAI MENGABAIKAN `response_format` dan kadang membungkus JSON dengan ```json → set gagal
  "bukan JSON". Kini `buangPagar` (ai.ts, dites) di `tanyaAI` membuangnya untuk semua model. Gemini flash-lite: 503 "high
  demand" 2x (pemilik: lewati). Hasil: DeepSeek tetap utama (cepat/murah/stabil); Opus soalnya lebih matang tapi mahal.
  Kedua model: kunci Isian bisa bocor di pilihan soal lain (belum diatasi). Set uji laptop 58–64.
- 2026-11-05 (0.17.0, pemilik "gas") PERBAIKAN OTOMATIS 1x: di akhir `kerjakan`, tiap soal dengan `peringatan` dikirim
  ulang ke AI lewat `buatPenggantiPengguna(..., instruksi = daftar masalah)` (jalur "ubah"), lalu `samakanDenganKisi`
  + `susunMenjodohkan` + `periksaSoal`; dipakai hanya bila bersih. Catatan di `info.perbaikan` (BUKAN `info.catatan`:
  itu memicu pita merah admin & hitungan cadangan), tampil hanya untuk admin. Tidak memakai jatah. Ganti/Ubah/Tambah
  tidak ikut. Kasus asal: set 40 hosting (Opus pihak ketiga) PGK dengan 4 kunci benar: AI menulis "pilihan" dulu baru
  "kunci", jadi terlanjur. Uji laptop set 65: DeepSeek soal 2 "Jumlah pilihan bukan 5" → diperbaiki, 0 ditandai.
  Jalur "masih merah"/"gagal" belum teruji langsung.
- 2026-11-05 (0.17.1) PERINGATAN MATERI SEDIKIT: `MATERI_SEDIKIT` = 300 huruf (kotak-materi.tsx; 500 terlalu rewel: materi uji
  "Etos Kerja" 490 huruf soalnya bagus). Server sudah menolak < 100 huruf saat analisa. `daftarBabMilik` (bab.ts) kini
  mengirim `huruf` (jumlah huruf `bab.materi`). Hanya peringatan, tidak memblokir. Asal: set 40 hosting (Matematika XI,
  materi = perintah "kelas 11") → AI mencampur K13 kelas XI + Kurikulum Merdeka kelas X.
- 2026-11-05 (0.17.2) JAWABAN BOCOR ANTARSOAL: ATURAN-SOAL.md 2b no. 11 + baris di `buatSistem`; daftar "soal yang sudah
  dibuat" kini `ringkasSudah` (prompt.ts, dites): pertanyaan + "→ jawaban:" (PG/PGK teks pilihan kunci, isian kunci).
  Uji laptop set 66 (12 soal, 2 tahap): prompt memuat jawaban, TAPI isian no. 11 (kunci "ḥissī") masih bocor dari
  pilihan benar PG no. 2. Aturan saja belum cukup; calon langkah: pemeriksa aplikasi (huruf dinormalkan, ḥ=h).
- 2026-11-05 (0.17.3) PEMERIKSA KUNCI ISIAN BOCOR: `bocorDi` di `periksaSoal` (soal.ts, dites): kunci isian (`polos`: NFD
  tanpa diakritik, huruf kecil, batas kata) ada di pertanyaan/pilihan/pernyataan/premis/jawaban soal LAIN → peringatan
  "Jawaban isian sudah tertulis di soal nomor N". Hanya jalan bila periksaSoal diberi seluruh set (kerjakan); Ganti/Edit
  memeriksa satu soal → tidak dicek. Pindai semua set laptop: 4 dari 7 isian bocor, keempatnya sungguhan.
  Perbaikan otomatis: diperiksa bersama seluruh set; bila bocor, instruksi "tanyakan konsep LAIN" (ditaruh di depan,
  instruksi dipotong 300 huruf) dan `indikator` AI menggantikan indikator kisi (+ kisi disimpan saat selesai).
  `ambilSoal` kini menerima `"soal": {...}` atau soal tanpa pembungkus. Uji set 68: 2 bocor → 2 diperbaiki, 0 merah,
  tapi soal 9 & 10 hasil perbaikan mirip satu sama lain. Uji lewat skrip (panel browser tersembunyi): server action
  `mulaiBuatSoal` dipanggil seperti di uji-pemisahan.mts.
- 2026-11-07 (0.18.0 + 0.18.1, pemilik "gas") REVISI ATURAN SOAL: "Mudah" tidak menghapus stimulus HOTS; khilafiyah =
  madrasah merujuk SEMUA mazhab (soal sebut pendapat siapa / tanyakan perbedaannya, pendapat sah lain bukan pengecoh);
  ejaan KBBI + transliterasi tanpa ā/ḥ kecuali mode Bahasa Arab (nama surah tetap gaya Kemenag dari data mushaf);
  nama tokoh beragam; uraian wajib berbatasan + rubrik ikut. Pemeriksa baru di `periksaSoal`: `kunciTerpanjang` (PG,
  kunci terpanjang & >= 1,5x rata-rata pengecoh, kunci < 15 huruf dilewati; diukur 274 PG lama: 60% kunci terpanjang)
  dan `PILIHAN_TERLARANG` (PG/PGK: "semua benar/salah", "tidak ada yang benar", pilihan yang HANYA huruf "A dan B").
  ATURAN-SOAL.md: tanda 🆕 dihapus, 🔍 = juga diperiksa aplikasi.
  AUDIT `AUDIT-SOAL-2026-11-07.md`: set laptop 69 (Fikih), 70 (Ekonomi ASAS 25), 71 (Biologi TKA), materi 7–9, dibuat
  lewat skrip server action (cara uji-pemisahan.mts; materi dimasukkan langsung ke tabel `materi`). Temuan utama:
  3/52 kunci SALAH dari AI sendiri (`jawaban_ai` sudah salah: AI menulis pilihan & kunci sebelum menghitung di
  pembahasan); 4 pembahasan menunjuk "pengecoh kedua" (salah setelah diacak). Usulan perbaikan urut prioritas ada di
  file audit, MENUNGGU keputusan pemilik.
- 2026-11-07 (0.18.2, pemilik "gas 1, 2, 4" dari audit): PG: AI menulis `langkah` + `jawaban_benar` SEBELUM pilihan;
  `cekJawabanBenar` (soal.ts) mencocokkan dengan pilihan kunci (polos tanpa spasi) → merah bila beda/tidak ada →
  perbaikan otomatis. `periksaSoal` MEMBUANG kedua field itu (jangan disimpan: Edit guru membuatnya basi; field tanpa
  jawaban_benar = tidak dicek). `GABUNGAN_NOMOR` (PGK saja) dan `URUTAN_PILIHAN` (pembahasan PG/PGK "pengecoh kedua").
  Uji ulang set laptop 72 (Ekonomi ASAS 25) & 73 (Biologi TKA 15): kunci benar semua, tanpa merah palsu; 3 isian
  set 72 tetap merah karena bocor sungguhan (masalah terbuka). Skrip uji: buat-set.mts di scratchpad (tidak di repo).
- 2026-11-07 (0.18.3) ISIAN BOCOR: `BarisKisi.jawaban` = rencana jawaban isian (diminta di kisi lewat `RENCANA_ISIAN`, hanya
  bila ada ISIAN; disimpan di kisi, tidak dipakai Word); `laranganIsian(kisi)` (prompt.ts, jawaban berangka dilewati)
  dikirim sebagai `tambahan` di SETIAP tahap; `tulisKisi` menulis "Jawaban (kunci)". `bocorDi` kini mengembalikan
  `nomor ("potongan")` + menghitung isian lain berkunci sama; perbaikan otomatis memakai batas instruksi 800
  (`buatPenggantiPengguna(..., maksInstruksi)`). Uji laptop set 74 (Fikih: 1 tetap merah, karena kisi merencanakan PG
  no. 1 dan isian no. 10 untuk konsep sama) & 75 (Ekonomi: 0 merah, dulu 1–3).
- 2026-11-07 (0.19.0, sisa audit): `acakPernyataan` di `ratakanKunci` (soal.ts): pernyataan Kategori + kunci diacak (ikut
  Paket B–D), DILEWATI bila pembahasan cocok `URUTAN_PERNYATAAN` ("pernyataan pertama/2") — sengaja tanpa tanda merah,
  karena soal lama & tulisan guru banyak memakai urutan. HOTS tanpa stimulus: C4–C6, bukan MJ, tanpa wacana/dalil,
  pertanyaan < 80 huruf (diukur di DB laptop). `mjMirip`: 3+ isi lajur sama dengan MJ sebelumnya. `ringkasSudah` kini
  memuat isi lajur MJ & pernyataan Kategori. Rubrik: contoh skor sebagian + `kepalaPermintaan` memberi tahu
  "Jumlah skor rubrik setiap soal URAIAN harus tepat <bobot>" (tanpa itu `terapkanBobot` menskalakan angka, teks
  "3 = …" tidak ikut → tidak cocok; ketahuan saat uji set 76). Uji laptop set 76–78. Temuan baru: MJ "pengelompokan"
  (jawaban berulang) dan isian bocor dari kisi-kisi yang konsepnya bertabrakan, belum dikerjakan.
- 2026-11-07 (0.19.1): MJ wajib satu-satu (`RENCANA_MJ` di kisi bila ada MJ + aturan bentuk MJ). Di perbaikan otomatis
  (`kerjakan`): MJ dengan peringatan "Dua premis memakai jawaban yang sama"/"Ada premis atau jawaban yang sama" = `kelompok`
  → boleh ganti sisi materi + indikator kisi diperbarui (seperti `bocor`). Isian bocor: instruksi perbaikan ditambah
  `kataTerpakai(soal, i)` (soal.ts: pilihan/isi lajur/kunci isian soal lain, ≤ 6 kata, maks 80), batas instruksi
  perbaikan 2000. Uji laptop set 79–80 memakai akun `guru.uji.b` + materi-10 (salinan materi-8), karena guru.uji.ayat
  kena batas 10 set/hari. Sisa: isian berjawaban angka ("10%") sama dengan hasil soal hitungan lain.
- 2026-11-07 RUJUKAN.md (peta dasar setiap aturan: R1 resmi, R2 kaidah, R3 keputusan madrasah, R4 belum ada dasar).
  Ubah aturan → ATURAN-SOAL.md, lalu RUJUKAN.md, baru kode. PDF rujukan di `dokumen/rujukan/` sengaja TIDAK di-commit.
- 2026-11-07 TP DIPUTUSKAN GURU (celah A1 RUJUKAN.md; versi "AI hanya menyalin" sempat dibuat lalu diganti atas pilihan
  pemilik, karena guru sering membuat UH sederhana / tidak punya TP tertulis): `buatAnalisaMateri` menyuruh AI menyalin
  TP yang tertulis, dan baru mengusulkan TP bila teks tanpa TP. `terapkanAnalisa`: TP yang `tertulis` (min 15 huruf)
  tetap berkode asli ("TP 2.1"); selebihnya usulan → `isian.tpUsulan` (+ `tpDibaca` false). `KartuDraf`: hijau "TP dari
  materi Anda" / kuning "usulan AI" + centang "sesuai dengan yang saya ajarkan"; tombol Buat soal terkunci
  (`alasanTerkunci`); `rapikanMateri` menolak `tpUsulan` tanpa `tpDibaca` (penanda dikirim balik browser, bukan disimpan
  di bab). Materi lama & form /materi tidak terpengaruh. Uji laptop (guru.uji.b, Ekonomi): tanpa TP → 4 usulan,
  tpUsulan true; dengan TP → tersalin persis, tpUsulan false. Tampilan kartu belum dilihat (panel browser tersembunyi).
  Dirilis 0.20.0.
- 2026-11-08 LATIHAN TKA = CONTOH RESMI (celah A2 RUJUKAN.md, pemilik "gas"): `ATURAN_TKA` (prompt.ts) masuk lewat
  `kepalaPermintaan` hanya bila tujuan TKA (kisi, soal, ganti/ubah, perbaikan otomatis): MCMA 2–4 benar + petunjuk baku
  "Pilihlah jawaban yang benar! Jawaban benar lebih dari satu.", Kategori 3 pernyataan, label resmi (+ Setuju, Logis di
  `LABEL_KATEGORI`). `namaLevelTka(mapel)`: Bahasa Arab / Bahasa Indonesia & Inggris punya nama level sendiri (form Lanjutan +
  teks aturan TKA). Pemeriksa dilonggarkan untuk SEMUA jenis: `KUNCI_PGK` [2,3,4], `PERNYATAAN_BOLEH` [3,4] (jenis lain tetap
  diminta 2–3 kunci & 4 pernyataan lewat BENTUK_SOAL). BELUM: grup campur bentuk (Word per bagian bentuk).
  Uji laptop set 81 (guru.uji.b, materi-10, TKA 2 PG + 4 PGK + 4 Kategori): petunjuk baku di semua PGK, Kategori 3
  pernyataan, label resmi, 0 merah. TAPI keempat PGK berkunci 2 (AI tidak meragamkan 2–4).
  PERBAIKAN (pemilik "perbaiki dulu"): `pasangKunciPgk(kisi, tka)` (prompt.ts, dites) dipanggil di `kerjakan` setelah
  kisi-kisi: PGK `kunciPgk` bergiliran 2,3,4 (TKA) / 2,3 (lain); BS `jumlahPernyataan` 3 (TKA) / 4. `tulisKisi` menulis
  "Jumlah jawaban benar: N" / "Jumlah pernyataan: N"; ganti soal juga. BENTUK_SOAL di `buatSistem` TIDAK BOLEH lagi
  menulis angka tetap ("2 ATAU 3", "tepat 4 pernyataan"): set 82 membuktikan angka sistem mengalahkan aturan TKA & kisi.
  Uji laptop: set 83 TKA → rencana 2,3,4,2, hasil 3,3,4,3 (AI enggan 2; sengaja tidak dipaksa lewat perbaikan otomatis,
  karena semua tetap sah 2–4), Kategori 3 semua; set 84 ASAS → PGK 2,3,2,3 persis, Kategori 4, petunjuk madrasah.
  DOCKER LAPTOP 2026-11-08: update Docker Desktop (15.56) mengganti mesin ke "docker-vmm" (`EngineTypeWindows` di
  `%APPDATA%\Docker\settings-store.json`) → folder data baru kosong, semua kontainer "hilang". Dipulihkan dengan mengembalikan
  nilai itu ke "wsl2" (cadangan: `settings-store.json.cadangan-sebelum-wsl2`); data lama di `%LOCALAPPDATA%\Docker\wsl\disk`
  utuh (80 set, 10 materi, 5 akun). Kalau kontainer hilang lagi setelah update, cek nilai itu dulu.
