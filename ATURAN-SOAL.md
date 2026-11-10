# Aturan Penyusunan Soal — Madrasah Aliyah, semua mapel

**Status: DISETUJUI pemilik (2026-10-20), termasuk semua usulan, yang ditunda, bagian TKA (bagian 9),
dan 3 aturan tambahan dari contoh try out (bagian 10).** Isi file ini menjadi aturan baku
yang diberikan ke AI setiap kali membuat soal.

Revisi 2026-11-07 (versi 0.18.0, disetujui pemilik): kesulitan vs HOTS (1c no. 5), khilafiyah (2a no. 6), kunci tidak
boleh pilihan terpanjang + pemeriksa aplikasi (2b no. 7), ejaan KBBI (2c no. 5), nama tokoh (4 no. 6), dan tanda di
dokumen ini disamakan dengan aplikasi. Versi 0.18.1: uraian berbatasan (bagian 3) dan pemeriksa pilihan terlarang (2b no. 6).
Versi 0.18.2 (dari `dokumen/audit/AUDIT-SOAL-2026-11-07.md`): kunci PG dicocokkan dengan hasil hitung AI (2a no. 2), PG kompleks tanpa
pilihan gabungan (2b no. 6), pembahasan tidak menunjuk urutan pilihan (10 no. 2).
Versi 0.19.0 (sisa audit): HOTS tanpa stimulus ditandai (1c no. 3), Menjodohkan mirip ditandai (2b no. 10), pernyataan
Kategori diacak aplikasi + label diragamkan (bagian 3), contoh rubrik dengan skor sebagian (bagian 3).
Versi 0.18.3: jawaban isian direncanakan di kisi-kisi dan dilarang tertulis di soal lain (2b no. 11).
Versi 0.19.1: menjodohkan wajib satu-satu (bagian 3); perbaikan isian bocor diberi daftar kata terpakai (2b no. 11).

Tanda di dokumen ini:
- ✅ = sudah dijalankan aplikasi (semua aturan di file ini sudah jalan, kecuali yang diberi ⚠️ atau "ditunda")
- 🔍 = selain dikirim ke AI, juga DIPERIKSA aplikasi (soal ditandai merah bila melanggar)
- ⚠️ = sumbernya tidak seragam / perlu keputusan pemilik

> Catatan sumber: dokumen resmi Kemenag tentang penulisan butir soal **tidak ditemukan utuh di internet**.
> Isi di bawah dirangkum dari panduan penyusunan soal Asesmen Madrasah yang beredar, kaidah Puspendik,
> taksonomi Bloom revisi, dan panduan Kurikulum Berbasis Cinta (Kemenag 2025). Daftar sumber ada di bagian akhir.
> Dasar setiap aturan (resmi / kaidah / keputusan madrasah / belum ada) dipetakan di `RUJUKAN.md`.

---

## 1. Taksonomi Bloom revisi (Anderson & Krathwohl)

### 1a. Enam level proses berpikir
| Level | Nama | Siswa diminta... | Contoh kata kerja |
|---|---|---|---|
| C1 | Mengingat | mengenali / menyebut kembali | menyebutkan, mendefinisikan, mengidentifikasi |
| C2 | Memahami | menjelaskan makna dengan kata sendiri | menjelaskan, mencontohkan, menyimpulkan, membandingkan |
| C3 | Menerapkan | memakai konsep/prosedur pada situasi baru | menerapkan, menghitung, menentukan, mendemonstrasikan |
| C4 | Menganalisis | memecah informasi, mencari hubungan, sebab-akibat | menganalisis, membedakan, menghubungkan, menelaah |
| C5 | Mengevaluasi | menilai dengan alasan/kriteria | menilai, mengkritik, membuktikan, memutuskan |
| C6 | Mencipta | menyusun gagasan/rencana/solusi baru | merancang, merumuskan, menyusun, mengusulkan |

### 1b. Pengelompokan level (dipakai di madrasah)
| Kelompok | Level Bloom | Level Puspendik | Ciri |
|---|---|---|---|
| LOTS | C1–C2 | L1 Pengetahuan & pemahaman | bisa dijawab dengan hafalan/pemahaman langsung |
| MOTS | C3 | L2 Aplikasi | menerapkan konsep ke situasi yang mirip pelajaran |
| HOTS | C4–C6 | L3 Penalaran | butuh menalar; tidak cukup hafalan |

✅ Pembagian ini sudah dipakai aplikasi. ⚠️ Ada sumber yang memasukkan C3 ke LOTS (hanya 2 kelompok);
aplikasi tetap memakai 3 kelompok karena umum di kisi-kisi madrasah.

