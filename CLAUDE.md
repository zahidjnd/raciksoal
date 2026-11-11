# CLAUDE.md

## Ringkasan proyek
Racik Soal: web pembuatan soal berbasis AI untuk guru MA Al-Fatah, mengikuti kurikulum Kemenag. Guru memasukkan materi
(tempel / Word / PowerPoint / PDF), memilih jenis ujian & jumlah soal; aplikasi menyusun kisi-kisi, soal, kunci, pembahasan,
rubrik, lalu mengekspor ke Word dengan kop madrasah. Alamat: raciksoal.alfatahmas.com. Repo privat `zahidjnd/raciksoal`.

Tahap sekarang: **0.x = uji coba guru** (semua mapel, 15–20 akun guru Al-Fatah). 1.0.0 = setelah daftar "Persiapan menuju
1.0.0" di `CATATAN-VERSI.md` beres (target setelah ASAS Ganjil, ±Desember 2026). TIDAK untuk dijual (jangan diungkit).
Admin hanya akun pemilik.

## Tentang pemilik proyek
- Pemilik adalah guru Qurdis, **pemula dalam pemrograman** (full vibe coding).
- Jelaskan setiap langkah dengan bahasa awam, singkat, dalam Bahasa Indonesia.
- Setelah selesai mengerjakan sesuatu, jelaskan: apa yang dibuat, cara mengetesnya, dan apa langkah berikutnya.
- Kalau ada pilihan teknis, rekomendasikan satu saja beserta alasannya. Jangan beri terlalu banyak opsi.
- Diskusi dulu: jangan mengubah file, commit, atau push sebelum pemilik bilang "gas". Push selalu ditanyakan terpisah.

## Peta dokumen
| File | Isi |
|---|---|
| `README.md` | Dokumentasi teknis lengkap: fitur, arsitektur, folder, database, `.env`, deploy, hosting, backup, pemecahan masalah |
| `PRD.md` | Tujuan & ruang lingkup produk |
| `ATURAN-SOAL.md` | Aturan baku penulisan soal (disetujui pemilik). Ubah aturan di sini dulu → `RUJUKAN.md` → baru kode (`prompt.ts`) |
| `RUJUKAN.md` | Dasar setiap aturan (R1 resmi, R2 kaidah, R3 keputusan madrasah, R4 belum ada dasar) |
| `DESIGN.md` | Arah tampilan (warna, huruf, tombol) |
| `CATATAN-VERSI.md` | Riwayat versi dalam bahasa sederhana + daftar persiapan 1.0.0 |
| `dokumen/riwayat-pengembangan.md` | Catatan harian LENGKAP 14 Okt – 9 Nov 2026 (alasan tiap keputusan, nomor set uji). Cari di sana bila perlu |
| `dokumen/audit/` | Hasil audit (fitur, mutu soal, tampilan) |
| `deploy/` | Salinan skrip hosting (`jalan.sh`, `backup.sh`) + `pulihkan-backup.md` |
| `dokumen/rujukan/`, `dokumen/proposal/` | PDF peraturan & proposal: sengaja TIDAK di-commit |

## Stack
- Next.js 15 (TypeScript, `output: "standalone"`) + Tailwind CSS v4. Drizzle (`pg`) + PostgreSQL (bukan Prisma: RAM 1 GB).
- Login: Better Auth 1.7.7 (versi dikunci), nama pengguna + kata sandi, akun dibuat admin.
- Ekspor Word: library `docx` (+ cetakan `public/word/template-soal.docx`). jszip, pdfjs-dist (PDF, dibaca di browser).
- Model AI: adapter satu `fetch` format OpenAI (`src/lib/ai.ts`), diatur di `.env` (`AI_*`, `AI2_*` … s.d. 9; lihat
  `.env.example`). Utama DeepSeek (`deepseek-flash`); model gagal → cadangan berikutnya. Harus tetap bisa diganti lewat pengaturan.

