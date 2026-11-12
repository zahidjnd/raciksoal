"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { analisaMateri } from "./actions";
import { Gambar, gambarTempelan, pratinjauAI, TOMBOL_KECIL, TombolGambar, unggah } from "./gambar";
import { PotongGambar } from "./potong-gambar";
import { ambilAyat } from "./materi/actions";
import { Teks } from "./kartu-soal";
import { Panah } from "./panah";
import { BATAS_GAMBAR } from "@/lib/gambar";
import { MAKS_HALAMAN_PDF } from "@/lib/pembatas";
import { BATAS_MATERI, buangTandaGambar, geserTandaGambar, type IsianMateri } from "@/lib/materi";
import type { GambarFile } from "@/lib/office";
import { DAFTAR_MAPEL, MAPEL_EKSAK } from "@/lib/mapel";
import { bukanDalil, istilahArab, KELAS, MAKS_GABUNG, SUMBER_BUKAN } from "@/lib/soal";
import { NAMA_SURAH } from "@/lib/surah";

export type MateriLama = { id: string; judul: string; mapel: string; kelas: string; huruf?: number };

/** Di bawah ini isi materi dianggap terlalu sedikit: AI akan menebak isi pelajaran sendiri (kasus set ASAS Matematika XI). */
// 300: ringkasan pendek yang masih layak (±400–500 huruf, mis. "Etos Kerja" uji laptop) tidak ikut diperingatkan.
const MATERI_SEDIKIT = 300;
function PeringatanSedikit({ huruf }: { huruf: number }) {
  return (
    <p className="rounded-lg border border-peringatan-garis bg-peringatan-muda p-2 text-sm text-peringatan" role="alert">
      Isi materinya sedikit sekali ({huruf.toLocaleString("id-ID")} huruf). AI akan menebak isi pelajaran sendiri, jadi soal bisa
      tidak sesuai buku/kurikulum yang dipakai. Sebaiknya tempel atau lampirkan isi bab dari buku atau modul. Tetap boleh lanjut.
    </p>
  );
}
type Props = {
  mapel: string;
  kelas: string;
  daftar: MateriLama[]; // materi milik guru (tersimpan otomatis dari pemakaian sebelumnya)
  pilihan: string[]; // id materi lama yang dipakai di set ini
  setPilihan: (ids: string[]) => void;
  draf: IsianMateri | null; // materi baru yang sudah dianalisa AI, belum tersimpan (tersimpan saat "Buat soal")
  setDraf: (d: IsianMateri | null) => void;
  gabung?: boolean; // false di halaman Materi saya: tanpa hitungan gabung & "Pakai materi sebelumnya"
};

const kotak = "w-full rounded-lg border p-2 text-sm";
type FileMateri = { nama: string; paragraf: string[]; gambar: GambarFile[] };
const huruf = (f: FileMateri) => f.paragraf.join("\n").length;
const angka = (n: number) => n.toLocaleString("id-ID");
// File dibaca di perangkat guru (tidak diunggah ke hosting): batas ini hanya menjaga memori HP. 0.33.0: buku Kemenag
// sering > 30 MB (Biologi XI 31,5 MB).
const BATAS_FILE_MB = 100;
const BATAS_FILE = BATAS_FILE_MB * 1024 * 1024;
const FILE_DITERIMA = /\.(docx|pptx|pdf)$/i;
/** Teks tempelan yang belum dipakai disimpan di browser (kenyamanan saja), dihapus setelah materinya tersimpan di server. */
export const DRAF_TEKS = "raciksoal-draf-materi";

/**
 * Materi di halaman utama (pengganti menu Materi saya): tempel teks atau lampirkan Word/PowerPoint/PDF → AI menganalisa
 * (judul, usulan TP, pokok materi, sumber/terjemah dalil yang tertulis) → kartu materi yang bisa diedit guru.
 * Bisa digabung dengan materi sebelumnya (PTS/PAS). Ayat diambil dari mushaf; hadis wajib dicentang (aturan 5).
 */
