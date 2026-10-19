"use client";

import { useActionState } from "react";
import { buatAdminPertama, masuk } from "./actions";

const kotak = "mt-1 w-full rounded border p-2";
const tombol = "w-full rounded-full bg-emerald-700 px-4 py-2 font-semibold text-white disabled:opacity-50";

export function FormMasuk() {
  const [hasil, kirim, proses] = useActionState(masuk, null);
  return (
    <form action={kirim} className="space-y-4 rounded-2xl border bg-white p-5 shadow-sm">
      <label className="block text-sm">
        Nama pengguna
        <input name="username" autoComplete="username" autoCapitalize="none" required className={kotak} />
      </label>
      <label className="block text-sm">
        Kata sandi
        <input name="password" type="password" autoComplete="current-password" required className={kotak} />
      </label>
      <button className={tombol} disabled={proses}>{proses ? "Memeriksa..." : "Masuk"}</button>
      {hasil && <p className="text-sm text-red-600">{hasil.pesan}</p>}
      <p className="text-xs text-gray-500">Belum punya akun atau lupa kata sandi? Hubungi admin Racik Soal di madrasah.</p>
    </form>
  );
}

export function FormAdminPertama() {
  const [hasil, kirim, proses] = useActionState(buatAdminPertama, null);
  return (
    <form action={kirim} className="space-y-4 rounded-lg border border-amber-400 p-4">
      <div>
        <p className="font-semibold">Buat akun admin pertama</p>
        <p className="text-xs text-gray-600">Hanya muncul sekali. Nama pengguna harus sama dengan ADMIN_USERNAME di .env.</p>
      </div>
      <label className="block text-sm">
        Nama lengkap
        <input name="nama" required className={kotak} />
      </label>
      <label className="block text-sm">
        Nama pengguna
        <input name="username" autoComplete="username" autoCapitalize="none" required className={kotak} />
      </label>
      <label className="block text-sm">
        Kata sandi (minimal 8 karakter)
        <input name="password" type="password" autoComplete="new-password" minLength={8} required className={kotak} />
      </label>
      <label className="block text-sm">
        Ulangi kata sandi
        <input name="ulang" type="password" autoComplete="new-password" minLength={8} required className={kotak} />
      </label>
      <button className={tombol} disabled={proses}>{proses ? "Membuat..." : "Buat admin & masuk"}</button>
      {hasil && <p className="text-sm text-red-600">{hasil.pesan}</p>}
    </form>
  );
}
