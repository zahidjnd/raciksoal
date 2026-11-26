"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Ajakan memasang Racik Soal sebagai aplikasi (1.5.0). Hanya di halaman awal "/", hanya HP/tablet (layar sentuh utama),
 * tidak muncul bila sudah dibuka dari ikon layar utama. Android/Chrome: tombol Pasang memanggil dialog bawaan Chrome
 * (Chrome tidak mengirim sinyalnya bila sudah terpasang). iPhone/iPad: hanya petunjuk (Safari tidak punya tombol pasang).
 * Ditutup = muncul lagi 14 hari kemudian. Menunggu pengumuman pembaruan ditutup dulu (tidak dua jendela sekaligus).
 * ponytail: ingatan di localStorage per perangkat; Android tanpa service worker, tambahkan sw.js kosong bila Chrome tidak mengirim sinyal pasang.
 */
const INGAT = "raciksoal-pasang";
const JEDA_MS = 14 * 24 * 3600 * 1000;

type SinyalPasang = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function tertunda(): boolean {
  try {
    return Date.now() < Number(localStorage.getItem(INGAT) ?? 0);
  } catch {
    return false; // diblokir: tampilkan saja
  }
}

function tunda(ms: number) {
  try {
    localStorage.setItem(INGAT, String(Date.now() + ms));
  } catch {} // diblokir: bisa muncul lagi, tidak berbahaya
}

export function PasangAplikasi() {
  const jendela = useRef<HTMLDialogElement>(null);
  const sinyal = useRef<SinyalPasang | null>(null);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    const standalone =
      matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone || !matchMedia("(pointer: coarse)").matches || tertunda()) return;

    const tampil = () => {
      if (!document.querySelector("dialog[open]")) return jendela.current?.showModal();
      const tunggu = () => {
        document.removeEventListener("close", tunggu, true);
        jendela.current?.showModal();
      };
      document.addEventListener("close", tunggu, true); // "close" tidak menggelembung: pakai fase tangkap
    };

    const dipasang = () => tunda(365 * 24 * 3600 * 1000);
    window.addEventListener("appinstalled", dipasang);

    const adaIos = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (adaIos) {
      setIos(true);
      tampil();
      return () => window.removeEventListener("appinstalled", dipasang);
    }

    const tangkap = (e: Event) => {
      e.preventDefault();
      sinyal.current = e as SinyalPasang;
      tampil();
    };
    window.addEventListener("beforeinstallprompt", tangkap);
    return () => {
      window.removeEventListener("beforeinstallprompt", tangkap);
      window.removeEventListener("appinstalled", dipasang);
    };
  }, []);

  const nanti = () => {
    tunda(JEDA_MS);
    jendela.current?.close();
  };

  const pasang = async () => {
    jendela.current?.close();
    const s = sinyal.current;
    if (!s) return;
    await s.prompt();
    const { outcome } = await s.userChoice;
    tunda(outcome === "accepted" ? 365 * 24 * 3600 * 1000 : JEDA_MS);
  };

  return (
    <dialog
      ref={jendela}
      aria-labelledby="judul-pasang"
      onClose={() => tunda(JEDA_MS)} // Esc / tutup lewat cara lain juga dihitung "nanti"
      className="m-auto max-h-[90dvh] overflow-y-auto w-[min(26rem,calc(100vw-2rem))] rounded-2xl border bg-kartu p-0 text-tinta shadow-xl backdrop:bg-black/50 max-md:mb-0 max-md:w-full max-md:max-w-none max-md:rounded-b-none"
    >
      <div className="space-y-4 p-5 text-sm leading-relaxed">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ikon/ikon-192.png" alt="" width={48} height={48} className="size-12 rounded-xl" />
          <h2 id="judul-pasang" className="text-xl">Pasang Racik Soal di layar utama</h2>
        </div>
        <p>Buka lebih cepat dari ikon di HP, tampil layar penuh seperti aplikasi biasa, tanpa perlu mengetik alamat web.</p>
        {ios && (
          <ol className="list-decimal space-y-0.5 pl-5">
            <li>Ketuk tombol <b>Bagikan</b> (kotak dengan panah ke atas) di Safari.</li>
            <li>Pilih <b>Tambah ke Layar Utama</b>.</li>
            <li>Ketuk <b>Tambah</b>.</li>
          </ol>
        )}
        <div className="flex gap-2">
          <button onClick={nanti} className="h-11 flex-1 rounded-lg border text-base hover:bg-krem-sorot">
            {ios ? "Tutup" : "Nanti saja"}
          </button>
          {!ios && (
            <button autoFocus onClick={pasang} className="h-11 flex-1 rounded-lg bg-hijau text-base font-semibold text-white hover:bg-hijau-tua">
              Pasang
            </button>
          )}
        </div>
      </div>
    </dialog>
  );
}
