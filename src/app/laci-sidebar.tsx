"use client";

import { useEffect, useState } from "react";

/**
 * Sidebar yang sama untuk laptop & HP (DESIGN.md).
 * - Laptop (md ke atas): diam di kiri setinggi layar (fixed), tidak ikut tergulir maupun terdorong kaki halaman.
 * - HP: laci yang meluncur dari kiri (85% lebar layar) di atas halaman yang digelapkan; ditutup lewat ✕,
 *   ketuk area gelap, tombol Esc, atau saat memilih salah satu tautan. Halaman di belakang tidak ikut tergulir.
 * Isi (`children`) disusun pemanggil: bagian atas & bawah diam, bagian tengah yang digulir.
 */
export function LaciSidebar({ children }: { children: React.ReactNode }) {
  const [buka, setBuka] = useState(false);
  // Laci disembunyikan (tak terjangkau Tab) 200 ms setelah ditutup, sesudah selesai meluncur keluar.
  // Pakai pengatur waktu, bukan transisi CSS, supaya tetap benar walau halaman sedang di latar belakang.
  const [masihTerlihat, setMasihTerlihat] = useState(false);
  const terlihat = buka || masihTerlihat;

  useEffect(() => {
    if (buka) return setMasihTerlihat(true);
    const t = setTimeout(() => setMasihTerlihat(false), 200);
    return () => clearTimeout(t);
  }, [buka]);

  useEffect(() => {
    if (!buka) return;
    const tutupDenganEsc = (e: KeyboardEvent) => e.key === "Escape" && setBuka(false);
    document.addEventListener("keydown", tutupDenganEsc);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tutupDenganEsc);
      document.body.style.overflow = "";
    };
  }, [buka]);

  return (
    <>
      {/* HP: bilah atas menempel, berisi tombol ☰. */}
      <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-garis bg-krem-tua px-2 py-1.5 md:hidden print:hidden">
        <button onClick={() => setBuka(true)} aria-label="Buka menu" aria-expanded={buka} className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-krem-sorot">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <span className="font-serif text-xl">Racik Soal</span>
      </div>

      {/* HP: latar gelap di luar laci; diketuk = tutup. */}
      <div
        aria-hidden
        onClick={() => setBuka(false)}
        className={`fixed inset-0 z-40 bg-black/50 print:hidden transition-opacity motion-reduce:transition-none md:hidden ${buka ? "opacity-100" : "pointer-events-none opacity-0"}`}
      />

      <aside
        aria-label="Menu"
        // Memilih tautan apa pun di dalam laci = pindah halaman, jadi laci ditutup.
        onClick={(e) => (e.target as HTMLElement).closest("a") && setBuka(false)}
        className={`fixed inset-y-0 left-0 z-50 flex h-dvh w-[85%] max-w-xs flex-col border-r border-garis bg-krem-tua transition-transform duration-200 motion-reduce:transition-none md:z-auto md:h-dvh md:w-64 md:max-w-none xl:w-72 md:shrink-0 md:translate-x-0 md:visible ${buka ? "translate-x-0" : "-translate-x-full"} ${terlihat ? "visible" : "invisible"}`}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-2 max-md:px-4 max-md:pt-3">
          <span className="font-serif text-xl">Racik Soal</span>
          <button onClick={() => setBuka(false)} aria-label="Tutup menu" className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-krem-sorot md:hidden">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        {children}
      </aside>
    </>
  );
}
