"use server";

import { count, eq, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { hasilSoal, pengguna } from "@/db/schema";
import { emailDariUsername, rapikanUsername } from "@/lib/akses";
import { auth } from "@/lib/auth";
import { ipDari, pembatasMasuk as pembatas } from "@/lib/pembatas";

// kolom: kolom yang salah (form masuk hanya mengosongkan/menandai kolom itu). Tanpa kolom = pesan umum, kata sandi dikosongkan.
type Hasil = { pesan: string; kolom?: "username" | "password" } | null;

// Pembatas percobaan salah: per perangkat + nama pengguna, plus batas longgar per nama (src/lib/pembatas.ts, dites).
// Dibuka admin lewat "Reset kata sandi" (admin/guru/actions.ts).

export async function masuk(_: Hasil, form: FormData): Promise<Hasil> {
  const username = rapikanUsername(String(form.get("username") ?? ""));
  const password = String(form.get("password") ?? "");
  if (!username) return { pesan: "Isi nama pengguna.", kolom: "username" };
  if (!password) return { pesan: "Isi kata sandi.", kolom: "password" };

  const h = await headers();
  const ip = ipDari(h.get("x-forwarded-for"), h.get("x-real-ip") ?? "?");
  if (pembatas.terkunci(ip, username)) {
    return { pesan: "Terlalu banyak percobaan salah. Coba lagi 15 menit lagi, atau minta admin mereset kata sandi." };
  }
  // Pesan menunjuk kolom yang salah (permintaan pemilik 0.32.5). Perangkat yang terlalu sering mencoba nama tak
  // terdaftar hanya mendapat pesan umum (pembatas.samar), supaya nama guru tidak bisa ditebak satu per satu.
  const samar = pembatas.samar(ip);
  const UMUM = { pesan: "Nama pengguna atau kata sandi salah." };
  const [akun] = await db.select({ nonaktif: pengguna.banned }).from(pengguna).where(eq(pengguna.username, username)).limit(1);
  if (!akun) {
    pembatas.namaAsing(ip);
    return samar ? UMUM : { pesan: "Nama pengguna tidak terdaftar. Periksa ejaannya.", kolom: "username" };
  }
  try {
    await auth.api.signInUsername({ body: { username, password }, headers: h });
  } catch {
    pembatas.gagal(ip, username);
    if (samar) return UMUM;
    if (akun.nonaktif) return { pesan: "Akun ini dinonaktifkan. Hubungi admin." };
    return { pesan: "Kata sandi salah.", kolom: "password" };
  }
  pembatas.berhasil(ip, username);
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