### 1c. Aturan penting tentang level (sering keliru)
1. ✅ **Kata kerja di soal BUKAN penentu level.** Yang menentukan adalah proses berpikir yang dibutuhkan siswa.
   Soal "Analisislah ..." yang jawabannya bisa dihafal tetap C1.
2. ✅ **HOTS ≠ sulit.** HOTS = menalar. Soal hafalan yang rumit tetap LOTS; soal HOTS bisa saja mudah.
   (Di aplikasi, "Tingkat kesulitan" dan "Level" adalah dua pengaturan yang berbeda.)
3. ✅ **Soal HOTS wajib memakai stimulus** yang belum pernah dibaca siswa (kasus, data, teks, fenomena),
   dan jawabannya harus diperoleh dengan mengolah stimulus itu. Bila jawabannya langsung tertulis di stimulus atau cukup
   diingat, soal itu LOTS, bukan HOTS. 🔍 (0.19.0) Soal C4–C6 tanpa wacana/dalil yang pertanyaannya < 80 huruf
   ditandai "HOTS tanpa stimulus" (Menjodohkan dilewati). Batas diukur pada ±100 soal HOTS lama: hanya yang benar-benar
   kosong yang kena. Soal hafalan yang punya stimulus tapi berlabel HOTS tidak bisa diperiksa otomatis.
4. ✅ **Soal C1–C2 tidak perlu stimulus panjang.** Pokok soal langsung lebih baik.
5. ✅ (0.18.0) **Tingkat kesulitan mengatur berat soal di dalam levelnya**, tidak mengubah level dan tidak menghapus
   stimulus soal HOTS. "Mudah" untuk soal HOTS = stimulus pendek dan sederhana, bukan tanpa stimulus.
   (Dulu aturan "Mudah: tanpa stimulus panjang" bertabrakan dengan no. 3.)

### 1d. Dimensi pengetahuan (opsional)
Bloom revisi juga membagi jenis pengetahuan: faktual, konseptual, prosedural, metakognitif.
⚠️ Belum dipakai di aplikasi. Usul: **tidak ditambahkan dulu** (kisi-kisi madrasah umumnya hanya mencantumkan level C1–C6).

---

## 2. Kaidah umum penulisan soal (semua mapel, semua bentuk)

### 2a. Materi
1. ✅ Soal sesuai indikator di kisi-kisi.
2. ✅ Konsep benar; jawaban benar berdasar materi bab. 🔍 (0.18.2) Untuk PG, AI menulis **langkah hitung/alasan dan isi
   jawaban benar LEBIH DULU**, baru pilihan dan kunci. Aplikasi mencocokkan isi itu dengan pilihan yang ditandai kunci:
   tidak cocok atau tidak ada di pilihan → merah → perbaikan otomatis. (Audit 2026-11-07: 3 dari 52 kunci salah karena
   AI menulis kunci sebelum menghitung.) Langkah dan isi jawaban itu tidak disimpan.
3. ✅ Pengetahuan umum boleh dipakai untuk **cerita/stimulus**, tetapi **kunci jawaban harus berdasar materi bab**.
4. ✅ Tidak memuat SARA, politik praktis, pornografi, propaganda, kekerasan, atau merek dagang;
   tidak bertentangan dengan Pancasila, UUD 1945, NKRI, Bhinneka Tunggal Ika, dan nilai agama.
5. ✅ Tidak menyalin kalimat buku/materi mentah-mentah (mendorong hafalan); gunakan redaksi baru.
6. ✅ (0.18.0) **Masalah khilafiyah** (perbedaan mazhab/pendapat ulama): madrasah merujuk SEMUA mazhab, jadi soal tidak
   memihak satu mazhab sebagai satu-satunya yang benar. Soal menyebut jelas pendapat siapa yang ditanyakan
   ("Menurut mazhab Syafi'i, ...") atau menanyakan perbedaannya. Pendapat lain yang sah tidak boleh menjadi pengecoh,
   kecuali soal sudah menyebut jelas pendapat siapa yang ditanyakan.

### 2b. Konstruksi
1. ✅ Pokok soal jelas, tegas, tidak bermakna ganda.
2. ✅ Pokok soal tidak memberi petunjuk ke jawaban benar.
3. ✅ Tidak ada **negatif ganda** (contoh salah: "Berikut ini yang tidak benar, kecuali ...").
4. ✅ Kata negatif di pokok soal (BUKAN, KECUALI, TIDAK) ditulis **huruf kapital** supaya tidak terlewat.
5. ✅ Pokok soal dan pilihan hanya memuat yang perlu.
6. ✅ 🔍 (0.18.1) Tidak memakai pilihan "semua benar" / "semua salah" / "tidak ada yang benar", dan tidak memakai
   pilihan yang menunjuk huruf pilihan lain ("A dan B benar"): urutan pilihan diacak aplikasi (juga per paket), jadi
   hurufnya bisa menunjuk pilihan yang salah. Pilihan yang menunjuk NOMOR pernyataan di soal ("1 dan 3") tetap boleh
   di PG biasa, tetapi 🔍 (0.18.2) **tidak boleh di PG kompleks**: siswa yang memilih "(2) dan (3)" benar isinya tapi
   dinilai salah, karena di PG kompleks siswa sendiri yang memilih semua jawaban yang tepat.
