"use client";

import { useState } from "react";
import { gantiSatuSoal, simpanSoal } from "./actions";
import { LEVEL, POLA_ARAB, type Bab, type Soal } from "@/lib/soal";
import { MAKS_INSTRUKSI } from "@/lib/prompt";

const PECAH_ARAB = new RegExp(`(${POLA_ARAB})`);
const HURUF = ["A", "B", "C", "D", "E"];
const kotak = "w-full rounded-lg border p-2 text-sm";
const tombol = "rounded-lg border bg-white h-8 px-3 text-sm hover:bg-krem disabled:opacity-50";

/** Teks campuran Latin + Arab: bagian Arab ditulis kanan-ke-kiri dengan font Arab. */
export function Teks({ teks }: { teks: string }) {
  return (
    <>
      {String(teks ?? "")
        .split(PECAH_ARAB)
        .map((b, i) => (i % 2 ? <bdi key={i} dir="rtl" lang="ar" className="font-arab text-xl">{b}</bdi> : b))}
    </>
  );
}

type Props = { hasilId: number; no: number; s: Soal; bab: Bab; semuaKunci: boolean; onUbah: (s: Soal) => void };

export function KartuSoal({ hasilId, no, s, bab, semuaKunci, onUbah }: Props) {
  const [edit, setEdit] = useState(false);
  const [lihatKunci, setLihatKunci] = useState(false); // kunci & pembahasan dilipat, dibuka per soal atau semua sekaligus
  const tampilKunci = semuaKunci || lihatKunci;
  const [proses, setProses] = useState<"" | "ganti" | "ubah">("");
  const mengganti = proses !== "";
  const [instruksi, setInstruksi] = useState("");
  const [error, setError] = useState("");

  async function ganti(jenis: "ganti" | "ubah") {
    if (jenis === "ganti" && !confirm(`Ganti soal nomor ${no} dengan soal baru dari AI? Soal lama akan hilang.`)) return;
    if (jenis === "ubah" && !instruksi.trim()) return setError("Tulis dulu perubahan yang diminta.");
    setError("");
    setProses(jenis);
    const r = await gantiSatuSoal(hasilId, no - 1, jenis === "ubah" ? instruksi : undefined).catch(() => ({ ok: false as const, pesan: "Koneksi terputus. Coba lagi." }));
    setProses("");
    if (!r.ok) return setError(r.pesan);
    const isi = (x: Soal) => JSON.stringify([x.pertanyaan, x.pilihan, x.kunci, x.pembahasan, x.dalil_id]);
    if (jenis === "ubah" && isi(r.soal) === isi(s))
      setError("AI tidak mengubah soal ini. Mungkin instruksinya bertentangan dengan aturan (mis. meminta ayat/hadis di luar data bab). Coba tulis instruksi lain.");
    onUbah(r.soal);
    setInstruksi("");
  }

  if (edit)
    return (
      <FormSoal
        no={no}
        awal={s}
        bab={bab}
        onBatal={() => setEdit(false)}
        onSimpan={async (isian) => {
          const r = await simpanSoal(hasilId, no - 1, isian).catch(() => ({ ok: false as const, pesan: "Koneksi terputus. Coba lagi." }));
          if (!r.ok) return r.pesan;
          onUbah(r.soal);
          setEdit(false);
        }}
      />
    );

  const dalil = bab.dalil.find((d) => d.id === s.dalil_id);
  return (
    <article id={`soal-${no}`} className={`scroll-mt-4 space-y-2 rounded-xl border p-4 ${s.peringatan?.length ? "border-red-400 bg-red-50" : "bg-white"} ${mengganti ? "opacity-50" : ""}`}>
      {s.peringatan?.map((w, i) => (
        <p key={i} className="text-sm font-semibold text-red-700">⚠️ {w}</p>
      ))}
      <p>
        <span className="font-semibold">{no}.</span> <Teks teks={s.pertanyaan} />
      </p>
      {dalil && (
        <figure className="rounded bg-krem p-3">
          <p dir="rtl" lang="ar" className="font-arab text-2xl">{dalil.arab}</p>
          <figcaption className="mt-1 text-xs text-pudar">{dalil.sumber} · teks terverifikasi</figcaption>
        </figure>
      )}
      {s.pilihan && (
        <ol className="list-[upper-alpha] space-y-1 pl-6">
          {s.pilihan.map((o, i) => <li key={i}><Teks teks={o} /></li>)}
        </ol>
      )}
      {tampilKunci && (
      <div className="space-y-1 rounded bg-hijau-muda p-3 text-sm">
        <p><span className="font-semibold">Kunci:</span> <Teks teks={[s.kunci].flat().join(", ")} /></p>
        {s.rubrik && (
          <ul className="list-disc pl-5">
            {s.rubrik.map((r, i) => <li key={i}><Teks teks={r.kriteria} /> ({r.skor})</li>)}
          </ul>
        )}
        <p><span className="font-semibold">Pembahasan:</span> <Teks teks={s.pembahasan} /></p>
        <p className="text-pudar">{s.level} · {s.tp} · skor {s.skor}</p>
      </div>
      )}
      <div className="flex flex-wrap gap-2">
        {!semuaKunci && (
          <button className={tombol} aria-expanded={lihatKunci} onClick={() => setLihatKunci(!lihatKunci)}>
            {lihatKunci ? "Tutup kunci" : "Kunci & pembahasan"}
          </button>
        )}
        <button className={tombol} disabled={mengganti} onClick={() => setEdit(true)}>Edit</button>
        <button className={tombol} disabled={mengganti} onClick={() => ganti("ganti")}>
          {proses === "ganti" ? "Sedang membuat soal pengganti..." : "Ganti soal ini"}
        </button>
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          ganti("ubah");
        }}
      >
        <input
          className="min-w-0 flex-1 rounded-lg border bg-white h-8 px-3 text-sm"
          placeholder="Minta perubahan, mis. jadikan lebih sulit"
          aria-label={`Minta perubahan soal nomor ${no}`}
          maxLength={MAKS_INSTRUKSI}
          value={instruksi}
          disabled={mengganti}
          onChange={(e) => setInstruksi(e.target.value)}
        />
        <button className={tombol} disabled={mengganti || !instruksi.trim()}>
          {proses === "ubah" ? "Sedang mengubah soal..." : "Ubah soal"}
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </article>
  );
}

