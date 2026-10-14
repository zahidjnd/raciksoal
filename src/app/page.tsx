"use client";

import { useEffect, useState } from "react";
import { cekHasil, mulaiBuatSoal } from "./actions";
import { KartuSoal } from "./kartu-soal";
import { ATURAN_TUJUAN, KESULITAN, MAKS_SOAL, NAMA_BENTUK, TUJUAN, type Pengaturan } from "@/lib/prompt";
import type { Bentuk } from "@/lib/soal";
import { DAFTAR_BAB as SEMUA_BAB } from "@/data";

const DAFTAR_BAB = Object.values(SEMUA_BAB);
const BENTUK = Object.keys(NAMA_BENTUK) as Bentuk[];

type Hasil = NonNullable<Awaited<ReturnType<typeof cekHasil>>>;

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
          {proses ? `Sedang membuat soal... ${hasil?.pesan ? `${hasil.pesan}, ` : ""}${detik} detik (bisa 1–3 menit)` : "Buat Soal"}
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
          <div className="flex flex-wrap gap-2">
            <a className="rounded bg-blue-700 px-4 py-2 font-semibold text-white" href={`/api/word?id=${id}&jenis=soal`}>
              ⬇️ Unduh Soal (Word)
            </a>
            <a className="rounded border border-blue-700 px-4 py-2 font-semibold text-blue-700" href={`/api/word?id=${id}&jenis=kunci`}>
              ⬇️ Unduh Kunci & Pembahasan (Word)
            </a>
          </div>
          <p className="text-xs text-gray-500">File Word mengikuti isi terbaru, termasuk soal yang sudah Anda edit atau ganti.</p>

          {BENTUK.filter((b) => soal.some((s) => s.bentuk === b)).map((b) => (
            <div key={b} className="space-y-4">
              <h2 className="text-lg font-bold">{NAMA_BENTUK[b]}</h2>
              {soal.map(
                (s, i) =>
                  s.bentuk === b && (
                    <KartuSoal
                      key={i}
                      hasilId={id!}
                      no={i + 1}
                      s={s}
                      bab={bab}
                      onUbah={(baru) => setHasil({ ...hasil, soal: soal.map((x, j) => (j === i ? baru : x)) })}
                    />
                  ),
              )}
            </div>
          ))}
        </section>
      )}
    </main>
  );
}

