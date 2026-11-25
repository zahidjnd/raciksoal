import { eq } from "drizzle-orm";
import { db } from "@/db";
import { hasilSoal, siswa } from "@/db/schema";
import { wajibMasuk } from "@/lib/sesi";
import { Kerangka, ambilRiwayat, ambilUjian } from "../kepala";
import { FormUjianBaru } from "./form-ujian";

/** Koreksi LJK: daftar ujian milik guru (aturan 3) + Ujian baru (?baru=1 dari tombol sidebar = formulir langsung terbuka). */
export default async function Koreksi({ searchParams }: { searchParams: Promise<{ baru?: string }> }) {
  const p = await wajibMasuk();
  const [ujian, kelas, set] = await Promise.all([
    ambilUjian(p.id, 100),
    db.selectDistinct({ kelas: siswa.kelas }).from(siswa).where(eq(siswa.aktif, true)),
    ambilRiwayat(p.id, 40, eq(hasilSoal.status, "selesai")),
  ]);
  // Tombol "+ Ujian baru" di sidebar: formulir langsung terbuka di atas daftar.
  const baru = !!(await searchParams).baru;
  const formulir = (
    <FormUjianBaru
      kelas={kelas.map((k) => k.kelas).sort((a, b) => a.localeCompare(b, "id", { numeric: true }))}
      set={set.map((s) => ({ id: s.id, nama: s.nama || s.judulBab || `Set ${s.id}`, mapel: s.mapel }))}
      admin={p.peran === "admin"}
      terbuka={!ujian.length || baru}
    />
  );
  return (
    <Kerangka p={p} aplikasi="koreksi">
      {/* Nama aplikasi sudah di sidebar / bilah atas HP: judul halaman = isi halamannya (seperti "Materi saya"). */}
      <div>
        <h1 className="text-2xl">Ujian saya</h1>
        <p className="text-sm text-pudar">{ujian.length ? "Pilih ujian untuk memindai LJK, atau buat ujian baru." : "Belum ada ujian. Isi formulir di bawah untuk membuat yang pertama."}</p>
      </div>
      {baru && formulir}
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
      {!baru && formulir}
    </Kerangka>
  );
}
