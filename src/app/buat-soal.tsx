"use client";

import { useEffect, useState } from "react";
import { ambilDaftarModel, cekHasil, mulaiBuatSoal } from "./actions";
import { KartuSoal } from "./kartu-soal";
import { ATURAN_TUJUAN, BOBOT_BAWAAN, KESULITAN, MAKS_CATATAN, MAKS_SOAL, NAMA_BENTUK, TUJUAN, type Pengaturan } from "@/lib/prompt";
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

export function BuatSoal() {
  const [p, setP] = useState<Pengaturan>({
    babId: DAFTAR_BAB[0].id,
    tujuan: TUJUAN[0],
    jumlah: { PG: 10, PGK: 5, BS: 5, URAIAN: 5 },
    level: ATURAN_TUJUAN[TUJUAN[0]].level,
    kesulitan: "Sedang",
    bobot: BOBOT_BAWAAN,
    modelSlot: 1,
  });
  const [daftarModel, setDaftarModel] = useState<{ slot: number; nama: string }[]>([]);
  const [banding, setBanding] = useState<{ nama: string; id?: number; pesan?: string }[]>([]);
  const [id, setId] = useState<number | null>(null);
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [error, setError] = useState("");
  const [detik, setDetik] = useState(0);

  const total = BENTUK.reduce((s, b) => s + p.jumlah[b], 0);
  const bobot = p.bobot ?? BOBOT_BAWAAN;
  const totalSkor = BENTUK.reduce((s, b) => s + p.jumlah[b] * bobot[b], 0);
  const totalLevel = p.level.LOTS + p.level.MOTS + p.level.HOTS;
  const proses = id !== null && (!hasil || hasil.status === "proses");

  // Buka hasil lama lewat alamat ?id=... (misalnya setelah halaman dimuat ulang).
  useEffect(() => {
    const lama = Number(new URLSearchParams(location.search).get("id"));
    if (lama) setId(lama);
    ambilDaftarModel().then(setDaftarModel).catch(() => {});
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
    setBanding([]);
    if (p.modelSlot === 0) {
      // Bandingkan: pengaturan sama persis, satu set per model. Tiap hasil dibuka di tab sendiri.
      for (const m of daftarModel) {
        const r = await mulaiBuatSoal({ ...p, modelSlot: m.slot, bandingkan: true }).catch(() => ({ ok: false as const, pesan: "Koneksi terputus." }));
        setBanding((b) => [...b, r.ok ? { nama: m.nama, id: r.id } : { nama: m.nama, pesan: r.pesan }]);
      }
      return;
    }
    const r = await mulaiBuatSoal(p);
    if (!r.ok) return setError(r.pesan);
    history.replaceState(null, "", `?id=${r.id}`);
    setId(r.id);
  }

  const bab = DAFTAR_BAB.find((b) => b.id === (hasil?.babId ?? p.babId)) ?? DAFTAR_BAB[0];
  const soal = hasil?.soal ?? [];

  return (
    <div className="space-y-6">

      <section className="space-y-4 rounded-lg border p-4">
        <label className="block text-sm">
          Bab
          <select className="mt-1 w-full rounded border p-2" value={p.babId} onChange={(e) => setP({ ...p, babId: e.target.value })}>
            {DAFTAR_BAB.map((b) => (
              <option key={b.id} value={b.id}>{b.judul}</option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          Model AI
          <select className="mt-1 w-full rounded border p-2" value={p.modelSlot} onChange={(e) => setP({ ...p, modelSlot: Number(e.target.value) })}>
            {daftarModel.map((m) => (
              <option key={m.slot} value={m.slot}>{m.nama}</option>
            ))}
            {daftarModel.length > 1 && <option value={0}>Bandingkan semua model (pengaturan sama)</option>}
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
            <legend className="mb-1 text-sm font-semibold">Jumlah soal × skor per soal</legend>
            {BENTUK.map((b) => (
              <div key={b} className="flex items-center justify-between gap-2 text-sm">
                {NAMA_BENTUK[b]}
                <span className="flex items-center gap-1 whitespace-nowrap">
                  <input type="number" min={0} max={MAKS_SOAL} aria-label={`Jumlah ${NAMA_BENTUK[b]}`} value={p.jumlah[b]} onChange={(e) => setP({ ...p, jumlah: { ...p.jumlah, [b]: Number(e.target.value) } })} className="w-14 rounded border p-1 text-right" />
                  ×
                  <input type="number" min={0} max={100} aria-label={`Skor per soal ${NAMA_BENTUK[b]}`} value={bobot[b]} onChange={(e) => setP({ ...p, bobot: { ...bobot, [b]: Number(e.target.value) } })} className="w-14 rounded border p-1 text-right" />
                </span>
              </div>
            ))}
            <p className={`text-sm ${totalSkor === 100 ? "text-gray-600" : "text-amber-700"}`}>
              Total: {total} soal (maks {MAKS_SOAL}), skor {totalSkor}
              {totalSkor !== 100 && " (bukan 100)"}
            </p>
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="mb-1 text-sm font-semibold">Komposisi level (total {totalLevel}%)</legend>
            <p className="text-xs text-gray-500">Terisi otomatis sesuai tujuan soal, boleh diubah.</p>
            <Angka label="LOTS (C1–C2) %" nilai={p.level.LOTS} ubah={(n) => setP({ ...p, level: { ...p.level, LOTS: n } })} />
            <Angka label="MOTS (C3) %" nilai={p.level.MOTS} ubah={(n) => setP({ ...p, level: { ...p.level, MOTS: n } })} />
            <Angka label="HOTS (C4–C6) %" nilai={p.level.HOTS} ubah={(n) => setP({ ...p, level: { ...p.level, HOTS: n } })} />
          </fieldset>
        </div>

        <label className="block text-sm">
          Catatan tambahan untuk AI (opsional)
          <textarea
            className="mt-1 w-full rounded border p-2"
            rows={2}
            maxLength={MAKS_CATATAN}
            placeholder="Contoh: fokus pada QS. An-Nūr ayat 2 saja; pakai nama-nama santri putri; perbanyak soal mufradat"
            value={p.catatan ?? ""}
            onChange={(e) => setP({ ...p, catatan: e.target.value })}
          />
          <span className="text-xs text-gray-500">
            {(p.catatan ?? "").length}/{MAKS_CATATAN} huruf. AI tetap wajib mengikuti aturan, termasuk larangan mengarang ayat dan hadis.
          </span>
        </label>

        <button
          className="w-full rounded bg-emerald-700 px-4 py-3 font-semibold text-white disabled:opacity-50"
          disabled={proses || total < 1 || total > MAKS_SOAL || totalLevel !== 100}
          onClick={buat}
        >
          {proses ? `Sedang membuat soal... ${hasil?.pesan ? `${hasil.pesan}, ` : ""}${detik} detik (bisa 1–3 menit)` : "Buat Soal"}
        </button>
        {error && <p className="text-red-600">{error}</p>}
        {banding.length > 0 && (
          <div className="space-y-1 rounded border border-blue-300 bg-blue-50 p-3 text-sm">
            <p className="font-semibold">Perbandingan dimulai. Buka tiap hasil (tab baru), tunggu sampai selesai:</p>
            {banding.map((b) =>
              b.id ? (
                <a key={b.nama} className="block text-blue-700 underline" href={`?id=${b.id}`} target="_blank" rel="noreferrer">
                  {b.nama} (set {b.id})
                </a>
              ) : (
                <p key={b.nama} className="text-red-600">{b.nama}: {b.pesan}</p>
              ),
            )}
          </div>
        )}
      </section>

      {hasil?.status === "gagal" && <p className="rounded border border-red-300 bg-red-50 p-3 text-red-700">Gagal membuat soal: {hasil.pesan}</p>}

      {hasil?.status === "selesai" && (
        <section className="space-y-6">
          <p className="rounded border border-amber-400 bg-amber-50 p-3 font-semibold text-amber-900">
            ⚠️ Soal dibuat AI, wajib diperiksa guru sebelum dipakai.
          </p>
          <p className="text-sm text-gray-500">
            {bab.judul} · {soal.length} soal · model: <b>{hasil.model}</b>
            {hasil.info && ` · ${hasil.info.detik} detik · ${(hasil.info.tokenMasuk + hasil.info.tokenKeluar).toLocaleString("id-ID")} token`}
            {` · ${soal.filter((s) => s.peringatan?.length).length} soal ditandai`}
          </p>
          {!!hasil.info?.catatan?.length && (
            <div className="rounded border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="font-semibold">⚠️ Model cadangan dipakai, karena model utama gagal:</p>
              <ul className="list-disc pl-5">
                {hasil.info.catatan.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}
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
    </div>
  );
}

