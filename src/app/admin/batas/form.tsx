"use client";

import { startTransition, useActionState, useRef, useState } from "react";
import { BEBAS, HEMAT, JENIS_BATAS, LONGGAR, NAMA_JENIS, NORMAL, type Angka, type Bawaan } from "@/lib/batas-nilai";
import { tanya } from "../../tanya";
import { setRem, simpanBatasGuru, simpanBawaan } from "./actions";

const kotak = "mt-1 w-full rounded-lg border bg-kartu p-2";
const Pesan = ({ h }: { h: { ok: boolean; pesan: string } | null }) =>
  h && <p className={`text-sm ${h.ok ? "text-hijau-teks" : "text-bahaya"}`}>{h.pesan}</p>;

/** Rem darurat: satu tombol menghentikan pemakaian AI semua guru (admin tidak ikut). */
export function KartuRem({ nyala, pesan }: { nyala: boolean; pesan: string }) {
  const [hasil, kirim, proses] = useActionState(setRem, null);
  const yakin = useRef(false);
  return (
    <form
      action={kirim}
      onSubmit={(e) => {
        if (nyala || yakin.current) return void (yakin.current = false);
        e.preventDefault();
        const form = e.currentTarget;
        tanya("Semua guru langsung tidak bisa membuat soal, mengganti/mengubah soal, menganalisa materi, atau membaca PDF dengan AI. Edit manual tetap bisa. Anda bisa mematikannya kapan saja.", { judul: "Nyalakan rem darurat?", ya: "Nyalakan", bahaya: true }).then((ok) => {
          if (!ok) return;
          yakin.current = true;
          form.requestSubmit();
        });
      }}
      className={`space-y-2 rounded-xl border p-4 ${nyala ? "border-bahaya-garis bg-bahaya-muda" : "bg-kartu"}`}
    >
      <h2>{nyala ? "⛔ Rem darurat MENYALA" : "Rem darurat"}</h2>
      <p className="text-sm">
        {nyala
          ? `Semua guru tidak bisa memakai AI sekarang${pesan ? ` (pesan untuk guru: ${pesan})` : ""}. Edit manual tetap bisa.`
          : "Untuk keadaan genting (saldo AI menipis, pemakaian tidak wajar). Satu klik menghentikan pemakaian AI semua guru; admin tetap bisa."}
      </p>
      {!nyala && (
        <label className="block max-w-xl text-sm">
          Pesan untuk guru (boleh dikosongkan)
          <input name="pesan" maxLength={200} placeholder="mis. sedang pemeliharaan sampai pukul 15.00" className={kotak} />
        </label>
      )}
      <input type="hidden" name="aksi" value={nyala ? "matikan" : "nyalakan"} />
      <button className={`h-10 rounded-lg px-4 font-semibold text-white disabled:opacity-50 ${nyala ? "bg-hijau" : "bg-bahaya"}`} disabled={proses}>
        {nyala ? "Matikan rem darurat" : "Nyalakan rem darurat"}
      </button>
      <Pesan h={hasil} />
    </form>
  );
}

const PAKET = [
  { nama: "Hemat", n: HEMAT },
  { nama: "Normal", n: NORMAL },
  { nama: "Longgar", n: LONGGAR },
];
const KOLOM = [...JENIS_BATAS, "web"] as const;

