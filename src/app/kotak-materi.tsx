"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { analisaMateri } from "./actions";
import { Gambar, gambarTempelan, pratinjauAI, TOMBOL_KECIL, TombolGambar, unggah } from "./gambar";
import { PotongGambar } from "./potong-gambar";
import { PilihHalamanPdf } from "./pilih-halaman-pdf";
import { ambilAyat, cocokkanDalil } from "./materi/actions";
import { Teks } from "./kartu-soal";
import { Panah } from "./panah";
import { BATAS_GAMBAR } from "@/lib/gambar";
import { MAKS_HALAMAN_PDF } from "@/lib/pembatas";
import { BATAS_MATERI, buangTandaGambar, geserTandaGambar, kurangDalil, type IsianMateri } from "@/lib/materi";
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
const ikon = "inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg border bg-kartu text-pudar hover:bg-krem hover:text-tinta max-md:size-11 focus-within:ring-2 focus-within:ring-hijau";
type FileMateri = { nama: string; paragraf: string[]; gambar: GambarFile[] };
const huruf = (f: FileMateri) => f.paragraf.join("\n").length;
const angka = (n: number) => n.toLocaleString("id-ID");
// File dibaca di perangkat guru (tidak diunggah ke hosting): batas ini hanya menjaga memori HP. 0.33.0: buku Kemenag
// sering > 30 MB (Biologi XI 31,5 MB).
const BATAS_FILE_MB = 100;
const BATAS_FILE = BATAS_FILE_MB * 1024 * 1024;
const FILE_DITERIMA = /\.(docx|pptx|pdf)$/i;
// 0.40.0: foto halaman buku (kamera/galeri HP), dibaca AI seperti halaman PDF.
const foto = (f: File) => f.type.startsWith("image/");
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
  const sedikit = pilihan.flatMap((id) => daftar.find((x) => x.id === id) ?? []).filter((m) => m.huruf !== undefined && m.huruf < MATERI_SEDIKIT);
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
    const asing = daftarFile.find((f) => !FILE_DITERIMA.test(f.name) && !foto(f));
    if (asing) return setPesan({ ok: false, teks: `${asing.name} tidak bisa dibaca. Hanya file Word (.docx), PowerPoint (.pptx), PDF, atau foto halaman buku.` });
    const besar = daftarFile.find((f) => f.size > BATAS_FILE);
    if (besar) return setPesan({ ok: false, teks: `${besar.name} terlalu besar (maks ${BATAS_FILE_MB} MB).` });
    const daftarFoto = daftarFile.filter(foto);
    if (daftarFoto.length > MAKS_HALAMAN_PDF) return setPesan({ ok: false, teks: `Paling banyak ${MAKS_HALAMAN_PDF} foto sekali lampir.` });
    setProses("Membaca file...");
    setPesan(null);
    try {
      const { bacaFileOffice } = await import("@/lib/office"); // dimuat hanya saat dipakai; file dibaca di perangkat guru
      const baru: FileMateri[] = [];
      const catatanBaca: string[] = [];
      // Foto-foto satu kali pilih = satu "file" materi, urut sesuai pilihan guru.
      if (daftarFoto.length) {
        const { bacaFotoDenganAI } = await import("./baca-pdf");
        setProses(`AI membaca foto: 0 dari ${daftarFoto.length}...`);
        const isi = await bacaFotoDenganAI(daftarFoto, mapel, (s, t) => setProses(`AI membaca foto: ${s} dari ${t}...`));
        baru.push({ nama: daftarFoto.length === 1 ? "Foto halaman" : `${daftarFoto.length} foto halaman`, paragraf: isi.paragraf, gambar: isi.gambar });
        catatanBaca.push(...isi.catatan);
      }
      for (const [i, f] of daftarFile.entries()) {
        if (foto(f)) continue;
        if (/\.pdf$/i.test(f.name)) {
          // PDF dibaca AI per halaman (0.31.0). PDF panjang: guru memilih halamannya dulu (file sesudahnya dilampirkan lagi nanti).
          const { jumlahHalamanPdf } = await import("./baca-pdf");
          const jumlah = await jumlahHalamanPdf(await f.arrayBuffer());
          if (jumlah > MAKS_HALAMAN_PDF) {
            setFile([...file, ...baru]);
            setProses("");
            // 0.64.1: belum ada halaman terpilih (dulu bawaan 1–10 = sampul & kata pengantar ikut terbaca bila guru
            // langsung menekan Baca). Guru memilih lewat gambar halaman (PilihHalamanPdf) atau isian angka.
            setPilihPdf({ f, jumlah, dari: 0, sampai: 0 });
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

      {/* Materi sebelumnya yang dipakai (bisa lebih dari satu untuk PTS/PAS). 0.68.0: chip kecil berbaris menyamping
          (dulu satu baris penuh per materi: 10 materi = halaman sangat panjang); peringatan "sedikit" digabung satu. */}
      {pilihan.length > 0 && (
        <div className="space-y-2">
          {/* Semua chip sama lebar (permintaan pemilik): kisi 2 kolom di HP, 3 kolom di laptop; judul panjang dipotong "…". */}
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {pilihan.map((id) => {
              const judul = daftar.find((x) => x.id === id)?.judul ?? id;
              return (
                <span key={id} className="flex h-8 min-w-0 items-center gap-1 rounded-full border border-hijau/40 bg-hijau-muda/40 pl-3 text-sm max-md:min-h-11" title={judul}>
                  <span dir="auto" className="min-w-0 flex-1 truncate">✓ {judul}</span>
                  <button className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-pudar hover:text-bahaya max-md:h-11 max-md:w-11" aria-label={`Lepas materi ${judul}`} onClick={() => setPilihan(pilihan.filter((x) => x !== id))}>
                    ✕
                  </button>
                </span>
              );
            })}
          </div>
          {pilihan.length > 4 && (
            <button className={`${TOMBOL_KECIL} text-pudar hover:text-bahaya`} onClick={() => setPilihan([])}>Lepas semua</button>
          )}
          {sedikit.length > 0 && (
            <p className="rounded-lg border border-peringatan-garis bg-peringatan-muda p-2 text-sm text-peringatan" role="alert">
              {sedikit.length === 1 ? "Isi materi" : `Isi ${sedikit.length} materi`} ini sedikit sekali: {sedikit.map((m) => `${m.judul} (${m.huruf!.toLocaleString("id-ID")} huruf)`).join("; ")}. AI akan menebak isi
              pelajaran sendiri, jadi soal bisa tidak sesuai buku/kurikulum. Sebaiknya tempel atau lampirkan isi bab dari buku atau modul. Tetap boleh lanjut.
            </p>
          )}
        </div>
      )}

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
                siap ? "Tempel materi di sini, atau lampirkan Word/PowerPoint/PDF/foto buku lewat tombol klip." :
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
              {/* 0.40.1: dua ikon. Klip = Word/PPT/PDF/foto galeri (banyak sekaligus). Kamera = capture, tanpa multiple:
                  Android 13+ langsung membuka galeri untuk input multiple, jadi kamera perlu tombol sendiri (HP saja). */}
              {/* 0.47.1: laptop ikon + tulisan "Lampirkan file"; HP tetap ikon saja (pilihan pemilik: baris tombol tidak penuh). */}
              <label title="Lampirkan Word, PowerPoint, PDF, atau foto" className={`${ikon} md:w-auto md:gap-1.5 md:px-3 md:text-sm md:text-tinta ${!siap || proses ? "pointer-events-none opacity-50" : ""}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="m21.4 11.1-8.5 8.5a5.5 5.5 0 0 1-7.8-7.8l8.5-8.5a3.7 3.7 0 0 1 5.2 5.2l-8.5 8.5a1.8 1.8 0 0 1-2.6-2.6l7.8-7.8" />
                </svg>
                <span className="max-md:hidden" aria-hidden>Lampirkan file</span>
                <input type="file" multiple accept=".docx,.pptx,.pdf,image/*" className="sr-only" aria-label="Lampirkan Word, PowerPoint, PDF, atau foto" disabled={!siap || !!proses} onChange={(e) => {
                  const f = [...(e.target.files ?? [])];
                  e.target.value = "";
                  lampirkan(f);
                }} />
              </label>
              <label title="Potret halaman buku" className={`${ikon} pointer-fine:hidden ${!siap || proses ? "pointer-events-none opacity-50" : ""}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M14.5 4h-5L7.5 6.5H4a2 2 0 0 0-2 2V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8.5a2 2 0 0 0-2-2h-3.5z" />
                  <circle cx="12" cy="13" r="3.5" />
                </svg>
                <input type="file" accept="image/*" capture="environment" className="sr-only" aria-label="Potret halaman buku" disabled={!siap || !!proses} onChange={(e) => {
                  const f = [...(e.target.files ?? [])];
                  e.target.value = "";
                  lampirkan(f);
                }} />
              </label>
              {gabung && sesuai.length > 0 && (
                <button className="inline-flex h-8 items-center gap-1 rounded-lg border bg-kartu px-3 text-sm hover:bg-krem max-md:min-h-11" aria-expanded={lihatLama} onClick={() => setLihatLama(!lihatLama)}>
                  Pakai materi sebelumnya <Panah buka={lihatLama} />
                </button>
              )}
              <button className="ml-auto h-8 rounded-lg bg-hijau px-3 text-sm font-semibold text-white disabled:opacity-40 max-md:min-h-11" disabled={!siap || !!proses || (!teks.trim() && !file.length)} onClick={() => analisa()}>
                Analisa materi
              </button>
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
          <div className="flex items-start justify-between gap-2">
            <p className="min-w-0">
              <b className="break-all">{pilihPdf.f.name}</b> berisi {pilihPdf.jumlah} halaman. AI membaca paling banyak {MAKS_HALAMAN_PDF} halaman sekali lampir (tabel, rumus, dan gambar ikut terbaca). Pilih halaman bab yang diperlukan:
            </p>
            <button type="button" className={`${TOMBOL_KECIL} shrink-0 text-pudar hover:text-bahaya`} onClick={() => setPilihPdf(null)}>
              ✕ Batalkan
            </button>
          </div>
          <PilihHalamanPdf
            f={pilihPdf.f}
            jumlah={pilihPdf.jumlah}
            dari={pilihPdf.dari}
            sampai={pilihPdf.sampai}
            maks={MAKS_HALAMAN_PDF}
            ubah={(dari, sampai) => setPilihPdf({ ...pilihPdf, dari, sampai })}
          />
          <div className="flex flex-wrap items-center gap-2">
            Halaman
            <input type="number" min={1} max={pilihPdf.jumlah} aria-label="Dari halaman" className="h-8 w-20 rounded-lg border bg-kartu px-2 max-md:min-h-11" value={pilihPdf.dari || ""} onChange={(e) => setPilihPdf({ ...pilihPdf, dari: Number(e.target.value) })} />
            sampai
            <input type="number" min={1} max={pilihPdf.jumlah} aria-label="Sampai halaman" className="h-8 w-20 rounded-lg border bg-kartu px-2 max-md:min-h-11" value={pilihPdf.sampai || ""} onChange={(e) => setPilihPdf({ ...pilihPdf, sampai: Number(e.target.value) })} />
            <button
              className="h-8 rounded-lg bg-hijau px-3 font-semibold text-white disabled:opacity-40 max-md:min-h-11"
              disabled={!(pilihPdf.dari >= 1 && pilihPdf.sampai >= pilihPdf.dari && pilihPdf.dari <= pilihPdf.jumlah)}
              onClick={() => lanjutPdf(true)}
            >
              Baca dengan AI
            </button>
          </div>
          <p className="text-sm text-pudar">
            Nomor halaman menurut file PDF (bukan nomor yang tercetak di buku).{" "}
            <button className="underline" onClick={() => lanjutPdf(false)}>Pakai teks saja, semua halaman (tanpa AI: tabel, rumus, dan gambar tidak terbaca)</button>
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

/** 0.36.1: buka bagian Ayat & hadis lalu gulir ke kotak ke-`no` (dari pesan di dekat tombol Buat soal/Simpan). */
export function lihatDalil({ no, kolom }: { no: number; kolom: "arab" | "sumber" | "centang" }) {
  const bagian = document.getElementById("ayat-hadis") as HTMLDetailsElement | null;
  if (bagian) bagian.open = true;
  setTimeout(() => {
    const kotak = document.getElementById(`dalil-${no}`);
    const tuju =
      // sumber: kolom sumber, atau tombol "Hadis dari kitab lain" bila kotak masih bertanya "Ini apa?" (0.66.0)
      kolom === "centang" ? document.getElementById("centang-hadis") : kotak?.querySelector<HTMLElement>(kolom === "sumber" ? "[data-kolom=sumber]" : "textarea");
    (tuju ?? kotak)?.scrollIntoView({ behavior: "smooth", block: "center" });
    tuju?.focus({ preventScroll: true });
  }, 50);
}

// Seukuran tombol "Ambil ayat" / "✕ Batalkan" di kartu yang sama (0.65.1: dulu h-10, terlalu besar).
const TOMBOL_HIJAU = "h-8 rounded-lg bg-hijau px-3 text-sm font-semibold text-white disabled:opacity-40 max-md:min-h-11";

/** 0.65.0: gulir ke kotak TP (dari pesan di dekat tombol Buat soal/Simpan), fokus ke tombolnya, kotak berkedip sebentar. */
export function lihatTp() {
  const kotak = document.getElementById("kotak-tp");
  if (!kotak) return;
  kotak.scrollIntoView({ behavior: "smooth", block: "center" });
  kotak.querySelector<HTMLElement>("#setuju-tp, textarea")?.focus({ preventScroll: true });
  kotak.animate([{ boxShadow: "0 0 0 4px var(--color-peringatan-garis)" }, { boxShadow: "0 0 0 0 transparent" }], { duration: 900, iterations: 2 });
}

/** Status kotak kuning: apa yang masih kurang (sama dengan pemeriksaan server, kurangDalil). */
function StatusDalil({ d, diperiksa, mencocokkan }: { d: IsianMateri["dalil"][number]; diperiksa: boolean; mencocokkan: boolean }) {
  if (mencocokkan) return <span className="text-pudar">Mencocokkan ke mushaf dan data hadis 9 kitab...</span>;
  const kurang = kurangDalil(d);
  if (!d.arab.trim()) return <span className="text-peringatan">Tempel teks Arab hadisnya di sini (hadis 9 kitab otomatis dikenali), lalu isi sumbernya.</span>;
  if (kurang === "arab") return <span className="text-peringatan">Kolom teks Arab belum berisi huruf Arab.</span>;
  if (kurang === "sumber") return <span className="text-peringatan">Tidak ada di mushaf maupun data hadis 9 kitab. Isi sumbernya (mis. HR. Baihaqi), lalu periksa teksnya.</span>;
  return <span className="text-hijau-teks">{diperiksa ? "✓ Lengkap dan sudah diperiksa." : "✓ Lengkap. Periksa teks & harakatnya, lalu tekan tombol pemeriksaan di bawah."}</span>;
}

/** Tombol ikon sampah (hapus cepat satu dalil); ikon saja supaya ringkas. */
function TombolSampah({ onKlik, label }: { onKlik: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onKlik}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-kartu text-pudar hover:bg-krem-sorot hover:text-bahaya max-md:h-11 max-md:w-11"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6" />
      </svg>
    </button>
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
  const [ubahTp, setUbahTp] = useState(false);
  const daftarTp = draf.tp.split("\n").map((t) => t.trim()).filter(Boolean);
  const tulisTp = ubahTp || !daftarTp.length;
  const tungguTp = !!draf.tpUsulan && !draf.tpDibaca;
  // 0.66.0: kotak hijau/abu-abu yang sedang dibuka, dan kotak kuning yang sudah dijawab "Hadis dari kitab lain" (per nomor kotak)
  const [buka, setBuka] = useState<Set<number>>(new Set());
  const [pilihHadis, setPilihHadis] = useState<Set<number>>(new Set());
  const otomatis = draf.dalil.filter((d) => d.mushaf || d.kitab).length;
  const jumlahBukan = draf.dalil.filter(bukanDalil).length;
  const perluPeriksa = draf.dalil.filter((d) => !d.mushaf && !d.kitab && !bukanDalil(d) && (kurangDalil(d) || !draf.diverifikasi)).length;
  const adaKurang = draf.dalil.some((d) => kurangDalil(d));
  const balik = (s: Set<number>, i: number) => {
    const b = new Set(s);
    if (!b.delete(i)) b.add(i);
    return b;
  };
  const tanpa = (s: Set<number>, i: number) => new Set([...s].filter((j) => j !== i).map((j) => (j > i ? j - 1 : j)));
  function hapusDalil(i: number) {
    ubah({ dalil: draf.dalil.filter((_, j) => j !== i) });
    setBuka(tanpa(buka, i));
    setPilihHadis(tanpa(pilihHadis, i));
  }
  // 0.36.1: teks Arab kotak kuning dicocokkan ke mushaf/data hadis begitu guru selesai menempel (keluar dari kolom).
  const [mencocokkan, setMencocokkan] = useState<number | null>(null);
  const terkini = useRef(draf);
  terkini.current = draf; // jawaban server datang belakangan: pakai isi kartu terbaru, bukan saat kolom ditinggalkan
  async function cocokkan(i: number) {
    const d = draf.dalil[i];
    if (!d || d.mushaf || d.kitab || kurangDalil(d) === "arab" || !d.arab.trim()) return;
    setMencocokkan(i);
    // Batas 15 detik: permintaan yang terputus (mis. halaman dimuat ulang) tidak boleh membuat "Mencocokkan..." menggantung.
    const r = await Promise.race([
      cocokkanDalil(d.arab, d.sumber, draf.teksArab === "bahasa").catch(() => null),
      new Promise<null>((selesai) => setTimeout(() => selesai(null), 15_000)),
    ]);
    setMencocokkan(null);
    const kini = terkini.current;
    if (!r || kini.dalil[i]?.arab !== d.arab) return;
    const baru = { sumber: r.sumber, arab: r.arab, terjemah: kini.dalil[i].terjemah, ...("kitab" in r && r.kitab ? { kitab: true } : { mushaf: true }) };
    setDraf({ ...kini, dalil: kini.dalil.map((x, j) => (j === i ? baru : x)) });
  }
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
      {/* TP dirumuskan guru (RUJUKAN.md D): TP usulan AI wajib disetujui guru; server ikut memeriksa (rapikanMateri).
          0.65.0: TP tampil sebagai daftar + tombol "Sesuai" / "Ubah TP" (dulu kotak isian + centang kecil: guru awam
          mengira harus mengetik, centangnya terlewat). */}
      <div id="kotak-tp" className={`space-y-2 rounded-lg border p-2 ${tungguTp || !daftarTp.length ? "border-peringatan-garis bg-peringatan-muda" : "border-hijau"}`}>
        <p>
          Tujuan Pembelajaran (TP)
          <span className={`block text-sm ${tungguTp || !daftarTp.length ? "text-peringatan" : "text-hijau-teks"}`}>
            {!daftarTp.length
              ? "Tidak ada TP di materi Anda. Tulis atau tempel TP dari ATP/modul ajar Anda, satu per baris."
              : tulisTp
                ? "Satu TP per baris. Tekan Selesai bila sudah."
                : tungguTp
                  ? "Di materi Anda tidak tertulis TP, jadi AI mengusulkan TP di bawah. Baca dulu: sudah sesuai dengan yang Anda ajarkan?"
                  : draf.tpUsulan
                    ? "✓ TP sudah Anda setujui."
                    : "✓ TP dari materi Anda."}
          </span>
        </p>
        {tulisTp ? (
          <textarea
            rows={4}
            className={kotak}
            aria-label="Tujuan Pembelajaran, satu per baris"
            placeholder={"TP 1.1: Peserta didik mampu ...\nTP 1.2: Peserta didik mampu ..."}
            value={draf.tp}
            onChange={(e) => {
              setUbahTp(true); // mulai mengetik di kotak kosong: tetap kotak isian sampai Selesai
              ubah({ tp: e.target.value });
            }}
          />
        ) : (
          <ul className="space-y-1 rounded-lg border bg-kartu p-2">
            {daftarTp.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        )}
        {(tungguTp || ubahTp || daftarTp.length > 0) && (
          <div className="flex flex-wrap gap-2">
            {ubahTp ? (
              <button
                type="button"
                className={TOMBOL_HIJAU}
                disabled={!daftarTp.length}
                onClick={() => {
                  setUbahTp(false);
                  if (draf.tpUsulan) ubah({ tpDibaca: true }); // guru sendiri yang menulis/menyunting lalu menekan Selesai
                }}
              >
                ✓ Selesai, pakai TP ini
              </button>
            ) : (
              <>
                {tungguTp && (
                  <button id="setuju-tp" type="button" className={TOMBOL_HIJAU} onClick={() => ubah({ tpDibaca: true })}>
                    ✓ Sesuai, pakai TP ini
                  </button>
                )}
                <button type="button" className={TOMBOL_KECIL} onClick={() => setUbahTp(true)}>
                  Ubah TP
                </button>
              </>
            )}
          </div>
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
      {/* Terbuka bila sudah ada dalil; mapel tanpa ayat/hadis cukup melihat judulnya.
          0.66.0: ringkasan; kotak hijau (dikenali) & abu-abu (bukan ayat/hadis) cukup satu baris + Lihat; kotak kuning
          bertanya "Ini apa?" dengan 3 tombol; centang pemeriksaan jadi tombol. Aturan 5 tetap: hadis di luar data wajib
          bersumber dan dinyatakan sudah diperiksa guru (server memeriksa lagi di rapikanMateri). */}
      <details id="ayat-hadis" open={draf.dalil.length > 0} className="space-y-2">
        <summary className="cursor-pointer">
          Ayat & hadis ({draf.dalil.length})
          {perluPeriksa > 0 && <span className="text-peringatan"> · {perluPeriksa} perlu Anda periksa</span>}
        </summary>
        <div className="mt-2 space-y-2">
          {draf.dalil.length > 0 && (
            <p className="text-sm">
              {draf.dalil.length} teks Arab: <span className="text-hijau-teks">{otomatis} ✓ dikenali otomatis</span>
              {jumlahBukan > 0 && <span className="text-pudar"> · {jumlahBukan} bukan ayat/hadis</span>}
              {perluPeriksa > 0 && <b className="text-peringatan"> · {perluPeriksa} perlu Anda periksa</b>}
            </p>
          )}
          {draf.dalil.map((d, i) => {
            const hijau = d.mushaf || d.kitab;
            if (hijau || bukanDalil(d)) {
              const terbuka = buka.has(i);
              return (
                <div key={i} id={`dalil-${i}`} className={`rounded-lg border p-2 ${hijau ? "border-hijau" : "bg-krem"}`}>
                  <div className="flex items-center gap-2 text-sm">
                    <span className={`min-w-0 ${hijau ? "text-hijau-teks" : "text-pudar"}`}>{hijau ? `✓ ${d.sumber}` : "Bukan ayat/hadis"}</span>
                    {!terbuka && <bdi dir="rtl" lang="ar" className="min-w-0 flex-1 truncate text-right font-arab text-base max-sm:hidden">{d.arab}</bdi>}
                    <button type="button" className={`${TOMBOL_KECIL} ml-auto shrink-0`} aria-expanded={terbuka} onClick={() => setBuka(balik(buka, i))}>
                      {terbuka ? "Tutup" : "Lihat"}
                    </button>
                    <TombolSampah label={`Hapus dalil ${i + 1} dari materi`} onKlik={() => hapusDalil(i)} />
                  </div>
                  {terbuka && (
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-pudar">
                        {d.mushaf ? "Ayat dari data mushaf (Tanzil)." : d.kitab ? "Hadis dari data 9 kitab hadis." : "Teks Arab materi, tidak perlu sumber."}
                        {!hijau && <> <button type="button" className="underline hover:text-tinta" onClick={() => ubahDalil(i, { bukan: false, sumber: "" })}>Ternyata ayat/hadis? Ubah</button></>}
                      </p>
                      {hijau ? (
                        <p dir="rtl" lang="ar" className="font-arab text-xl leading-loose">{d.arab}</p>
                      ) : (
                        <textarea dir="rtl" lang="ar" rows={2} className={`${kotak} font-arab text-xl`} aria-label={`Teks Arab ${i + 1}`} value={d.arab} onChange={(e) => ubahDalil(i, { arab: e.target.value })} />
                      )}
                      <input className={kotak} placeholder="Terjemah (opsional)" value={d.terjemah} onChange={(e) => ubahDalil(i, { terjemah: e.target.value })} />
                    </div>
                  )}
                </div>
              );
            }
            // Kotak kuning: belum dijawab "ini apa?" = ada teks Arab, belum bersumber, belum dipilih Hadis.
            const tanya = !!d.arab.trim() && kurangDalil(d) !== "arab" && !d.sumber.trim() && !pilihHadis.has(i) && mencocokkan !== i;
            return (
              <div key={i} id={`dalil-${i}`} className="space-y-2 rounded-lg border border-peringatan-garis bg-peringatan-muda p-2">
                {tanya ? (
                  <>
                    <p className="text-sm text-peringatan">Teks Arab ini tidak ada di mushaf maupun data 9 kitab hadis. Ini apa?</p>
                    <p dir="rtl" lang="ar" className="font-arab text-xl leading-loose">{d.arab}</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        data-kolom="sumber"
                        className={TOMBOL_KECIL}
                        onClick={() => {
                          setPilihHadis(new Set(pilihHadis).add(i));
                          ubah({ diverifikasi: false }); // hadis baru = pemeriksaan diulang (aturan 5)
                        }}
                      >
                        Hadis dari kitab lain
                      </button>
                      <button type="button" className={TOMBOL_KECIL} onClick={() => ubahDalil(i, { bukan: true, sumber: SUMBER_BUKAN })}>
                        Bukan ayat/hadis (doa, niat, kaidah, istilah)
                      </button>
                      <TombolSampah label={`Hapus dalil ${i + 1} dari materi`} onKlik={() => hapusDalil(i)} />
                    </div>
                  </>
                ) : (
                  <>
                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                      <StatusDalil d={d} diperiksa={draf.diverifikasi} mencocokkan={mencocokkan === i} />
                      {/* Satu klik untuk teks Arab yang memang bukan ayat/hadis (dulu guru mengetik "bukan ayat/hadis" di kolom sumber). */}
                      <button type="button" className={TOMBOL_KECIL} onClick={() => ubahDalil(i, { bukan: true, sumber: SUMBER_BUKAN })}>
                        Bukan ayat/hadis
                      </button>
                    </p>
                    <textarea dir="rtl" lang="ar" rows={2} className={`${kotak} font-arab text-xl`} placeholder="نص الحديث" aria-label={`Teks Arab dalil ${i + 1}`} value={d.arab} onChange={(e) => ubahDalil(i, { arab: e.target.value })} onBlur={() => cocokkan(i)} />
                    <input data-kolom="sumber" autoFocus={pilihHadis.has(i) && !d.sumber} className={kotak} placeholder="Sumber, mis. HR. Baihaqi" aria-label={`Sumber dalil ${i + 1}`} value={d.sumber} onChange={(e) => ubahDalil(i, { sumber: e.target.value })} />
                    <input className={kotak} placeholder="Terjemah (opsional)" value={d.terjemah} onChange={(e) => ubahDalil(i, { terjemah: e.target.value })} />
                    <TombolSampah label={`Hapus dalil ${i + 1} dari materi`} onKlik={() => hapusDalil(i)} />
                  </>
                )}
              </div>
            );
          })}
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
          {/* Pernyataan pemeriksaan guru (aturan 5), 0.66.0: tombol, dulu centang kecil. Aktif setelah kotak kuning lengkap. */}
          {adaHadis && (
            <div className="flex flex-wrap items-center gap-2 text-sm">
              {draf.diverifikasi ? (
                <>
                  <span className="text-hijau-teks">✓ Teks & harakat hadis sudah Anda periksa sesuai kitabnya.</span>
                  <button type="button" className={TOMBOL_KECIL} onClick={() => ubah({ diverifikasi: false })}>Batalkan</button>
                </>
              ) : (
                <>
                  <button id="centang-hadis" type="button" className={TOMBOL_HIJAU} disabled={adaKurang} onClick={() => ubah({ diverifikasi: true })}>
                    ✓ Teks & harakat hadis sudah saya periksa sesuai kitabnya
                  </button>
                  {adaKurang && <span className="text-pudar">Lengkapi kotak kuning dulu.</span>}
                </>
              )}
            </div>
          )}
          <p className="text-sm text-pudar">
            Teks Al-Qur&apos;an: <a className="underline" href="https://tanzil.net" target="_blank" rel="noreferrer">Tanzil Project (tanzil.net)</a>. Teks hadis
            (Bukhari, Muslim, Abu Dawud, Tirmidzi, Nasa&apos;i, Ibnu Majah, Malik, Ahmad, Darimi): data terbuka hadith-api &amp; Hadith-Data-Sets. Hadis yang Anda
            tempel dicocokkan otomatis begitu selesai ditempel. Terjemah diisi guru.
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