## Hosting (batasan penting)
Hosting: DomaiNesia paket Nimbus Go (shared hosting, cPanel).
- Tersedia: Node.js, NPM, Yarn, PM2, PostgreSQL, SSH, Git Deploy Manager, cron jobs
- RAM 1 GB, Entry Process 12 (batas proses serentak)
- PostgreSQL hanya bisa diakses dari hosting itu sendiri (tidak ada remote PostgreSQL)
- Backup bawaan hanya mingguan dan bulanan (backup malam sendiri: lihat README bagian 12)
- **Jangan menjalankan `next build` di hosting** (RAM kurang). Build di laptop atau GitHub, lalu unggah hasilnya.
- Pembuatan soal bisa 30-60 detik. Tampilkan indikator "sedang membuat soal..." dan jangan asumsikan streaming pasti jalan.
- Deploy: push `main` → GitHub Actions build → branch `deploy` → cron hosting `*/7` menjalankan `~/raciksoal-app/jalan.sh`
  (≤ 7 menit). Setelah push cukup tunggu build GitHub sukses; jangan menunggu cron. Node di 127.0.0.1:3101 lewat `.htaccess`.
- Log hosting tanpa SSH: `~/raciksoal-app/app.log`, `status.txt` (konektor cPanel `read_file`). Restart: file kosong `restart`.

## Aturan keras (jangan dilanggar)
1. Kunci API AI **hanya di server**, disimpan di file `.env`. Jangan ditulis di kode, jangan ke browser, jangan ke GitHub. Pastikan `.env` ada di `.gitignore`.
2. **Jangan membaca, mengubah, atau menampilkan isi `.env`.**
3. Data tiap guru **harus terpisah**: guru A tidak boleh bisa membuka soal guru B. Periksa ini di setiap fitur yang menyimpan atau membaca data.
4. Batasi jumlah pembuatan soal per guru per hari, dan pasang batas waktu (timeout) pada pemanggilan AI.
5. **Ayat Al-Qur'an dan hadis tidak boleh dikarang AI.** Ayat diambil dari data mushaf di aplikasi (Tanzil, `public/quran/`);
   hadis dari teks yang ditempel & dicentang guru. AI hanya membuat soal dari teks itu. AI tidak pernah dipakai sebagai pemeriksa ayat/hadis.
6. Setiap hasil soal wajib ada peringatan: "Soal dibuat AI, wajib diperiksa guru sebelum dipakai."
7. Teks Arab: pakai font Arab yang jelas (Amiri atau Scheherazade) dan dukung arah tulisan kanan ke kiri (RTL).
   Pengecualian pemilik: di WORD teks Arab memakai Traditional Arabic 16 pt (sama dengan format AFTS).
8. Jangan menambah library besar atau mengubah stack tanpa bertanya dulu.
9. Jangan menghapus data atau file tanpa konfirmasi.

## Cara kerja
- Bangun **sedikit demi sedikit**, satu fitur per langkah. Jangan membuat seluruh web sekaligus.
- Gunakan Git. Commit setelah setiap langkah yang berhasil, dengan pesan yang jelas.
- Sebelum mengubah banyak file, jelaskan rencananya dulu dan minta persetujuan.
- Minta AI membalas dalam **format JSON terstruktur**, bukan teks bebas, supaya soal bisa diedit per butir dan diekspor.
- Simpan prompt dan nama model yang dipakai pada setiap hasil, untuk keperluan membandingkan kualitas.
- VERSI: sebelum setiap push, naikkan versi (`npm version X.Y.Z --no-git-tag-version`; Z = perbaikan kecil, Y = fitur baru),
  tulis perubahannya dalam bahasa sederhana di `CATATAN-VERSI.md`, commit, beri penanda git `vX.Y.Z`, lalu kabari pemilik
  versinya. Nomor versi tampil di sidebar (dari package.json).
- SEBELUM SETIAP PUSH yang menyentuh server action / rute / halaman: jalankan `npm run uji:pemisahan` di laptop (server dev +
  Docker menyala; akun `guru.uji.ayat` = A, `guru.uji.b` = B, sandi di `.claude/akun-uji.local.txt`). Aksi/rute BARU yang
  menerima id set/materi WAJIB ditambahkan ke skrip itu.
