"use server";

import { revalidatePath } from "next/cache";
import { and, eq, notInArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { siswa } from "@/db/schema";
import { bacaDaftarSiswa } from "@/lib/koreksi";
import { penggunaSaatIni } from "@/lib/sesi";

type Hasil = { ok: boolean; pesan: string } | null;

/** Daftar siswa dari Excel TU (khusus admin). Kelas yang ditempel diganti isinya: nama yang tidak ada lagi = tidak
 *  aktif (bukan dihapus, nilai lama tetap utuh). Kelas yang tidak ditempel tidak berubah. */
export async function simpanSiswa(_: Hasil, form: FormData): Promise<Hasil> {
  if ((await penggunaSaatIni())?.peran !== "admin") return { ok: false, pesan: "Hanya admin yang boleh melakukan ini." };
  const r = bacaDaftarSiswa(String(form.get("daftar") ?? ""));
  if ("pesan" in r) return { ok: false, pesan: r.pesan };
  const kelas = [...new Set(r.map((s) => s.kelas))];
  await db.transaction(async (tx) => {
    for (const s of r)
      await tx
        .insert(siswa)
        .values({ ...s, aktif: true })
        .onConflictDoUpdate({ target: [siswa.kelas, siswa.nama], set: { nomor: s.nomor, aktif: true, diubah: sql`now()` } });
    for (const k of kelas) {
      const nama = r.filter((s) => s.kelas === k).map((s) => s.nama);
      await tx.update(siswa).set({ aktif: false, diubah: sql`now()` }).where(and(eq(siswa.kelas, k), notInArray(siswa.nama, nama)));
    }
  });
  revalidatePath("/admin/siswa");
  return { ok: true, pesan: `Tersimpan: ${r.length} siswa di ${kelas.length} kelas (${kelas.join(", ")}).` };
}
