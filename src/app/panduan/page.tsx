import { wajibMasuk } from "@/lib/sesi";
import { BATAS_ANALISA, BATAS_HALAMAN_PDF, BATAS_PER_GURU, BATAS_UBAH_PER_GURU, MAKS_HALAMAN_PDF } from "@/lib/pembatas";
import { Kerangka } from "../kepala";
import { BukaLipatan } from "./buka-lipatan";
import { Panah } from "../panah";

/**
 * Panduan guru (0.32.0): "Mulai cepat" 4 langkah bergambar, topik lanjutan dalam lipatan, tanya-jawab.
 * Nama tombol ditulis persis seperti di layar. GAMBAR di public/panduan/*.webp = tangkapan layar HP (375 px) bertanda
 * merah bernomor: TAMPILAN/TOMBOL BERUBAH → ambil ulang gambarnya (cara: CLAUDE.md, bagian Panduan).
 */

function Gambar({ nama, alt, lebar, tinggi }: { nama: string; alt: string; lebar: number; tinggi: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={`/panduan/${nama}.webp`} alt={alt} width={lebar} height={tinggi} loading="lazy" className="h-auto w-full max-w-xs rounded-lg border" />
  );
}

const Tips = ({ children }: { children: React.ReactNode }) => (
  <p className="rounded-lg border border-hijau/30 bg-hijau-muda p-3 text-sm text-hijau-teks">
    <b>Tips:</b> {children}
  </p>
);
const Awas = ({ children }: { children: React.ReactNode }) => (
  <p className="rounded-lg border border-peringatan-garis bg-peringatan-muda p-3 text-sm text-peringatan">
    <b>Perhatian:</b> {children}
  </p>
);
/**
 * Nomor tanda merah di gambar: (1), (2), ... Warna SENGAJA tetap (bukan token bahaya, yang di mode gelap jadi merah muda):
 * harus sama dengan tanda di gambar (#d62828, scripts tandai di CLAUDE.md) dan kontras dengan angka putih.
 */
const N = ({ n }: { n: number }) => (
  <span className="mx-0.5 inline-flex size-5 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: "#d62828" }} aria-label={`tanda ${n}`}>
    {n}
  </span>
);

const LANGKAH: { judul: string; isi: React.ReactNode; gambar: React.ReactNode[] }[] = [
  {
    judul: "Pilih mapel, lalu masukkan materi",
    isi: (
      <>
        <p>Klik <b>Set baru</b>. Pilih <b>mata pelajaran</b> dan <b>kelas</b>&nbsp;<N n={1} />.</p>
        <p>Tempel teks materi, atau tekan <b>Lampirkan Word/PowerPoint/PDF</b>&nbsp;<N n={2} /> (di laptop, file juga bisa diseret ke kotak materi). Lalu tekan <b>Analisa materi</b>&nbsp;<N n={3} />.</p>
      </>
    ),
    gambar: [<Gambar key="1" nama="1-mapel-materi" alt="Pilihan mata pelajaran dan kelas, kotak materi, tombol Lampirkan dan Analisa materi" lebar={750} tinggi={800} />],
  },
  {
    judul: "Periksa kartu materi",
    isi: (
      <>
        <p>AI menyusun judul, <b>Tujuan Pembelajaran (TP)</b>, dan pokok materi. Baca sebentar, ubah bila perlu.</p>
        <p>TP <b>hijau</b> = disalin dari materi Anda. TP <b>kuning</b> = usulan AI: baca, lalu centang “Saya sudah membaca TP ini…”.</p>
      </>
    ),
    gambar: [<Gambar key="2" nama="2-kartu-materi" alt="Kartu materi hasil analisa dengan kotak TP hijau" lebar={469} tinggi={612} />],
  },
  {
    judul: "Pilih jenis ujian, lalu Buat soal",
    isi: (
      <>
        <p>Pilih jenis&nbsp;<N n={1} />: Ulangan Harian, AFTS, ASAS, Latihan, atau Latihan TKA. Jumlah soal bisa diubah&nbsp;<N n={2} />.</p>
        <p>Tekan <b>Buat soal</b>&nbsp;<N n={3} />. Biasanya 1–3 menit; soal muncul bertahap. Halaman boleh ditinggal, set tersimpan di riwayat.</p>
      </>
    ),
    gambar: [<Gambar key="3" nama="3-jenis-buat" alt="Kartu jenis ujian, tombol jumlah soal, dan tombol Buat soal" lebar={469} tinggi={868} />],
  },
  {
    judul: "Periksa soal, lalu Unduh",
    isi: (
      <>
        <p>Setiap soal punya tombol <b>Kunci &amp; pembahasan</b>&nbsp;<N n={1} />, <b>Edit</b>&nbsp;<N n={2} />, dan <b>Lainnya</b>&nbsp;<N n={3} />. Setelah semua diperiksa, tekan <b>Unduh</b>&nbsp;<N n={4} />.</p>
        <p>Di jendela Unduh: pilih paket&nbsp;<N n={1} />, centang file&nbsp;<N n={2} />, tekan <b>Unduh … file</b>&nbsp;<N n={3} />. Hasilnya file Word berkop madrasah.</p>
      </>
    ),
    gambar: [
      <Gambar key="4" nama="4-kartu-soal" alt="Kartu soal dengan tombol Kunci dan pembahasan, Edit, Lainnya, serta tombol Unduh" lebar={750} tinggi={1284} />,
      <Gambar key="5" nama="5-unduh" alt="Jendela Unduh: pilihan paket, centang file, tombol Unduh 3 file" lebar={469} tinggi={832} />,
    ],
  },
];

