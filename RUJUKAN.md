# Peta Rujukan RacikSoal

**Status: DRAF 1 (2026-11-07), disusun atas permintaan pemilik. Belum ada kode yang diubah.**

## Tujuan
Semua hal yang menentukan isi dan bentuk soal harus bisa dipertanggungjawabkan: ada dasarnya, dan dasarnya tertulis.
**AI hanya alat untuk merancang soal di dalam arah yang sudah ditetapkan.** AI tidak menentukan aturan, tidak menentukan
sumber, dan tidak dipakai sebagai rujukan untuk apa pun.

## Cara membaca
Setiap aturan diberi **tingkat dasar**:

| Kode | Tingkat | Artinya |
|---|---|---|
| **R1** | Aturan resmi | KMA, PMA, Keputusan Dirjen, Perka BSKAP, SKB menteri, UU |
| **R2** | Kaidah ilmiah / lembaga | Taksonomi Bloom revisi, kaidah penulisan soal Puspendik, KBBI/EYD |
| **R3** | Keputusan madrasah | Diputuskan pemilik atau madrasah (sah, asal tertulis) |
| **R4** | Belum ada dasar | Perlu dicari rujukannya, atau diputuskan madrasah lalu jadi R3 |

Dan **status naskah**:
- ✔ = naskah resmi sudah dibaca/dicek
- ◐ = baru dari salinan blog/ringkasan, **naskah resminya belum dicek** (nomor bisa salah)
- ✖ = belum ditemukan

Aturan yang sifatnya teknis aplikasi (batas pemakaian per hari, tampilan, keamanan login, cadangan model AI) tidak masuk
peta ini, karena bukan aturan soal. Pengecualian: pemisahan data guru dan kerahasiaan, ada di bagian P.

---

## 1. Daftar dokumen rujukan

| Kode | Dokumen | Dipakai untuk | Status |
|---|---|---|---|
| D01 | Data Al-Qur'an **Tanzil** "Simple" + lisensinya (tanzil.net) | teks ayat di aplikasi | ✔ |
| D02 | **PMA 44/2016** tentang Penerbitan, Pentashihan, dan Peredaran Mushaf Al-Qur'an | batasan teks Al-Qur'an digital | ✔ |
| D03 | **Mushaf Standar Indonesia** (LPMQ Kemenag), versi digital | acuan mushaf resmi (PMA 44/2016 Psl 4) | ✖ belum ada izin, tidak dibundel |
| D04 | **Terjemah Al-Qur'an Kemenag** (edisi penyempurnaan 2019, LPMQ) | terjemah ayat | ✖ lisensi tertulis tidak ditemukan, tidak dibundel |
| D05 | **KMA 1503/2025** tentang Pedoman Implementasi Kurikulum RA & Madrasah (perubahan KMA 450/2024) | kerangka kurikulum & asesmen (awal/proses/akhir) | ◐ |
| D06 | **Kepdirjen Pendis 9941/2025**: CP PAI & Bahasa Arab pada Madrasah (sebelumnya 3302/2024, 3211/2022) | CP Al-Qur'an Hadis, Akidah Akhlak, Fikih, SKI, Bahasa Arab | ◐ apakah 9941 menggantikan 3302 perlu dicek |
| D07 | **CP mapel umum** (Keputusan Kepala BSKAP Kemendikdasmen, nomor terbaru) | CP Matematika, IPA, IPS, bahasa, dll. | ◐ nomor belum dipastikan |
| D08 | **Panduan Pembelajaran dan Asesmen Madrasah 2025** (Direktorat KSKK, turunan KMA 1503/2025) | jenis asesmen, kisi-kisi, pengolahan nilai | ◐ belum dibaca |
| D09 | **POS Penyelenggaraan Asesmen Madrasah TP 2025/2026** (disebut Kepdirjen Pendis 901/2026) + lampiran kisi-kisi | format kisi-kisi, bentuk soal, level | ◐ nomor tidak konsisten di blog |
| D10 | **Juknis Penilaian Hasil Belajar MA**, Kepdirjen Pendis 3751/2018 | penskoran, analisis butir | ◐ era K13, mungkin sudah tidak berlaku |
| D11 | **Panduan Kurikulum Berbasis Cinta**, Kepdirjen Pendis 6077/2025 | nilai Panca Cinta di stimulus | ◐ tautan resmi kemenag.go.id ada |
| D12 | **Kerangka Asesmen TKA**, Perka BSKAP 045/H/AN/2025 | gaya Latihan TKA | ◐ dirangkum dari artikel |
| D13 | **Kaidah penulisan soal** Puspendik / Dit. PSMP (pelatihan penulisan soal) | kaidah materi, konstruksi, bahasa | ◐ dari salinan blog |
| D14 | **Taksonomi Bloom revisi** (Anderson & Krathwohl, 2001) | level C1–C6 | R2, buku ilmiah |
| D15 | **Penyusunan soal HOTS / level L1–L3** (Puspendik) | pengelompokan LOTS/MOTS/HOTS | ◐ dari materi kampus |
| D16 | **EYD Edisi V** (Badan Bahasa, 2022) + **KBBI** | ejaan dan istilah keagamaan | ◐ |
| D17 | **SKB Menag & Mendikbud No. 158/1987 dan 0543b/U/1987**: Pedoman Transliterasi Arab-Latin | penulisan istilah/nama Arab dengan huruf Latin | ◐ |
| D18 | **Format AFTS** Madrasah Aliyah Al-Fatah (kop, susunan soal, bobot) | lembar soal Word, bobot bawaan | ✔ (R3, milik madrasah) |
| D19 | **UU 27/2022** tentang Pelindungan Data Pribadi | data guru di aplikasi | ◐ |
| D20 | **Panduan Pemanfaatan Kecerdasan Artifisial untuk Guru** (Kemendikdasmen) | prinsip pemakaian AI oleh guru | ◐ panduan Kemenag khusus madrasah belum ditemukan |
| D21 | **Kalender Pendidikan Madrasah** (Kemenag/Kanwil, per tahun pelajaran) | semester & tahun pelajaran di kop | ◐ |

