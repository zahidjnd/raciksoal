import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { materi } from "@/db/schema";
import { BATAS_MATERI } from "@/lib/materi";
import { wajibMasuk } from "@/lib/sesi";
import { identitasBab, type Bab } from "@/lib/soal";
import { Kerangka } from "../kepala";
import { DaftarMateri, type BarisMateri } from "./form";

/** Peringatan sejak awal, supaya batas tidak baru ketahuan saat menekan Buat soal. */
const HAMPIR_PENUH = 20;

export default async function MateriSaya() {
  const p = await wajibMasuk();
  // Aturan 3: hanya materi milik pengguna yang sedang masuk.
  const daftar = await db.select().from(materi).where(eq(materi.guruId, p.id)).orderBy(desc(materi.diubah));
  const sisa = BATAS_MATERI.perGuru - daftar.length;

  // Kelompok per mapel & kelas disusun di DaftarMateri (materi lama tanpa mapel = Qurdis XI, sama seperti di tempat lain).
  const baris: BarisMateri[] = daftar.map((m) => {
    const bab = m.bab as Bab;
    const diubah = m.diubah.toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" });
    const info = `${bab.tp.length} TP · ${bab.dalil.length} ayat/hadis · ${bab.materi.join("").length.toLocaleString("id-ID")} huruf · diubah ${diubah}`;
    return { id: m.id, judul: bab.judul, ...identitasBab(bab), info };
  });

  return (
    <Kerangka p={p}>
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl">Materi saya</h1>
          <Link href="/materi/baru" className="inline-flex h-10 items-center rounded-lg bg-hijau px-4 text-sm font-semibold text-white max-md:min-h-11">+ Tambah materi</Link>
        </div>
        <p className="text-sm text-pudar">
          Materi hanya bisa dilihat dan dipakai oleh Anda. Materi bisa ditambah di sini, atau tersimpan otomatis saat Anda membuat soal
          dengan materi baru di Set baru. Pilih lagi lewat &ldquo;Pakai materi sebelumnya&rdquo;. {daftar.length}/{BATAS_MATERI.perGuru} materi.
        </p>
        {sisa <= HAMPIR_PENUH && (
          <p className="rounded-lg border border-peringatan-garis bg-peringatan-muda p-2 text-sm text-peringatan" role="alert">
            {sisa > 0 ? `Tinggal ${sisa} materi lagi sebelum batas.` : "Batas materi sudah penuh."} Hapus materi yang dobel atau tidak dipakai.
          </p>
        )}
        {!daftar.length && <p className="rounded-xl border bg-kartu p-4 text-sm text-pudar">Belum ada materi. Tekan + Tambah materi untuk mulai.</p>}

        <DaftarMateri daftar={baris} />
      </section>
    </Kerangka>
  );
}