- Sebelum push juga: `npm test`, `npx tsc --noEmit -p .`, `npx next lint` (error lint = build GitHub gagal = hosting tidak berubah).
- Kalau terjadi error, jelaskan penyebabnya dengan bahasa sederhana sebelum memperbaiki.
- Catatan keputusan baru: tulis SINGKAT di bagian "Keputusan yang berlaku" atau "Jebakan" di bawah (bukan log harian panjang).
  Rincian uji (nomor set, angka ukur) cukup di pesan commit / `dokumen/riwayat-pengembangan.md`.

## Peta kode (yang paling sering disentuh)
| File | Isi |
|---|---|
| `src/app/actions.ts` | Server action utama. `kerjakan` = alur membuat set (kisi → periksa kembar → tahap soal → perbaikan otomatis) |
| `src/lib/prompt.ts` | Semua instruksi AI (`buatSistem`, `buatPermintaanKisi`, `buatPengguna`, `buatPenggantiPengguna`, aturan TKA/ASAS) |
| `src/lib/soal.ts` | Tipe data + pemeriksa aplikasi (`periksaSoal`, `periksaKisi`, penjaga Arab, `bocorDi`, `tahunAsing`, MJ) |
| `src/lib/mapel.ts` | Sifat mapel: daftar 20 mapel Al-Fatah, Bahasa Arab/Nahwu, eksak, Bahasa Inggris, sejarah |
| `src/lib/materi.ts` | Materi guru: `rapikanMateri` (simpan), `susunDraf` (dari teks/file), `terapkanAnalisa` |
| `src/lib/mushaf.ts`, `surah.ts` | Data mushaf Tanzil: `ambil` (rujukan → ayat), `cari` (teks Arab → ayat resmi) |
| `src/lib/word.ts` | Tiga file Word: lembar soal (cetakan kop), kunci & pembahasan, kisi-kisi |
| `src/lib/akses.ts`, `bab.ts`, `pembatas.ts` | Pemeriksa pemilik (aturan 3), materi milik guru, batas harian & kunci login |
| `src/app/buat-soal.tsx`, `kotak-materi.tsx`, `kartu-soal.tsx`, `kepala.tsx` | Form & hasil, kartu materi, kartu soal, sidebar |
| `scripts/uji-pemisahan.mts` | Uji pemisahan data guru A/B lewat HTTP |

## Keputusan yang berlaku (ringkas; alasan & tanggal di `dokumen/riwayat-pengembangan.md`)
- **Penjaga ayat**: teks Arab dari AI harus substring persis data bab (korpus = seluruh bab); tidak cocok → soal merah.
  AI menampilkan ayat lewat `dalil_id`, tidak mengetik ulang. Mode "bahasa" (Bahasa Arab, Nahwu): Arab bebas, hanya yang
  dikenali `mushaf().cari` sebagai ayat dijaga. Ayat dicocokkan memakai kerangka huruf (harakat/alif/hamzah dibuang).
- **Materi**: ayat otomatis dari mushaf (kotak hijau); hadis = sumber + centang guru; tulisan Arab ≤ 3 kata = istilah, diterima
  apa adanya (`istilahArab`); teks Arab bukan dalil = tombol "Bukan ayat/hadis" (`bukan: true`, tanpa sumber & centang).
  Teks Arab dari PDF tidak pernah dipakai apa adanya (hanya penunjuk ayat). TP: tertulis di materi = hijau; usulan AI = wajib dicentang.
- **Alur set**: kisi-kisi dulu (level per nomor ditentukan aplikasi `rencanaLevelSet`, AI tidak bisa menghitung komposisi) →
  AI memeriksa kisi untuk baris kembar lintas bentuk → soal BERTAHAP maks 10 per panggilan (`bagiTahap`) → `periksaSoal` →
  perbaikan otomatis 1x untuk soal merah (isian bocor: 3 calon, dipilih yang bersih). Jalan di belakang (`hasil_soal.status`),
  Kembar (0.31.2): `miripIndikator` menyamakan kata kerja sinonim dulu (menentukan/menilai kebenaran perhitungan = menghitung);
  jawaban isian yang sudah tertulis di indikator/materi baris sebelumnya = "pasti kembar". Isian bocor: tahun ("92 H") ikut
  `laranganIsian` & dicari di pilihan; perbaikan diberi `jawabanAman` (nama/tahun materi yang belum tertulis) dan calon yang
  indikatornya kembar baris lain ditolak (set 117: "PPnBM" vs "Pajak Penjualan atas Barang Mewah").
  browser cek tiap 3 detik, draf tampil bertahap. Server menyala → set "proses" ditandai gagal. Tenggat 10 menit per set.