7. ✅ Panjang pilihan relatif sama. 🔍 (0.18.0) **Kunci tidak boleh menjadi pilihan yang paling panjang/paling rinci.**
   Diukur pada 274 PG lama: 60% kuncinya pilihan terpanjang (kalau acak hanya 20%), jadi siswa bisa menebak.
   Aplikasi menandai PG yang kuncinya terpanjang DAN ≥ 1,5× rata-rata panjang pengecoh (kunci < 15 huruf dilewati).
8. ✅ 🔍 **Pilihan berupa angka/tahun/urutan disusun berurutan** (kecil → besar, lama → baru), dan **tidak diacak**.
9. ✅ Soal tidak bergantung pada jawaban soal lain.
10. ✅ Soal dalam satu set tidak saling mirip; sebar ke semua TP dan materi. (0.19.0) Daftar "soal yang sudah dibuat"
    yang dikirim ke AI kini memuat isi lajur Menjodohkan dan pernyataan Kategori. 🔍 Menjodohkan yang memakai 3+ isi lajur
    sama dengan Menjodohkan sebelumnya ditandai "mirip soal nomor N" (hanya yang belakangan).
11. ✅ **Jawaban satu soal tidak boleh tertulis di soal lain** dalam set yang sama (di pokok soal maupun pilihan),
    terutama kunci isian singkat. Contoh salah: kunci isian "ikhlas karena Allah", padahal frasa itu sudah menjadi
    pilihan di soal PG nomor 2. (Disetujui 2026-11-05; aplikasi mengirim jawaban soal tahap sebelumnya ke AI.)
    🔍 Kunci isian yang tertulis di soal lain ditandai merah (0.17.3); sejak 0.18.3 pesannya menyebut potongan teks
    tempat jawaban itu tertulis, dan dua soal isian dengan kunci sama juga ditandai.
    (0.18.3) Pencegahan: jawaban soal isian **direncanakan di tahap kisi-kisi**, lalu dikirim ke setiap tahap soal sebagai
    kata yang tidak boleh ditulis di soal lain (soal isian ditulis paling akhir, jadi dulu jawabannya sering sudah
    terpakai sebagai pengecoh PG). Jawaban berupa angka tidak dilarang, karena bisa jadi data soal hitungan.
    (0.19.1) Perbaikan otomatis isian yang bocor diberi daftar kata/frasa pendek yang sudah tertulis di soal lain
    (termasuk pengecoh dan isi lajur menjodohkan), supaya jawaban penggantinya tidak ikut bocor.

### 2c. Bahasa
1. ✅ Bahasa Indonesia baku, efektif, komunikatif, sesuai usia siswa MA.
2. ✅ Tidak memakai bahasa daerah atau bahasa gaul (kecuali kutipan dalam stimulus yang memang perlu).
3. ✅ Mapel bahasa (Bahasa Arab, Bahasa Inggris): soal boleh ditulis dalam bahasa tersebut.
4. ✅ Tidak memakai frasa yang merujuk ke sumber data ("menurut materi", "teks di atas", dsb.);
   bila perlu sumber, sebut sumber aslinya.
5. ✅ (0.18.0) **Istilah keagamaan sesuai KBBI**: salat, zakat, wudu, hadis, Al-Qur'an, Allah Swt., Nabi Muhammad saw.
   Transliterasi Latin **tanpa huruf bergaris/bertitik** ("hissi", bukan "ḥissī"); tanda ilmiah (ā, ḥ, ṣ) hanya boleh
   di mapel Bahasa Arab. Nama surah mengikuti sumber dalil di data aplikasi (gaya Kemenag, mis. "QS. An-Nūr [24]: 2").

---

## 3. Aturan per bentuk soal (jenjang MA, kelas 10–12)