---

## 2. Peta per komponen

### A. Teks Al-Qur'an
| Aturan | Di aplikasi | Tingkat | Dasar | Catatan |
|---|---|---|---|---|
| Ayat tidak boleh dikarang/diketik AI; teks diambil dari data mushaf | `mushaf.ts`, penjaga ayat `soal.ts` | R1 + R3 | D02, D01, aturan keras no. 5 | ✔ |
| Teks Tanzil tidak diubah, sumber + tautan tanzil.net dicantumkan | footer, kotak ayat | R1 (lisensi) | D01 | ✔ |
| Ejaan **imla'i** (Tanzil Simple), bukan rasm Utsmani | data `public/quran/` | R3 | pilihan pemilik (sama dengan PPT guru) | ⚠️ PMA 44/2016 Psl 4: mushaf yang **diedarkan** mengacu Mushaf Standar Indonesia (rasm Utsmani). Aman untuk pemakaian internal; kalau nanti lebih luas, perlu D03 + izin LPMQ |
| Teks Arab dari PDF/file tidak dipakai apa adanya, dicocokkan ke mushaf | `materi.ts` | R3 | keputusan teknis (PDF merusak huruf) | ✔ |
| Nama surah gaya Kemenag ("QS. An-Nūr [24]: 2") | `surah.ts` | R1/R2 | D17 / gaya Al-Qur'an Kemenag | ◐ sumber daftar nama belum dicatat |

### B. Terjemah ayat
| Aturan | Di aplikasi | Tingkat | Dasar | Catatan |
|---|---|---|---|---|
| Terjemah diisi guru, tidak dibuat AI, tidak dibundel | form materi, `terapkanAnalisa` | R3 | D04 belum berizin | AI hanya boleh menyalin terjemah yang tertulis di teks guru |
| Sumber terjemah tidak tercatat | — | **R4** | — | Usul: kolom "sumber terjemah" (mis. "Terjemah Kemenag 2019") |