- **Bentuk**: PG, PGK, BS, MJ, ISIAN, URAIAN (urutan baku `URUTAN_BENTUK`; jumlah selalu lewat `jumlahSoal()`). Gaya lama
  Al-Fatah untuk semua jenis kecuali TKA: B/S satu pernyataan (kunci direncanakan aplikasi), MJ satu nomor = satu pasangan
  dalam blok (`blokMj`), Ganti/Ubah/Tambah AI ditolak untuk MJ. TKA: Kategori 3 pernyataan, PGK 2–4 kunci, soal grup.
  Kunci PG diratakan aplikasi; pilihan angka diurutkan; skor diisi aplikasi (`terapkanBobot`).
- **Jenis**: UH, AFTS (`PTS`), ASAS (`PAS`: format surat Kepala MA, eksak 35 / non-eksak 45, skor 100), Latihan, Latihan TKA
  (mapel di luar TKA tampil "Latihan Gaya TKA").
- **Sifat mapel** (`mapel.ts`): Bahasa Inggris = semua isi untuk siswa berbahasa Inggris + petunjuk Word Inggris, pembahasan
  Indonesia; sejarah (SKI, Al-Quds, Sejarah) = tahun di bagian soal yang benar wajib ada di materi. Dalil & khilafiyah berlaku
  untuk SEMUA mapel. Ijtimaiyyah, PJOK, BK sengaja tidak dimasukkan.
- **Batas**: 10 set/guru/hari (admin bebas) + 100/web; 2 set proses serentak/guru; Ganti/Ubah/Tambah 30x per set & 60/guru/hari;
  analisa materi 30/guru/hari; halaman PDF dibaca AI 100/guru/hari; login dikunci 5x salah/15 menit per perangkat+nama. Batas ada di `pembatas.ts`.
- **Pesan masuk** (0.32.5, pilihan pemilik): "nama tidak terdaftar" / "kata sandi salah" terpisah (kolom yang salah saja
  dikosongkan). Lebih dari 10 nama tak terdaftar per IP/15 menit → pesan umum saja (`samar`), TIDAK mengunci (satu IP madrasah).
- **Peran**: guru hanya model utama, tanpa info teknis; admin = semua set, pilihan model, Bandingkan, pita peringatan.
- **Akun** (0.32.0): guru mengganti nama tampil sendiri (`updateUser`; sapaan menyebut gelar depan + nama depan), bawaan
  Set baru di tabel `preferensi_guru` (mapel diajar → optgroup "Mapel saya" & yang pertama terpilih, kelas, menit, kesulitan,
  catatan tetap = MENGISI kotak Catatan untuk AI, bukan instruksi tersembunyi), pemakaian hari ini, keluarkan perangkat lain.
  Penghitung pemakaian & `ambilPreferensi` di `lib/pemakaian.ts` (BUKAN file "use server": ekspor di sana = bisa dipanggil browser).
  Tab (0.32.3) lewat `?tab=` (profil+pemakaian / bawaan / keamanan), hanya tab terpilih yang dirender server. Laptop
  (0.32.4): `Kerangka lebar="pengaturan"` = 1536px rata kiri; kartu berdampingan lewat container query `@3xl`. Kotak kata
  sandi = `KataSandi` dari `masuk/form.tsx` (tombol mata sama dengan halaman masuk).
