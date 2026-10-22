"use client";

import Link from "next/link";
import { useState } from "react";
import { analisaMateri } from "./actions";
import type { IsianMateri } from "@/lib/materi";
import { MAKS_GABUNG } from "@/lib/soal";

export type MateriLama = { id: string; judul: string; mapel: string; kelas: string };
type Props = {
  mapel: string;
  kelas: string;
  daftar: MateriLama[]; // materi milik guru (tersimpan otomatis dari pemakaian sebelumnya)
  pilihan: string[]; // id materi lama yang dipakai di set ini
  setPilihan: (ids: string[]) => void;
  draf: IsianMateri | null; // materi baru yang sudah dianalisa AI, belum tersimpan (tersimpan saat "Buat soal")
  setDraf: (d: IsianMateri | null) => void;
};

const kotak = "w-full rounded-lg border p-2 text-sm";
const BATAS_FILE = 30 * 1024 * 1024;

/**
 * Materi di halaman utama (pengganti menu Materi saya): tempel teks atau lampirkan Word/PowerPoint/PDF → AI menganalisa
 * (judul, usulan TP, pokok materi, sumber/terjemah dalil yang tertulis) → kartu materi yang bisa diedit guru.
 * Bisa digabung dengan materi sebelumnya (PTS/PAS). Ayat diambil dari mushaf; hadis wajib dicentang (aturan 5).
 */
