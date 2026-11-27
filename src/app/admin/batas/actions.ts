"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { batasGuru, pengaturanWeb, pengguna } from "@/db/schema";
import { ambilBawaan } from "@/lib/batas";
import { BEBAS, JENIS_BATAS, MAKS_ANGKA, sampaiDari } from "@/lib/batas-nilai";
import { penggunaSaatIni } from "@/lib/sesi";

type Hasil = { ok: boolean; pesan: string } | null;
const SALAH_ADMIN: Hasil = { ok: false, pesan: "Hanya admin yang boleh melakukan ini." };

/** Angka bulat 0..MAKS_ANGKA dari kotak isian; kosong = undefined; selain itu = null (tidak sah). */
function bacaAngka(v: FormDataEntryValue | null) {
  const t = String(v ?? "").trim();
  if (!t) return undefined;
  const n = Number(t);
  return Number.isInteger(n) && n >= 0 && n <= MAKS_ANGKA ? n : null;
}

async function tulisBatas(ubah: Record<string, unknown>) {
  const nilai = { ...(await ambilBawaan()), ...ubah };
  await db
    .insert(pengaturanWeb)
    .values({ kunci: "batas", nilai })
    .onConflictDoUpdate({ target: pengaturanWeb.kunci, set: { nilai, diubah: sql`now()` } });
  revalidatePath("/admin/batas");
}

/** Batas bawaan semua guru (enam angka). */
export async function simpanBawaan(_: Hasil, form: FormData): Promise<Hasil> {
  if ((await penggunaSaatIni())?.peran !== "admin") return SALAH_ADMIN;
  const nilai: Record<string, number> = {};
  for (const k of [...JENIS_BATAS, "web"] as const) {
    const n = bacaAngka(form.get(k));
    if (n === undefined || n === null) return { ok: false, pesan: `Isi semua angka dengan bilangan bulat 0–${MAKS_ANGKA.toLocaleString("id-ID")}.` };
    nilai[k] = n;
  }
  await tulisBatas(nilai);
  return { ok: true, pesan: "Tersimpan. Berlaku langsung untuk semua guru yang tidak punya batas khusus." };
}

/** Rem darurat: semua guru berhenti memakai AI sampai dimatikan. Admin tidak ikut kena. */
export async function setRem(_: Hasil, form: FormData): Promise<Hasil> {
  if ((await penggunaSaatIni())?.peran !== "admin") return SALAH_ADMIN;
  const nyala = form.get("aksi") === "nyalakan";
  await tulisBatas({ rem: nyala, remPesan: nyala ? String(form.get("pesan") ?? "").replace(/\s+/g, " ").trim().slice(0, 200) : "" });
  return { ok: true, pesan: nyala ? "Rem darurat MENYALA. Semua guru tidak bisa memakai AI sampai Anda mematikannya." : "Rem darurat dimatikan. Guru bisa memakai AI lagi sesuai batasnya." };
}

/** Batas khusus satu guru. mode: bawaan (hapus) | angka (kotak yang diisi saja) | bebas | stop. lama: selamanya | hari | 7 | 30. */
export async function simpanBatasGuru(_: Hasil, form: FormData): Promise<Hasil> {
  if ((await penggunaSaatIni())?.peran !== "admin") return SALAH_ADMIN;
  const guruId = String(form.get("guruId") ?? "");
  const [g] = await db.select({ nama: pengguna.name }).from(pengguna).where(and(eq(pengguna.id, guruId), ne(pengguna.role, "admin")));
  if (!g) return { ok: false, pesan: "Guru tidak ditemukan (akun admin memang tanpa batas)." };

  const mode = String(form.get("mode") ?? "");
  if (mode === "bawaan") {
    await db.delete(batasGuru).where(eq(batasGuru.guruId, guruId));
    revalidatePath("/admin/batas");
    return { ok: true, pesan: `${g.nama} kembali memakai batas bawaan.` };
  }
  const nilai: Record<string, number> = {};
  if (mode === "bebas") for (const j of JENIS_BATAS) nilai[j] = BEBAS;
  else if (mode === "stop") for (const j of JENIS_BATAS) nilai[j] = 0;
  else if (mode === "angka") {
    for (const j of JENIS_BATAS) {
      const n = bacaAngka(form.get(j));
      if (n === null) return { ok: false, pesan: `Angka harus bilangan bulat 0–${MAKS_ANGKA.toLocaleString("id-ID")} (kosongkan kotak yang ikut bawaan).` };
      if (n !== undefined) nilai[j] = n;
    }
    if (!Object.keys(nilai).length) return { ok: false, pesan: "Isi minimal satu angka, atau pilih \"Ikut bawaan\"." };
  } else return { ok: false, pesan: "Pilihan tidak dikenal." };

  const sampai = sampaiDari(String(form.get("lama") ?? ""));
  const catatan = String(form.get("catatan") ?? "").replace(/\s+/g, " ").trim().slice(0, 200) || null;
  await db
    .insert(batasGuru)
    .values({ guruId, nilai, sampai, catatan })
    .onConflictDoUpdate({ target: batasGuru.guruId, set: { nilai, sampai, catatan, diubah: sql`now()` } });
  revalidatePath("/admin/batas");
  const akhir = sampai ? ` sampai ${sampai.toLocaleString("id-ID", { timeZone: "Asia/Jakarta", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} WIB` : "";
  return { ok: true, pesan: `Batas ${g.nama} tersimpan${akhir}.` };
}