const TOPIK: { id: string; judul: string; isi: React.ReactNode }[] = [
  {
    id: "materi",
    judul: "Materi dari Word, PowerPoint, dan PDF",
    isi: (
      <>
        <ul>
          <li>Tabel di file ikut terbaca sebagai tabel (di kotak isi tampil sebagai baris <b>| sel | sel |</b>), jadi AI bisa membuat soal dari datanya.</li>
          <li>Rumus Word (<b>Insert → Equation</b>) ikut terbaca, tampil sebagai <b>$...$</b> di kotak isi.</li>
          <li><b>PDF dibaca AI</b> halaman demi halaman, termasuk tabel, rumus, gambar, dan PDF hasil scan. Muncul tulisan “AI membaca PDF: … halaman”.</li>
          <li>PDF lebih dari {MAKS_HALAMAN_PDF} halaman: pilih halaman bab yang diperlukan (nomor halaman file, bukan nomor cetak buku), lalu tekan <b>Baca dengan AI</b>. Makin banyak halaman makin lama dibaca (10 halaman ±1 menit).</li>
          <li>Materi yang pernah dipakai bisa dipilih lagi lewat <b>Pakai materi sebelumnya</b>.</li>
        </ul>
        <Tips>menyiapkan beberapa bab di awal semester? Pakai menu <b>Materi saya</b> → <b>+ Tambah materi</b> → <b>Analisa materi</b> → <b>Simpan materi</b>.</Tips>
      </>
    ),
  },
  {
    id: "dalil",
    judul: "Ayat dan hadis",
    isi: (
      <>
        <ul>
          <li>Ayat Al-Qur’an <b>diambil dari data mushaf</b> di aplikasi, tidak dikarang AI. Ayat yang dikenali bertanda hijau.</li>
          <li>Di kotak <b>Ayat &amp; hadis</b> pada kartu materi, ketik rujukan (mis. <b>QS An-Nur: 2</b>) lalu tekan <b>Ambil ayat</b>.</li>
          <li>Hadis: tekan <b>+ Tambah hadis</b>, tempel teks dari sumber terpercaya, isi sumbernya, lalu centang pernyataan pemeriksaan.</li>
          <li>Teks Arab pendek (≤ 3 kata) dianggap istilah. Teks Arab yang bukan dalil: tekan <b>Bukan ayat/hadis</b>.</li>
          <li>Dari PDF: ayat dikenali lalu diganti teks resmi mushaf; teks Arab lain (termasuk hadis) dibuang. Tempel hadisnya sendiri.</li>
        </ul>
      </>
    ),
  },
  {
    id: "merah",
    judul: "Arti soal berwarna merah",
    isi: (
      <>
        <p>Soal merah = ditandai pemeriksa aplikasi. Alasannya tertulis di atas soal. Periksa soal ini lebih dulu.</p>
        <Gambar nama="6-soal-merah" alt="Kartu soal berwarna merah dengan alasan di atasnya" lebar={750} tinggi={764} />
        <ul>
          <li><b>Teks Arab tidak cocok</b> dengan data terverifikasi: betulkan lewat <b>Edit</b> atau <b>Ganti</b>.</li>
          <li><b>Jawaban isian sudah tertulis di soal lain</b> (siswa bisa mencontek dari soal itu): tekan <b>Ganti</b>, atau ubah jawabannya. Materi yang sangat pendek kadang kehabisan bahan; kurangi jumlah isian.</li>
          <li><b>Menyebut gambar yang tidak ada</b>, <b>kunci tidak cocok dengan hitungan</b>, dan sejenisnya: alasannya selalu tertulis.</li>
        </ul>
        <Awas>soal yang tidak merah pun tetap wajib dibaca. Pemeriksa aplikasi tidak bisa menilai semua kesalahan isi.</Awas>
      </>
    ),
  },
  {
    id: "perbaiki",
    judul: "Memperbaiki soal: Edit, Ganti, Ubah, Tulis sendiri",
    isi: (
      <>
        <ul>
          <li><b>Edit</b>: ubah teks soal, pilihan, kunci, pembahasan, level, TP, atau skor, lalu <b>Simpan</b> (muncul “Tersimpan ✓”).</li>
          <li><b>Lainnya</b>: <b>Ganti soal ini</b>&nbsp;<N n={1} /> (soal baru dari AI), <b>Tambah soal serupa di bawahnya</b>&nbsp;<N n={2} />, atau tulis permintaan lalu <b>Ubah soal</b>&nbsp;<N n={3} /> (mis. “jadikan lebih sulit”).</li>
          <li>Ganti/Ubah/Tambah: {30} kali per set dan {BATAS_UBAH_PER_GURU} kali per hari. Edit tidak dibatasi.</li>
          <li><b>+ Tulis soal … sendiri</b> di akhir tiap bagian: tanpa AI, tidak memakai jatah, tetap diperiksa pemeriksa ayat.</li>
          <li>Tombol <b>↑</b> / <b>↓</b> memindah urutan soal di dalam bagiannya.</li>
          <li>Menjodohkan memakai satu daftar jawaban bersama, jadi hanya bisa diperbaiki lewat <b>Edit</b>.</li>
        </ul>
        <Gambar nama="7-lainnya" alt="Menu Lainnya: Ganti soal ini, Tambah soal serupa, Hapus soal ini, Ubah soal" lebar={469} tinggi={469} />
      </>
    ),
  },
  {
    id: "rumus-gambar",
    judul: "Rumus dan gambar di soal",
    isi: (
      <ul>
        <li><b>Rumus</b>: saat Edit, letakkan kursor, tekan <b>Σ Rumus</b>, susun rumusnya (ketik <b>/</b> untuk pecahan, <b>^</b> pangkat, <b>_</b> indeks), lalu <b>Masukkan</b>. Untuk mengubah, klik rumusnya di kotak <b>Pratinjau rumus</b>. Di file Word, rumus menjadi rumus Word asli.</li>
        <li>Di kotak teks, rumus tertulis sebagai kode di antara dua tanda <b>$</b>. Jangan hapus kode itu sebagian.</li>
        <li><b>Gambar dari materi</b>: saat Analisa, AI memilih gambar pelajaran (diagram, grafik, peta) dari file Word/PowerPoint/PDF; logo dan hiasan tidak dipakai. Bisa juga tempel gambar (<b>Ctrl+V</b>) atau <b>+ Tambah gambar</b>.</li>
        <li><b>Gambar per soal</b>: saat Edit, pilih <b>Tanpa gambar</b>, salah satu gambar materi, atau <b>Unggah gambar lain</b>.</li>
        <li>Ingin lebih banyak soal bergambar? Tulis di <b>Catatan untuk AI</b>, mis. “buat 5 soal yang memakai gambar”. AI tidak bisa membuat gambar sendiri.</li>
      </ul>
    ),
  },
  {
    id: "unduh",
    judul: "Paket A–D dan file Word",
    isi: (
      <ul>
        <li>Pilih lebih dari satu paket (mis. <b>A</b> dan <b>B</b>) untuk mencegah contek. Soalnya sama; urutan soal dan pilihan diacak. Soal bacaan tetap bersama teksnya.</li>
        <li>Tiap paket punya lembar soal dan kunci sendiri. Kisi-kisi cukup satu (urutan Paket A).</li>
        <li>File Word selalu mengikuti isi terbaru, termasuk soal yang sudah diedit.</li>
        <li>Kop ujian (semester, tanggal, waktu) bisa diubah lewat <b>Identitas ujian di kop Word</b> di bawah daftar soal, lalu unduh ulang.</li>
        <li><b>Kunci ringkas</b> menampilkan semua kunci (mis. “1. C 2. D …”); tekan <b>Salin</b> untuk ditempel di WhatsApp.</li>
        <li>Butuh PDF? Buka file Word-nya lalu simpan sebagai PDF.</li>
      </ul>
    ),
  },
  {
    id: "riwayat",
    judul: "Riwayat dan Materi saya",
    isi: (
      <ul>
        <li>Set yang pernah dibuat ada di sidebar bagian <b>Riwayat</b>. <b>Lihat &amp; cari semua riwayat</b> untuk mencari dan menyaring.</li>
        <li>Tombol <b>⋯</b> (atau klik kanan) pada riwayat: <b>Ganti nama</b> atau <b>Hapus</b>.</li>
        <li><b>Materi saya</b>: materi dikelompokkan per mapel dan kelas. <b>Ubah</b> untuk membetulkan, <b>Buat soal</b> untuk langsung membuat soal, <b>Hapus</b> untuk yang dobel. Set yang sudah jadi tidak ikut berubah.</li>
      </ul>
    ),
  },
  {
    id: "akun",
    judul: "Akun: nama, bawaan, kata sandi",
    isi: (
      <>
        <p>Klik nama Anda di sidebar → <b>Akun</b>. Halaman Akun punya tiga tab:</p>
        <ul>
          <li><b>Profil</b>: ganti nama tampil dan lihat <b>Pemakaian hari ini</b> (sisa jatah).</li>
          <li><b>Bawaan soal</b>&nbsp;<N n={1} />: <b>Mapel yang saya ajar</b> tampil paling atas di Set baru; yang pertama dicentang langsung terpilih&nbsp;<N n={2} />. Kelas, lama ujian, kesulitan, dan <b>Catatan tetap untuk AI</b> juga bisa diatur sekali, berlaku di HP maupun laptop.</li>
          <li><b>Keamanan</b>: ganti kata sandi (tekan ikon mata untuk melihat yang diketik) dan <b>Keluarkan perangkat lain</b> (mis. lupa keluar di komputer lab).</li>
        </ul>
        <Gambar nama="8-akun-bawaan" alt="Halaman Akun tab Bawaan soal dengan dua mapel dicentang" lebar={469} tinggi={619} />
      </>
    ),
  },
  {
    id: "jatah",
    judul: "Jatah harian",
    isi: (
      <ul>
        <li>{BATAS_PER_GURU} set soal per hari. Set yang gagal tidak dihitung; set yang dihapus tetap dihitung.</li>
        <li>Ganti/Ubah/Tambah soal {BATAS_UBAH_PER_GURU} kali, Analisa materi {BATAS_ANALISA} kali, halaman PDF dibaca AI {BATAS_HALAMAN_PDF} halaman.</li>
        <li>Semua jatah kembali penuh setiap pukul 00.00 WIB. Sisanya terlihat di halaman <b>Akun</b>.</li>
      </ul>
    ),
  },
];

