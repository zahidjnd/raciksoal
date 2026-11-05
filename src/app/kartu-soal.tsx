"use client";

import { useEffect, useState } from "react";
import { gantiSatuSoal, hapusSoal, pindahSoal, simpanSoal, tambahSoalManual, tambahSoalSerupa } from "./actions";
import { StepAngka } from "./step-angka";
import { kategoriBaru, KUNCI_PGK, LABEL_KATEGORI, LEVEL, pecahBaris, POLA_ARAB, type Bab, type Bentuk, type Soal } from "@/lib/soal";
import { MAKS_INSTRUKSI, NAMA_BENTUK } from "@/lib/prompt";

const PECAH_ARAB = new RegExp(`(${POLA_ARAB})`);
const HURUF = ["A", "B", "C", "D", "E", "F", "G"];
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

/**
 * Peringatan penjaga ayat ("Teks Arab tidak cocok ...: potongan1 | potongan2"): potongan Arab ditampilkan satu per
 * baris, kanan-ke-kiri, supaya tidak bercampur dengan kalimat Indonesia. Peringatan lain tampil apa adanya.
 */
export function TeksPeringatan({ w }: { w: string }) {
  const i = w.indexOf(": ");
  const potongan = i < 0 ? [] : w.slice(i + 2).split(" | ");
  if (!potongan.length || !potongan.every((p) => new RegExp(POLA_ARAB).test(p))) return <>⚠️ {w}</>;
  return (
    <>
      ⚠️ {w.slice(0, i)}:
      {potongan.map((p, j) => (
        <span key={j} dir="rtl" lang="ar" className="mt-1 block text-right font-arab text-xl font-normal">{p}</span>
      ))}
    </>
  );
}

/**
 * Teks soal berbaris (dialog/hiwar, daftar, puisi). Satu baris: sama seperti `Teks`. Beberapa baris: baris pertama
 * tetap sebaris dengan nomor soal; baris berikutnya masing-masing satu blok, dan baris yang hampir seluruhnya Arab
 * menjadi blok kanan-ke-kiri rata kanan (supaya titik dua, nomor rumpang, dan angka urut benar).
 */
export function TeksBaris({ teks, jarak }: { teks: string; jarak?: boolean }) {
  const baris = pecahBaris(teks);
  if (baris.length <= 1) return <Teks teks={baris[0]?.teks ?? ""} />;
  return (
    <>
      <span><Teks teks={baris[0].teks} /></span>
      {baris.slice(1).map((b, i) =>
        b.arab ? (
          <span key={i} dir="rtl" className={`block text-right ${jarak ? "mt-2" : ""}`}><Teks teks={b.teks} /></span>
        ) : (
          <span key={i} className={`block ${jarak ? "mt-2" : ""}`}><Teks teks={b.teks} /></span>
        ),
      )}
    </>
  );
}

/**
 * Soal Menjodohkan: premis bernomor di kiri, jawaban berhuruf di kanan. Saat kunci dibuka, huruf kunci tampil
 * (lencana hijau) di samping nomor tiap premis.
 */