### C. Hadis
| Aturan | Di aplikasi | Tingkat | Dasar | Catatan |
|---|---|---|---|---|
| Hadis dari teks yang ditempel guru + centang verifikasi | `materi.ts`, `rapikanMateri` | R3 | aturan keras no. 5 | ✔ |
| AI tidak pernah memeriksa keaslian hadis | — | R3 | aturan keras no. 5 | ✔ |
| Sumber hadis wajib diisi ("HR. Bukhari") | form materi | R3 | — | ✔ |
| **Kitab, nomor hadis, dan derajat** tidak tercatat | — | **R4** | kitab hadis asli / buku siswa Kemenag | Usul: kolom opsional "kitab & nomor" dan "derajat (sahih/hasan)". Ini yang membuat soal hadis bisa dicek orang lain |
| Mode Bahasa Arab: hadis karangan AI tidak bisa dideteksi otomatis | `pemeriksaArab` | R3 | — | Celah lama, hanya dicegah lewat instruksi |

### D. Materi, CP, dan Tujuan Pembelajaran
| Aturan | Di aplikasi | Tingkat | Dasar | Catatan |
|---|---|---|---|---|
| Soal hanya dari materi yang dimasukkan guru | prompt "hanya dari teks materi" | R3 | — | ✔ |
| Kunci jawaban harus berdasar materi bab (cerita boleh pengetahuan umum) | `buatSistem` | R2 | D13 | ✔ |
| **TP diusulkan AI** bila guru tidak menulis TP (`buatAnalisaMateri`) | `prompt.ts` | **R4** | seharusnya D06/D07 → ATP madrasah | ⚠️ **Celah terbesar**: TP adalah turunan CP resmi. AI tidak boleh merumuskan TP sendiri. Usul: TP wajib dari ATP/modul guru; AI hanya menyalin TP yang tertulis, kalau tidak ada → guru diminta menempel TP |
| Kesesuaian materi dengan CP fase F | — | **R4** | D06, D07 | Usul: simpan teks CP Qurdis fase F (dan mapel lain bertahap) sebagai rujukan pilihan, bukan dibuat AI |
| **Sumber materi** (buku siswa, penerbit, halaman) tidak tercatat | — | **R4** | buku teks resmi (Kemenag / SIBI Kemendikdasmen) | Usul: kolom "sumber materi" di materi, ikut tercetak di kisi-kisi |
| Pokok materi diringkas AI dari teks guru | `buatAnalisaMateri` | R3 | — | boleh, karena hanya meringkas teks guru dan bisa diedit |

### E. Jenis asesmen dan identitas ujian
| Aturan | Di aplikasi | Tingkat | Dasar | Catatan |
|---|---|---|---|---|
| Jenis: Ulangan Harian, AFTS, ASAS, Latihan, Latihan TKA | `TUJUAN` prompt.ts | R1 + R3 | D05 (asesmen awal/proses/akhir), istilah AFTS/ASAS = madrasah | ◐ cocokkan nama dengan D08 |
| Jumlah soal bawaan (UH 25, ASAS 25, Latihan 10, TKA 25) | `CEPAT`, `JUMLAH_*` | **R4** | — | belum ada dasar; kalau dari kebiasaan madrasah → tulis sebagai R3 |
| Waktu bawaan 90 menit | `WAKTU_BAWAAN` | R3 | pilihan pemilik | |
| Semester: Juli–Desember = Ganjil | `semesterDari` | R1 | D21 | ◐ |

### F. Level kognitif
| Aturan | Di aplikasi | Tingkat | Dasar | Catatan |
|---|---|---|---|---|
| Level C1–C6 | `LEVEL` soal.ts | R2 | D14 | |
| LOTS = C1–C2, MOTS = C3, HOTS = C4–C6 | `KATEGORI` | R2 | D15 | ⚠️ ada sumber yang memakai 2 kelompok; cocokkan dengan D08/D09 |
| Kata kerja bukan penentu level; HOTS ≠ sulit; HOTS wajib stimulus | `buatSistem` | R2 | D14, D15 | ✔ |
| Level TKA: Pemahaman / Penerapan / Penalaran | `NAMA_LEVEL_TKA` | R1 | D12 | ◐ |
| **Komposisi level bawaan** (UH & Latihan 40/40/20, AFTS & ASAS 30/40/30, TKA 20/40/40) | `ATURAN_TUJUAN` | **R4** | — | belum ada dasar tertulis. Cari di D08/D09; kalau tidak ada → keputusan madrasah (R3) |
| Komposisi dihitung aplikasi, bukan AI | `rencanaLevel` | R3 | — | ✔ |
| Tingkat kesulitan (Mudah/Sedang/Sulit) mengatur berat soal di dalam levelnya | `ATURAN_KESULITAN` | R2 + R3 | D15 | arti tiap tingkat = rumusan aplikasi |

