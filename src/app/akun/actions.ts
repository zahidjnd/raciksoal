"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { preferensiGuru } from "@/db/schema";
import { auth } from "@/lib/auth";
import { pesanAuth } from "@/lib/pesan-auth";
import { MAKS_NAMA, rapikanNama, rapikanPreferensi } from "@/lib/preferensi";
import { penggunaSaatIni } from "@/lib/sesi";

type Hasil = { ok: boolean; pesan: string } | null;
// Ganti kata sandi: kolom yang salah, supaya form hanya mengosongkan kolom itu (0.32.5).
type HasilSandi = { ok: boolean; pesan: string; kolom?: "lama" | "baru" | "ulang" } | null;
const SESI_HABIS = { ok: false, pesan: "Sesi berakhir. Silakan masuk lagi." };

/** Ganti kata sandi sendiri. Perangkat lain yang sedang masuk ikut dikeluarkan. */
export async function gantiKataSandi(_: HasilSandi, form: FormData): Promise<HasilSandi> {
  if (!(await penggunaSaatIni())) return SESI_HABIS;
  const lama = String(form.get("lama") ?? "");
  const baru = String(form.get("baru") ?? "");
  if (!lama) return { ok: false, pesan: "Isi kata sandi lama.", kolom: "lama" };
  if (baru.length < 8) return { ok: false, pesan: "Kata sandi baru minimal 8 karakter.", kolom: "baru" };
  if (baru === lama) return { ok: false, pesan: "Kata sandi baru harus berbeda dari yang lama.", kolom: "baru" };
  if (baru !== String(form.get("ulang") ?? "")) return { ok: false, pesan: "Tidak sama dengan kata sandi baru di atas.", kolom: "ulang" };
  try {
    const h = await headers();
    // Jangan pakai opsi revokeOtherSessions bawaan: opsi itu mengganti sesi perangkat ini juga, dan sesi barunya
    // tidak tersimpan dari server action, sehingga guru ikut terlempar keluar. Keluarkan perangkat lain secara terpisah.
    await auth.api.changePassword({ body: { currentPassword: lama, newPassword: baru, revokeOtherSessions: false }, headers: h });
    await auth.api.revokeOtherSessions({ headers: h });
    return { ok: true, pesan: "Kata sandi berhasil diganti. Perangkat lain yang sedang masuk sudah dikeluarkan." };
  } catch (e) {
    const salahLama = (e as { body?: { code?: string } }).body?.code === "INVALID_PASSWORD";
    return { ok: false, pesan: pesanAuth(e), ...(salahLama ? { kolom: "lama" as const } : {}) };
  }
}

/** Nama tampil milik sendiri (sapaan, daftar guru admin). Nama pengguna untuk masuk tetap diatur admin. */
export async function gantiNama(_: Hasil, form: FormData): Promise<Hasil> {
  if (!(await penggunaSaatIni())) return SESI_HABIS;
  const nama = rapikanNama(form.get("nama"));
  if (!nama) return { ok: false, pesan: `Nama 3 sampai ${MAKS_NAMA} huruf.` };
  try {
    await auth.api.updateUser({ body: { name: nama }, headers: await headers() });
    revalidatePath("/", "layout"); // sidebar & sapaan ikut nama baru
    return { ok: true, pesan: "Nama tersimpan ✓" };
  } catch (e) {
    return { ok: false, pesan: pesanAuth(e) };
  }
}

/** Bawaan form Set baru. Selalu untuk guru yang sedang masuk (tanpa id dari browser), jadi aturan 3 terjaga. */
export async function simpanPreferensi(_: Hasil, form: FormData): Promise<Hasil> {
  const saya = await penggunaSaatIni();
  if (!saya) return SESI_HABIS;
  const nilai = rapikanPreferensi({
    mapel: form.getAll("mapel"),
    kelas: form.get("kelas"),
    waktu: form.get("waktu"),
    kesulitan: form.get("kesulitan"),
    catatan: form.get("catatan"),
  });
  await db
    .insert(preferensiGuru)
    .values({ guruId: saya.id, nilai })
    .onConflictDoUpdate({ target: preferensiGuru.guruId, set: { nilai, diubah: new Date() } });
  return { ok: true, pesan: "Tersimpan ✓ Berlaku untuk set baru berikutnya." };
}

/** Keluarkan semua perangkat lain (mis. komputer lab yang lupa keluar). Perangkat ini tetap masuk. */
export async function keluarkanPerangkatLain(): Promise<Hasil> {
  if (!(await penggunaSaatIni())) return SESI_HABIS;
  try {
    await auth.api.revokeOtherSessions({ headers: await headers() });
    return { ok: true, pesan: "Perangkat lain sudah dikeluarkan." };
  } catch (e) {
    return { ok: false, pesan: pesanAuth(e) };
  }
}
