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

## Persiapan menuju 1.0.0 (dipakai resmi) — SELESAI, dirilis 24 November 2026
Target awal: setelah ASAS Ganjil (sekitar Desember 2026); semua butir beres lebih cepat (pemilik, 24 Nov).
- [x] Dipakai sungguhan oleh sebagian besar guru untuk ujian resmi (ASAS Ganjil). Cek: kolom set 30 hari di **Kelola guru**.
- [x] 2–4 minggu berturut-turut tanpa masalah penghalang (guru tidak bisa membuat soal atau mengunduh Word).
      Keluhan guru diperbaiki sambil berjalan; setelah itu pemakaian lancar. Kendala baru tetap diperbaiki sambil jalan.
- [x] Backup malam berjalan rutin (pita merah backup tidak muncul) dan uji pulih diulang. **5 November 2026: lulus**
      (backup 22 malam berturut-turut tanpa terlewat; backup manual 16.56 dibuka, dipulihkan tanpa error, isi utuh,
      aplikasi jalan di atasnya dan pemilik bisa masuk, membuka set, mengunduh Word). Tetap pantau pita merah sampai 1.0.0.
- [x] Saldo AI cukup untuk satu semester. Saldo DeepSeek diisi $20 (November 2026). Hitungan (5 November 2026,
      rincian lengkap di `dokumen/Hitungan-Biaya-AI-RacikSoal.pdf`):
      - Dasar: ekspor DeepSeek 7 Okt–5 Nov 2026 = 230 panggilan, 1,79 juta token, $0,41 untuk ±34 set.
        Per set ±53.000 token (±41.000 masuk, ±12.000 keluar), biaya dibulatkan **$0,015 (±Rp271)**, sudah termasuk
        Ganti/Ubah/Tambah dan analisa materi. Kurs Rp18.050/USD. Semua angka di bawah + cadangan 50%.
      - **Realistis (20 guru, setahun)**: aplikasi ramai hanya saat AFTS/ASAS (4 kali setahun, ±4 set per guru per ujian
        = 320 set), hari biasa ringan (±1 set per guru per bulan = 200 set). Total ±520 set, ±41 juta token,
        **±$11,7 = ±Rp211 ribu setahun**. Satu musim ujian ±80 set = ±Rp32 ribu.
      - **Hitungan kasar (batas atas)**, set per guru per tahun = ulangan harian + ujian + latihan/coba-coba:
        hemat 72 set (UH 2 mingguan) = ±$32 = **±Rp585 ribu**; sedang 122 set (UH mingguan) = ±$55 = **±Rp991 ribu**;
        rajin 198 set = ±$89 = **±Rp1,61 juta** setahun.
      - Saran: isi saldo bertahap (±$15 cukup untuk setahun realistis), pengingat saldo DeepSeek di $5, cek halaman
        Usage sebelum tiap AFTS/ASAS, hitung ulang setelah ASAS Ganjil dengan data sungguhan.
        Pengaman aplikasi: maks. 100 set/hari seluruh web = biaya terburuk ±$1,5 (±Rp27 ribu) per hari.
- [x] Guru mandiri dengan Panduan; pertanyaan yang sering muncul dimasukkan ke Panduan.
- [x] Tes otomatis pemisahan data antar guru (guru B tidak bisa membuka/mengedit/mengunduh set guru A). Sejak 0.16.0.
- [x] Batas harian per guru untuk Ganti/Ubah/Tambah soal. Sejak 0.16.0.

Ditunda (setelah 1.0.0 atau bila dibutuhkan): bank soal (direncanakan dulu), katalog CP/TP, rumus/gambar/tabel.
Dicoret: lembar penilaian uraian (rubrik ada di file kunci). LJK: dulu dicoret, sejak 1.0.0 direncanakan sebagai
aplikasi kedua **Koreksi LJK** (foto dari HP / unggah dari laptop, nilai dihitung otomatis; kartu "Segera hadir").

---

## 1.3.0 — 26 November 2026
- **Ubah kunci** di halaman ujian Koreksi LJK: ganti huruf kunci yang salah ketuk; nilai semua lembar yang sudah
  dipindai dihitung ulang otomatis, tanpa memindai ulang.
- Akun, Kelola guru, dan Tentang aplikasi tampil dengan sidebar aplikasi yang terakhir dibuka (Racik Soal atau
  Koreksi LJK). Tentang aplikasi punya isi khusus Koreksi LJK (cara kerja, aturan nilai, arti analisis butir).
- Bulatan huruf kunci di HP tidak lagi lonjong.

---

## 1.2.0 — 26 November 2026
- **Koreksi LJK di laptop**: mengetuk nama siswa membuka pilihan file foto LJK (webcam laptop tidak lagi menyala).
- **Unggah banyak foto** (laptop & HP): pilih banyak foto LJK sekaligus (mis. hasil scan atau kiriman WA). Foto dibaca
  satu per satu; tiap lembar menampilkan potongan tulisan nama, guru memilih nama siswanya, lalu Simpan & berikutnya
  (atau Lewati / Berhenti). Foto yang tidak terbaca disebut namanya di akhir supaya bisa difoto ulang.
- Layar kamera HP: tautan di bawah kini "Pilih foto dari galeri".

---

## 1.1.4 — 26 November 2026
- Kotak izin kamera Koreksi LJK memakai tulisan yang sama dengan tombol Chrome ("Izinkan saat mengunjungi situs").
  Bila kamera diblokir: langkah bernomor lewat **⋮ → Kontrol situs → Izin → Kamera → Izinkan** (ikon di samping
  alamat web kadang tidak tampil).

---

## 1.1.3 — 26 November 2026
- **Izinkan kamera sejak awal.** Di HP, halaman Koreksi LJK menampilkan kotak "Izinkan kamera sekali saja" dengan
  tombol Izinkan kamera (pilih "Izinkan saat situs dibuka"); setelah diizinkan kotaknya hilang dan kamera tidak ditanya
  lagi saat memindai. Bila kamera pernah diblokir, kotak berisi petunjuk cara membukanya.

---

## 1.1.2 — 25 November 2026
- **Kamera langsung Koreksi LJK kini menyala di HP.** Sebelumnya aturan keamanan web melarang semua pemakaian kamera,
  jadi Chrome langsung menolak ("Izin kamera ditolak") tanpa bertanya. Sekarang hanya Racik Soal sendiri yang boleh
  memakai kamera; mikrofon dan lokasi tetap dilarang.
- Ujian baru → Dari Racik Soal: pilihan set kini berupa daftar kartu (judul maks 2 baris + jenis · mapel · tanggal ·
  jumlah soal), tidak lagi melebar keluar layar.
- Ujian baru → Isi sendiri: kotak kunci urut ke bawah dulu (1–20 kiri, 21–40 kanan), bulatan PG kompleks tidak gepeng.

---

## 1.1.1 — 25 November 2026
- **Daftar siswa lewat file Excel** (admin, Koreksi LJK → Daftar siswa). Unduh template berkolom **No, Nama, NISN,
  Kelas**, isi, lalu Impor Excel: tampil pratinjau per kelas sebelum disimpan. Baris bermasalah (nama kosong, NISN bukan
  10 angka, nama/NISN kembar, kelas lain) disebut nomor barisnya dan file belum bisa disimpan sampai diperbaiki.
  Satu file boleh berisi banyak kelas. NISN yang angka 0 di depannya hilang di Excel dikembalikan otomatis.
- Kelas tampil sebagai kartu (+ Tambah kelas). Di halaman kelas: impor khusus kelas itu, ubah nomor/nama/NISN,
  tambah siswa pindahan, keluarkan siswa (nilai lamanya tetap tersimpan). Cara tempel teks lama dihapus.
- Excel nilai Koreksi LJK kini memuat kolom NISN.

---

## 1.1.0 — 25 November 2026
- **Baru: Koreksi LJK.** Kartu Koreksi LJK di halaman awal sekarang bisa dibuka. Tampil sebagai aplikasi sendiri
  (judul, sidebar, dan riwayat ujian terpisah dari Racik Soal).
  - **Ujian baru**: pilih kelas, kunci jawaban diambil dari set Racik Soal (Paket A) atau diisi sendiri dengan tombol
    format ASAS **Eksak (35 soal)** / **Non-eksak (45 soal)**. Semua bentuk dijawab huruf A–E (PG → PG kompleks →
    B/S & menjodohkan). Peringatan bila total skor bukan 100.
  - **Pindai**: cari nama yang tertulis di LJK, ketuk namanya, arahkan HP ke bagian atas LJK; kamera memotret sendiri
    begitu 4 kotak hitam di pojok terlihat dan HP diam. Hasil langsung tampil; nomor yang ragu (bulatan samar, dua
    jawaban) berwarna kuning untuk dicek guru. Foto LJK tidak disimpan, hanya potongan tulisan nama.
  - **Nilai**: PG kompleks dapat nilai sebagian (2 kunci, benar satu = setengah). Nilai esai diketik, nilai akhir
    terisi otomatis.
  - **Unduh Excel** (lembar Nilai, Jawaban, Analisis butir) dan **Analisis butir soal** di halaman ujian: tingkat
    kesukaran, daya beda, sebaran jawaban A–E, pengecoh yang hampir tidak dipilih.
- **Daftar siswa** (admin): tempel kolom Kelas dan Nama dari Excel TU sekali; dipakai semua guru.
- **Word Kunci**: catatan penskoran PG kompleks kini menjelaskan nilai sebagian (sama dengan Koreksi LJK).

---

## 1.0.1 — 24 November 2026
- **Halaman dua kartu selalu tampil pertama**, juga saat login masih tersimpan: membuka tautan dari WA, browser baru di
  laptop, atau aplikasi di HP yang dibuka lagi setelah ditutup. Dulu hanya muncul tepat setelah mengetik kata sandi.
- Racik Soal kini beralamat `/racik`. Tautan set lama (mis. dari chat WA atau bookmark) tetap bisa dibuka, otomatis
  diteruskan. Aplikasi yang sudah terpasang di HP tidak perlu dipasang ulang.

---

## 1.0.0 — 24 November 2026
**Racik Soal resmi dipakai guru-guru MA Al-Fatah.** Semua persiapan 1.0.0 di atas sudah beres.
- **Halaman awal baru.** Setiap kali masuk, muncul halaman polos dengan dua kartu: **Racik Soal** (pembuat soal seperti
  biasa) dan **Koreksi LJK** (bertanda "Segera hadir"; diklik → pemberitahuan "sedang dalam pengembangan"). Di bawahnya
  ada tombol **Keluar**.
- **Pindah aplikasi**: tulisan **Racik Soal ⌄** di pojok kiri atas sidebar bisa diklik → pilih Racik Soal, Koreksi LJK,
  atau **Halaman awal**.

---

## 0.68.0 — 23 November 2026
Dari keluhan guru (catatan pemilik):
- **Materi saya**: judul materi kini bisa **diklik untuk langsung membuka** materinya. Menu ⋯ punya pilihan baru
  **Ganti nama** (ketik di tempat, Enter untuk simpan, Esc batal) tanpa masuk ke halaman Ubah.
- **Ayat & hadis setelah analisa**: tiap teks Arab punya **ikon sampah** untuk menghapus cepat (ikon saja, tanpa tulisan).
- **Materi sebelumnya yang dipilih** tidak lagi memanjang ke bawah: tampil sebagai **chip sama lebar** (2 kolom di HP,
  3 di laptop) dengan ✕ untuk melepas; tombol "Lepas semua" bila lebih dari 4. Peringatan materi pendek digabung satu.
- **Hasil baca AI tidak hilang** saat halaman di-refresh atau pindah menu:
  - Halaman PDF/foto yang sudah dibaca AI disimpan di browser 3 hari. File yang sama dilampirkan lagi → halaman itu
    tidak dikirim ke AI lagi (hemat jatah & biaya).
  - Hasil analisa materi yang belum dipakai ditawarkan lagi saat membuka Set baru ("Lanjutkan" / "Buang").
  - Selama AI masih membaca, browser bertanya dulu sebelum halaman ditutup.
  - Simpanan ini milik masing-masing guru; guru lain di browser yang sama tidak melihatnya.
- **PDF tebal: pilih beberapa bab sekaligus.** Di laptop seperti memilih file (Ctrl + klik, Shift + klik); di HP tombol
  **+ Tambah bab lain**. Atau ketik halamannya seperti saat mencetak: `15-30, 70-85`. Semua bab jadi satu materi
  (batas 75 halaman tetap berlaku untuk gabungannya).
- **Edit soal: tombol Tebal, Miring, Garis bawah** (B / I / U). Blok kata lalu tekan tombolnya; tekan lagi untuk melepas.
  Tampil di kartu soal dan file Word. Ditulis di teks sebagai `**tebal**`, `*miring*`, `__garis bawah__`, jadi tanda
  `**...**` yang kadang ditulis AI kini ikut tampil tebal.

---

## 0.66.0 — 20 November 2026
- **Kotak Ayat & hadis lebih ringkas.** Di atasnya ada ringkasan, mis. "4 teks Arab: 2 ✓ dikenali otomatis · 2 perlu Anda
  periksa" (juga tertulis di judul lipatan). Ayat & hadis yang dikenali otomatis (hijau) serta teks "Bukan ayat/hadis"
  cukup **satu baris**; tekan **Lihat** untuk membaca teks, mengisi terjemah, atau menghapus.
- **Kotak kuning bertanya "Ini apa?"** dengan tiga tombol: **Hadis dari kitab lain** (lalu kolom sumber langsung siap
  diketik), **Bukan ayat/hadis (doa, niat, kaidah, istilah)**, dan **✕ Hapus**. Dulu kolom sumber, terjemah, dan tombol
  tampil bersamaan sehingga guru bingung mulai dari mana.
- **Centang pemeriksaan hadis jadi tombol** "✓ Teks & harakat hadis sudah saya periksa sesuai kitabnya" (aktif setelah
  kotak kuning lengkap; bisa dibatalkan). Pesan di dekat Buat soal disesuaikan, tetap dengan "Lihat kotaknya".
