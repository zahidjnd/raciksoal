"use client";

import { useEffect, useRef, useState } from "react";
import { adalahBagan, adalahGeometri, adalahSkema, alasanGrafik, ATURAN_GRAFIK, isiTampil, svgGrafik, type JenisGrafik, type Penanda } from "@/lib/grafik";
import { contohGeometri, satuBangun } from "@/lib/geometri";
import { kolomFormulir, punyaFormulir } from "@/lib/formulir";
import { JOROK } from "@/lib/soal";
import { FormulirGambar, PilihJenis } from "./formulir-gambar";

/** Lebih dari 6 kolom tidak muat di satu kolom lembar soal Word (huruf 10 pt), sama dengan batas untuk AI. */
const MAKS_KOLOM = 6;
const tombol = "rounded-lg border h-10 px-3";
const kecil = "h-8 w-8 shrink-0 rounded-lg border text-sm hover:bg-krem disabled:opacity-40";
const jorok = (t: string) => t.startsWith(JOROK);
const selKosong = (t: string) => !t.replace(JOROK, "").trim();
/** Isi awal suatu jenis: jenis berformulir = contoh sungguhan (bisa langsung diubah); lainnya = tabel kosong seukuran contoh. */
const awalJenis = (j: JenisGrafik) => (punyaFormulir(j) ? ATURAN_GRAFIK[j].contoh.map((b) => [...b]) : ATURAN_GRAFIK[j].contoh.map((b) => b.map(() => "")));

/**
 * Jendela Ubah tabel (0.41.0): guru mengubah tabel soal sel per sel (tambah/hapus baris & kolom, sel menjorok untuk
 * akun kredit jurnal) tanpa menyentuh tanda "|". `awal` null = tabel baru. `selesai`: isi baru, [] = hapus tabel,
 * null = batal. Teks "| a | b |"-nya ditulis ulang pemanggil lewat `tulisTabel`.
 * Grafik (0.52.0): jenis + judul; `selesai` ikut mengirim penandanya (null = tabel biasa). Pratinjau = `svgGrafik`.
 * Sel kosong = isi CONTOH abu-abu (`contohSel`) yang ikut tergambar; Masukkan ditolak selama masih ada sel kosong.
 * 0.61.0: jenis dipilih lewat kartu bergambar (`PilihJenis`, `pilihDulu` = tombol "📊 Grafik & gambar" tanpa tabel
 * bergrafik). Jenis yang punya resep (`punyaFormulir`) diisi lewat FORMULIR (`FormulirGambar`); tabel = "Lanjutan".
 */
