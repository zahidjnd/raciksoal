"use client";

import Link from "next/link";
import { beriTahu, tanya } from "../tanya";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { KartuMateri, KotakMateri, lihatDalil, PilihMapel } from "../kotak-materi";
import { alasanDalil, modeArab, type IsianMateri } from "@/lib/materi";
import { hapusMateri, simpanMateri } from "./actions";

const TERSIMPAN = "Materi tersimpan. Bisa dipilih lewat “Pakai materi sebelumnya” saat membuat soal.";

/**
 * Tambah/ubah materi di halaman Materi saya. Memakai kotak & kartu yang SAMA dengan Set baru (kotak-materi.tsx):
 * materi baru = tempel/lampirkan → Analisa materi → kartu → Simpan materi (tanpa membuat soal).
 */
export function FormMateri({ id: idAwal, awal, tersimpan = false, bawaan }: { id: number | null; awal: IsianMateri | null; tersimpan?: boolean; bawaan: { mapel: string[]; kelas: string } }) {
  const router = useRouter();
  const [id, setId] = useState(idAwal);
  const [draf, setDraf] = useState<IsianMateri | null>(awal);
  // Materi baru: mapel & kelas bawaan guru (halaman Akun, 0.32.0).
  const [mapel, setMapel] = useState(awal ? awal.mapel ?? "" : bawaan.mapel[0] ?? "");
  const [kelas, setKelas] = useState(awal ? awal.kelas ?? "" : bawaan.kelas);
  const [menyimpan, setMenyimpan] = useState(false);
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string; dihapus?: string[] } | null>(tersimpan ? { ok: true, teks: TERSIMPAN } : null);

  function pilihMapel(m: string, k: string) {
    setMapel(m);
    setKelas(k);
    setPesan(null);
    // Materi tersimpan: mode teks Arab hanya ikut berubah bila mapelnya diganti (materi lama bisa memilih mode sendiri).
    if (id && draf) setDraf({ ...draf, mapel: m, kelas: k, ...(m !== draf.mapel && { teksArab: modeArab(m) }) });
    else setDraf(null); // materi baru: analisa bergantung pada mapel, jadi diulang (sama seperti Set baru)
  }

  const dalilKurang = draf ? alasanDalil(draf) : null;
  const alasan =
    !mapel || !kelas ? "Pilih mata pelajaran dan kelas dulu." :
    !draf ? "Tempel teks atau lampirkan file, lalu tekan Analisa materi." :
    !draf.tp.trim() ? "Isi Tujuan Pembelajaran (TP) di kartu materi dulu." :
    draf.tpUsulan && !draf.tpDibaca ? "Baca TP usulan AI di kartu materi, lalu centang persetujuannya." :
    dalilKurang ? dalilKurang.pesan : "";

  async function simpan() {
    if (!draf || alasan) return;
    setMenyimpan(true);
    setPesan(null);
    const r = await simpanMateri(id, { ...draf, mapel, kelas }).catch(() => ({ ok: false as const, pesan: "Koneksi terputus. Coba lagi." }));
    setMenyimpan(false);
    if (!r.ok) return setPesan({ ok: false, teks: r.pesan });
    setDraf(r.isian); // tampilkan isi yang benar-benar tersimpan
    // Alamat jadi /materi/<id> supaya muat ulang tidak membuka form kosong (replaceState ditimpa Next setelah revalidatePath).
    // Halaman dimuat ulang oleh Next, jadi pesan "tersimpan" dibawa lewat alamat (kecuali ada teks Arab dibuang: pesannya tetap di sini).
    if (!id && !r.dihapus.length) return router.replace(`/materi/${r.id}?tersimpan=1`, { scroll: false });
    setId(r.id);
    setPesan({ ok: true, teks: TERSIMPAN, dihapus: r.dihapus });
  }

  return (
    <section className="space-y-4">
      <Link href="/materi" className="text-sm text-pudar underline">← Materi saya</Link>
      <h1 className="text-2xl">{id ? "Ubah materi" : "Tambah materi"}</h1>
      <PilihMapel mapel={mapel} kelas={kelas} ubah={pilihMapel} utama={bawaan.mapel} />
      {id && draf ? (
        <KartuMateri draf={draf} setDraf={setDraf} judul="Isi materi (semua bisa diubah)" />
      ) : (
        <KotakMateri mapel={mapel} kelas={kelas} daftar={[]} pilihan={[]} setPilihan={() => {}} draf={draf} setDraf={setDraf} gabung={false} />
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button className="h-10 rounded-lg bg-hijau px-4 font-semibold text-white disabled:opacity-40 max-md:min-h-11" disabled={menyimpan || !!alasan} onClick={simpan}>
          {menyimpan ? "Menyimpan..." : "Simpan materi"}
        </button>
        {id && (
          // <a> biasa (muat penuh): Buat Soal membaca ?materi= hanya saat dimuat
          <a href={`/?materi=materi-${id}`} className="inline-flex h-10 items-center rounded-lg border px-4 text-sm max-md:min-h-11">Buat soal dari materi ini</a>
        )}
      </div>
      {alasan && (
        <p className="text-sm text-pudar">
          {alasan}
          {dalilKurang && alasan === dalilKurang.pesan && (
            <> <button className="underline hover:text-tinta" onClick={() => lihatDalil(dalilKurang)}>Lihat kotaknya</button></>
          )}
        </p>
      )}
      {pesan && (
        <div className={`text-sm ${pesan.ok ? "text-hijau-teks" : "text-bahaya"}`} role={pesan.ok ? "status" : "alert"}>
          <p>{pesan.teks}</p>
          {!!pesan.dihapus?.length && (
            <p className="mt-1 rounded-lg border border-peringatan-garis bg-peringatan-muda p-2 text-peringatan">
              ⚠️ {pesan.dihapus.length} potongan teks Arab dibuang dari judul/TP/isi karena tidak ada di kotak Ayat &amp; hadis:{" "}
              <span dir="rtl" lang="ar" className="font-arab text-lg">{pesan.dihapus.join(" | ")}</span>. Bila perlu, tambahkan ayat/hadis lengkapnya ke kotak itu.
            </p>
          )}
        </div>
      )}
    </section>
  );
}

/** Tombol hapus di daftar materi (dengan konfirmasi). */
export function TombolHapusMateri({ id, judul }: { id: number; judul: string }) {
  const router = useRouter();
  const [proses, setProses] = useState(false);
  async function hapus() {
    if (!(await tanya(`Materi "${judul}" akan dihapus. Set soal yang sudah dibuat dari materi ini tetap aman.`, { judul: "Hapus materi?", ya: "Hapus", bahaya: true }))) return;
    setProses(true);
    const r = await hapusMateri(id).catch(() => ({ ok: false as const, pesan: "Koneksi terputus. Coba lagi." }));
    setProses(false);
    if (!r.ok) return beriTahu(r.pesan);
    router.refresh();
  }
  return (
    <button className="rounded-lg border h-8 px-3 text-sm text-bahaya disabled:opacity-50" disabled={proses} onClick={hapus}>
      {proses ? "Menghapus..." : "Hapus"}
    </button>
  );
}
