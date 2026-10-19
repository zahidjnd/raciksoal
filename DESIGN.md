# DESIGN.md: arah tampilan Racik Soal

Disusun 2026-10-19. Arah dipilih pemilik ("hijau sebagai aksen saja, tanpa emas, warnanya bersih");
rincian di bawah dirumuskan AI dari kop resmi madrasah (template Word AFTS) dan disetujui pemilik sebelum diterapkan.

## Identitas
- Apa: alat kerja guru Al-Qur'an Hadis MA Al-Fatah untuk menyusun soal, kunci, dan kisi-kisi.
- Untuk siapa: guru madrasah, sebagian besar bukan orang teknik, dipakai di laptop dan HP.
- Kesan: bersih, tenang, resmi. Isi soal dan ayat yang menjadi pusat perhatian, bukan hiasan.
- Dial: ENERGY 1 / RHYTHM 1 / MOTION 1 (alat kerja harian; tenang dan bisa ditebak).

## Warna
- Dasar netral: putih untuk isi, abu sangat muda (`gray-50`) untuk sidebar, garis abu tipis untuk batas.
- Satu aksen: **hijau Kemenag `#006316`** (diambil dari logo Kemenag di kop madrasah). Dipakai hanya untuk
  tombol utama, keadaan aktif/terpilih, fokus, dan tautan. Kontras putih di atas hijau ini 7,5:1.
  - Hijau tua (hover): `#004D11`
  - Hijau muda (latar terpilih/kunci jawaban): `#EAF4EC`
- **Tanpa emas atau kuning sebagai hiasan** (keputusan pemilik).
- Warna makna tetap ada dan tidak dihitung hiasan: merah = error/soal ditandai penjaga ayat;
  kuning-amber = kotak peringatan "Soal dibuat AI, wajib diperiksa guru" (aturan 6) dan peringatan admin.
- Tidak ada gradien, glow, atau bayangan besar.

## Huruf
- Latin: **Plus Jakarta Sans** (dibuat desainer Indonesia, jelas di layar kecil, gratis). Dimuat lewat `next/font`
  seperti Amiri, jadi tidak menambah library.
- Arab: **Amiri**, arah kanan ke kiri (aturan proyek 7). Di Word tetap Traditional Arabic 16 pt (keputusan 2026-10-14).

## Bentuk
- Tombol aksi (Buat soal, Simpan, Unduh, Edit, Ganti): kotak bersudut lembut 8px (`rounded-lg`).
- Tombol pilihan (Bab, Tujuan, Kesulitan, jumlah soal, tab): lonjong (`rounded-full`), supaya beda dengan aksi.
- Kartu: sudut 12px (`rounded-xl`); kotak ketik utama: 16px (`rounded-2xl`) dengan bayangan tipis, satu-satunya
  elemen berbayangan (pusat perhatian halaman Buat Soal).
- Ikon: tanpa emoji hiasan di tombol; cukup kata kerja yang jelas ("Unduh soal", "Edit"). Emoji hanya untuk
  peringatan (⚠️) karena maknanya langsung dipahami.

## Motif
- Garis hijau pendek (2px, lebar 32px) di bawah judul utama tiap halaman: satu-satunya tanda khas, tenang dan berulang.

## Tema
- Hanya mode terang. Alasan: guru menyiapkan dokumen untuk dicetak (Word berlatar putih), jadi layar yang mirip
  kertas memudahkan memeriksa hasil sebelum dicetak.

## Aset
- Logo Kemenag dan gambar kubah dari kop TIDAK dipasang di web tanpa izin tertulis pemilik. Nama "Racik Soal"
  ditulis sebagai teks.