function TabelJodoh({ s, kunci }: { s: Soal; kunci: boolean }) {
  const premis = s.premis ?? [];
  const jawaban = s.jawaban ?? [];
  const k = [s.kunci].flat().map((h) => String(h).toUpperCase());
  return (
    <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
      <ol className="space-y-1">
        {premis.map((p, i) => (
          <li key={i} className="flex gap-2">
            <span className="w-14 shrink-0 font-semibold">{i + 1}.{kunci && <span className="ml-1 rounded bg-hijau-muda px-1 text-hijau-teks">{k[i] ?? "?"}</span>}</span>
            <span><TeksBaris teks={p} /></span>
          </li>
        ))}
      </ol>
      <ol className="space-y-1">
        {jawaban.map((j, i) => (
          <li key={i} className="flex gap-2">
            <span className="w-5 shrink-0 font-semibold">{HURUF[i]}.</span>
            <span><TeksBaris teks={j} /></span>
          </li>
        ))}
      </ol>
    </div>
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
              <td className="border p-2"><TeksBaris teks={p} /></td>
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
// onSetBerubah: soal ditambah/dihapus → nomor bergeser, halaman memuat ulang seluruh set.
/** Jatah Ganti/Ubah/Tambah pakai AI: dipakai di set ini (maks batasSet, permanen) dan hari ini (guru; admin = null). */
export type JatahUbah = { set: number; batasSet: number; hari: number | null; batasHari: number | null };

type Props = { hasilId: number; no: number; s: Soal; bab: Bab; semuaKunci: boolean; nomorGrup?: string | null; onUbah: (s: Soal) => void; onSetBerubah?: (lompatKe?: number) => void; draf?: boolean;
  jatahUbah?: JatahUbah | null;
  // Tombol ↑/↓ (pindah urutan): hanya di dalam bagian bentuk yang sama, bukan soal grup (dihitung halaman hasil).
  bisaNaik?: boolean; bisaTurun?: boolean };

export function KartuSoal({ hasilId, no, s, bab, semuaKunci, nomorGrup, onUbah, onSetBerubah, draf, bisaNaik, bisaTurun, jatahUbah }: Props) {
  const [edit, setEdit] = useState(false);
  const [lihatKunci, setLihatKunci] = useState(false); // kunci & pembahasan dilipat, dibuka per soal atau semua sekaligus
  const tampilKunci = !draf && (semuaKunci || lihatKunci);
  const [proses, setProses] = useState<"" | "ganti" | "ubah" | "tambah" | "hapus" | "pindah">("");
  const mengganti = proses !== "";
  const [instruksi, setInstruksi] = useState("");
  const [lainnya, setLainnya] = useState(false); // Ganti & Ubah dilipat supaya kartu lebih lega
  // Jatah AI habis → tombol Ganti/Tambah/Ubah dimatikan dengan alasan tertulis (server tetap memeriksa sendiri).
  const sisaSet = jatahUbah ? jatahUbah.batasSet - jatahUbah.set : null;
  const sisaHari = jatahUbah?.batasHari != null ? jatahUbah.batasHari - (jatahUbah.hari ?? 0) : null;
  const habisAI = sisaSet !== null && sisaSet <= 0 ? "set" : sisaHari !== null && sisaHari <= 0 ? "hari" : "";
  const [error, setError] = useState("");
  // Pesan berhasil sesaat ("Tersimpan ✓"), supaya guru yakin editannya masuk (audit 2026-11-04).
  const [berhasil, setBerhasil] = useState("");
  useEffect(() => {
    if (!berhasil) return;
    const t = setTimeout(() => setBerhasil(""), 4000);
    return () => clearTimeout(t);
  }, [berhasil]);

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
    else setBerhasil(jenis === "ubah" ? "Soal sudah diubah ✓" : "Soal sudah diganti ✓");
    onUbah(r.soal);
    setInstruksi("");
  }

  /** Tukar dengan soal di atas/bawahnya; halaman memuat ulang set lalu menggulir ke posisi barunya. */
  async function pindah(arah: -1 | 1) {
    setError("");
    setProses("pindah");
    const r = await pindahSoal(hasilId, no - 1, arah).catch(() => ({ ok: false as const, pesan: "Koneksi terputus. Coba lagi." }));
    setProses("");
    if (!r.ok) return setError(r.pesan);
    onSetBerubah?.(no + arah);
  }

  /** Tambah soal serupa (AI, di bawah soal ini) atau hapus soal ini; nomor sesudahnya bergeser. */
  async function ubahJumlah(jenis: "tambah" | "hapus") {
    if (jenis === "hapus" && !confirm(`Hapus soal nomor ${no}? Nomor soal sesudahnya ikut bergeser. Soal yang dihapus tidak bisa dikembalikan.`)) return;
    setError("");
    setProses(jenis);
    const putus = { ok: false as const, pesan: "Koneksi terputus. Coba lagi." };
    const r = await (jenis === "tambah" ? tambahSoalSerupa(hasilId, no - 1) : hapusSoal(hasilId, no - 1)).catch(() => putus);
    setProses("");
    if (!r.ok) return setError(r.pesan);
    setLainnya(false);
    onSetBerubah?.(jenis === "tambah" ? no + 1 : undefined);
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
          setBerhasil("Tersimpan ✓");
        }}
      />
    );

  const dalil = bab.dalil.find((d) => d.id === s.dalil_id);
  return (
    <>
    {nomorGrup && s.wacana && (
      <section className="space-y-1 rounded-xl border border-hijau/40 bg-hijau-muda/40 p-4 text-sm" aria-label={`Wacana soal nomor ${nomorGrup}`}>
        <p className="font-semibold">Bacalah teks berikut untuk menjawab soal nomor {nomorGrup}!</p>
        <p><TeksBaris teks={s.wacana} jarak /></p>
      </section>
    )}
    <article id={`soal-${no}`} className={`scroll-mt-4 space-y-2 rounded-xl border p-4 ${s.peringatan?.length ? "border-bahaya-garis bg-bahaya-muda" : "bg-kartu"} ${mengganti ? "opacity-50" : ""}`}>
      {s.peringatan?.map((w, i) => (
        <p key={i} className="text-sm font-semibold text-bahaya"><TeksPeringatan w={w} /></p>
      ))}
      <p>
        <span className="font-semibold">{no}.</span> <TeksBaris teks={s.pertanyaan} />
      </p>
      {dalil && (
        <figure className="rounded bg-krem p-3">
          <p dir="rtl" lang="ar" className="font-arab text-2xl">{dalil.arab}</p>
          <figcaption className="mt-1 text-xs text-pudar">{dalil.sumber} · teks terverifikasi</figcaption>
        </figure>
      )}
      {s.pilihan && (
        <ol className="list-[upper-alpha] space-y-1 pl-6">
          {s.pilihan.map((o, i) => <li key={i}><TeksBaris teks={o} /></li>)}
        </ol>
      )}
      {s.bentuk === "MJ" && <TabelJodoh s={s} kunci={tampilKunci} />}
      {kategoriBaru(s) && <TabelKategori s={s} kunci={tampilKunci} />}
      {tampilKunci && (
      <div className="space-y-1 rounded bg-hijau-muda p-3 text-sm">
        {!kategoriBaru(s) && <p><span className="font-semibold">Kunci:</span> <Teks teks={s.bentuk === "MJ" ? [s.kunci].flat().map((h, i) => `${i + 1}-${h}`).join(", ") : [s.kunci].flat().join(", ")} /></p>}
        {!!s.kunciAlt?.length && <p><span className="font-semibold">Jawaban lain yang diterima:</span> <Teks teks={s.kunciAlt.join("; ")} /></p>}
        {s.rubrik && (
          <ul className="list-disc pl-5">
            {s.rubrik.map((r, i) => <li key={i}><Teks teks={r.kriteria} /> ({r.skor})</li>)}
          </ul>
        )}
        <p><span className="font-semibold">Pembahasan:</span> <TeksBaris teks={s.pembahasan} /></p>
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
        <button className={tombol} aria-expanded={lainnya} disabled={mengganti} onClick={() => setLainnya(!lainnya)}>
          {mengganti ? "Sedang memproses..." : lainnya ? "Tutup" : "Lainnya"}
        </button>
        {onSetBerubah && (bisaNaik || bisaTurun) && (
          <span className="ml-auto flex gap-1">
            <button className={tombol} disabled={mengganti || !bisaNaik} onClick={() => pindah(-1)} aria-label={`Pindah soal nomor ${no} ke atas`} title="Pindah ke atas">↑</button>
            <button className={tombol} disabled={mengganti || !bisaTurun} onClick={() => pindah(1)} aria-label={`Pindah soal nomor ${no} ke bawah`} title="Pindah ke bawah">↓</button>
          </span>
        )}
      </div>
      {lainnya && (
      <div className="space-y-2 rounded-lg border bg-krem p-3">
      <div className="flex flex-wrap gap-2">
        <button className={tombol} disabled={mengganti || !!habisAI} onClick={() => ganti("ganti")}>
          {proses === "ganti" ? "Sedang membuat soal pengganti..." : "Ganti soal ini"}
        </button>
        {onSetBerubah && (
          <>
            <button className={tombol} disabled={mengganti || !!habisAI} onClick={() => ubahJumlah("tambah")}>
              {proses === "tambah" ? "Sedang membuat soal tambahan..." : "Tambah soal serupa di bawahnya"}
            </button>
            <button className={`${tombol} text-bahaya`} disabled={mengganti} onClick={() => ubahJumlah("hapus")}>
              {proses === "hapus" ? "Menghapus..." : "Hapus soal ini"}
            </button>
          </>
        )}
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
          disabled={mengganti || !!habisAI}
          onChange={(e) => setInstruksi(e.target.value)}
        />
        <button className={tombol} disabled={mengganti || !instruksi.trim() || !!habisAI}>
          {proses === "ubah" ? "Sedang mengubah soal..." : "Ubah soal"}
        </button>
      </form>
      {jatahUbah && (
        <p className={`text-xs ${habisAI ? "font-semibold text-bahaya" : "text-pudar"}`}>
          {habisAI === "set"
            ? `Jatah ${jatahUbah.batasSet} kali ganti/ubah/tambah untuk set ini sudah habis dan tidak kembali. Perbaiki lewat Edit atau Tulis soal sendiri, atau buat set baru dengan "Pakai materi ini lagi".`
            : habisAI === "hari"
              ? `Jatah ${jatahUbah.batasHari} kali ganti/ubah/tambah hari ini sudah habis. Edit dan Tulis soal sendiri tetap bisa; besok jatahnya kembali.`
              : `Sisa ganti/ubah/tambah pakai AI: set ini ${sisaSet} dari ${jatahUbah.batasSet}${sisaHari !== null ? ` · hari ini ${sisaHari} dari ${jatahUbah.batasHari}` : ""}.`}
        </p>
      )}
      </div>
      )}
      </>
      )}
      {error && <p className="text-sm text-bahaya">{error}</p>}
      {berhasil && <p role="status" className="text-sm font-semibold text-hijau-teks">{berhasil}</p>}
    </article>
    </>
  );
}

