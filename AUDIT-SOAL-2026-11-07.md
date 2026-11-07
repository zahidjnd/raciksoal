# Audit Hasil Soal — 7 November 2026 (versi 0.18.1)

Tujuan: mengecek apakah soal buatan AI sudah mengikuti [ATURAN-SOAL.md](ATURAN-SOAL.md), termasuk aturan baru 0.18.0–0.18.1.
Uji di **laptop** (bukan hosting), akun `guru.uji.ayat`, model utama **deepseek-flash**, materi ditulis khusus untuk uji
(tanpa ayat/hadis). Semua soal dibaca satu per satu.

## Set yang diuji

| Set | Mapel & materi | Jenis | Isi | Waktu | Perbaikan otomatis |
|---|---|---|---|---|---|
| 69 | Fikih XI — Salat Jumat (materi-7) | Ulangan Harian, Mudah | 12 soal: 5 PG, 2 PGK, 2 Kategori, 2 Isian, 1 Uraian | 20 dtk | tidak ada soal merah |
| 70 | Ekonomi XI — Pajak & Inflasi (materi-8) | ASAS, Sedang | 25 soal: 12 PG, 3 PGK, 3 Kategori, 2 Menjodohkan, 3 Isian, 2 Uraian | 56 dtk | 2 diperbaiki, **1 tetap merah** (no. 23) |
| 71 | Biologi XI — Peredaran Darah (materi-9) | Latihan TKA, Sulit | 15 soal: 8 PG, 4 PGK, 3 Kategori; 3 soal grup | 41 dtk | 1 diperbaiki (no. 4, kunci terpanjang) |

## Kesimpulan singkat

- **Aturan baru 0.18 berjalan.** Khilafiyah, ejaan KBBI, nama tokoh, HOTS tetap berstimulus walau "Mudah", uraian
  berbatasan: semua terlihat di hasil.
- **Pemeriksa aplikasi bekerja.** Kunci isian bocor tertangkap, menjodohkan dobel tertangkap, kunci terpanjang tertangkap,
  dan semuanya diperbaiki otomatis. Satu soal tetap merah untuk diperiksa guru, dan itu memang sesuai rancangan.
- **Masalah terbesar: 3 dari 52 soal kuncinya SALAH** (6%). Aplikasi tidak menandainya, jadi guru yang harus
  menemukannya sendiri.
- Ada 4 pembahasan yang menunjuk "pengecoh kedua". Setelah pilihan diacak aplikasi, tunjukan itu salah.

## Hasil per aturan

