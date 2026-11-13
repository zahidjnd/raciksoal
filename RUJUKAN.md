# Peta Rujukan RacikSoal

**Status: DRAF 2 (2026-11-07).** Draf 1 disusun dari pencarian internet. Draf 2 sudah dicocokkan dengan naskah resmi yang
diberikan pemilik di `dokumen/rujukan/` dan dengan situs TKA Pusmendik. Belum ada kode yang diubah.

## Tujuan
Semua hal yang menentukan isi dan bentuk soal harus bisa dipertanggungjawabkan: ada dasarnya, dan dasarnya tertulis.
**AI hanya alat untuk merancang soal di dalam arah yang sudah ditetapkan.** AI tidak menentukan aturan, tidak menentukan
sumber, dan tidak dipakai sebagai rujukan untuk apa pun.

## Cara membaca
Setiap aturan diberi **tingkat dasar**:

| Kode | Tingkat | Artinya |
|---|---|---|
| **R1** | Aturan resmi | KMA, PMA, Keputusan Dirjen, Perka BSKAP, Kepmendikdasmen, SKB menteri, UU |
| **R2** | Kaidah ilmiah / lembaga | Taksonomi Bloom revisi, kaidah penulisan soal Puspendik, KBBI/EYD |
| **R3** | Keputusan madrasah | Diputuskan pemilik atau madrasah (sah, asal tertulis) |
| **R4** | Belum ada dasar | Perlu dicari rujukannya, atau diputuskan madrasah lalu jadi R3 |

Dan **status naskah**:
- ✔ = naskah resmi sudah dibaca (halaman disebut)
- ◐ = baru dari salinan blog/ringkasan, naskah resmi belum dibaca
- ✖ = belum ditemukan

Aturan teknis aplikasi (batas pemakaian per hari, tampilan, keamanan login, cadangan model AI) tidak masuk peta ini,
karena bukan aturan soal. Pengecualian: pemisahan data guru dan kerahasiaan (bagian P).

---

## 1. Daftar dokumen rujukan

### 1a. Sudah dibaca (naskah resmi)

