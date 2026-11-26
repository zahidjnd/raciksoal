"use client";

import { useEffect } from "react";
import type { IdAplikasi } from "@/lib/aplikasi";

/** Catat aplikasi yang sedang dibuka (cookie `aplikasi`) supaya halaman bersama (Akun, Kelola guru, Tentang)
 *  tampil dengan sidebar aplikasi itu. Bukan data rahasia; hanya tampilan. */
export function IngatAplikasi({ id }: { id: IdAplikasi }) {
  useEffect(() => {
    document.cookie = `aplikasi=${id}; path=/; max-age=31536000; samesite=lax`;
  }, [id]);
  return null;
}
