"use server";

import { revalidatePath } from "next/cache";
import { and, eq, max, ne, notInArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { siswa } from "@/db/schema";
import { rapikanSiswa } from "@/lib/koreksi";
import { penggunaSaatIni } from "@/lib/sesi";

type Hasil = { ok: boolean; pesan: string };
const bukanAdmin: Hasil = { ok: false, pesan: "Hanya admin yang boleh melakukan ini." };
const admin = async () => (await penggunaSaatIni())?.peran === "admin";

/** Impor daftar siswa (hasil baca Excel di browser, diperiksa ulang di sini). Kelas yang ada di file diganti isinya:
 *  nama yang tidak ada lagi = tidak aktif (bukan dihapus, nilai lama tetap utuh). Kelas lain tidak berubah. */
export async function simpanSiswa(daftar: unknown): Promise<Hasil> {
  if (!(await admin())) return bukanAdmin;
  const r = rapikanSiswa(daftar);
  if (!r) return { ok: false, pesan: "Data siswa tidak sah. Periksa lagi file Excel-nya." };
  const kelas = [...new Set(r.map((s) => s.kelas))];
  await db.transaction(async (tx) => {
    for (const s of r)
      await tx
        .insert(siswa)
        .values({ ...s, aktif: true })
        .onConflictDoUpdate({ target: [siswa.kelas, siswa.nama], set: { nomor: s.nomor, nisn: s.nisn, aktif: true, diubah: sql`now()` } });
    for (const k of kelas) {
      const nama = r.filter((s) => s.kelas === k).map((s) => s.nama);
      await tx.update(siswa).set({ aktif: false, diubah: sql`now()` }).where(and(eq(siswa.kelas, k), notInArray(siswa.nama, nama)));
    }
  });
  revalidatePath("/admin/siswa");
  return { ok: true, pesan: `Tersimpan: ${r.length} siswa di ${kelas.length} kelas (${kelas.join(", ")}).` };
}

/** Tambah satu siswa (mis. pindahan) di akhir absen kelasnya. Nama yang pernah dikeluarkan = diaktifkan lagi. */
export async function tambahSiswa(data: unknown): Promise<Hasil> {
  if (!(await admin())) return bukanAdmin;
  const d = data as { kelas?: unknown; nama?: unknown; nisn?: unknown };
  const [akhir] = await db.select({ n: max(siswa.nomor) }).from(siswa).where(and(eq(siswa.kelas, String(d?.kelas ?? "").trim().toUpperCase()), eq(siswa.aktif, true)));
  const r = rapikanSiswa([{ ...d, nomor: (akhir?.n ?? 0) + 1 }]);
  if (!r) return { ok: false, pesan: "Isi nama (dan NISN 10 angka bila ada)." };
  const s = r[0];
  const [lama] = await db.select({ id: siswa.id, aktif: siswa.aktif }).from(siswa).where(and(eq(siswa.kelas, s.kelas), eq(siswa.nama, s.nama)));
  if (lama?.aktif) return { ok: false, pesan: `${s.nama} sudah ada di ${s.kelas}.` };
  if (lama) await db.update(siswa).set({ nomor: s.nomor, nisn: s.nisn, aktif: true, diubah: sql`now()` }).where(eq(siswa.id, lama.id));
  else await db.insert(siswa).values({ ...s, aktif: true });
  revalidatePath("/admin/siswa");
  return { ok: true, pesan: `${s.nama} ditambahkan ke ${s.kelas}.` };
}

/** Ubah nomor absen, nama, atau NISN satu siswa. */
export async function ubahSiswa(id: number, data: unknown): Promise<Hasil> {
  if (!(await admin())) return bukanAdmin;
  const [lama] = await db.select({ kelas: siswa.kelas }).from(siswa).where(eq(siswa.id, Number(id) || 0));
  if (!lama) return { ok: false, pesan: "Siswa tidak ditemukan." };
  const r = rapikanSiswa([{ ...(data as object), kelas: lama.kelas }]);
  if (!r) return { ok: false, pesan: "Periksa lagi: nomor absen 1–999, nama terisi, NISN 10 angka bila ada." };
  const s = r[0];
  const [kembar] = await db.select({ id: siswa.id }).from(siswa).where(and(eq(siswa.kelas, s.kelas), eq(siswa.nama, s.nama), ne(siswa.id, Number(id))));
  if (kembar) return { ok: false, pesan: `Nama ${s.nama} sudah dipakai siswa lain di ${s.kelas}.` };
  await db.update(siswa).set({ nomor: s.nomor, nama: s.nama, nisn: s.nisn, diubah: sql`now()` }).where(eq(siswa.id, Number(id)));
  revalidatePath("/admin/siswa");
  return { ok: true, pesan: "Tersimpan." };
}

/** Keluarkan siswa dari kelasnya: disembunyikan, nilai lamanya tetap ada. */
export async function keluarkanSiswa(id: number): Promise<Hasil> {
  if (!(await admin())) return bukanAdmin;
  await db.update(siswa).set({ aktif: false, diubah: sql`now()` }).where(eq(siswa.id, Number(id) || 0));
  revalidatePath("/admin/siswa");
  return { ok: true, pesan: "Siswa dikeluarkan dari kelas." };
}