| Bentuk | Aturan | Di aplikasi sekarang |
|---|---|---|
| **Pilihan Ganda (PG)** | 5 pilihan (A–E), tepat 1 benar; pengecoh homogen & masuk akal | ✅ sesuai |
| **PG Kompleks — jawaban ganda (MCMA)** | 5 pilihan, lebih dari satu benar tapi tidak semua | ✅ **2 atau 3 benar**, sesuai soal. Petunjuk: **"(Pilih semua jawaban yang tepat)"**, tanpa menyebut jumlah (sama dengan TKA) |
| **Benar/Salah gaya Al-Fatah** (0.22.0, semua jenis kecuali Latihan TKA) | satu nomor = **satu pernyataan**, siswa memilih A (Benar) / B (Salah) | ✅ AI menulis satu kalimat pernyataan (bukan kalimat tanya); **kunci tiap nomor ditentukan aplikasi** (separuh Benar, separuh Salah, urutan acak) lewat kisi-kisi. Pernyataan salah = ubah satu konsep. Tidak diberi level HOTS (kalimat pendek tanpa stimulus; HOTS dipindah ke bentuk lain, jumlah total tetap). 🔍 kunci harus Benar/Salah, kalimat tanya ditandai |
| **Menjodohkan gaya Al-Fatah** (0.22.0, semua jenis kecuali Latihan TKA) | satu nomor = **satu pernyataan** lajur kiri; beberapa nomor berurutan dijodohkan dengan **satu daftar jawaban** (satu pengecoh) | ✅ minimal 3 nomor; blok maks 5 nomor (6–10 nomor dibagi dua blok). AI menulis pernyataan + jodohnya per nomor (+1 pengecoh); **aplikasi menyusun & mengacak daftar jawaban dan huruf kuncinya**. Tidak diberi level HOTS. Tidak bisa diganti/diubah/ditambah AI per nomor (daftar dipakai bersama): perbaiki lewat Edit (daftar jawaban yang diedit ikut ke nomor lain di blok). Skor per nomor. 🔍 kunci satu huruf, dua nomor tidak boleh berkunci sama, daftar harus punya pengecoh |
| **PG Kompleks — Kategori (dulu "Benar/Salah")** — kini hanya **Latihan TKA** | satu stimulus + **4 pernyataan**, tiap pernyataan dinilai dengan sepasang label | ✅ label: Benar/Salah, Fakta/Opini, Sesuai/Tidak Sesuai, Tepat/Tidak Tepat, atau Didukung/Tidak Didukung, diragamkan dalam satu set. (0.19.0) **Urutan 4 pernyataan diacak aplikasi** (kunci ikut), supaya letak pernyataan salah tidak berpola; pembahasan menyebut isi pernyataan, bukan urutannya. Soal yang pembahasannya menunjuk urutan ("pernyataan pertama") tidak diacak, supaya pembahasannya tetap benar |
| **Menjodohkan model 0.10.0** (set lama; soal baru memakai gaya Al-Fatah di atas) | 5 premis; jawaban di lajur kanan lebih banyak dari premis | ✅ (0.10.0) 5 premis + 6 jawaban (1 pengecoh). AI hanya menulis 5 pasangan benar + 1 pengecoh; **aplikasi mengacak lajur kanan dan menyusun kunci hurufnya**. Skor **per pasangan** (bobot 5 = 1 poin/pasangan). Bukan untuk Latihan TKA. (0.19.1) Hubungan **satu-satu**, bukan pengelompokan (mis. 5 pajak → pusat/daerah: jawabannya pasti berulang; materi seperti itu lebih cocok untuk Kategori/PG kompleks). 🔍 Jawaban berulang ditandai; perbaikan otomatis boleh pindah ke sisi materi lain dan memperbarui indikator kisi |
| **Isian / jawaban singkat** | jawaban berupa kata, frasa, angka, atau simbol | ✅ (0.10.0) kalimat dengan satu bagian kosong "....", kunci: AI diminta ≤ 5 kata, aplikasi baru menandai bila > 6 kata (kelonggaran) + jawaban lain yang diterima (pegangan guru). Skor 1/0. Jawaban tidak boleh muncul di soal. Bukan untuk Latihan TKA |
| **Uraian** | menuntut jawaban terurai; wajib ada **pedoman penskoran (rubrik)** | ✅ sesuai. (0.18.1) Soal wajib menyebut **batasan jawaban** ("Sebutkan **tiga** ...", "dari segi ... dan ..."), bukan "Jelaskan tentang ...!"; kunci lengkap untuk semua bagian; rubrik mengikuti batasan (3 hal → 3 kriteria) dan menyebut kapan skor penuh/sebagian, contoh (0.19.0): "Menyebut tiga syarat (3 = tiga benar; 2 = dua benar; 1 = satu benar; 0 = tidak ada)". Hanya instruksi ke AI, tidak diperiksa aplikasi |

🔍 Susunan tiap bentuk di tabel ini (jumlah pilihan/pernyataan/premis, jumlah dan bentuk kunci, bagian kosong isian)
diperiksa aplikasi.

