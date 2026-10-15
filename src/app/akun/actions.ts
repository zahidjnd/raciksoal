"use server";

import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { pesanAuth } from "@/lib/pesan-auth";
import { penggunaSaatIni } from "@/lib/sesi";

type Hasil = { ok: boolean; pesan: string } | null;

/** Ganti kata sandi sendiri. Perangkat lain yang sedang masuk ikut dikeluarkan. */
export async function gantiKataSandi(_: Hasil, form: FormData): Promise<Hasil> {
  if (!(await penggunaSaatIni())) return { ok: false, pesan: "Sesi berakhir. Silakan masuk lagi." };
  const lama = String(form.get("lama") ?? "");
  const baru = String(form.get("baru") ?? "");
  if (baru.length < 8) return { ok: false, pesan: "Kata sandi baru minimal 8 karakter." };
  if (baru !== String(form.get("ulang") ?? "")) return { ok: false, pesan: "Ulangan kata sandi baru tidak sama." };
  if (baru === lama) return { ok: false, pesan: "Kata sandi baru harus berbeda dari yang lama." };
  try {
    const h = await headers();
    // Jangan pakai opsi revokeOtherSessions bawaan: opsi itu mengganti sesi perangkat ini juga, dan sesi barunya
    // tidak tersimpan dari server action, sehingga guru ikut terlempar keluar. Keluarkan perangkat lain secara terpisah.
    await auth.api.changePassword({ body: { currentPassword: lama, newPassword: baru, revokeOtherSessions: false }, headers: h });
    await auth.api.revokeOtherSessions({ headers: h });
    return { ok: true, pesan: "Kata sandi berhasil diganti. Perangkat lain yang sedang masuk sudah dikeluarkan." };
  } catch (e) {
    return { ok: false, pesan: pesanAuth(e) };
  }
}
