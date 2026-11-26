"use client";

import { useState } from "react";
import { angka, FORMAT_ASAS, type BentukLjk } from "@/lib/koreksi";
import { HURUF, LJK } from "@/lib/ljk";
import { tanya } from "../tanya";
import { buatUjian } from "./actions";

type Isian<K extends string> = Record<K, string>;
const keTeks = <K extends string>(o: Readonly<Record<K, number>>) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, String(v).replace(".", ",")])) as Isian<K>;
/** Teks ketikan → angka; kosong/tidak terbaca = 0 (tanpa menulis 0 di kotaknya). */
const angkaDari = (t: string) => Math.max(0, Number(String(t).replace(",", ".")) || 0);

/** Kotak angka yang boleh kosong saat diganti (bukan type="number": koma desimal & 0 yang menempel). */
function KotakAngka({ nilai, ubah, label, className = "" }: { nilai: string; ubah: (v: string) => void; label: string; className?: string }) {
  return (
    <input
      inputMode="decimal"
      value={nilai}
      aria-label={label}
      onChange={(e) => ubah(e.target.value.replace(/[^\d.,]/g, "").slice(0, 5))}
      onFocus={(e) => e.target.select()}
      className={`h-10 rounded-lg border bg-kartu px-2 ${className}`}
    />
  );
}

const NAMA: Record<BentukLjk, string> = { PG: "PG", PGK: "PG kompleks", BS: "B/S & jodohkan" };

