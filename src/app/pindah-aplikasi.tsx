"use client";

import { useEffect, useRef, useState } from "react";
import { APLIKASI, pesanSegera, type IdAplikasi } from "@/lib/aplikasi";
import { IkonAplikasi } from "./beranda/kartu-menu";
import { beriTahu } from "./tanya";

/**
 * Tombol pindah aplikasi di pojok kiri atas sidebar (1.0.0): "Racik Soal ⌄" → daftar APLIKASI (yang dibuka bercentang)
 * + "Halaman awal". Aplikasi `segera` hanya memunculkan pemberitahuan. Tautan sengaja <a> biasa (muat penuh).
 */
export function PindahAplikasi({ aktif }: { aktif: IdAplikasi }) {
  const [buka, setBuka] = useState(false);
  const kotak = useRef<HTMLDivElement>(null);
  const sekarang = APLIKASI.find((a) => a.id === aktif)!;

  // Menu tertutup saat klik di luar atau Esc (sama dengan menu ⋯ riwayat).
  useEffect(() => {
    if (!buka) return;
    const luar = (e: MouseEvent) => !kotak.current?.contains(e.target as Node) && setBuka(false);
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setBuka(false);
    document.addEventListener("mousedown", luar);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", luar);
      document.removeEventListener("keydown", esc);
    };
  }, [buka]);

  const item = "flex w-full items-center gap-2 rounded-md px-3 text-left text-sm hover:bg-krem-sorot h-10 max-md:min-h-11";
  return (
    <div ref={kotak} className="relative min-w-0">
      <button
        type="button"
        onClick={() => setBuka(!buka)}
        aria-haspopup="menu"
        aria-expanded={buka}
        title="Pindah aplikasi"
        className={`-ml-2 flex items-center gap-1 rounded-lg px-2 py-1 font-serif text-xl hover:bg-krem-sorot ${buka ? "bg-krem-sorot" : ""}`}
      >
        {sekarang.nama}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pudar" aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {buka && (
        <div role="menu" className="absolute top-full left-0 z-20 mt-1 w-64 rounded-lg border bg-kartu p-1 shadow-lg">
          {APLIKASI.map((a) => {
            const isi = (
              <>
                <IkonAplikasi jalur={a.ikon} className="h-4 w-4 shrink-0 text-hijau-teks" />
                <span className="flex-1">{a.nama}</span>
                {a.id === aktif && <span className="text-hijau-teks" aria-label="sedang dibuka">✓</span>}
                {a.segera && <span className="text-xs text-pudar">Segera</span>}
              </>
            );
            return a.segera ? (
              <button
                key={a.id}
                role="menuitem"
                className={item}
                onClick={() => {
                  setBuka(false);
                  beriTahu(pesanSegera(a.nama), "Segera hadir");
                }}
              >
                {isi}
              </button>
            ) : (
              <a key={a.id} role="menuitem" href={a.href} className={`${item} ${a.id === aktif ? "font-semibold" : ""}`}>
                {isi}
              </a>
            );
          })}
          <div className="my-1 border-t border-garis" />
          <a role="menuitem" href="/beranda" className={item}>
            Halaman awal
          </a>
        </div>
      )}
    </div>
  );
}