/** Batas bawaan semua guru; tombol Hemat/Normal/Longgar mengisi semua kotak (belum tersimpan sampai klik Simpan). */
export function FormBawaan({ awal, totalHari }: { awal: Bawaan; totalHari: number }) {
  const [hasil, kirim, proses] = useActionState(simpanBawaan, null);
  const [nilai, setNilai] = useState<Record<string, string>>(() => Object.fromEntries(KOLOM.map((k) => [k, String(awal[k])])));
  const isi = (n: Bawaan) => setNilai(Object.fromEntries(KOLOM.map((k) => [k, String(n[k])])));
  return (
    <form action={kirim} className="space-y-3 rounded-xl border bg-kartu p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2>Batas bawaan (semua guru)</h2>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-pudar">Isi cepat:</span>
          {PAKET.map((p) => (
            <button key={p.nama} type="button" className="h-8 rounded-lg border px-3" onClick={() => isi(p.n)}>
              {p.nama}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {KOLOM.map((k) => (
          <label key={k} className="block text-sm">
            {NAMA_JENIS[k].nama} per {NAMA_JENIS[k].per}
            <input
              name={k}
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              required
              value={nilai[k]}
              onChange={(e) => setNilai({ ...nilai, [k]: e.target.value })}
              className={kotak}
            />
          </label>
        ))}
      </div>
      <p className="text-xs text-pudar">
        Total semua guru: hari ini {totalHari} set. Set yang gagal tidak dihitung; set yang dihapus tetap dihitung. Hari berganti pukul 00.00 WIB, bulan tanggal 1.
      </p>
      <button className="h-10 rounded-lg bg-hijau px-4 font-semibold text-white disabled:opacity-50" disabled={proses}>
        {proses ? "Menyimpan..." : "Simpan batas bawaan"}
      </button>
      <Pesan h={hasil} />
    </form>
  );
}

const LAMA = [
  { v: "selamanya", t: "Sampai saya ubah lagi" },
  { v: "hari", t: "Hari ini saja (sampai 00.00 WIB)" },
  { v: "7", t: "7 hari" },
  { v: "30", t: "30 hari" },
];

/** Tombol & panel batas khusus satu guru. */
export function AturGuru({ guruId, nama, ada, awal, bawaan, catatan }: { guruId: string; nama: string; ada: boolean; awal: Partial<Angka>; bawaan: Bawaan; catatan: string }) {
  const [hasil, kirim, proses] = useActionState(simpanBatasGuru, null);
  const [buka, setBuka] = useState(false);
  const nilaiAwal = JENIS_BATAS.map((j) => awal[j]);
  const modeAwal = ada && nilaiAwal.every((v) => v === BEBAS) ? "bebas" : ada && nilaiAwal.every((v) => v === 0) ? "stop" : "angka";
  const [mode, setMode] = useState(modeAwal);

  const cepat = (m: string, lama: string) => {
    const f = new FormData();
    f.set("guruId", guruId);
    f.set("mode", m);
    f.set("lama", lama);
    startTransition(() => kirim(f));
  };
  const stop = async (lama: string, kata: string) => {
    if (await tanya(`${nama} tidak bisa memakai AI ${kata}. Edit manual tetap bisa.`, { judul: "Hentikan pemakaian AI guru ini?", ya: "Hentikan", bahaya: true })) cepat("stop", lama);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button type="button" className="h-8 rounded-lg border px-3 text-sm" onClick={() => setBuka(!buka)}>
          {buka ? "Tutup" : "Atur"}
        </button>
        <button type="button" className="h-8 rounded-lg border border-bahaya-garis px-3 text-sm text-bahaya disabled:opacity-50" disabled={proses} onClick={() => stop("hari", "sampai besok pagi")}>
          Stop hari ini
        </button>
        <button type="button" className="h-8 rounded-lg border border-bahaya-garis px-3 text-sm text-bahaya disabled:opacity-50" disabled={proses} onClick={() => stop("selamanya", "sampai Anda membukanya lagi")}>
          Stop sampai saya buka
        </button>
        {ada && (
          <button type="button" className="h-8 rounded-lg border px-3 text-sm disabled:opacity-50" disabled={proses} onClick={() => cepat("bawaan", "")}>
            Kembalikan ke bawaan
          </button>
        )}
      </div>
      {buka && (
        <form action={kirim} className="space-y-3 rounded-lg border bg-krem p-3">
          <input type="hidden" name="guruId" value={guruId} />
          <fieldset className="flex flex-wrap gap-4 text-sm">
            <legend className="mb-1 font-semibold">Batas untuk {nama}</legend>
            {[
              { v: "angka", t: "Angka khusus" },
              { v: "bebas", t: "Tanpa batas" },
              { v: "stop", t: "Stop (semua 0)" },
            ].map((o) => (
              <label key={o.v} className="flex items-center gap-1">
                <input type="radio" name="mode" value={o.v} checked={mode === o.v} onChange={() => setMode(o.v)} />
                {o.t}
              </label>
            ))}
          </fieldset>
          {mode === "angka" && (
            <div className="grid gap-3 sm:grid-cols-3">
              {JENIS_BATAS.map((j) => (
                <label key={j} className="block text-sm">
                  {NAMA_JENIS[j].nama} per {NAMA_JENIS[j].per}
                  <input name={j} type="number" min={0} step={1} inputMode="numeric" defaultValue={awal[j] === undefined || awal[j] === BEBAS ? "" : awal[j]} placeholder={`bawaan ${bawaan[j]}`} className={kotak} />
                </label>
              ))}
              <p className="text-xs text-pudar sm:col-span-3">Kotak kosong = ikut batas bawaan.</p>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              Berlaku
              <select name="lama" className={kotak} defaultValue="selamanya">
                {LAMA.map((l) => (
                  <option key={l.v} value={l.v}>
                    {l.t}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Catatan untuk admin (opsional)
              <input name="catatan" maxLength={200} defaultValue={catatan} placeholder="mis. dipakai bergantian dengan kelas XII" className={kotak} />
            </label>
          </div>
          <button className="h-9 rounded-lg bg-hijau px-4 text-sm font-semibold text-white disabled:opacity-50" disabled={proses}>
            {proses ? "Menyimpan..." : "Simpan"}
          </button>
        </form>
      )}
      <Pesan h={hasil} />
    </div>
  );
}
