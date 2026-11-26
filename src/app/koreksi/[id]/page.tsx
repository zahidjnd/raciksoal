import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { nilaiLjk, siswa, ujianLjk } from "@/db/schema";
import { bolehAkses } from "@/lib/akses";
import type { ButirKunci } from "@/lib/koreksi";
import { wajibMasuk } from "@/lib/sesi";
import { Kerangka } from "../../kepala";
import { HalamanUjian } from "./halaman-ujian";

/** Satu ujian = daftar siswa kelasnya: pindai LJK, nilai esai, nilai akhir. Aturan 3: hanya pemilik (dan admin). */
export default async function Ujian({ params }: { params: Promise<{ id: string }> }) {
  const p = await wajibMasuk();
  const [u] = await db.select().from(ujianLjk).where(eq(ujianLjk.id, Number((await params).id) || 0));
  if (!u || u.dihapus || !bolehAkses(u.guruId, p)) notFound();
  const baris = await db
    .select({ id: siswa.id, nomor: siswa.nomor, nama: siswa.nama, nisn: siswa.nisn, aktif: siswa.aktif, jawab: nilaiLjk.jawab, objektif: nilaiLjk.objektif, esai: nilaiLjk.esai, potong: nilaiLjk.potongNama })
    .from(siswa)
    .leftJoin(nilaiLjk, and(eq(nilaiLjk.siswaId, siswa.id), eq(nilaiLjk.ujianId, u.id)))
    .where(eq(siswa.kelas, u.kelas))
    .orderBy(asc(siswa.nomor), asc(siswa.nama));
  return (
    <Kerangka p={p} aplikasi="koreksi" setAktif={u.id}>
      <HalamanUjian
        ujian={{ id: u.id, nama: u.nama, kelas: u.kelas, kunci: u.kunci as ButirKunci[], esaiMaks: u.esaiMaks }}
        siswa={baris
          .filter((b) => b.aktif || b.jawab || b.esai !== null) // siswa keluar tetap tampil bila sudah punya nilai
          .map((b) => ({ id: b.id, nomor: b.nomor, nama: b.nama, nisn: b.nisn, jawab: (b.jawab as number[][] | null) ?? null, objektif: b.objektif, esai: b.esai, potong: b.potong ? b.potong.toString("base64") : null }))}
      />
    </Kerangka>
  );
}
