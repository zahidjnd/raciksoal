"use client";

import { useEffect, useRef, useState } from "react";
import { adalahBagan, adalahGeometri, adalahSkema, alasanGrafik, ATURAN_GRAFIK, isiTampil, svgGrafik, type JenisGrafik, type Penanda } from "@/lib/grafik";
import { contohGeometri, satuBangun } from "@/lib/geometri";
import { JOROK } from "@/lib/soal";

/** Lebih dari 6 kolom tidak muat di satu kolom lembar soal Word (huruf 10 pt), sama dengan batas untuk AI. */
const MAKS_KOLOM = 6;
const tombol = "rounded-lg border h-10 px-3";
const kecil = "h-8 w-8 shrink-0 rounded-lg border text-sm hover:bg-krem disabled:opacity-40";
const jorok = (t: string) => t.startsWith(JOROK);
const selKosong = (t: string) => !t.replace(JOROK, "").trim();
/** Tabel kosong seukuran contoh jenis grafik itu. */
const bentukContoh = (j: JenisGrafik) => ATURAN_GRAFIK[j].contoh.map((b) => b.map(() => ""));

/**
 * Jendela Ubah tabel (0.41.0): guru mengubah tabel soal sel per sel (tambah/hapus baris & kolom, sel menjorok untuk
 * akun kredit jurnal) tanpa menyentuh tanda "|". `awal` null = tabel baru. `selesai`: isi baru, [] = hapus tabel,
 * null = batal. Teks "| a | b |"-nya ditulis ulang pemanggil lewat `tulisTabel`.
 * Grafik (0.52.0): "Tampil sebagai" tabel / grafik batang, garis, lingkaran + judul; `selesai` ikut mengirim penandanya
 * (null = tabel biasa). Pratinjau memakai `svgGrafik` yang sama dengan kartu soal. Sel kosong = isi CONTOH abu-abu
 * (`contohSel`, placeholder) yang ikut tergambar, jadi grafik langsung tampil & berubah tiap ketikan; contoh tidak
 * pernah tersimpan (Masukkan ditolak selama masih ada sel kosong).
 */
