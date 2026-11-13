"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import "katex/dist/katex.min.css";
import { gantiSatuSoal, hapusSoal, pindahSoal, simpanSoal, tambahSoalManual, tambahSoalSerupa } from "./actions";
import { StepAngka } from "./step-angka";
import { Gambar, gambarTempelan, TombolGambar, unggah } from "./gambar";
import { PotongGambar } from "./potong-gambar";
import { editRumus, isiKotak } from "./editor-rumus";
import { EditorTabel } from "./editor-tabel";
import { adaRumus, bukanDalil, CARA_DALIL, caraDalil, cariTabel, cocokCara, dalilKunci, kataArab, kataTerjemah, NAMA_CARA_DALIL, potonganSah, tampilanDalil, type CaraDalil, JOROK, kategoriBaru, KUNCI_PGK, LABEL_KATEGORI, LEVEL, mjLama, pecahBaris, POLA_ARAB, POLA_RUMUS, tulisTabel, type Bab, type Bentuk, type Soal } from "@/lib/soal";
import { MAKS_INSTRUKSI, namaBentuk } from "@/lib/prompt";

const PECAH_ARAB = new RegExp(`(${POLA_ARAB})`);
const PECAH_RUMUS = new RegExp(`(${POLA_RUMUS})`);
const HURUF = ["A", "B", "C", "D", "E", "F", "G"];
const kotak = "w-full rounded-lg border p-2 text-sm";
const tombol = "rounded-lg border bg-kartu h-8 px-3 text-sm hover:bg-krem disabled:opacity-50";

/** Teks campuran Latin + Arab + rumus: bagian Arab kanan-ke-kiri dengan font Arab, "$...$" jadi rumus. */
export function Teks({ teks }: { teks: string }) {
  return (
    <>
      {String(teks ?? "")
        .split(PECAH_RUMUS)
        .map((r, n) =>
          n % 2 ? (
            <Rumus key={n} tex={r.slice(1, -1)} />
          ) : (
            <Fragment key={n}>{r.split(PECAH_ARAB).map((b, i) => (i % 2 ? <bdi key={i} dir="rtl" lang="ar" className="font-arab text-xl">{b}</bdi> : b))}</Fragment>
          ),
        )}
    </>
  );
}

// KaTeX (±270 KB) dimuat hanya saat ada rumus di layar, sekali untuk semua kartu. Berjalan di browser guru, bukan di hosting.
let muatKatex: Promise<typeof import("katex")> | null = null;

/** Satu rumus LaTeX. Selama KaTeX dimuat (atau bila LaTeX-nya salah tulis) tampil teks aslinya, bukan error. */
function Rumus({ tex }: { tex: string }) {
  const [html, setHtml] = useState("");
  useEffect(() => {
    let hidup = true;
    (muatKatex ??= import("katex")).then((k) => hidup && setHtml(k.default.renderToString(tex, { throwOnError: false, strict: false })));
    return () => {
      hidup = false;
    };
  }, [tex]);
  return html ? <span data-tex={tex} dangerouslySetInnerHTML={{ __html: html }} /> : <span data-tex={tex} className="font-mono">{tex}</span>;
}

/** Kotak teks yang boleh diberi rumus (bukan pilihan radio/centang/angka). */
const bisaRumus = (t: unknown): t is HTMLTextAreaElement | HTMLInputElement =>
  t instanceof HTMLTextAreaElement || (t instanceof HTMLInputElement && t.type === "text");

/** Klik rumus di Pratinjau → jendela rumus; hasilnya mengganti "$...$" itu di kotak teks pemiliknya (label/fieldset yang sama). */
async function ubahRumusDiPratinjau(e: React.MouseEvent<HTMLElement>) {
  const tex = (e.target as Element).closest("[data-tex]")?.getAttribute("data-tex");
  if (tex == null) return;
  e.preventDefault(); // klik di dalam <label> jangan memindah fokus ke kotaknya
  const cari = `$${tex}$`;
  const wadah = e.currentTarget.closest("label, fieldset") ?? document;
  const el = [...wadah.querySelectorAll<HTMLTextAreaElement | HTMLInputElement>("textarea, input")].find((x) => x.value.includes(cari));
  if (!el) return;
  const baru = await editRumus(tex);
  if (baru === null) return;
  const i = el.value.indexOf(cari);
  const sisip = baru ? `$${baru}$` : "";
  isiKotak(el, el.value.slice(0, i) + sisip + el.value.slice(i + cari.length), i + sisip.length);
}

