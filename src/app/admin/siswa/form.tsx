"use client";

import { useActionState } from "react";
import { simpanSiswa } from "./actions";

export function FormSiswa() {
  const [hasil, kirim, proses] = useActionState(simpanSiswa, null);
  return (
    <form action={kirim} className="space-y-3 rounded-xl border bg-kartu p-4">
      <label className="block text-sm">
        Tempel dari Excel: kolom <b>Kelas</b> dan <b>Nama</b> (kolom <b>No</b> absen boleh ikut)
        <textarea
          name="daftar"
          required
          rows={10}
          placeholder={"XI A\t1\tAhmad Fauzi\nXI A\t2\tBilal Rahman\nXI B\t1\tCitra Amalia"}
          className="mt-1 w-full rounded-lg border bg-kartu p-2 font-mono text-sm"
        />
      </label>
      <p className="text-sm text-pudar">
        Kelas yang ditempel diganti isinya; siswa yang tidak ada lagi disembunyikan (nilai lamanya tetap tersimpan). Kelas lain tidak berubah.
      </p>
      <button className="h-10 rounded-lg bg-hijau px-4 font-semibold text-white disabled:opacity-50" disabled={proses}>
        {proses ? "Menyimpan..." : "Simpan daftar"}
      </button>
      {hasil && <p className={`text-sm ${hasil.ok ? "text-hijau-teks" : "text-bahaya"}`}>{hasil.pesan}</p>}
    </form>
  );
}
