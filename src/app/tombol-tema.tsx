"use client";

import { useState } from "react";

/** Simpan di cookie (1 tahun) supaya pilihan tetap terpakai setelah keluar lalu masuk lagi di perangkat yang sama. */
const SETAHUN = 60 * 60 * 24 * 365;

/** Tombol ikon terang/gelap (DESIGN.md: bawaan terang, tanpa pilihan otomatis). */
export function TombolTema({ awal }: { awal: "terang" | "gelap" }) {
  const [tema, setTema] = useState(awal);
  const gelap = tema === "gelap";

  function ganti() {
    // Baca dari halaman, bukan dari state: tombol ini ada dua (sidebar laptop & menu HP) dan keduanya harus sepakat.
    const baru = document.documentElement.dataset.tema === "gelap" ? "terang" : "gelap";
    if (baru === "gelap") document.documentElement.dataset.tema = "gelap";
    else delete document.documentElement.dataset.tema;
    document.cookie = `tema=${baru}; path=/; max-age=${SETAHUN}; samesite=lax`;
    setTema(baru);
  }

  return (
    <button
      onClick={ganti}
      aria-label={gelap ? "Ganti ke mode terang" : "Ganti ke mode gelap"}
      title={gelap ? "Mode terang" : "Mode gelap"}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-pudar hover:bg-krem-sorot hover:text-tinta"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {gelap ? (
          // Matahari: menekan tombol ini kembali ke mode terang.
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        ) : (
          // Bulan: menekan tombol ini pindah ke mode gelap.
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        )}
      </svg>
    </button>
  );
}
