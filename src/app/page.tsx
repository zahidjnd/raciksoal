"use client";

import { useEffect, useState } from "react";
import { cekHasil, mulaiBuatSoal } from "./actions";
import { ATURAN_TUJUAN, KESULITAN, MAKS_SOAL, NAMA_BENTUK, TUJUAN, type Pengaturan } from "@/lib/prompt";
import { POLA_ARAB, type Bab, type Bentuk, type Soal } from "@/lib/soal";
import bab3 from "@/data/qurdis11-bab3.json";

const DAFTAR_BAB: Bab[] = [bab3];
const BENTUK = Object.keys(NAMA_BENTUK) as Bentuk[];
const PECAH_ARAB = new RegExp(`(${POLA_ARAB})`);

type Hasil = NonNullable<Awaited<ReturnType<typeof cekHasil>>>;

/** Teks campuran Latin + Arab: bagian Arab ditulis kanan-ke-kiri dengan font Arab. */
function Teks({ teks }: { teks: string }) {
  return (
    <>
      {String(teks ?? "")
        .split(PECAH_ARAB)
        .map((b, i) => (i % 2 ? <bdi key={i} dir="rtl" lang="ar" className="font-arab text-xl">{b}</bdi> : b))}
    </>
  );
}

function Angka({ label, nilai, ubah }: { label: string; nilai: number; ubah: (n: number) => void }) {
  return (
    <label className="flex items-center justify-between gap-2 text-sm">
      {label}
      <input type="number" min={0} max={MAKS_SOAL} value={nilai} onChange={(e) => ubah(Number(e.target.value))} className="w-20 rounded border p-1 text-right" />
    </label>
  );
}

export default function Home() {
  const [p, setP] = useState<Pengaturan>({
    babId: DAFTAR_BAB[0].id,
    tujuan: TUJUAN[0],
    jumlah: { PG: 10, PGK: 5, BS: 5, URAIAN: 5 },
    level: ATURAN_TUJUAN[TUJUAN[0]].level,
    kesulitan: "Sedang",
  });
  const [id, setId] = useState<number | null>(null);
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [error, setError] = useState("");
  const [detik, setDetik] = useState(0);

  const total = BENTUK.reduce((s, b) => s + p.jumlah[b], 0);
  const totalLevel = p.level.LOTS + p.level.MOTS + p.level.HOTS;
  const proses = id !== null && (!hasil || hasil.status === "proses");

  // Buka hasil lama lewat alamat ?id=... (misalnya setelah halaman dimuat ulang).
  useEffect(() => {
    const lama = Number(new URLSearchParams(location.search).get("id"));
    if (lama) setId(lama);
  }, []);

  // Cek hasil tiap 3 detik selama AI masih bekerja.
  useEffect(() => {
    if (id === null) return;
    let berhenti = false;
    const mulai = Date.now();
    const cek = async () => {
      if (berhenti) return;
      setDetik(Math.round((Date.now() - mulai) / 1000));
      const h = await cekHasil(id).catch(() => null);
      if (berhenti) return;
      if (!h) {
        setId(null);
        return setError("Hasil tidak ditemukan.");
      }
      setHasil(h);
      if (h.status === "proses") setTimeout(cek, 3000);
    };
    cek();
    return () => {
      berhenti = true;
    };
  }, [id]);

  async function buat() {
    setError("");
    setHasil(null);
    const r = await mulaiBuatSoal(p);
    if (!r.ok) return setError(r.pesan);
    history.replaceState(null, "", `?id=${r.id}`);
    setId(r.id);
  }

  const bab = DAFTAR_BAB.find((b) => b.id === (hasil?.babId ?? p.babId)) ?? DAFTAR_BAB[0];
  const soal = hasil?.soal ?? [];

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4">
      <h1 className="text-2xl font-bold">Racik Soal</h1>

      <section className="space-y-4 rounded-lg border p-4">
        <label className="block text-sm">
          Bab
          <select className="mt-1 w-full rounded border p-2" value={p.babId} onChange={(e) => setP({ ...p, babId: e.target.value })}>
            {DAFTAR_BAB.map((b) => (
              <option key={b.id} value={b.id}>{b.judul}</option>
            ))}
          </select>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            Tujuan soal
            <select
              className="mt-1 w-full rounded border p-2"
              value={p.tujuan}
              onChange={(e) => {
                const tujuan = e.target.value as (typeof TUJUAN)[number];
                setP({ ...p, tujuan, level: ATURAN_TUJUAN[tujuan].level }); // komposisi level ikut tujuan
              }}
            >
              {TUJUAN.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label className="block text-sm">
            Tingkat kesulitan
            <select className="mt-1 w-full rounded border p-2" value={p.kesulitan} onChange={(e) => setP({ ...p, kesulitan: e.target.value })}>
              {KESULITAN.map((k) => <option key={k}>{k}</option>)}
            </select>
          </label>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-semibold">Jumlah soal (total {total}, maks {MAKS_SOAL})</legend>
            {BENTUK.map((b) => (
              <Angka key={b} label={NAMA_BENTUK[b]} nilai={p.jumlah[b]} ubah={(n) => setP({ ...p, jumlah: { ...p.jumlah, [b]: n } })} />
            ))}
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-semibold">Komposisi level (total {totalLevel}%)</legend>
            <p className="text-xs text-gray-500">Terisi otomatis sesuai tujuan soal, boleh diubah.</p>
            <Angka label="LOTS (C1–C2) %" nilai={p.level.LOTS} ubah={(n) => setP({ ...p, level: { ...p.level, LOTS: n } })} />
            <Angka label="MOTS (C3) %" nilai={p.level.MOTS} ubah={(n) => setP({ ...p, level: { ...p.level, MOTS: n } })} />
            <Angka label="HOTS (C4–C6) %" nilai={p.level.HOTS} ubah={(n) => setP({ ...p, level: { ...p.level, HOTS: n } })} />
          </fieldset>
        </div>

        <button
          className="w-full rounded bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-50"
          disabled={proses || total < 1 || total > MAKS_SOAL || totalLevel !== 100}
          onClick={buat}
        >
          {proses ? `Sedang membuat soal... (${detik} detik, bisa 1–3 menit)` : "Buat Soal"}
        </button>
        {error && <p className="text-red-600">{error}</p>}
      </section>

      {hasil?.status === "gagal" && <p className="rounded border border-red-300 bg-red-50 p-3 text-red-700">Gagal membuat soal: {hasil.pesan}</p>}

      {hasil?.status === "selesai" && (
        <section className="space-y-6">
          <p className="rounded border border-amber-400 bg-amber-50 p-3 font-semibold text-amber-900">
            ⚠️ Soal dibuat AI, wajib diperiksa guru sebelum dipakai.
          </p>
          <p className="text-sm text-gray-500">
            {bab.judul} · {soal.length} soal · model: {hasil.model}
          </p>

          {BENTUK.filter((b) => soal.some((s) => s.bentuk === b)).map((b) => (
            <div key={b} className="space-y-4">
              <h2 className="text-lg font-bold">{NAMA_BENTUK[b]}</h2>
              {soal.map((s, i) => s.bentuk === b && <KartuSoal key={i} no={i + 1} s={s} bab={bab} />)}
            </div>
          ))}
        </section>
      )}
    </main>
  );
}