| Kode | Dokumen | Isi penting untuk aplikasi |
|---|---|---|
| D01 | Data Al-Qur'an **Tanzil** "Simple" + lisensinya | teks ayat; teks tidak boleh diubah, sumber + tautan wajib |
| D02 | **PMA 44/2016** Penerbitan, Pentashihan, dan Peredaran Mushaf | mushaf digital yang diedarkan mengacu Mushaf Standar Indonesia (Psl 4) |
| D05 | **KMA 1503/2025** (22 Sep 2025), perubahan KMA 450/2024, Pedoman Implementasi Kurikulum RA & Madrasah. File `keputusan-menteri-agama-1503-2025_251202.pdf` (pindaian) | asesmen hanya **formatif & sumatif**; 4 prinsip: terpadu, **berkeadilan** (tidak merugikan karena gender, agama, suku, budaya, status sosial ekonomi), objektif, edukatif (hlm 67); teknik: observasi, kinerja, tes tertulis, tes lisan, portofolio (hlm 67); **rincian asesmen madrasah diatur Dirjen Pendis** (hlm 67); CP mapel umum ditetapkan Kemendikdasmen, CP keagamaan oleh Kemenag (hlm 22); Qurdis kelas XI = 72 JP/tahun (hlm 39) |
| D06 | **Kepdirjen Pendis 9941/2025** (28 Nov 2025), CP PAI & Bahasa Arab pada Madrasah. File `SK-Dirjen-Pendis-9941-2025-...pdf` | CP = acuan pembelajaran (diktum KEDUA). **Qurdis Fase F (XI–XII)**: 2 elemen (pemahaman konsep, keterampilan proses); 17 tema "Merefleksi isi kandungan ayat/hadis tentang ..." (hlm 16–17 cetak). **Tidak menyebut surah/ayat/hadis tertentu.** Tidak ada diktum yang mencabut 3302/2024 |
| D08b | **Panduan Pembelajaran dan Asesmen, Edisi Revisi 2025** (BSKAP **Kemendikdasmen**). File `1755668120_manage_file.pdf` | **Bukan dokumen Kemenag**, tidak menyebut berlaku untuk madrasah → pembanding. TP dirumuskan **pendidik** dari CP: kompetensi + lingkup materi + kata kerja operasional (hlm 15–16, 21–22); taksonomi boleh Bloom/SOLO/lainnya (hlm 16, 77–78); tes tertulis: esai, PG, uraian, dll. (hlm 47); bobot boleh diatur satuan pendidikan/pendidik (hlm 44); asesmen autentik/kontekstual (hlm 39); AI "alat dukung pembelajaran" (hlm 12). Tidak membahas kisi-kisi, kaidah penulisan soal, komposisi level, skor PG kompleks |
| D09b | **POS Ujian Madrasah TA 2025/2026**, Kepdirjen Pendis **751/2026** (26 Jan 2026). File `POS-UJIAN-MADRASAH.pdf` | Untuk ujian **akhir jenjang (kelas XII)**, bukan asesmen semester. **Format kisi-kisi resmi PAI: No · Fase · CP · Materi Esensial · Indikator** (PDF 69–75 untuk Qurdis MA). Soal disusun guru/madrasah, kisi-kisi PAI oleh Kemenag (PDF 9–11). Kisi-kisinya masih menulis "Kurikulum: KEPDIRJEN 3302". Tidak membahas bentuk butir, level, penskoran |
| D11 | **Panduan Kurikulum Berbasis Cinta**, Kepdirjen Pendis **6077/2025** (22 Jul 2025) | Panca Cinta: Cinta Allah Swt. dan Rasul-Nya, Cinta Ilmu, Cinta Lingkungan, Cinta Diri dan Sesama Manusia, Cinta Tanah Air (hlm 26–30). Tidak membahas penulisan soal |
| D12 | **Perka BSKAP 045/H/AN/2025** (14 Jul 2025), Kerangka Asesmen TKA SMA/MA & SMK/MAK. PDF resmi: https://pusmendik.kemendikdasmen.go.id/tka/files/15034.pdf | 3 bentuk: PG, PGK MCMA, PGK Kategori (hlm 8–9); soal tunggal & grup (hlm 8); level per mapel (lihat bagian I2); contoh soal (bagian IV) |
| D12b | **Kepmendikdasmen 56/2026**, Pedoman Penyelenggaraan TKA dan AN. https://pusmendik.kemendikdasmen.go.id/tka/files/39870.pdf | bentuk soal = PG dan PG kompleks (lebih satu jawaban benar dan kategori) (hlm 29); mapel pilihan 50 menit (hlm 45–46); nilai skala 200–800 (hlm 49). **Tidak ada aturan skor per butir dan jumlah soal** |
| D12c | **Kerangka TKA versi web per mapel** (Definisi, Muatan, Kompetensi, Matriks, Contoh Soal). https://pusmendik.kemendikdasmen.go.id/tka/kerangka/sma/ | lebih baru dari Perka; contoh soal lebih banyak (Bahasa Arab 10 soal) |

### 1b. Belum dibaca / belum ada