### G. Kisi-kisi
| Aturan | Di aplikasi | Tingkat | Dasar | Catatan |
|---|---|---|---|---|
| Kisi-kisi disusun dulu, baru soal | `kerjakan` | R2 | D13 | ✔ |
| Kolom: No | TP | Materi | Indikator | Level | Bentuk | `buatWordKisi` | R3 | madrasah tidak punya format resmi | ◐ cocokkan dengan format kisi-kisi di lampiran D09 |
| Indikator soal "gaya Kemenag" ditulis AI | `buatPermintaanKisi` | R2 | D13 (rumusan indikator: subjek, perilaku, kondisi) | rumusan dipandu kaidah, hasil wajib dicek guru |

### H. Kaidah penulisan soal (materi, konstruksi, bahasa)
Semua butir di ATURAN-SOAL.md bagian 2 dan 10.

| Aturan | Tingkat | Dasar | Catatan |
|---|---|---|---|
| Kaidah materi, konstruksi, bahasa (pokok jelas, tanpa negatif ganda, kata negatif kapital, pilihan homogen, tanpa "semua benar", dll.) | R2 | D13 | ◐ semua dari salinan blog. Perlu naskah resmi D13 atau D08/D09 |
| Tidak memuat SARA, pornografi, politik praktis; sesuai Pancasila dan UUD 1945 | R1/R2 | D13 | |
| Kunci tidak boleh pilihan terpanjang | R2 | D13 ("panjang pilihan relatif sama") | aturan 1,5× = ukuran buatan aplikasi (R3) |
| Pilihan angka diurutkan | R2 | D13 | |
| Jawaban satu soal tidak tertulis di soal lain | R2 | D13 ("soal tidak bergantung pada soal lain") | |
| **Khilafiyah: rujuk semua mazhab, sebut pendapat siapa** | R3 | keputusan pemilik | Bisa diperkuat dengan kebijakan moderasi beragama Kemenag (dokumen belum dicek) |
| Pembahasan menyebut alasan kunci & tiap pengecoh | R3 | contoh try out TKA (bukan dokumen resmi) | |
| Pernyataan salah dibuat dengan mengubah satu konsep kunci | R3 | contoh try out TKA | |

### I. Bentuk soal
| Aturan | Di aplikasi | Tingkat | Dasar | Catatan |
|---|---|---|---|---|
| PG: 5 pilihan, 1 benar | `soal.ts` | R2 | D13, D09 | ◐ jenjang MA umumnya 5 pilihan, cek D09 |
| PG kompleks MCMA: 2 atau 3 benar, petunjuk "Pilih semua jawaban yang tepat" | `KUNCI_PGK` | R1/R3 | D12 (gaya TKA) | jumlah 2–3 = keputusan aplikasi |
| Kategori: 4 pernyataan, 5 pasang label | `LABEL_KATEGORI` | R1/R3 | D12 | 4 pernyataan & daftar label = keputusan aplikasi |
| Menjodohkan: 5 premis + 6 jawaban, satu-satu | `susunMenjodohkan` | R2 | D13 (jawaban lebih banyak dari premis) | |
| Isian: satu bagian kosong, kunci ≤ 5 kata | `periksaIsian` | R2/R3 | D13; batas kata = aplikasi | |
| Uraian: wajib batasan jawaban + rubrik | `buatSistem` | R2 | D13, D10 | |
| TKA hanya PG, PGK, Kategori; ada soal grup | `TKA` | R1 | D12 | ◐ |

