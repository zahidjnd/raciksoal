"use client";

import { useEffect, useState } from "react";
import { ambilDaftarBab, ambilDaftarModel, ambilJatah, cekHasil, mulaiBuatSoal } from "./actions";
import { KartuSoal, Teks } from "./kartu-soal";
import { ATURAN_TUJUAN, BOBOT_BAWAAN, KESULITAN, MAKS_CATATAN, MAKS_SOAL, NAMA_BENTUK, TUJUAN, type Pengaturan } from "@/lib/prompt";
import { pilihanAngka, type BarisKisi, type Bentuk } from "@/lib/soal";
import { DAFTAR_BAB as SEMUA_BAB } from "@/data";
import Link from "next/link";
import { useRouter } from "next/navigation";

const BAB_BAWAAN = Object.values(SEMUA_BAB);

/** Kartu jenis soal di atas kotak ketik (DESIGN.md). Keterangan diringkas dari ATURAN_TUJUAN di src/lib/prompt.ts. */
const ikon = (d: string) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);
const JENIS: { tujuan: (typeof TUJUAN)[number]; ket: string; ikon: React.ReactNode }[] = [
  { tujuan: "Ulangan Harian", ket: "Cek ketercapaian tiap TP dalam satu bab.", ikon: ikon("M7 4h10a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM9 13l2 2 4-4") },
  { tujuan: "PTS", ket: "Gaya ujian resmi tengah semester, merata ke semua TP.", ikon: ikon("M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM4 10h16M9 3v4M15 3v4") },
  { tujuan: "PAS", ket: "Gaya ujian resmi akhir semester, merata ke semua materi.", ikon: ikon("M5 21V4h11l-2 4 2 4H5") },
  { tujuan: "Latihan", ket: "Pembahasan panjang agar siswa bisa belajar mandiri.", ikon: ikon("M4 20h4L19 9l-4-4L4 16z") },
];
/** Contoh catatan untuk AI: sekali klik mengisi kotak catatan (umum, berlaku untuk bab mana pun). */
const CONTOH_CATATAN = ["Pakai nama santri putri", "Soal cerita kehidupan pesantren", "Tanpa teks Arab", "Bahasa sederhana"];
const BENTUK = Object.keys(NAMA_BENTUK) as Bentuk[];

type Hasil = NonNullable<Awaited<ReturnType<typeof cekHasil>>>;

function Angka({ label, nilai, ubah }: { label: string; nilai: number; ubah: (n: number) => void }) {
  return (
    <label className="flex items-center justify-between gap-2 text-sm">
      {label}
      <input type="number" min={0} max={MAKS_SOAL} value={nilai} onChange={(e) => ubah(Number(e.target.value))} className="w-20 rounded-lg border p-1 text-right" />
    </label>
  );
}

