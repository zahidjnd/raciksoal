// Isi Panduan Koreksi LJK (1.4.0). Nama tombol ditulis persis seperti di layar; tampilan/tombol berubah → perbarui di sini.
// Belum bergambar (berbeda dengan Panduan Racik Soal).
import type { ReactNode } from "react";

type Langkah = { judul: string; isi: ReactNode };
type Topik = { id: string; judul: string; isi: ReactNode };
type Tanya = { t: string; j: ReactNode };

export const LANGKAH_LJK: Langkah[] = [
  {
    judul: "Buat ujian",
    isi: (
      <>
        <p>
          Ketuk <b>+ Ujian baru</b>. Isi <b>Nama ujian</b> dan pilih <b>Kelas</b>. Untuk kunci jawaban ada dua cara:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <b>Dari Racik Soal</b>: pilih set soal Anda. Kunci Paket A dan skor tiap nomor diambil otomatis; isian dan uraian
            menjadi nilai esai.
          </li>
          <li>
            <b>Isi sendiri</b>: ketuk <b>Non-eksak (45 soal)</b> atau <b>Eksak (35 soal)</b>, lalu ketuk huruf kunci tiap nomor.
            PG kompleks boleh lebih dari satu huruf. Bila total skor bukan 100, muncul peringatan kuning.
          </li>
        </ul>
        <p>
          Tekan <b>Buat ujian</b>.
        </p>
      </>
    ),
  },
  {
    judul: "Pindai LJK",
    isi: (
      <>
        <p>
          Ambil satu LJK dari tumpukan, ketik sebagian nama yang tertulis di LJK pada kotak <b>Cari nama di LJK…</b>, lalu ketuk
          namanya.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <b>Di HP</b>: kamera terbuka. Arahkan ke <b>bagian atas LJK</b> sampai 4 kotak hitam di pojok ditandai hijau, lalu
            tahan sebentar: HP memotret sendiri.
          </li>
          <li>
            <b>Di laptop</b>: pilih file foto LJK siswa itu.
          </li>
        </ul>
      </>
    ),
  },
  {
    judul: "Periksa hasilnya, lalu Simpan",
    isi: (
      <>
        <p>Angka besar = jumlah jawaban benar. Kotak nomor:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <b>hijau</b> benar, <b>merah</b> salah, hijau bergaris dengan ½ = PG kompleks benar sebagian;
          </li>
          <li>
            <b>kuning</b> = aplikasi ragu (bulatan samar, dua jawaban, bekas hapusan). Ketuk nomornya, lalu pilih huruf yang
            benar atau <b>Kosong</b>.
          </li>
        </ul>
        <p>
          Cocokkan potongan tulisan nama di atas dengan <b>LJK milik</b>, lalu tekan <b>Simpan</b>.
        </p>
      </>
    ),
  },
  {
    judul: "Isi nilai esai dan unduh Excel",
    isi: (
      <>
        <p>
          Ketik nilai esai di kolom <b>Esai</b>, tekan Enter: tersimpan otomatis dan kolom <b>Nilai</b> terisi sendiri.
        </p>
        <p>
          Tekan <b>Unduh Excel</b> untuk file berisi lembar <b>Nilai</b>, <b>Jawaban</b> tiap siswa, dan <b>Analisis butir</b>.
        </p>
      </>
    ),
  },
];