Penskoran resmi: PG, PGK, menjodohkan, isian = 1/0 per butir. ✅ Aplikasi memakai **bobot dari form**
(bawaan AFTS: PG 2, PGK 5, Kategori/B-S 3, Uraian 8; ditambah Menjodohkan 5 dan Isian 3), dan itu tetap dipertahankan
karena sesuai format madrasah.

---

### 3a. Format ASAS MA Al-Fatah (surat Kepala MA No. 433/P/MA/PP.006/SPb/11/2026, 7 November 2026)

| | Eksak (Matematika, Fisika, Kimia, Biologi) | Non-Eksak |
|---|---|---|
| PG / PG kompleks / Menjodohkan+Benar-Salah / Esai | 20 / 5 / 5 / 5 = **35** | 30 / 5 / 5 / 5 = **45** |
| HOTS / MOTS / LOTS | 8 / 15 / 12 | 10 / 20 / 15 |
| Skor (otomatis, total 100) | PG 2, PGK 4, MJ/BS 2, Esai 6 | PG 1, PGK 4, MJ/BS 2, Esai 8 |

✅ (0.22.0) Kartu ASAS langsung mengisi format sesuai mapel; dua tombol "Eksak (35 soal)" / "Non-Eksak (45 soal)".
"Menjodohkan/BS 5" = total 5 nomor, boleh campur (menjodohkan minimal 3). Skor = keputusan pemilik (surat tidak
mengatur skor). Persen level dipilih supaya jumlahnya persis surat (34/43/23 dan 33/45/22).

## 4. Stimulus

1. ✅ Stimulus kontekstual: dekat dengan kehidupan siswa MA (madrasah, pesantren, keluarga, masyarakat, media sosial).
2. ✅ Ragam stimulus diperluas untuk semua mapel: kasus/cerita, berita, data/tabel, grafik (dideskripsikan dengan kata),
   teks bacaan, percakapan, kutipan tokoh, hasil percobaan, peta/denah (dideskripsikan), potongan dokumen sejarah.
3. ✅ **Satu stimulus boleh dipakai untuk beberapa soal berurutan** ("soal grup"), umum di asesmen madrasah dan inti TKA.
   Dipakai di jenis **Latihan TKA** (bagian 9).
4. ✅ Satu skenario hanya dipakai sekali per set; pola "dua orang berbeda pendapat" maks 2 kali.
5. ✅ 🔍 (0.30.0) **Gambar dari guru.** AI tidak bisa membuat gambar. Gambar hanya berasal dari **materi guru**
   (diambil dari file Word/PowerPoint, diunggah, atau ditempel), dan AI melihat gambarnya. Soal boleh memakai satu gambar
   sebagai stimulus; aplikasi menampilkannya di bawah pokok soal ("Perhatikan gambar berikut!"). Soal bergambar harus
   benar-benar perlu melihat gambar untuk dijawab, jawabannya sesuai yang tampak di gambar (tidak mengarang bagian/label
   yang tidak ada), dan pokok soal tidak menjelaskan isi gambar sampai jawabannya terbaca tanpa melihat gambar.
   Rencana gambar per nomor ditulis di kisi-kisi; usahakan setiap gambar terpakai. Tanpa gambar di materi: tetap seperti
   dulu, AI **dilarang** menulis "perhatikan gambar berikut" (aplikasi menandai soal yang menyebut gambar tanpa gambar).
   Guru bisa menambah, mengganti, atau melepas gambar soal lewat Edit. Teks Arab di dalam gambar tidak pernah
   dipercaya sebagai ayat/hadis (aturan 5 CLAUDE.md): kalau diketik ulang AI, penjaga ayat tetap menandainya.
6. ✅ (0.18.0) **Nama tokoh beragam** (tidak selalu Ahmad/Fatimah), seimbang putra dan putri. Tokoh yang berbuat salah
   atau keliru tidak memakai nama nabi, sahabat, atau tokoh mulia dalam Islam.
7. ✅ 🔍 (0.28.0) **Tabel sungguhan.** Data yang lebih jelas dibaca berbaris-berkolom (data percobaan, perbandingan,
   angka statistik, daftar ciri) ditulis sebagai **tabel** di pertanyaan, wacana, atau pembahasan; aplikasi
   menampilkannya sebagai tabel di web dan di Word. Maksimal 6 kolom × 10 baris, baris pertama = judul kolom, isi sel
   singkat. Tabel tidak dipakai di pilihan jawaban, pernyataan, dan menjodohkan. Data di tabel berasal dari materi atau
   dibuat konsisten dengan materi; kunci tidak boleh terbaca langsung dari tabel tanpa diolah (kecuali soal C1–C2).
   Tabel di file Word/PowerPoint materi guru ikut terbaca sebagai tabel (PDF belum).
