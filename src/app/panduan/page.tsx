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
      <>Periksa kartu materi hasil analisa: judul, tujuan pembelajaran (TP), dan kotak <b>Ayat &amp; hadis</b>. Ayat yang dikenali dari mushaf bertanda hijau. Teks Arab lain (mis. hadis) berwarna kuning: lengkapi sumbernya, periksa teksnya, lalu centang pernyataan pemeriksaan.</>,
      <>Pilih jenis soal (Ulangan Harian, AFTS, ASAS, Latihan, Latihan TKA). Bila perlu, tulis <b>Catatan untuk AI</b>, atur kesulitan, dan atur jumlah soal per bentuk lewat tombol <b>… soal ▾</b>.</>,
      <>Tekan <b>Buat soal</b>. Biasanya 1–3 menit. Kisi-kisi dan soal muncul bertahap. Halaman boleh ditinggal; set tersimpan di riwayat.</>,
    ],
  },
  {
    judul: "2. Memeriksa dan memperbaiki soal",
    isi: [
      <>Semua soal dibuat AI dan <b>wajib diperiksa guru sebelum dipakai</b>.</>,
      <>Nomor soal berwarna <b>merah</b> berarti ditandai pemeriksa ayat (teks Arab tidak cocok dengan data terverifikasi). Periksa soal itu lebih dulu.</>,
      <>Tekan <b>Kunci &amp; pembahasan</b> untuk melihat jawaban, atau <b>Tampilkan semua kunci</b> sekaligus. <b>Kunci ringkas</b> menampilkan semua kunci dalam satu kotak (mis. “1. C 2. D …”); tekan <b>Salin</b> untuk menempelnya di WhatsApp atau catatan.</>,
      <><b>Edit</b>: ubah teks soal, pilihan, kunci, pembahasan, level, TP, atau skor, lalu <b>Simpan</b>. Muncul tulisan hijau “Tersimpan ✓”.</>,
      <><b>Lainnya</b>: <b>Ganti soal ini</b> (soal baru dari AI), <b>Ubah soal</b> (tulis permintaan, mis. “jadikan lebih sulit”), <b>Tambah soal serupa di bawahnya</b>, atau <b>Hapus soal ini</b>. Ganti/ubah/tambah dibatasi 30 kali per set dan 60 kali per hari (Edit dan tulis soal sendiri tidak dibatasi).</>,
      <>Punya soal sendiri? Tekan <b>+ Tulis soal … sendiri</b> di akhir tiap bagian (atau <b>Tulis soal bentuk lain</b> di paling bawah). Formulirnya sama dengan Edit; soal ini tanpa AI dan tidak memakai jatah, tetapi tetap diperiksa pemeriksa ayat.</>,
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
    judul: "5. Aturan penting",
    isi: [
      <>Ayat Al-Qur’an diambil dari data mushaf di aplikasi, bukan dikarang AI. Hadis hanya dari teks yang Anda tempel dan centang sendiri.</>,
      <>Dari file PDF, teks Arab yang bukan ayat dibuang (teks Arab PDF sering rusak). Tempel hadis langsung dari sumber terpercaya.</>,
      <>Jatah pembuatan: {BATAS_PER_GURU} set per hari. Set yang gagal tidak dihitung.</>,
    ],
  },
  {
    judul: "6. Kalau ada masalah",
    isi: [
      <>Muat ulang halaman (tarik ke bawah di HP, atau tekan F5 di laptop), lalu coba lagi.</>,
      <>Bila masih bermasalah, hubungi admin dan sebutkan nomor versi yang tertulis di bawah nama Anda di sidebar.</>,
      <>Lupa kata sandi: minta admin meresetnya. Kata sandi bisa diganti sendiri di halaman <b>Akun</b> (klik nama Anda di sidebar).</>,
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