export function EditorTabel({ awal, grafik, selesai }: { awal: string[][] | null; grafik: Penanda | null; selesai: (isi: string[][] | null, grafik?: Penanda | null) => void }) {
  const [isi, setIsi] = useState(() => awal ?? (grafik ? bentukContoh(grafik.jenis) : [["", ""], ["", ""], ["", ""]]));
  const [jenis, setJenis] = useState<JenisGrafik | "">(grafik?.jenis ?? "");
  const [judul, setJudul] = useState(grafik?.judul ?? "");
  const [pesan, setPesan] = useState("");
  const penanda = jenis ? { jenis, judul: judul.replace(/[[\]\r\n]+/g, " ").trim() } : null; // "]]" di judul memutus penanda
  const adaKosong = !!jenis && isi.some((b) => b.some((t, j) => selKosong(t) && j !== ATURAN_GRAFIK[jenis].bolehKosong));
  const tampil = jenis ? isiTampil(isi, jenis) : isi;
  const svg = penanda && svgGrafik(tampil, penanda);
  const alasan = penanda && !svg ? alasanGrafik(tampil, penanda.jenis) : null;
  const nama = jenis ? (adalahBagan(jenis) ? "bagan" : adalahGeometri(jenis) || adalahSkema(jenis) ? "gambar" : "grafik") : "tabel";
  function pilihJenis(j: JenisGrafik | "") {
    setJenis(j);
    setPesan("");
    if (j && isi.every((b) => b.every(selKosong))) setIsi(bentukContoh(j)); // tabel masih kosong: ikut ukuran contoh
  }
  function kirim() {
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
        {jenis ? (
          <ol className="list-inside list-decimal text-pudar">
            <li>Pilih jenis grafik, bagan, atau gambar.</li>
            <li>Ganti tulisan abu-abu dengan data Anda. {ATURAN_GRAFIK[jenis].petunjuk ?? "Kolom pertama = label, kolom berikutnya = angka saja (satuan ditulis di judul kolom)."}</li>
            <li>Lihat contohnya berubah, lalu tekan {awal ? `Simpan ${nama}` : "Masukkan"}.</li>
          </ol>
        ) : (
          <p className="text-pudar">
            Baris pertama = judul kolom. Tombol <b>→</b> membuat isi sel menjorok ke kanan (misalnya akun kredit pada jurnal umum). <b>+</b> di ujung baris = sisipkan baris di bawahnya.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2">
            Tampil sebagai
            <select className="h-10 rounded-lg border px-2" value={jenis} onChange={(e) => pilihJenis(e.target.value as JenisGrafik | "")}>
              <option value="">Tabel</option>
              <optgroup label="Grafik (data angka)">
                <option value="batang">Grafik batang (perbandingan)</option>
                <option value="garis">Grafik garis (perubahan waktu)</option>
                <option value="lingkaran">Grafik lingkaran (persentase)</option>
                <option value="histogram">Histogram (data berkelompok)</option>
                <option value="pencar">Diagram pencar (hubungan dua besaran)</option>
                <option value="piramida">Piramida penduduk</option>
              </optgroup>
              <optgroup label="Bagan (urutan & hubungan)">
                <option value="waktu">Garis waktu (urutan peristiwa)</option>
                <option value="alur">Diagram alir (langkah, rantai sanad)</option>
                <option value="siklus">Siklus (daur)</option>
                <option value="pohon">Bagan pohon (klasifikasi, struktur)</option>
              </optgroup>
              <optgroup label="Geometri">
                <option value="koordinat">Bidang koordinat (titik, garis, kurva, vektor, daerah)</option>
                <option value="bilangan">Garis bilangan (pertidaksamaan)</option>
                <option value="datar">Bangun datar (segitiga, segiempat, lingkaran)</option>
                <option value="sudut">Sudut (berpelurus, bertolak belakang, garis sejajar)</option>
                <option value="ruang">Bangun ruang (kubus, balok, prisma, limas, tabung, kerucut, bola)</option>
              </optgroup>
              <optgroup label="Skema IPA">
                <option value="listrik">Rangkaian listrik (hambatan, lampu, paralel, meter)</option>
                <option value="atom">Model atom Bohr (kulit & elektron)</option>
                <option value="jaring">Jaring / rantai makanan</option>
                <option value="optik">Cermin & lensa (bayangan, sinar istimewa)</option>
                <option value="gaya">Gaya pada balok (bidang datar/miring)</option>
                <option value="katrol">Katrol (tetap, bebas, meja)</option>
                <option value="tuas">Tuas (jenis 1, 2, 3)</option>
              </optgroup>
              <optgroup label="Skema agama">
                <option value="shaf">Posisi shaf sholat</option>
                <option value="waris">Bagan ahli waris (mawaris)</option>
                <option value="arah">Mata angin & arah kiblat</option>
              </optgroup>
              <optgroup label="Skema IPS">
                <option value="lapisan">Lapisan bumi / atmosfer / tanah</option>
                <option value="langit">Gerhana & fase bulan</option>
                <option value="ekonomi">Interaksi pelaku ekonomi (2–4 sektor)</option>
              </optgroup>
            </select>
          </label>
          {jenis && (
            <input className="h-10 min-w-0 flex-1 rounded-lg border px-2" aria-label={`Judul ${nama}`} placeholder={`Judul ${nama} (boleh kosong)`} value={judul} onChange={(e) => setJudul(e.target.value)} />
          )}
        </div>
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
        {jenis && (
          <div className="w-full max-w-[480px] min-w-64 flex-1 space-y-1">
            {adaKosong && <p className="text-pudar">Contoh: tulisan abu-abu belum diisi.</p>}
            {svg ? (
              <div className="w-fit max-w-full overflow-hidden rounded border [&_svg]:h-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: svg }} />
            ) : (
              <p className="rounded-lg border border-peringatan-garis bg-peringatan-muda p-2 text-peringatan">{alasan} Selama belum diperbaiki, data ini tampil sebagai tabel.</p>
            )}
          </div>
        )}
        </div>
        {pesan && <p className="text-bahaya">{pesan}</p>}
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
            <button type="button" className={`${tombol} border-hijau bg-hijau font-semibold text-white`} onClick={kirim}>
              {awal ? `Simpan ${nama}` : "Masukkan"}
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}