export function EditorTabel({
  awal,
  grafik,
  pilihDulu = false,
  selesai,
}: {
  awal: string[][] | null;
  grafik: Penanda | null;
  pilihDulu?: boolean;
  selesai: (isi: string[][] | null, grafik?: Penanda | null) => void;
}) {
  const [isi, setIsi] = useState(() => awal ?? (grafik ? awalJenis(grafik.jenis) : [["", ""], ["", ""], ["", ""]]));
  const [jenis, setJenis] = useState<JenisGrafik | "">(grafik?.jenis ?? "");
  const [judul, setJudul] = useState(grafik?.judul ?? "");
  const [pesan, setPesan] = useState("");
  const [memilih, setMemilih] = useState(pilihDulu && !grafik);
  const [modeTabel, setModeTabel] = useState(false);
  const penanda = jenis ? { jenis, judul: judul.replace(/[[\]\r\n]+/g, " ").trim() } : null; // "]]" di judul memutus penanda
  const bisaFormulir = !!jenis && punyaFormulir(jenis) && isi[0]?.length === kolomFormulir(jenis);
  const pakaiFormulir = bisaFormulir && !modeTabel;
  const adaKosong = !pakaiFormulir && !!jenis && isi.some((b) => b.some((t, j) => selKosong(t) && j !== ATURAN_GRAFIK[jenis].bolehKosong));
  const tampil = jenis && !pakaiFormulir ? isiTampil(isi, jenis) : isi;
  const svg = penanda && svgGrafik(tampil, penanda);
  const alasanTabel = penanda && !svg ? alasanGrafik(tampil, penanda.jenis) : null;
  // di formulir, "baris 4" tidak berarti apa-apa bagi guru
  const alasan = alasanTabel && pakaiFormulir ? alasanTabel.replace(/\s*\(baris \d+\)/gi, "").replace(/^Baris \d+:?\s*/i, "") : alasanTabel;
  const nama = jenis ? (adalahBagan(jenis) ? "bagan" : adalahGeometri(jenis) || adalahSkema(jenis) ? "gambar" : "grafik") : "tabel";
  function pilihJenis(j: JenisGrafik | "") {
    setMemilih(false);
    setPesan("");
    setModeTabel(false);
    if (j === jenis) return;
    // tabel masih kosong, ganti dari jenis lain, atau jenis berformulir (isi tabel biasa tak bisa dipakai formulir)
    // → isi awal jenis itu. Tabel lama tetap utuh selama guru menekan Batal.
    if (j && (isi.every((b) => b.every(selKosong)) || jenis || punyaFormulir(j))) setIsi(awalJenis(j));
    setJenis(j);
  }
  function kirim() {
    if (memilih) return setPesan("Pilih dulu jenis gambarnya.");
    if (adaKosong) return setPesan("Masih ada kolom yang belum diisi. Tulisan abu-abu hanya contoh; ganti dengan data Anda.");
    selesai(isi, penanda);
  }
  const jendela = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    jendela.current?.showModal();
    jendela.current?.querySelector("input")?.focus(); // bukan tombol hapus kolom yang pertama mendapat fokus
  }, []);
  const kolom = isi[0].length;
  const kosong = () => Array<string>(kolom).fill("");
  const ubahSel = (i: number, j: number, t: string) => {
    const baru = isi.map((b, x) => (x === i ? b.map((s, y) => (y === j ? t : s)) : b));
    // bangun datar/sudut: nama bangun diketik & baris lain masih kosong → banyak baris ikut contoh bangun itu
    const kunci = jenis && satuBangun(jenis) && j === 1 ? baru[i][0].trim() || contohGeometri(isi, jenis)[i]?.[0] || "" : "";
    if (/^(bangun|bentuk)$/i.test(kunci)) baru[i][0] ||= kunci; // kolom "bangun" abu-abu ikut terisi
    const c = jenis && satuBangun(jenis) && /^(bangun|bentuk)$/i.test(kunci) ? contohGeometri(baru, jenis) : null;
    if (c && baru.every((b, x) => x === 0 || x === i || b.every(selKosong)) && c.length !== baru.length && c[i]) return setIsi(c.map((b, x) => (x === i ? baru[i] : b.map(() => ""))));
    setIsi(baru);
  };
  const sisipBaris = (i: number) => setIsi([...isi.slice(0, i + 1), kosong(), ...isi.slice(i + 1)]);

  const pratinjau = jenis && !memilih && (
    <div className={`w-full space-y-1 ${pakaiFormulir ? "md:sticky md:top-0 md:max-w-[26rem] max-md:order-first" : "max-w-[480px] min-w-64 flex-1"}`}>
      {adaKosong && <p className="text-pudar">Contoh: tulisan abu-abu belum diisi.</p>}
      {svg ? (
        <div className="w-fit max-w-full overflow-hidden rounded border bg-kartu [&_svg]:h-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} />
      ) : (
        <p className="rounded-lg border border-peringatan-garis bg-peringatan-muda p-2 text-peringatan">{alasan} Selama belum diperbaiki, data ini tampil sebagai tabel.</p>
      )}
    </div>
  );

  return (
    <dialog
      ref={jendela}
      aria-labelledby="judul-tabel"
      onCancel={(e) => {
        e.preventDefault();
        selesai(null);
      }}
      className="m-auto w-[min(60rem,calc(100vw-2rem))] rounded-2xl border bg-kartu p-0 text-tinta shadow-xl backdrop:bg-black/50 max-md:w-[calc(100vw-1rem)]"
    >
      <div className="space-y-3 p-4 text-sm">
        <h2 id="judul-tabel">{memilih ? "Pilih jenis gambar" : awal ? `Ubah ${nama}` : `Sisipkan ${nama}`}</h2>
        {memilih ? (
          <PilihJenis terpilih={jenis} pilih={pilihJenis} />
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span>
              Jenis: <b>{jenis ? ATURAN_GRAFIK[jenis].nama : "Tabel biasa"}</b>
            </span>
            <button type="button" className={`${tombol} hover:bg-krem`} onClick={() => setMemilih(true)}>
              Ganti jenis
            </button>
            {jenis && (
              <input className="h-10 min-w-0 flex-1 rounded-lg border px-2" aria-label={`Judul ${nama}`} placeholder={`Judul ${nama} (boleh kosong)`} value={judul} onChange={(e) => setJudul(e.target.value)} />
            )}
          </div>
        )}
        {!memilih && pakaiFormulir && jenis && (
          <div className="flex flex-col items-start gap-4 md:flex-row">
            <div className="w-full min-w-0 flex-1">
              <FormulirGambar
                jenis={jenis}
                isi={isi}
                alasan={alasan}
                ubah={(b) => {
                  setPesan("");
                  setIsi(b);
                }}
              />
            </div>
            {pratinjau}
          </div>
        )}
        {!memilih && !pakaiFormulir && (
          <>
            {jenis ? (
              <ol className="list-inside list-decimal text-pudar">
                <li>Ganti tulisan abu-abu dengan data Anda. {ATURAN_GRAFIK[jenis].petunjuk ?? "Kolom pertama = label, kolom berikutnya = angka saja (satuan ditulis di judul kolom)."}</li>
                <li>Lihat contohnya berubah, lalu tekan {awal ? `Simpan ${nama}` : "Masukkan"}.</li>
              </ol>
            ) : (
              <p className="text-pudar">
                Baris pertama = judul kolom. Tombol <b>→</b> membuat isi sel menjorok ke kanan (misalnya akun kredit pada jurnal umum). <b>+</b> di ujung baris = sisipkan baris di bawahnya.
              </p>
            )}
            <div className={jenis ? "flex flex-wrap items-start gap-4" : ""}>
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
                              {i === 0 || jenis ? (
                                !jenis && <span className="w-8 shrink-0" />
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
                                className={`${jenis && (satuBangun(jenis) || adalahSkema(jenis)) ? "w-44" : jenis && adalahGeometri(jenis) ? (j === 1 ? "w-48" : "w-28") : jenis ? "w-32" : "w-40"} rounded-lg border px-2 max-md:w-28 placeholder:italic placeholder:text-pudar/70 ${i === 0 ? "bg-krem font-semibold" : ""} ${jorok(t) ? "pl-7" : ""}`}
                                aria-label={i === 0 ? `Judul kolom ${j + 1}` : `Baris ${i} kolom ${j + 1}`}
                                placeholder={jenis ? tampil[i][j] || (j === ATURAN_GRAFIK[jenis].bolehKosong ? (jenis === "pohon" ? "kosong = puncak" : "boleh kosong") : "") : undefined}
                                value={t.replace(JOROK, "")}
                                onChange={(e) => {
                                  setPesan("");
                                  ubahSel(i, j, (jorok(t) ? JOROK : "") + e.target.value);
                                }}
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
              {pratinjau}
            </div>
          </>
        )}
        {pesan && <p className="text-bahaya">{pesan}</p>}
        <div className="flex flex-wrap justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {!memilih && !pakaiFormulir && (
              <>
                <button type="button" className={tombol} onClick={() => sisipBaris(isi.length - 1)}>+ Baris</button>
                <button type="button" className={tombol} disabled={kolom >= MAKS_KOLOM} title={kolom >= MAKS_KOLOM ? "Paling banyak 6 kolom (supaya muat di lembar soal)" : undefined} onClick={() => setIsi(isi.map((b) => [...b, ""]))}>
                  + Kolom
                </button>
              </>
            )}
            {!memilih && bisaFormulir && (
              <button type="button" className={`${tombol} text-pudar hover:bg-krem`} onClick={() => setModeTabel(!modeTabel)}>
                {modeTabel ? "Kembali ke formulir" : "Lanjutan: ubah sebagai tabel"}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {awal && (
              <button type="button" className={`${tombol} text-bahaya`} onClick={() => selesai([])}>Hapus {nama}</button>
            )}
            <button type="button" className={tombol} onClick={() => selesai(null)}>Batal</button>
            <button type="button" className={`${tombol} border-hijau bg-hijau font-semibold text-white`} onClick={kirim}>
              {awal ? `Simpan ${nama}` : "Masukkan"}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
