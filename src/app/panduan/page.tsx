import { wajibMasuk } from "@/lib/sesi";
import { BATAS_PER_GURU } from "@/lib/pembatas";
import { Kerangka } from "../kepala";

/**
 * Panduan singkat guru (persiapan uji coba, CATATAN-VERSI). Sengaja satu halaman statis berbahasa sederhana;
 * nama tombol ditulis persis seperti di layar. Ubah di sini bila tampilan/tombol berganti nama.
 */
const LANGKAH: { judul: string; isi: React.ReactNode[] }[] = [
  {
    judul: "1. Membuat set soal",
    isi: [
      <>Klik <b>Set baru</b> di sidebar, lalu pilih <b>mata pelajaran</b> dan <b>kelas</b>.</>,
      <><b>Kop ujian</b> (semester, tahun, tanggal, waktu) sudah terisi otomatis. Ketuk barisnya bila ingin mengubah.</>,
      <>Masukkan <b>Materi</b>: tempel teks, atau klik <b>Lampirkan Word/PowerPoint/PDF</b>, lalu tekan <b>Analisa materi</b>. Materi yang pernah dipakai bisa dipilih lagi lewat <b>Pakai materi sebelumnya</b>.</>,
      <><b>PDF dibaca AI</b> halaman demi halaman, termasuk tabel, rumus, gambar, dan PDF hasil scan (muncul tulisan “AI membaca PDF: … halaman”). PDF lebih dari 20 halaman: pilih dulu halaman bab yang diperlukan (nomor halaman menurut file PDF, bukan nomor cetak buku), lalu tekan <b>Baca dengan AI</b>. Sebaiknya 10 halaman atau kurang, karena isi materi paling banyak ±30 ribu huruf. Batas: 100 halaman PDF per hari; sesudahnya PDF dibaca dengan cara biasa (tanpa tabel, rumus, dan gambar).</>,
      <>Periksa kartu materi hasil analisa: judul, tujuan pembelajaran (TP), dan kotak <b>Ayat &amp; hadis</b>. TP yang tertulis di materi Anda disalin apa adanya (kotak hijau). Kalau materi tidak memuat TP, AI mengusulkan TP (kotak kuning): baca, ubah bila perlu, lalu centang “Saya sudah membaca TP ini…” sebelum membuat soal. Ayat yang dikenali dari mushaf bertanda hijau. Teks Arab lain (mis. hadis) berwarna kuning: lengkapi sumbernya, periksa teksnya, lalu centang pernyataan pemeriksaan.</>,
      <><b>Soal bergambar</b> (mis. diagram sel, peta, grafik, rangkaian): saat <b>Analisa materi</b>, AI ikut melihat gambar di file Word/PowerPoint: gambar yang termasuk isi pelajaran (diagram, grafik, peta, foto percobaan) otomatis masuk ke bagian <b>Gambar</b> di kartu materi beserta keterangannya (paling banyak 10), sedangkan logo, kop, dan hiasan tidak dipakai (bisa dilihat dan tetap dipakai lewat <b>AI menilai … gambar bukan bagian materi</b> bila AI keliru). Bisa juga menempel gambar (<b>Ctrl+V</b>, mis. tangkapan layar dari PDF) di kotak materi atau di kartu materi, atau menekan <b>+ Tambah gambar</b>. Gambar yang ditempel selalu dipakai. Lepas gambar yang tidak perlu dengan <b>✕ Lepas dari materi</b>, dan betulkan keterangannya bila kurang tepat. AI melihat gambarnya dan memakai tiap gambar minimal untuk satu soal; ingin lebih banyak, tulis di <b>Catatan untuk AI</b> (mis. “buat 5 soal yang memakai gambar”). AI tidak bisa membuat gambar sendiri.</>,
      <>Pilih jenis soal (Ulangan Harian, AFTS, ASAS, Latihan, Latihan TKA). Bila perlu, tulis <b>Catatan untuk AI</b>, atur kesulitan, dan atur jumlah soal per bentuk lewat tombol <b>… soal</b>.</>,
      <><b>ASAS</b> langsung memakai format ASAS MA Al-Fatah sesuai mapel: <b>Eksak (35 soal)</b> untuk Matematika, Fisika, Kimia, Biologi, atau <b>Non-Eksak (45 soal)</b>. Jumlah tiap bentuk, level HOTS/MOTS/LOTS, dan skor (total 100) terisi otomatis. Menjodohkan + Benar/Salah total 5 nomor; untuk mencampur (mis. 3 menjodohkan + 2 benar/salah) ubah lewat tombol <b>… soal</b>.</>,
      <>Tekan <b>Buat soal</b>. Biasanya 1–3 menit. Kisi-kisi dan soal muncul bertahap. Halaman boleh ditinggal; set tersimpan di riwayat.</>,
    ],
  },
  {
    judul: "2. Memeriksa dan memperbaiki soal",
    isi: [
      <>Semua soal dibuat AI dan <b>wajib diperiksa guru sebelum dipakai</b>.</>,
      <>Soal berwarna <b>merah</b> berarti ditandai pemeriksa aplikasi (mis. teks Arab tidak cocok dengan data terverifikasi, atau menyebut gambar yang tidak ada); alasannya tertulis di atas soal. Periksa soal itu lebih dulu.</>,
      <>Tekan <b>Kunci &amp; pembahasan</b> untuk melihat jawaban, atau <b>Tampilkan semua kunci</b> sekaligus. <b>Kunci ringkas</b> menampilkan semua kunci dalam satu kotak (mis. “1. C 2. D …”); tekan <b>Salin</b> untuk menempelnya di WhatsApp atau catatan.</>,
      <><b>Edit</b>: ubah teks soal, pilihan, kunci, pembahasan, level, TP, atau skor, lalu <b>Simpan</b>. Muncul tulisan hijau “Tersimpan ✓”.</>,
      <><b>Lainnya</b>: <b>Ganti soal ini</b> (soal baru dari AI), <b>Ubah soal</b> (tulis permintaan, mis. “jadikan lebih sulit”), <b>Tambah soal serupa di bawahnya</b>, atau <b>Hapus soal ini</b>. Nomor menjodohkan memakai satu daftar jawaban bersama, jadi hanya bisa diperbaiki lewat <b>Edit</b> (daftar jawaban yang diedit ikut berubah di nomor menjodohkan lain). Ganti/ubah/tambah dibatasi 30 kali per set (jatah set ini tidak kembali) dan 60 kali per hari (kembali penuh setiap hari); sisanya terlihat di menu Lainnya. Edit dan tulis soal sendiri tidak dibatasi.</>,
      <>Punya soal sendiri? Tekan <b>+ Tulis soal … sendiri</b> di akhir tiap bagian (atau <b>Tulis soal bentuk lain</b> di paling bawah). Formulirnya sama dengan Edit; soal ini tanpa AI dan tidak memakai jatah, tetapi tetap diperiksa pemeriksa ayat.</>,
      <><b>Rumus</b>: saat Edit, letakkan kursor di tempat rumus, lalu tekan <b>Σ Rumus</b>. Di jendela yang muncul, susun rumusnya seperti di Word (ketik <b>/</b> untuk pecahan, <b>^</b> untuk pangkat, <b>_</b> untuk indeks; di HP muncul papan ketik rumus), lalu tekan <b>Masukkan</b>. Untuk mengubah rumus, klik rumus itu di kotak <b>Pratinjau rumus</b>. Di kotak teks, rumus tertulis sebagai kode di antara dua tanda <b>$</b> (mis. <b>$v = \frac{"{s}{t}"}$</b>); kode itu jangan dihapus sebagian. Di file Word, rumus menjadi rumus Word asli.</>,
      <><b>Gambar soal</b>: saat Edit, pilih <b>Tanpa gambar</b>, salah satu gambar materi, atau <b>Unggah gambar lain</b> (bisa juga tempel dengan Ctrl+V). Gambar tampil di bawah pertanyaan, juga di file Word. Soal yang menulis “perhatikan gambar” tetapi tidak ada gambarnya ditandai merah.</>,
      <>Tombol <b>↑</b> / <b>↓</b> di kanan bawah kartu memindah urutan soal di dalam bagiannya (mis. sesama Pilihan Ganda).</>,
      <>Tab <b>Kisi-kisi</b> menampilkan TP, indikator, dan level setiap nomor.</>,
    ],
  },
  {
    judul: "3. Mengunduh file",
    isi: [
      <>Tekan tombol hijau <b>Unduh</b> di bawah halaman hasil. Di jendela yang muncul: (1) pilih <b>Paket</b>, (2) centang <b>File</b> yang dibutuhkan (lembar soal siswa berkop madrasah, kunci &amp; pembahasan, kisi-kisi), lalu tekan <b>Unduh … file</b>. Daftar file yang akan diunduh tampil sebelum tombol ditekan. Bila browser bertanya “izinkan beberapa unduhan?”, pilih <b>Izinkan</b>.</>,
      <>Mau beberapa paket (mencegah contek)? Pilih lebih dari satu huruf paket, mis. <b>A</b> dan <b>B</b>. Paket A sama dengan urutan di layar; paket B, C, D berisi soal yang sama dengan urutan soal dan pilihan berbeda. Tiap paket punya lembar soal dan kuncinya sendiri; kisi-kisi cukup satu (urutan Paket A, padanan nomornya ada di lembar kunci). <b>Kunci ringkas</b> ikut menampilkan kunci paket yang dipilih.</>,
      <>File Word selalu mengikuti isi terbaru, termasuk soal yang sudah diedit.</>,
      <>Butuh PDF? Buka file Word-nya lalu simpan sebagai PDF (di HP lewat aplikasi Word atau Google Docs). Tautan <b>Cetak tampilan ini</b> di jendela Unduh hanya untuk cek cepat: tanpa kop madrasah.</>,
      <>Kop ujian bisa diubah setelah soal jadi lewat <b>Identitas ujian di kop Word</b> di bawah daftar soal, lalu unduh ulang.</>,
    ],
  },
  {
    judul: "4. Riwayat",
    isi: [
      <>Set yang pernah dibuat ada di sidebar bagian <b>Riwayat</b>. Set yang sedang dibuka bertanda latar lebih gelap.</>,
      <>Klik <b>Lihat &amp; cari semua riwayat</b> untuk mencari set berdasarkan nama atau materi, juga menyaring per jenis soal dan mapel.</>,
      <>Klik tombol <b>⋯</b> (atau klik kanan) pada riwayat untuk <b>Ganti nama</b> atau <b>Hapus</b>. Set yang dihapus tidak bisa dibuka lagi, dan jatah hari itu tidak kembali.</>,
    ],
  },
  {
    judul: "5. Materi saya",
    isi: [
      <>Materi bisa ditambah dengan dua cara: langsung di <b>Set baru</b> (tersimpan otomatis saat menekan <b>Buat soal</b>), atau lewat menu <b>Materi saya</b> → <b>+ Tambah materi</b> → <b>Analisa materi</b> → <b>Simpan materi</b>. Cara kedua cocok untuk menyiapkan beberapa bab sekaligus di awal semester.</>,
      <>Di <b>Materi saya</b>, materi dikelompokkan per mapel dan kelas. Tekan <b>Ubah</b> untuk membetulkan judul, TP, isi, atau ayat &amp; hadis; <b>Buat soal</b> untuk langsung membuat soal dari materi itu; <b>Hapus</b> untuk materi yang dobel. Set soal yang sudah dibuat tidak ikut berubah atau terhapus.</>,
      <>Di kotak <b>Ayat &amp; hadis</b>, ketik rujukan (mis. <b>QS An-Nur: 2</b>) lalu tekan <b>Ambil ayat</b>: teksnya diambil dari data mushaf. Hadis ditambah lewat <b>+ Tambah hadis</b>, lalu centang pernyataan pemeriksaan.</>,
      <>Tabel di file <b>Word/PowerPoint/PDF</b> ikut terbaca sebagai tabel (di kotak isi tampil sebagai baris <b>| sel | sel |</b>), jadi AI bisa membuat soal dari datanya.</>,
      <>Rumus yang dibuat dengan <b>Insert → Equation</b> di Word, dan rumus di PDF (dibaca AI), ikut terbaca (di kotak isi tampil sebagai <b>$...$</b>). Periksa rumus hasil bacaan PDF di kotak isi bila ada yang janggal.</>,
    ],
  },
  {
    judul: "6. Aturan penting",
    isi: [
      <>Ayat Al-Qur’an diambil dari data mushaf di aplikasi, bukan dikarang AI. Hadis hanya dari teks yang Anda tempel dan centang sendiri.</>,
      <>Dari file PDF, ayat dikenali lalu diganti teks resmi mushaf; lafal Arab di tabel (mis. mufradat) diganti ejaan mushaf dari ayat di halaman itu; teks Arab lain (termasuk hadis) dibuang. Tempel hadis langsung dari sumber terpercaya.</>,
      <>Jatah pembuatan: {BATAS_PER_GURU} set per hari. Set yang gagal tidak dihitung.</>,
    ],
  },
  {
    judul: "7. Kalau ada masalah",
    isi: [
      <>Muat ulang halaman (tarik ke bawah di HP, atau tekan F5 di laptop), lalu coba lagi.</>,
      <>Bila masih bermasalah, hubungi admin dan sebutkan nomor versi yang tertulis di bawah nama Anda di sidebar.</>,
      <>Lupa kata sandi: minta admin meresetnya. Salah kata sandi 5 kali membuat perangkat itu terkunci 15 menit; reset dari admin langsung membuka kuncinya. Kata sandi bisa diganti sendiri di halaman <b>Akun</b> (klik nama Anda di sidebar).</>,
    ],
  },
];

export default async function Panduan() {
  const p = await wajibMasuk();
  return (
    <Kerangka p={p}>
      <h1 className="text-2xl">Panduan singkat</h1>
      <p className="text-sm text-pudar">Cara memakai Racik Soal, dari memasukkan materi sampai mengunduh file Word.</p>
      {LANGKAH.map((l) => (
        <section key={l.judul} className="space-y-2 rounded-xl border bg-kartu p-4">
          <h2>{l.judul}</h2>
          <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
            {l.isi.map((x, i) => <li key={i}>{x}</li>)}
          </ul>
        </section>
      ))}
    </Kerangka>
  );
}
