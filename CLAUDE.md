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

## Status
- Langkah 1: bagian lokal selesai (tombol DB & AI jalan). Belum: deploy ke hosting.
