"use server";

import { revalidatePath } from "next/cache";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { pengaturanWeb } from "@/db/schema";
import { penggunaSaatIni } from "@/lib/sesi";

type Hasil = { ok: boolean; pesan: string } | null;

/** Nama madrasah di kop Word (khusus admin). Huruf kapital mengikuti kop asli. */
export async function simpanNamaMadrasah(_: Hasil, form: FormData): Promise<Hasil> {
  if ((await penggunaSaatIni())?.peran !== "admin") return { ok: false, pesan: "Hanya admin yang boleh melakukan ini." };
  const nama = String(form.get("nama") ?? "").replace(/\s+/g, " ").trim().toUpperCase();
  if (!nama) return { ok: false, pesan: "Nama madrasah wajib diisi." };
  if (nama.length > 80) return { ok: false, pesan: "Nama madrasah maksimal 80 huruf." };
  await db
    .insert(pengaturanWeb)
    .values({ kunci: "madrasah", nilai: { nama } })
    .onConflictDoUpdate({ target: pengaturanWeb.kunci, set: { nilai: { nama }, diubah: sql`now()` } });
  revalidatePath("/admin/pengaturan");
  return { ok: true, pesan: "Tersimpan. Lembar soal Word berikutnya memakai nama ini." };
}