8. ✅ (0.29.0) **Rumus sungguhan.** Rumus, persamaan, pecahan, akar, pangkat, indeks, dan simbol (Δ, α, ×, ≤, …)
   ditulis dalam format LaTeX diapit tanda `$` (contoh `$v = \frac{s}{t}$`); aplikasi menampilkannya sebagai rumus
   di web dan sebagai rumus Word asli (Equation). Boleh di pertanyaan, wacana, pilihan, kunci, dan pembahasan.
   Angka biasa dan satuan yang berdiri sendiri ("12 m/s", "2,5 kg") tetap teks biasa tanpa `$`, supaya pilihan angka
   tetap diurutkan kecil → besar. Desimal memakai koma sesuai kaidah Indonesia (`$2{,}5$`). Rumus di file Word materi
   guru (Equation) ikut terbaca; rumus di PDF belum.

### 4a. Nilai Kurikulum Berbasis Cinta (Kemenag 2025)
Panduan KBC (Kepdirjen Pendis 6077/2025) memuat **Panca Cinta**: Cinta Allah dan Rasul-Nya, Cinta Ilmu,
Cinta Lingkungan, Cinta Diri dan Sesama, Cinta Tanah Air.
✅ Usul: **stimulus boleh menyisipkan nilai-nilai ini secara wajar** (tokoh yang peduli lingkungan, santri yang tekun
belajar, dsb.), **tanpa menggurui** dan **tanpa mengubah kunci jawaban**. Tidak wajib di setiap soal.

---

## 5. Aturan khusus yang AKTIF sesuai isi materi

| Kondisi materi | Aturan |
|---|---|
| Ada **dalil** (ayat/hadis) di kotak terverifikasi | ✅ AI **tidak boleh mengetik ayat/hadis**; cukup menyebut kode dalil, teks Arab ditempel aplikasi dari data terverifikasi; dijaga penjaga ayat (aturan keras no. 5 CLAUDE.md) |
| **Tidak ada dalil** | ✅ aturan dalil tidak dikirim ke AI sama sekali |
| Materi **hitungan** (Matematika, Fisika, Kimia, Ekonomi, Faraid, dsb.) | ✅ pembahasan wajib memuat **langkah hitung**; pilihan angka diurutkan, tidak diacak. (Peringatan tambahan "periksa hitungan" pernah diusulkan tapi **belum dibuat**; peringatan umum "wajib diperiksa guru" sudah mencakupnya.) |
| Mapel **Bahasa Arab** | ✅ teks Arab adalah isi pelajaran, bukan dalil. Pilihan materi "Teks Arab: **dalil** (dijaga ketat) / **bahasa** (Arab boleh ditulis AI, tapi potongan yang ternyata ayat dan tidak persis data tetap ditandai 🔍)" |

---

## 6. Catatan guru untuk AI (kolom prompt)

1. ✅ Catatan guru **diikuti sepenuhnya** dan mengalahkan semua aturan di bagian 2–5, **kecuali 4 kunci**:
   - **Kunci 1:** ayat dan hadis tidak boleh dikarang/ditambah dari luar data terverifikasi
     (guru boleh minta *lebih sedikit* atau *tanpa* teks Arab).
   - **Kunci 2:** jumlah, bentuk, dan kategori level tiap nomor mengikuti form/aplikasi.
   - **Kunci 3:** format jawaban (JSON) — teknis, tidak terlihat guru.
   - **Kunci 4:** isi yang dilarang (bagian 2a no. 4: SARA, pornografi, dsb.).
2. ✅ AI wajib menulis **tanggapan singkat** atas catatan guru: apa yang dituruti, apa yang tidak, dan alasannya.
   Tanggapan tampil di **paling atas hasil soal**.
3. Batas 500 huruf tetap. Placeholder diganti agar umum untuk semua mapel.

---

## 7. Yang selalu ada di setiap hasil (tidak berubah)

- ✅ Peringatan: "Soal dibuat AI, wajib diperiksa guru sebelum dipakai."
- ✅ Kisi-kisi disusun dulu, baru soal.
- ✅ Komposisi level per nomor ditentukan aplikasi, bukan AI.
- ✅ Prompt dan nama model disimpan di setiap hasil.
- ✅ Soal bertanda merah (🔍) dikirim ulang ke AI **satu kali** untuk diperbaiki otomatis saat set dibuat (0.17.0);
  kalau masih melanggar, tetap merah untuk diperiksa guru.

---

## 8. Ringkasan perubahan 2026-10-20 (SELESAI semua per 0.17.3; revisi 0.18.0 ada di catatan atas)