- **Panduan** (0.32.0): "Mulai cepat" 4 langkah + 8 gambar `public/panduan/*.webp` (tangkapan layar HP bertanda merah
  bernomor; nomor `<N>` di teks = nomor tanda), topik & tanya-jawab dalam `<details>` (`BukaLipatan` membuka lipatan dari
  `#id`). Tombol/tampilan berubah → perbarui teks DAN ambil ulang gambarnya: foto HP 375 px di preview (akun guru.uji.b,
  sembunyikan `nextjs-portal`), koordinat CSS di `scripts/panduan-gambar.json`, lalu `scripts/panduan-tandai.py`.
- **Form Set baru**: file bisa diseret ke kotak materi (sama dengan Lampirkan). Teks tempelan yang belum dipakai disimpan
  di localStorage `raciksoal-draf-materi` (`DRAF_TEKS`, hanya halaman Set baru), dihapus setelah materinya tersimpan di server.
- **Set**: hapus = hapus lunak (`dihapus`, tetap dihitung jatah); ganti nama & hapus lewat menu ⋯ riwayat sidebar.
  Paket A–D diacak bersemi (`susunPaket`), tanpa tabel baru. Set menyimpan salinan bab (`hasil_soal.bab`).
- **Tabel** (0.28.0): ditulis di TEKS soal/wacana/pembahasan sebagai baris `| a | b |` (bukan kolom data baru), dikenali
  `pecahBaris` → `TabelData` (web) / `tabelData` (Word). Tabel Word/PPT materi → baris `|` di `office.ts`. Tidak di pilihan.
