import { desc, eq } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { materi } from "@/db/schema";
import { BATAS_MATERI } from "@/lib/materi";
import { wajibMasuk } from "@/lib/sesi";
import { identitasBab, type Bab } from "@/lib/soal";
import { Kerangka } from "../kepala";
import { TombolHapusMateri } from "./form";

/** Peringatan sejak awal, supaya batas tidak baru ketahuan saat menekan Buat soal. */
const HAMPIR_PENUH = 20;

export default async function MateriSaya() {
  const p = await wajibMasuk();
  // Aturan 3: hanya materi milik pengguna yang sedang masuk.
  const daftar = await db.select().from(materi).where(eq(materi.guruId, p.id)).orderBy(desc(materi.diubah));
  const sisa = BATAS_MATERI.perGuru - daftar.length;

  // Kelompok per mapel & kelas (materi lama tanpa mapel = Qurdis XI, sama seperti di tempat lain).
  const kelompok = new Map<string, typeof daftar>();
  for (const m of daftar) {
    const { mapel, kelas } = identitasBab(m.bab as Bab);
    const kunci = `${mapel} · Kelas ${kelas}`;
    kelompok.set(kunci, [...(kelompok.get(kunci) ?? []), m]);
  }
  const urut = [...kelompok].sort(([a], [b]) => a.localeCompare(b, "id"));

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

        {urut.map(([judul, isi]) => (
          <div key={judul} className="space-y-2">
            <h2 className="text-lg">{judul}</h2>
            <div className="divide-y divide-batas rounded-xl border bg-kartu">
              {isi.map((m) => {
                const bab = m.bab as Bab;
                return (
                  <article key={m.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                    <div className="min-w-0">
                      <p className="font-semibold">{bab.judul}</p>
                      <p className="text-xs text-pudar">
                        {bab.tp.length} TP · {bab.dalil.length} ayat/hadis · {bab.materi.join("").length.toLocaleString("id-ID")} huruf · diubah{" "}
                        {m.diubah.toLocaleString("id-ID", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" })}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {/* <a> biasa (muat penuh): Buat Soal membaca ?materi= hanya saat dimuat */}
                      <a href={`/?materi=materi-${m.id}`} className="inline-flex h-8 items-center rounded-lg border px-3 text-sm hover:bg-krem max-md:min-h-11">Buat soal</a>
                      <Link href={`/materi/${m.id}`} className="inline-flex h-8 items-center rounded-lg border px-3 text-sm hover:bg-krem max-md:min-h-11">Ubah</Link>
                      <TombolHapusMateri id={m.id} judul={bab.judul} />
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ))}
      </section>
    </Kerangka>
  );
}
