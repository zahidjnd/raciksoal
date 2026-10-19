"use client";

import { useRouter } from "next/navigation";
import { startTransition } from "react";

/** Tampil bila halaman gagal dimuat (mis. database atau server bermasalah), menggantikan layar error bawaan Next.js. */
export default function HalamanError({ reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  // reset() saja tidak mengambil ulang data dari server; refresh dulu, baru tampilkan ulang halamannya.
  const cobaLagi = () => startTransition(() => {
    router.refresh();
    reset();
  });
  return (
    <main className="mx-auto max-w-sm space-y-4 p-4 pt-16 text-center">
      <h1 className="garis-judul text-xl font-semibold after:mx-auto">Halaman gagal dimuat</h1>
      <p className="text-gray-600">
        Server sedang bermasalah. Set soal yang sudah tersimpan tidak hilang. Coba lagi sebentar lagi; kalau masih gagal, hubungi admin Racik Soal.
      </p>
      <div className="flex justify-center gap-2">
        <button className="rounded-lg bg-hijau px-4 py-2 font-semibold text-white hover:bg-hijau-tua" onClick={cobaLagi}>
          Coba lagi
        </button>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- muat penuh: halaman sedang error, jangan pakai navigasi router */}
        <a href="/" className="inline-flex items-center rounded-lg border px-4 py-2 max-md:min-h-11">Ke halaman awal</a>
      </div>
    </main>
  );
}