| No | Perubahan | Ukuran kerja |
|---|---|---|
| 1 | Instruksi AI dibuat umum: "guru ahli {mapel} kelas {kelas}"; kolom Mapel & Kelas di Materi Saya | sedang |
| 2 | Aturan dalil hanya dikirim bila materi punya dalil | kecil |
| 3 | Tambah kaidah baru: negatif ganda, kata negatif kapital, SARA/politik/pornografi, tidak menyalin buku, bahasa baku | kecil |
| 4 | Penjelasan level: kata kerja bukan penentu, HOTS ≠ sulit, C1–C2 tanpa stimulus panjang | kecil |
| 5 | Pilihan angka diurutkan, tidak diacak | kecil |
| 6 | PG kompleks: 2 atau 3 jawaban benar, petunjuk "Pilih semua jawaban yang tepat" | sedang (pengacak kunci & Word ikut) |
| 7 | B/S jadi Kategori: 1 stimulus + 4 pernyataan, label bervariasi | besar (tampilan, Word, skor ikut berubah) |
| 8 | Materi hitungan: langkah hitung di pembahasan | kecil |
| 9 | Pilihan "Teks Arab: dalil / bahasa" untuk Bahasa Arab | sedang |
| 10 | Catatan guru jadi prioritas + kotak tanggapan AI di atas hasil | sedang |
| 11 | Nilai Panca Cinta boleh disisipkan di stimulus | kecil |
| 12 | Kartu jenis **Latihan TKA** + soal grup (bagian 9) | besar |
| 13 | Tiga aturan dari contoh try out (bagian 10) | kecil |
| — | Ditunda: dimensi pengetahuan (menjodohkan dan isian sudah aktif sejak 0.10.0) | — |

---

## 9. Gaya TKA (Tes Kemampuan Akademik, SMA/MA)

Dasar: Peraturan Kepala BSKAP No. 045/H/AN/2025 tentang Kerangka Asesmen TKA (dirangkum dari artikel yang mengutipnya;
dokumen resmi Pusmendik tidak bisa dibuka dari sini).

1. Mata uji: wajib Bahasa Indonesia, Matematika, Bahasa Inggris; pilihan 2 dari 19 (Fisika, Kimia, Biologi, Ekonomi,
   Sejarah, PPKn, Geografi, Sosiologi, **Bahasa Arab**, dll.). **Tidak ada mapel agama** di TKA.
2. Hanya 3 bentuk: **PG sederhana**, **PG kompleks MCMA**, **PG kompleks Kategori**. Tidak ada uraian.
3. Level kognitif: **Pemahaman / Penerapan / Penalaran** (= LOTS / MOTS / HOTS di aplikasi ini).
4. Jenis soal: **soal tunggal** dan **soal grup** (satu stimulus untuk ±2–4 soal berurutan; bentuk dalam satu grup
   boleh campur, kompetensi yang diukur berbeda).
5. Stimulus: bacaan, grafik/tabel (dideskripsikan dengan kata), data percobaan, kasus nyata.
6. ✅ Di aplikasi: kartu jenis **"Latihan TKA"** = bentuk PG / PGK / Kategori saja, bawaan 25 soal,
   label level memakai nama TKA, soal grup aktif.
   Penyederhanaan (2026-10-20): satu grup hanya berisi soal **berbentuk sama** (lembar soal tetap per bagian bentuk),
   dan nomor grup ditentukan aplikasi (separuh soal tiap bentuk, di akhir bagian, 2–3 soal per grup), karena AI
   mengabaikan perintah "kira-kira separuh". AI hanya menulis wacananya.
7. ✅ (2026-11-08, disamakan dengan contoh resmi Perka BSKAP 045/2025, RUJUKAN.md I2; hanya untuk Latihan TKA):
   - PG kompleks MCMA: **2, 3, atau 4** jawaban benar dari 5; pertanyaan diakhiri petunjuk baku
     **"Pilihlah jawaban yang benar! Jawaban benar lebih dari satu."**
   - Kategori: **3 pernyataan**; label hanya Benar/Salah, Tepat/Tidak Tepat, Sesuai/Tidak Sesuai, Setuju/Tidak Setuju,
     Logis/Tidak Logis (Fakta/Opini & Didukung tidak ada di contoh resmi, tetap boleh di jenis lain).
   - Nama level mapel bahasa: Bahasa Arab = Pemahaman Literal / Reorganisasi / Pemahaman Inferensial;
     Bahasa Indonesia & Inggris = Pemahaman Tekstual / Pemahaman Inferensial / Evaluasi dan Apresiasi.
   - Pemeriksa aplikasi kini menerima PGK 2–4 kunci dan Kategori 3 atau 4 pernyataan untuk semua jenis (jenis lain
     tetap diminta 2–3 kunci dan 4 pernyataan). Grup campur bentuk BELUM (perlu ubah tata letak Word per bagian bentuk).