- **Rumus** (0.29.0): LaTeX `$...$` di teks mana pun (`POLA_RUMUS` gaya Pandoc di soal.ts: "US$ 5" bukan rumus). Web: KaTeX
  dimuat dinamis (`Rumus` di kartu-soal, salah tulis → teks asli). Word: `rumus.ts` LaTeX → OMML (subset; perintah tak
  dikenal → LaTeX dicetak apa adanya). Jawaban AI: `betulkanGarisMiring` (ai.ts) menggandakan `\` di dalam `$...$` sebelum
  JSON.parse. Materi Word: Equation → `$LaTeX$` (`ommlKeLatex`, office.ts). Angka/satuan biasa tanpa `$` (pilihan angka tetap diurutkan).
  Edit: tombol "Σ Rumus" + klik rumus di Pratinjau → MathLive (`editor-rumus.ts`, dimuat dinamis, huruf dari CSS KaTeX).
  Jendelanya SENGAJA bukan `<dialog>` modal (papan ketik MathLive tak terlihat di atasnya).
- **Gambar** (0.30.0): tabel `gambar` (bytea JPEG ≤ 1280 px, dikecilkan di browser `src/app/gambar.tsx`; server cek SOF
  `ukuranJpeg`). `bab.gambar` = [{id, keterangan}], soal & kisi `gambar_id` (kisi merencanakan, `samakanDenganKisi`
  memaksa). 0.33.3: nomor BERGAMBAR ditentukan aplikasi di permintaan kisi (1 per 5 soal non-MJ & non-B/S gaya lama,
  maks jumlah gambar, tersebar); "usahakan"/"minimal N" tidak dituruti AI. AI melihat gambar (pesan pengguna, sebelum teks; `AIn_GAMBAR=0` = tidak dikirim): kisi = semua gambar, tahap
  = gambar baris tahap itu saja. Gambar baru dari Edit disahkan `sahkanGambarBaru` (milik pemilik set) → masuk salinan
  bab set. Akses `/api/gambar/[id]` = pemilik/admin. Gambar PDF belum diambil (0.31.0: halaman PDF → AI).
  Analisa materi: `office.ts` menandai letak gambar `[[GAMBAR n]]` (dibuang dari isi oleh `susunDraf`), browser mengirim
  pratinjau ≤ 384 px/25 KB (maks 20, batas kiriman aksi 1 MB), AI menilai pakai/tolak + keterangan
  (`rapikanNilaiGambar`; tempelan guru selalu pakai; `lihatGambar` false → semua dipakai).
- **PDF dibaca AI** (0.31.0): browser memfoto halaman (pdf.js, 1600 px, `intent: "print"` WAJIB: tanpa itu render
  memakai requestAnimationFrame yang berhenti di tab tersembunyi) → aksi `bacaHalamanPdf` (1 halaman/panggilan, JSON
  `blok` teks/tabel/arab/gambar, `buatBacaHalaman`) → `rapikanBacaanHalaman` (materi.ts) → paragraf seperti file Word.
  Cakupan kata vs pdf.js < 85% → teks pdf.js (`cakupanKata`). 0.33.2: teks lapisan pdf.js ikut dikirim sebagai
  contekan angka (`paragrafPdf(..., pangkat)` menandai `^{-30}`; Arab dibuang di server) → minus pangkat Fisika 43/43;
  kepala halaman & nomor halaman dibuang `buangKepalaHalaman` (patokan teks asli, ≥ 40% halaman, min. 4). Arab: blok → TANDA_PDF (penunjuk mushaf); lafal di
  teks/tabel → `potongAyat` dari ayat halaman itu, selain itu dibuang; mode bahasa: Arab dipertahankan. Gambar dipotong
  di browser dari kotak 0–1000 (+1,5% tepi) → ikut alur gambar 0.30.0. Batas `BATAS_HALAMAN_PDF` 100/guru/hari
  (`pemakaian_ai.jenis = "halaman"`), `MAKS_HALAMAN_PDF` 30 sekali lampir (bawaan 10). 0.33.0: file PDF maks 100 MB
  (dibaca di browser, tidak diunggah), tebal buku bebas (batas 300 hanya untuk "teks saja"), isi materi DAN total
  gabungan satu set maks 100 ribu huruf (`BATAS_MATERI.isi`; biaya token sebanding panjang), kiriman aksi 2 MB.
- **Word**: kop dari cetakan asli (`scripts/buat-template-word.py`, jalankan ulang bila kop berubah); penanda {{judul}} {{tp}}
  {{isi}} {{mapel}} {{kelas}} {{sekolah}} {{hari}} {{waktu}}. Baris Arab = paragraf RTL. Nama file lewat `headerUnduh`.
- **Tampilan** (`DESIGN.md`): gaya claude.ai, token warna di `@theme` globals.css (krem, hijau #006316, tinta, pudar, bahaya,
  peringatan). WAJIB pakai token: JANGAN `gray-*`, `red-*`, `amber-*`, `emerald-*`, `bg-white`. Tinggi kontrol 32/40 px (HP 44).
  Mode gelap lewat cookie `tema` + `[data-tema="gelap"]`. Sidebar laci 256/288 px.
- **Backup**: malam 02.00 di hosting → terenkripsi → repo privat `zahidjnd/raciksoal-backup`; cara pulihkan `deploy/pulihkan-backup.md`.

## Jebakan teknis (pernah memakan waktu)
- Kolom waktu WAJIB `timestamp(..., { withTimezone: true })` (tanpa itu jam +7). Perubahan tabel lewat file SQL di `drizzle/`.
- `history.replaceState` selalu dengan `history.state` (null membuat Next memuat ulang & memutus cek status). Setelah
  `mulaiBuatSoal` pakai `location.assign`, bukan `router.replace`. Tautan ke "/" dan "/?id=" sengaja `<a>` biasa (+ eslint-disable).
- Tidak pakai middleware (proxy hosting mengubah Host). Halaman `force-dynamic` (hosting punya cache depan).
- Better Auth: jangan `changePassword({ revokeOtherSessions: true })`; rute `/api/auth/[...all]` sengaja DIHAPUS (melewati
  pembatas login) — jangan dipasang lagi.
- Library docx: `\n` tidak jadi baris baru sendiri (pakai `teks()`); `keepNext: false` tetap ditulis sebagai tag → cek nilainya.
  Kop lembar soal ada di `word/header*.xml`.
- pdf.js 6 butuh `wasmUrl` untuk gambar JPEG 2000/JBIG2 (PDF scan, mis. LuraDocument): tanpa itu halaman terfoto KOSONG
  tanpa error. `predev`/`prebuild` menyalin `node_modules/pdfjs-dist/wasm` → `public/pdfjs-wasm/` (gitignore); `bukaPdf` menunjuknya.
- Jangan `npm run build` saat server dev menyala (berbagi `.next`). Setelah mengedit, MUAT ULANG halaman dev (HMR bisa membuat
  aksi server "is not defined").
- Menulis kode lewat skrip Python/heredoc: backslash bisa berubah (`\n`, `\b` rusak). Untuk teks ber-backslash pakai alat Edit.
- Baris di daftar yang digulir (flex-col) WAJIB `shrink-0`. Visibilitas laci sidebar diatur pengatur waktu, bukan transisi CSS.
- Form `action={...}` React 19 MENGOSONGKAN semua kotak setelah dikirim (juga saat salah). Supaya hanya kotak salah yang
  kosong: `onSubmit={kirimTanpaKosong(...)}` (masuk/form.tsx) TETAP bersama `action=` (tanpa action, klik sebelum halaman
  siap = GET → kata sandi masuk alamat; skrip uji-pemisahan juga butuh action).
- `navigator.clipboard` diblokir di sebagian browser → cadangan `document.execCommand("copy")`.
- Claude lewat endpoint OpenAI mengabaikan `response_format` → `buangPagar` membuang ```json. DeepSeek hanya menerima
  `deepseek-flash` / `deepseek-v4-pro`; "berpikir" dimatikan lewat `AIn_EXTRA_BODY`.