/** Tabel kisi-kisi (langkah 6, tab Kisi-kisi): satu baris per soal. Set lama tidak punya kisi-kisi. */
function TabelKisi({ kisi }: { kisi: BarisKisi[] }) {
  return (
    <div className="overflow-x-auto bg-kartu">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="bg-krem-sorot text-left">
              {["No. Soal", "TP", "Materi", "Indikator Soal", "Level", "Bentuk"].map((j) => (
                <th key={j} className="border p-2">{j}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {kisi.map((k) => (
              <tr key={k.no} className={`align-top ${k.peringatan?.length ? "bg-bahaya-muda" : ""}`}>
                <td className="border p-2 text-center">{k.no}</td>
                <td className="border p-2 whitespace-nowrap">{k.tp}</td>
                <td className="border p-2"><Teks teks={k.materi} /></td>
                <td className="border p-2">
                  {k.peringatan?.map((w, i) => <span key={i} className="block font-semibold text-bahaya">⚠️ {w}</span>)}
                  <Teks teks={k.indikator} />
                  <span className="block text-xs text-pudar">Stimulus: <Teks teks={k.stimulus} /></span>
                </td>
                <td className="border p-2 text-center">{k.level}</td>
                <td className="border p-2 whitespace-nowrap">{NAMA_BENTUK[k.bentuk]}</td>
              </tr>
            ))}
          </tbody>
        </table>
    </div>
  );
}

export function BuatSoal({ nama, awalId }: { nama: string; awalId: number | null }) {
  const router = useRouter();
  const [p, setP] = useState<Pengaturan>({
    babId: BAB_BAWAAN[0].id,
    tujuan: TUJUAN[0],
    jumlah: { PG: 10, PGK: 5, BS: 5, URAIAN: 5 },
    level: ATURAN_TUJUAN[TUJUAN[0]].level,
    kesulitan: "Sedang",
    bobot: BOBOT_BAWAAN,
    modelSlot: 1,
  });
  const [daftarModel, setDaftarModel] = useState<{ slot: number; nama: string }[]>([]);
  // Bab bawaan + materi sendiri milik guru (langkah 8); sebelum termuat, tampilkan bab bawaan saja.
  const [daftarBab, setDaftarBab] = useState(BAB_BAWAAN.map((b) => ({ id: b.id, judul: b.judul, sendiri: false })));
  const [banding, setBanding] = useState<{ nama: string; id?: number; pesan?: string }[]>([]);
  const [id, setId] = useState<number | null>(awalId); // dari ?id= (dibaca server), mis. buka set dari riwayat
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [error, setError] = useState("");
  const [detik, setDetik] = useState(0);
  const [buka, setBuka] = useState<"jumlah" | "lanjutan" | null>(null); // panel di bawah kotak ketik
  const [tab, setTab] = useState<"soal" | "kisi">("soal"); // halaman hasil
  const [semuaKunci, setSemuaKunci] = useState(false);
  const [jatah, setJatah] = useState<Awaited<ReturnType<typeof ambilJatah>>>(null);
  const muatJatah = () => ambilJatah().then(setJatah).catch(() => {});
  const jatahHabis = !!jatah?.batas && jatah.terpakai >= jatah.batas;

  const total = BENTUK.reduce((s, b) => s + p.jumlah[b], 0);
  const bobot = p.bobot ?? BOBOT_BAWAAN;
  const totalSkor = BENTUK.reduce((s, b) => s + p.jumlah[b] * bobot[b], 0);
  const totalLevel = p.level.LOTS + p.level.MOTS + p.level.HOTS;
  const memuat = id !== null && !hasil; // set dibuka, data belum terbaca (bisa set lama yang sudah selesai)
  const proses = hasil?.status === "proses";

  useEffect(() => {
    ambilDaftarModel().then(setDaftarModel).catch(() => {});
    ambilDaftarBab().then((d) => d.length && setDaftarBab(d)).catch(() => {});
    muatJatah();
  }, []);

  // Cek hasil tiap 3 detik selama AI masih bekerja.
  useEffect(() => {
    if (id === null) return;
    let berhenti = false;
    let sempatProses = false;
    const mulai = Date.now();
    const cek = async () => {
      if (berhenti) return;
      setDetik(Math.round((Date.now() - mulai) / 1000));
      const h = await cekHasil(id).catch(() => null);
      if (berhenti) return;
      if (!h) {
        setId(null);
        return setError("Hasil tidak ditemukan.");
      }
      setHasil(h);
      if (h.status === "proses") {
        sempatProses = true;
        setTimeout(cek, 3000);
      } else {
        muatJatah(); // selesai/gagal: perbarui sisa jatah (set gagal tidak dihitung)
        if (sempatProses) router.refresh(); // riwayat di sidebar ikut diperbarui
      }
    };
    cek();
    return () => {
      berhenti = true;
    };
  }, [id, router]);

  async function buat() {
    setError("");
    setHasil(null);
    setBanding([]);
    if (p.modelSlot === 0) {
      // Bandingkan: pengaturan sama persis, satu set per model. Tiap hasil dibuka di tab sendiri.
      for (const m of daftarModel) {
        const r = await mulaiBuatSoal({ ...p, modelSlot: m.slot, bandingkan: true }).catch(() => ({ ok: false as const, pesan: "Koneksi terputus." }));
        setBanding((b) => [...b, r.ok ? { nama: m.nama, id: r.id } : { nama: m.nama, pesan: r.pesan }]);
      }
      return;
    }
    const r = await mulaiBuatSoal(p);
    if (!r.ok) return setError(r.pesan);
    // Buka halaman set baru dengan pemuatan penuh (sama seperti membuka dari riwayat): sidebar langsung memuat
    // set ini (⏳) dan pengecekan status dimulai dari ?id=. JANGAN router.replace / history.replaceState + router.refresh
    // di sini: navigasi router di tengah pengecekan memutusnya (macet "0 detik"), dan refresh mengembalikan alamat ke "/".
    location.assign(`/?id=${r.id}`);
  }

  const bab = hasil?.bab ?? BAB_BAWAAN[0]; // salinan bab milik set (berisi ayat terverifikasi untuk tampilan & edit)
  const soal = hasil?.soal ?? [];

  /** Deret nomor: pindah ke tab Soal dulu (kartu belum tampil saat tab Kisi-kisi), lalu gulir ke soalnya. */
  function lompat(no: number) {
    setTab("soal");
    setTimeout(() => document.getElementById(`soal-${no}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  // Form tampil saat belum ada set yang dibuka, atau set gagal (supaya bisa langsung dicoba lagi).
  const tampilForm = id === null || hasil?.status === "gagal";
  const alasanTerkunci =
    total < 1 ? "Isi jumlah soal dulu." :
    total > MAKS_SOAL ? `Jumlah soal maksimal ${MAKS_SOAL}.` :
    totalLevel !== 100 ? `Komposisi level harus 100% (sekarang ${totalLevel}%), buka Lanjutan.` : "";
  // Pilihan dan aksi sama-sama kotak bersudut lembut seperti claude.ai (DESIGN.md).
  const chip = "inline-flex items-center rounded-lg border bg-kartu h-8 px-3 text-sm hover:bg-krem max-md:min-h-11";
  const aksi2 = "inline-flex items-center rounded-lg border bg-kartu h-8 px-3 text-sm hover:bg-krem max-md:min-h-11";
  const chipPanel = (b: typeof buka) => `${chip} ${buka === b ? "border-hijau bg-hijau-muda text-hijau-teks" : ""}`;

  return (
    <div className="space-y-6">

      {tampilForm && (
        <section className="mx-auto max-w-3xl space-y-3 pt-4 md:pt-12">
          <div className="pb-2 text-center">
            <h1 className="text-3xl md:text-4xl">Assalamu&apos;alaikum, {nama}</h1>
            <p className="mt-1 text-sm text-pudar">
              Pilih jenis soal, lalu atur bab dan jumlah soal di kotak bawah. Bab sendiri?{" "}
              <Link href="/materi" className="text-hijau-teks underline">Tambahkan di Materi saya</Link>
            </p>
          </div>

          {/* Kartu jenis soal: pilihan setara, jadi sengaja berbentuk sama. Memilih kartu ikut mengatur komposisi level. */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4" role="radiogroup" aria-label="Jenis soal">
            {JENIS.map((j) => {
              const pilih = p.tujuan === j.tujuan;
              return (
                <button
                  key={j.tujuan}
                  role="radio"
                  aria-checked={pilih}
                  onClick={() => setP({ ...p, tujuan: j.tujuan, level: ATURAN_TUJUAN[j.tujuan].level })}
                  className={`rounded-xl border bg-kartu p-3 text-left hover:border-pudar/40 ${pilih ? "border-hijau bg-hijau-muda/50 ring-1 ring-hijau" : ""}`}
                >
                  <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-hijau-muda text-hijau-teks">{j.ikon}</span>
                  <span className="block text-sm font-semibold">{j.tujuan}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-pudar">{j.ket}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="text-xs text-pudar">Contoh catatan:</span>
            {CONTOH_CATATAN.map((c) => (
              <button key={c} className={chip} onClick={() => setP({ ...p, catatan: c })}>{c}</button>
            ))}
          </div>

          <div className="rounded-2xl border bg-kartu p-3 shadow-sm focus-within:border-hijau focus-within:ring-2 focus-within:ring-hijau">
            <textarea
              className="w-full resize-none p-1 outline-none"
              rows={3}
              maxLength={MAKS_CATATAN}
              aria-label="Catatan untuk AI (opsional)"
              placeholder="Catatan untuk AI (opsional), bebas seperti chat. Mis. soal cerita tentang kehidupan pesantren; bahasa sederhana"
              value={p.catatan ?? ""}
              onChange={(e) => setP({ ...p, catatan: e.target.value })}
            />
            <div className="flex flex-wrap items-center gap-2">
              <select aria-label="Bab" className={`${chip} max-w-[11rem] truncate`} value={p.babId} onChange={(e) => setP({ ...p, babId: e.target.value })}>
                <optgroup label="Bab bawaan">
                  {daftarBab.filter((b) => !b.sendiri).map((b) => <option key={b.id} value={b.id}>{b.judul}</option>)}
                </optgroup>
                {daftarBab.some((b) => b.sendiri) && (
                  <optgroup label="Materi saya">
                    {daftarBab.filter((b) => b.sendiri).map((b) => <option key={b.id} value={b.id}>{b.judul}</option>)}
                  </optgroup>
                )}
              </select>
              <select aria-label="Tingkat kesulitan" className={chip} value={p.kesulitan} onChange={(e) => setP({ ...p, kesulitan: e.target.value })}>
                {KESULITAN.map((k) => <option key={k} value={k}>Kesulitan: {k}</option>)}
              </select>
              <button className={chipPanel("jumlah")} aria-expanded={buka === "jumlah"} onClick={() => setBuka(buka === "jumlah" ? null : "jumlah")}>
                {total} soal ▾
              </button>
              <button className={chipPanel("lanjutan")} aria-expanded={buka === "lanjutan"} onClick={() => setBuka(buka === "lanjutan" ? null : "lanjutan")}>
                Lanjutan ▾
              </button>
              <button
                className="ml-auto h-10 rounded-lg bg-hijau px-4 font-semibold text-white hover:bg-hijau-tua disabled:opacity-40"
                disabled={proses || jatahHabis || !!alasanTerkunci}
                onClick={buat}
              >
                Buat soal
              </button>
            </div>

            {buka === "jumlah" && (
              <fieldset className="mt-3 space-y-2 border-t pt-3">
                <legend className="sr-only">Jumlah soal × skor per soal</legend>
                <p className="text-xs text-pudar">Jumlah soal × skor per soal</p>
                {BENTUK.map((b) => (
                  <div key={b} className="flex items-center justify-between gap-2 text-sm">
                    {NAMA_BENTUK[b]}
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <input type="number" min={0} max={MAKS_SOAL} aria-label={`Jumlah ${NAMA_BENTUK[b]}`} value={p.jumlah[b]} onChange={(e) => setP({ ...p, jumlah: { ...p.jumlah, [b]: Number(e.target.value) } })} className="w-14 rounded-lg border p-1 text-right" />
                      ×
                      <input type="number" min={0} max={100} aria-label={`Skor per soal ${NAMA_BENTUK[b]}`} value={bobot[b]} onChange={(e) => setP({ ...p, bobot: { ...bobot, [b]: Number(e.target.value) } })} className="w-14 rounded-lg border p-1 text-right" />
                    </span>
                  </div>
                ))}
                <p className={`text-sm ${totalSkor === 100 ? "text-pudar" : "text-peringatan"}`}>
                  Total: {total} soal (maks {MAKS_SOAL}), skor {totalSkor}
                  {totalSkor !== 100 && " (bukan 100)"}
                </p>
              </fieldset>
            )}

            {buka === "lanjutan" && (
              <div className="mt-3 space-y-3 border-t pt-3">
                <fieldset className="space-y-2">
                  <legend className="mb-1 text-sm font-semibold">Komposisi level (total {totalLevel}%)</legend>
                  <p className="text-xs text-pudar">Terisi otomatis sesuai tujuan soal, boleh diubah.</p>
                  <Angka label="LOTS (C1–C2) %" nilai={p.level.LOTS} ubah={(n) => setP({ ...p, level: { ...p.level, LOTS: n } })} />
                  <Angka label="MOTS (C3) %" nilai={p.level.MOTS} ubah={(n) => setP({ ...p, level: { ...p.level, MOTS: n } })} />
                  <Angka label="HOTS (C4–C6) %" nilai={p.level.HOTS} ubah={(n) => setP({ ...p, level: { ...p.level, HOTS: n } })} />
                </fieldset>
                {/* Daftar model hanya dikirim server untuk admin; guru tidak melihat pilihan ini. */}
                {daftarModel.length > 0 && (
                  <label className="block text-sm">
                    Model AI <span className="rounded bg-peringatan-muda px-1 text-xs">admin</span>
                    <select className="mt-1 w-full rounded-lg border p-2" value={p.modelSlot} onChange={(e) => setP({ ...p, modelSlot: Number(e.target.value) })}>
                      {daftarModel.map((m) => (
                        <option key={m.slot} value={m.slot}>{m.nama}</option>
                      ))}
                      {daftarModel.length > 1 && <option value={0}>Bandingkan semua model (pengaturan sama)</option>}
                    </select>
                  </label>
                )}
              </div>
            )}
          </div>

          {alasanTerkunci && <p className="text-center text-sm text-peringatan">{alasanTerkunci}</p>}
          <p className="text-center text-xs text-pudar">
            {jatah &&
              (jatah.batas
                ? `Sisa jatah hari ini: ${Math.max(0, jatah.batas - jatah.terpakai)} dari ${jatah.batas} set. `
                : `Hari ini Anda membuat ${jatah.terpakai} set (admin, tanpa batas). `)}
            AI tetap wajib mengikuti aturan, termasuk larangan mengarang ayat dan hadis.
          </p>
          {jatahHabis && <p className="text-center font-semibold text-bahaya">Jatah hari ini habis. Silakan lanjutkan besok.</p>}
          {error && <p className="text-center text-bahaya">{error}</p>}
          {banding.length > 0 && (
            <div className="space-y-1 rounded-lg border border-batas bg-hijau-muda p-3 text-sm">
              <p className="font-semibold">Perbandingan dimulai. Buka tiap hasil (tab baru), tunggu sampai selesai:</p>
              {banding.map((b) =>
                b.id ? (
                  <a key={b.nama} className="block text-hijau-teks underline" href={`?id=${b.id}`} target="_blank" rel="noreferrer">
                    {b.nama} (set {b.id})
                  </a>
                ) : (
                  <p key={b.nama} className="text-bahaya">{b.nama}: {b.pesan}</p>
                ),
              )}
            </div>
          )}
        </section>
      )}

      {memuat && (
        <p className="flex items-center gap-3 text-pudar md:mt-16" role="status">
          <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-batas border-t-pudar" aria-hidden />
          Membuka set soal...
        </p>
      )}

      {proses && (
        <div className="mx-auto flex max-w-2xl items-center gap-4 rounded-2xl border border-hijau/25 bg-hijau-muda p-5 text-hijau-teks md:mt-16" role="status">
          <span className="h-8 w-8 shrink-0 animate-spin rounded-full border-4 border-hijau/25 border-t-hijau" aria-hidden />
          <div>
            <p className="font-semibold">
              Sedang meracik soal<span className="animate-pulse">...</span> {detik} detik
            </p>
            <p className="text-sm">
              {hasil?.pesan ? `${hasil.pesan}. ` : "Menyusun kisi-kisi dulu. "}Biasanya 1–3 menit. Halaman ini boleh ditinggal; set tersimpan di riwayat.
            </p>
          </div>
        </div>
      )}

      {hasil?.status === "gagal" && <p className="rounded-lg border border-bahaya-garis bg-bahaya-muda p-3 text-bahaya">Gagal membuat soal: {hasil.pesan}</p>}

      {hasil?.status === "selesai" && (
        <section className="space-y-5">
          <div className="space-y-1">
            <h1 className="text-2xl">{bab.judul}</h1>
            <p className="text-sm text-pudar">
              {soal.length} soal
              {hasil.model && <> · model: <b>{hasil.model}</b></>}
              {hasil.info && ` · ${hasil.info.detik} detik · ${(hasil.info.tokenMasuk + hasil.info.tokenKeluar).toLocaleString("id-ID")} token`}
              {` · ${soal.filter((s) => s.peringatan?.length).length} soal ditandai`}
            </p>
            <p className="text-xs text-pudar">File Word di bilah bawah selalu mengikuti isi terbaru, termasuk soal yang diedit atau diganti.</p>
          </div>
          <p className="rounded-lg border border-peringatan-garis bg-peringatan-muda p-3 font-semibold text-peringatan">
            ⚠️ Soal dibuat AI, wajib diperiksa guru sebelum dipakai.
            {soal.some(pilihanAngka) && <span className="block text-sm font-normal">Ada soal dengan pilihan angka: periksa ulang hitungannya, AI bisa salah hitung.</span>}
          </p>
          {hasil.catatan && (
            <div className="space-y-1 rounded-lg border bg-kartu p-3 text-sm">
              <p className="text-pudar">Catatan Anda: <span className="text-tinta">&ldquo;{hasil.catatan}&rdquo;</span></p>
              <p>
                <span className="font-semibold">Tanggapan AI:</span>{" "}
                {hasil.tanggapan ? <Teks teks={hasil.tanggapan} /> : <span className="text-pudar">(AI tidak memberi tanggapan; periksa apakah catatan sudah diikuti.)</span>}
              </p>
            </div>
          )}
          {!!hasil.info?.catatan?.length && (
            <div className="rounded-lg border border-peringatan-garis bg-peringatan-muda p-3 text-sm text-peringatan">
              <p className="font-semibold">⚠️ Model cadangan dipakai, karena model utama gagal:</p>
              <ul className="list-disc pl-5">
                {hasil.info.catatan.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}

          {/* Deret nomor: lompat ke soal; merah = ditandai penjaga ayat, wajib dicek. */}
          <nav aria-label="Lompat ke nomor soal" className="flex flex-wrap gap-1">
            {soal.map((s, i) => (
              <button
                key={i}
                onClick={() => lompat(i + 1)}
                title={s.peringatan?.length ? `Soal ${i + 1} ditandai, wajib dicek` : `Soal ${i + 1}`}
                className={`h-11 w-11 rounded-lg border text-sm md:h-8 md:w-8 ${s.peringatan?.length ? "border-bahaya-garis bg-bahaya-muda font-semibold text-bahaya" : "bg-kartu hover:bg-krem"}`}
              >
                {i + 1}
              </button>
            ))}
          </nav>

          <div className="flex flex-wrap items-center gap-2 border-b pb-3">
            {!!hasil.kisi?.length &&
              (["soal", "kisi"] as const).map((t) => (
                <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)} className={`${chip} ${tab === t ? "border-hijau bg-hijau-muda font-semibold text-hijau-teks" : ""}`}>
                  {t === "soal" ? "Soal" : `Kisi-kisi (${hasil.kisi!.length})`}
                </button>
              ))}
            <span className="flex-1" />
            {tab === "soal" && (
              <button className={chip} onClick={() => setSemuaKunci(!semuaKunci)}>
                {semuaKunci ? "Sembunyikan semua kunci" : "Tampilkan semua kunci"}
              </button>
            )}
          </div>

          {tab === "kisi" && !!hasil.kisi?.length ? (
            <TabelKisi kisi={hasil.kisi} />
          ) : (
            BENTUK.filter((b) => soal.some((s) => s.bentuk === b)).map((b) => (
              <div key={b} className="space-y-4">
                <h2>{NAMA_BENTUK[b]}</h2>
                {soal.map(
                  (s, i) =>
                    s.bentuk === b && (
                      <KartuSoal
                        key={i}
                        hasilId={id!}
                        no={i + 1}
                        s={s}
                        bab={bab}
                        semuaKunci={semuaKunci}
                        onUbah={(baru) => {
                          setHasil({ ...hasil, soal: soal.map((x, j) => (j === i ? baru : x)) });
                          cekHasil(id!).then((h) => h && setHasil(h)).catch(() => {}); // kisi-kisi ikut berubah di server
                        }}
                      />
                    ),
                )}
              </div>
            ))
          )}

          {/* Tombol unduh menempel di bawah layar. File Word selalu mengikuti isi terbaru (termasuk editan). */}
          <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-2 border-t border-garis bg-krem px-4 py-2 md:-mx-8 md:px-8">
            <span className="text-sm font-semibold">Unduh<span className="hidden sm:inline"> Word</span>:</span>
            <a className="inline-flex h-8 items-center rounded-lg bg-hijau px-4 text-sm font-semibold text-white hover:bg-hijau-tua max-md:min-h-11" href={`/api/word?id=${id}&jenis=soal`}>
              Soal
            </a>
            <a className={aksi2} href={`/api/word?id=${id}&jenis=kunci`}><span>Kunci<span className="hidden sm:inline"> &amp; pembahasan</span></span></a>
            {!!hasil.kisi?.length && <a className={aksi2} href={`/api/word?id=${id}&jenis=kisi`}>Kisi-kisi</a>}
          </div>
        </section>
      )}
    </div>
  );
}
