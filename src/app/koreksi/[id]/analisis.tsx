"use client";

import { useState } from "react";
import { analisisButir, angka, bagianBenar, MIN_DAYA_BEDA, nilaiAkhir, type Butir, type ButirKunci } from "@/lib/koreksi";
import { HURUF } from "@/lib/ljk";
import { buatXlsx } from "@/lib/xlsx";
import { beriTahu } from "../../tanya";

type Siswa = { nomor: number; nama: string; nisn: string | null; jawab: number[][] | null; objektif: number | null; esai: number | null };
type Ujian = { nama: string; kelas: string; kunci: ButirKunci[]; esaiMaks: number };

const huruf = (j: number[]) => j.map((h) => HURUF[h]).join("");
const NAMA_BENTUK = { PG: "PG", PGK: "PG kompleks", BS: "B/S & jodohkan" } as const;
const persen = (p: number) => Math.round(p * 100);

/** Excel tiga lembar (Nilai, Jawaban, Analisis butir), disusun di browser dari data yang sudah tampil. */
async function unduhExcel(ujian: Ujian, siswa: Siswa[], butir: Butir[]) {
  const { kunci } = ujian;
  const akhir = siswa.map((s) => nilaiAkhir(s.objektif, s.esai)).filter((n): n is number => n !== null);
  const ringkas = akhir.length
    ? [[], ["", "Rata-rata", "", "", "", "", Math.round((akhir.reduce((a, b) => a + b, 0) / akhir.length) * 10) / 10], ["", "Tertinggi", "", "", "", "", Math.max(...akhir)], ["", "Terendah", "", "", "", "", Math.min(...akhir)]]
    : [];
  const nilai = [
    ["No", "NISN", "Nama", "Benar", "Skor pilihan", "Esai", "Nilai akhir"],
    ...siswa.map((s) => [s.nomor, s.nisn, s.nama, s.jawab ? kunci.filter((k, i) => bagianBenar(k, s.jawab![i] ?? []) === 1).length : null, s.objektif, s.esai, nilaiAkhir(s.objektif, s.esai)]),
    ...ringkas,
  ];
  const jawaban = [["No", "Nama", ...kunci.map((_, i) => i + 1)], ["", "KUNCI", ...kunci.map((k) => huruf(k.kunci))], ...siswa.filter((s) => s.jawab).map((s) => [s.nomor, s.nama, ...kunci.map((_, i) => huruf(s.jawab![i] ?? []) || "-")])];
  const analisis = [
    ["No", "Bentuk", "Kunci", "% benar", "Kesukaran", "Daya beda", "Keterangan", "A", "B", "C", "D", "E", "Kosong", "Pengecoh lemah"],
    ...butir.map((b, i) => [i + 1, NAMA_BENTUK[kunci[i].bentuk], huruf(kunci[i].kunci), persen(b.p), b.kategoriP, b.d, b.kategoriD ?? `perlu ≥ ${MIN_DAYA_BEDA} siswa`, ...b.sebaran, huruf(b.pengecohLemah)]),
  ];
  const blob = await buatXlsx([
    { nama: "Nilai", lebar: [5, 13, 32, 8, 12, 8, 11], teks: [1], baris: nilai },
    { nama: "Jawaban", lebar: [5, 32, ...kunci.map(() => 5)], baris: jawaban },
    { nama: "Analisis butir", lebar: [5, 15, 7, 9, 11, 10, 17, 5, 5, 5, 5, 5, 8, 15], baris: analisis },
  ]);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `Nilai ${ujian.nama}${ujian.nama.toLowerCase().includes(ujian.kelas.toLowerCase()) ? "" : ` ${ujian.kelas}`}`.replace(/[\\/:*?"<>|]+/g, " ").trim() + ".xlsx";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 10_000);
}

export function TombolExcel({ ujian, siswa }: { ujian: Ujian; siswa: Siswa[] }) {
  const [proses, setProses] = useState(false);
  return (
    <button
      disabled={proses}
      onClick={async () => {
        setProses(true);
        await unduhExcel(ujian, siswa, analisisButir(ujian.kunci, siswa.flatMap((s) => (s.jawab ? [s.jawab] : [])))).catch(() => beriTahu("File Excel gagal dibuat. Coba lagi."));
        setProses(false);
      }}
      className="inline-flex h-10 items-center gap-2 rounded-lg border bg-kartu px-4 text-sm hover:bg-krem disabled:opacity-50 max-md:min-h-11"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
      </svg>
      {proses ? "Menyiapkan…" : "Unduh Excel"}
    </button>
  );
}

const warnaP = { Mudah: "text-hijau-teks", Sedang: "text-tinta", Sukar: "text-bahaya" } as const;
const warnaD = { Baik: "text-hijau-teks", Cukup: "text-tinta", "Perlu diperbaiki": "text-peringatan", Dibuang: "text-bahaya" } as const;

/** Analisis butir di halaman ujian: kesukaran, daya beda, sebaran jawaban tiap nomor. */
export function AnalisisButir({ kunci, siswa }: { kunci: ButirKunci[]; siswa: Siswa[] }) {
  const jawaban = siswa.flatMap((s) => (s.jawab ? [s.jawab] : []));
  if (!jawaban.length) return null;
  const butir = analisisButir(kunci, jawaban);
  const hitung = <K extends string>(k: (b: Butir) => K | null) => butir.reduce<Record<string, number>>((s, b) => ((s[k(b) ?? ""] = (s[k(b) ?? ""] ?? 0) + 1), s), {});
  const p = hitung((b) => b.kategoriP);
  const d = hitung((b) => b.kategoriD);
  return (
    <details className="rounded-xl border bg-kartu">
      <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 py-2">
        <span className="font-semibold">Analisis butir soal</span>
        <span className="text-right text-xs text-pudar">
          Mudah {p.Mudah ?? 0} · Sedang {p.Sedang ?? 0} · Sukar {p.Sukar ?? 0}
        </span>
      </summary>
      <div className="space-y-3 border-t px-4 py-3">
        <p className="text-xs text-pudar">
          Dari {jawaban.length} lembar dipindai. <b>% benar</b>: Mudah ≥ 70%, Sukar &lt; 30%. <b>Daya beda</b>: kelompok nilai tertinggi dibanding terendah (27%);
          {jawaban.length >= MIN_DAYA_BEDA
            ? ` Baik ${d.Baik ?? 0} · Cukup ${d.Cukup ?? 0} · Perlu diperbaiki ${d["Perlu diperbaiki"] ?? 0} · Dibuang ${d.Dibuang ?? 0}.`
            : ` dihitung setelah minimal ${MIN_DAYA_BEDA} lembar dipindai.`}{" "}
          Pengecoh yang dipilih kurang dari 5% siswa bertanda kuning.
        </p>
        <ol className="divide-y">
          {butir.map((b, i) => (
            <li key={i} className="space-y-1 py-2 text-sm">
              <p>
                <b>{i + 1}.</b> <span className="text-pudar">Kunci</span> <b>{huruf(kunci[i].kunci)}</b> · {persen(b.p)}% benar · <span className={warnaP[b.kategoriP]}>{b.kategoriP}</span>
                {b.kategoriD && (
                  <>
                    {" "}· daya beda <span className={warnaD[b.kategoriD]}>{b.kategoriD}</span> <span className="text-pudar">({angka(b.d!)})</span>
                  </>
                )}
              </p>
              <p className="flex flex-wrap gap-1">
                {b.sebaran.map((n, h) => {
                  const kunciIni = kunci[i].kunci.includes(h);
                  const lemah = b.pengecohLemah.includes(h);
                  return (
                    <span
                      key={h}
                      className={`rounded-md border px-1.5 py-0.5 text-xs ${kunciIni ? "border-hijau bg-hijau-muda font-semibold text-hijau-teks" : lemah ? "border-peringatan-garis bg-peringatan-muda text-peringatan" : "text-pudar"}`}
                    >
                      {h < 5 ? HURUF[h] : "Kosong"} {n}
                    </span>
                  );
                })}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </details>
  );
}
