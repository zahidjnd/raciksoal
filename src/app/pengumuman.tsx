"use client";

import { useEffect, useRef } from "react";

/**
 * Pengumuman pembaruan (0.48.1): muncul SEKALI per perangkat saat aplikasi dibuka/dimuat ulang, setelah ditutup tidak
 * muncul lagi. Pengumuman baru = ganti ID dan isinya; update kecil tanpa pengumuman = biarkan ID lama.
 * ponytail: tanda "sudah dibaca" di localStorage (per perangkat, HP & laptop masing-masing sekali); pindah ke DB bila perlu.
 */
const ID = "0.63.1";
const INGAT = "raciksoal-pengumuman";

function Isi() {
  return (
    <>
      <section className="space-y-1">
        <h3 className="font-semibold">Soal kini bisa bergambar: grafik, bagan, dan gambar pelajaran</h3>
        <p>
          Gambar ini <b>bukan foto atau ilustrasi buatan AI</b> seperti aplikasi pembuat gambar, melainkan gambar garis hitam-putih sederhana seperti di buku
          pelajaran, dan hanya tersedia untuk jenis-jenis di bawah ini. Aplikasi menggambarnya dari data yang ditulis AI atau guru. Gambar bebas (hewan,
          tumbuhan, tokoh, peta, alat praktikum, dan sebagainya) tetap memakai gambar dari materi atau diunggah sendiri lewat <b>Unggah gambar lain</b> saat Edit.
        </p>
        <p>Jenis yang tersedia:</p>
        <ul className="list-disc space-y-0.5 pl-5">
          <li>Data: grafik batang, garis, lingkaran, histogram, diagram pencar, piramida penduduk</li>
          <li>Urutan: garis waktu, diagram alir, siklus, bagan pohon</li>
          <li>Matematika: bidang koordinat, garis bilangan, bangun datar, sudut, bangun ruang</li>
          <li>Fisika, Kimia, Biologi: rangkaian listrik, cermin &amp; lensa, gaya, katrol, tuas, atom, jaring makanan</li>
          <li>Agama &amp; IPS: posisi shaf, ahli waris, arah kiblat, lapisan bumi/atmosfer, gerhana &amp; fase bulan, pelaku ekonomi</li>
        </ul>
        <p>
          Di file Word, grafik menjadi grafik Word asli dan gambar lainnya menjadi gambar. Ingin lebih banyak soal bergambar? Tulis di <b>Catatan untuk AI</b>,
          mis. “buat 3 soal dengan grafik”.
        </p>
      </section>
      <section className="space-y-1">
        <h3 className="font-semibold">Membuat atau mengubah gambar sendiri</h3>
        <p>
          Saat <b>Edit</b>, tekan <b>📊 Grafik &amp; gambar</b>, pilih kartunya (bisa dicari, mis. “segitiga” atau “waris”), lalu isi formulirnya; gambar langsung
          tampil di sebelahnya. Untuk mengubah gambar yang sudah ada, klik gambarnya di kotak <b>Pratinjau</b>. Data grafik bisa ditempel langsung dari Excel.
        </p>
      </section>
      <p className="text-pudar">Gambar dibuat dari angka yang diisi, jadi tetap periksa angka dan ukurannya. Soal yang dibuat AI tetap wajib diperiksa sebelum digunakan.</p>
    </>
  );
}

export function Pengumuman() {
  const jendela = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    let sudah = false;
    try {
      sudah = localStorage.getItem(INGAT) === ID;
    } catch {} // diblokir: tampilkan saja
    if (!sudah) jendela.current?.showModal();
  }, []);

  const tutup = () => {
    try {
      localStorage.setItem(INGAT, ID);
    } catch {} // diblokir: bisa muncul lagi, tidak berbahaya
    jendela.current?.close();
  };

  return (
    <dialog
      ref={jendela}
      aria-labelledby="judul-pengumuman"
      onClose={tutup} // Esc juga dihitung "sudah dibaca"
      className="m-auto max-h-[90dvh] overflow-y-auto w-[min(34rem,calc(100vw-2rem))] rounded-2xl border bg-kartu p-0 text-tinta shadow-xl backdrop:bg-black/50 max-md:mb-0 max-md:w-full max-md:max-w-none max-md:rounded-b-none"
    >
      <div className="space-y-4 p-5 text-sm leading-relaxed">
        <div>
          <p className="text-xs font-semibold tracking-wide text-hijau-teks uppercase">Pembaruan aplikasi</p>
          <h2 id="judul-pengumuman" className="text-xl">Pembaruan Versi {ID}</h2>
        </div>
        <Isi />
        <button autoFocus onClick={tutup} className="h-11 w-full rounded-lg bg-hijau text-base font-semibold text-white hover:bg-hijau-tua">
          Baik, saya mengerti
        </button>
      </div>
    </dialog>
  );
}