type FormProps = { no: number; awal: Soal; bab: Bab; onBatal: () => void; onSimpan: (s: Soal) => Promise<string | void>; judul?: string };

function FormSoal({ no, awal, bab, onBatal, onSimpan, judul }: FormProps) {
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

  // Simpan/Batal juga di atas: form ini tinggi, di HP tombol bawah jauh dari pandangan (audit 2026-11-04).
  const tombolSimpan = (
    <div className="flex flex-wrap gap-2">
      <button className="rounded-lg bg-hijau h-10 px-4 font-semibold text-white disabled:opacity-50" disabled={menyimpan} onClick={simpan}>
        {menyimpan ? "Menyimpan..." : "Simpan"}
      </button>
      <button className="rounded-lg border h-10 px-4" disabled={menyimpan} onClick={onBatal}>Batal</button>
      {error && <p className="self-center text-bahaya">{error}</p>}
    </div>
  );
  return (
    <article className="space-y-3 rounded-lg border-2 border-hijau p-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">{judul ?? `Edit soal nomor ${no}`}</p>
        {tombolSimpan}
      </div>

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

      {s.bentuk === "MJ" && (
        <fieldset className="space-y-2">
          <legend>Premis (lajur kiri) dan kunci hurufnya</legend>
          {(s.premis ?? []).map((pm, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-4 font-semibold">{i + 1}</span>
              <input dir="auto" className={kotak} aria-label={`Premis ${i + 1}`} value={pm} onChange={(e) => ubah({ premis: s.premis!.map((x, j) => (j === i ? e.target.value : x)) })} />
              <select
                className="w-24 rounded-lg border p-2"
                aria-label={`Kunci premis ${i + 1}`}
                value={[s.kunci].flat()[i] ?? ""}
                onChange={(e) => ubah({ kunci: s.premis!.map((_, j) => (j === i ? e.target.value : ([s.kunci].flat()[j] ?? ""))) })}
              >
                <option value="">(kunci)</option>
                {(s.jawaban ?? []).map((_, j) => <option key={j}>{HURUF[j]}</option>)}
              </select>
            </div>
          ))}
          <p className="pt-1">Jawaban (lajur kanan, satu di antaranya pengecoh)</p>
          {(s.jawaban ?? []).map((jw, j) => (
            <div key={j} className="flex items-center gap-2">
              <span className="w-4 font-semibold">{HURUF[j]}</span>
              <input dir="auto" className={kotak} aria-label={`Jawaban ${HURUF[j]}`} value={jw} onChange={(e) => ubah({ jawaban: s.jawaban!.map((x, k) => (k === j ? e.target.value : x)) })} />
            </div>
          ))}
        </fieldset>
      )}

      {s.bentuk === "ISIAN" && (
        <>
          <label className="block">
            Kunci jawaban (singkat)
            <input dir="auto" className={kotak} value={String(s.kunci)} onChange={(e) => ubah({ kunci: e.target.value })} />
          </label>
          <label className="block">
            Jawaban lain yang diterima (satu per baris, boleh kosong)
            <textarea dir="auto" rows={2} className={kotak} value={(s.kunciAlt ?? []).join("\n")} onChange={(e) => ubah({ kunciAlt: e.target.value.split("\n") })} />
          </label>
        </>
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
                <StepAngka label="Skor" max={100} nilai={r.skor} ubah={(n) => ubah({ rubrik: s.rubrik!.map((x, j) => (j === i ? { ...x, skor: n } : x)) })} />
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
            <span className="mt-1 block"><StepAngka label="Skor" max={100} nilai={s.skor} ubah={(n) => ubah({ skor: n })} /></span>
          </label>
        )}
      </div>

      {tombolSimpan}
    </article>
  );
}

