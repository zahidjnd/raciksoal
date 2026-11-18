"use client";

import { useEffect, useRef, useState } from "react";
import { svgGrafik, type JenisGrafik, type Penanda } from "@/lib/grafik";
import { JOROK } from "@/lib/soal";

/** Lebih dari 6 kolom tidak muat di satu kolom lembar soal Word (huruf 10 pt), sama dengan batas untuk AI. */
const MAKS_KOLOM = 6;
const tombol = "rounded-lg border h-10 px-3";
const kecil = "h-8 w-8 shrink-0 rounded-lg border text-sm hover:bg-krem disabled:opacity-40";
const jorok = (t: string) => t.startsWith(JOROK);

/**
 * Jendela Ubah tabel (0.41.0): guru mengubah tabel soal sel per sel (tambah/hapus baris & kolom, sel menjorok untuk
 * akun kredit jurnal) tanpa menyentuh tanda "|". `awal` null = tabel baru. `selesai`: isi baru, [] = hapus tabel,
 * null = batal. Teks "| a | b |"-nya ditulis ulang pemanggil lewat `tulisTabel`.
 * Grafik (0.52.0): "Tampil sebagai" tabel / grafik batang, garis, lingkaran + judul; `selesai` ikut mengirim penandanya
 * (null = tabel biasa). Pratinjau memakai `svgGrafik` yang sama dengan kartu soal.
 */
