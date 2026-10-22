"use client";

import { useState } from "react";
import { gantiSatuSoal, simpanSoal } from "./actions";
import { kategoriBaru, KUNCI_PGK, LABEL_KATEGORI, LEVEL, POLA_ARAB, type Bab, type Soal } from "@/lib/soal";
import { MAKS_INSTRUKSI } from "@/lib/prompt";

const PECAH_ARAB = new RegExp(`(${POLA_ARAB})`);
const HURUF = ["A", "B", "C", "D", "E"];
const kotak = "w-full rounded-lg border p-2 text-sm";
const tombol = "rounded-lg border bg-kartu h-8 px-3 text-sm hover:bg-krem disabled:opacity-50";

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

/** Soal Kategori: tabel pernyataan × dua label; saat kunci dibuka, label yang benar ditandai ✓. */
function TabelKategori({ s, kunci }: { s: Soal; kunci: boolean }) {
  const label = s.label?.length === 2 ? s.label : ["?", "?"];
  const k = [s.kunci].flat();
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-krem-sorot">
            <th className="w-8 border p-2">No</th>
            <th className="border p-2 text-left">Pernyataan</th>
            {label.map((l) => <th key={l} className="w-24 border p-2">{l}</th>)}
          </tr>
        </thead>
        <tbody>
          {(s.pernyataan ?? []).map((p, i) => (
            <tr key={i} className="align-top">
              <td className="border p-2 text-center">{i + 1}</td>
              <td className="border p-2 whitespace-pre-line"><Teks teks={p} /></td>
              {label.map((l) => (
                <td key={l} className={`border p-2 text-center ${kunci && k[i] === l ? "bg-hijau-muda font-semibold text-hijau-teks" : ""}`}>
                  {kunci && k[i] === l ? "✓" : ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// nomorGrup: diisi ("4–6") hanya untuk soal pertama sebuah soal grup → wacana bersama tampil di atasnya.
// draf: soal yang sudah jadi selama set masih diproses; hanya dibaca (kunci & urutan pilihan belum final, server
// juga menolak edit/ganti sebelum selesai).
type Props = { hasilId: number; no: number; s: Soal; bab: Bab; semuaKunci: boolean; nomorGrup?: string | null; onUbah: (s: Soal) => void; draf?: boolean };

export function KartuSoal({ hasilId, no, s, bab, semuaKunci, nomorGrup, onUbah, draf }: Props) {
  const [edit, setEdit] = useState(false);
  const [lihatKunci, setLihatKunci] = useState(false); // kunci & pembahasan dilipat, dibuka per soal atau semua sekaligus
  const tampilKunci = !draf && (semuaKunci || lihatKunci);
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
    const isi = (x: Soal) => JSON.stringify([x.pertanyaan, x.pilihan, x.pernyataan, x.kunci, x.pembahasan, x.dalil_id]);
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
    <>
    {nomorGrup && s.wacana && (
      <section className="space-y-1 rounded-xl border border-hijau/40 bg-hijau-muda/40 p-4 text-sm" aria-label={`Wacana soal nomor ${nomorGrup}`}>
        <p className="font-semibold">Bacalah teks berikut untuk menjawab soal nomor {nomorGrup}!</p>
        <p className="whitespace-pre-line"><Teks teks={s.wacana} /></p>
      </section>
    )}
    <article id={`soal-${no}`} className={`scroll-mt-4 space-y-2 rounded-xl border p-4 ${s.peringatan?.length ? "border-bahaya-garis bg-bahaya-muda" : "bg-kartu"} ${mengganti ? "opacity-50" : ""}`}>
      {s.peringatan?.map((w, i) => (
        <p key={i} className="text-sm font-semibold text-bahaya">⚠️ {w}</p>
      ))}
      <p className="whitespace-pre-line">
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
          {s.pilihan.map((o, i) => <li key={i} className="whitespace-pre-line"><Teks teks={o} /></li>)}
        </ol>
      )}
      {kategoriBaru(s) && <TabelKategori s={s} kunci={tampilKunci} />}
      {tampilKunci && (
      <div className="space-y-1 rounded bg-hijau-muda p-3 text-sm">
        {!kategoriBaru(s) && <p><span className="font-semibold">Kunci:</span> <Teks teks={[s.kunci].flat().join(", ")} /></p>}
        {s.rubrik && (
          <ul className="list-disc pl-5">
            {s.rubrik.map((r, i) => <li key={i}><Teks teks={r.kriteria} /> ({r.skor})</li>)}
          </ul>
        )}
        <p className="whitespace-pre-line"><span className="font-semibold">Pembahasan:</span> <Teks teks={s.pembahasan} /></p>
        <p className="text-pudar">{s.level} · {s.tp} · skor {s.skor}</p>
      </div>
      )}
      {!draf && (
      <>
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
          className="min-w-0 flex-1 rounded-lg border bg-kartu h-8 px-3 text-sm"
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
      </>
      )}
      {error && <p className="text-sm text-bahaya">{error}</p>}
    </article>
    </>
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
    if (s.bentuk === "PGK" && !KUNCI_PGK.includes(kunciPgk.length)) return setError("Pilih 2 atau 3 kunci jawaban.");
    if (kategoriBaru(s) && (s.pernyataan ?? []).some((_, i) => !s.label?.includes(kunciPgk[i]))) return setError("Pilih kunci untuk setiap pernyataan.");
    setMenyimpan(true);
    setError((await onSimpan(s)) ?? "");
    setMenyimpan(false);
  }

  return (
    <article className="space-y-3 rounded-lg border-2 border-hijau p-4 text-sm">
      <p className="font-semibold">Edit soal nomor {no}</p>

      {s.grup && s.wacana !== undefined && (
        <label className="block">
          Wacana grup (dipakai bersama semua soal di grup ini; perubahan ikut ke soal lain di grup)
          <textarea dir="auto" rows={6} className={kotak} value={s.wacana} onChange={(e) => ubah({ wacana: e.target.value })} />
        </label>
      )}

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
          <legend>Pilihan jawaban (centang kunci{s.bentuk === "PGK" ? ", 2 atau 3" : ""})</legend>
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

      {s.bentuk === "BS" && !kategoriBaru(s) && (
        <label className="block">
          Kunci
          <select className={kotak} value={String(s.kunci)} onChange={(e) => ubah({ kunci: e.target.value })}>
            <option>Benar</option>
            <option>Salah</option>
          </select>
        </label>
      )}

      {kategoriBaru(s) && (
        <fieldset className="space-y-2">
          <legend>Pernyataan dan kuncinya</legend>
          <label className="block">
            Pasangan label
            <select
              className={kotak}
              value={(s.label ?? []).join("|")}
              onChange={(e) => {
                const baru = e.target.value.split("|");
                const lama = s.label ?? [];
                // kunci ikut pindah ke label baru pada posisi yang sama (Benar→Fakta, Salah→Opini, ...)
                ubah({ label: baru, kunci: [s.kunci].flat().map((k) => baru[lama.indexOf(k)] ?? baru[0]) });
              }}
            >
              {!LABEL_KATEGORI.some((l) => l.join("|") === (s.label ?? []).join("|")) && <option value={(s.label ?? []).join("|")}>(pilih)</option>}
              {LABEL_KATEGORI.map((l) => <option key={l[0]} value={l.join("|")}>{l.join(" / ")}</option>)}
            </select>
          </label>
          {(s.pernyataan ?? []).map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-4 font-semibold">{i + 1}</span>
              <input dir="auto" className={kotak} aria-label={`Pernyataan ${i + 1}`} value={p} onChange={(e) => ubah({ pernyataan: s.pernyataan!.map((x, j) => (j === i ? e.target.value : x)) })} />
              <select
                className="w-36 rounded-lg border p-2"
                aria-label={`Kunci pernyataan ${i + 1}`}
                value={[s.kunci].flat()[i] ?? ""}
                onChange={(e) => ubah({ kunci: (s.pernyataan ?? []).map((_, j) => (j === i ? e.target.value : ([s.kunci].flat()[j] ?? ""))) })}
              >
                <option value="">(kunci)</option>
                {(s.label ?? []).map((l) => <option key={l}>{l}</option>)}
              </select>
            </div>
          ))}
        </fieldset>
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
      {error && <p className="text-bahaya">{error}</p>}
    </article>
  );
}