export function KotakMateri({ mapel, kelas, daftar, pilihan, setPilihan, draf, setDraf, gabung = true }: Props) {
  const [teks, setTeksMentah] = useState("");
  // Draf teks hanya di halaman Set baru (gabung): tab tertutup sebelum Analisa materi → teks kembali saat dibuka lagi.
  useEffect(() => {
    if (!gabung) return;
    try {
      setTeksMentah(localStorage.getItem(DRAF_TEKS) ?? "");
    } catch {
      // Penyimpanan browser diblokir: mulai kosong.
    }
  }, [gabung]);
  const setTeks = (t: string) => {
    setTeksMentah(t);
    if (!gabung) return;
    try {
      if (t) localStorage.setItem(DRAF_TEKS, t);
      else localStorage.removeItem(DRAF_TEKS);
    } catch {
      // Penyimpanan browser diblokir/penuh: teks tetap ada di layar, hanya tidak diingat.
    }
  };
  const [seret, setSeret] = useState(false); // file sedang diseret di atas kotak materi
  const [file, setFile] = useState<FileMateri[]>([]); // file yang dilampirkan (urut), bisa dilepas satu per satu
  const [proses, setProses] = useState("");
  const [pesan, setPesan] = useState<{ ok: boolean; teks: string } | null>(null);
  const [lihatLama, setLihatLama] = useState(false);
  // Gambar yang ditempel (Ctrl+V) di kotak materi sebelum analisa; diunggah bersama gambar file saat analisa.
  const [tempelan, setTempelan] = useState<File[]>([]);
  const [terpakai, setTerpakai] = useState<Set<GambarFile>>(new Set()); // gambar file yang sudah otomatis diunggah
  const [ditolak, setDitolak] = useState<Set<GambarFile>>(new Set()); // dinilai AI bukan isi pelajaran (logo, hiasan)
  const calon = useMemo(() => file.flatMap((f) => f.gambar).filter((g) => !terpakai.has(g)), [file, terpakai]);
  const sesuai = daftar.filter((m) => m.mapel.toLowerCase() === mapel.toLowerCase() && m.kelas === kelas);
  const siap = !!mapel && !!kelas;
  const penuh = pilihan.length + (draf ? 1 : 0) >= MAKS_GABUNG;

  // PDF lebih dari MAKS_HALAMAN_PDF halaman: guru memilih rentang halaman yang dibaca AI (0.31.0).
  const [pilihPdf, setPilihPdf] = useState<{ f: File; jumlah: number; dari: number; sampai: number } | null>(null);

  async function analisa(daftarFile = file, catatanBaca: string[] = []) {
    if (!siap) return setPesan({ ok: false, teks: "Pilih mata pelajaran dan kelas dulu." });
    // Nomor gambar untuk AI: tempelan guru dulu (1..t), lalu gambar file berurutan; tanda [[GAMBAR n]] tiap file digeser.
    let geser = tempelan.length;
    const paragrafFile = daftarFile.flatMap((f) => {
      const hasil = f.paragraf.map((t) => geserTandaGambar(t, geser));
      geser += f.gambar.length;
      return hasil;
    });
    const paragraf = [...teks.split("\n"), ...paragrafFile];
    if (!paragraf.map(buangTandaGambar).join("").trim()) return;
    // Dicek di perangkat dulu (batas sama dengan server): pesan bisa menunjuk file yang kebesaran.
    const panjang = paragraf.join("\n").length;
    if (panjang > BATAS_MATERI.isi) {
      const terbesar = [...daftarFile].sort((a, b) => huruf(b) - huruf(a))[0];
      return setPesan({
        ok: false,
        teks:
          `Materi terlalu panjang: ±${angka(panjang)} huruf, maksimal ${angka(BATAS_MATERI.isi)}. ` +
          (terbesar && huruf(terbesar) > BATAS_MATERI.isi / 3
            ? `File terbesar: ${terbesar.nama} (±${angka(huruf(terbesar))} huruf). Lepas file itu (✕), lalu lampirkan per bab saja${/\.pdf/i.test(terbesar.nama) ? " (untuk PDF: pilih halaman lebih sedikit)" : ""}.`
            : "Kurangi teks atau lepas sebagian file (✕), lalu tekan Analisa materi."),
      });
    }
    setPesan(null);
    const semuaGambar = [
      ...tempelan.map((t) => ({ blob: t as Blob, asal: undefined as GambarFile | undefined })),
      ...daftarFile.flatMap((f) => f.gambar).map((g) => ({ blob: blobCalon(g), asal: g as GambarFile | undefined })),
    ];
    if (semuaGambar.length) setProses("Menyiapkan gambar...");
    const pratinjau = await Promise.all(semuaGambar.slice(0, BATAS_GAMBAR.dinilai).map((x) => pratinjauAI(x.blob)));
    setProses(semuaGambar.length ? "AI sedang membaca materi beserta gambarnya..." : "AI sedang membaca dan menganalisa materi...");
    const r = await analisaMateri({ mapel, kelas, paragraf, gambar: pratinjau, tempel: tempelan.length }).catch(() => ({ ok: false as const, pesan: "Koneksi terputus. Coba lagi." }));
    if (!r.ok) {
      setProses("");
      return setPesan({ ok: false, teks: r.pesan });
    }
    // Penilaian AI per gambar: isi pelajaran → langsung dipakai (dengan keterangan AI); logo/hiasan → hanya ditawarkan,
    // bertanda "AI menilai bukan bagian materi". Gambar di luar 20 pertama tidak dinilai: hanya ditawarkan.
    // Tanpa penilaian (AI gagal, atau model tanpa penglihatan): semua dipakai seperti biasa, maks 10.
    const nilai = r.gambar;
    const tolak = new Set<GambarFile>();
    const pakai = semuaGambar.flatMap((x, i) => {
      if (!nilai) return [{ ...x, keterangan: "" }];
      const n = nilai[i];
      if (!n) return [];
      if (!n.pakai) {
        if (x.asal) tolak.add(x.asal);
        return [];
      }
      return [{ ...x, keterangan: n.keterangan }];
    });
    const muat = pakai.slice(0, BATAS_GAMBAR.perMateri);
    const gambar: { id: number; keterangan: string }[] = [];
    const dipakai = new Set<GambarFile>();
    let gagal = "";
    for (const [i, x] of muat.entries()) {
      setProses(`Mengunggah gambar ${i + 1} dari ${muat.length}...`);
      try {
        gambar.push({ id: await unggah(x.blob), keterangan: x.keterangan });
        if (x.asal) dipakai.add(x.asal);
      } catch (e) {
        gagal = (e as Error).message;
      }
    }
    setProses("");
    setTerpakai(dipakai);
    setDitolak(tolak);
    setTempelan([]);
    setDraf(gambar.length ? { ...r.isian, gambar } : r.isian);
    const catatan = [r.catatan, gagal && `Sebagian gambar tidak terunggah: ${gagal}`, ...catatanBaca].filter(Boolean).join(" ");
    if (catatan) setPesan({ ok: false, teks: catatan });
  }

  /** File dari tombol Lampirkan atau diseret ke kotak materi. */
  async function lampirkan(daftarFile: File[]) {
    if (!daftarFile.length) return;
    const asing = daftarFile.find((f) => !FILE_DITERIMA.test(f.name));
    if (asing) return setPesan({ ok: false, teks: `${asing.name} tidak bisa dibaca. Hanya file Word (.docx), PowerPoint (.pptx), atau PDF.` });
    const besar = daftarFile.find((f) => f.size > BATAS_FILE);
    if (besar) return setPesan({ ok: false, teks: `${besar.name} terlalu besar (maks ${BATAS_FILE_MB} MB).` });
    setProses("Membaca file...");
    setPesan(null);
    try {
      const { bacaFileOffice } = await import("@/lib/office"); // dimuat hanya saat dipakai; file dibaca di perangkat guru
      const baru: FileMateri[] = [];
      const catatanBaca: string[] = [];
      for (const [i, f] of daftarFile.entries()) {
        if (/\.pdf$/i.test(f.name)) {
          // PDF dibaca AI per halaman (0.31.0). PDF panjang: guru memilih halamannya dulu (file sesudahnya dilampirkan lagi nanti).
          const { jumlahHalamanPdf } = await import("./baca-pdf");
          const jumlah = await jumlahHalamanPdf(await f.arrayBuffer());
          if (jumlah > MAKS_HALAMAN_PDF) {
            setFile([...file, ...baru]);
            setProses("");
            // Bawaan 10 halaman (±20 ribu huruf buku Kemenag, ±1 menit dibaca AI); guru bisa menaikkan sampai MAKS_HALAMAN_PDF.
            setPilihPdf({ f, jumlah, dari: 1, sampai: Math.min(10, MAKS_HALAMAN_PDF) });
            if (i < daftarFile.length - 1) setPesan({ ok: false, teks: "File sesudah PDF ini belum dibaca. Lampirkan lagi setelah memilih halaman PDF." });
            return;
          }
          const isi = await bacaPdf(f, 1, jumlah);
          baru.push(isi.file);
          catatanBaca.push(...isi.catatan);
          continue;
        }
        const isi = await bacaFileOffice(await f.arrayBuffer(), f.name);
        baru.push({ nama: f.name, paragraf: isi.semua, gambar: isi.gambar });
      }
      const gabung = [...file, ...baru];
      setFile(gabung);
      setProses("");
      await analisa(gabung, catatanBaca); // langsung dianalisa begitu file masuk
    } catch (err) {
      setProses("");
      setPesan({ ok: false, teks: (err as Error).message || "File tidak bisa dibaca." });
    }
  }

  /** PDF halaman `dari`..`sampai` dibaca AI (tabel, rumus, gambar, juga PDF hasil scan). */
  async function bacaPdf(f: File, dari: number, sampai: number) {
    const { bacaPdfDenganAI } = await import("./baca-pdf");
    setProses(`AI membaca PDF: halaman ${dari}–${sampai}...`);
    const hasil = await bacaPdfDenganAI(await f.arrayBuffer(), mapel, dari, sampai, (s, t) => setProses(`AI membaca PDF: ${s} dari ${t} halaman...`));
    const nama = dari === 1 && sampai >= hasil.halaman ? f.name : `${f.name} (hlm ${dari}–${sampai})`;
    return { file: { nama, paragraf: hasil.paragraf, gambar: hasil.gambar }, catatan: hasil.catatan };
  }

  /** Lanjutan PDF panjang setelah guru memilih halaman: dibaca AI, atau seluruhnya dengan teks biasa (cara lama). */
  async function lanjutPdf(pakaiAI: boolean) {
    if (!pilihPdf) return;
    const { f, jumlah } = pilihPdf;
    const dari = Math.min(Math.max(1, Math.round(pilihPdf.dari) || 1), jumlah);
    const sampai = Math.min(Math.max(dari, Math.round(pilihPdf.sampai) || dari), jumlah, dari + MAKS_HALAMAN_PDF - 1);
    setPilihPdf(null);
    setPesan(null);
    try {
      let baru: FileMateri;
      let catatanBaca: string[] = [];
      if (pakaiAI) ({ file: baru, catatan: catatanBaca } = await bacaPdf(f, dari, sampai));
      else {
        setProses("Membaca file...");
        const { bacaFileOffice } = await import("@/lib/office");
        const isi = await bacaFileOffice(await f.arrayBuffer(), f.name);
        baru = { nama: f.name, paragraf: isi.semua, gambar: [] };
      }
      const gabung = [...file, baru];
      setFile(gabung);
      setProses("");
      await analisa(gabung, catatanBaca);
    } catch (err) {
      setProses("");
      setPesan({ ok: false, teks: (err as Error).message || "File tidak bisa dibaca." });
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border bg-kartu p-3">
      {gabung && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">Materi</p>
          <span className="text-sm text-pudar">
            Dipakai {pilihan.length + (draf ? 1 : 0)} dari maks. {MAKS_GABUNG} materi · <Link href="/materi" className="underline">Materi saya</Link>
          </span>
        </div>
      )}

      {/* Materi sebelumnya yang dipakai (bisa lebih dari satu untuk PTS/PAS). */}
      {pilihan.map((id) => {
        const m = daftar.find((x) => x.id === id);
        return (
          <div key={id} className="space-y-2">
            <div className="flex items-center justify-between gap-2 rounded-lg border border-hijau/40 bg-hijau-muda/40 px-3 py-2 text-sm">
              <span className="min-w-0 truncate">✓ {m?.judul ?? id}</span>
              <button className={`${TOMBOL_KECIL} shrink-0 text-pudar hover:text-bahaya`} aria-label={`Lepas materi ${m?.judul ?? id}`} onClick={() => setPilihan(pilihan.filter((x) => x !== id))}>
                ✕ Lepas
              </button>
            </div>
            {m?.huruf !== undefined && m.huruf < MATERI_SEDIKIT && <PeringatanSedikit huruf={m.huruf} />}
          </div>
        );
      })}

      {draf ? (
        <KartuMateri draf={draf} setDraf={setDraf} calon={calon} ditolak={ditolak} judul="Materi baru (hasil analisa AI, silakan periksa)" batal={() => { setDraf(null); setTeks(""); setFile([]); setTempelan([]); setTerpakai(new Set()); setDitolak(new Set()); setPesan(null); }} />
      ) : (
        !penuh && (
          <div
            className="space-y-2"
            // Seret-lepas file Word/PowerPoint/PDF ke kotak materi = sama dengan tombol Lampirkan.
            onDragOver={(e) => {
              if (!e.dataTransfer.types.includes("Files")) return;
              e.preventDefault(); // tanpa ini browser membuka file yang dilepas (meninggalkan halaman)
              if (siap && !proses) setSeret(true);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setSeret(false);
            }}
            onDrop={(e) => {
              if (!e.dataTransfer.files.length) return;
              e.preventDefault();
              setSeret(false);
              if (!siap) setPesan({ ok: false, teks: "Pilih mata pelajaran dan kelas dulu." });
              else if (!proses) lampirkan([...e.dataTransfer.files]);
            }}
          >
            <textarea
              dir="auto"
              rows={4}
              className={`${kotak} ${seret ? "border-hijau bg-hijau-muda/50 ring-2 ring-hijau" : ""}`}
              aria-label="Tempel materi"
              placeholder={
                seret ? "Lepaskan file di sini..." :
                siap ? "Tempel materi di sini (ringkasan bab, modul, atau isi PPT), atau lampirkan/seret file Word/PowerPoint/PDF ke sini." :
                "Pilih mata pelajaran dan kelas dulu."
              }
              disabled={!siap || !!proses}
              value={teks}
              onChange={(e) => setTeks(e.target.value)}
              onPaste={(e) => {
                const f = gambarTempelan(e);
                if (f.length) setTempelan((t) => [...t, ...f].slice(0, BATAS_GAMBAR.perMateri));
              }}
            />
            <div className="flex flex-wrap items-center gap-2">
              <label className={`inline-flex h-8 cursor-pointer items-center rounded-lg border bg-kartu px-3 text-sm hover:bg-krem max-md:min-h-11 focus-within:ring-2 focus-within:ring-hijau ${!siap || proses ? "pointer-events-none opacity-50" : ""}`}>
                Lampirkan Word/PowerPoint/PDF
                <input type="file" multiple accept=".docx,.pptx,.pdf" className="sr-only" disabled={!siap || !!proses} onChange={(e) => {
                  const f = [...(e.target.files ?? [])];
                  e.target.value = "";
                  lampirkan(f);
                }} />
              </label>
              <button className="h-8 rounded-lg bg-hijau px-3 text-sm font-semibold text-white disabled:opacity-40 max-md:min-h-11" disabled={!siap || !!proses || (!teks.trim() && !file.length)} onClick={() => analisa()}>
                Analisa materi
              </button>
              {gabung && sesuai.length > 0 && (
                <button className="inline-flex h-8 items-center gap-1 rounded-lg border bg-kartu px-3 text-sm hover:bg-krem max-md:min-h-11" aria-expanded={lihatLama} onClick={() => setLihatLama(!lihatLama)}>
                  Pakai materi sebelumnya <Panah buka={lihatLama} />
                </button>
              )}
            </div>
            {tempelan.length > 0 && (
              <p className="flex items-center gap-2 rounded-lg border px-2 py-1 text-sm">
                <span className="min-w-0 flex-1">{tempelan.length} gambar ditempel (ikut ke materi setelah Analisa materi)</span>
                <button className="shrink-0 rounded px-2 text-pudar hover:text-bahaya disabled:opacity-40 max-md:min-h-11 max-md:min-w-11" aria-label="Lepas gambar yang ditempel" disabled={!!proses} onClick={() => setTempelan([])}>
                  ✕
                </button>
              </p>
            )}
            {file.length > 0 && (
              <ul className="space-y-1 text-sm" aria-label="File yang dilampirkan">
                {file.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 rounded-lg border px-2 py-1">
                    <span className="min-w-0 flex-1 truncate">{f.nama}</span>
                    <span className="shrink-0 text-pudar">±{angka(huruf(f))} huruf</span>
                    <button
                      className="shrink-0 rounded px-2 text-pudar hover:text-bahaya disabled:opacity-40 max-md:min-h-11 max-md:min-w-11"
                      aria-label={`Lepas file ${f.nama}`}
                      disabled={!!proses}
                      onClick={() => { setFile(file.filter((_, j) => j !== i)); setPesan(null); }}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      )}

      {lihatLama && !penuh && (
        <ul className="max-h-56 divide-y divide-batas overflow-y-auto rounded-lg border text-sm">
          {sesuai.map((m) => (
            <li key={m.id}>
              <label className="flex cursor-pointer items-center gap-2 px-3 py-2 hover:bg-krem">
                <input
                  type="checkbox"
                  checked={pilihan.includes(m.id)}
                  onChange={(e) => setPilihan(e.target.checked ? [...pilihan, m.id] : pilihan.filter((x) => x !== m.id))}
                />
                <span className="min-w-0 truncate">{m.judul}</span>
              </label>
            </li>
          ))}
        </ul>
      )}

      {pilihPdf && (
        <div className="space-y-2 rounded-lg border border-peringatan-garis bg-peringatan-muda p-3 text-sm" role="group" aria-label="Pilih halaman PDF">
          <p>
            <b>{pilihPdf.f.name}</b> berisi {pilihPdf.jumlah} halaman. AI membaca paling banyak {MAKS_HALAMAN_PDF} halaman sekali lampir (tabel, rumus, dan gambar ikut terbaca). Pilih halaman bab yang diperlukan:
          </p>
          <div className="flex flex-wrap items-center gap-2">
            Halaman
            <input type="number" min={1} max={pilihPdf.jumlah} aria-label="Dari halaman" className="h-8 w-20 rounded-lg border bg-kartu px-2 max-md:min-h-11" value={pilihPdf.dari} onChange={(e) => setPilihPdf({ ...pilihPdf, dari: Number(e.target.value) })} />
            sampai
            <input type="number" min={1} max={pilihPdf.jumlah} aria-label="Sampai halaman" className="h-8 w-20 rounded-lg border bg-kartu px-2 max-md:min-h-11" value={pilihPdf.sampai} onChange={(e) => setPilihPdf({ ...pilihPdf, sampai: Number(e.target.value) })} />
            <button className="h-8 rounded-lg bg-hijau px-3 font-semibold text-white max-md:min-h-11" onClick={() => lanjutPdf(true)}>Baca dengan AI</button>
          </div>
          <p className="text-sm text-pudar">
            Nomor halaman menurut file PDF (bukan nomor yang tercetak di buku).{" "}
            <button className="underline" onClick={() => lanjutPdf(false)}>Pakai teks saja, semua halaman (tanpa AI: tabel, rumus, dan gambar tidak terbaca)</button>
            {" · "}
            <button className="underline" onClick={() => setPilihPdf(null)}>Batal</button>
          </p>
        </div>
      )}
      {proses && (
        <p className="flex items-center gap-2 text-sm text-hijau-teks" role="status">
          <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-hijau/25 border-t-hijau" aria-hidden />
          {proses}
        </p>
      )}
      {pesan && <p className={`text-sm ${pesan.ok ? "text-hijau-teks" : "rounded-lg border border-peringatan-garis bg-peringatan-muda p-2 text-peringatan"}`}>{pesan.teks}</p>}
    </div>
  );
}

/**
 * Kartu materi: dipakai bersama oleh Set baru (hasil analisa AI) dan halaman Materi saya (tambah/ubah).
 * Semua bisa diedit guru. Ayat diambil dari mushaf ("Ambil ayat"); hadis diketik guru dan wajib dicentang (aturan 5).
 */
export function KartuMateri({ draf, setDraf, judul, batal, calon, ditolak }: { draf: IsianMateri; setDraf: (d: IsianMateri) => void; judul: string; batal?: () => void; calon?: GambarFile[]; ditolak?: Set<GambarFile> }) {
  const ubah = (sebagian: Partial<IsianMateri>) => setDraf({ ...draf, ...sebagian });
  const ubahDalil = (i: number, sebagian: Partial<IsianMateri["dalil"][number]>) =>
    ubah({ dalil: draf.dalil.map((d, j) => (j === i ? { ...d, ...sebagian } : d)) });
  const adaHadis = draf.dalil.some((d) => !d.mushaf && !d.kitab && !bukanDalil(d));
  // Istilah Arab pendek (<= 3 kata) diterima apa adanya (server: istilahArab di rapikanMateri); ditampilkan supaya guru tahu.
  const istilah = draf.teksArab === "bahasa" ? [] : [...new Set(draf.isi.split("\n").flatMap((b) => [...istilahArab(b)]))];
  const penuh = draf.dalil.length >= BATAS_MATERI.dalil;
  const [rujukan, setRujukan] = useState("");
  const [ayat, setAyat] = useState<{ proses: boolean; pesan?: string }>({ proses: false });
  // Tempel gambar (Ctrl+V) di kolom mana pun pada kartu ini → masuk ke bagian Gambar.
  const tempel = useRef<((f: Blob[]) => void) | null>(null);

  /** "QS An-Nur: 2" → teks dari data mushaf (tidak diketik guru). */
  async function ambil() {
    if (!rujukan.trim() || penuh) return;
    setAyat({ proses: true });
    const r = await ambilAyat(rujukan).catch(() => ({ ok: false as const, pesan: "Koneksi terputus. Coba lagi." }));
    if (!r.ok) return setAyat({ proses: false, pesan: r.pesan });
    if (draf.dalil.some((d) => d.arab === r.arab)) return setAyat({ proses: false, pesan: `${r.sumber} sudah ada di daftar.` });
    ubah({ dalil: [...draf.dalil, { sumber: r.sumber, arab: r.arab, terjemah: "", mushaf: true }] });
    setRujukan("");
    setAyat({ proses: false });
  }

  return (
    <div
      className="space-y-3 rounded-xl border border-hijau/40 p-3 text-sm"
      onPaste={(e) => {
        const f = tempel.current && gambarTempelan(e);
        if (f?.length) tempel.current!(f);
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-hijau-teks">{judul}</p>
        {batal && <button className={`${TOMBOL_KECIL} shrink-0 text-pudar hover:text-bahaya`} onClick={batal}>✕ Batalkan</button>}
      </div>
      {draf.isi.trim().length < MATERI_SEDIKIT && <PeringatanSedikit huruf={draf.isi.trim().length} />}
      <label className="block">
        Judul
        <input className={`${kotak} mt-1`} maxLength={150} value={draf.judul} onChange={(e) => ubah({ judul: e.target.value })} />
      </label>
      {/* TP dirumuskan guru (RUJUKAN.md D): TP usulan AI wajib dibaca & dicentang; server ikut memeriksa (rapikanMateri). */}
      <div className={`space-y-1 rounded-lg border p-2 ${draf.tpUsulan || !draf.tp.trim() ? "border-peringatan-garis bg-peringatan-muda" : "border-hijau"}`}>
        <label className="block">
          Tujuan Pembelajaran (TP), satu per baris
          <span className={`block text-sm ${draf.tpUsulan || !draf.tp.trim() ? "text-peringatan" : "text-hijau-teks"}`}>
            {draf.tpUsulan
              ? "TP usulan AI. Baca dulu dan ubah bila perlu, sesuaikan dengan yang Anda ajarkan."
              : draf.tp.trim()
                ? "✓ TP dari materi Anda"
                : "Tidak ada TP. Tulis atau tempel TP dari ATP/modul ajar Anda."}
          </span>
          <textarea
            rows={4}
            className={`${kotak} mt-1`}
            placeholder={"TP 1.1: Peserta didik mampu ...\nTP 1.2: Peserta didik mampu ..."}
            value={draf.tp}
            onChange={(e) => ubah({ tp: e.target.value })}
          />
        </label>
        {draf.tpUsulan && (
          <label className="flex items-start gap-2">
            <input type="checkbox" className="mt-1" checked={!!draf.tpDibaca} onChange={(e) => ubah({ tpDibaca: e.target.checked })} />
            Saya sudah membaca TP ini dan sesuai dengan yang saya ajarkan.
          </label>
        )}
      </div>
      {!!draf.pokok?.length && (
        <div>
          <p>Pokok materi yang akan diuji</p>
          <ul className="mt-1 list-disc pl-5 text-pudar">
            {draf.pokok.map((p, i) => <li key={i}><Teks teks={p} /></li>)}
          </ul>
        </div>
      )}
      {/* Terbuka bila sudah ada dalil; mapel tanpa ayat/hadis cukup melihat judulnya. */}
      <details open={draf.dalil.length > 0} className="space-y-2">
        <summary className="cursor-pointer">Ayat & hadis ({draf.dalil.length})</summary>
        <div className="mt-2 space-y-2">
          {draf.dalil.map((d, i) => (
            <div key={i} className={`space-y-1 rounded-lg border p-2 ${d.mushaf || d.kitab ? "border-hijau" : bukanDalil(d) ? "bg-krem" : "border-peringatan-garis bg-peringatan-muda"}`}>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                {d.mushaf ? (
                  <span className="text-hijau-teks">✓ Ayat dari mushaf: {d.sumber}</span>
                ) : d.kitab ? (
                  <span className="text-hijau-teks">✓ Hadis dari data kitab: {d.sumber}</span>
                ) : bukanDalil(d) ? (
                  <>
                    <span className="text-pudar">Teks Arab materi (bukan ayat/hadis): tidak perlu sumber</span>
                    <button className="underline hover:text-tinta" onClick={() => ubahDalil(i, { bukan: false, sumber: "" })}>Batalkan</button>
                  </>
                ) : (
                  <>
                    <span className="text-peringatan">Tidak ada di mushaf maupun data hadis 9 kitab: kalau hadis, isi sumbernya dan periksa teksnya</span>
                    {/* Satu klik untuk teks Arab yang memang bukan ayat/hadis (dulu guru mengetik "bukan ayat/hadis" di kolom sumber). */}
                    <button className="h-8 rounded-lg border bg-kartu px-3 text-sm text-tinta hover:bg-krem max-md:min-h-11" onClick={() => ubahDalil(i, { bukan: true, sumber: SUMBER_BUKAN })}>
                      Bukan ayat/hadis
                    </button>
                  </>
                )}
              </p>
              {d.mushaf || d.kitab ? (
                <p dir="rtl" lang="ar" className="font-arab text-xl leading-loose">{d.arab}</p>
              ) : (
                <textarea dir="rtl" lang="ar" rows={2} className={`${kotak} font-arab text-xl`} placeholder="نص الحديث" aria-label={`Teks Arab dalil ${i + 1}`} value={d.arab} onChange={(e) => ubahDalil(i, { arab: e.target.value })} />
              )}
              {!d.mushaf && !d.kitab && !bukanDalil(d) && <input className={kotak} placeholder="Sumber, mis. HR. Bukhari dan Muslim" value={d.sumber} onChange={(e) => ubahDalil(i, { sumber: e.target.value })} />}
              <input className={kotak} placeholder="Terjemah (opsional)" value={d.terjemah} onChange={(e) => ubahDalil(i, { terjemah: e.target.value })} />
              <button className={`${TOMBOL_KECIL} text-pudar hover:text-bahaya`} onClick={() => ubah({ dalil: draf.dalil.filter((_, j) => j !== i) })}>✕ Hapus dari materi</button>
            </div>
          ))}
          {!penuh && (
            <div className="flex flex-wrap items-center gap-2">
              <input
                className="h-8 w-64 max-w-full rounded-lg border px-2 text-sm max-md:min-h-11"
                list="daftar-surah"
                aria-label="Rujukan ayat"
                placeholder="Mis. QS An-Nur: 2 atau 24:2-3"
                value={rujukan}
                onChange={(e) => setRujukan(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && ambil()}
              />
              <datalist id="daftar-surah">
                {NAMA_SURAH.map((n, i) => <option key={n} value={`QS ${n}: `}>{`${i + 1}. ${n}`}</option>)}
              </datalist>
              <button className="h-8 rounded-lg bg-hijau px-3 text-sm font-semibold text-white disabled:opacity-40 max-md:min-h-11" disabled={ayat.proses || !rujukan.trim()} onClick={ambil}>
                {ayat.proses ? "Mengambil..." : "Ambil ayat"}
              </button>
              {/* Hadis baru = teks Arab baru → centang pemeriksaan wajib diulang (aturan 5). */}
              <button className="h-8 rounded-lg border bg-kartu px-3 text-sm hover:bg-krem max-md:min-h-11" onClick={() => ubah({ dalil: [...draf.dalil, { sumber: "", arab: "", terjemah: "" }], diverifikasi: false })}>
                + Tambah hadis
              </button>
              {ayat.pesan && <span className="text-sm text-bahaya">{ayat.pesan}</span>}
            </div>
          )}
          {istilah.length > 0 && (
            <div className="text-sm text-pudar">
              <p>Istilah Arab pendek (paling banyak 3 kata) dipakai apa adanya, tanpa verifikasi:</p>
              {/* Satu kotak per istilah: daftar Arab yang dipisah koma di paragraf LTR urutannya kacau. */}
              <p className="mt-1 flex flex-wrap gap-1">
                {istilah.map((x) => (
                  <bdi key={x} dir="rtl" lang="ar" className="rounded border bg-kartu px-2 font-arab text-base text-tinta">{x}</bdi>
                ))}
              </p>
            </div>
          )}
          {adaHadis && (
            <label className="flex items-start gap-2">
              <input type="checkbox" className="mt-1" checked={draf.diverifikasi} onChange={(e) => ubah({ diverifikasi: e.target.checked })} />
              Saya sudah memeriksa teks Arab dan harakat hadis/teks di atas yang bukan dari mushaf sesuai kitab sumbernya.
            </label>
          )}
          <p className="text-sm text-pudar">
            Teks Al-Qur&apos;an: <a className="underline" href="https://tanzil.net" target="_blank" rel="noreferrer">Tanzil Project (tanzil.net)</a>. Teks hadis
            (Bukhari, Muslim, Abu Dawud, Tirmidzi, Nasa&apos;i, Ibnu Majah, Malik, Ahmad, Darimi): data terbuka hadith-api &amp; Hadith-Data-Sets. Hadis yang Anda
            ketik dicocokkan otomatis saat materi disimpan. Terjemah diisi guru.
          </p>
        </div>
      </details>
      <BagianGambar gambar={draf.gambar ?? []} ubah={(gambar) => ubah({ gambar })} calon={calon ?? []} ditolak={ditolak} tempel={tempel} eksak={MAPEL_EKSAK.test(draf.mapel)} />
      <details>
        <summary className="cursor-pointer text-pudar">Lihat / ubah teks materi ({draf.isi.length.toLocaleString("id-ID")} huruf)</summary>
        <textarea dir="auto" rows={8} className={`${kotak} mt-1`} value={draf.isi} onChange={(e) => ubah({ isi: e.target.value })} />
      </details>
    </div>
  );
}

const JENIS_FILE: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", gif: "image/gif", bmp: "image/bmp", webp: "image/webp" };
const blobCalon = (c: GambarFile) => new Blob([c.data as BlobPart], { type: JENIS_FILE[c.nama.split(".").pop()!.toLowerCase()] ?? "" });

/**
 * Gambar materi (0.30.0): AI melihatnya dan boleh memakainya sebagai stimulus soal (lewat gambar_id). Sumber: gambar di
 * file Word/PowerPoint guru (`calon`, belum diunggah; diunggah saat diklik), unggah file, atau tempel (Ctrl+V).
 */
function BagianGambar({ gambar, ubah, calon, ditolak, tempel, eksak }: { gambar: NonNullable<IsianMateri["gambar"]>; ubah: (g: NonNullable<IsianMateri["gambar"]>) => void; calon: GambarFile[]; ditolak?: Set<GambarFile>; tempel: React.RefObject<((f: Blob[]) => void) | null>; eksak: boolean }) {
  const [proses, setProses] = useState("");
  const [pesan, setPesan] = useState("");
  const [dipakai, setDipakai] = useState<Set<GambarFile>>(new Set());
  const penuh = gambar.length >= BATAS_GAMBAR.perMateri;
  // Pratinjau calon dari file (belum diunggah): alamat sementara di perangkat, dilepas saat daftar berubah.
  const pratinjau = useMemo(() => calon.map((c) => URL.createObjectURL(blobCalon(c))), [calon]);
  useEffect(() => () => pratinjau.forEach((u) => URL.revokeObjectURL(u)), [pratinjau]);

  async function tambah(daftar: Blob[], asal: GambarFile[] = []) {
    const muat = daftar.slice(0, BATAS_GAMBAR.perMateri - gambar.length);
    if (!muat.length) return setPesan(`Maksimal ${BATAS_GAMBAR.perMateri} gambar per materi.`);
    setPesan("");
    const baru = [...gambar];
    try {
      for (const [i, b] of muat.entries()) {
        setProses(`Mengunggah gambar ${i + 1} dari ${muat.length}...`);
        baru.push({ id: await unggah(b), keterangan: "" });
        ubah([...baru]);
        if (asal[i]) setDipakai((d) => new Set([...d, asal[i]]));
      }
      if (daftar.length > muat.length) setPesan(`Hanya ${muat.length} gambar yang dipakai (maksimal ${BATAS_GAMBAR.perMateri} per materi).`);
    } catch (e) {
      setPesan((e as Error).message);
    }
    setProses("");
  }

  useEffect(() => {
    tempel.current = (f) => {
      if (!proses) void tambah(f);
    };
  });

  const sisaCalon = calon.map((c, i) => ({ c, url: pratinjau[i] })).filter((x) => !dipakai.has(x.c));
  const biasa = sisaCalon.filter((x) => !ditolak?.has(x.c));
  const tolak = sisaCalon.filter((x) => ditolak?.has(x.c));
  return (
    // Terbuka bila ada gambar/calon, atau mapel eksak (soal bergambar paling sering dibutuhkan).
    <details open={gambar.length > 0 || calon.length > 0 || eksak}>
      <summary className="cursor-pointer">
        Gambar ({gambar.length}/{BATAS_GAMBAR.perMateri}){!gambar.length && <span className="text-pudar"> · untuk soal bergambar</span>}
      </summary>
      <div tabIndex={0} className="mt-2 space-y-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-hijau">
        <p className="text-sm text-pudar">
          AI melihat gambar ini dan memakainya untuk soal (&quot;Perhatikan gambar berikut!&quot;), minimal satu soal per gambar.
          Ingin lebih banyak soal bergambar? Tulis di <b>Catatan untuk AI</b>, misalnya &quot;buat 5 soal yang memakai gambar&quot;.
          AI tidak bisa membuat gambar sendiri. Keterangan singkat membantu AI, misalnya &quot;Struktur sel hewan, bagian bertanda A–E&quot;.
        </p>
        {gambar.map((g, i) => (
          <div key={g.id} className="flex items-start gap-2 rounded-lg border p-2">
            <Gambar id={g.id} alt={g.keterangan || `Gambar ${i + 1}`} className="h-20 w-28 shrink-0 rounded bg-krem object-contain" />
            <div className="min-w-0 flex-1 space-y-1">
              <input
                className={kotak}
                maxLength={BATAS_GAMBAR.keterangan}
                aria-label={`Keterangan gambar ${i + 1}`}
                placeholder="Keterangan (opsional)"
                value={g.keterangan}
                onChange={(e) => ubah(gambar.map((x, j) => (j === i ? { ...x, keterangan: e.target.value } : x)))}
              />
              <div className="flex flex-wrap gap-2">
                <PotongGambar id={g.id} nomor={i + 1} selesai={(id) => ubah(gambar.map((x, j) => (j === i ? { ...x, id } : x)))} />
                <button className={`${TOMBOL_KECIL} text-pudar hover:text-bahaya`} onClick={() => ubah(gambar.filter((_, j) => j !== i))}>✕ Lepas dari materi</button>
              </div>
            </div>
          </div>
        ))}
        {biasa.length > 0 && !penuh && (
          <div className="space-y-1">
            <p className="text-sm text-pudar">Gambar lain di file Anda ({biasa.length}). Klik gambar yang dipakai untuk soal:</p>
            <DaftarCalon daftar={biasa} sibuk={!!proses} pakai={(x) => tambah(x.map(blobCalon), x)} />
          </div>
        )}
        {tolak.length > 0 && !penuh && (
          <details className="text-sm text-pudar">
            <summary className="cursor-pointer">AI menilai {tolak.length} gambar bukan bagian materi (logo, hiasan, dan sejenisnya), tidak dipakai. Lihat</summary>
            <p className="mt-1">Kalau AI keliru, klik gambarnya untuk tetap memakainya.</p>
            <DaftarCalon daftar={tolak} sibuk={!!proses} pakai={(x) => tambah(x.map(blobCalon), x)} />
          </details>
        )}
        {!penuh && (
          <div className="flex flex-wrap items-center gap-2">
            <TombolGambar label="+ Tambah gambar" disabled={!!proses} onPilih={(f) => tambah(f)} />
            <span className="text-sm text-pudar">atau tempel gambar (Ctrl+V) di kolom mana saja pada kartu ini</span>
          </div>
        )}
        {proses && <p className="text-sm text-hijau-teks" role="status">{proses}</p>}
        {pesan && <p className="text-sm text-bahaya" role="alert">{pesan}</p>}
      </div>
    </details>
  );
}

/** Calon gambar dari file (pratinjau di perangkat, belum diunggah): klik satu untuk memakainya, atau "Pakai semua". */
function DaftarCalon({ daftar, sibuk, pakai }: { daftar: { c: GambarFile; url: string }[]; sibuk: boolean; pakai: (x: GambarFile[]) => void }) {
  return (
    <>
      <div className="mt-1 flex flex-wrap gap-2">
        {daftar.map(({ c, url }, i) => (
          <button key={i} className="rounded-lg border bg-kartu p-1 hover:ring-2 hover:ring-hijau disabled:opacity-40" aria-label={`Pakai gambar ${c.nama}`} disabled={sibuk} onClick={() => pakai([c])}>
            {/* Pratinjau dari perangkat sendiri (blob:), bukan dari server. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="h-20 w-28 object-contain" />
          </button>
        ))}
      </div>
      {daftar.length > 1 && (
        <button className="mt-1 text-sm underline disabled:opacity-40 max-md:min-h-11" disabled={sibuk} onClick={() => pakai(daftar.map(({ c }) => c))}>
          Pakai semua
        </button>
      )}
    </>
  );
}

/**
 * Mapel (daftar tetap + "Lainnya") dan kelas, di atas kotak materi (Set baru & Materi saya).
 * `utama` = mapel yang diajar guru (halaman Akun, 0.32.0): tampil paling atas; mapel lain tetap bisa dipilih.
 */
export function PilihMapel({ mapel, kelas, ubah, utama = [] }: { mapel: string; kelas: string; ubah: (mapel: string, kelas: string) => void; utama?: string[] }) {
  const lain = !!mapel && !DAFTAR_MAPEL.includes(mapel) && !utama.includes(mapel);
  const [ketik, setKetik] = useState(lain);
  const kotak = "h-10 rounded-lg border bg-kartu px-3 text-sm max-md:min-h-11";
  return (
    <div className="flex flex-wrap gap-2">
      <select
        aria-label="Mata pelajaran"
        className={`${kotak} min-w-0 flex-1`}
        value={ketik || lain ? "lain" : mapel}
        onChange={(e) => {
          if (e.target.value === "lain") return setKetik(true);
          setKetik(false);
          ubah(e.target.value, kelas);
        }}
      >
        <option value="">Pilih mata pelajaran</option>
        {utama.length ? (
          <>
            <optgroup label="Mapel saya">{utama.map((m) => <option key={m}>{m}</option>)}</optgroup>
            <optgroup label="Mapel lain">{DAFTAR_MAPEL.filter((m) => !utama.includes(m)).map((m) => <option key={m}>{m}</option>)}</optgroup>
          </>
        ) : (
          DAFTAR_MAPEL.map((m) => <option key={m}>{m}</option>)
        )}
        <option value="lain">Lainnya (ketik sendiri)</option>
      </select>
      {(ketik || lain) && (
        <input aria-label="Nama mata pelajaran" className={`${kotak} min-w-0 flex-1`} maxLength={60} placeholder="Nama mata pelajaran" defaultValue={lain ? mapel : ""} onBlur={(e) => e.target.value.trim() && ubah(e.target.value.trim(), kelas)} />
      )}
      <select aria-label="Kelas" className={`${kotak} w-32`} value={kelas} onChange={(e) => ubah(mapel, e.target.value)}>
        <option value="">Kelas</option>
        {KELAS.map((k) => <option key={k} value={k}>Kelas {k}</option>)}
      </select>
    </div>
  );
}