/** Soal kosong untuk "Tulis soal sendiri": bentuk sama dengan formulir Edit, TP pertama bab, skor bawaan bentuknya. */
function soalKosong(bentuk: Bentuk, bab: Bab, skor: number): Soal {
  const dasar = { bentuk, dalil_id: null, pertanyaan: "", pembahasan: "", level: "C2", tp: bab.tp[0]?.kode ?? "", skor } as Soal;
  if (bentuk === "PG") return { ...dasar, pilihan: ["", "", "", "", ""], kunci: "A" };
  if (bentuk === "PGK") return { ...dasar, pilihan: ["", "", "", "", ""], kunci: ["A", "B"] };
  if (bentuk === "BS") return { ...dasar, pernyataan: ["", "", "", ""], label: [...LABEL_KATEGORI[0]], kunci: ["", "", "", ""] };
  if (bentuk === "MJ") return { ...dasar, premis: ["", "", "", "", ""], jawaban: ["", "", "", "", "", ""], kunci: ["", "", "", "", ""] };
  if (bentuk === "ISIAN") return { ...dasar, kunci: "", kunciAlt: [] };
  return { ...dasar, kunci: "", rubrik: [{ kriteria: "", skor }] };
}

/**
 * "Tulis soal sendiri" (gelombang 2): soal tanpa AI, tidak memakai jatah. Tombol kecil di akhir bagian bentuknya
 * (atau pilihan bentuk lain bila `bentukLain` diisi); formulir = formulir Edit dengan isi kosong. Server
 * (`tambahSoalManual`) menyisipkannya di akhir bagian bentuk itu dan tetap memeriksanya dengan penjaga ayat.
 */
