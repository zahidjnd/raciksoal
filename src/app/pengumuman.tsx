"use client";

import { useEffect, useRef } from "react";

/**
 * Pengumuman pembaruan (0.48.1): muncul SEKALI per perangkat saat aplikasi dibuka/dimuat ulang, setelah ditutup tidak
 * muncul lagi. Pengumuman baru = ganti ID dan isinya; update kecil tanpa pengumuman = biarkan ID lama.
 * ponytail: tanda "sudah dibaca" di localStorage (per perangkat, HP & laptop masing-masing sekali); pindah ke DB bila perlu.
 */
const ID = "0.48.1";
const INGAT = "raciksoal-pengumuman";

function Isi() {
  return (
    <>
      <section className="space-y-1">
        <h3 className="font-semibold">Batas pemakaian dilonggarkan selama penyusunan soal ASAS</h3>
        <p>Untuk mendukung penyusunan soal ASAS, batas pemakaian harian dinaikkan hingga seluruh pembuatan soal ASAS selesai:</p>
        <ul className="list-disc space-y-0.5 pl-5">
          <li>Set soal: <b>50 per hari</b> (sebelumnya 10)</li>
          <li>Ganti/Ubah/Tambah soal: <b>500 per hari</b> (sebelumnya 60), <b>100 kali per set</b> (sebelumnya 30)</li>
          <li>Analisa materi: <b>300 per hari</b> (sebelumnya 30)</li>
          <li>Halaman PDF/foto dibaca AI: <b>1000 per hari</b> (sebelumnya 200)</li>
        </ul>
      </section>
      <section className="space-y-1">
        <h3 className="font-semibold">Fitur baru: Kirim masukan</h3>
        <p>Kendala, keluhan, atau saran kini dapat disampaikan langsung melalui menu <b>Kirim masukan</b> di menu samping (di bawah Panduan).</p>
      </section>
      <p className="text-pudar">Soal yang dibuat AI tetap wajib diperiksa sebelum digunakan.</p>
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
