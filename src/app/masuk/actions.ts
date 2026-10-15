"use server";

import { count, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { hasilSoal, pengguna } from "@/db/schema";
import { emailDariUsername, rapikanUsername } from "@/lib/akses";
import { auth } from "@/lib/auth";

type Hasil = { pesan: string } | null;

// ponytail: pembatas percobaan disimpan di memori (hilang saat restart), cukup untuk satu madrasah.
// Kunci per nama pengguna: 5 kali salah → dikunci 15 menit.
const gagal = new Map<string, { kali: number; sampai: number }>();
const BATAS_GAGAL = 5;
const LAMA_KUNCI = 15 * 60 * 1000;

export async function masuk(_: Hasil, form: FormData): Promise<Hasil> {
  const username = rapikanUsername(String(form.get("username") ?? ""));
  const password = String(form.get("password") ?? "");
  if (!username || !password) return { pesan: "Isi nama pengguna dan kata sandi." };

  const catatan = gagal.get(username);
  if (catatan && catatan.kali >= BATAS_GAGAL && catatan.sampai > Date.now()) {
    return { pesan: "Terlalu banyak percobaan salah. Coba lagi 15 menit lagi, atau minta admin mereset kata sandi." };
  }
  try {
    await auth.api.signInUsername({ body: { username, password }, headers: await headers() });
  } catch {
    const kali = (catatan && catatan.sampai > Date.now() ? catatan.kali : 0) + 1;
    gagal.set(username, { kali, sampai: Date.now() + LAMA_KUNCI });
    return { pesan: "Nama pengguna atau kata sandi salah, atau akun dinonaktifkan." };
  }
  gagal.delete(username);
  redirect("/");
}

/** Hanya bisa dipakai sekali: saat belum ada pengguna sama sekali, untuk nama pengguna ADMIN_USERNAME di .env. */
export async function buatAdminPertama(_: Hasil, form: FormData): Promise<Hasil> {
  const izin = rapikanUsername(process.env.ADMIN_USERNAME ?? "");
  if (!izin) return { pesan: "ADMIN_USERNAME belum diatur di .env hosting." };
  const username = rapikanUsername(String(form.get("username") ?? ""));
  const nama = String(form.get("nama") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (username !== izin) return { pesan: "Nama pengguna ini tidak diizinkan menjadi admin pertama." };
  if (!nama) return { pesan: "Isi nama lengkap." };
  if (password.length < 8) return { pesan: "Kata sandi minimal 8 karakter." };
  if (password !== String(form.get("ulang") ?? "")) return { pesan: "Ulangan kata sandi tidak sama." };

  const [{ n }] = await db.select({ n: count() }).from(pengguna);
  if (n > 0) return { pesan: "Admin sudah dibuat. Silakan masuk." };

  try {
    // Dipanggil dari server tanpa sesi → diizinkan oleh plugin admin.
    const { user } = await auth.api.createUser({
      body: { email: emailDariUsername(username), password, name: nama, role: "admin", data: { username, displayUsername: username } },
    });
    // Set soal uji coba lama (sebelum ada login) menjadi milik admin.
    await db.update(hasilSoal).set({ guruId: user.id }).where(isNull(hasilSoal.guruId));
    await auth.api.signInUsername({ body: { username, password }, headers: await headers() });
  } catch (e) {
    return { pesan: `Gagal membuat admin: ${(e as Error).message}` };
  }
  redirect("/");
}

export async function keluar() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/masuk");
}