const TANYA: { t: string; j: React.ReactNode }[] = [
  { t: "Kenapa ada soal berwarna merah?", j: <>Pemeriksa aplikasi menemukan masalah; alasannya tertulis di atas soal. Lihat <a href="#merah" className="underline">Arti soal berwarna merah</a>.</> },
  { t: "Kunci jawabannya salah. Bagaimana?", j: <>Tekan <b>Edit</b>, betulkan kuncinya, lalu <b>Simpan</b>. File Word ikut berubah. AI bisa salah, terutama soal hitungan.</> },
  { t: "Jatah hari ini habis.", j: <>Jatah kembali pukul 00.00 WIB. Sementara itu, <b>Edit</b> dan <b>Tulis soal sendiri</b> tetap bisa dipakai.</> },
  { t: "PDF saya tidak terbaca atau hasilnya kacau.", j: <>Pilih halaman bab saja (sebaiknya ≤ 10 halaman). Bila masih kacau, salin teksnya lalu tempel, atau simpan bab itu sebagai file Word.</> },
  { t: "Hadis saya berwarna kuning dan Buat soal terkunci.", j: <>Lengkapi <b>sumber</b> hadis, periksa teksnya, lalu centang pernyataan pemeriksaan di kotak <b>Ayat &amp; hadis</b>.</> },
  { t: "Bagaimana membuat Paket B untuk kelas sebelah?", j: <>Tekan <b>Unduh</b>, pilih huruf <b>A</b> dan <b>B</b>, lalu unduh. Soalnya sama, urutannya diacak.</> },
  { t: "Bisa membuat soal dari dua bab sekaligus?", j: <>Bisa: di kotak materi pilih beberapa materi (paling banyak 5) lewat <b>Pakai materi sebelumnya</b>, cocok untuk AFTS dan ASAS.</> },
  { t: "Lupa kata sandi atau akun terkunci.", j: <>Minta admin mereset kata sandi. Salah 5 kali membuat perangkat itu terkunci 15 menit; reset dari admin langsung membukanya.</> },
];