- Prompt: jangan menulis angka tetap di BENTUK_SOAL (mengalahkan kisi & aturan TKA); aturan khusus jenis/mapel lewat blok terpisah.

## Laptop & pengujian
- DB: Docker `raciksoal-db` di **127.0.0.1:5440** (`.env.development.local` hanya berisi `DATABASE_URL`). Docker Desktop tidak
  otomatis menyala: `docker desktop start`. Akses: `docker exec raciksoal-db psql -U <POSTGRES_USER>`. Kalau kontainer "hilang"
  setelah update Docker, cek `EngineTypeWindows` = "wsl2" di `%APPDATA%\Docker\settings-store.json`.
- Server dev: `.claude/launch.json` (config `dev` port 3000; `uji-cadangan` 3002; `uji-pulih` 3003) lewat preview_start.
- Akun uji (DB laptop saja): `.claude/akun-uji.local.txt` — jangan ditulis ulang di chat.
- Membuat set uji tanpa browser: panggil server action lewat HTTP seperti `scripts/uji-pemisahan.mts` (header `Next-Action`, id
  dari `.next/server/server-reference-manifest.json`). guru.uji.ayat sering kena batas 10 set/hari → pakai guru.uji.b.
- Cek isi Word: unduh → buka ZIP → `word/document.xml`. Word COM macet bila Word pemilik terbuka.
- Data uji laptop yang sengaja disimpan: set 51, 56, 85, 88 (contoh di catatan), materi 6/8/10 (Qurdis/Ekonomi), 14 (istilah
  Arab), 15 (Bahasa Inggris), 16 (SKI). Cadangan DB sebelum bersih-bersih: `%TEMP%\cadangan-raciksoal\`.

## Masalah terbuka / tertunda
- Isian bocor di materi SANGAT pendek (SKI 6 paragraf, 18 soal) kadang tetap 1 merah (0.31.2: set 118), pesannya menyarankan
  mengurangi isian. Istilah berhuruf kecil belum masuk `jawabanAman`.
- MJ kadang mencampur istilah & sifat dalam satu blok (ditunda: tunggu contoh guru). Wacana grup TKA kadang "dijahit"
  dari dua topik agar memuat dua indikator (set 126: golongan darah + katup jantung); soal tetap bisa dijawab.
- Diuji 11 Nov 2026 (lulus, tanpa ubah kode): 4 Buat serentak → 2 jalan; 3 serentak di jatah ke-9 → 1; tenggat (dipendekkan
  sementara) → gagal rapi, tak memakan jatah, guru melihat pesan awam; 13 saringan /admin/set = hitungan DB; TKA grup PG/PGK/
  Kategori utuh di Paket B; PDF Geografi (tabel) & Sejarah hasil scan terbaca utuh. PDF buku asli mapel non-PAI belum.
- Persiapan 1.0.0 di luar kode: saldo DeepSeek, tanya-jawab di Panduan, pemakaian saat ASAS.