### J. Stimulus dan nilai
| Aturan | Tingkat | Dasar | Catatan |
|---|---|---|---|
| Stimulus kontekstual, ragam bentuk, gambar dideskripsikan dengan kata | R2 | D13, D15 | |
| Satu skenario sekali per set, nama tokoh beragam, tokoh salah tidak memakai nama nabi/sahabat | R3 | keputusan pemilik | |
| Nilai Panca Cinta boleh disisipkan secara wajar | R1 | D11 | ◐ |

### K. Penskoran dan bobot
| Aturan | Di aplikasi | Tingkat | Dasar | Catatan |
|---|---|---|---|---|
| Bobot bawaan PG 2, PGK 5, Kategori 3, Uraian 8 (= 100 pada format AFTS) | `BOBOT_BAWAAN` | R3 | D18 | ✔ |
| Bobot Menjodohkan 5, Isian 3 | `BOBOT_BAWAAN` | **R4** | — | ditambahkan aplikasi, belum ada dasar |
| PGK & Kategori: semua benar = skor penuh, selain itu 0 | `terapkanBobot` | **R4** | — | ⚠️ Perlu dicek: TKA dan sebagian asesmen memakai skor sebagian. Cari di D09/D12 |
| Menjodohkan: skor per pasangan | | R3 | — | |
| Rubrik uraian: kriteria + skor sebagian, jumlah = bobot | `buatSistem` | R2 | D10, D13 | |
| Pengolahan nilai akhir (KKTP, konversi nilai) | tidak ada di aplikasi | — | D05, D08 | di luar cakupan aplikasi (dikerjakan di rapor) |

### L. Bahasa, ejaan, transliterasi
| Aturan | Di aplikasi | Tingkat | Dasar | Catatan |
|---|---|---|---|---|
| Bahasa Indonesia baku, istilah KBBI (salat, wudu, hadis, Allah Swt., Nabi Muhammad saw.) | `buatSistem` | R1/R2 | D16 | |
| **Transliterasi tanpa huruf bertitik/bergaris** ("hissi") kecuali Bahasa Arab | `buatSistem` | R3 | keputusan pemilik | ⚠️ **Berbeda dengan D17** (SKB 1987 memakai ḥ, ṣ, ā). Nama surah di aplikasi justru sudah gaya D17 ("An-Nūr"). Perlu keputusan: ikut D17 penuh, atau tetap tanpa tanda (tulis sebagai R3 beserta alasannya: lebih mudah dibaca siswa) |
| Mapel bahasa boleh ditulis dalam bahasanya | `buatSistem` | R2 | D13 | |

### M. Format dokumen Word
| Aturan | Tingkat | Dasar | Catatan |
|---|---|---|---|
| Kop lembar soal persis format AFTS madrasah | R3 | D18 | ✔ |
| Huruf Arab Word: Traditional Arabic 16 pt; web: Amiri; arah kanan-ke-kiri | R3 | permintaan pemilik, aturan keras no. 7 | |
| Kunci + pembahasan + rubrik terpisah dari lembar siswa | R3 | keputusan pemilik | |
| Peringatan AI di file guru, tidak di lembar siswa | R3 | keputusan pemilik, aturan keras no. 6 | |

### N. Paket A–D
| Aturan | Tingkat | Dasar | Catatan |
|---|---|---|---|
| Paket diacak per bagian bentuk, kunci ikut, padanan nomor di file kunci | R3 | keputusan pemilik | |

### O. Peran AI dan pengawasan guru
| Aturan | Tingkat | Dasar | Catatan |
|---|---|---|---|
| Peringatan "Soal dibuat AI, wajib diperiksa guru sebelum dipakai" | R3 → R1 | aturan keras no. 6; D20 (kendali manusia) | ◐ cocokkan dengan D20 |
| Prompt dan nama model disimpan di setiap hasil | R3 | CLAUDE.md | jejak audit |
| Catatan guru mengalahkan aturan gaya, kecuali 4 kunci | R3 | ATURAN-SOAL.md bagian 6 | |
| AI tidak dipakai sebagai pemeriksa ayat, hadis, atau rujukan apa pun | R3 | aturan keras no. 5 | ✔ |
| Pemeriksaan otomatis (penjaga ayat, kunci, pilihan) = kode aplikasi, bukan AI | R3 | — | ✔ |

