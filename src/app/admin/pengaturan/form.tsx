"use client";

import { useActionState } from "react";
import { simpanNamaMadrasah } from "./actions";

export function FormNamaMadrasah({ awal }: { awal: string }) {
  const [hasil, kirim, proses] = useActionState(simpanNamaMadrasah, null);
  return (
    <form action={kirim} className="space-y-3 rounded-xl border bg-kartu p-4">
      <label className="block text-sm">
        Nama madrasah di kop lembar soal
        <input name="nama" defaultValue={awal} maxLength={80} required className="mt-1 w-full rounded-lg border p-2 uppercase" />
      </label>
      <p className="text-sm text-pudar">Logo, alamat, dan bentuk kop tetap mengikuti format AFTS madrasah.</p>
      <button className="h-10 rounded-lg bg-hijau px-4 font-semibold text-white disabled:opacity-50" disabled={proses}>
        {proses ? "Menyimpan..." : "Simpan"}
      </button>
      {hasil && <p className={`text-sm ${hasil.ok ? "text-hijau-teks" : "text-bahaya"}`}>{hasil.pesan}</p>}
    </form>
  );
}