| Kode | Dokumen | Dipakai untuk | Status |
|---|---|---|---|
| D03 | **Mushaf Standar Indonesia** digital (LPMQ) | acuan mushaf resmi | ✖ perlu izin LPMQ, hanya bila dipakai di luar Al Fatah |
| D04 | **Terjemah Al-Qur'an Kemenag** 2019 (LPMQ) | terjemah ayat | ✖ lisensi tertulis tidak ditemukan |
| D07 | **CP mapel umum**: Keputusan Kepala BSKAP **046/H/KR/2025** (nomor dari D08b hlm 3) | mapel selain PAI & Bahasa Arab | ◐ nomor pasti, naskah belum ada |
| **D08** | **Pedoman/Juknis Pembelajaran dan Asesmen MADRASAH dari Dirjen Pendis** (yang diperintahkan KMA 1503/2025 hlm 67) | jenis asesmen semester, bentuk soal, penskoran, pengolahan nilai di madrasah | ✖ **dokumen terpenting yang belum ada** |
| **D09** | **POS Asesmen Madrasah** (sumatif PAI & Bahasa Arab per semester/tahun, bukan Ujian Madrasah) TP 2025/2026 + kisi-kisinya; blog menyebut nomor 901/2026 | kisi-kisi semester, komposisi level | ✖ belum dipastikan ada |
| D10 | Juknis Penilaian Hasil Belajar MA, Kepdirjen Pendis 3751/2018 | penskoran, analisis butir | ◐ era K13, kemungkinan sudah tergantikan; prioritas rendah |
| **D13** | **Panduan penulisan soal** Puspendik/Pusmendik (kaidah materi, konstruksi, bahasa) | kaidah penulisan soal | ◐ **tidak ada di satu pun dokumen resmi yang sudah dibaca** |
| D14 | Taksonomi Bloom revisi (Anderson & Krathwohl, 2001) | level C1–C6 | R2; dipakai juga oleh D08b (hlm 77–78) |
| D15 | Level L1–L3 / LOTS-MOTS-HOTS (Puspendik) | pengelompokan level | ◐ istilah LOTS/MOTS/HOTS tidak ada di dokumen resmi yang sudah dibaca |
| D16 | EYD Edisi V (Badan Bahasa, 2022) + KBBI | ejaan dan istilah | ◐ |
| D17 | SKB Menag & Mendikbud 158/1987 dan 0543b/U/1987, Pedoman Transliterasi Arab-Latin | transliterasi | ◐ |
| D18 | **Format AFTS** MA Al-Fatah (kop, susunan, bobot) | Word, bobot bawaan | ✔ (R3, milik madrasah) |
| D19 | UU 27/2022 Pelindungan Data Pribadi | data guru | ◐ |
| D20 | Panduan Pemanfaatan Kecerdasan Artifisial untuk Guru (Kemendikdasmen) | prinsip pemakaian AI | ◐ panduan Kemenag belum ditemukan |
| D21 | Kalender Pendidikan Madrasah (Kanwil, per tahun) | semester di kop | ◐ |
| **D22** | **Surat Kepala MA Al-Fatah No. 433/P/MA/PP.006/SPb/11/2026** (7 Nov 2026) tentang ASAS Ganjil (foto dari pemilik) | jumlah soal per bentuk & komposisi HOTS/MOTS/LOTS ASAS eksak/non-eksak; soal & kisi-kisi dibuat guru mapel | ✔ (R3, dokumen resmi madrasah) |

---

## 2. Peta per komponen

### A. Teks Al-Qur'an
| Aturan | Di aplikasi | Tingkat | Dasar | Catatan |
|---|---|---|---|---|
| Ayat tidak boleh dikarang/diketik AI; teks dari data mushaf | `mushaf.ts`, penjaga ayat `soal.ts` | R1 + R3 | D02, D01, aturan keras no. 5 | ✔ |
| Teks Tanzil tidak diubah, sumber + tautan dicantumkan | footer, kotak ayat | R1 (lisensi) | D01 | ✔ |
| Ejaan **imla'i** (Tanzil Simple), bukan rasm Utsmani | `public/quran/` | R3 | pilihan pemilik | ⚠️ D02 Psl 4: mushaf yang **diedarkan** mengacu Mushaf Standar Indonesia. Aman untuk internal; untuk pemakaian lebih luas perlu D03 |
| Teks Arab dari PDF/file tidak dipakai apa adanya | `materi.ts` | R3 | keputusan teknis | ✔ |
| Nama surah gaya Kemenag ("QS. An-Nūr [24]: 2") | `surah.ts` | R1/R2 | D17 | ◐ |

### B. Terjemah ayat
| Aturan | Di aplikasi | Tingkat | Dasar | Catatan |
|---|---|---|---|---|
| Terjemah tidak dibuat AI; terjemah guru di materi didahulukan | form materi | R3 | aturan keras no. 5 | ✔ |
| Ayat dari mushaf tanpa terjemah guru → **terjemah Kementerian Agama RI** dari Tanzil (`data/quran/id.indonesian.txt`, versi Tanzil 2010; di folder server, tidak bisa diunduh browser), dibundel sejak 0.42.0 | `mushaf.ts` `terjemahAyat` | R3 | keputusan pemilik 13 Nov 2026; ketentuan Tanzil: terjemah "for non-commercial purposes only", sumber dicantumkan | ⚠️ Edisi lama (bukan Terjemah Kemenag 2019 / D04). Aman untuk pemakaian internal non-komersial; di luar itu perlu izin penerbit |
| Terjemah hadis hanya dari materi guru | `soal.ts` `caraDalil` | R3 | belum ada data terjemah hadis yang terpercaya | ✔ |
| Sumber terjemah ayat tidak tercatat per dalil | — | **R4** | — | Sebagian: tanda `terjemahKemenag` untuk terjemah otomatis |
| Ragam cara tampil dalil di soal (Arab+terjemah, Arab, terjemah, potongan, nama sumber, di pembahasan), direncanakan aplikasi | `rencanaDalil`, `tampilanDalil` | R2 + R3 | kaidah penulisan soal (stimulus relevan dengan pertanyaan) + keputusan pemilik 13 Nov 2026 | ATURAN-SOAL 5a |