function KartuSoal({ no, s, bab }: { no: number; s: Soal; bab: Bab }) {
  const dalil = bab.dalil.find((d) => d.id === s.dalil_id);
  return (
    <article className={`space-y-2 rounded-lg border p-4 ${s.peringatan?.length ? "border-red-400 bg-red-50" : ""}`}>
      {s.peringatan?.map((w, i) => (
        <p key={i} className="text-sm font-semibold text-red-700">⚠️ {w}</p>
      ))}
      <p>
        <span className="font-semibold">{no}.</span> <Teks teks={s.pertanyaan} />
      </p>
      {dalil && (
        <figure className="rounded bg-gray-50 p-3">
          <p dir="rtl" lang="ar" className="font-arab text-2xl">{dalil.arab}</p>
          <figcaption className="mt-1 text-xs text-gray-500">{dalil.sumber} · teks terverifikasi</figcaption>
        </figure>
      )}
      {s.pilihan && (
        <ol className="list-[upper-alpha] space-y-1 pl-6">
          {s.pilihan.map((o, i) => <li key={i}><Teks teks={o} /></li>)}
        </ol>
      )}
      <div className="space-y-1 rounded bg-emerald-50 p-3 text-sm">
        <p><span className="font-semibold">Kunci:</span> <Teks teks={[s.kunci].flat().join(", ")} /></p>
        {s.rubrik && (
          <ul className="list-disc pl-5">
            {s.rubrik.map((r, i) => <li key={i}><Teks teks={r.kriteria} /> ({r.skor})</li>)}
          </ul>
        )}
        <p><span className="font-semibold">Pembahasan:</span> <Teks teks={s.pembahasan} /></p>
        <p className="text-gray-500">{s.level} · {s.tp} · skor {s.skor}</p>
      </div>
    </article>
  );
}
