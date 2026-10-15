"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { emailDariUsername, rapikanUsername } from "@/lib/akses";
import { auth } from "@/lib/auth";
import { pesanAuth } from "@/lib/pesan-auth";
import { penggunaSaatIni } from "@/lib/sesi";

type Hasil = { ok: boolean; pesan: string } | null;

/** Pemeriksaan pertama di kode kita; Better Auth memeriksa lagi lewat sesi di headers. */
async function bukanAdmin() {
  const p = await penggunaSaatIni();
  return p?.peran === "admin" ? null : { ok: false, pesan: "Hanya admin yang boleh melakukan ini." };
}

export async function tambahGuru(_: Hasil, form: FormData): Promise<Hasil> {
  const tolak = await bukanAdmin();
  if (tolak) return tolak;
  const nama = String(form.get("nama") ?? "").trim();
  const username = rapikanUsername(String(form.get("username") ?? ""));
  const password = String(form.get("password") ?? "");
  if (!nama) return { ok: false, pesan: "Isi nama lengkap guru." };
  if (!username) return { ok: false, pesan: "Nama pengguna 3–30 karakter: huruf kecil, angka, titik, atau garis bawah (tanpa spasi)." };
  if (password.length < 8) return { ok: false, pesan: "Kata sandi awal minimal 8 karakter." };
  try {
    await auth.api.createUser({
      body: { email: emailDariUsername(username), password, name: nama, role: "user", data: { username, displayUsername: username } },
      headers: await headers(),
    });
  } catch (e) {
    return { ok: false, pesan: pesanAuth(e) };
  }
  revalidatePath("/admin/guru");
  return { ok: true, pesan: `Akun "${username}" dibuat. Berikan nama pengguna dan kata sandi awalnya kepada ${nama}, lalu minta ia menggantinya di menu Akun.` };
}

export async function resetKataSandi(_: Hasil, form: FormData): Promise<Hasil> {
  const tolak = await bukanAdmin();
  if (tolak) return tolak;
  const userId = String(form.get("userId") ?? "");
  const baru = String(form.get("baru") ?? "");
  if (baru.length < 8) return { ok: false, pesan: "Kata sandi baru minimal 8 karakter." };
  try {
    const h = await headers();
    await auth.api.setUserPassword({ body: { userId, newPassword: baru }, headers: h });
    await auth.api.revokeUserSessions({ body: { userId }, headers: h }); // keluar dari semua perangkat
  } catch (e) {
    return { ok: false, pesan: pesanAuth(e) };
  }
  return { ok: true, pesan: "Kata sandi direset. Guru harus masuk lagi dengan kata sandi baru." };
}

export async function ubahStatus(_: Hasil, form: FormData): Promise<Hasil> {
  const tolak = await bukanAdmin();
  if (tolak) return tolak;
  const userId = String(form.get("userId") ?? "");
  const aktifkan = form.get("aksi") === "aktifkan";
  try {
    const h = await headers();
    if (aktifkan) await auth.api.unbanUser({ body: { userId }, headers: h });
    // Menonaktifkan otomatis mengeluarkan guru dari semua perangkatnya. Set soalnya tetap tersimpan.
    else await auth.api.banUser({ body: { userId, banReason: "Dinonaktifkan admin" }, headers: h });
  } catch (e) {
    return { ok: false, pesan: pesanAuth(e) };
  }
  revalidatePath("/admin/guru");
  return { ok: true, pesan: aktifkan ? "Akun diaktifkan kembali." : "Akun dinonaktifkan." };
}
