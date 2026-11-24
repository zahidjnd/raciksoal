"use client";

import { pesanSegera, type Aplikasi } from "@/lib/aplikasi";
import { beriTahu } from "./tanya";

/** Ikon aplikasi (jalur dari APLIKASI). Dipakai kartu halaman awal & tombol pindah aplikasi. */
export function IkonAplikasi({ jalur, className = "h-5 w-5" }: { jalur: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={jalur} />
    </svg>
  );
}

const KELAS_KARTU = "flex flex-col gap-3 rounded-2xl border bg-kartu p-6 text-left shadow-sm transition-colors hover:border-hijau";

/**
 * Satu kartu di halaman awal. Aplikasi jadi = tautan biasa (<a>, muat penuh: halaman Set baru membaca ?id= saat dimuat).
 * Aplikasi `segera` = tombol yang memunculkan pemberitahuan.
 */
export function KartuAplikasi({ a }: { a: Aplikasi }) {
  const isi = (
    <>
      {/* Baris atas: ikon di kiri, label "Segera hadir" di pojok kanan (hanya aplikasi yang belum jadi). */}
      <span className="flex items-start justify-between gap-2">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-hijau-muda text-hijau-teks">
          <IkonAplikasi jalur={a.ikon} className="h-6 w-6" />
        </span>
        {a.segera && <span className="rounded-full border bg-krem-tua px-2 py-0.5 text-xs text-pudar">Segera hadir</span>}
      </span>
      <span className="font-serif text-2xl">{a.nama}</span>
      <span className="text-sm text-pudar">{a.isi}</span>
    </>
  );
  return a.segera ? (
    <button type="button" onClick={() => beriTahu(pesanSegera(a.nama), "Segera hadir")} className={KELAS_KARTU}>
      {isi}
    </button>
  ) : (
    <a href={a.href} className={KELAS_KARTU}>
      {isi}
    </a>
  );
}