export function KotakMateri({ mapel, kelas, daftar, pilihan, setPilihan, draf, setDraf }: Props) {
  const [teks, setTeks] = useState("");
  const [file, setFile] = useState<string[]>([]); // paragraf dari file yang dilampirkan (urut)
  const [namaFile, setNamaFile] = useState<string[]>([]);
  const [proses, setProses] = useState("");
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string } | null>(null);
  const [lihatLama, setLihatLama] = useState(false);
  const sesuai = daftar.filter((m) => m.mapel.toLowerCase() === mapel.toLowerCase() && m.kelas === kelas);
  const siap = !!mapel && !!kelas;
  const penuh = pilihan.length + (draf ? 1 : 0) >= MAKS_GABUNG;

  async function analisa(paragrafFile = file) {
    if (!siap) return setPesan({ ok: false, teks: "Pilih mata pelajaran dan kelas dulu." });
    const paragraf = [...teks.split("\n"), ...paragrafFile];
    if (!paragraf.join("").trim()) return;
    setProses("AI sedang membaca dan menganalisa materi...");
    setPesan(null);
    const r = await analisaMateri({ mapel, kelas, paragraf }).catch(() => ({ ok: false as const, pesan: "Koneksi terputus. Coba lagi." }));
    setProses("");
    if (!r.ok) return setPesan({ ok: false, teks: r.pesan });
    setDraf(r.isian);
    if (r.catatan) setPesan({ ok: false, teks: r.catatan });
  }

  async function lampirkan(e: React.ChangeEvent<HTMLInputElement>) {
    const daftarFile = [...(e.target.files ?? [])];
    e.target.value = "";
    if (!daftarFile.length) return;
    const besar = daftarFile.find((f) => f.size > BATAS_FILE);
    if (besar) return setPesan({ ok: false, teks: `${besar.name} terlalu besar (maks 30 MB).` });
    setProses("Membaca file...");
    try {
      const { bacaFileOffice } = await import("@/lib/office"); // dimuat hanya saat dipakai; file dibaca di perangkat guru
      const semua: string[] = [];
      for (const f of daftarFile) semua.push(...(await bacaFileOffice(await f.arrayBuffer(), f.name)).semua);
      const gabung = [...file, ...semua];
      setFile(gabung);
      setNamaFile([...namaFile, ...daftarFile.map((f) => f.name)]);
      await analisa(gabung); // langsung dianalisa begitu file masuk
    } catch (err) {
      setProses("");
      setPesan({ ok: false, teks: (err as Error).message || "File tidak bisa dibaca." });
    }
  }

  const ubah = (sebagian: Partial<IsianMateri>) => draf && setDraf({ ...draf, ...sebagian });
  const ubahDalil = (i: number, sebagian: Partial<IsianMateri["dalil"][number]>) =>
    draf && ubah({ dalil: draf.dalil.map((d, j) => (j === i ? { ...d, ...sebagian } : d)) });
  const adaHadis = !!draf?.dalil.some((d) => !d.mushaf);

  return (
    <div className="space-y-3 rounded-2xl border bg-kartu p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">Materi</p>
        <span className="text-xs text-pudar">
          {pilihan.length + (draf ? 1 : 0)}/{MAKS_GABUNG} materi · <Link href="/materi" className="underline">Kelola materi</Link>
        </span>
      </div>

      {/* Materi sebelumnya yang dipakai (bisa lebih dari satu untuk PTS/PAS). */}
      {pilihan.map((id) => {
        const m = daftar.find((x) => x.id === id);
        return (
          <div key={id} className="flex items-center justify-between gap-2 rounded-lg border border-hijau/40 bg-hijau-muda/40 px-3 py-2 text-sm">
            <span className="min-w-0 truncate">✓ {m?.judul ?? id}</span>
            <button className="shrink-0 text-xs text-pudar hover:text-bahaya" aria-label={`Lepas materi ${m?.judul ?? id}`} onClick={() => setPilihan(pilihan.filter((x) => x !== id))}>
              ✕ Lepas
            </button>
          </div>
        );
      })}

      {draf ? (
        <KartuDraf draf={draf} ubah={ubah} ubahDalil={ubahDalil} adaHadis={adaHadis} batal={() => { setDraf(null); setTeks(""); setFile([]); setNamaFile([]); setPesan(null); }} />
      ) : (
        !penuh && (
          <div className="space-y-2">
            <textarea
              dir="auto"
              rows={4}
              className={kotak}
              aria-label="Tempel materi"
              placeholder={siap ? "Tempel materi di sini (ringkasan bab, modul, atau isi PPT), atau lampirkan file Word/PowerPoint/PDF." : "Pilih mata pelajaran dan kelas dulu."}
              disabled={!siap || !!proses}
              value={teks}
              onChange={(e) => setTeks(e.target.value)}
            />
            <div className="flex flex-wrap items-center gap-2">
              <label className={`inline-flex h-8 cursor-pointer items-center rounded-lg border bg-kartu px-3 text-sm hover:bg-krem max-md:min-h-11 focus-within:ring-2 focus-within:ring-hijau ${!siap || proses ? "pointer-events-none opacity-50" : ""}`}>
                Lampirkan Word/PowerPoint/PDF
                <input type="file" multiple accept=".docx,.pptx,.pdf" className="sr-only" disabled={!siap || !!proses} onChange={lampirkan} />
              </label>
              <button className="h-8 rounded-lg bg-hijau px-3 text-sm font-semibold text-white disabled:opacity-40 max-md:min-h-11" disabled={!siap || !!proses || !teks.trim()} onClick={() => analisa()}>
                Analisa materi
              </button>
              {sesuai.length > 0 && (
                <button className="h-8 rounded-lg border bg-kartu px-3 text-sm hover:bg-krem max-md:min-h-11" aria-expanded={lihatLama} onClick={() => setLihatLama(!lihatLama)}>
                  Pakai materi sebelumnya ▾
                </button>
              )}
            </div>
            {namaFile.length > 0 && <p className="text-xs text-pudar">File: {namaFile.join(", ")}</p>}
          </div>
        )
      )}

      {lihatLama && !penuh && (
        <ul className="max-h-56 divide-y divide-batas overflow-y-auto rounded-lg border text-sm">
          {sesuai.map((m) => (
            <li key={m.id}>
              <label className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-krem">
                <input
                  type="checkbox"
                  checked={pilihan.includes(m.id)}
                  onChange={(e) => setPilihan(e.target.checked ? [...pilihan, m.id] : pilihan.filter((x) => x !== m.id))}
                />
                <span className="min-w-0 truncate">{m.judul}</span>
              </label>
            </li>
          ))}
        </ul>
      )}

      {proses && (
        <p className="flex items-center gap-2 text-sm text-hijau-teks" role="status">
          <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-hijau/25 border-t-hijau" aria-hidden />
          {proses}
        </p>
      )}
      {pesan && <p className={`text-sm ${pesan.ok ? "text-hijau-teks" : "rounded-lg border border-peringatan-garis bg-peringatan-muda p-2 text-peringatan"}`}>{pesan.teks}</p>}
    </div>
  );
}

