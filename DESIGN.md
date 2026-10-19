# DESIGN.md: arah tampilan Racik Soal

Diperbarui 2026-10-19. Keputusan pemilik: **tata letak dan suasana meniru claude.ai** (latar krem, sapaan huruf serif,
sidebar ala Claude, tombol cepat di bawah kotak ketik), tetapi **aksennya hijau, bukan oranye**, dan **tanpa emas**.
Meniru produk lain biasanya dihindari (antislop R-30); di sini dipilih sendiri oleh pemilik, jadi diperbolehkan.
Yang TIDAK ditiru: logo bintang, nama "Claude", dan huruf khusus milik Anthropic (diganti padanan gratis).

## Identitas
- Apa: alat kerja guru Al-Qur'an Hadis MA Al-Fatah untuk menyusun soal, kunci, dan kisi-kisi.
- Untuk siapa: guru madrasah, sebagian besar bukan orang teknik, dipakai di laptop dan HP.
- Kesan: tenang, hangat, akrab seperti aplikasi asisten AI. Isi soal dan ayat tetap menjadi pusat perhatian.
- Dial: ENERGY 1 / RHYTHM 1 / MOTION 1 (alat kerja harian; tenang dan bisa ditebak).

## Warna
- Latar halaman krem `#FAF9F5`; sidebar krem lebih tua `#F4F3EE`; garis batas `#E6E4DC`; sorotan/hover sidebar `#E9E7DF`.
- Kotak ketik, kartu soal, dan kotak isian: putih, supaya isi terbaca jelas di atas latar krem.
- Teks utama `#1F1E1D`; teks pudar `#5F5E5A` (kontras di atas krem tetap di atas 4,5:1).
- Satu aksen: **hijau Kemenag `#006316`** (dari logo Kemenag di kop madrasah) untuk tombol utama, tanda "+" Set baru,
  lingkaran nama pengguna, keadaan terpilih, fokus, dan tautan. Putih di atas hijau ini 7,5:1.
  - Hijau tua (hover): `#004D11`
  - Hijau muda (latar terpilih/kunci jawaban): `#EAF4EC`
- **Tanpa emas, kuning, atau oranye sebagai hiasan** (keputusan pemilik).
- Warna makna tetap ada dan tidak dihitung hiasan: merah = error/soal ditandai penjaga ayat;
  kuning-amber = kotak peringatan "Soal dibuat AI, wajib diperiksa guru" (aturan 6) dan peringatan admin.
- Tidak ada gradien atau glow.

## Huruf
- Judul dan sapaan: **Source Serif 4** (serif gratis, padanan suasana judul claude.ai).
- Isi: **Plus Jakarta Sans** (dibuat desainer Indonesia, jelas di layar kecil).
- Keduanya dimuat lewat `next/font` seperti Amiri, jadi tidak menambah library.
- Arab: **Amiri**, arah kanan ke kiri (aturan proyek 7). Di Word tetap Traditional Arabic 16 pt (keputusan 2026-10-14).

## Bentuk
- Tombol dan pilihan: kotak bersudut lembut 8px (`rounded-lg`), seperti claude.ai.
- Dua ukuran saja: **kecil 32px** (`h-8`: pilihan di kotak ketik, tombol di kartu soal, tab, bilah unduh) dan
  **standar 40px** (`h-10`: tombol utama, kotak isian & pilihan, diatur di `globals.css`). Di HP semua minimal 44px.
- Satu warna garis tepi lembut `#DDDBD2` (`batas`) untuk kartu, tombol, dan kotak isian.
- Judul halaman serif 24px, subjudul bagian serif 18px, isi 14 sampai 16px.
- Daftar panjang (Riwayat, Semua Set): satu kartu putih berisi baris bergaris pemisah tipis, bukan kotak per baris.
- Kartu: sudut 12px (`rounded-xl`); kotak ketik utama: 16px (`rounded-2xl`) dengan bayangan tipis, satu-satunya
  elemen berbayangan (pusat perhatian halaman Buat Soal).
- Ikon: tanpa emoji hiasan; cukup kata kerja yang jelas. Emoji hanya untuk peringatan (⚠️).

## Tata letak
- Sidebar kiri: nama "Racik Soal" (serif), menu (Set baru, Materi saya, lalu menu admin), "Riwayat", dan di bawah
  lingkaran huruf awal nama + nama (menuju halaman Akun) + tombol Keluar. Di HP dilipat di balik ☰.
- Halaman Buat Soal: sapaan serif besar di tengah, kotak ketik putih, lalu tombol cepat (pengaturan siap pakai:
  Ulangan harian 25 soal, PAS 40 soal, Latihan cepat 10 PG, Pakai materi saya).
- Halaman hasil tetap "mode periksa" (deret nomor, kunci dilipat, bilah unduh), bukan bentuk obrolan.

## Tema
- Hanya mode terang. Alasan: guru menyiapkan dokumen untuk dicetak (Word berlatar putih), jadi layar terang memudahkan
  memeriksa hasil sebelum dicetak.

## Aset
- Logo Kemenag dan gambar kubah dari kop TIDAK dipasang di web tanpa izin tertulis pemilik. Nama "Racik Soal"
  ditulis sebagai teks.
