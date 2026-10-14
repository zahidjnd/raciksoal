"use client";

import { useState, useTransition } from "react";
import { simpanDanBaca, tesAI } from "./actions";

export default function Home() {
  const [isi, setIsi] = useState("");
  const [hasilDb, setHasilDb] = useState<Awaited<ReturnType<typeof simpanDanBaca>>>();
  const [hasilAi, setHasilAi] = useState<Awaited<ReturnType<typeof tesAI>>>();
  const [prosesDb, mulaiDb] = useTransition();
  const [prosesAi, mulaiAi] = useTransition();

  return (
    <main className="mx-auto max-w-xl p-4 space-y-8">
      <h1 className="text-2xl font-bold">Racik Soal — Tes Hosting</h1>

      <section className="space-y-2">
        <h2 className="font-semibold">1. Database</h2>
        <input
          className="w-full rounded border p-2"
          placeholder="Tulis apa saja..."
          value={isi}
          onChange={(e) => setIsi(e.target.value)}
        />
        <button
          className="rounded bg-emerald-700 px-4 py-2 text-white disabled:opacity-50"
          disabled={prosesDb}
          onClick={() => mulaiDb(async () => setHasilDb(await simpanDanBaca(isi)))}
        >
          {prosesDb ? "Menyimpan..." : "Simpan & baca data"}
        </button>
        {hasilDb && !hasilDb.ok && <p className="text-red-600">{hasilDb.pesan}</p>}
        {hasilDb?.ok && (
          <ul className="list-disc pl-5 text-sm">
            {hasilDb.baris.map((b) => (
              <li key={b.id}>
                #{b.id} — {b.isi} ({new Date(b.dibuat).toLocaleString("id-ID")})
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="font-semibold">2. AI</h2>
        <button
          className="rounded bg-emerald-700 px-4 py-2 text-white disabled:opacity-50"
          disabled={prosesAi}
          onClick={() => mulaiAi(async () => setHasilAi(await tesAI()))}
        >
          {prosesAi ? "Sedang memproses..." : "Tes AI"}
        </button>
        {hasilAi && !hasilAi.ok && <p className="text-red-600">{hasilAi.pesan}</p>}
        {hasilAi?.ok && (
          <p className="text-sm">
            {hasilAi.jawaban} <span className="text-gray-500">(model: {hasilAi.model})</span>
          </p>
        )}
      </section>
    </main>
  );
}