/**
 * Pratinjau di form Edit: tampil hanya bila teksnya memuat rumus "$...$" atau tabel, supaya guru melihat hasilnya saat
 * mengetik. Klik tabel → jendela Ubah tabel (ditangani FormSoal lewat `data-pratinjau`).
 */
function Pratinjau({ teks }: { teks: string }) {
  const tabel = pecahBaris(teks).some((b) => b.tabel);
  if (!adaRumus(teks) && !tabel) return null;
  return (
    <div
      data-pratinjau
      className="mt-1 rounded-lg bg-krem px-2 py-1 [&_[data-tex]]:cursor-pointer [&_[data-tex]]:rounded [&_[data-tex]:hover]:bg-hijau-muda [&_[data-tabel]]:cursor-pointer [&_[data-tabel]:hover]:outline-2 [&_[data-tabel]:hover]:outline-hijau"
      onClick={ubahRumusDiPratinjau}
    >
      <span className="text-sm text-pudar">Pratinjau (klik {tabel ? (adaRumus(teks) ? "rumus atau tabel" : "tabel") : "rumus"} untuk mengubahnya): </span>
      <TeksBaris teks={teks} />
    </div>
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
  if (baris.length <= 1 && !baris[0]?.tabel) return <Teks teks={baris[0]?.teks ?? ""} />;
  let n = 0; // nomor urut tabel di teks ini (Pratinjau: klik tabel ke-n → jendela Ubah tabel)
  return (
    <>
      {baris.map((b, i) =>
        b.tabel ? (
          <TabelData key={i} isi={b.tabel} n={n++} />
        ) : i === 0 ? (
          <span key={i}><Teks teks={b.teks} /></span>
        ) : b.arab ? (
          <span key={i} dir="rtl" className={`block text-right ${jarak ? "mt-2" : ""}`}><Teks teks={b.teks} /></span>
        ) : (
          <span key={i} className={`block ${jarak ? "mt-2" : ""}`}><Teks teks={b.teks} /></span>
        ),
      )}
    </>
  );
}

/**
 * Tabel data di soal/wacana/pembahasan (0.28.0). Baris pertama = judul kolom. HP: tabel lebar digeser ke samping.
 * Sel berawalan JOROK (0.41.0) menjorok ke kanan, mis. akun kredit di jurnal umum.
 */
function TabelData({ isi, n }: { isi: string[][]; n: number }) {
  const [judul, ...badan] = isi;
  const jorok = (t: string) => t.startsWith(JOROK);
  return (
    <div className="my-2 overflow-x-auto" data-tabel={n}>
      <table className="border-collapse text-sm">
        <thead>
          <tr>{judul.map((t, i) => <th key={i} className={`border bg-krem py-1 pr-2 text-left font-semibold ${jorok(t) ? "pl-8" : "pl-2"}`}><Teks teks={t.replace(JOROK, "")} /></th>)}</tr>
        </thead>
        <tbody>
          {badan.map((b, i) => <tr key={i}>{b.map((t, j) => <td key={j} className={`border py-1 pr-2 ${jorok(t) ? "pl-8" : "pl-2"}`}><Teks teks={t.replace(JOROK, "")} /></td>)}</tr>)}
        </tbody>
      </table>
    </div>
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

/** Teks kunci di kotak kunci & pembahasan. */
function kunciTampil(s: Soal) {
  const k = [s.kunci].flat();
  if (mjLama(s)) return `${k[0] ?? "?"} (${s.jawaban?.[HURUF.indexOf(String(k[0] ?? "").toUpperCase())] ?? "?"})`;
  if (s.bentuk === "MJ") return k.map((h, i) => `${i + 1}-${h}`).join(", ");
  return k.join(", ");
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
    const isi = (x: Soal) => JSON.stringify([x.pertanyaan, x.pilihan, x.pernyataan, x.kunci, x.pembahasan, x.dalil_id, x.dalil_tampil, x.dalil_potong, x.gambar_id]);
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

  // 0.42.0: yang tampil di soal mengikuti cara tampil dalil (Arab/terjemah/potongan); dalil lengkap di kotak kunci.
  const tampil = tampilanDalil(s, bab);
  const dalilLengkap = dalilKunci(s, bab);
  return (
    <>
    {nomorGrup && mjLama(s) && (
      <section className="space-y-1 rounded-xl border border-hijau/40 bg-hijau-muda/40 p-4 text-sm" aria-label={`Daftar jawaban menjodohkan nomor ${nomorGrup}`}>
        <p className="font-semibold">Pasangkan pernyataan nomor {nomorGrup} dengan jawaban yang tepat!</p>
        <ol className="space-y-1">
          {(s.jawaban ?? []).map((j, i) => (
            <li key={i} className="flex gap-2">
              <span className="w-5 shrink-0 font-semibold">{HURUF[i]}.</span>
              <span><TeksBaris teks={j} /></span>
            </li>
          ))}
        </ol>
      </section>
    )}
    {nomorGrup && s.wacana && (
      <section className="space-y-1 rounded-xl border border-hijau/40 bg-hijau-muda/40 p-4 text-sm" aria-label={`Wacana soal nomor ${nomorGrup}`}>
        <p className="font-semibold">Bacalah teks berikut untuk menjawab soal nomor {nomorGrup}!</p>
        <div><TeksBaris teks={s.wacana} jarak /></div>
      </section>
    )}
    <article id={`soal-${no}`} className={`scroll-mt-4 space-y-2 rounded-xl border p-4 ${s.peringatan?.length ? "border-bahaya-garis bg-bahaya-muda" : "bg-kartu"} ${mengganti ? "opacity-50" : ""}`}>
      {s.peringatan?.map((w, i) => (
        <p key={i} className="text-sm font-semibold text-bahaya"><TeksPeringatan w={w} /></p>
      ))}
      <div>
        <span className="font-semibold">{no}.</span> <TeksBaris teks={s.pertanyaan} />
      </div>
      {!!s.gambar_id && (
        <Gambar id={s.gambar_id} alt={bab.gambar?.find((g) => g.id === s.gambar_id)?.keterangan || `Gambar soal nomor ${no}`} className="max-h-80 max-w-full rounded-lg border bg-kartu" />
      )}
      {tampil && (
        <figure className="rounded bg-krem p-3">
          {tampil.arab && <p dir="rtl" lang="ar" className="font-arab text-2xl">{tampil.arab}</p>}
          {tampil.terjemah && <p className={tampil.arab ? "mt-2" : ""}>“{tampil.terjemah}”</p>}
          <figcaption className="mt-1 text-xs text-pudar">{tampil.bukan ? "Teks Arab materi" : [tampil.sumber, "teks terverifikasi"].filter(Boolean).join(" · ")}</figcaption>
        </figure>
      )}
      {s.pilihan && (
        <ol className="list-[upper-alpha] space-y-1 pl-6">
          {s.pilihan.map((o, i) => <li key={i}><TeksBaris teks={o} /></li>)}
        </ol>
      )}
      {s.bentuk === "MJ" && !mjLama(s) && <TabelJodoh s={s} kunci={tampilKunci} />}
      {kategoriBaru(s) && <TabelKategori s={s} kunci={tampilKunci} />}
      {tampilKunci && (
      <div className="space-y-1 rounded bg-hijau-muda p-3 text-sm">
        {!kategoriBaru(s) && <p><span className="font-semibold">Kunci:</span> <Teks teks={kunciTampil(s)} /></p>}
        {!!s.kunciAlt?.length && <p><span className="font-semibold">Jawaban lain yang diterima:</span> <Teks teks={s.kunciAlt.join("; ")} /></p>}
        {s.rubrik && (
          <ul className="list-disc pl-5">
            {s.rubrik.map((r, i) => <li key={i}><Teks teks={r.kriteria} /> ({r.skor})</li>)}
          </ul>
        )}
        <div><span className="font-semibold">Pembahasan:</span> <TeksBaris teks={s.pembahasan} /></div>
        {dalilLengkap && (
          <div className="space-y-1 border-t border-hijau/30 pt-1">
            <p className="font-semibold">Dalil ({dalilLengkap.sumber}):</p>
            <p dir="rtl" lang="ar" className="font-arab text-xl">{dalilLengkap.arab}</p>
            {dalilLengkap.terjemah && <p>“{dalilLengkap.terjemah}”</p>}
          </div>
        )}
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
      {lainnya && s.bentuk === "MJ" && (
      <div className="space-y-2 rounded-lg border bg-krem p-3">
        <p className="text-sm text-pudar">Daftar jawaban menjodohkan dipakai bersama, jadi nomor ini tidak bisa diganti atau diubah AI. Perbaiki lewat Edit.</p>
        {onSetBerubah && (
          <button className={`${tombol} text-bahaya`} disabled={mengganti} onClick={() => ubahJumlah("hapus")}>
            {proses === "hapus" ? "Menghapus..." : "Hapus soal ini"}
          </button>
        )}
      </div>
      )}
      {lainnya && s.bentuk !== "MJ" && (
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
        <p className={`text-sm ${habisAI ? "font-semibold text-bahaya" : "text-pudar"}`}>
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

/**
 * Dalil di form Edit / Tulis soal sendiri (0.42.0, ATURAN-SOAL 5a): dalil, cara tampil, dan potongan (nomor kata).
 * Cara yang tidak bisa dipakai dalil itu (mis. hadis tanpa terjemah) tidak ditawarkan; teksnya selalu dari data.
 */
function PilihDalil({ s, bab, ubah }: { s: Soal; bab: Bab; ubah: (x: Partial<Soal>) => void }) {
  const d = bab.dalil.find((x) => x.id === s.dalil_id);
  const cara = d ? caraDalil(s, d) : null;
  const kata = d && cara === "potong" ? kataArab(d) : d && cara === "potong-terjemah" ? kataTerjemah(d) : [];
  const [awal, akhir] = potonganSah(s.dalil_potong, kata.length) ?? [1, kata.length];
  const angka = "w-20 rounded-lg border p-2";
  return (
    <fieldset className="space-y-2">
      <legend>Dalil (teks terverifikasi, bukan ketikan AI)</legend>
      <div className="flex flex-wrap gap-2">
        <select aria-label="Dalil" className={`${kotak} min-w-0 flex-1`} value={s.dalil_id ?? ""} onChange={(e) => ubah({ dalil_id: e.target.value || null, dalil_potong: null })}>
          <option value="">(tidak ada)</option>
          {bab.dalil.map((x) => <option key={x.id} value={x.id}>{bukanDalil(x) ? `Teks Arab materi: ${x.arab.slice(0, 40)}` : x.sumber}</option>)}
        </select>
        {d && (
          <select aria-label="Cara tampil dalil" className="rounded-lg border p-2 text-sm" value={cara ?? "arab"} onChange={(e) => ubah({ dalil_tampil: e.target.value as CaraDalil, dalil_potong: null })}>
            {CARA_DALIL.filter((c) => cocokCara(c, d)).map((c) => <option key={c} value={c}>{NAMA_CARA_DALIL[c]}</option>)}
          </select>
        )}
      </div>
      {kata.length > 0 && (
        <div className="space-y-1">
          <p className="text-pudar">Potongan: kata ke</p>
          <div className="flex flex-wrap items-center gap-2">
            <input type="number" aria-label="Kata awal potongan" className={angka} min={1} max={kata.length} value={awal} onChange={(e) => ubah({ dalil_potong: [Number(e.target.value), Math.max(Number(e.target.value), akhir)] })} />
            <span>sampai</span>
            <input type="number" aria-label="Kata akhir potongan" className={angka} min={awal} max={kata.length} value={akhir} onChange={(e) => ubah({ dalil_potong: [awal, Number(e.target.value)] })} />
            <span className="text-pudar">dari {kata.length} kata</span>
          </div>
          <p dir={cara === "potong" ? "rtl" : undefined} lang={cara === "potong" ? "ar" : undefined} className={`rounded bg-krem p-2 ${cara === "potong" ? "font-arab text-xl" : ""}`}>{kata.slice(awal - 1, akhir).join(" ")}</p>
        </div>
      )}
    </fieldset>
  );
}

/**
 * Gambar soal di form Edit / Tulis soal sendiri (0.30.0): tanpa gambar, salah satu gambar materi, atau unggah/tempel
 * gambar baru (server mencatatnya di materi set ini bila milik pemilik set).
 */
function PilihGambar({ bab, nilai, ubah }: { bab: Bab; nilai: number | null; ubah: (id: number | null) => void }) {
  const [baru, setBaru] = useState<number[]>([]);
  const [proses, setProses] = useState(false);
  const [pesan, setPesan] = useState("");
  const daftar = [...new Set([...(bab.gambar ?? []).map((g) => g.id), ...(nilai ? [nilai] : []), ...baru])];
  async function tambah(f: Blob[]) {
    if (!f[0] || proses) return;
    setProses(true);
    setPesan("");
    try {
      const id = await unggah(f[0]);
      setBaru([...baru, id]);
      ubah(id);
    } catch (e) {
      setPesan((e as Error).message);
    }
    setProses(false);
  }
  const pilihan = (aktif: boolean) => `rounded-lg border-2 p-1 ${aktif ? "border-hijau bg-hijau-muda" : "border-batas hover:bg-krem"}`;
  return (
    <fieldset
      tabIndex={0}
      className="space-y-1 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-hijau"
      onPaste={(e) => {
        const f = gambarTempelan(e);
        if (f.length) void tambah(f);
      }}
    >
      <legend>Gambar soal (tampil di bawah pertanyaan)</legend>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" aria-pressed={!nilai} className={`${pilihan(!nilai)} h-[5.5rem] w-[7.5rem] text-sm`} onClick={() => ubah(null)}>
          Tanpa gambar
        </button>
        {daftar.map((id, i) => (
          <button key={id} type="button" aria-pressed={nilai === id} aria-label={`Pakai gambar ${i + 1}`} className={pilihan(nilai === id)} onClick={() => ubah(id)}>
            <Gambar id={id} alt={bab.gambar?.find((g) => g.id === id)?.keterangan} className="h-20 w-28 object-contain" />
          </button>
        ))}
        <TombolGambar label={proses ? "Mengunggah..." : "Unggah gambar lain"} banyak={false} disabled={proses} onPilih={tambah} />
      </div>
      {/* Potongan = gambar baru untuk soal ini saja; gambar asli tetap di set (soal lain yang memakainya tidak berubah). */}
      {nilai && (
        <PotongGambar
          id={nilai}
          nomor={daftar.indexOf(nilai) + 1}
          selesai={(id) => {
            setBaru([...baru, id]);
            ubah(id);
          }}
        />
      )}
      <p className="text-sm text-pudar">Bisa juga: klik bagian ini lalu tempel gambar (Ctrl+V).</p>
      {pesan && <p className="text-sm text-bahaya" role="alert">{pesan}</p>}
    </fieldset>
  );
}

function FormSoal({ no, awal, bab, onBatal, onSimpan, judul }: FormProps) {
  const [s, setS] = useState<Soal>(structuredClone(awal));
  const [menyimpan, setMenyimpan] = useState(false);
  const [error, setError] = useState("");
  const ubah = (sebagian: Partial<Soal>) => setS({ ...s, ...sebagian });
  const kunciPgk = [s.kunci].flat();
  // Kotak teks terakhir yang disentuh guru: tujuan tombol "Σ Rumus".
  const terakhir = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);
  // Kotak teks panjang terakhir yang disentuh: tujuan tombol "▦ Tabel" (kotak satu baris tidak bisa berisi tabel).
  const terakhirPanjang = useRef<HTMLTextAreaElement | null>(null);
  const catatFokus = (e: React.FocusEvent) => {
    if ((e.target as Element).closest("dialog")) return; // kotak di jendela Ubah tabel bukan tujuan Σ Rumus
    if (bisaRumus(e.target)) terakhir.current = e.target;
    if (e.target instanceof HTMLTextAreaElement) terakhirPanjang.current = e.target;
  };

  // Jendela Ubah tabel (0.41.0): kotak teks pemilik tabel + letak teks tabelnya (isi null = tabel baru di posisi kursor).
  const [tabel, setTabel] = useState<{ el: HTMLTextAreaElement; awal: number; akhir: number; isi: string[][] | null } | null>(null);

  /** Klik tabel di Pratinjau → buka tabel ke-n dari kotak teks pemiliknya (label yang sama). Klik rumus di sel = jendela rumus. */
  function bukaTabelDiPratinjau(e: React.MouseEvent<HTMLElement>) {
    const t = e.target as Element;
    const kotakTabel = t.closest("[data-pratinjau] [data-tabel]");
    if (!kotakTabel || t.closest("[data-tex]")) return;
    e.preventDefault();
    const el = kotakTabel.closest("label, fieldset")?.querySelector("textarea");
    const k = el && cariTabel(el.value)[Number(kotakTabel.getAttribute("data-tabel"))];
    if (k) setTabel({ el, ...k });
  }

  /** Tombol "▦ Tabel": kursor di dalam teks tabel = ubah tabel itu; selain itu sisipkan tabel baru di posisi kursor. */
  function sisipTabel(e: React.MouseEvent<HTMLElement>) {
    const form = e.currentTarget.closest("article");
    const aktif = document.activeElement;
    const el = aktif instanceof HTMLTextAreaElement && form?.contains(aktif) ? aktif : terakhirPanjang.current?.isConnected ? terakhirPanjang.current : form?.querySelector("textarea");
    if (!el) return;
    const a = el.selectionStart ?? el.value.length;
    const k = cariTabel(el.value).find((x) => x.awal <= a && a <= x.akhir);
    setTabel(k ? { el, ...k } : { el, awal: a, akhir: el.selectionEnd ?? a, isi: null });
  }

  /** Hasil jendela Ubah tabel → teks "| a | b |" menggantikan tabel lama (atau disisipkan di baris sendiri). [] = hapus. */
  function selesaiTabel(isi: string[][] | null) {
    const t = tabel;
    setTabel(null);
    if (!t || isi === null || !t.el.isConnected) return;
    if (!t.isi && isi.flat().every((x) => !x.replace(JOROK, "").trim())) return; // tabel baru yang dibiarkan kosong
    const v = t.el.value;
    let sisip = isi.length ? tulisTabel(isi) : "";
    if (sisip && !t.isi) {
      if (t.awal > 0 && v[t.awal - 1] !== "\n") sisip = `\n${sisip}`;
      if (t.akhir < v.length && v[t.akhir] !== "\n") sisip += "\n";
    }
    isiKotak(t.el, v.slice(0, t.awal) + sisip + v.slice(t.akhir), t.awal + sisip.length);
  }

  /** Sisipkan rumus di posisi kursor; bila kursor di dalam "$...$", rumus itu yang dibuka untuk diubah. */
  async function sisipRumus(e: React.MouseEvent<HTMLElement>) {
    const form = e.currentTarget.closest("article");
    const aktif = document.activeElement; // tombol ini tidak mengambil fokus (onMouseDown), jadi kursor guru masih di kotaknya
    const el = bisaRumus(aktif) && form?.contains(aktif) ? aktif : terakhir.current?.isConnected ? terakhir.current : form?.querySelector("textarea");
    if (!el) return;
    const v = el.value;
    const a = el.selectionStart ?? v.length;
    const m = [...v.matchAll(new RegExp(POLA_RUMUS, "g"))].find((x) => x.index <= a && a <= x.index + x[0].length);
    const [i, j] = m ? [m.index, m.index + m[0].length] : [a, el.selectionEnd ?? a];
    const tex = await editRumus(m ? m[0].slice(1, -1) : "");
    if (tex === null) return;
    // Spasi pemisah supaya "$" tidak menempel ke kata/angka (syarat POLA_RUMUS)
    const kiri = !m && tex && i > 0 && !/\s/.test(v[i - 1]) ? " " : "";
    const kanan = !m && tex && j < v.length && /[\p{L}\p{N}]/u.test(v[j]) ? " " : "";
    const sisip = tex ? `${kiri}$${tex}$${kanan}` : "";
    isiKotak(el, v.slice(0, i) + sisip + v.slice(j), i + sisip.length);
  }

  async function simpan() {
    if (s.bentuk === "PGK" && !KUNCI_PGK.includes(kunciPgk.length)) return setError("Pilih 2 sampai 4 kunci jawaban.");
    if (kategoriBaru(s) && (s.pernyataan ?? []).some((_, i) => !s.label?.includes(kunciPgk[i]))) return setError("Pilih kunci untuk setiap pernyataan.");
    setMenyimpan(true);
    setError((await onSimpan(s)) ?? "");
    setMenyimpan(false);
  }

  // Simpan/Batal juga di atas: form ini tinggi, di HP tombol bawah jauh dari pandangan (audit 2026-11-04).
  const tombolSimpan = (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        className="rounded-lg border h-10 px-3"
        title="Sisipkan rumus di posisi kursor (kursor di dalam $...$ = ubah rumus itu)"
        onMouseDown={(e) => e.preventDefault()}
        onClick={sisipRumus}
      >
        Σ Rumus
      </button>
      <button
        type="button"
        className="rounded-lg border h-10 px-3"
        title="Sisipkan tabel di posisi kursor (kursor di dalam tabel = ubah tabel itu)"
        onMouseDown={(e) => e.preventDefault()}
        onClick={sisipTabel}
      >
        ▦ Tabel
      </button>
      <button className="rounded-lg bg-hijau h-10 px-4 font-semibold text-white disabled:opacity-50" disabled={menyimpan} onClick={simpan}>
        {menyimpan ? "Menyimpan..." : "Simpan"}
      </button>
      <button className="rounded-lg border h-10 px-4" disabled={menyimpan} onClick={onBatal}>Batal</button>
      {error && <p className="self-center text-bahaya">{error}</p>}
    </div>
  );
  return (
    <article className="space-y-3 rounded-lg border-2 border-hijau p-4 text-sm" onFocus={catatFokus} onClick={bukaTabelDiPratinjau}>
      {tabel && <EditorTabel awal={tabel.isi} selesai={selesaiTabel} />}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="font-semibold">{judul ?? `Edit soal nomor ${no}`}</p>
        {tombolSimpan}
      </div>

      {s.grup && s.wacana !== undefined && (
        <label className="block">
          Wacana grup (dipakai bersama semua soal di grup ini; perubahan ikut ke soal lain di grup)
          <textarea dir="auto" rows={6} className={kotak} value={s.wacana} onChange={(e) => ubah({ wacana: e.target.value })} />
          <Pratinjau teks={s.wacana} />
        </label>
      )}

      <label className="block">
        {mjLama(s) ? "Pernyataan (lajur kiri)" : s.bentuk === "BS" && !kategoriBaru(s) ? "Pernyataan (dinilai benar atau salah)" : "Pertanyaan"}
        <textarea dir="auto" rows={4} className={kotak} value={s.pertanyaan} onChange={(e) => ubah({ pertanyaan: e.target.value })} />
        <Pratinjau teks={s.pertanyaan} />
      </label>

      <PilihDalil s={s} bab={bab} ubah={ubah} />

      {!mjLama(s) && s.bentuk !== "MJ" && <PilihGambar bab={bab} nilai={s.gambar_id ?? null} ubah={(gambar_id) => ubah({ gambar_id })} />}

      {s.pilihan && (
        <fieldset className="space-y-1">
          <legend>Pilihan jawaban (centang kunci{s.bentuk === "PGK" ? ", 2 sampai 4" : ""})</legend>
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
          <Pratinjau teks={s.pilihan.map((o, i) => `${HURUF[i]}. ${o}`).join("\n")} />
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
          <Pratinjau teks={(s.pernyataan ?? []).map((p, i) => `${i + 1}. ${p}`).join("\n")} />
        </fieldset>
      )}

      {mjLama(s) && (
        <fieldset className="space-y-2">
          <label className="block">
            Kunci (huruf jawaban)
            <select className={kotak} value={String(s.kunci)} onChange={(e) => ubah({ kunci: e.target.value })}>
              <option value="">(kunci)</option>
              {(s.jawaban ?? []).map((_, j) => <option key={j}>{HURUF[j]}</option>)}
            </select>
          </label>
          <p className="pt-1">Daftar jawaban (dipakai bersama nomor menjodohkan lain di blok ini; perubahan ikut ke nomor lain)</p>
          {(s.jawaban ?? []).map((jw, j) => (
            <div key={j} className="flex items-center gap-2">
              <span className="w-4 font-semibold">{HURUF[j]}</span>
              <input dir="auto" className={kotak} aria-label={`Jawaban ${HURUF[j]}`} value={jw} onChange={(e) => ubah({ jawaban: s.jawaban!.map((x, k) => (k === j ? e.target.value : x)) })} />
            </div>
          ))}
          <Pratinjau teks={(s.jawaban ?? []).map((jw, j) => `${HURUF[j]}. ${jw}`).join("\n")} />
        </fieldset>
      )}

      {s.bentuk === "MJ" && !mjLama(s) && (
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
          <Pratinjau teks={(s.jawaban ?? []).map((jw, j) => `${HURUF[j]}. ${jw}`).join("\n")} />
        </fieldset>
      )}

      {s.bentuk === "ISIAN" && (
        <>
          <label className="block">
            Kunci jawaban (singkat)
            <input dir="auto" className={kotak} value={String(s.kunci)} onChange={(e) => ubah({ kunci: e.target.value })} />
            <Pratinjau teks={String(s.kunci)} />
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
            <Pratinjau teks={String(s.kunci)} />
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
        <Pratinjau teks={s.pembahasan} />
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
function soalKosong(bentuk: Bentuk, bab: Bab, skor: number, tka: boolean): Soal {
  const dasar = { bentuk, dalil_id: null, pertanyaan: "", pembahasan: "", level: "C2", tp: bab.tp[0]?.kode ?? "", skor } as Soal;
  if (bentuk === "PG") return { ...dasar, pilihan: ["", "", "", "", ""], kunci: "A" };
  if (bentuk === "PGK") return { ...dasar, pilihan: ["", "", "", "", ""], kunci: ["A", "B"] };
  // Benar/Salah: gaya lama Al-Fatah (satu pernyataan) untuk jenis madrasah; Kategori 3 pernyataan untuk Latihan TKA.
  if (bentuk === "BS") return tka ? { ...dasar, pernyataan: ["", "", ""], label: [...LABEL_KATEGORI[0]], kunci: ["", "", ""] } : { ...dasar, kunci: "Benar" };
  if (bentuk === "MJ") return { ...dasar, premis: ["", "", "", "", ""], jawaban: ["", "", "", "", "", ""], kunci: ["", "", "", "", ""] };
  if (bentuk === "ISIAN") return { ...dasar, kunci: "", kunciAlt: [] };
  return { ...dasar, kunci: "", rubrik: [{ kriteria: "", skor }] };
}

/**
 * "Tulis soal sendiri" (gelombang 2): soal tanpa AI, tidak memakai jatah. Tombol kecil di akhir bagian bentuknya
 * (atau pilihan bentuk lain bila `bentukLain` diisi); formulir = formulir Edit dengan isi kosong. Server
 * (`tambahSoalManual`) menyisipkannya di akhir bagian bentuk itu dan tetap memeriksanya dengan penjaga ayat.
 */
export function TulisSoalSendiri({ hasilId, bentuk, bentukLain, bab, tka, skorBawaan, onSelesai }: { hasilId: number; bentuk?: Bentuk; bentukLain?: Bentuk[]; bab: Bab; tka: boolean; skorBawaan: (b: Bentuk) => number; onSelesai: (no: number) => void }) {
  const [pilih, setPilih] = useState<Bentuk | null>(null);
  if (pilih)
    return (
      <FormSoal
        no={0}
        judul={`Soal baru (tulis sendiri): ${namaBentuk(pilih, tka)}`}
        awal={soalKosong(pilih, bab, skorBawaan(pilih), tka)}
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
  if (bentuk === "MJ") return null; // menjodohkan (daftar jawaban bersama) tidak ditulis satu per satu
  if (bentuk) return <button className={gaya} onClick={() => setPilih(bentuk)}>+ Tulis soal {namaBentuk(bentuk, tka)} sendiri</button>;
  if (!bentukLain?.length) return null;
  return (
    <label className="flex flex-wrap items-center gap-2 text-sm text-pudar">
      + Tulis soal bentuk lain:
      <select className="h-10 rounded-lg border bg-kartu px-2 text-sm text-tinta max-md:min-h-11" value="" onChange={(e) => e.target.value && setPilih(e.target.value as Bentuk)}>
        <option value="">Pilih bentuk…</option>
        {bentukLain.filter((b) => b !== "MJ").map((b) => <option key={b} value={b}>{namaBentuk(b, tka)}</option>)}
      </select>
    </label>
  );
}
