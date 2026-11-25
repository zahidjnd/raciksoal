import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { hasilSoal, nilaiLjk, siswa, ujianLjk } from "@/db/schema";
import { wajibMasuk } from "@/lib/sesi";
import { Kerangka, ambilRiwayat } from "../kepala";
import { FormUjianBaru } from "./form-ujian";

/** Koreksi LJK: daftar ujian milik guru (aturan 3) + Ujian baru. Kartu di halaman awal masih "Segera hadir" (aplikasi.ts). */
export default async function Koreksi() {
  const p = await wajibMasuk();
  const [ujian, kelas, set] = await Promise.all([
    db
      .select({ id: ujianLjk.id, nama: ujianLjk.nama, kelas: ujianLjk.kelas, dibuat: ujianLjk.dibuat, dipindai: sql<number>`(select count(*) from ${nilaiLjk} where ${nilaiLjk.ujianId} = ${ujianLjk.id} and ${nilaiLjk.jawab} is not null)::int` })
      .from(ujianLjk)
      .where(and(eq(ujianLjk.guruId, p.id), isNull(ujianLjk.dihapus)))
      .orderBy(desc(ujianLjk.dibuat))
      .limit(100),
    db.selectDistinct({ kelas: siswa.kelas }).from(siswa).where(eq(siswa.aktif, true)),
    ambilRiwayat(p.id, 40, eq(hasilSoal.status, "selesai")),
  ]);
  return (
    <Kerangka p={p}>
      <h1 className="text-2xl">Koreksi LJK</h1>
      {ujian.length > 0 && (
        <section className="space-y-1">
          {ujian.map((u) => (
            <a key={u.id} href={`/koreksi/${u.id}`} className="flex items-baseline justify-between gap-3 rounded-xl border bg-kartu px-4 py-3 hover:bg-krem-sorot">
              <span className="min-w-0 truncate">
                <b>{u.nama}</b> <span className="text-pudar">· {u.kelas}</span>
              </span>
              <span className="shrink-0 text-sm text-pudar">{u.dipindai} dipindai</span>
            </a>
          ))}
        </section>
      )}
      <FormUjianBaru
        kelas={kelas.map((k) => k.kelas).sort((a, b) => a.localeCompare(b, "id", { numeric: true }))}
        set={set.map((s) => ({ id: s.id, nama: s.nama || s.judulBab || `Set ${s.id}`, mapel: s.mapel }))}
        admin={p.peran === "admin"}
        terbuka={!ujian.length}
      />
    </Kerangka>
  );
}