export function TulisSoalSendiri({ hasilId, bentuk, bentukLain, bab, skorBawaan, onSelesai }: { hasilId: number; bentuk?: Bentuk; bentukLain?: Bentuk[]; bab: Bab; skorBawaan: (b: Bentuk) => number; onSelesai: (no: number) => void }) {
  const [pilih, setPilih] = useState<Bentuk | null>(null);
  if (pilih)
    return (
      <FormSoal
        no={0}
        judul={`Soal baru (tulis sendiri): ${NAMA_BENTUK[pilih]}`}
        awal={soalKosong(pilih, bab, skorBawaan(pilih))}
        bab={bab}
        onBatal={() => setPilih(null)}
        onSimpan={async (isian) => {
          const r = await tambahSoalManual(hasilId, isian).catch(() => ({ ok: false as const, pesan: "Koneksi terputus. Coba lagi." }));
          if (!r.ok) return r.pesan;
          setPilih(null);
          onSelesai(r.no);
        }}
      />
    );
  const gaya = "h-10 rounded-lg border border-dashed bg-transparent px-4 text-sm text-pudar hover:border-hijau hover:text-hijau-teks max-md:min-h-11";
  if (bentuk) return <button className={gaya} onClick={() => setPilih(bentuk)}>+ Tulis soal {NAMA_BENTUK[bentuk]} sendiri</button>;
  if (!bentukLain?.length) return null;
  return (
    <label className="flex flex-wrap items-center gap-2 text-sm text-pudar">
      + Tulis soal bentuk lain:
      <select className="h-10 rounded-lg border bg-kartu px-2 text-sm text-tinta max-md:min-h-11" value="" onChange={(e) => e.target.value && setPilih(e.target.value as Bentuk)}>
        <option value="">Pilih bentuk…</option>
        {bentukLain.map((b) => <option key={b} value={b}>{NAMA_BENTUK[b]}</option>)}
      </select>
    </label>
  );
}
