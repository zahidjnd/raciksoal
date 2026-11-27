"use client";

import { useCallback, useEffect, useState } from "react";
import { ambilJatah } from "./actions";

export type Jatah = Awaited<ReturnType<typeof ambilJatah>>;

/**
 * Sisa jatah + peringatan admin (rem darurat / akun dihentikan / jatah habis) untuk halaman yang memakai AI.
 * Diperbarui otomatis tiap 1 menit dan saat guru kembali ke tab, supaya kunci muncul sebelum guru mengetik panjang.
 * Kembalian kedua = muat ulang sekarang (mis. sesudah set selesai).
 */
export function useJatah() {
  const [jatah, setJatah] = useState<Jatah>(null);
  const muat = useCallback(() => ambilJatah().then(setJatah).catch(() => {}), []);
  useEffect(() => {
    muat();
    const t = setInterval(muat, 60_000);
    const lihat = () => document.visibilityState === "visible" && muat();
    document.addEventListener("visibilitychange", lihat);
    window.addEventListener("focus", lihat);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", lihat);
      window.removeEventListener("focus", lihat);
    };
  }, [muat]);
  return [jatah, muat] as const;
}

/** Pengumuman dari admin: kotak kuning lembut, judul merah tebal berakhir tanda seru. */
export function KotakPeringatan({ judul, isi }: { judul: string; isi: string }) {
  return (
    <div role="alert" className="rounded-lg border border-peringatan-garis bg-peringatan-muda p-3 text-sm text-tinta">
      <p className="font-semibold text-bahaya">{judul}</p>
      <p className="mt-1">{isi}</p>
    </div>
  );
}
