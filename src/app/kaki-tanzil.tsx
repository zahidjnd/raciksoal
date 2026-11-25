"use client";

import { usePathname } from "next/navigation";

/** Kaki halaman sumber teks Al-Qur'an (wajib menurut ketentuan Tanzil, langkah 9). Tidak tampil di Koreksi LJK
 *  (aplikasi terpisah tanpa teks Al-Qur'an). */
export function KakiTanzil() {
  const path = usePathname();
  if (path.startsWith("/koreksi") || path.startsWith("/admin/siswa")) return null;
  return (
    <footer className="py-4 text-center text-xs text-pudar">
      Teks Al-Qur&apos;an: <a className="underline" href="https://tanzil.net" target="_blank" rel="noreferrer">Tanzil Project (tanzil.net)</a> · Terjemah ayat: Kementerian Agama RI (via Tanzil)
    </footer>
  );
}