export default async function Panduan() {
  const p = await wajibMasuk();
  const kartu = "space-y-3 rounded-xl border bg-kartu p-4";
  return (
    <Kerangka p={p}>
      <BukaLipatan />
      <h1 className="text-2xl">Panduan</h1>
      <p className="text-sm text-pudar">Cara memakai Racik Soal, dari memasukkan materi sampai mengunduh file Word.</p>
      <Awas>soal dibuat AI dan <b>wajib diperiksa guru sebelum dipakai</b>.</Awas>

      <nav aria-label="Isi panduan" className="text-sm">
        <span className="text-pudar">Langsung ke: </span>
        <a href="#mulai" className="underline">Mulai cepat</a> · <a href="#topik" className="underline">Topik lain</a> · <a href="#tanya" className="underline">Tanya-jawab</a> · <a href="#masalah" className="underline">Kalau ada masalah</a>
      </nav>

      <section id="mulai" className="scroll-mt-16 space-y-4">
        <h2 className="text-xl">Mulai cepat: 4 langkah</h2>
        {LANGKAH.map((l, i) => (
          <article key={l.judul} className={kartu}>
            <h3 className="flex items-center gap-2 font-semibold">
              <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-hijau text-sm text-white">{i + 1}</span>
              {l.judul}
            </h3>
            <div className="space-y-1.5 text-sm leading-relaxed">{l.isi}</div>
            <div className="flex flex-wrap gap-3">{l.gambar}</div>
          </article>
        ))}
      </section>

      <section id="topik" className="scroll-mt-16 space-y-2">
        <h2 className="text-xl">Topik lain</h2>
        <p className="text-sm text-pudar">Ketuk judul untuk membuka.</p>
        {TOPIK.map((t) => (
          <details key={t.id} id={t.id} className="group scroll-mt-16 rounded-xl border bg-kartu">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-4 py-2 font-semibold">
              {t.judul}
              <Panah kelas="group-open:rotate-180 motion-reduce:transition-none" />
            </summary>
            <div className="space-y-3 px-4 pb-4 text-sm leading-relaxed [&_li]:mt-1 [&_ul]:list-disc [&_ul]:pl-5">{t.isi}</div>
          </details>
        ))}
      </section>

      <section id="tanya" className="scroll-mt-16 space-y-2">
        <h2 className="text-xl">Tanya-jawab</h2>
        {TANYA.map((q) => (
          <details key={q.t} className="group rounded-xl border bg-kartu">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 px-4 py-2">
              {q.t}
              <Panah kelas="group-open:rotate-180 motion-reduce:transition-none" />
            </summary>
            <p className="px-4 pb-4 text-sm leading-relaxed">{q.j}</p>
          </details>
        ))}
      </section>

      <section id="masalah" className={`${kartu} scroll-mt-16`}>
        <h2 className="text-xl">Kalau ada masalah</h2>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed">
          <li>Muat ulang halaman (tarik ke bawah di HP, atau tekan F5 di laptop), lalu coba lagi.</li>
          <li>Set gagal dibuat? Coba lagi beberapa saat; set yang gagal tidak memakai jatah.</li>
          <li>Masih bermasalah: hubungi admin dan sebutkan nomor versi yang tertulis di bawah nama Anda di sidebar.</li>
        </ol>
      </section>
    </Kerangka>
  );
}