- **Aturan 5 tidak berubah**: hadis di luar data tetap wajib bersumber dan dinyatakan sudah diperiksa guru; AI tidak
  dipakai memeriksa ayat/hadis; pencocokan otomatis ke mushaf & 9 kitab sama seperti sebelumnya.

## 0.65.1 — 20 November 2026
- Tombol **"✓ Sesuai, pakai TP ini"**, **"✓ Selesai, pakai TP ini"**, dan **"Ubah TP"** dikecilkan, seukuran tombol lain di
  kartu materi (Ambil ayat, ✕ Batalkan). Di HP tetap minimal 44 px supaya mudah diketuk. Gambar Panduan diperbarui.

## 0.65.0 — 20 November 2026
- **Langkah TP lebih mudah.** TP di kartu materi sekarang tampil sebagai **daftar yang mudah dibaca**, bukan kotak isian
  (dulu guru mengira harus mengetik).
- **TP usulan AI** (di materi tidak tertulis TP): centang kecil "Saya sudah membaca TP ini…" diganti **tombol besar
  "✓ Sesuai, pakai TP ini"** dan **"Ubah TP"**. Ubah TP membuka kotak isian; tekan **"✓ Selesai, pakai TP ini"** bila sudah.
  Aturannya tetap: TP usulan AI wajib disetujui guru sebelum membuat soal.
- Pesan di bawah tombol Buat soal / Simpan materi ("Setujui TP usulan AI…") punya tautan **"Lihat kotaknya"**: halaman
  menggulir ke kotak TP, tombol Sesuai langsung terpilih, dan kotaknya berkedip sebentar.
- Berlaku di Set baru dan Materi saya. Gambar Panduan "Periksa kartu materi" diambil ulang.

## 0.64.3 — 20 November 2026
- Tombol batal di kotak pilih halaman PDF sekarang **"✕ Batalkan"** di pojok kanan atas (sama dengan tombol Batalkan
  di kartu materi). Dulu berupa tautan kecil "Batal" di ujung kalimat panjang, mudah terlewat.

## 0.64.2 — 20 November 2026
- **Zoom gambar halaman PDF bertahap** (pengganti tombol "Perbesar gambar" yang langsung sangat besar): tombol **−** / **+**
  (10% per ketukan), penggeser, dan angka persen. Di laptop juga bisa **Ctrl + roda mouse** atau **cubit touchpad**
  (hanya di dalam kotak gambar; roda biasa tetap untuk menggulir).
- Saat zoom digeser, gambar langsung ikut membesar; ±½ detik setelah berhenti gambar dipertajam tanpa berkedip.
  Letak gulir tetap di halaman yang sama.
- Batas zoom mengikuti lebar layar: laptop sampai 300%, HP sampai ±170% (sudah 1 kolom selebar layar), jadi tombol +
  tidak pernah "tidak berbuat apa-apa".
- Diuji dengan buku FIKIH Kelas 10 (307 halaman): laptop 7 kolom (100%) sampai 2 kolom (300%), HP 3 kolom sampai 1
  kolom; Ctrl + roda dan cubit touchpad jalan; ketuk halaman 123 lalu 125 tetap mengisi angka dengan benar.

## 0.64.1 — 20 November 2026
- **Tombol "Perbesar gambar"** di pemilih halaman PDF: gambar halaman jadi 1 kolom (HP) / 2 kolom (laptop) sehingga
  judul bab dan isi halaman terbaca. Letak gulir tetap di halaman yang sama saat diperbesar/diperkecil.
- **Belum ada halaman terpilih saat PDF dilampirkan.** Dulu halaman 1–10 terpilih otomatis, jadi guru yang langsung
  menekan "Baca dengan AI" membuat AI membaca sampul dan kata pengantar. Sekarang tombol itu baru aktif setelah guru
  memilih halaman.
- Gambar halaman lebih tajam di HP (mengikuti kerapatan layar) dan gambar yang sudah jauh digulir dilepas lagi, jadi
  memori tetap kecil walau seluruh buku digulir. Angka yang diketik terbalik (mis. 50 sampai 40) tidak lagi
  menampilkan "-9 halaman".
- Diuji dengan buku asli FIKIH Kelas 10 (307 halaman, 57 MB) di laptop dan ukuran HP: gambar muncul ±0,3 detik
  setelah digulir, memori ±80 MB setelah seluruh buku digulir. Dari 15 buku guru (175–312 halaman), 10 tanpa bookmark.

---

## 0.64.0 — 20 November 2026
- **Memilih halaman PDF kini lewat gambar.** Untuk PDF lebih dari 75 halaman, guru tidak perlu lagi menebak nomor
  halaman. Tampil gambar kecil tiap halaman: gulir, ketuk halaman pertama bab, lalu halaman terakhirnya. Angka di
  bawah gambar = nomor halaman file PDF (bukan nomor cetak buku). Jalan untuk semua jenis PDF (cetakan, scan, foto,
  ber-bookmark) karena yang dilihat adalah gambarnya.
- Gambar halaman dibuat hanya untuk yang sedang terlihat, jadi ringan walau PDF-nya ratusan halaman. Rentang lebih dari
  75 halaman dipotong otomatis beserta pesan penjelasnya. Isian angka "Dari / Sampai" tetap ada untuk penyesuaian halus.
- **Panduan** bagian PDF diperbarui.
- Diuji: PDF buatan 120 halaman di laptop dan ukuran HP, termasuk lewat form Set baru sampai AI mulai membaca rentang
  yang dipilih. Belum dicoba dengan PDF scan / buku Al-Fatah asli.

---

## 0.63.1 — 19 November 2026
- **Pengumuman pembaruan baru** (muncul sekali di tiap perangkat): soal kini bisa bergambar (grafik, bagan, gambar
  pelajaran) beserta daftar jenisnya, cara membuat/mengubah lewat **📊 Grafik & gambar**, dan penjelasan bahwa
  gambar ini bukan foto/ilustrasi buatan AI, melainkan gambar garis sederhana untuk jenis-jenis tertentu saja.
