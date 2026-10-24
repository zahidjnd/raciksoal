"use client";

import { useEffect, useRef } from "react";

/**
 * Kotak angka dengan tombol − dan +: ditahan = naik/turun terus, angkanya tetap bisa diketik langsung.
 * Pengganti panah bawaan browser (kecil, susah dipencet di HP).
 */
export function StepAngka({ nilai, ubah, min = 0, max, label, lebar = "w-12" }: { nilai: number; ubah: (n: number) => void; min?: number; max: number; label: string; lebar?: string }) {
  const terbaru = useRef({ nilai, ubah });
  terbaru.current = { nilai, ubah };
  const waktu = useRef<ReturnType<typeof setTimeout>>(undefined);
  const henti = () => clearTimeout(waktu.current);
  useEffect(() => henti, []);

  const geser = (arah: 1 | -1) => terbaru.current.ubah(Math.min(max, Math.max(min, terbaru.current.nilai + arah)));
  // Tekan = langsung 1 langkah; ditahan > 0,4 dtk = mengulang tiap 0,08 dtk.
  const mulai = (arah: 1 | -1) => {
    henti();
    geser(arah);
    const ulang = () => {
      geser(arah);
      waktu.current = setTimeout(ulang, 80);
    };
    waktu.current = setTimeout(ulang, 400);
  };

  const tombol = "flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-lg border bg-kartu text-lg leading-none hover:bg-hijau-muda disabled:opacity-40 disabled:hover:bg-kartu max-md:h-11 max-md:w-11";
  const pegang = (arah: 1 | -1) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      mulai(arah);
    },
    onPointerUp: henti,
    onPointerLeave: henti,
    onPointerCancel: henti,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        geser(arah);
      }
    },
  });

  return (
    <span role="group" aria-label={label} className="inline-flex items-center gap-1">
      <button type="button" aria-label={`Kurangi ${label}`} disabled={nilai <= min} className={tombol} {...pegang(-1)}>−</button>
      <input
        inputMode="numeric"
        aria-label={label}
        value={nilai}
        onFocus={(e) => e.target.select()}
        onChange={(e) => ubah(Math.min(max, Math.max(min, Number(e.target.value.replace(/\D/g, "")) || 0)))}
        className={`${lebar} rounded-lg border px-1 text-center text-base text-tinta`}
      />
      <button type="button" aria-label={`Tambah ${label}`} disabled={nilai >= max} className={tombol} {...pegang(1)}>+</button>
    </span>
  );
}