### P. Data dan kerahasiaan
| Aturan | Tingkat | Dasar | Catatan |
|---|---|---|---|
| Data tiap guru terpisah | R1 + R3 | D19, aturan keras no. 3 | diuji `npm run uji:pemisahan` |
| Tidak menyimpan data siswa | R1 | D19 | ✔ (aplikasi memang tidak meminta data siswa) |
| Teks materi dikirim ke penyedia AI di luar negeri | **R4** | D19, D20 | ⚠️ Belum ada pernyataan tertulis untuk guru. Usul: satu kalimat di Panduan: "jangan menempel data pribadi siswa di materi" |

---

## 3. Celah yang perlu ditutup (urut kepentingan)

1. **TP dibuat AI** (bagian D). Paling bertentangan dengan prinsip "AI hanya alat". Usul: TP wajib dari guru (ATP/modul), AI hanya menyalin.
2. **Kesesuaian dengan CP resmi** belum dicek sama sekali (D). Perlu teks CP D06 (Qurdis fase F dulu).
3. **Kaidah penulisan soal hanya dari blog** (H, I). Perlu naskah resmi D08/D09/D13.
4. **Komposisi level dan jumlah soal bawaan** belum ada dasar (E, F). Cari di D08/D09; kalau tidak ada → diputuskan madrasah.
5. **Penskoran PGK & Kategori** semua-atau-nol belum ada dasar (K).
6. **Transliterasi** berbeda dengan SKB 1987 (L). Perlu keputusan pemilik.
7. **Sumber materi, kitab & derajat hadis, sumber terjemah** tidak tercatat (B, C, D).
8. **Mushaf Standar Indonesia** (A). Hanya perlu bila aplikasi dipakai di luar Al Fatah.
9. **Pernyataan data untuk guru** (P).

## 4. Dokumen yang perlu dicari pemilik
Salinan blog tidak bisa dipastikan sama dengan aslinya. Mohon dicari PDF resminya, misalnya dari JDIH Kemenag, laman
Ditjen Pendis, Kanwil/Kemenag kabupaten, KKM, atau MGMP:

- [ ] D06 Kepdirjen Pendis **9941/2025** (CP PAI & Bahasa Arab), atau 3302/2024 bila 9941 belum berlaku
- [ ] D08 **Panduan Pembelajaran dan Asesmen Madrasah 2025** (Direktorat KSKK)
- [ ] D09 **POS Asesmen Madrasah TP 2025/2026** beserta lampiran kisi-kisi
- [ ] D05 naskah **KMA 1503/2025**
- [ ] D13 **Panduan penulisan soal** Puspendik/Pusmendik (versi terbaru yang dipakai madrasah)
- [ ] D12 **Perka BSKAP 045/H/AN/2025** (Kerangka Asesmen TKA)
- [ ] D07 **CP mapel umum** terbaru (untuk mapel selain PAI & Bahasa Arab)
- [ ] Bila ada: **pedoman penilaian/penskoran** madrasah yang dipakai Al Fatah sekarang

Simpan PDF-nya di folder `dokumen/rujukan/`. Setelah itu saya baca dan cocokkan per baris peta ini, lalu status ◐ diganti ✔.

## 5. Langkah sesudahnya (diusulkan, belum dikerjakan)
1. Setiap kali aturan soal diubah: ubah ATURAN-SOAL.md, lalu **peta ini**, baru kode. Aturan baru tanpa baris di peta ini tidak boleh masuk.
2. Tutup celah no. 1 (TP dari guru) dan no. 7 (kolom sumber materi, kitab & derajat hadis).
3. Halaman "Dasar aturan" di Panduan untuk guru: ringkasan peta ini dengan bahasa sederhana.
4. Satu baris di Word kisi-kisi: "Disusun mengacu pada CP ... dan kaidah penulisan soal ...", setelah dokumennya ✔.