- **Panduan** bagian "Rumus dan gambar di soal" diperbarui dengan isi yang sama (kalimat lama "AI tidak bisa membuat
  gambar sendiri" diganti).

---

## 0.63.0 — 19 November 2026
- **Formulir gambar tahap 3 (terakhir): grafik data** (batang, garis, lingkaran, histogram, pencar, piramida penduduk).
  Kini SEMUA jenis gambar diisi lewat formulir; tabel abu-abu tinggal di "Lanjutan".
  - **Lembar data seperti Excel**: nama sumbu diisi di kotak berlabel jelas, satuan dipilih dari daftar (orang, %,
    °C, ton, Rp, ribu, juta, ...) atau diketik sendiri. Tombol + Baris, ↑ ↓ ✕, Enter pindah ke kotak di bawahnya.
  - **Tempel dari Excel / Google Sheets**: salin tabel di Excel lalu tempel di kotak mana pun pada lembar data (atau di
    kotak "Tempel dari Excel"); baris judul dikenali sendiri, "Rp 1.250" dan "25%" dibaca sebagai angka.
  - **Batang & garis**: tombol "+ Seri data (pembanding)", misalnya Padi dan Jagung (maks 3 seri).
  - **Lingkaran**: jumlah & persen tiap bagian langsung tertulis; bila satuannya "%" dan jumlahnya belum 100, ada
    peringatan.
  - **Histogram**: "Buat kelas otomatis" (batas bawah, panjang kelas, banyak kelas → 51–60, 61–70, ...) dan
    "Hitung frekuensi dari nilai siswa" (tempel daftar nilai, frekuensi tiap kelas dihitung sendiri).
  - **Piramida penduduk**: kelompok umur siap pakai (3 kelompok 0–14/15–64/65+, 15 tahunan, 10 tahunan,
    5 tahunan), satuan ribu/juta/jiwa sekali pilih untuk kedua kolom.
  - Kotak yang bukan angka langsung bergaris merah.
  - Mengganti jenis grafik (mis. lingkaran → batang) atau menjadikan tabel biasa sebagai grafik: datanya tetap
    dipakai, tidak diganti contoh.
- Perbaikan 0.62.0: nama dua kata (mis. "burung elang", "0–12 km", nama sumbu "Jumlah barang") kini bisa diketik
  (sebelumnya spasi di ujung hilang saat mengetik).
- Soal lama, file Word, dan AI tidak berubah.

---

## 0.62.0 — 19 November 2026
- **Formulir gambar tahap 2: 9 jenis berbentuk daftar & cabang** kini juga diisi lewat formulir (bukan tabel abu-abu).
  - **Bagan pohon**: tiap kotak tampil menjorok sesuai tingkatnya, tombol **+** di samping kotak = tambah cabang di
    bawahnya (bisa bercabang terus sampai 4 tingkat), ↑ ↓ untuk menggeser, ✕ menghapus kotak beserta cabangnya.
    Mengganti nama kotak induk otomatis ikut di cabangnya.
  - **Diagram alir & siklus**: satu baris per langkah bernomor, tombol + Langkah, ↑ ↓ ✕.
  - **Garis waktu**: tahun + peristiwa per baris, tombol "Urutkan menurut tahun".
  - **Bidang koordinat**: sumbu (nama & batas), lalu tombol **+ Titik / + Garis / + Kurva / + Panah / + Garis patah /
    + Daerah**; tiap titik diisi x dan y di kotak terpisah.
  - **Garis bilangan**: cukup isi batas kiri & kanan (angka atau "tak hingga") dan pilih bulatan ● termasuk / ○ tidak
    termasuk; pertidaksamaannya tertulis langsung (mis. "-1 < x ≤ 3").
  - **Rangkaian listrik**: tombol + Hambatan / Lampu / Kapasitor / Saklar / Amperemeter / Cabang paralel, nama
    otomatis (R4, L1, ...), satuan Ω/μF otomatis, voltmeter tinggal dipilih dari daftar komponen (ikut berganti bila
    komponennya diganti nama, lepas bila komponennya dihapus).
  - **Jaring makanan**: tulis nama makhluk, lalu centang "dimakan oleh" siapa saja. Pilihan yang membuat lingkaran
    makan-memakan tidak ditampilkan.
  - **Ahli waris**: pilih mayit laki-laki/perempuan, centang ahli waris per kelompok (pasangan, orang tua, anak & cucu,
    saudara & paman), pilih bagiannya dari daftar, isi jumlah orang. Bagian yang salah menurut kaidah faraidh langsung
    diberi garis merah (bagian tidak diisi otomatis; tetap guru yang menentukan).
- Semua formulir: centang "ditanyakan" mengganti tulisan dengan "....", dan tombol yang berdampingan kini berjarak rapi.
- Soal lama, file Word, dan AI tidak berubah. Berikutnya: grafik data (batang, garis, lingkaran, histogram, pencar,
  piramida) dengan tempel dari Excel (0.63.0).

---

## 0.61.0 — 19 November 2026
- **Membuat & mengubah gambar jauh lebih mudah (tahap 1 dari 3).**
  - Tombol **📊 Grafik & gambar** kini membuka **kartu bergambar** per kelompok (Data, Urutan, Matematika, Fisika,
    Kimia & Biologi, Agama, IPS) dengan kotak **Cari** (mis. ketik "segitiga", "lensa", "waris").
  - 13 jenis kini diisi lewat **formulir**, bukan tabel abu-abu: bangun datar, bangun ruang, sudut, cermin & lensa,
    gaya, katrol, tuas, atom, mata angin & kiblat, gerhana & fase bulan, ekonomi, lapisan, dan shaf.
  - Formulir: **pilih dari daftar** (tidak ada lagi salah ketik nama bangun), **satuan otomatis** (cukup ketik angka),
    centang **"ditanyakan"** (gambar menampilkan "?"), langsung terisi contoh sungguhan, dan isian yang salah diberi
    garis merah. Isiannya menyesuaikan pilihan: pilih "Tabung" → muncul jari-jari & tinggi saja.
  - Bantuan hitung untuk guru: cermin & lensa menampilkan jarak/tinggi bayangan, perbesaran, dan sifatnya; tuas
    menghitung isian yang kosong; atom menampilkan konfigurasi elektron.
  - Sudut pada garis sejajar diisi di kotak yang tersusun seperti gambarnya (kiri atas, kanan atas, dst.); bangun
    ruang punya tombol "+ Titik tengah rusuk" dan "+ Garis tambahan" (pilih titiknya dari daftar).
  - Mode tabel lama tetap ada di tombol "Lanjutan: ubah sebagai tabel".
- Soal lama, file Word, dan AI tidak berubah (isi di balik formulir tetap sama).
- Berikutnya: bagan (pohon dengan tombol "+ cabang"), bidang koordinat, garis bilangan, listrik, jaring makanan,
  ahli waris (0.62.0), lalu grafik data (0.63.0).

---

## 0.60.0 — 19 November 2026
- **Skema IPS: lapisan, gerhana & fase bulan, interaksi pelaku ekonomi** (Geografi, Ekonomi).
  - **Lapisan**: lapisan bumi (setengah lingkaran berlapis), lapisan atmosfer (troposfer sampai eksosfer beserta
    ketinggiannya), dan horizon tanah (O, A, B, C, R).
  - **Gerhana matahari & gerhana bulan** dengan bayangan umbra dan penumbra, serta **8 fase bulan** lengkap dengan
    wujudnya dilihat dari Bumi. Nama benda/fase bisa diganti huruf/nomor untuk ditanyakan ("Huruf B adalah ....").
  - **Interaksi pelaku ekonomi** 2, 3, dan 4 sektor; garis utuh = barang/jasa, putus-putus = uang. Nama arus bisa
    diganti nomor (1), (2), ... untuk soal "Arus nomor 8 menunjukkan ....".
- Uji DeepSeek: gerhana bulan dan diagram ekonomi tergambar dengan kunci benar; "label arus | 1-8" tulisan AI kini
  juga dibaca sebagai nomor.
- **Membuat sendiri**: di **📊 Grafik & gambar** ada kelompok baru "Skema IPS".
- Dengan versi ini, semua rencana gambar dari awal (grafik, bagan, geometri, skema IPA, skema agama & IPS) selesai.

---

## 0.59.0 — 19 November 2026
- **Skema agama: shaf sholat, ahli waris, mata angin & kiblat** (Fiqih, juga Geografi).
  - **Posisi shaf**: tampak atas sholat berjamaah (kiblat, imam, barisan laki-laki/anak-anak/perempuan sesuai tabel),
    juga bentuk "berdua" (makmum di kanan imam). Barisan bisa diberi huruf A/B/C bila urutannya ditanyakan.
  - **Bagan ahli waris**: mayit di tengah, orang tua di atas, saudara di samping, suami/istri bergaris ganda, anak
    dan cucu di bawah, lengkap dengan bagiannya; yang mahjub (terhalang) dicoret.
  - **Mata angin & arah kiblat**: 8 arah, panah kiblat (mis. 295°), dan benda di arah tertentu. Nama arah bisa
    disembunyikan bila arahnya yang ditanyakan.
- **Pemeriksa ahli waris** memakai kaidah faraidh yang pasti: siapa yang terhalang (oleh anak laki-laki, ayah,
  ibu, cucu laki-laki), bagian suami/istri, ibu & ayah bila ada keturunan, anak perempuan, dan jumlah bagian lebih
  dari 1 harus ditandai 'aul. Kasus khusus (gharrawain dan sejenisnya) tetap diperiksa guru.
- Uji DeepSeek: shaf, ahli waris, dan kiblat tergambar dengan kunci benar; satu bagan "mayit laki-laki meninggalkan
  suami" tertangkap pemeriksa, dan arah kiblat yang ditanyakan kini disembunyikan dari gambar.
- **Membuat sendiri**: di **📊 Grafik & gambar** ada kelompok baru "Skema agama".

---

## 0.58.0 — 19 November 2026
- **Skema IPA tahap 2: cermin & lensa, gaya, katrol, tuas** (Fisika).
  - **Cermin & lensa** (cekung/cembung): titik F dan M (lensa: F1, F2, 2F1, 2F2), benda, lalu **bayangan dan sinar
    istimewa dihitung aplikasi** dari 1/f = 1/s + 1/s'. Bayangan maya putus-putus. Bila letak/sifat bayangan yang
    ditanyakan, tulis "bayangan | sembunyi" (sinarnya ikut disembunyikan).
  - **Gaya pada balok**: bidang datar atau miring, panah w, N, f (gesek), F (tarik, boleh bersudut), dan uraian
    w sin θ & w cos θ.
  - **Katrol**: katrol tetap, katrol bebas, atau balok di meja yang ditarik beban tergantung.
  - **Tuas** jenis 1, 2, 3 dengan beban, kuasa, dan garis ukur lengan beban & lengan kuasa.
- **Angka yang salah ketahuan**: jarak/tinggi bayangan & perbesaran dicocokkan dengan rumus; tuas: beban × lengan
  beban = kuasa × lengan kuasa, dan urutan lengan jenis 2/3 (lengan yang ditanyakan ikut dihitung).
- Uji DeepSeek: 8 skema, 7 kunci benar; satu soal sekop (tuas jenis 3) yang mustahil secara fisika kini tertangkap
  pemeriksa, dan perintah AI ditambah aturan urutan lengan tuas.
- **Membuat sendiri**: di **📊 Grafik & gambar**, kelompok "Skema IPA" bertambah 4 pilihan.
- Belum: pegas, fluida, rumus struktur kimia.

---

## 0.57.0 — 19 November 2026
- **Skema IPA tahap 1: rangkaian listrik, model atom, jaring makanan.**
  - **Rangkaian listrik** (Fisika): baterai, hambatan, lampu, kapasitor, saklar terbuka/tertutup, amperemeter,
    cabang paralel, dan voltmeter yang dipasang sejajar dengan komponen yang diukur.
  - **Model atom Bohr** (Kimia): inti bertuliskan lambang unsur, kulit K, L, M, N dengan titik-titik elektron.
    Konfigurasi dihitung otomatis untuk nomor atom sampai 20.
  - **Jaring/rantai makanan** (Biologi): cukup tulis "padi | belalang, tikus" (padi dimakan belalang dan tikus);
    aplikasi menyusun tingkat trofiknya sendiri, produsen di bawah, panah ke pemakan.
- **Skema yang salah ketahuan**: komponen dobel, voltmeter tanpa sasaran, jumlah elektron tidak sama dengan nomor
  atom, isi kulit berlebih, atau lingkaran makan-memakan → soal diberi peringatan.
- AI memakai skema ini untuk soal rangkaian listrik, struktur atom, dan ekosistem. Uji DeepSeek: 5 skema, semua kunci
  benar; satu rangkaian dengan "paralel" satu cabang tertangkap pemeriksa.
- **Membuat sendiri**: di **📊 Grafik & gambar** ada kelompok baru "Skema IPA".
- Belum: cermin & lensa, gaya/bidang miring/katrol/tuas (tahap berikutnya).

---

## 0.56.0 — 19 November 2026
- **Gambar geometri tahap 2b: bangun ruang.** Kubus, balok, prisma segitiga, limas segiempat, limas segitiga,
  tabung, kerucut, dan bola, digambar miring seperti buku paket: rusuk yang tertutup putus-putus, alas tabung dan
  kerucut berupa elips. Nama titik baku ABCD.EFGH / T.ABCD (bisa diganti, mis. PQRS.TUVW).
- **Untuk soal dimensi tiga**: titik tengah rusuk ("titik P | tengah EH") dan garis tambahan seperti diagonal ruang
  ("AG | ?") ikut tergambar.
- **Ukuran yang salah ketahuan**: diagonal ruang, rusuk tegak limas, garis pelukis kerucut, dan diameter dihitung
  ulang. Kalau tidak cocok, soal diberi peringatan beserta ukuran yang benar.
- AI memakai gambar ini untuk soal jarak dimensi tiga, luas permukaan, dan volume. Uji DeepSeek: 6 gambar, semua
  kunci benar (mis. jarak A ke titik tengah EH = 3√5 cm, tinggi limas = 2√7 cm).
- **Membuat sendiri**: di **📊 Grafik & gambar** pilih "Bangun ruang", ketik nama bangunnya, contoh abu-abu dan
  gambarnya langsung berganti.
- Perbaikan kecil: contoh di perintah AI untuk gambar geometri kini ditulis sama dengan contoh grafik/bagan.
- Belum: irisan bidang, jaring-jaring, dan bangun gabungan.

---

## 0.55.0 — 19 November 2026
- **Gambar geometri tahap 2a: bangun datar & sudut.**
  - **Bangun datar**: segitiga (biasa, siku-siku, sama kaki, sama sisi), persegi, persegi panjang, jajargenjang,
    trapesium (biasa, siku-siku, sama kaki), belah ketupat, layang-layang, dan lingkaran (jari-jari, diameter,
    juring berarsir). Digambar **sesuai ukurannya**, lengkap dengan tanda siku-siku, garis tinggi putus-putus,
    dan nama titik A, B, C, D.
  - **Sudut**: sudut tunggal, berpelurus, berpenyiku, bertolak belakang, dan dua garis sejajar dipotong garis lain
    (sudut A1–A4 dan B1–B4).
- **Ukuran yang salah ketahuan.** Aplikasi mencocokkan semua angka di tabel dengan gambarnya. Kalau tidak cocok
  (mis. sisi 8, 6, dan 11 pada segitiga siku-siku, atau sudut sehadap yang beda besar), soal diberi peringatan yang
  menyebut ukuran yang benar. Ukuran yang ditanyakan ditulis "?" atau "x".
- AI memakai gambar ini untuk soal trigonometri, Pythagoras, keliling/luas bangun datar, lingkaran, dan hubungan
  antarsudut. Uji DeepSeek: 6 gambar, semua kunci benar; satu salah hitung sudut tertangkap pemeriksa.
- **Membuat sendiri**: di **📊 Grafik & gambar** pilih "Bangun datar" atau "Sudut", lalu ketik nama bangunnya
  (mis. "trapesium sama kaki"): contoh abu-abu dan gambarnya langsung berganti sesuai bangun itu.
- Belum: bangun ruang (tahap berikutnya), sudut keliling, dan bangun gabungan.

---

## 0.54.0 — 19 November 2026
- **Gambar geometri tahap 1: bidang koordinat & garis bilangan.** Untuk Matematika, Fisika, dan Ekonomi, aplikasi
  kini bisa menggambar:
  - **bidang koordinat**: titik, garis lurus, garis patah (grafik v–t / s–t), kurva fungsi (y = x² − 2x − 3),
    panah vektor, daerah berarsir (program linear), nama & rentang sumbu bebas (Q–P untuk permintaan–penawaran,
    t–v untuk gerak);
  - **garis bilangan**: bulatan penuh (termasuk), bulatan kosong (tidak termasuk), dan daerah penyelesaian
    pertidaksamaan.
- AI memakainya bila materinya tentang grafik fungsi, persamaan garis, vektor, program linear, permintaan–penawaran,
  grafik gerak, atau pertidaksamaan. Angka di gambar dibuat sama dengan kunci, dan gambar tidak menuliskan jawabannya.
- **Membuat sendiri**: tombol di form Edit kini bernama **📊 Grafik & gambar**, dengan kelompok baru "Geometri".
  Satu baris = satu benda (mis. "garis | (0, 10) (10, 0) | D"); contoh abu-abu langsung tergambar dan berubah tiap
  ketikan. Kolom Label boleh kosong.
- **Di Word** tampil sebagai gambar seperti bagan. Kotak pesan untuk aplikasi lama kini berbunyi "Gambar tidak tampil
  di aplikasi ini".
- Belum: bangun datar, bangun ruang, dan sudut (tahap 2).

---

## 0.53.0 — 19 November 2026
- **Bagan di soal.** Selain grafik, aplikasi kini bisa menggambar 4 jenis bagan:
  - **garis waktu**: urutan peristiwa (SKI, Sejarah, Al-Quds);
  - **diagram alir**: langkah atau tata cara berpanah (wudu, sholat jenazah, prosedur IPA), juga rantai sanad;
  - **siklus**: daur yang melingkar (daur air, metamorfosis);
  - **bagan pohon**: klasifikasi, struktur organisasi, peta konsep, pembagian (mis. Kalimat → Isim, Fi'il, Huruf).
- AI memakai bagan bila materinya tentang urutan, tahapan, daur, atau pembagian. Sering dipakai dengan satu kotak
  dikosongkan ("....") untuk ditanyakan isinya. Bagan selalu ditulis dengan huruf Latin (tanpa huruf Arab).
- **Membuat sendiri**: tombol di form Edit kini bernama **📊 Grafik/Bagan**. Pilih jenis bagan, isi abu-abu
  langsung tergambar seperti grafik. Bagan pohon: kolom kedua diisi nama induknya; induk kotak puncak dikosongkan.
- **Di Word** bagan tampil sebagai gambar yang tajam (Word 2016 ke atas). Aplikasi yang tidak bisa menampilkannya
  (Word lama, sebagian WPS) menunjukkan kotak pesan "Buka file dengan Microsoft Word 2016 ke atas". Untuk mengubah
  isi bagan, ubah di web lalu unduh ulang.

---

## 0.52.0 — 18 November 2026
- **Grafik sungguhan di soal.** Untuk data angka, AI kini bisa membuat 6 jenis grafik: **garis** (perubahan dari
  waktu ke waktu), **batang** (perbandingan), **lingkaran** (persentase), **histogram** (data berkelompok),
  **diagram pencar** (hubungan dua besaran, mis. jam belajar dan nilai), dan **piramida penduduk**. AI hanya menulis
  datanya; aplikasi yang menggambar, jadi angka di grafik selalu sama dengan datanya. Bila materi membahas cara membaca
  grafik (mis. tipe piramida penduduk), soalnya menampilkan grafik itu, bukan menjelaskannya dengan kata.
- Grafik **hitam-putih** supaya tetap jelas saat lembar soal difotokopi.
- **Di Word** grafiknya grafik asli: guru bisa mengubah angkanya lewat klik kanan → **Edit Data**. Tampil juga di WPS
  dan LibreOffice. Pemisah angka (30.000 / 30,000) mengikuti bahasa Windows yang membuka file.
- **Membuat dan mengubah grafik sendiri**: di form Edit ada tombol baru **📊 Grafik**. Klik grafik di Pratinjau juga
  membuka jendelanya. Pilih **Tampil sebagai** (tabel atau salah satu dari 6 jenis grafik): kolom langsung berisi
  **contoh abu-abu** dan grafiknya langsung tergambar. Setiap angka yang diketik langsung mengubah grafiknya. Contoh
  abu-abu tidak ikut tersimpan; kalau ada yang salah ketik, pesannya menyebut letaknya ("Baris 2 kolom 2 harus angka").
- Data yang tidak bisa digambar otomatis tampil sebagai tabel, dan soalnya diberi **tanda peringatan** supaya guru tahu
  (juga bila penanda grafik tertinggal tanpa tabel, atau grafik tertulis di pilihan jawaban).

---

## 0.51.0 — 17 November 2026
- **Edit bacaan**: kotak bacaan soal grup (satu teks untuk beberapa nomor, mis. mapel bahasa) punya tombol
  **Edit bacaan**. Perubahan ikut ke semua nomor di grup itu, kisi-kisi, dan file Word.
- **Materi saya lebih rapi**: pilihan mapel dan kelas di atas daftar, kotak cari judul (semua mapel), bab diurutkan
  menurut nomornya (Bab 2 sebelum Bab 10), tombol Ubah & Hapus pindah ke menu ⋯, judul yang terlalu panjang dipotong
  "…" (judul lengkap muncul saat kursor diarahkan).
- **Simpan materi kembali ke daftar** Materi saya, dengan pesan hijau dan materi tadi disorot. Bila ada teks Arab yang
  dibuang saat menyimpan, halaman tetap di form supaya peringatannya terbaca.
- **Al-Quds wal Maqdisiyyah = mapel hafalan** seperti mapel Hadis: soal berayat/hadis diperbanyak (bawaan ±7 dari 10),
  cara melengkapi, garis bawah, menebak potongan, menyusun urutan. Ayat/hadis tetap harus ada di materi.
- **PG kompleks tepat 2 jawaban benar** untuk Ulangan Harian, AFTS, ASAS, dan Latihan (dulu 2 atau 3). Latihan TKA tetap
  2–4. Set lama tidak berubah; Edit guru tetap boleh 2–4 kunci.

---

## 0.50.0 — 16 November 2026
**Ubah soal lebih pintar** (dari 55 riwayat Ubah soal guru di hosting):
- **Permintaan cara tampil dalil dikenali aplikasi**: "hadisnya jadi jawaban" (pilihan A–E berupa lafaz), "melengkapi
  hadis/ayat" (rumpang), "lafaz bergaris bawah", "menyusun urutan", "Arab saja", "artinya saja", "potongan ayat".
  Dalil dan konsep soal tetap sama, kecuali guru meminta ganti hadis/konsep.
- **Hasil Ubah yang masih bertanda merah diperbaiki AI sekali** sebelum ditampilkan (catatan AI menyebutnya).
- **Soal tempelan guru dipakai apa adanya** (hanya salah ketik & spasi dibetulkan), tidak diganti cerita karangan AI.
- **Gambar**: AI tidak lagi mengarang nomor/label pada gambar tanpa label; bila diminta menambah angka di gambar,
  catatan AI menjelaskan cara mengunggah gambar berlabel lewat Edit.
- **Tombol "Sudah saya periksa"** pada soal bertanda merah: tanda merah hilang tanpa AI dan tanpa jatah. Peringatan teks
  Arab yang tidak cocok dengan data tidak bisa dihilangkan (ayat/hadis tidak boleh dikarang).

---

## 0.49.1 — 16 November 2026
- **Materi digabung dalam satu set kini maksimal 10** (dulu 5), misalnya untuk ASAS yang dipecah per sub-bab.
  Total panjang gabungannya tetap maks. 150 ribu huruf.

---

## 0.49.0 — 16 November 2026
Khusus mapel **Hadis** (Al-Qur'an Hadis dan mapel lain tidak berubah):
- **Soal hafalan diperbanyak.** Bawaan ±7 dari 10 soal memakai hadis dari materi (pilihan di Lanjutan: sedikit ±3,
  sedang ±7, banyak ±9 dari 10), satu hadis boleh dipakai sampai 6 soal dengan potongan berbeda.
- Yang didahulukan: **melengkapi lafaz**, **menerjemahkan lafaz bergaris bawah**, **menebak potongan** (pilihan A–E
  berupa lafaz), **menyusun urutan**, **lanjutan lafaz**, dan menjodohkan lafaz ↔ arti. Sesekali soal isi kandungan.
- Perintah soal tetap bahasa Indonesia; hadis di soal dan jawaban berupa lafaz Arab diambil dari data, bukan diketik AI.
- **Cara baru "garis bawah"**: hadis tampil utuh, sebagian lafaz bergaris bawah (di web dan di file Word), siswa
  menerjemahkan bagian itu. Jawabannya diambil dari terjemah hadis di materi, jadi **terjemah hadis perlu ada di materi**.
  Cara ini juga bisa dipilih di Edit untuk mapel lain.

---

## 0.48.1 — 15 November 2026
Jatah guru dilonggarkan selama ASAS, supaya guru leluasa mencoba-coba sambil memakai sungguhan.
| | Dulu | Sekarang |
|---|---|---|
| Set soal per guru per hari | 10 | **50** |
| Ganti/Ubah/Tambah soal per hari | 60 | **500** |
| Ganti/Ubah/Tambah soal dalam satu set | 30 | **100** |
| Analisa materi per hari | 30 | **300** |
| Halaman PDF/foto dibaca AI per hari | 200 | **1000** |
| Materi tersimpan per guru | 300 | **1000** |
| Gambar tersimpan per guru | 300 | **600** |
| Set per hari seluruh web | 100 | **500** |

Yang tidak berubah: 2 set dibuat bersamaan per guru, maks. 50 soal per set, materi 150 ribu huruf, 75 halaman PDF
sekali lampir, batas waktu pembuatan, dan kunci salah kata sandi.

- **Pengumuman pembaruan**: saat aplikasi dibuka atau dimuat ulang, muncul sekali jendela "Pembaruan Versi 0.48.1"
  (batas yang dilonggarkan + fitur Kirim masukan). Setelah "Baik, saya mengerti" tidak muncul lagi di perangkat itu.
- **Jendela konfirmasi bergaya aplikasi**, menggantikan kotak bawaan browser: Ganti soal, Hapus soal, Hapus set,
  Hapus materi, Nonaktifkan akun (admin), dan pesan gagal. Untuk hapus, tombolnya merah dan pilihan awalnya Batal.

---

## 0.48.0 — 15 November 2026
- **Kirim masukan.** Tautan baru **Kirim masukan** di sidebar (di bawah Panduan) membuka kotak untuk menulis keluhan
  atau saran, dengan pilihan 5 wajah (boleh dilewati). Bila sedang membuka set, centang **Tentang set: …** ikut
  mengirim set itu, jadi admin bisa langsung membukanya.
- **Kotak pendapat otomatis.** Setelah set selesai dibuat (set ke-3, 10, 25, 50, 100, lalu tiap 50; paling sering
  seminggu sekali) muncul kotak kecil di pojok kanan bawah (di HP: panel bawah) yang tidak menutupi soal.
  "Nanti saja" = ditanyakan lagi setelah 3 set berikutnya; ✕ = ditanyakan lagi di patokan berikutnya.
- **Admin → Masukan guru**: daftar semua masukan (nama guru, wajah, tulisan, tautan set, versi aplikasi) dan rata-rata nilai.
- Tanpa AI, tidak memakai jatah. Maks. 1000 huruf, 10 masukan per guru per hari.

---

## 0.47.2 — 15 November 2026
- **Materi boleh lebih panjang**: isi satu materi dan total materi yang digabung dalam satu set kini maks
  **150 ribu huruf** (dulu 100 ribu), cukup untuk ±4–5 bab buku (mis. ASAS satu semester).
- **PDF**: AI kini bisa membaca sampai **75 halaman** sekali lampir (dulu 50).
- Catatan: materi yang sangat panjang membuat pembuatan soal sedikit lebih lama dan biaya AI per set lebih besar.

---

## 0.47.1 — 14 November 2026
- **Tombol lampirkan lebih jelas di laptop.** Tombol klip di bawah kotak materi kini bertuliskan **Lampirkan file**
  di laptop. Di HP tetap ikon saja, supaya baris tombolnya tidak penuh. Panduan ikut disesuaikan.

---

## 0.47.0 — 14 November 2026
- **Satu bacaan untuk beberapa soal di mapel bahasa.** Bahasa Inggris dan Bahasa Arab kini seperti Bahasa Indonesia:
  sebagian soal PG memakai satu teks bacaan bersama, di semua jenis ujian (UH, AFTS, ASAS, Latihan). Ukurannya kini
  **3–5 soal per bacaan** (dulu 2–3), sekitar separuh soal PG, sisanya soal biasa. Bahasa Inggris memakai reading text
  (narrative, descriptive, dll. sesuai materi); Bahasa Arab memakai qira'ah/hiwar berharakat. Nahwu tidak ikut.
- **Ukuran bisa diminta guru.** Tulis di Catatan untuk AI, misalnya "1 cerita untuk 5-7 soal" atau "6 soal per
  teks". Aplikasi membaca angkanya sendiri (paling banyak 10 soal per bacaan), jadi permintaan ini pasti diikuti.
  Berlaku juga di Latihan TKA. Teks bacaan otomatis lebih panjang bila soalnya lebih banyak.

---

## 0.46.2 — 14 November 2026
- **Soal bergambar tidak lagi mengarang nomor.** Dulu soal bisa berbunyi "bagian yang ditandai nomor 1, 2, dan 3"
  padahal gambarnya tanpa nomor (Biologi, model membran sel). Sekarang keterangan gambar dari Analisa materi mencatat
  label yang tampak ("berlabel A–E") atau "tanpa label". Soal yang menunjuk nomor/huruf pada gambar tanpa label ditandai
  merah dan diperbaiki otomatis menjadi soal tentang keseluruhan gambar, atau menunjuk bagian lewat bentuk/warna.
  Gambar materi lama yang keterangannya tidak menyebut label dianggap tanpa label. Bila gambarnya memang bernomor,
  tulis labelnya di keterangan gambar (mis. "berlabel 1–5").
- **Pilihan tidak lagi tertulis dua kali.** Soal PG / PG kompleks yang menulis ulang pilihan A–E di kalimat soal kini
  dirapikan otomatis oleh aplikasi (baris yang sama dengan pilihan dibuang), tanpa perlu Edit. Berlaku untuk set baru.

---

## 0.46.1 — 13 November 2026
- **Panduan**: gambar menu "Lainnya" diperbarui (kotak permintaan Ubah soal kini dua baris), contoh permintaan
  ditambah ("ganti kasusnya jadi tentang pasar", "jadikan uraian").

---

## 0.46.0 — 13 November 2026
- **Ubah soal bisa mengganti bentuk soal**: tulis misalnya "jadikan uraian", "ubah jadi PG kompleks", atau "jadikan
  benar/salah". Soal ditulis ulang lengkap dalam bentuk baru (pilihan, rubrik, kunci, pembahasan), lalu dipindah ke
  bagian bentuknya; halaman langsung menggulir ke nomor barunya. Skor mengikuti bobot set, kisi-kisi ikut menyesuaikan.
- Bentuk hanya diganti bila guru menyebut bentuknya ("jadikan lebih sulit" tidak akan mengubah PG jadi PG kompleks).
- Tidak bisa (dan dijelaskan, tanpa memakai jatah): menjodohkan, soal grup (wacana bersama), serta isian/uraian di
  Latihan TKA.

---

## 0.45.0 — 13 November 2026
- **"Ubah soal" jauh lebih ampuh**: guru bisa meminta perubahan apa saja pada satu soal (ganti kasus/tokoh, jadikan
  HOTS, pengecoh lebih menjebak, pembahasan lebih singkat, pakai tabel, ganti gambar, dan sebagainya). Dulu AI sering
  mengembalikan soal yang sama persis karena permintaan guru tertumpuk di ujung banyak aturan; kini permintaan guru
  menjadi tugas utama AI.
- **Wacana soal grup bisa diubah lewat Ubah soal**; soal lain yang memakai wacana itu ikut berubah wacananya, dan guru
  diberi tahu nomor mana yang perlu diperiksa.
- **Catatan AI**: setelah mengubah, AI menjelaskan apa yang diubah, atau alasan bagian yang tidak bisa dijalankan
  (misalnya hadis yang tidak ada di materi). Kalau AI mengembalikan soal yang sama, aplikasi otomatis mencoba sekali
  lagi tanpa memotong jatah.
- Kotak permintaan kini dua baris dan muat sampai 1000 huruf (dulu 300). Bentuk soal tetap sama (PG tetap PG).

---

## 0.44.1 — 13 November 2026
- **Soal ayat/hadis dan soal bergambar lebih rapi**: kalimat pengantar ("Perhatikan hadis berikut!") tampil dulu, lalu
  ayat/hadis atau gambarnya, baru sisa pertanyaannya. Dulu ayat/hadis selalu di bawah seluruh pertanyaan. Berlaku di
  web dan Word, termasuk set lama.
- **Soal yang jawabannya tertulis di terjemah** (siswa cukup mencocokkan kalimat) kini ditandai merah dan diperbaiki
  otomatis saat set dibuat.

---

## 0.44.0 — 13 November 2026
- **Ayat/hadis kini bisa ada di semua bentuk soal**, disisipkan langsung di dalam teksnya (teks asli dari data,
  bukan ketikan AI):
  - **Benar/Salah**: misalnya "Lafaz وَآتُوا الزَّكَاةَ berisi perintah menunaikan zakat."
  - **PG kompleks**: lafaz di kalimat soal atau di pilihan jawaban.
  - **Menjodohkan**: satu blok bisa menjadi **lafaz ↔ artinya** (lajur kanan potongan terjemah).
  - **Isian**: misalnya "Lanjutan lafaz … adalah ….", kuncinya lafaz Arab.
- **Edit lebih mudah**: potongan ayat/hadis dipilih dengan **mengklik kata** (kata awal lalu kata akhir). Ada tombol
  **Sisipkan** untuk memasukkan lafaz atau terjemah asli ke kotak teks yang sedang diisi.
- Perbaikan: "Perhatikan kutipan definisi berikut" atau "Pasal 33 ayat (3) berikut" tidak lagi dikira ayat Al-Qur'an;
  jawaban menjodohkan yang hanya beda koma/harakat ditandai.

---

## 0.43.0 — 13 November 2026
- **Soal ayat/hadis jenis baru (pilihan ganda)**, disusun aplikasi dari teks terverifikasi:
  - **Melengkapi (rumpang)**: ayat/hadis atau terjemahnya tampil dengan satu bagian "……"; pilihan A–E berupa potongan.
  - **Ayat/hadis di pilihan jawaban**: misalnya "Lafaz yang berisi perintah zakat adalah ….", pilihannya potongan
    Arab (atau potongan terjemah).
  - **Menyusun urutan**: 3–4 potongan ayat ditampilkan acak berlabel (1)–(4), pilihannya susunan label.
- Pengecohnya potongan asli dari ayat/hadis materi (bukan ketikan AI). Pengecoh yang sebenarnya kata yang sama
  (hanya beda awalan/harakat) ditolak.
- **Edit**: tombol **Susun pilihan dari dalil** setelah mengubah potongan. **Ubah soal** bisa diminta "jadikan soal
  melengkapi ayat", "ayatnya di pilihan jawaban", atau "soal menyusun urutan ayat".
- Soal bergambar tidak lagi sekaligus diberi ayat/hadis.

---

## 0.42.0 — 13 November 2026
- **Ayat & hadis di soal tidak lagi asal tempel.** Aplikasi yang menentukan nomor mana memakai ayat/hadis (tersebar
  merata); soal lain tanpa dalil. Banyaknya diatur di **Lanjutan → Soal berayat/hadis**: tanpa, sedikit, sedang
  (bawaan, ±1 dari 3 soal), atau banyak.
- **Cara tampil beragam**, digilir supaya merata: Arab + terjemah, Arab saja, terjemah saja, potongan ayat/hadis
  (termasuk satu kata untuk arti kosakata), potongan terjemah, cukup disebut nama sumbernya ("QS. …"), atau hanya di
  pembahasan. Teksnya selalu dari data terverifikasi, tidak diketik AI. Bila jawabannya nama surah/perawi, sumber di
  bawah dalil disembunyikan.
- **Terjemah ayat otomatis** dari Kementerian Agama RI (lewat Tanzil) bila guru tidak menulis terjemahnya di materi.
  Terjemah hadis tetap dari materi guru.
- **Ubah soal** sekarang bisa mengganti cara tampil, misalnya "tampilkan artinya saja". **Edit** punya pilihan cara
  tampil dan potongan (kata ke berapa sampai ke berapa).
- **Kunci & pembahasan** (web dan Word) memuat dalil lengkap beserta terjemahnya bila di soal hanya potongan atau sebagian.
- Soal baru ditandai merah bila: ayat/hadis ditempel tetapi pertanyaannya tidak membahasnya, menyebut "terjemah"
  padahal terjemah tidak tampil, atau menyuruh memperhatikan ayat/hadis padahal tidak ada yang ditampilkan.
- Set lama tetap tampil seperti dulu.

---

## 0.41.0 — 13 November 2026
- **Tabel soal bisa diubah tanpa tanda "|".** Saat Edit, tabel tampil rapi di kotak **Pratinjau**; klik tabelnya
  (atau letakkan kursor di tabel lalu tekan **▦ Tabel**) untuk membuka jendela **Ubah tabel**: isi sel per sel,
  tambah/hapus baris dan kolom (paling banyak 6 kolom), atau hapus tabel. **▦ Tabel** di tempat lain = sisipkan tabel baru.
- **Sel menjorok**: tombol **→** di jendela Ubah tabel menggeser isi sel ke kanan, misalnya akun kredit pada jurnal
  umum. Ikut tampil di web dan di file Word.

---

## 0.40.1 — 12 November 2026
- **Tombol materi lebih ringkas.** Tulisan "Lampirkan Word/PowerPoint/PDF" dan "Foto halaman buku" diganti dua ikon:
  **klip** (Word, PowerPoint, PDF, atau foto dari galeri) dan **kamera** (langsung memotret satu halaman buku; hanya
  muncul di HP). Dulu di HP Android kamera tidak ditawarkan, langsung galeri. **Analisa materi** pindah ke kanan.

---

## 0.40.0 — 12 November 2026
- **Foto halaman buku jadi materi.** Tombol baru **Foto halaman buku** di kotak materi: di HP bisa langsung memotret
  (Kamera) atau memilih dari Galeri, boleh beberapa foto sekaligus (maks 50). AI membaca tulisan, tabel, rumus, dan
  gambar di foto seperti membaca halaman PDF, lalu materinya dianalisa seperti biasa. Biaya ±Rp10–20 per foto, sekali
  saja; setiap foto memakai jatah "halaman PDF dibaca AI" harian. Ayat & hadis tetap diambil dari data aplikasi.

---

## 0.39.0 — 12 November 2026
- **Bahasa Indonesia: satu bacaan untuk beberapa soal.** Di Ulangan Harian, AFTS, ASAS, dan Latihan, kira-kira separuh
  soal PG (di akhir bagian PG) dibuat berkelompok: satu bacaan untuk 2–3 soal. Bacaannya mengikuti jenis teks di materi
  (cerpen, eksposisi, berita, dsb.) dan tampil sekali di atas soal pertama kelompoknya, di web maupun di Word.
  Bentuk lain (isian, uraian, B/S, menjodohkan) tetap soal biasa.

---

## 0.38.0 — 12 November 2026
- Menu baru **Tentang aplikasi** di sidebar: versi, cara kerja singkat, peringatan wajib periksa, **rujukan aturan soal**
  (KMA, Kepdirjen Pendis, kerangka TKA, surat Kepala MA untuk ASAS, dll.), sumber teks Al-Qur'an & hadis, dan cara
  melapor masalah (hubungi admin).

---

## 0.37.0 — 12 November 2026
- **Racik Soal bisa dipasang seperti aplikasi di HP**: buka di Chrome → ⋮ → **Instal aplikasi**. Terbuka layar penuh
  tanpa bilah judul & alamat, dengan ikon sendiri (bintang delapan putih di atas hijau, sama dengan logo halaman masuk).
  Pintasan lama di layar HP perlu dihapus lalu dipasang ulang.
- Bilah status HP ikut warna bilah atas aplikasi (krem, atau gelap saat mode gelap).
- Panduan: tanya-jawab baru "Bagaimana memasang Racik Soal seperti aplikasi di HP?".

---

## 0.36.1 — 12 November 2026
- **Kotak hadis kuning kini menyebut yang kurang**: "Tempel teks Arab hadisnya", "Isi sumbernya (mis. HR. Baihaqi)",
  atau "✓ Lengkap. Tinggal centang". Tidak perlu menebak lagi.
- **Hadis yang ditempel lewat "+ Tambah hadis" langsung dicocokkan**: begitu selesai menempel, hadis dari 9 kitab
  langsung berubah hijau (teks & sumber dari data kitab), tidak perlu menunggu materi disimpan.
- **Kekurangan hadis ketahuan sebelum menekan Buat soal**: tombol Buat soal (dan Simpan materi) terkunci dengan pesan
  seperti "Hadis ke-2 belum diberi sumber." Tautan **Lihat kotaknya** langsung membawa ke kolom yang kurang.

---

## 0.36.0 — 12 November 2026
- **Hadis dikenali otomatis, seperti ayat**: hadis dari 9 kitab (Bukhari, Muslim, Abu Dawud, Tirmidzi, Nasa'i,
  Ibnu Majah, Malik, Ahmad, Darimi) yang ada di materi langsung jadi kotak **hijau** "✓ Hadis dari data kitab:
  HR. Muslim no. 2999". Teks Arab berharakat diambil dari data kitab, **tidak perlu dicentang**. Kitab yang ditulis
  di materi (mis. "HR. Muslim" atau "رواه مسلم") didahulukan. Terjemah tetap dari materi guru.
- **Hadis dari PDF tidak dibuang lagi** kalau cocok dengan data kitab. Cara buku menulis hadis tetap dikenali:
  pembuka "عن أبي هريرة ... قال رسول الله ﷺ", tulisan "(رواه مسلم)", dan lafal yang sedikit berbeda.
- Hadis yang tidak ada di data (Baihaqi, Thabrani, Hakim, atau lafal lain) tetap kotak **kuning** seperti dulu:
  isi sumber, periksa, centang. Doa, niat, kaidah, dan definisi tidak dianggap hadis.
- **Ayat**: "يَا أَيُّهَا الَّذِينَ آمَنُوا ..." kini terbaca utuh (dulu kata يَا hilang dan diberi "(potongan)"), dan ayat
  dari PDF yang diberi rujukan buku seperti "(البقرة/٢: ٤٣)" kini dikenali (dulu dibuang).
- Uji dengan buku PAI asli (Fiqih, Qurdis, Akidah): 12 dari 14 hadis 9 kitab dan 6 dari 6 ayat dikenali.

---

## 0.35.0 — 11 November 2026
- **Kunci ringkas bisa diunduh sebagai Word**: di jendela **Unduh** ada centang baru **Kunci ringkas** (bawaannya
  tidak dicentang). Isinya satu lembar untuk koreksi cepat: kunci pilihan ganda dalam tabel ("1. C  2. A ..."),
  jawaban isian, dan jawaban ideal uraian. Ikut urutan paket A–D, sama dengan kotak Kunci ringkas di halaman hasil.

---

## 0.34.1 — 11 November 2026
- **PDF yang dibaca AI lebih longgar**: sekali lampir kini sampai **50 halaman** (dulu 30), dan per hari sampai
  **200 halaman** per guru (dulu 100). Satu bab buku yang tebal bisa dibaca sekaligus; 50 halaman ±5 menit.

---

## 0.34.0 — 11 November 2026
- **Potong gambar**: tombol **✂ Potong** di bawah setiap gambar materi (Set baru dan Materi saya → Ubah) dan di
  bagian "Gambar soal" saat Edit soal. Geser kotaknya atau tarik sudutnya, lalu **Simpan potongan**. Berguna bila
  potongan AI dari PDF ikut tulisan. Gambar lama tidak diubah, jadi set yang sudah dibuat tetap memakai gambar lamanya.
- **Tulisan kecil diperbesar**: petunjuk, peringatan, dan pesan salah yang dulu 12 px kini 14 px (halaman masuk,
  Set baru, hasil soal, jendela Unduh, sidebar). Tombol Potong, Lepas, Hapus, dan Batalkan kini berbingkai sehingga
  jelas bisa dipencet. Tanggal, versi, dan label kecil sengaja tetap kecil.

---

## 0.33.3 — 11 November 2026
- **Gambar materi lebih banyak dipakai di soal**: aplikasi kini menentukan nomor mana yang bergambar (1 dari setiap
  5 soal, tersebar merata, tidak lebih dari jumlah gambar); AI memilih gambar yang paling cocok dan soalnya wajib
  menanyakan hal yang tampak di gambar. Dulu AI bebas memilih: satu set Fisika memakai 0 dari 10 gambar; kini 4–5
  soal bergambar per 25 soal. Soal menjodohkan dan Benar/Salah satu pernyataan tidak dijadikan soal bergambar.

---

## 0.33.2 — 11 November 2026
- **Pangkat negatif di buku PDF terbaca benar**: saat AI membaca halaman PDF, aplikasi ikut memberi teks asli
  halaman itu sebagai contekan angka. Dulu minus kecil di pangkat sering hilang ($10^{-30}$ terbaca $10^{30}$);
  diuji di Fisika X halaman 13–22: 43 dari 43 benar.
- **Kepala halaman tidak ikut masuk materi**: baris berulang seperti "Fisika SMA/MA X", "Biologi untuk SMA/MA
  Kelas XI", "Bab 1 | Menjelajah Sel", dan nomor halaman dibuang otomatis (berlaku juga untuk "teks saja").

---

## 0.33.1 — 11 November 2026
- **Soal grup Latihan TKA tidak lagi merah palsu**: kalau wacana bersama berbunyi "Perhatikan gambar berikut" dan
  gambarnya sudah ada di salah satu soal grup itu, soal lain di grup yang sama tidak ditandai "menyebut gambar tanpa
  gambar" lagi. Berlaku juga saat Edit, Ganti, dan Minta perubahan.

---

## 0.33.0 — 11 November 2026
- **Buku PDF Kemenag lebih leluasa**: file PDF boleh sampai 100 MB (dulu 30 MB) dan setebal apa pun (dulu maks 300
  halaman), karena file dibaca di HP/laptop guru dan tidak diunggah. AI kini membaca sampai 30 halaman sekali lampir
  (dulu 20), cukup untuk satu bab utuh.
- **Materi boleh lebih panjang**: isi satu materi dan total materi yang digabung dalam satu set maks 100 ribu huruf
  (dulu 30 ribu). Dulu 20 halaman buku Fisika ditolak SETELAH dibaca AI karena ±31 ribu huruf.
- Diuji dengan buku Biologi XI (31,5 MB, 312 halaman), Fisika X, dan Bahasa Indonesia XII.

## 0.32.7 — 11 November 2026
- **Bisa ditemukan di Google**: web terdaftar di Google Search Console (kode verifikasi dipasang). Yang boleh muncul di
  hasil pencarian hanya beranda dan halaman masuk; soal dan materi guru tidak (dijaga lewat `robots.txt` dan login).

## 0.32.6 — 11 November 2026
- **Halaman masuk di HP lebih rapi**: satu kartu putih polos (logo dan nama Racik Soal di atas kolom isian), posisinya
  sedikit lebih ke tengah, dan "MA Al-Fatah · versi" tampil di bawah layar. Kolom isian dan tombol lebih besar untuk
  jempol. Tampilan laptop tidak berubah.

## 0.32.5 — 11 November 2026
- **Halaman masuk lebih jelas**: kalau nama pengguna salah, muncul "Nama pengguna tidak terdaftar" dan namanya tetap
  tertulis untuk dibetulkan. Kalau kata sandi salah, muncul "Kata sandi salah" dan **hanya kata sandi** yang perlu
  diketik ulang (nama pengguna tidak ikut hilang).
- **Ganti kata sandi di Akun**: hanya kotak yang salah yang dikosongkan dan ditandai merah. Sandi lama salah → hanya
  sandi lama diketik ulang; ulangan tidak sama → hanya ulangannya.
- Pengaman: perangkat yang mencoba-coba lebih dari 10 nama tak terdaftar dalam 15 menit hanya mendapat pesan umum.

## 0.32.4 — 11 November 2026
- **Halaman Akun di laptop lebih lega**: menu tab di samping sidebar (tidak lagi di tengah), kartu lebih lebar.
  Profil dan Pemakaian hari ini berdampingan, Ganti kata sandi dan Perangkat lain berdampingan, centang mapel 4 kolom.
  Tampilan HP tidak berubah.

## 0.32.3 — 11 November 2026
- **Halaman Akun dibagi tiga tab**, tidak lagi satu halaman panjang: **Profil** (nama dan pemakaian hari ini),
  **Bawaan soal** (mapel, kelas, lama ujian, kesulitan, catatan tetap), dan **Keamanan** (kata sandi, perangkat lain).
  Di laptop tabnya di kiri, di HP di atas.
- Kotak ganti kata sandi kini punya **ikon mata** untuk melihat yang diketik, sama seperti di halaman masuk.
- Panduan bagian Akun diperbarui.

## 0.32.2 — 11 November 2026
- **Halaman Set baru lebih rapi:**
  - Kartu jenis ujian kini sejajar, dan kartu yang dipilih berlatar hijau muda dengan tanda centang.
  - Kotak **Catatan untuk AI** diberi garis tepi supaya jelas bisa diketik.
  - Di laptop, file Word/PowerPoint/PDF bisa **diseret** langsung ke kotak materi (sama dengan tombol Lampirkan).
  - Tulisan "0/5 materi" diperjelas menjadi "Dipakai 0 dari maks. 5 materi".
  - Teks materi yang sudah ditempel tapi belum dianalisa **tidak hilang** bila halaman tertutup atau dimuat ulang.
- Gambar Panduan langkah 1 dan 3 diperbarui sesuai tampilan baru.

## 0.32.1 — 11 November 2026
- **PDF hasil scan yang dulu terbaca kosong kini bisa dibaca**, misalnya buku *Al-Muyassar fi 'Ilmi an-Nahwi*. Sebagian
  PDF scan menyimpan halamannya dalam format gambar khusus (JPEG 2000 atau JBIG2); dulu halaman seperti ini terbaca
  sebagai halaman putih. Contoh uji: 2 halaman buku Nahwu tulisan tangan terbaca lengkap dengan harakat dalam 15 detik.

## 0.32.0 — 11 November 2026
- **Halaman Akun baru** (klik nama Anda di sidebar):
  - **Nama tampil** bisa diganti sendiri, boleh dengan gelar (mis. "Ust. Ahmad Fauzi"). Nama pengguna untuk masuk tetap
    diatur admin.
  - **Bawaan membuat soal**: mapel yang Anda ajar (tampil paling atas di Set baru dan Materi saya, yang pertama langsung
    terpilih), kelas, lama ujian, kesulitan, dan **catatan tetap untuk AI** (mengisi kotak Catatan untuk AI di setiap set
    baru, tetap bisa diubah). Tersimpan di server, jadi sama di HP maupun laptop.
  - **Pemakaian hari ini**: sisa jatah set, Ganti/Ubah/Tambah, dan halaman PDF.
  - Tombol **Keluarkan perangkat lain** (mis. lupa keluar di komputer lab).
- **Panduan baru, lebih mudah dipahami**: "Mulai cepat" 4 langkah dengan gambar layar HP bertanda merah bernomor,
  topik lain dalam lipatan (ketuk untuk membuka), dan tanya-jawab yang sering muncul.

## 0.31.2 — 11 November 2026
Mutu soal: lebih sedikit isian bocor dan soal kembar (tanpa fitur baru).
- **Isian bocor berkurang.** Jawaban isian berupa tahun (mis. "92 H") kini juga dijaga supaya tidak tertulis di soal
  lain. Saat memperbaiki isian yang bocor, AI diberi daftar nama dan tahun dari materi yang belum dipakai soal mana pun,
  jadi tidak lagi menebak. Contoh uji materi SKI yang sama: dulu 3 isian merah, kini 0–1.
- **Soal kembar lebih banyak tertangkap**, misalnya PG "menghitung tingkat inflasi" dengan B/S "menilai kebenaran hasil
  hitung inflasi", atau isian yang jawabannya sudah diuji soal lain. Baris kisi-kisi yang kembar ditulis ulang otomatis.
- Perbaikan otomatis tidak lagi mengganti dua isian ke konsep yang sama (mis. "PPnBM" dan "Pajak Penjualan atas Barang Mewah").
- Pesan merah isian bocor kini menyarankan: ganti jawaban isian, atau kurangi jumlah isian bila materinya pendek.

## 0.31.1 — 11 November 2026
Perapian dari hasil audit (tanpa fitur baru).
- **Keamanan**: web tidak bisa lagi ditampilkan di dalam web lain (mencegah penipuan "klik tersembunyi"), dan izin
  kamera, mikrofon, dan lokasi dimatikan karena memang tidak dipakai.
- **Menu di HP lebih ramah papan ketik**: saat menu ☰ dibuka, fokus langsung ke tombol ✕, tombol Tab tidak lari ke
  halaman di belakang, dan Esc menutup menu.
- **Kelola guru** (admin): kolom Ganti/Ubah/Tambah hari ini tidak lagi ikut menghitung halaman PDF yang dibaca AI.
- Bersih-bersih: tabel uji lama dan gambar bawaan yang tidak terpakai dihapus.

## 0.31.0 — 11 November 2026
- **PDF dibaca AI.** Setiap halaman PDF difoto di perangkat guru lalu dibaca AI, seperti orang membaca halaman buku.
  Hasilnya: **tabel** jadi tabel, **rumus** jadi rumus sungguhan, **gambar** (diagram, grafik, peta) dipotong dari
  halaman dan masuk ke bagian Gambar (logo dan hiasan tidak), dan **PDF hasil scan** sekarang bisa dipakai.
- **Ayat di buku PDF Kemenag kini dikenali.** Dulu teks Arab buku Kemenag rusak saat diambil, jadi tidak ada ayat yang
  dikenali. Sekarang ayatnya dikenali lalu diganti teks resmi mushaf (contoh uji: QS al-Mu'minun 12–14). Lafal Arab di
  tabel mufradat diganti ejaan resmi mushaf dari ayat di halaman itu. Hadis tetap ditempel guru (aturan tidak berubah).
- **PDF panjang**: lebih dari 20 halaman → guru memilih halaman bab yang diperlukan (bawaan 10 halaman). Ada juga
  pilihan "Pakai teks saja" (cara lama, tanpa AI).
- **Pemeriksa aplikasi**: bacaan AI dibandingkan dengan teks asli PDF; halaman yang kurang lengkap (< 85% kata) memakai
  teks asli. Halaman yang gagal dibaca AI juga memakai teks asli.
- Batas: 100 halaman PDF dibaca AI per guru per hari. Biaya ±Rp10–20 per halaman; ±1–5 detik per halaman (3 halaman
  dibaca bersamaan). Tetap jalan walau guru pindah tab sambil menunggu.
- Perbaikan: jatah Ganti/Ubah/Tambah harian kini hanya menghitung Ganti/Ubah/Tambah (tidak ikut terhitung pemakaian lain).

## 0.30.0 — 10 November 2026
- **Gambar di soal.** Soal kini bisa memakai gambar (diagram sel, peta, grafik, rangkaian, bangun ruang, dan lain-lain).
  Gambar tampil di bawah pertanyaan, di web maupun di file Word lembar soal (ikut ke Paket A–D).
- **Gambar dari materi guru, dipilih AI.** Saat Analisa materi, AI ikut **melihat gambar di file Word/PowerPoint
  beserta letaknya di materi**. Gambar yang termasuk isi pelajaran (diagram, grafik, peta, foto percobaan) otomatis masuk
  ke bagian **Gambar** di kartu materi lengkap dengan **keterangan buatan AI** (maksimal 10 per materi); logo, kop, dan
  hiasan tidak dipakai, tetapi tetap bisa dilihat dan dipakai bila AI keliru. Gambar juga bisa **ditempel (Ctrl+V)**,
  misalnya tangkapan layar dari PDF, langsung di kotak materi atau di kolom mana saja pada kartu materi, atau lewat
  **+ Tambah gambar**. Boleh diberi keterangan singkat. Di mapel eksak bagian Gambar langsung terbuka.
- Ingin lebih banyak soal bergambar: tulis di **Catatan untuk AI** (mis. "buat 5 soal yang memakai gambar"). Panduan
  sudah memuat cara membuat soal bergambar.
- **AI melihat gambarnya.** AI membaca isi gambar (bukan hanya keterangannya), merencanakan nomor mana yang bergambar di
  kisi-kisi, lalu menulis soal seperti "Perhatikan gambar berikut! Bagian yang ditunjuk huruf D adalah ....".
  AI **tidak bisa membuat gambar sendiri**; gambar selalu dari guru.
- **Edit gambar per soal.** Di Edit (dan Tulis soal sendiri) ada pilihan **Gambar soal**: tanpa gambar, salah satu gambar
  materi, atau unggah/tempel gambar baru.
- Soal yang menulis "perhatikan gambar" tetapi tidak ada gambarnya ditandai merah.
- Gambar tiap guru terpisah: guru lain tidak bisa membuka gambar Anda.
- Biaya AI: naik sedikit hanya untuk materi bergambar (analisa: pratinjau kecil ±200–400 token per gambar; pembuatan soal:
  ±250–1.500 token per gambar per tahap yang memakainya).
- Belum: gambar di dalam PDF belum diambil otomatis (tempel tangkapan layarnya); tabel & rumus dari PDF menyusul.

## 0.29.0 — 10 November 2026
- **Rumus di soal.** Pecahan, akar, pangkat, indeks, huruf Yunani, dan simbol (×, ≤, Δ, …) kini tampil sebagai rumus
  sungguhan di soal, pilihan jawaban, kunci, wacana, dan pembahasan. Di file Word rumusnya menjadi **rumus Word asli**
  (seperti Insert → Equation), jadi masih bisa diklik dan diubah di Word.
- **Rumus di materi ikut terbaca.** Rumus Equation di file Word materi guru dulu terbuang; sekarang ikut terbaca dan
  dipakai AI. Contoh materi untuk mencoba: `dokumen/contoh-materi/Materi Fisika X - Gerak Lurus (contoh uji rumus).docx`.
  Rumus di PDF belum terbaca rapi.
- **Tombol Σ Rumus saat Edit.** Guru menyusun rumus di jendela rumus visual seperti di Word (di HP dengan papan ketik
  rumus, desimal koma), tanpa perlu menghafal kode. Rumus yang sudah ada diubah dengan mengkliknya di kotak "Pratinjau
  rumus". Di kotak teks rumus tersimpan sebagai kode di antara dua tanda `$` (mis. `$v = \frac{s}{t}$`).
- Biaya AI per set tidak berubah.
- Perbaikan: pemeriksa kunci tidak lagi menganggap pilihan yang hanya beda tanda plus/minus (mis. `x² + 2x − 24` dan
  `x² − 2x − 24`) sebagai pilihan yang sama, jadi soal yang kuncinya benar tidak ikut ditandai "Kunci tidak cocok".

## 0.28.0 — 10 November 2026
- **Tabel di soal.** Data yang lebih jelas dibaca berbaris-berkolom (data percobaan, perbandingan, angka statistik)
  kini bisa muncul sebagai tabel sungguhan di soal, wacana, dan pembahasan: tampil rapi di web (di HP bisa digeser) dan
  menjadi tabel Word asli di lembar soal maupun file kunci. Tabel tidak dipakai di pilihan jawaban.
- **Tabel di materi ikut terbaca.** Tabel di file Word dan PowerPoint materi tidak lagi tercerai-berai; di kotak isi
  materi tampil sebagai baris `| sel | sel |`, jadi AI bisa membuat soal dari datanya. Tabel di PDF belum terbaca rapi:
  buka PDF-nya di Microsoft Word, simpan sebagai .docx, lalu lampirkan (tips ada di Panduan).
- Guru bisa mengubah tabel lewat tombol Edit soal (baris `| ... |` di kotak teks).

## 0.27.1 — 10 November 2026
- **Halaman masuk baru.** Satu kartu di tengah layar: kiri berisi tanda bintang delapan dan kalimat yang "diketik"
  bergiliran tentang cara Racik Soal bekerja di 6 mapel (Al-Qur'an Hadis, Fisika, Fiqih, Biologi, Bahasa Inggris,
  Matematika); kanan berisi sapaan "Assalamu'alaikum." dan form masuk. Di HP tampil ringkas tanpa animasi ketik.
  Cerita Fisika, Biologi, dan Matematika menyebut rumus, tabel, dan gambar yang belum ada di soal (sengaja, fitur menyusul).

## 0.27.0 — 9 November 2026
- **Daftar mapel sesuai MA Al-Fatah.** Pilihan mapel kini 20 mapel madrasah (termasuk Hadis, Tauhid, Fiqih Sholat, Nahwu,
  Al-Quds wal Maqdisiyyah). Mapel lain tetap bisa diketik lewat "Lainnya".
- **Nahwu diperlakukan seperti Bahasa Arab:** contoh kalimat Arab di materi tidak perlu diverifikasi seperti hadis.
- **Bahasa Inggris otomatis berbahasa Inggris.** Soal, pilihan, dan pernyataan ditulis dalam bahasa Inggris tanpa perlu
  catatan khusus, termasuk judul bagian dan petunjuk di file Word ("Choose the best answer!"). Pembahasan untuk guru tetap
  Bahasa Indonesia.
- **Mapel sejarah lebih aman dari tahun karangan.** Untuk SKI, Al-Quds wal Maqdisiyyah, dan Sejarah, tahun yang ditulis di
  soal sebagai fakta benar harus ada di materi guru; kalau tidak, soal ditandai merah lalu dicoba diperbaiki otomatis.

## 0.26.0 — 9 November 2026
- **Istilah Arab pendek tidak perlu diverifikasi lagi.** Tulisan Arab paling banyak 3 kata di materi (misalnya
  مُعْجِزَةٌ, خُلُقٌ, atau huruf ق) kini dipakai apa adanya: tidak dibuang, tidak masuk kotak ayat & hadis, dan tidak perlu
  dicentang. Daftarnya terlihat di kartu materi. Huruf ق juga tidak lagi dianggap ayat (QS. Qaf).
- **Tombol "Bukan ayat/hadis".** Teks Arab yang lebih panjang dan tidak ada di mushaf (misalnya kata mutiara/mahfuzhat)
  cukup diklik "Bukan ayat/hadis": tidak perlu menulis sumber dan tidak perlu centang. AI tidak akan menyebutnya hadis,
  dan lembar soal tidak lagi mencetak keterangan "(Bukan ayat/hadis)". Materi lama yang sumbernya ditulis
  "bukan ayat/hadis" otomatis dikenali.

## 0.25.0 — 9 November 2026
- **Kisi-kisi diperiksa ulang sebelum soal ditulis.** Setelah kisi-kisi disusun, AI memeriksanya sekali lagi untuk
  mencari nomor yang menguji hal yang sama di bentuk berbeda (misalnya PG dan isian sama-sama menghitung inflasi).
  Nomor yang belakangan diganti ke bagian materi lain. Soal kembar jadi lebih jarang, walau belum hilang sama sekali.
  Pembuatan satu set bertambah sekitar 10 detik.

## 0.24.4 — 9 November 2026
- **Soal isian yang jawabannya sudah tertulis di soal lain kini lebih sering berhasil diperbaiki otomatis.** Dulu AI
  hanya membuat satu soal pengganti, dan konsep barunya sering ternyata juga sudah dipakai soal lain, sehingga tetap
  merah. Kini AI membuat tiga calon sekaligus, lalu aplikasi memeriksa dan memakai calon pertama yang bersih. Waktu
  pembuatan soal tidak bertambah.

## 0.24.3 — 9 November 2026
- **Tidak ada lagi soal kembar di bentuk berbeda.** Dulu satu set bisa berisi PG dan isian yang sama-sama meminta
  hal yang sama (misalnya dua-duanya menghitung inflasi dari IHK, hanya angkanya beda). Kini setiap keterampilan
  dipakai satu nomor saja, dan nomor lain mengambil sisi lain materi (menggolongkan, mencari penyebab, dampak, dan
  sebagainya). Uraian tetap boleh memperdalam soal lain dengan langkah lengkap.

## 0.24.2 — 9 November 2026
- **Tanda merah "jawaban isian sudah tertulis" lebih tepat untuk jawaban berupa angka.** Dulu angka seperti "10%"
  ditandai bocor hanya karena muncul sebagai pilihan di soal lain, padahal siswa tetap harus menghitung. Kini yang
  ditandai hanya angka yang sudah diberikan di soal lain (misalnya soal lain menulis "PPN dengan tarif 11%" dan isian
  menanyakan tarif PPN). Jawaban berupa kata diperiksa seperti biasa.

## 0.24.1 — 9 November 2026
- **Menjodohkan: satu daftar jawaban, satu jenis.** Dulu jawaban di satu daftar bisa bercampur (istilah dicampur
  nama nabi), sehingga siswa bisa menebak dari jenisnya. Kini setiap blok memakai satu indikator yang sama, jawabannya
  sejenis, dan jawaban tambahan (pengecoh) tidak pernah sama dengan jawaban nomor lain. Isi daftar tetap perlu dilirik
  guru: kadang masih ada jawaban yang sedikit beda bentuk dalam satu topik.
- Set lama tidak berubah; perbaiki lewat **Edit** bila perlu.

## 0.24.0 — 9 November 2026
- **Menu "Materi saya" kembali di sidebar** (di bawah Panduan). Materi dikelompokkan per mapel & kelas, ada hitungan
  jumlah materi, dan peringatan sejak awal bila hampir mencapai batas.
- **Materi bisa ditambah dari dua tempat**: langsung di Set baru (seperti sebelumnya), atau di Materi saya →
  **+ Tambah materi** (tempel teks / lampirkan Word, PowerPoint, PDF → Analisa materi → **Simpan materi**), tanpa harus
  membuat soal. Cocok untuk menyiapkan beberapa bab sekaligus.
- **Satu bentuk kartu materi** untuk Set baru, Tambah materi, dan Ubah materi (formulir lama dihapus). Ubah materi kini
  juga punya penanda TP dan kotak ayat yang sama.
- **"Ambil ayat" kini ada di kartu materi** (juga di Set baru): ketik "QS An-Nur: 2", teks diambil dari mushaf.
  Hadis ditambah lewat **+ Tambah hadis**, lalu dicentang.
- Tombol **Buat soal** di tiap materi langsung membuka Set baru dengan materi itu sudah terpilih.
- **File materi bisa dilepas satu per satu** (tombol ✕, terlihat jumlah hurufnya). Dulu file yang kepanjangan tetap
  tertumpuk, jadi materi yang sudah dipendekkan tetap ditolak. Pesan "terlalu panjang" kini menyebut jumlah huruf dan
  file terbesarnya, dan langsung muncul tanpa menunggu server.

## 0.23.0 — 8 November 2026
- **Sapaan di halaman Set baru kini berganti-ganti** setiap halaman dibuka, seperti aplikasi AI: campuran formal dan
  santai ("Kopi dulu, baru racik soal ☕", "Jumat berkah"), menyesuaikan pagi/siang/sore/malam (WIB), hari, dan musim
  ujian, dengan nama depan guru.
- **Ikon panah dropdown kini seragam** di semua pilihan dan tombol panel (Mapel, Kelas, Kop ujian, Kesulitan, jumlah
  soal, Lanjutan, dan lainnya), dan berbalik ke atas saat panelnya terbuka.
- **Tombol Buat soal kini sejajar** dengan tombol di sebelahnya (sama tinggi, seperti Analisa materi).

## 0.22.1 — 8 November 2026
- **Tampilan halaman Buat soal dirapikan:**
  - Judul berhuruf Arab di riwayat (sidebar, Riwayat, Semua set) kini terbaca dari kanan dan tidak mengacak urutan
    tulisan di sekitarnya.
  - Tombol yang belum bisa ditekan kini abu-abu (dulu hijau pucat, terlihat seperti rusak).
  - Alasan tombol **Buat soal** terkunci kini tampil tepat di bawah tombolnya.
  - Kotak "Catatan untuk AI" lebih kecil dan petunjuknya lebih singkat.
  - Kalimat keterangan di bawah tombol format ASAS dipersingkat.

## 0.22.0 — 8 November 2026
- **Format ASAS MA Al-Fatah** (sesuai surat Kepala MA, 7 November 2026). Memilih kartu **ASAS** langsung mengisi:
  - **Eksak** (Matematika, Fisika, Kimia, Biologi): 20 PG, 5 PG kompleks, 5 Benar/Salah, 5 esai = 35 soal;
    HOTS 8, MOTS 15, LOTS 12.
  - **Non-Eksak** (mapel lain): 30 PG, 5 PG kompleks, 5 Benar/Salah, 5 esai = 45 soal; HOTS 10, MOTS 20, LOTS 15.
  - Skor total otomatis 100. Ada dua tombol "Eksak (35 soal)" dan "Non-Eksak (45 soal)" untuk berpindah.
  - Menjodohkan + Benar/Salah boleh dicampur (total 5, menjodohkan minimal 3), lewat tombol jumlah soal.
- **Batas soal per set naik dari 40 ke 50.**
- **Benar/Salah dan Menjodohkan kembali ke gaya Al-Fatah** (semua jenis soal kecuali Latihan TKA):
  - Benar/Salah: satu nomor satu pernyataan, dijawab A (Benar) atau B (Salah). Kunci Benar/Salah diatur aplikasi supaya
    seimbang.
  - Menjodohkan: satu nomor satu pernyataan; beberapa nomor dijodohkan dengan satu daftar jawaban (ada satu pengecoh).
    Diperbaiki lewat **Edit** (tidak bisa diganti AI per nomor, karena daftar jawabannya dipakai bersama).
  - Kedua bentuk ini tidak diberi level HOTS; HOTS dipindah ke PG, PG kompleks, atau esai, jumlah totalnya tetap.
- **Komposisi level kini selalu persis** dengan yang diminta (dulu bisa meleset 1–2 soal karena AI menulis level sendiri).
- Menu **Lanjutan** menampilkan jumlah soal tiap level, mis. "LOTS 12, MOTS 15, HOTS 8 soal".

## 0.21.1 — 8 November 2026
- **Mapel yang tidak diujikan di TKA kini memakai nama "Latihan Gaya TKA".** Menurut aturan resmi (Kepmendikdasmen
  56/2026), mapel agama (Qurdis, Fikih, Akidah Akhlak, SKI, dan lainnya) serta Informatika tidak diujikan di TKA.
  Untuk mapel-mapel itu, kartu jenis soal, riwayat, nama file, dan judul Word kini bertuliskan "Latihan Gaya TKA" /
  "LATIHAN SOAL GAYA TKA", bukan "Tes Kemampuan Akademik". Isi dan aturan soalnya tetap sama (bergaya TKA).
  Mapel TKA (Biologi, Bahasa Arab, Matematika, dll.) tetap "Latihan TKA".

## 0.21.0 — 8 November 2026
- **Latihan TKA kini mengikuti contoh soal resmi Pusmendik:**
  - PG kompleks boleh 2, 3, atau 4 jawaban benar, dengan petunjuk baku "Pilihlah jawaban yang benar! Jawaban benar
    lebih dari satu."
  - Soal Kategori berisi 3 pernyataan, dengan label resmi (Benar/Salah, Tepat/Tidak Tepat, Sesuai/Tidak Sesuai,
    Setuju/Tidak Setuju, Logis/Tidak Logis).
  - Nama level untuk mapel bahasa mengikuti TKA: Bahasa Arab = Pemahaman Literal / Reorganisasi / Pemahaman
    Inferensial; Bahasa Indonesia & Inggris = Pemahaman Tekstual / Pemahaman Inferensial / Evaluasi dan Apresiasi.
- **Jumlah jawaban benar PG kompleks kini lebih beragam di semua jenis soal.** Dulu AI sering memberi jumlah yang sama
  di setiap soal; sekarang aplikasi yang merencanakannya per nomor di kisi-kisi.
- Jenis lain (Ulangan Harian, AFTS, ASAS, Latihan) tetap seperti biasa: PG kompleks 2–3 jawaban benar, Kategori 4
  pernyataan.

## 0.20.0 — 7 November 2026
- **Tujuan Pembelajaran (TP) kini diputuskan guru.** Panduan resmi menyebut TP dirumuskan guru, bukan AI.
  - Kalau materi yang ditempel sudah memuat TP, TP itu disalin persis beserta kodenya (misalnya "TP 2.1"), kotak hijau.
  - Kalau materi tidak memuat TP, AI mengusulkan TP (kotak kuning). Guru wajib membaca, boleh mengubah, lalu mencentang
    "Saya sudah membaca TP ini dan sesuai dengan yang saya ajarkan" sebelum tombol **Buat soal** terbuka.
  - Materi yang sudah tersimpan tidak perlu dicentang ulang.
- Dokumen baru **RUJUKAN.md**: peta dasar resmi setiap aturan soal (KMA 1503/2025, CP Kepdirjen 9941/2025, POS Ujian
  Madrasah, Kerangka TKA, dll.), beserta perbedaan yang masih harus diperbaiki dan dokumen yang masih dicari.

## 0.19.1 — 7 November 2026
- **Menjodohkan kini wajib berpasangan satu-satu.** Dulu AI kadang membuat "pengelompokan" (misalnya lima pajak
  dijodohkan ke "pemerintah pusat/daerah"), sehingga jawabannya berulang dan soal tetap merah. Sekarang dicegah, dan
  kalau tetap terjadi, perbaikan otomatis boleh memakai sisi materi lain. Uji: 0 soal menjodohkan merah (dulu 2).
- **Perbaikan otomatis soal isian yang bocor kini lebih jitu.** AI diberi daftar kata yang sudah tertulis di soal lain,
  sehingga jawaban penggantinya tidak ikut bocor. Uji: isian yang tetap merah turun dari 2 menjadi 1 per set; sisanya
  jawaban berupa angka (misalnya "10%").

## 0.19.0 — 7 November 2026
Sisa perbaikan dari audit uji soal:
- **Urutan 4 pernyataan soal Kategori kini diacak aplikasi**, sehingga letak pernyataan yang salah tidak lagi berpola
  (dulu sering Benar, Benar, Benar, Salah). Label juga lebih beragam (Benar/Salah, Tepat/Tidak Tepat, dan lainnya).
- **Rubrik uraian kini menyebut skor sebagian**, misalnya "4 = dua perbedaan tepat; 2 = satu perbedaan tepat;
  0 = tidak ada". Angkanya selalu cocok dengan bobot uraian di form.
- **Soal HOTS yang tidak punya stimulus sama sekali kini ditandai merah** dan diperbaiki otomatis.
- **Dua soal menjodohkan yang hampir sama kini ditandai merah**, dan AI kini melihat isi menjodohkan lain saat menulis
  soal baru.

## 0.18.3 — 7 November 2026
- **Jawaban soal isian lebih jarang bocor.** Jawaban isian kini direncanakan sejak kisi-kisi, lalu AI dilarang
  menuliskannya di soal lain. Uji set Ekonomi: dulu 2–3 soal isian tetap merah, sekarang 0. Belum tuntas: kalau
  kisi-kisinya sendiri menanyakan konsep yang sama dua kali, jawaban masih bisa bocor (tetap ditandai merah).
- **Pesan "jawaban isian sudah tertulis" kini menunjukkan letaknya**, misalnya: soal nomor 1 ("Fardu ain").
  Guru tidak perlu mencari sendiri.
- Dua soal isian dengan jawaban yang sama juga ditandai.

## 0.18.2 — 7 November 2026
Perbaikan dari hasil audit uji soal (`dokumen/audit/AUDIT-SOAL-2026-11-07.md`):
- **Kunci PG yang salah hitung kini ditandai merah.** Sebelumnya AI kadang menulis kunci dulu, baru menghitung.
  Contohnya pembahasan menghitung Rp82.500.000, tapi kuncinya Rp87.000.000. Sekarang AI wajib menghitung dulu dan
  menulis jawaban benarnya, baru menyusun pilihan. Aplikasi mencocokkannya dengan kunci; kalau tidak cocok, soal
  diperbaiki otomatis. Uji ulang dua set (37 soal): semua kunci benar.
- **Pembahasan yang menunjuk "pengecoh kedua" kini ditandai.** Urutan pilihan diacak aplikasi, jadi "kedua" bisa
  menunjuk pilihan yang salah. Pembahasan harus menyebut isi pilihannya.
- **PG kompleks dengan pilihan "(2) dan (3)" kini ditandai.** Di PG kompleks, siswa sendiri yang memilih semua
  jawaban yang tepat, jadi pilihan gabungan membingungkan.

## 0.18.1 — 7 November 2026
- **Soal uraian kini menyebut batasan jawaban** ("Sebutkan tiga ...", "Jelaskan dua alasan ..."), bukan "Jelaskan
  tentang ...!". Rubriknya mengikuti batasan itu, supaya penilaian lebih adil.
- **Pilihan "semua benar", "tidak ada yang benar", dan "A dan B benar" kini ditandai merah** lalu diperbaiki otomatis.
  Pilihan yang menunjuk huruf berbahaya karena urutan pilihan diacak aplikasi (juga di Paket B–D). Pilihan seperti
  "1 dan 3" (nomor pernyataan di soal) tetap boleh.

## 0.18.0 — 7 November 2026
Revisi aturan soal (ATURAN-SOAL.md):
- **Kunci PG yang mencolok panjangnya kini ditandai merah** dan diperbaiki otomatis. Di soal lama, 6 dari 10 soal PG
  kuncinya adalah pilihan terpanjang, sehingga siswa bisa menebak tanpa paham. Yang ditandai hanya yang mencolok
  (kunci terpanjang dan 1,5 kali rata-rata pengecoh). AI juga diminta membuat pengecoh sama panjang dan sama rinci.
- **Tingkat kesulitan "Mudah" tidak lagi membuat soal HOTS kehilangan stimulus.** Dulu kedua aturan ini berlawanan.
- **Masalah khilafiyah**: soal tidak memihak satu mazhab. Soal menyebut pendapat siapa yang ditanyakan, atau
  menanyakan perbedaannya.
- **Ejaan istilah keagamaan sesuai KBBI** (salat, wudu, Allah Swt., Nabi Muhammad saw.), dan transliterasi tanpa
  huruf bergaris/bertitik ("hissi", bukan "ḥissī"), kecuali di mapel Bahasa Arab.
- **Nama tokoh dalam cerita lebih beragam**, seimbang putra dan putri. Tokoh yang berbuat salah tidak memakai nama
  nabi atau sahabat.
- Dokumen aturan dirapikan: semua aturan yang sudah jalan diberi tanda yang benar, catatan guru punya 4 hal yang
  dikunci (bukan 3), dan bobot Menjodohkan/Isian dicatat.

## 0.17.3 — 5 November 2026
- **Kunci isian yang bocor kini ditandai merah**: kalau jawaban soal isian sudah tertulis di pertanyaan atau pilihan soal
  lain (misalnya kunci "ḥissī" padahal "mukjizat ḥissī" sudah jadi pilihan di soal PG), soal isian itu ditandai, lalu
  **diperbaiki otomatis**: AI diminta menanyakan konsep lain, dan indikator di kisi-kisi ikut diperbarui.
  Pemeriksaannya mengabaikan beda huruf seperti ḥ/h dan ā/a.
- Perbaikan otomatis tidak lagi gagal kalau AI mengirim satu soal tanpa dibungkus daftar.
- Diketahui: soal hasil perbaikan kadang mirip dengan soal lain (guru tetap perlu memeriksa).

## 0.17.2 — 5 November 2026
- Aturan baru untuk AI: **jawaban satu soal tidak boleh tertulis di soal lain** (terutama kunci isian singkat).
  Saat soal dibuat bertahap, AI kini juga diberi tahu **jawaban** soal-soal tahap sebelumnya, bukan hanya pertanyaannya.
  Mengurangi kebocoran, tetapi belum menjamin: guru tetap perlu memeriksa.

## 0.17.1 — 5 November 2026
- **Peringatan "materi sedikit sekali"** di kotak Materi: muncul kalau isi materi kurang dari 300 huruf (misalnya hanya
  berisi perintah "terapkan materi kelas 11"), baik materi baru hasil analisa maupun "materi sebelumnya". Tanpa isi bab
  yang jelas, AI menebak isi pelajaran sendiri dan soal bisa meleset dari buku/kurikulum (kasus set ASAS Matematika XI).
  Guru tetap boleh lanjut.

## 0.17.0 — 5 November 2026
Fitur baru: **perbaikan otomatis soal bertanda merah**.
- Saat set dibuat, setiap soal yang melanggar aturan (misalnya kunci PG Kompleks bukan 2–3, pilihan bukan 5, soal
  isian tanpa titik-titik, menjodohkan dengan kunci kembar, teks Arab yang tidak cocok dengan mushaf) **dikirim balik ke
  AI satu kali** untuk diperbaiki, lalu **diperiksa ulang oleh aplikasi**. Kalau sudah bersih, soal diganti; kalau masih
  melanggar, soal awal tetap ditandai merah untuk diperiksa guru.
- Tidak memakai jatah Ganti/Ubah guru. Waktu hanya bertambah kalau memang ada soal yang merah.
- Admin melihat kotak "Perbaikan otomatis" di halaman hasil (soal mana dan masalahnya apa).
- Tetap berlaku: kesalahan yang tidak bisa dideteksi aplikasi (misalnya hitungan keliru tapi jumlah kuncinya pas)
  tidak ikut diperbaiki. Guru tetap wajib memeriksa.

## 0.16.5 — 5 November 2026
Perbaikan dari uji perbandingan model (DeepSeek Flash vs Claude Opus).
- Sebagian model AI (misalnya Claude) kadang membungkus jawabannya dengan tanda ```json, sehingga set soal **gagal**
  dengan pesan "jawaban bukan JSON". Kini tanda itu dibuang otomatis sebelum jawaban dibaca, untuk semua model.

## 0.16.4 — 5 November 2026
Persiapan ASAS: tampilan HP saat soal sedang dibuat.
- Tulisan **"Masih meracik: 10 dari 12 soal sudah jadi"** kini **menempel di atas layar** saat guru menggulir membaca
  draf soal, jadi selalu terlihat kapan prosesnya selesai.
- Tabel **kisi-kisi** di HP diberi petunjuk **"Geser tabel ke samping untuk melihat semua kolom →"** (tabelnya lebih lebar
  dari layar HP).
- Sudah dicek: riwayat di sidebar langsung berubah dari "sedang dibuat" menjadi jumlah soal begitu set selesai.

## 0.16.3 — 5 November 2026
- Menu **Lainnya** di kartu soal kini menampilkan **sisa jatah** Ganti/Ubah/Tambah pakai AI, misalnya
  "Sisa ganti/ubah/tambah pakai AI: set ini 12 dari 30 · hari ini 41 dari 60". Jadi guru tahu sebelum jatahnya habis.
- Kalau jatah habis, tombol Ganti, Tambah, dan Ubah soal **dimatikan** dengan alasan tertulis:
  - jatah **set** habis: tidak kembali; perbaiki lewat Edit atau Tulis soal sendiri, atau buat set baru dengan
    "Pakai materi ini lagi";
  - jatah **hari ini** habis: Edit dan Tulis soal sendiri tetap bisa; besok jatahnya kembali.
- Panduan menjelaskan bahwa jatah 30 per set tidak kembali, sedangkan jatah 60 per hari kembali penuh setiap hari.

## 0.16.2 — 5 November 2026
- Kalau guru salah kata sandi 5 kali, perangkatnya dikunci 15 menit. Sekarang **"Reset kata sandi" oleh admin langsung
  membuka kunci itu**, jadi guru bisa segera masuk dengan kata sandi baru tanpa menunggu. (Dulu tetap harus menunggu
  15 menit walau sudah direset.)
- Panduan menjelaskan kunci 15 menit ini.

## 0.16.1 — 5 November 2026
- Keamanan masuk: satu-satunya jalan masuk kini **halaman Masuk**. Dulu ada "pintu belakang" bawaan alat login
  (alamat /api/auth/...) yang bisa dipakai menebak kata sandi berkali-kali tanpa kena kunci 5 kali salah. Pintu itu
  tidak dipakai aplikasi, jadi ditutup. Tidak ada perubahan tampilan; masuk, keluar, ganti kata sandi, dan Kelola guru
  tetap seperti biasa.

## 0.16.0 — 5 November 2026
Perapian keamanan menuju 1.0.0.
- **Batas harian Ganti/Ubah/Tambah soal: 60 kali per guru per hari** (selain batas 30 kali per set). Yang dihitung hanya
  yang berhasil. Kalau habis, Edit dan Tulis soal sendiri tetap bisa. Admin tidak dibatasi.
- Batas **analisa materi** (30 kali per hari) kini tercatat di database, jadi tidak lagi kembali ke nol saat server
  dinyalakan ulang.
- **Kelola guru** menampilkan "ganti/ubah X dari 60" hari ini untuk tiap guru.
- Di balik layar: tes otomatis **pemisahan data antar guru**. Akun guru B mencoba 24 cara membuka, mengubah, dan
  mengunduh set serta materi guru A; semuanya harus ditolak dan isi guru A tetap utuh. Tes ini dijalankan di laptop
  sebelum setiap rilis.
- Daftar **Persiapan menuju 1.0.0** ditambahkan di atas (target: setelah ASAS Ganjil, sekitar Desember 2026).

## 0.15.0 — 5 November 2026
- **Tulis soal sendiri.** Di akhir tiap bagian halaman hasil ada tombol **"+ Tulis soal … sendiri"** (dan "Tulis soal
  bentuk lain" di paling bawah). Formulirnya sama dengan Edit. Soal ini **tanpa AI** dan **tidak memakai jatah**,
  langsung masuk di akhir bagiannya, dan kisi-kisi ikut bertambah.
- Soal tulisan guru tetap diperiksa pemeriksa ayat: teks Arab yang tidak cocok dengan data terverifikasi ditandai merah.
  Isian yang belum lengkap diberi pesan yang jelas.
- Panduan diperbarui.

## 0.14.0 — 5 November 2026
- **Paket A, B, C, D** untuk mencegah contek. Isi soal sama; di paket B–D urutan soal (di dalam tiap bagian) dan
  urutan pilihan jawaban diacak, lajur kanan Menjodohkan juga diacak. Soal grup tetap bersama wacananya, pilihan angka
  tetap urut kecil ke besar, dan kunci tetap tersebar merata. Acakan tetap: Paket B selalu sama setiap kali diunduh
  dan ikut soal yang sudah diedit.
- Lembar soal tiap paket bertuliskan **"PAKET B"** (dst.) di atas soal pertama; kop madrasah tidak berubah. Lembar
  kunci tiap paket memuat **padanan nomor** ke Paket A, karena kisi-kisi mengikuti urutan Paket A.
- **Jendela Unduh** baru (menggantikan menu kecil): (1) pilih paket, boleh lebih dari satu, (2) centang file yang
  dibutuhkan, lalu terlihat daftar file yang akan diunduh dan satu tombol **"Unduh N file"**. Di HP tampil sebagai
  panel dari bawah. Bawaannya Paket A saja, sama seperti sebelumnya.
- **Kunci ringkas** ikut menampilkan kunci paket yang dipilih.

## 0.13.0 — 5 November 2026
Fitur pematangan setelah uji coba guru.
- **Satu tombol Unduh** di bawah halaman hasil. Pilih **Semua file** untuk mengunduh lembar soal siswa, kunci &
  pembahasan, dan kisi-kisi (3 file Word) sekaligus; tiap file juga bisa diunduh sendiri. Bila browser bertanya
  "izinkan beberapa unduhan?", pilih Izinkan.
- **Cetak tampilan ini (PDF)** ada di menu Unduh: mencetak isi halaman saja (tanpa sidebar dan tombol, selalu warna
  terang). Catatan: hasil ini **tanpa kop madrasah**; untuk PDF berkop, buka file Word lalu simpan sebagai PDF.
- **Kunci ringkas**: semua kunci satu set dalam satu kotak (mis. "1. C 2. D …"), dengan tombol **Salin** untuk ditempel
  di WhatsApp atau catatan.
- Tombol **↑ / ↓** di kartu soal untuk memindah urutan soal di dalam bagiannya; kisi-kisi ikut berpindah.
- Halaman **Riwayat** bisa dicari (nama set atau materi) dan disaring per jenis soal dan mapel; admin di **Semua set**
  juga bisa menyaring per guru dan status. Tautan "Lihat & cari semua riwayat" selalu ada di sidebar.
- Panduan diperbarui untuk fitur-fitur di atas.

## 0.12.0 — 4 November 2026
Persiapan uji coba guru.
- **Halaman Panduan** (tautan di sidebar untuk semua akun): cara membuat set, memeriksa dan memperbaiki soal, mengunduh
  Word, riwayat, aturan penting, dan apa yang dilakukan kalau ada masalah.
- **Kelola guru** (admin) menampilkan pemakaian: set hari ini dari jatah 10, jumlah set dan token AI 30 hari, serta
  tanggal set terakhir tiap akun; di atasnya total pemakaian seluruh web hari ini.
- Setelah **Edit** soal disimpan muncul tulisan hijau **"Tersimpan ✓"** (juga setelah Ganti/Ubah soal berhasil).
- Keamanan masuk: salah kata sandi 5 kali kini hanya mengunci **perangkat itu** selama 15 menit, jadi orang lain tidak
  bisa mengunci akun guru. Tebakan dari banyak perangkat tetap dibatasi (30 kali per nama pengguna).

## 0.11.1 — 4 November 2026
- Sidebar menandai **halaman yang sedang dibuka**: riwayat set yang sedang dilihat (latar sorot + judul tebal), juga
  menu admin Semua set, Kelola guru, dan Pengaturan. Jadi selalu terlihat sedang berada di mana.
- Tombol **Set baru** kini berlatar polos dengan tanda **+** di lingkaran hijau, supaya tidak tampak seperti "sedang dibuka".

## 0.11.0 — 4 November 2026
Hasil audit 4 November (lihat `dokumen/audit/AUDIT-2026-11-04.md`).
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