export function EditorTabel({ awal, grafik, selesai }: { awal: string[][] | null; grafik: Penanda | null; selesai: (isi: string[][] | null, grafik?: Penanda | null) => void }) {
  const [isi, setIsi] = useState(() => awal ?? [["", ""], ["", ""], ["", ""]]);
  const [jenis, setJenis] = useState<JenisGrafik | "">(grafik?.jenis ?? "");
  const [judul, setJudul] = useState(grafik?.judul ?? "");
  const penanda = jenis ? { jenis, judul: judul.replace(/[[\]\r\n]+/g, " ").trim() } : null; // "]]" di judul memutus penanda
  const svg = penanda && svgGrafik(isi, penanda);
  const nama = jenis ? "grafik" : "tabel";
  const jendela = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    jendela.current?.showModal();
    jendela.current?.querySelector("input")?.focus(); // bukan tombol hapus kolom yang pertama mendapat fokus
  }, []);
  const kolom = isi[0].length;
  const kosong = () => Array<string>(kolom).fill("");
  const ubahSel = (i: number, j: number, t: string) => setIsi(isi.map((b, x) => (x === i ? b.map((s, y) => (y === j ? t : s)) : b)));
  const sisipBaris = (i: number) => setIsi([...isi.slice(0, i + 1), kosong(), ...isi.slice(i + 1)]);

  return (
    <dialog
      ref={jendela}
      aria-labelledby="judul-tabel"
      onCancel={(e) => {
        e.preventDefault();
        selesai(null);
      }}
      className="m-auto w-[min(52rem,calc(100vw-2rem))] rounded-2xl border bg-kartu p-0 text-tinta shadow-xl backdrop:bg-black/50 max-md:w-[calc(100vw-1rem)]"
    >
      <div className="space-y-3 p-4 text-sm">
        <h2 id="judul-tabel">{awal ? `Ubah ${nama}` : `Sisipkan ${nama}`}</h2>
        <p className="text-pudar">
          Baris pertama = judul kolom. Tombol <b>→</b> membuat isi sel menjorok ke kanan (misalnya akun kredit pada jurnal umum). <b>+</b> di ujung baris = sisipkan baris di bawahnya.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2">
            Tampil sebagai
            <select className="h-10 rounded-lg border px-2" value={jenis} onChange={(e) => setJenis(e.target.value as JenisGrafik | "")}>
              <option value="">Tabel</option>
              <option value="batang">Grafik batang (perbandingan)</option>
              <option value="garis">Grafik garis (perubahan waktu)</option>
              <option value="lingkaran">Grafik lingkaran (persentase)</option>
            </select>
          </label>
          {jenis && (
            <input className="h-10 min-w-0 flex-1 rounded-lg border px-2" aria-label="Judul grafik" placeholder="Judul grafik (boleh kosong)" value={judul} onChange={(e) => setJudul(e.target.value)} />
          )}
        </div>
        {jenis && (
          <p className="text-pudar">
            Kolom pertama = label (bulan, kelas, wilayah). Kolom berikutnya hanya angka, satuan ditulis di judul kolom. Paling banyak 3 kolom angka
            {jenis === "lingkaran" ? " (lingkaran: 1 kolom, 2–8 baris)" : ", 2–12 baris"}.
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="border-collapse">
            <thead>
              <tr>
                {isi[0].map((_, j) => (
                  <th key={j} className="p-1 text-center">
                    <button type="button" className={kecil} aria-label={`Hapus kolom ${j + 1}`} title="Hapus kolom ini" disabled={kolom <= 1} onClick={() => setIsi(isi.map((b) => b.filter((_, y) => y !== j)))}>
                      ✕
                    </button>
                  </th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {isi.map((b, i) => (
                <tr key={i}>
                  {b.map((t, j) => (
                    <td key={j} className="p-1">
                      <div className="flex items-center gap-1">
                        {i === 0 ? (
                          <span className="w-8 shrink-0" />
                        ) : (
                          <button
                            type="button"
                            className={`${kecil} ${jorok(t) ? "border-hijau bg-hijau-muda" : ""}`}
                            aria-pressed={jorok(t)}
                            aria-label={`Menjorok baris ${i} kolom ${j + 1}`}
                            title="Menjorok ke kanan"
                            onClick={() => ubahSel(i, j, jorok(t) ? t.slice(1) : JOROK + t)}
                          >
                            →
                          </button>
                        )}
                        <input
                          dir="auto"
                          className={`w-40 rounded-lg border px-2 max-md:w-28 ${i === 0 ? "bg-krem font-semibold" : ""} ${jorok(t) ? "pl-7" : ""}`}
                          aria-label={i === 0 ? `Judul kolom ${j + 1}` : `Baris ${i} kolom ${j + 1}`}
                          value={t.replace(JOROK, "")}
                          onChange={(e) => ubahSel(i, j, (jorok(t) ? JOROK : "") + e.target.value)}
                        />
                      </div>
                    </td>
                  ))}
                  <td className="whitespace-nowrap p-1">
                    <button type="button" className={kecil} aria-label={`Sisipkan baris di bawah baris ${i}`} title="Sisipkan baris di bawahnya" onClick={() => sisipBaris(i)}>
                      +
                    </button>{" "}
                    <button type="button" className={kecil} aria-label={`Hapus baris ${i}`} title="Hapus baris ini" disabled={i === 0 || isi.length <= 2} onClick={() => setIsi(isi.filter((_, x) => x !== i))}>
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {jenis &&
          (svg ? (
            <div className="max-w-[480px] overflow-hidden rounded border [&_svg]:h-auto [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: svg }} />
          ) : (
            <p className="text-peringatan">Data ini belum bisa digambar, jadi akan tampil sebagai tabel. Periksa aturan di atas.</p>
          ))}
        <div className="flex flex-wrap justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <button type="button" className={tombol} onClick={() => sisipBaris(isi.length - 1)}>+ Baris</button>
            <button type="button" className={tombol} disabled={kolom >= MAKS_KOLOM} title={kolom >= MAKS_KOLOM ? "Paling banyak 6 kolom (supaya muat di lembar soal)" : undefined} onClick={() => setIsi(isi.map((b) => [...b, ""]))}>
              + Kolom
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {awal && (
              <button type="button" className={`${tombol} text-bahaya`} onClick={() => selesai([])}>Hapus {nama}</button>
            )}
            <button type="button" className={tombol} onClick={() => selesai(null)}>Batal</button>
            <button type="button" className={`${tombol} border-hijau bg-hijau font-semibold text-white`} onClick={() => selesai(isi, penanda)}>
              {awal ? `Simpan ${nama}` : "Masukkan"}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
