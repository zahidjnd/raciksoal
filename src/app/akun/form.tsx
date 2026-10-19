"use client";

import { useActionState } from "react";
import { gantiKataSandi } from "./actions";

const kotak = "mt-1 w-full rounded border p-2";

export function FormKataSandi() {
  const [hasil, kirim, proses] = useActionState(gantiKataSandi, null);
  return (
    <form action={kirim} className="space-y-4 rounded-xl border bg-white p-4" key={hasil?.ok ? "selesai" : "isi"}>
      <h2 className="font-semibold">Ganti kata sandi</h2>
      <label className="block text-sm">
        Kata sandi lama
        <input name="lama" type="password" autoComplete="current-password" required className={kotak} />
      </label>
      <label className="block text-sm">
        Kata sandi baru (minimal 8 karakter)
        <input name="baru" type="password" autoComplete="new-password" minLength={8} required className={kotak} />
      </label>
      <label className="block text-sm">
        Ulangi kata sandi baru
        <input name="ulang" type="password" autoComplete="new-password" minLength={8} required className={kotak} />
      </label>
      <button className="rounded-lg bg-hijau px-4 py-2 font-semibold text-white disabled:opacity-50" disabled={proses}>
        {proses ? "Menyimpan..." : "Simpan kata sandi baru"}
      </button>
      {hasil && <p className={`text-sm ${hasil.ok ? "text-hijau" : "text-red-600"}`}>{hasil.pesan}</p>}
    </form>
  );
}