type FormProps = { no: number; awal: Soal; bab: Bab; onBatal: () => void; onSimpan: (s: Soal) => Promise<string | void> };

function FormSoal({ no, awal, bab, onBatal, onSimpan }: FormProps) {
  const [s, setS] = useState<Soal>(structuredClone(awal));
  const [menyimpan, setMenyimpan] = useState(false);
  const [error, setError] = useState("");
  const ubah = (sebagian: Partial<Soal>) => setS({ ...s, ...sebagian });
  const kunciPgk = [s.kunci].flat();

  async function simpan() {
    if (s.bentuk === "PGK" && kunciPgk.length !== 2) return setError("Pilih tepat 2 kunci jawaban.");
    setMenyimpan(true);
    setError((await onSimpan(s)) ?? "");
    setMenyimpan(false);
  }

  return (
    <article className="space-y-3 rounded-lg border-2 border-hijau p-4 text-sm">
      <p className="font-semibold">Edit soal nomor {no}</p>

      <label className="block">
        Pertanyaan
        <textarea dir="auto" rows={4} className={kotak} value={s.pertanyaan} onChange={(e) => ubah({ pertanyaan: e.target.value })} />
      </label>

      <label className="block">
        Dalil yang ditampilkan (teks Arab terverifikasi)
        <select className={kotak} value={s.dalil_id ?? ""} onChange={(e) => ubah({ dalil_id: e.target.value || null })}>
          <option value="">(tidak ada)</option>
          {bab.dalil.map((d) => <option key={d.id} value={d.id}>{d.sumber}</option>)}
        </select>
      </label>

      {s.pilihan && (
        <fieldset className="space-y-1">
          <legend>Pilihan jawaban (centang kunci{s.bentuk === "PGK" ? ", tepat 2" : ""})</legend>
          {s.pilihan.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type={s.bentuk === "PG" ? "radio" : "checkbox"}
                name={`kunci-${no}`}
                aria-label={`Kunci ${HURUF[i]}`}
                checked={kunciPgk.includes(HURUF[i])}
                onChange={(e) =>
                  ubah({
                    kunci: s.bentuk === "PG" ? HURUF[i] : (e.target.checked ? [...kunciPgk, HURUF[i]] : kunciPgk.filter((h) => h !== HURUF[i])).sort(),
                  })
                }
              />
              <span className="w-4 font-semibold">{HURUF[i]}</span>
              <input dir="auto" className={kotak} value={o} onChange={(e) => ubah({ pilihan: s.pilihan!.map((x, j) => (j === i ? e.target.value : x)) })} />
            </div>
          ))}
        </fieldset>
      )}

      {s.bentuk === "BS" && (
        <label className="block">
          Kunci
          <select className={kotak} value={String(s.kunci)} onChange={(e) => ubah({ kunci: e.target.value })}>
            <option>Benar</option>
            <option>Salah</option>
          </select>
        </label>
      )}

      {s.bentuk === "URAIAN" && (
        <>
          <label className="block">
            Kunci jawaban
            <textarea dir="auto" rows={4} className={kotak} value={String(s.kunci)} onChange={(e) => ubah({ kunci: e.target.value })} />
          </label>
          <fieldset className="space-y-1">
            <legend>Rubrik penilaian (skor total dihitung otomatis)</legend>
            {(s.rubrik ?? []).map((r, i) => (
              <div key={i} className="flex gap-2">
                <input dir="auto" className={kotak} value={r.kriteria} onChange={(e) => ubah({ rubrik: s.rubrik!.map((x, j) => (j === i ? { ...x, kriteria: e.target.value } : x)) })} />
                <input type="number" min={0} aria-label="Skor" className="w-16 rounded-lg border p-2 text-right" value={r.skor} onChange={(e) => ubah({ rubrik: s.rubrik!.map((x, j) => (j === i ? { ...x, skor: Number(e.target.value) } : x)) })} />
                <button className="rounded-lg border px-2" aria-label="Hapus kriteria" onClick={() => ubah({ rubrik: s.rubrik!.filter((_, j) => j !== i) })}>✕</button>
              </div>
            ))}
            <button className="h-8 rounded-lg border px-2" onClick={() => ubah({ rubrik: [...(s.rubrik ?? []), { kriteria: "", skor: 1 }] })}>+ Tambah kriteria</button>
          </fieldset>
        </>
      )}

      <label className="block">
        Pembahasan
        <textarea dir="auto" rows={3} className={kotak} value={s.pembahasan} onChange={(e) => ubah({ pembahasan: e.target.value })} />
      </label>

      <div className="grid gap-2 sm:grid-cols-3">
        <label className="block">
          Level
          <select className={kotak} value={s.level} onChange={(e) => ubah({ level: e.target.value })}>
            {LEVEL.map((l) => <option key={l}>{l}</option>)}
          </select>
        </label>
        <label className="block">
          TP
          <select className={kotak} value={s.tp} onChange={(e) => ubah({ tp: e.target.value })}>
            {bab.tp.map((t) => <option key={t.kode}>{t.kode}</option>)}
          </select>
        </label>
        {s.bentuk !== "URAIAN" && (
          <label className="block">
            Skor
            <input type="number" min={0} className={kotak} value={s.skor} onChange={(e) => ubah({ skor: Number(e.target.value) })} />
          </label>
        )}
      </div>

      <div className="flex gap-2">
        <button className="rounded-lg bg-hijau h-10 px-4 font-semibold text-white disabled:opacity-50" disabled={menyimpan} onClick={simpan}>
          {menyimpan ? "Menyimpan..." : "Simpan"}
        </button>
        <button className="rounded-lg border h-10 px-4" disabled={menyimpan} onClick={onBatal}>Batal</button>
      </div>
      {error && <p className="text-red-600">{error}</p>}
    </article>
  );
}