/** Ujian baru: nama, kelas, kunci (dari set Racik Soal atau diketuk sendiri), skor esai. */
export function FormUjianBaru({ kelas, set, admin, terbuka }: { kelas: string[]; set: { id: number; nama: string; info: string }[]; admin: boolean; terbuka: boolean }) {
  const [buka, setBuka] = useState(terbuka);
  const [nama, setNama] = useState("");
  const [kls, setKls] = useState("");
  const [sumber, setSumber] = useState<"set" | "ketik">(set.length ? "set" : "ketik");
  const [setId, setSetId] = useState(set[0]?.id ?? 0);
  const [format, setFormat] = useState<keyof typeof FORMAT_ASAS | null>("nonEksak");
  // Isian angka disimpan sebagai TEKS ketikan guru: boleh kosong saat diganti (dulu langsung jadi 0 yang tak bisa dihapus).
  const [jumlahT, setJumlah] = useState<Isian<BentukLjk>>(keTeks(FORMAT_ASAS.nonEksak.jumlah));
  const [skorT, setSkor] = useState<Isian<BentukLjk>>(keTeks(FORMAT_ASAS.nonEksak.skor));
  const [kunci, setKunci] = useState<number[][]>([]);
  const [esaiT, setEsai] = useState<Isian<"jumlah" | "skor">>(keTeks(FORMAT_ASAS.nonEksak.esai));
  const [pesan, setPesan] = useState("");
  const [proses, setProses] = useState(false);

  if (!kelas.length)
    return (
      <p className="rounded-xl border border-peringatan-garis bg-peringatan-muda p-4 text-sm text-peringatan">
        Daftar siswa belum diisi. {admin ? <a href="/admin/siswa" className="underline">Isi daftar siswa</a> : "Mohon hubungi admin untuk mengisi daftar siswa per kelas."}
      </p>
    );
  if (!buka)
    return (
      <button onClick={() => setBuka(true)} className="h-11 rounded-lg bg-hijau px-5 font-semibold text-white hover:bg-hijau-tua">
        + Ujian baru
      </button>
    );

  const jumlah = { PG: Math.min(LJK.soal, angkaDari(jumlahT.PG)), PGK: Math.min(LJK.soal, angkaDari(jumlahT.PGK)), BS: Math.min(LJK.soal, angkaDari(jumlahT.BS)) };
  const skor = { PG: angkaDari(skorT.PG), PGK: angkaDari(skorT.PGK), BS: angkaDari(skorT.BS) };
  const esai = { jumlah: angkaDari(esaiT.jumlah), skor: angkaDari(esaiT.skor) };
  const bentuk: BentukLjk[] = (["PG", "PGK", "BS"] as const).flatMap((b) => Array(Math.floor(jumlah[b])).fill(b));
  const objektif = bentuk.reduce((s, b) => s + skor[b], 0);
  const lebih = bentuk.length > LJK.soal;
  const total = Math.round((objektif + esai.jumlah * esai.skor) * 100) / 100;

  function pakaiFormat(f: keyof typeof FORMAT_ASAS) {
    setFormat(f);
    setJumlah(keTeks(FORMAT_ASAS[f].jumlah));
    setSkor(keTeks(FORMAT_ASAS[f].skor));
    setEsai(keTeks(FORMAT_ASAS[f].esai));
  }

  function ketuk(n: number, h: number) {
    setKunci((k) => {
      const baru = [...k];
      const lama = baru[n] ?? [];
      baru[n] = bentuk[n] === "PGK" ? (lama.includes(h) ? lama.filter((x) => x !== h) : [...lama, h]) : [h];
      return baru;
    });
  }

  async function kirim() {
    setPesan("");
    if (!nama.trim() || !kls) return setPesan("Isi nama ujian dan pilih kelas.");
    let input: Parameters<typeof buatUjian>[0] = { nama, kelas: kls, setId };
    if (sumber === "ketik") {
      if (!bentuk.length || lebih) return setPesan(`Jumlah soal pilihan harus 1–${LJK.soal}.`);
      const kosong = bentuk.findIndex((_, i) => !kunci[i]?.length);
      if (kosong >= 0) return setPesan(`Kunci nomor ${kosong + 1} belum diisi.`);
      input = { nama, kelas: kls, kunci: bentuk.map((b, i) => ({ bentuk: b, kunci: kunci[i], skor: skor[b] })), esaiMaks: esai.jumlah * esai.skor };
      if (total !== 100 && !(await tanya(`Total skor ${angka(total)}, bukan 100. Nilai siswa nanti juga tidak berskala 100. Tetap buat ujian?`, { judul: "Total skor bukan 100", ya: "Tetap buat", tidak: "Perbaiki dulu" }))) return;
    }
    setProses(true);
    const r = await buatUjian(input).catch(() => ({ ok: false as const, pesan: "Koneksi terputus. Coba lagi." }));
    if (r.ok) location.assign(`/koreksi/${r.id}`);
    else {
      setPesan(r.pesan);
      setProses(false);
    }
  }

  const kotak = "h-10 w-full rounded-lg border bg-kartu px-3";
  return (
    <section className="space-y-4 rounded-xl border bg-kartu p-4">
      <h2 className="text-xl">Ujian baru</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Nama ujian
          <input value={nama} onChange={(e) => setNama(e.target.value)} maxLength={80} placeholder="ASAS Fiqih XI B" className={`mt-1 ${kotak}`} />
        </label>
        <label className="text-sm">
          Kelas
          <select value={kls} onChange={(e) => setKls(e.target.value)} className={`mt-1 ${kotak}`}>
            <option value="">Pilih kelas</option>
            {kelas.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-2">
        <p className="text-sm">Kunci jawaban</p>
        <div className="grid grid-cols-2 gap-2">
          {(["set", "ketik"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSumber(s)}
              disabled={s === "set" && !set.length}
              className={`h-11 rounded-lg border px-3 text-sm disabled:opacity-50 ${sumber === s ? "border-hijau bg-hijau-muda font-semibold text-hijau-teks" : ""}`}
            >
              {s === "set" ? "Dari Racik Soal" : "Isi sendiri"}
            </button>
          ))}
        </div>
        {sumber === "set" ? (
          <>
            {/* Daftar kartu, bukan <select>: judul set panjang (gabungan bab, huruf Arab) melebar keluar layar. */}
            <div role="radiogroup" aria-label="Pilih set soal" className="max-h-72 space-y-1 overflow-y-auto rounded-lg border bg-krem p-1">
              {set.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  role="radio"
                  aria-checked={setId === s.id}
                  onClick={() => setSetId(s.id)}
                  className={`block w-full rounded-md border px-3 py-2 text-left ${setId === s.id ? "border-hijau bg-hijau-muda" : "border-transparent hover:bg-krem-sorot"}`}
                >
                  <span dir="auto" title={s.nama} className={`line-clamp-2 text-sm ${setId === s.id ? "font-semibold text-hijau-teks" : ""}`}>
                    {s.nama}
                  </span>
                  <span className="block text-xs text-pudar">{s.info}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-pudar">Kunci Paket A dan skor tiap nomor diambil dari set. Isian & uraian jadi nilai esai.</p>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(FORMAT_ASAS) as (keyof typeof FORMAT_ASAS)[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => pakaiFormat(f)}
                  className={`h-10 rounded-lg border px-2 text-sm ${format === f ? "border-hijau bg-hijau-muda font-semibold text-hijau-teks" : ""}`}
                >
                  {FORMAT_ASAS[f].nama}
                </button>
              ))}
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-pudar">
                  <th className="text-left font-normal">Bentuk</th>
                  <th className="font-normal">Jumlah</th>
                  <th className="font-normal">Skor/nomor</th>
                </tr>
              </thead>
              <tbody>
                {(["PG", "PGK", "BS"] as const).map((b) => (
                  <tr key={b}>
                    <td>{NAMA[b]}</td>
                    {([
                      [jumlahT, setJumlah],
                      [skorT, setSkor],
                    ] as const).map(([nilai, ubah], k) => (
                      <td key={k} className="px-1 py-0.5">
                        <KotakAngka
                          nilai={nilai[b]}
                          label={`${k ? "Skor" : "Jumlah"} ${NAMA[b]}`}
                          ubah={(v) => {
                            setFormat(null);
                            ubah({ ...nilai, [b]: v });
                          }}
                          className="w-full text-center"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {lebih && <p className="text-sm text-bahaya">LJK hanya memuat {LJK.soal} nomor.</p>}
            {/* Urut ke bawah dulu (seperti LJK), baru pindah kolom. */}
            <div className="gap-x-6 sm:columns-2">
              {bentuk.map((b, n) => (
                <div key={n} className="mb-1 flex break-inside-avoid items-center gap-1.5">
                  <span className="w-7 text-right text-sm text-pudar">{n + 1}.</span>
                  {HURUF.map((h, i) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => ketuk(n, i)}
                      className={`h-9 w-9 shrink-0 rounded-full border text-sm max-md:w-11 ${kunci[n]?.includes(i) ? "border-hijau bg-hijau text-white" : ""}`}
                    >
                      {h}
                    </button>
                  ))}
                  {b === "PGK" && <span className="text-xs text-pudar">boleh lebih dari satu</span>}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span>Esai</span>
              <KotakAngka nilai={esaiT.jumlah} label="Jumlah esai" ubah={(v) => { setFormat(null); setEsai({ ...esaiT, jumlah: v }); }} className="w-16 text-center" />
              <span>nomor ×</span>
              <KotakAngka nilai={esaiT.skor} label="Skor per esai" ubah={(v) => { setFormat(null); setEsai({ ...esaiT, skor: v }); }} className="w-16 text-center" />
              <span>poin</span>
            </div>
            <p className="text-xs text-pudar">
              Skor pilihan {angka(objektif)} + esai {angka(esai.jumlah * esai.skor)} = <b className="text-tinta">{angka(total)}</b>. PG kompleks: tiap kunci yang dihitamkan dapat bagiannya (2 kunci, benar satu = setengah).
            </p>
            {total !== 100 && (
              <p className="rounded-lg border border-peringatan-garis bg-peringatan-muda p-3 text-sm text-peringatan">
                Total skor {angka(total)}, {total > 100 ? "lebih" : "kurang"} {angka(Math.abs(100 - total))} dari 100. Periksa jumlah soal dan skor per nomor.
              </p>
            )}
          </>
        )}
      </div>

      {pesan && <p className="text-sm text-bahaya">{pesan}</p>}
      <button onClick={kirim} disabled={proses} className="h-11 w-full rounded-lg bg-hijau font-semibold text-white hover:bg-hijau-tua disabled:opacity-50">
        {proses ? "Membuat..." : "Buat ujian"}
      </button>
    </section>
  );
}