| Aturan (ATURAN-SOAL.md) | Hasil | Bukti |
|---|---|---|
| 1b/7 Komposisi level per nomor | ✅ tepat | 69: 5/5/2 · 70: 8/10/7 · 71: 3/6/6 |
| 1c.1 Level = proses berpikir, bukan kata kerja | ⚠️ sering terlalu tinggi | 69/4 (hafalan, berlabel C3), 71/8, 71/13, 71/14, 71/15 (hafalan atau jawabannya disebut di wacana, berlabel C3–C5) |
| 1c.3 HOTS wajib stimulus | ⚠️ 1 melanggar | 71/14 C5 tanpa stimulus sama sekali; kisi-kisinya menulis "Disajikan skema" tapi skemanya tidak ada |
| 1c.5 (baru) "Mudah" tidak menghapus stimulus HOTS | ✅ | 69/5 (kasus khutbah), 69/9 (data dua masjid) |
| 2a.2 Kunci benar | ❌ **3 soal salah** | 70/6, 70/7, 71/3 (rincian di Temuan 1) |
| 2a.6 (baru) Khilafiyah | ✅ sangat baik | 69/4 & 69/5 menyebut "menurut mazhab Syafi'i"; 69/9 menguji perbedaan Syafi'i/Hanafi/Maliki dengan data |
| 2b.2 Pokok soal tidak memberi petunjuk | ⚠️ 1 | 71/8: wacana sudah menulis "infeksi bakteri", jadi jawaban (neutrofil) langsung terlihat |
| 2b.5 / tidak bermakna ganda | ⚠️ 3 | 70/13 (Temuan 4), 70/19 (dua jawaban cocok), 69/6 (syarat wajib dipecah jadi pilihan terpisah) |
| 2b.6 (0.18.1) "semua benar", "A dan B benar" | ✅ tidak muncul | — |
| 2b.7 (0.18.0) Kunci bukan pilihan terpanjang | ✅ membaik | kunci terpanjang 10 dari 25 PG (40%; sebelumnya 60%, acak = 20%). Yang mencolok hanya 71/4, sudah diperbaiki otomatis |
| 2b.8 Pilihan angka urut | ✅ | 70/5–8 |
| 2b.10 Soal tidak saling mirip | ⚠️ 1 pasang | 70/19 dan 70/20 hampir sama (Temuan 5) |
| 2b.11 Jawaban tidak tertulis di soal lain | ✅ dijaga | 70/21 bocor → diperbaiki; 70/23 ("sedang", ada di pilihan 70/9) → tetap merah |
| 2c.5 (baru) Ejaan KBBI, tanpa huruf bertitik | ✅ | salat, zuhur, fardu ain, Swt.; tidak ada ā/ḥ; tidak ada "shalat/dzuhur" |
| 3 PG Kompleks 2–3 kunci | ✅ | semua 2 atau 3 |
| 3 Kategori: label bervariasi | ⚠️ | 6 dari 8 soal memakai Benar/Salah; ketiga soal di 71 berpola kunci sama (B, B, B, S) |
| 3 Uraian (0.18.1) batasan jawaban | ✅ sebagian | ketiganya berbatasan ("dua hal", "satu contoh masing-masing", hitungan) dan rubrik per bagian, tetapi **tidak ada yang menulis kapan skor sebagian** |
| 4.5 Tanpa "perhatikan gambar" | ✅ | 71/3 menyebut "diagram alur", tapi alurnya ditulis dengan kata |
| 4.6 (baru) Nama tokoh beragam | ✅ | Rania, Farhan, Ningsih, Surya, Harun, Rasyid, Rizki; tidak ada nama nabi/sahabat untuk tokoh yang salah |
| 5 Hitungan: langkah hitung di pembahasan | ✅ | 70/5–8, 70/22, 70/25 |
| 9 TKA: tanpa uraian/isian/menjodohkan, soal grup | ✅ bentuk · ⚠️ isi grup | grup terbentuk (5–6, 7–8, 11–12), tapi isinya kurang nyambung (Temuan 3) |
| 9 TKA: hampir semua soal berstimulus | ⚠️ | 71/1, 2, 9, 13, 14 tanpa stimulus |
| 10.2 Pembahasan menjelaskan tiap pengecoh | ✅ isi · ❌ cara menunjuk | lengkap, tetapi 4 soal menunjuk dengan urutan (Temuan 2) |

## Temuan (urut dari yang paling penting)

### 1. Kunci salah — 3 soal ❌
- **70/6**: pembahasan menghitung PKP = Rp82.500.000 (benar), tetapi kunci yang ditandai Rp87.000.000.
- **70/7**: pembahasan menghitung PPh = Rp44.000.000 (benar), tetapi angka itu **tidak ada** di pilihan. Kuncinya
  Rp37.500.000.
- **71/3**: alur bilik kanan → paru-paru → serambi kiri hanya melewati arteri pulmonalis dan vena pulmonalis. Kuncinya
  "arteri pulmonalis, vena pulmonalis, **aorta**", padahal aorta tidak dilewati. Tidak ada pilihan yang benar.

Sebabnya **AI, bukan aplikasi**. Jawaban mentah AI (`jawaban_ai`) sudah salah sejak awal. AI menulis isian JSON
berurutan: pilihan dan kunci dulu, baru menghitung di pembahasan. Jadi kunci terlanjur ditulis sebelum hitungannya
selesai. Pola ini sama dengan kasus PGK 4 kunci di 0.17.0.

**Usulan:**
- Minta AI menulis **"jawaban_benar"** (isi jawabannya, dan langkah hitung untuk soal hitungan) **sebelum**
  "pilihan" dan "kunci".
- Aplikasi mencocokkan isi itu dengan pilihan yang ditandai kunci. Kalau tidak cocok, soal ditandai merah, lalu masuk
  perbaikan otomatis.
- Ukuran kerja: sedang. Tidak butuh panggilan AI tambahan.