### C. Hadis
| Aturan | Di aplikasi | Tingkat | Dasar | Catatan |
|---|---|---|---|---|
| Hadis yang ditemukan di **data 9 kitab** (Bukhari, Muslim, Abu Dawud, Tirmidzi, Nasa'i, Ibnu Majah, Malik, Ahmad, Darimi) → teks Arab & "HR. Kitab no. N" diambil dari data, tanpa centang (0.36.0) | `hadis.ts`, `rapikanMateri` | R3 | keputusan pemilik 12 Nov 2026; uji: 24/25 hadis buku PAI ketemu | Data terbuka: hadith-api (fawazahmed0, nomor Fuad Abdul Baqi) & Hadith-Data-Sets (abdelrahmaan, Ahmad 26.363 & Darimi). Harakat belum dibandingkan dengan kitab cetak |
| Hadis di luar data (Baihaqi, Thabrani, Hakim, lafal lain) → teks yang ditempel guru + centang verifikasi | `rapikanMateri` | R3 | aturan keras no. 5 | ✔ |
| AI tidak memeriksa keaslian hadis | — | R3 | aturan keras no. 5 | ✔ |
| Sumber hadis wajib ("HR. Bukhari") | form materi | R3 | — | ✔ |
| **Derajat hadis** tidak tercatat; nomor hanya untuk hadis dari data | — | **R4** | D06 tidak menyebut hadis tertentu | Usul: kolom opsional "derajat" |
| Mode Bahasa Arab: hadis karangan tidak terdeteksi otomatis | `pemeriksaArab` | R3 | — | celah lama |

### D. Materi, CP, dan Tujuan Pembelajaran
| Aturan | Di aplikasi | Tingkat | Dasar | Catatan |
|---|---|---|---|---|
| Soal hanya dari materi yang dimasukkan guru | prompt | R3 | — | ✔ |
| Kunci jawaban berdasar materi bab | `buatSistem` | R2 | D13 | |
| **TP diputuskan guru**: TP yang tertulis di materi guru disalin persis (dicek aplikasi, kode dipertahankan, kotak hijau). Bila tidak ada, AI mengusulkan TP (kotak kuning) dan guru WAJIB membaca + mencentang "sesuai dengan yang saya ajarkan" sebelum membuat soal | `buatAnalisaMateri`, `terapkanAnalisa`, `rapikanMateri`, `KartuDraf` | **R1** (AI alat dukung, D08b hlm 12) + **R3** (centang = keputusan madrasah) | ✔ D08b hlm 15–16, 21–22: TP dirumuskan **pendidik**; D05 hlm 66: perencanaan oleh guru | ✅ diperbaiki 2026-11-07 (dulu TP AI dipakai tanpa persetujuan guru). Alasan pemilik: guru sering membuat UH sederhana dan sebagian tidak punya TP tertulis. Materi lama tidak perlu dicentang ulang |
| Kesesuaian materi dengan CP | — | **R4** | ✔ D06 Qurdis Fase F (17 tema) | Usul: simpan 17 tema CP Qurdis Fase F di aplikasi; guru memilih tema CP saat membuat materi (pilihan, bukan buatan AI). Mapel lain menyusul bila CP-nya dimasukkan |
| Sumber materi (buku, halaman) tidak tercatat | — | **R4** | — | Usul: kolom "sumber materi" |
| Pokok materi diringkas AI dari teks guru | `buatAnalisaMateri` | R3 | — | boleh: hanya meringkas, bisa diedit |

### E. Jenis asesmen dan identitas ujian
| Aturan | Di aplikasi | Tingkat | Dasar | Catatan |
|---|---|---|---|---|
| Jenis: Ulangan Harian, AFTS, ASAS, Latihan, Latihan TKA | `TUJUAN` | R1 + R3 | ✔ D05 hlm 67: hanya "formatif & sumatif" | **Istilah AFTS/ASAS/PTS/PAS tidak ada di dokumen resmi yang sudah dibaca** → istilah madrasah (R3) sampai D08/D09 ditemukan |
| Jumlah soal bawaan (UH 25, ASAS 25, Latihan 10, TKA 25) | `CEPAT`, `JUMLAH_*` | **R4** | ✔ D12b: jumlah soal TKA resmi tidak ada | perlu keputusan madrasah |
| Waktu bawaan 90 menit | `WAKTU_BAWAAN` | R3 | pilihan pemilik | TKA resmi: 50 menit per mapel pilihan (D12b hlm 45–46) |
| Semester: Juli–Desember = Ganjil | `semesterDari` | R1 | D21 | ◐ |

### F. Level kognitif
| Aturan | Di aplikasi | Tingkat | Dasar | Catatan |
|---|---|---|---|---|
| Level C1–C6 | `LEVEL` | R2 | D14; ✔ D08b hlm 16, 77–78 | |
| LOTS = C1–C2, MOTS = C3, HOTS = C4–C6 | `KATEGORI` | R2 | D15 | ◐ istilah tidak ada di dokumen resmi yang sudah dibaca. Padanan resmi terdekat: level TKA Pemahaman/Penerapan/Penalaran |
| Kata kerja bukan penentu level; HOTS wajib stimulus | `buatSistem` | R2 | D14, D15 | |
| **Komposisi level & jumlah soal ASAS** (eksak 35: 8/15/12; non-eksak 45: 10/20/15) | `ASAS_ALFATAH` | **R3** | ✔ D22 | ✅ 2026-11-08. Bentuk "Menjodohkan/BS" gaya lama Al-Fatah (satu nomor = satu pernyataan) dan skor total 100 = keputusan pemilik |
| **Komposisi level bawaan** jenis lain (UH 40/40/20, AFTS 30/40/30, TKA 20/40/40) | `ATURAN_TUJUAN` | **R4** | ✔ tidak ada di D05, D06, D08b, D09b, D12 | perlu keputusan madrasah, atau tunggu D08/D09 |
| Komposisi dihitung aplikasi, bukan AI | `rencanaLevel` | R3 | — | ✔ |
| Tingkat kesulitan mengatur berat soal di dalam levelnya | `ATURAN_KESULITAN` | R2 + R3 | D15; D08b hlm 13–14 (tingkat kesulitan sesuai kemampuan murid) | |

### G. Kisi-kisi
| Aturan | Di aplikasi | Tingkat | Dasar | Catatan |
|---|---|---|---|---|
| Kisi-kisi disusun dulu, baru soal | `kerjakan` | R2 | ✔ D09b PDF 6 ("acuan untuk mengembangkan dan merakit soal") | |
| Kolom: No · TP · Materi · Indikator · Level · Bentuk | `buatWordKisi` | R3 | ✔ format resmi D09b: **No · Fase · CP · Materi Esensial · Indikator** | Usul: tambah kolom **CP** dan ganti "Materi" jadi **"Materi Esensial"** supaya sejalan format Kemenag; Level & Bentuk tetap (tambahan madrasah) |
| Indikator soal ditulis AI | `buatPermintaanKisi` | R2 | D13 | contoh indikator resmi D09b: "Merefleksikan ayat-ayat Al-Qur'an dan hadis tentang toleransi ..." |

### H. Kaidah penulisan soal
Semua butir di ATURAN-SOAL.md bagian 2 dan 10.

| Aturan | Tingkat | Dasar | Catatan |
|---|---|---|---|
| Kaidah materi, konstruksi, bahasa | R2 | D13 | ◐ **tidak ada di dokumen resmi mana pun yang sudah dibaca**. Perlu naskah D13 |
| Tidak memuat SARA, tidak bias | **R1** | ✔ D05 hlm 67 (prinsip berkeadilan); D08b hlm 12 | naik dari R2 ke R1 |
| Stimulus kontekstual / autentik | R1 + R2 | ✔ D08b hlm 39 (asesmen autentik) | |
| Kunci bukan pilihan terpanjang; pilihan angka urut; jawaban tidak bocor ke soal lain | R2 | D13 | ambang 1,5× = ukuran aplikasi (R3) |
| Khilafiyah: rujuk semua mazhab | R3 | keputusan pemilik | D06 Qurdis memuat tema "toleransi dan moderasi" → sejalan |
| Pembahasan menyebut alasan kunci & tiap pengecoh; pernyataan salah = ubah satu konsep | R3 | contoh try out (bukan resmi) | |

### I. Bentuk soal
#### I1. Bentuk umum (UH, AFTS, ASAS, Latihan)
| Aturan | Di aplikasi | Tingkat | Dasar | Catatan |
|---|---|---|---|---|
| Bentuk yang tersedia: PG, PGK, Kategori, Menjodohkan, Isian, Uraian | `NAMA_BENTUK` | R1 + R3 | ✔ D08b hlm 47 ("esai, pilihan ganda, uraian, atau bentuk lainnya"); D05 hlm 67 (tes tertulis) | rincian tiap bentuk = R2/R3 |
| PG 5 pilihan | `soal.ts` | R1/R2 | ✔ semua contoh D12 memakai A–E | |
| Menjodohkan 5 premis + 6 jawaban; Isian ≤ 5 kata; Uraian berbatasan + rubrik | `soal.ts`, `buatSistem` | R2/R3 | D13 | |
| Bahasa Indonesia: separuh soal PG berupa soal grup (satu bacaan untuk 2–3 soal) | `grupSet` | R1 + R3 | ✔ D12 hlm 8 (soal grup); penerapan di UH/AFTS/ASAS = keputusan pemilik 2026-11-12 | PG saja |

#### I2. Latihan TKA (dicocokkan dengan D12, D12b, D12c)
| Aturan | Di aplikasi | Dokumen resmi | Status |
|---|---|---|---|
| Hanya PG, PGK MCMA, PGK Kategori; tanpa uraian | `TKA` | ✔ D12 hlm 8–9; D12b hlm 29 | **sesuai** |
| Soal tunggal dan soal grup | `rencanaGrup` | ✔ D12 hlm 8 | **sesuai** |
| Bahasa Arab termasuk mapel TKA; tidak ada mapel agama | `mapelTka`, `namaTujuan` | ✔ D12 hlm 7–8; D12b (daftar 3 mapel wajib + mapel pilihan) | **sesuai**: mapel di luar daftar (agama, Informatika) tampil sebagai "Latihan Gaya TKA" / Word "LATIHAN SOAL GAYA TKA" (2026-11-08) |
| MCMA: **2–4** jawaban benar | `ATURAN_TKA`, `KUNCI_PGK` | contoh resmi: **2–4** benar (mis. Matematika, Biologi), 5 pernyataan | ✅ **sesuai** (2026-11-08) |
| Petunjuk MCMA "Pilihlah jawaban yang benar! Jawaban benar lebih dari satu." | `ATURAN_TKA` | baku resmi, sama | ✅ **sesuai** (2026-11-08) |
| Kategori: **3 pernyataan** | `ATURAN_TKA`, `PERNYATAAN_BOLEH` | semua 37 contoh di D12: **3 pernyataan** (versi web kadang 4) | ✅ **sesuai** (2026-11-08) |
| Label Kategori TKA: Benar/Salah, Tepat/Tidak Tepat, Sesuai/Tidak Sesuai, Setuju/Tidak Setuju, Logis/Tidak Logis | `ATURAN_TKA`, `LABEL_KATEGORI` | contoh resmi sama; Fakta/Opini & Didukung hanya untuk jenis lain | ✅ **sesuai** (2026-11-08) |
| Satu grup = **satu bentuk** saja | `rencanaGrup` | contoh resmi: satu grup **boleh campur bentuk** (BI: PG + Kategori + Kategori) | ⚠️ **beda** (penyederhanaan aplikasi) |
| Level: Pemahaman / Penerapan / Penalaran; mapel bahasa memakai kompetensi membaca | `namaLevelTka` | IPA/IPS/Matematika: Pemahaman / Penerapan / Penalaran. Bahasa Arab = Pemahaman Literal / Reorganisasi / Pemahaman Inferensial (D12 hlm 85–86); Bahasa Indonesia & Inggris = Pemahaman Tekstual / Inferensial / Evaluasi dan Apresiasi (hlm 10–11) | ✅ **sesuai** (2026-11-08) |
| Teks Bahasa Arab TKA | prompt mode Bahasa Arab | fusha, tingkat dasar; paragraf 25–50 kosakata (2–4 baris); dialog 5–6 tanya jawab; topik keseharian (D12 hlm 84–86) | belum dipakai aplikasi |

### J. Stimulus dan nilai
| Aturan | Tingkat | Dasar | Catatan |
|---|---|---|---|
| Stimulus kontekstual, gambar dideskripsikan dengan kata | R1 + R2 | ✔ D08b hlm 39; D13 | Berlaku bila materi tanpa gambar |
| Gambar stimulus hanya dari materi guru, ditampilkan di bawah pokok soal, harus perlu dilihat untuk menjawab | R2 + R3 | Kaidah umum: stimulus harus berfungsi untuk menjawab (halaman rujukan belum dicek); sumber gambar & tempat = keputusan pemilik 2026-11-10 | AI tidak membuat gambar |
| Nama tokoh beragam, satu skenario sekali per set | R3 | keputusan pemilik | |
| Data berbaris-berkolom ditulis sebagai tabel (maks 6 × 10, tidak di pilihan) | R2 + R3 | D12 (stimulus TKA: grafik/tabel, data percobaan); batas ukuran & tempat = keputusan pemilik 2026-11-10 | |
| Rumus ditulis sebagai rumus sungguhan (LaTeX `$...$`), desimal koma | R2 + R3 | Kaidah penulisan matematika (notasi baku, desimal koma PUEBI); format & tempat = keputusan pemilik 2026-11-10 | |
| Nilai Panca Cinta boleh disisipkan secara wajar | R1 | ✔ D11 hlm 26–30 (integrasi nilai ke pembelajaran) | D11 tidak mengatur soal secara khusus. ATURAN-SOAL menulis "Cinta Diri dan Sesama"; nama resminya "Cinta Diri dan **Sesama Manusia**" |

### K. Penskoran dan bobot
| Aturan | Di aplikasi | Tingkat | Dasar | Catatan |
|---|---|---|---|---|
| Bobot per bentuk bisa diatur; bawaan PG 2, PGK 5, Kategori 3, Uraian 8 | `BOBOT_BAWAAN` | R1 + R3 | ✔ D08b hlm 44 (bobot boleh diatur satuan pendidikan/pendidik); D18 | naik dari R3 ke R1 + R3 |
| Bobot Menjodohkan 5, Isian 3 | `BOBOT_BAWAAN` | **R4** | — | perlu keputusan madrasah |
| PGK & Kategori: semua benar = skor penuh, selain itu 0 | `terapkanBobot` | **R4** | ✔ tidak ada di D05, D08b, D12, D12b. TKA memakai IRT (hanya dari berita, bukan aturan per butir) | perlu keputusan madrasah (mis. tetap 0/penuh, atau skor sebagian) |
| Rubrik uraian, skor sebagian, jumlah = bobot | `buatSistem` | R1 + R2 | ✔ D08b hlm 40, 127 (rubrik, konversi skor ke 100) | |
| Pengolahan nilai akhir | tidak ada | — | D08b hlm 52–57 | di luar cakupan aplikasi |

### L. Bahasa, ejaan, transliterasi
| Aturan | Di aplikasi | Tingkat | Dasar | Catatan |
|---|---|---|---|---|
| Bahasa baku, istilah KBBI (salat, wudu, hadis, Allah Swt.) | `buatSistem` | R1/R2 | D16 | ◐ |
| **Transliterasi tanpa huruf bertitik/bergaris** kecuali Bahasa Arab | `buatSistem` | R3 | keputusan pemilik | ⚠️ berbeda dengan D17 (ḥ, ṣ, ā); nama surah di aplikasi sudah gaya D17. Perlu keputusan |

### M. Format dokumen Word
| Aturan | Tingkat | Dasar | Catatan |
|---|---|---|---|
| Kop lembar soal persis format AFTS | R3 | D18 | ✔ |
| Arab Word: Traditional Arabic 16 pt; web Amiri; kanan-ke-kiri | R3 | permintaan pemilik, aturan keras no. 7 | |
| Kunci + pembahasan + rubrik terpisah; peringatan AI di file guru | R3 | keputusan pemilik, aturan keras no. 6 | |

### N. Paket A–D
| Aturan | Tingkat | Dasar |
|---|---|---|
| Paket diacak per bagian bentuk, kunci ikut | R3 | keputusan pemilik |

### O. Peran AI dan pengawasan guru
| Aturan | Tingkat | Dasar | Catatan |
|---|---|---|---|
| Peringatan "Soal dibuat AI, wajib diperiksa guru sebelum dipakai" | R3 + R1 | aturan keras no. 6; ✔ D08b hlm 12 (AI = alat dukung), hlm 45 (guru paling memahami murid) | D20 belum dibaca |
| Prompt dan nama model disimpan | R3 | CLAUDE.md | |
| Catatan guru mengalahkan aturan gaya, kecuali 4 kunci | R3 | ATURAN-SOAL.md bagian 6 | |
| AI tidak dipakai sebagai pemeriksa ayat/hadis/rujukan | R3 | aturan keras no. 5 | ✔ |

### P. Data dan kerahasiaan
| Aturan | Tingkat | Dasar | Catatan |
|---|---|---|---|
| Data tiap guru terpisah | R1 + R3 | D19, aturan keras no. 3 | diuji `npm run uji:pemisahan` |
| Tidak menyimpan data siswa | R1 | D19 | ✔ |
| Teks materi dikirim ke penyedia AI | **R4** | D19, D20 | Usul: kalimat di Panduan "jangan menempel data pribadi siswa" |

---

## 3. Celah dan perbedaan (urut kepentingan)

**A. Bertentangan dengan dokumen resmi (perlu diperbaiki):**
1. ~~**TP dibuat AI**, padahal TP dirumuskan guru (D08b, D05).~~ ✅ Diperbaiki 2026-11-07: TP dari materi guru disalin; TP usulan AI wajib dibaca & dicentang guru.
2. ~~**Latihan TKA berbeda dari contoh resmi** (D12)~~ ✅ Disamakan 2026-11-08: MCMA 2–4, Kategori 3 pernyataan, petunjuk baku, label resmi, level mapel bahasa. **Sisa: grup campur bentuk** (resmi boleh; aplikasi masih satu bentuk per grup karena lembar Word disusun per bagian bentuk).

**B. Belum ada dasar, perlu keputusan madrasah (R4 → R3):**
3. Komposisi level bawaan dan jumlah soal bawaan. **ASAS sudah (D22, 2026-11-08)**; UH, AFTS, Latihan belum.
4. Skor PGK & Kategori (0/penuh atau sebagian), bobot Menjodohkan & Isian.
5. Transliterasi (ikut SKB 1987 atau tetap tanpa tanda).
6. Istilah AFTS/ASAS (tetap, sebagai istilah madrasah).

**C. Bisa dibuat lebih kuat dengan data resmi yang sudah ada:**
7. CP Qurdis Fase F (17 tema) masuk aplikasi sebagai pilihan.
8. Kisi-kisi ditambah kolom CP & "Materi Esensial" (format D09b).
9. Kolom sumber materi, kitab & derajat hadis, sumber terjemah.

**D. Masih menunggu dokumen:**
10. Kaidah penulisan soal (D13).
11. Aturan asesmen madrasah dari Dirjen (D08/D09).

**E. Lain-lain:** Mushaf Standar Indonesia (hanya bila dipakai di luar Al Fatah); pernyataan data untuk guru.

## 4. Dokumen yang masih perlu dicari pemilik
TKA sudah lengkap (D12, D12b, D12c dari situs Pusmendik, tidak perlu diunduh satu per satu).

- [ ] **D08** Pedoman/Juknis **Pembelajaran dan Asesmen MADRASAH** dari **Dirjen Pendis** (turunan KMA 1503/2025). Kalau ada versi lama (turunan KMA 450/2024 atau 347/2022) juga berguna
- [ ] **D09** **POS Asesmen Madrasah** (sumatif semester PAI & Bahasa Arab, bukan Ujian Madrasah kelas XII) TP 2025/2026, beserta kisi-kisinya
- [ ] **D13** **Panduan penulisan soal** Puspendik/Pusmendik (sering beredar di pelatihan penulisan soal / MGMP)
- [ ] **Aturan internal Al Fatah** bila ada: pedoman AFTS, UH, penskoran (ASAS sudah: D22)
- [ ] (nanti, saat mapel umum dipakai) D07 Keputusan Kepala BSKAP **046/H/KR/2025** tentang CP

File yang sudah ada tetap di `dokumen/rujukan/`. Nama `1755668120_manage_file.pdf` = Panduan Pembelajaran dan Asesmen
BSKAP 2025 (D08b).

## 5. Langkah sesudahnya (diusulkan, belum dikerjakan)
1. Setiap kali aturan soal diubah: ubah ATURAN-SOAL.md, lalu **peta ini**, baru kode. Aturan baru tanpa baris di peta ini tidak boleh masuk.
2. A1 (TP dari guru) sudah 2026-11-07; A2 (Latihan TKA) sudah 2026-11-08 kecuali grup campur bentuk.
3. Pemilik memutuskan celah B (3–6), lalu dicatat sebagai R3.
4. Celah C (CP Qurdis, kolom kisi-kisi, kolom sumber).
5. Halaman "Dasar aturan" di Panduan untuk guru, dan satu baris rujukan di Word kisi-kisi.