## 10. Aturan tambahan dari contoh try out TKA Biologi (disetujui 2026-10-20)

1. ✅ Pernyataan salah pada MCMA dan Kategori dibuat dengan **mengubah satu konsep kunci** dari pernyataan benar
   (sebab-akibat dibalik, istilah tertukar, naik/turun, terbesar/terkecil). Jebakan harus pada konsep,
   bukan permainan kata yang menyesatkan.
2. ✅ **Pembahasan menjelaskan kunci DAN alasan setiap pengecoh salah** (semua bentuk PG). 🔍 (0.18.2) Pengecoh
   ditunjuk dengan **isinya**, bukan huruf atau urutannya ("pengecoh kedua"), karena urutan pilihan diacak aplikasi.
3. ✅ Soal penalaran (terutama IPA/IPS) boleh memakai data: tabel hasil percobaan, perbandingan dua kondisi
   (wilayah X vs Y), kelompok kontrol.

---

## Sumber
- Panduan pembuatan soal asesmen sumatif — komunitasbelajar.id (2024): https://www.komunitasbelajar.id/2024/02/panduan-pembuatan-soal-asesmen-sumatif.html
- Panduan penyusunan soal Asesmen Madrasah — hanapibani.com: https://www.hanapibani.com/2023/04/panduan-penyusunan-soal-asesmen-madrasah.html
- Pedoman penyusunan soal Asesmen Madrasah 2024–2025 — ainamulyana.com: https://www.ainamulyana.com/2024/02/pedoman-atau-panduan-pembuatan-soal.html
- Kaidah penulisan soal (pelatihan Dit. PSMP & Puspendik) — komunitasbelajar.id: https://www.komunitasbelajar.id/2017/01/pedoman-atau-kaidah-penulisan-soal.html
- Panduan lengkap penyusunan soal Asesmen Madrasah 2025 — SlideShare: https://www.slideshare.net/slideshow/panduan-lengkap-penyusunan-soal-asesmen-madrasah-tahun-2025/288244988
- Taksonomi Bloom revisi — Univ. Atma Jaya Yogyakarta: https://dpm.uajy.ac.id/wp-content/uploads/2011/08/taksonomi_Bloom_revisi.pdf
- Penyusunan soal HOTS (level L1–L3) — IKIP Siliwangi: https://dosen.ikipsiliwangi.ac.id/wp-content/uploads/sites/6/2022/04/penyusunan-soal-HOTS.pdf
- Kriteria dan ciri asesmen kontekstual — komunitasbelajar.id: https://www.komunitasbelajar.id/2024/02/kriteria-dan-ciri-asesmen-kontekstual.html
- Panduan Kurikulum Berbasis Cinta, Kepdirjen Pendis 6077/2025 — Kemenag: https://cdn.kemenag.go.id/storage/archives/panduan-kurikulum-berbasis-cinta.pdf
- KMA 1503/2025 tentang pedoman kurikulum madrasah — ayomadrasah.id: https://www.ayomadrasah.id/2025/11/kma-1503-tahun-2025-kurikulum-ra-madrasah.html
- Juknis Penilaian Hasil Belajar MA, Kepdirjen Pendis 3751/2018: https://man2acehbesar.wordpress.com/wp-content/uploads/2019/04/sk-dirjen-juknis-penilaian-hasil-belajar-pada-ma.pdf
- Kerangka Asesmen TKA (Perka BSKAP 045/H/AN/2025) — Pusmendik: https://pusmendik.kemendikdasmen.go.id/tka/files/15034.pdf
  (naskah resmi sudah dibaca 2026-11-07; perbedaan dengan aplikasi ada di RUJUKAN.md bagian I2)
- Kajian kerangka asesmen TKA SMA — yunandra.com: https://yunandra.com/kajian-peraturan-kerangka-asesmen-tka-sma-ma-smk-mak-pada-sk-bskap-no-045-tahun-2025/
- 3 jenis soal TKA SMA — detikEdu: https://www.detik.com/edu/detikpedia/d-8083189/3-jenis-soal-tka-jenjang-sma-dan-sederajat-2025-panduan-belajar-nih
- Contoh soal TKA SMA 2026 — blog ITERA: https://blog.itera.ac.id/25-contoh-soal-tka-sma-2026-dan-pembahasannya/
- Pembahasan Try Out TKA Biologi 10/11 Oktober 2026 (Drive pemilik, lembaga try out)