### 2. Pembahasan menunjuk "pengecoh kedua" — 4 soal ❌
70/11, 70/12, 70/14, 70/15. Contoh 70/12: pembahasan menulis "Pengecoh kedua salah karena kebijakan ini tidak
menambah subsidi", padahal pilihan B yang tampil adalah soal kementerian keuangan. Urutan pilihan diacak aplikasi,
jadi "kedua", "ketiga", dan seterusnya selalu berisiko salah tunjuk. Aturan sekarang hanya melarang menyebut huruf.

**Usulan:** tambah larangan menyebut urutan di instruksi AI, plus pemeriksa aplikasi (pola "pengecoh/pilihan
pertama…kelima" di pembahasan PG/PGK). Ukuran kerja: kecil.

### 3. Level terlalu tinggi dan soal grup kurang nyambung ⚠️
- Soal hafalan berlabel C3–C5: 69/4, 71/13, 71/14, 71/15. 71/14 (C5) bahkan tanpa stimulus, padahal kisi-kisinya
  menjanjikan "disajikan skema".
- 71/5: soal grup tentang **hipertensi** Rizki, tetapi pertanyaannya tentang **katup jantung**. Jawabannya tidak
  diambil dari wacana.
- 71/7–8: satu wacana dijahit dari dua topik yang tidak berhubungan (praktikum pembekuan darah + data leukosit
  pasien). Di 71/8, jawabannya sudah disebut di wacana.

**Usulan:**
- Pemeriksa sederhana: soal C4–C6 yang tidak punya wacana dan pertanyaannya pendek (tanpa kasus/data) ditandai
  "HOTS tanpa stimulus".
- Instruksi: setiap soal grup harus bisa dijawab HANYA dengan mengolah wacananya, dan satu wacana = satu topik.
- Ukuran kerja: kecil–sedang.

### 4. PG Kompleks dengan pilihan gabungan ⚠️
70/13: pilihan berbentuk "(2) dan (3)", "(1)", "(2)", "(4)", "(3)", dengan kunci (2) dan (3) terpisah. Siswa yang
memilih "(2) dan (3)" sebenarnya benar isinya, tetapi dinilai salah.

**Usulan:** pemeriksa 0.18.1 diperluas. Di PG Kompleks, pilihan yang menggabungkan nomor ("(2) dan (3)") ditandai
merah. Ukuran kerja: kecil.

### 5. Dua soal menjodohkan hampir sama ⚠️
70/19 dan 70/20 sama-sama menjodohkan fungsi pajak. 70/20 adalah hasil perbaikan otomatis, dan perbaikan otomatis
tidak diberi tahu isi soal lain (keterbatasan yang sudah tercatat di 0.17.3). Selain itu:
- Kedua soal mencampur "pajak tidak langsung" (jenis pajak) dengan fungsi pajak, padahal aturannya hubungan harus
  sejenis.
- Di 70/19, jawaban B dan C sama-sama cocok untuk "fungsi anggaran".

**Usulan:** perbaikan otomatis diberi ringkasan soal lain di set itu (fungsi `ringkasSudah` sudah ada). Ukuran kerja:
kecil.

### 6. Soal Kategori kurang bervariasi ⚠️
6 dari 8 soal memakai label Benar/Salah. Ketiga soal Kategori di set 71 berpola kunci sama: tiga Benar, lalu Salah di
pernyataan terakhir. Siswa bisa menebak polanya.

**Usulan:** instruksi agar letak pernyataan salah dan label diragamkan. Mengacak urutan pernyataan di aplikasi juga
mungkin, tapi pembahasan Kategori sekarang menyebut "pernyataan pertama", jadi aturan Temuan 2 harus berlaku dulu.

### 7. Rubrik uraian belum menyebut skor sebagian ⚠️
Ketiga soal uraian sudah berbatasan, tetapi rubriknya hanya "Menyebut …: 4". Belum ada keterangan seperti "skor 2 bila
hanya menyebut tanpa alasan". Aturan 0.18.1 sudah memintanya, tapi AI belum mengikuti.

**Usulan:** contoh rubrik di format JSON diberi contoh skor sebagian. Ukuran kerja: kecil.

### 8. Lain-lain (kecil)
- 71/11: dua pilihan bertanda kunci memakai alasan yang keliru ("dapat menerima karena plasma pasien mengandung
  aglutinin beta"). Alasan yang benar adalah eritrosit O tidak punya aglutinogen.
- 71/12: salah ketik "eritrosin" (seharusnya eritrosit).
- 69/1: pengecoh "syarat sah" bukan jenis hukum, jadi tidak homogen.
- 71/9–12: indikator kisi-kisi ikut berisi "(Pilih semua jawaban yang tepat)".

Hal-hal ini tidak bisa diperiksa otomatis dengan andal, dan tetap menjadi bagian dari "wajib diperiksa guru".

## Urutan perbaikan yang disarankan
1. **Temuan 1** (kunci salah): paling berbahaya karena tidak terlihat merah.
2. **Temuan 2 + 4** (urutan di pembahasan, pilihan gabungan PGK): kecil, bisa sekaligus.
3. **Temuan 3 + 5** (HOTS tanpa stimulus, perbaikan otomatis tahu soal lain).
4. **Temuan 6 + 7** (instruksi saja).

## Tindak lanjut: versi 0.18.2 (Temuan 1, 2, 4 diperbaiki)

- **Temuan 1:** untuk PG, AI kini menulis `langkah` dan `jawaban_benar` sebelum pilihan. Aplikasi mencocokkannya dengan
  pilihan kunci (tidak cocok / tidak ada di pilihan → merah → perbaikan otomatis). Kedua field tidak disimpan.
- **Temuan 2:** pembahasan PG/PGK yang menunjuk "pengecoh kedua", "pilihan pertama", "opsi terakhir", "pilihan ke-2" ditandai.
- **Temuan 4:** PG kompleks dengan pilihan gabungan nomor ("(2) dan (3)") ditandai. Di PG biasa tetap boleh.

Uji ulang dengan materi yang sama:

| Set | Materi | Hasil |
|---|---|---|
| 72 | Ekonomi, ASAS 25 (pengganti set 70) | 12/12 PG menulis `jawaban_benar`; 0 tersimpan. Semua soal hitungan dihitung ulang manual → **kunci benar semua** (PPN, PPh berlapis, inflasi IHK). Tidak ada "pengecoh kedua", tidak ada pilihan gabungan, tidak ada tanda merah palsu. **3 isian tetap merah** karena bocor sungguhan ("memaksa", "11", "hiperinflasi" sudah tertulis di soal lain) |
| 73 | Biologi, TKA 15 (pengganti set 71) | 8/8 PG menulis `jawaban_benar`; kunci benar semua; tidak ada tanda merah, tidak ada perbaikan. Soal grup kini memakai wacananya. Masih ada salah ketik "eritrosin" di satu pengecoh (no. 4) |

## Tindak lanjut: versi 0.18.3 (kunci isian yang bocor)

Jawaban isian kini direncanakan di kisi-kisi dan dikirim ke setiap tahap soal sebagai kata terlarang. Pesan merah
menyebut potongan teks tempat bocornya.

| | Isian bocor saat dibuat | Tetap merah setelah perbaikan otomatis |
|---|---|---|
| Ekonomi sebelum (set 70, 72) | 2 dari 3, 3 dari 3 | 1, 3 |
| Ekonomi sesudah (set 75) | 1 dari 3 (angka "Rp110.000", sengaja tidak dilarang) | **0** |
| Fikih sesudah (set 74) | 2 dari 2 | 1 |

Kesimpulan: membaik, belum tuntas. Di set 74, AI tetap memakai "fardu ain" sebagai kunci PG no. 1, karena kisi-kisinya
sendiri merencanakan PG no. 1 dan isian no. 10 untuk konsep yang sama (hukum salat Jumat). AI lebih mengikuti
kisi-kisi daripada larangan. Hal ini tidak bisa dideteksi otomatis dengan andal. Tanda merah tetap menjadi pengaman,
dan kini menunjuk letaknya: `soal nomor 1 ("Fardu ain")`.

## Tindak lanjut: versi 0.19.0 (Temuan 3, 5, 6, 7)

- **Temuan 3:** soal C4–C6 tanpa wacana/dalil dengan pertanyaan < 80 huruf ditandai "HOTS tanpa stimulus" (batas diukur
  pada ±100 soal HOTS lama; hanya yang benar-benar kosong yang kena). Instruksi: jawaban yang tertulis di stimulus = LOTS.
- **Temuan 5:** daftar "soal yang sudah dibuat" kini memuat isi lajur Menjodohkan dan pernyataan Kategori. Menjodohkan
  dengan 3+ isi lajur sama ditandai "mirip soal nomor N".
- **Temuan 6:** urutan pernyataan Kategori diacak aplikasi bersama kuncinya (kecuali pembahasan menunjuk urutan); label
  diragamkan lewat instruksi.
- **Temuan 7:** contoh rubrik dengan skor sebagian. Ditemukan saat uji: teks skor sebagian tidak cocok dengan angka skor
  setelah aplikasi menskalakan rubrik ke bobot (teks "3 = …", skor 5). Diperbaiki: AI diberi tahu jumlah skor rubrik =
  bobot uraian.

Uji ulang:

| Set | Hasil |
|---|---|
| 76 Ekonomi ASAS 25 | Kategori teracak, label beragam (Benar/Salah + Tepat/Tidak Tepat); menjodohkan tidak kembar. Rubrik sempat tidak cocok (lihat Temuan 7) → diperbaiki. **Temuan baru:** kedua menjodohkan berjenis "pengelompokan" (5 pajak → lembaga pemungut, jawaban berulang), tetap merah setelah perbaikan otomatis |
| 77 Biologi TKA 15 | 0 merah; 3 diperbaiki otomatis (termasuk "pengecoh kedua"); Kategori teracak, label Benar/Salah + Tepat/Tidak Tepat; semua HOTS berstimulus |
| 78 Ekonomi ASAS 25 | Rubrik cocok (skor 4 = "4 / 2 / 0", jumlah 8). 3 merah: 1 PG kompleks satu kunci, 2 isian bocor |

**Isian bocor masih sering** (set 75: 0, set 76: 2, set 78: 2 tetap merah). Akarnya di kisi-kisi: AI merencanakan
isian "anggaran" sambil merencanakan PG no. 2 "membedakan fungsi anggaran dan fungsi redistribusi". Calon perbaikan
berikutnya: aplikasi memeriksa rencana jawaban isian terhadap indikator/materi baris kisi lain (bisa menangkap kasus
"anggaran", tetapi tidak kasus "fardu ain" yang tidak tertulis di indikator).

## Tindak lanjut: versi 0.19.1 (menjodohkan pengelompokan, isian bocor)

- Menjodohkan wajib satu-satu (instruksi kisi-kisi + aturan bentuk). Perbaikan otomatis untuk "jawaban berulang" boleh
  pindah ke sisi materi lain dan memperbarui indikator kisi.
- Perbaikan otomatis isian yang bocor diberi daftar kata/frasa pendek yang sudah tertulis di soal lain (`kataTerpakai`).

Uji ulang (akun `guru.uji.b`, karena `guru.uji.ayat` sudah mencapai batas 10 set hari ini; materi-10 = salinan materi-8):

| | Sebelum (set 76, 78) | Sesudah (set 79, 80) |
|---|---|---|
| Menjodohkan tetap merah | 2, 0 | **0, 0** (80/20 pengelompokan → diperbaiki jadi istilah–pengertian) |
| Isian bocor tetap merah | 2, 2 | **1, 1**, keduanya jawaban angka "10%" (sengaja tidak dilarang) |

Catatan mutu (lolos pemeriksa, perlu dilihat guru): AI kadang tetap memilih topik pengelompokan untuk menjodohkan,
tetapi memaksa jawabannya berbeda ("Kebijakan fiskal tarif", "Pemerintah pusat melalui kantor pos").

Masih terbuka (kecil): isian berjawaban angka yang sama dengan hasil soal hitungan lain; menjodohkan "pengelompokan
yang dipaksakan" (perbaikan otomatis sering gagal karena materinya
sempit, jadi konsep yang sama terpakai di beberapa soal; calon perbaikan: menghindarinya sejak tahap kisi-kisi).

## Catatan uji
- Materi uji 7, 8, 9 dan set 69–73 ada di database **laptop** (akun `guru.uji.ayat`). Bisa dihapus bila pemilik
  setuju.
- Biaya: 3 set dengan deepseek-flash, kira-kira Rp1.000.
- Isi materi Fikih, Ekonomi, dan Biologi ditulis untuk uji. Audit ini menilai **kepatuhan aturan**; ketepatan isi
  hanya dinilai sejauh kesalahannya jelas (Temuan 1, 8).
