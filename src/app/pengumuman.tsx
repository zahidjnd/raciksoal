"use client";

import { useEffect, useRef } from "react";

/**
 * Pengumuman pembaruan (0.48.1): muncul SEKALI per perangkat saat aplikasi dibuka/dimuat ulang, setelah ditutup tidak
 * muncul lagi. Sejak 1.4.2 hanya dipasang di halaman awal "/" (selalu tampil pertama setelah login). Pengumuman baru = ganti ID dan isinya; update kecil tanpa pengumuman = biarkan ID lama.
 * ponytail: tanda "sudah dibaca" di localStorage (per perangkat, HP & laptop masing-masing sekali); pindah ke DB bila perlu.
 */
const ID = "1.4.2";
const INGAT = "raciksoal-pengumuman";

function Isi() {
  return (
    <>
      <section className="space-y-1">
        <h3 className="font-semibold">Baru: Koreksi LJK, nilai ujian langsung dari foto LJK</h3>
        <p>
          Racik Soal kini punya aplikasi kedua untuk mengoreksi Lembar Jawab ASAS madrasah. Buka lewat kartu <b>Koreksi LJK</b> di halaman ini, atau
          tombol pindah aplikasi di menu samping.
        </p>
        <ol className="list-decimal space-y-0.5 pl-5">
          <li><b>Buat ujian</b>: pilih kelas, lalu ambil kunci dari set Racik Soal atau ketik sendiri.</li>
          <li>
            <b>Pindai</b>: di HP arahkan kamera ke LJK, aplikasi memotret otomatis. Di laptop pilih file foto LJK. Banyak foto sekaligus bisa lewat{" "}
            <b>Unggah banyak foto</b>.
          </li>
          <li><b>Periksa</b>: nomor <b>kuning</b> artinya ragu (samar, dua jawaban, bekas hapusan). Pastikan sendiri.</li>
          <li><b>Isi nilai esai</b>, lalu <b>Unduh Excel</b>: nilai, jawaban, dan analisis butir soal.</li>
        </ol>
        <p>
          <b>Izinkan kamera sekali saja.</b> Saat Chrome bertanya, pilih <b>Izinkan saat mengunjungi situs</b>.
        </p>
      </section>
      <p className="text-pudar">Foto LJK tidak disimpan. LJK dibaca di HP/laptop Bapak/Ibu sendiri, tanpa AI. Cara lengkapnya ada di menu Panduan.</p>
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