export const TOPIK_LJK: Topik[] = [
  {
    id: "izin-kamera",
    judul: "Izin kamera (pertama kali di HP)",
    isi: (
      <>
        <p>
          Di halaman Koreksi LJK muncul kotak kuning <b>Izinkan kamera sekali saja</b>. Ketuk <b>Izinkan kamera</b>, lalu pilih{" "}
          <b>Izinkan saat mengunjungi situs</b> (bukan &ldquo;Izinkan kali ini&rdquo;). Setelah itu kamera tidak ditanya lagi.
        </p>
        <p>Bila kamera terlanjur diblokir:</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            Ketuk <b>⋮</b> (titik tiga) di pojok kanan atas Chrome.
          </li>
          <li>
            Pilih <b>Kontrol situs</b>.
          </li>
          <li>
            Pilih <b>Izin</b> → <b>Kamera</b> → <b>Izinkan</b>, lalu muat ulang halaman.
          </li>
        </ol>
      </>
    ),
  },
  {
    id: "tips-foto",
    judul: "Tips memotret supaya terbaca",
    isi: (
      <ul>
        <li>Cahaya terang dan merata; jangan sampai bayangan tangan atau HP menutupi bulatan.</li>
        <li>Seluruh bagian atas LJK masuk layar, termasuk 4 kotak hitam di pojoknya.</li>
        <li>LJK miring atau terbalik tidak masalah; aplikasi meluruskannya sendiri.</li>
        <li>Kertas jangan terlipat di bagian bulatan.</li>
        <li>Untuk siswa: hitamkan bulatan sampai penuh dengan pensil 2B; bila ganti jawaban, hapus bersih jawaban lama.</li>
      </ul>
    ),
  },
  {
    id: "banyak-foto",
    judul: "Unggah banyak foto sekaligus",
    isi: (
      <>
        <p>
          Cocok untuk foto yang sudah ada (galeri, kiriman WA, hasil scan). Di halaman ujian tekan <b>Unggah banyak foto</b>,
          pilih semua fotonya.
        </p>
        <ul>
          <li>
            Foto dibaca satu per satu. Pilih nama di <b>LJK milik</b> sesuai potongan tulisan nama, lalu{" "}
            <b>Simpan &amp; berikutnya</b>.
          </li>
          <li>
            <b>Lewati</b> = foto itu tidak disimpan; <b>Berhenti</b> = selesai sekarang.
          </li>
          <li>Di akhir muncul ringkasan, termasuk nama file foto yang tidak terbaca supaya bisa difoto ulang.</li>
        </ul>
      </>
    ),
  },
  {
    id: "betulkan",
    judul: "Membetulkan lembar yang sudah disimpan",
    isi: (
      <p>
        Ketuk nama siswa yang sudah dipindai: lembarnya terbuka. Ketuk nomor yang salah, pilih huruf yang benar, lalu{" "}
        <b>Simpan</b>. Atau tekan <b>Pindai ulang</b> untuk memotret LJK-nya lagi.
      </p>
    ),
  },
  {
    id: "ubah-kunci",
    judul: "Salah kunci jawaban",
    isi: (
      <p>
        Tekan <b>Ubah kunci</b> di halaman ujian, ketuk huruf yang benar (nomor yang diubah ditandai kuning), lalu <b>Simpan</b>.
        Nilai semua siswa yang sudah dipindai dihitung ulang otomatis; LJK tidak perlu dipindai lagi.
      </p>
    ),
  },
  {
    id: "analisis",
    judul: "Membaca analisis butir soal",
    isi: (
      <>
        <p>
          Buka lipatan <b>Analisis butir soal</b> di bawah daftar siswa:
        </p>
        <ul>
          <li>
            <b>% benar</b>: Mudah ≥ 70%, Sedang 30–70%, Sukar &lt; 30%.
          </li>
          <li>
            <b>Daya beda</b> (muncul setelah minimal 10 lembar): seberapa baik soal membedakan siswa bernilai tinggi dan rendah.
            Baik / Cukup / Perlu diperbaiki / Dibuang.
          </li>
          <li>
            Kotak A–E menunjukkan berapa siswa memilih tiap huruf: <b>hijau</b> = kunci, <b>kuning</b> = pengecoh yang hampir
            tidak dipilih (kurang dari 5% siswa), sebaiknya diganti bila soal dipakai lagi.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "nilai",
    judul: "Cara nilai dihitung",
    isi: (
      <ul>
        <li>PG, Benar/Salah, dan menjodohkan: satu jawaban tepat = skor penuh; kosong atau dua jawaban = 0.</li>
        <li>
          PG kompleks: tiap kunci yang dihitamkan dapat bagiannya (2 kunci, benar satu = setengah skor). Menghitamkan lebih
          banyak bulatan daripada jumlah kunci mengurangi nilai.
        </li>
        <li>Nilai akhir = skor pilihan + nilai esai.</li>
      </ul>
    ),
  },
  {
    id: "kelola-ujian",
    judul: "Ganti nama atau hapus ujian",
    isi: (
      <p>
        Di sidebar, arahkan kursor ke nama ujian (di HP langsung terlihat) lalu ketuk <b>⋯</b>: pilih <b>Ganti nama</b> atau{" "}
        <b>Hapus</b>.
      </p>
    ),
  },
];

export const TANYA_LJK: Tanya[] = [
  {
    t: "Muncul pesan \"LJK belum terbaca\".",
    j: (
      <>
        Empat kotak hitam di pojok LJK tidak terlihat jelas. Foto ulang dari atas dengan cahaya lebih terang dan pastikan seluruh
        bagian atas LJK masuk layar.
      </>
    ),
  },
  { t: "Kelas atau nama siswa tidak ada di daftar.", j: <>Daftar siswa diisi admin. Hubungi admin untuk menambah kelas atau siswa.</> },
  { t: "Apakah foto LJK disimpan?", j: <>Tidak. Yang disimpan hanya jawaban per nomor dan potongan kecil tulisan nama.</> },
  { t: "Soal di Racik Soal memakai Paket B atau C.", j: <>Koreksi LJK memakai urutan Paket A: nomor di LJK = nomor soal Paket A.</> },
  {
    t: "Kamera tidak menyala.",
    j: (
      <>
        Periksa izin kamera (lihat <a href="#izin-kamera" className="underline">Izin kamera</a>). Sementara itu, ketuk{" "}
        <b>Pilih foto dari galeri</b> di layar kamera atau pakai <b>Unggah banyak foto</b>.
      </>
    ),
  },
];