/** Kartu materi hasil analisa AI: semua bisa diedit guru sebelum soal dibuat. */
function KartuDraf({
  draf,
  ubah,
  ubahDalil,
  adaHadis,
  batal,
}: {
  draf: IsianMateri;
  ubah: (s: Partial<IsianMateri>) => void;
  ubahDalil: (i: number, s: Partial<IsianMateri["dalil"][number]>) => void;
  adaHadis: boolean;
  batal: () => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-hijau/40 p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-hijau-teks">Materi baru (hasil analisa AI, silakan periksa)</p>
        <button className="shrink-0 text-xs text-pudar hover:text-bahaya" onClick={batal}>✕ Batalkan</button>
      </div>
      <label className="block">
        Judul
        <input className={`${kotak} mt-1`} maxLength={150} value={draf.judul} onChange={(e) => ubah({ judul: e.target.value })} />
      </label>
      <label className="block">
        Tujuan Pembelajaran (usulan AI, satu per baris)
        <textarea rows={4} className={`${kotak} mt-1`} value={draf.tp} onChange={(e) => ubah({ tp: e.target.value })} />
      </label>
      {!!draf.pokok?.length && (
        <div>
          <p>Pokok materi yang akan diuji</p>
          <ul className="mt-1 list-disc pl-5 text-pudar">
            {draf.pokok.map((p, i) => <li key={i}>{p}</li>)}
          </ul>
        </div>
      )}
      {draf.dalil.length > 0 && (
        <div className="space-y-2">
          <p>Ayat & hadis</p>
          {draf.dalil.map((d, i) => (
            <div key={i} className={`space-y-1 rounded-lg border p-2 ${d.mushaf ? "border-hijau" : "border-peringatan-garis bg-peringatan-muda"}`}>
              <p className="text-xs">
                {d.mushaf ? <span className="text-hijau-teks">✓ Ayat dari mushaf: {d.sumber}</span> : <span className="text-peringatan">Bukan ayat (hadis/lainnya): lengkapi sumber dan periksa teksnya</span>}
              </p>
              <p dir="rtl" lang="ar" className="font-arab text-xl leading-loose">{d.arab}</p>
              {!d.mushaf && <input className={kotak} placeholder="Sumber, mis. HR. Bukhari dan Muslim" value={d.sumber} onChange={(e) => ubahDalil(i, { sumber: e.target.value })} />}
              <input className={kotak} placeholder="Terjemah (opsional)" value={d.terjemah} onChange={(e) => ubahDalil(i, { terjemah: e.target.value })} />
              <button className="text-xs text-pudar hover:text-bahaya" onClick={() => ubah({ dalil: draf.dalil.filter((_, j) => j !== i) })}>✕ Hapus dari materi</button>
            </div>
          ))}
          {adaHadis && (
            <label className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" checked={draf.diverifikasi} onChange={(e) => ubah({ diverifikasi: e.target.checked })} />
              Saya sudah memeriksa teks Arab dan harakat hadis/teks di atas yang bukan dari mushaf sesuai kitab sumbernya.
            </label>
          )}
        </div>
      )}
      <details>
        <summary className="cursor-pointer text-pudar">Lihat / ubah teks materi ({draf.isi.length.toLocaleString("id-ID")} huruf)</summary>
        <textarea dir="auto" rows={8} className={`${kotak} mt-1`} value={draf.isi} onChange={(e) => ubah({ isi: e.target.value })} />
      </details>
    </div>
  );
}
