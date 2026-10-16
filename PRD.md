# PRD: Web Pembuatan Soal AI (Kurikulum Kemenag)

## 1. Tujuan
Membantu guru madrasah membuat soal yang sesuai standar Kemenag dengan cepat:
soal + kunci jawaban + pembahasan + kisi-kisi, tanpa guru menulis instruksi AI yang panjang.
Standar penulisan soal sudah tertanam di sistem, sehingga hasilnya konsisten.

## 2. Pengguna dan tahapan
1. **Tahap 1 (sekarang):** pemilik sendiri, mapel Qurdis kelas 11 MA.
2. **Tahap 2:** 15-20 guru di Al Fatah, mapel berbeda-beda.

Web ini untuk internal Al Fatah, tidak untuk dijual.

## 3. Ruang lingkup MVP (Tahap 1)
Hanya **Al-Qur'an Hadis kelas 11 MA**, satu atau dua bab.

### Termasuk
- Form pembuatan soal
- Pembuatan soal oleh AI dari materi yang disediakan
- Hasil: soal, kunci jawaban, pembahasan
- Edit soal oleh guru
- Ekspor ke Word
- Peringatan wajib review guru

### Sengaja ditunda
- Banyak mapel dan banyak jenjang
- Login banyak guru dan bank soal (Tahap 2)
- Kisi-kisi otomatis dan kartu soal (setelah inti jalan)
- Database buku dan pencarian otomatis (RAG)
- Pembayaran dan langganan (Tahap 3)

## 4. Alur guru
1. Pilih mapel, kelas, bab/materi.
2. Pilih tujuan soal: ulangan harian, PTS, PAS, atau latihan.
3. Pilih bentuk soal dan jumlahnya (awal: pilihan ganda dan uraian).
4. Atur komposisi level kognitif (C1-C6 atau LOTS/MOTS/HOTS) dan tingkat kesulitan.
5. Tekan **Buat Soal**, lalu tunggu (ada indikator proses).
6. Periksa hasil: edit soal, ganti satu soal saja, atau minta variasi.
7. Ekspor ke Word.

## 5. Sumber materi
- Guru memberikan **teks materi bab** (tempel atau unggah). AI membuat soal **hanya dari teks itu**.
- **Ayat dan hadis** diambil dari teks terverifikasi yang disiapkan pemilik, tidak dikarang AI.
- Data pendukung: CP dan TP Qurdis kelas 11 dalam bentuk tabel (fase, elemen, TP, indikator).
- Contoh 5-10 soal berkualitas sebagai acuan gaya.

## 6. Aturan kualitas soal (ditanamkan ke instruksi AI)
- Pokok soal jelas dan tidak ambigu.
- Pengecoh masuk akal dan homogen.
- Panjang pilihan jawaban relatif seimbang.
- Tidak ada petunjuk jawaban tersembunyi.
- Hindari "semua benar/semua salah" secara berlebihan.
- Kunci jawaban tersebar merata.
- Soal tidak saling mirip.
- Uraian dilengkapi rubrik skor.

## 7. Format hasil dari AI
Hasil berupa data terstruktur (JSON), tiap butir soal berisi: nomor, tipe, teks soal, pilihan (jika ada), kunci, pembahasan, level kognitif, TP terkait, dan skor.

## 8. Data yang disimpan
- Daftar CP/TP dan materi bab
- Teks ayat dan hadis terverifikasi
- Hasil soal (riwayat), termasuk prompt dan nama model yang dipakai
- Akun guru (mulai Tahap 2)

## 9. Persyaratan non-fungsional
- Mudah dipakai guru yang tidak terbiasa teknologi, nyaman dibuka di HP maupun laptop.
- Teks Arab terbaca jelas (font Arab, arah kanan ke kiri).
- Model AI dapat diganti lewat pengaturan tanpa mengubah kode inti.
- Biaya API terkendali: batas pembuatan per guru per hari, batas pengeluaran di akun API.
- Data tiap guru terpisah dan aman.
- Backup database harian.

## 10. Ukuran keberhasilan Tahap 1
- Soal yang dihasilkan bisa dipakai dengan perbaikan minimal.
- Ayat dan hadis pada soal 100% sesuai teks terverifikasi.
- Waktu membuat satu set soal jauh lebih singkat daripada menulis manual.
- Sudah terbukti model AI mana yang paling baik untuk Qurdis lewat uji perbandingan.

## 11. Risiko
- Kesalahan konten keislaman (ayat, hadis, perawi, harakat) pada hasil AI. Mitigasi: teks terverifikasi dan review guru wajib.
- Kualitas pengecoh dan konsistensi pada soal banyak. Mitigasi: contoh soal bagus dan uji beberapa model.
- Batas hosting (RAM 1 GB, 12 proses serentak). Mitigasi: batasi pemakaian serentak.

## 12. Pertanyaan terbuka
- Model AI mana yang dipilih sebagai default (diputuskan setelah uji perbandingan)?
- Bab Qurdis kelas 11 mana yang dijadikan bahan pertama?
- Format kop dan layout Word yang dipakai di madrasah?
