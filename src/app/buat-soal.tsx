"use client";

import { useEffect, useState } from "react";
import { ambilDaftarBab, ambilDaftarModel, ambilJatah, cekHasil, mulaiBuatSoal } from "./actions";
import { KartuSoal, Teks } from "./kartu-soal";
import { ATURAN_TUJUAN, BOBOT_BAWAAN, KESULITAN, MAKS_CATATAN, MAKS_SOAL, NAMA_BENTUK, TUJUAN, type Pengaturan } from "@/lib/prompt";
import type { BarisKisi, Bentuk } from "@/lib/soal";
import { DAFTAR_BAB as SEMUA_BAB } from "@/data";
import Link from "next/link";
import { useRouter } from "next/navigation";

const BAB_BAWAAN = Object.values(SEMUA_BAB);

/** Tombol cepat di bawah kotak ketik (DESIGN.md). Jumlah & skor bawaan AFTS; latihan 10 PG x 10 = skor 100. */
const CEPAT: { label: string; isi: Pick<Pengaturan, "jumlah" | "bobot"> & { tujuan: (typeof TUJUAN)[number] } }[] = [
  { label: "Ulangan harian · 25 soal", isi: { tujuan: "Ulangan Harian", jumlah: { PG: 10, PGK: 5, BS: 5, URAIAN: 5 }, bobot: BOBOT_BAWAAN } },
  { label: "PAS · 25 soal", isi: { tujuan: "PAS", jumlah: { PG: 10, PGK: 5, BS: 5, URAIAN: 5 }, bobot: BOBOT_BAWAAN } },
  { label: "Latihan cepat · 10 PG", isi: { tujuan: "Latihan", jumlah: { PG: 10, PGK: 0, BS: 0, URAIAN: 0 }, bobot: { ...BOBOT_BAWAAN, PG: 10 } } },
];
const BENTUK = Object.keys(NAMA_BENTUK) as Bentuk[];

type Hasil = NonNullable<Awaited<ReturnType<typeof cekHasil>>>;

function Angka({ label, nilai, ubah }: { label: string; nilai: number; ubah: (n: number) => void }) {
  return (
    <label className="flex items-center justify-between gap-2 text-sm">
      {label}
      <input type="number" min={0} max={MAKS_SOAL} value={nilai} onChange={(e) => ubah(Number(e.target.value))} className="w-20 rounded border p-1 text-right" />
    </label>
  );
}

/** Tabel kisi-kisi (langkah 6, tab Kisi-kisi): satu baris per soal. Set lama tidak punya kisi-kisi. */
function TabelKisi({ kisi }: { kisi: BarisKisi[] }) {
  return (
    <div className="overflow-x-auto bg-white">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              {["No. Soal", "TP", "Materi", "Indikator Soal", "Level", "Bentuk"].map((j) => (
                <th key={j} className="border p-2">{j}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {kisi.map((k) => (
              <tr key={k.no} className={`align-top ${k.peringatan?.length ? "bg-red-50" : ""}`}>
                <td className="border p-2 text-center">{k.no}</td>
                <td className="border p-2 whitespace-nowrap">{k.tp}</td>
                <td className="border p-2"><Teks teks={k.materi} /></td>
                <td className="border p-2">
                  {k.peringatan?.map((w, i) => <span key={i} className="block font-semibold text-red-700">⚠️ {w}</span>)}
                  <Teks teks={k.indikator} />
                  <span className="block text-xs text-gray-500">Stimulus: <Teks teks={k.stimulus} /></span>
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
  const chip = "inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-krem max-md:min-h-11";
  const aksi2 = "inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 max-md:min-h-11";
  const chipPanel = (b: typeof buka) => `${chip} ${buka === b ? "border-hijau bg-hijau-muda text-hijau-tua" : ""}`;

  return (
    <div className="space-y-6">

      {tampilForm && (
        <section className="mx-auto max-w-2xl space-y-3 pt-4 md:pt-16">
          <h1 className="pb-4 text-center text-3xl md:text-4xl">Assalamu&apos;alaikum, {nama}</h1>

          <div className="rounded-2xl border border-gray-300 bg-white p-3 shadow-sm focus-within:border-hijau focus-within:ring-2 focus-within:ring-hijau">
            <textarea
              className="w-full resize-none p-1 outline-none"
              rows={3}
              maxLength={MAKS_CATATAN}
              aria-label="Catatan untuk AI (opsional)"
              placeholder="Mau buat soal apa hari ini? Catatan untuk AI (opsional), mis. fokus QS An-Nur ayat 2; pakai nama santri putri"
              value={p.catatan ?? ""}
              onChange={(e) => setP({ ...p, catatan: e.target.value })}
            />
            <div className="flex flex-wrap items-center gap-2">
              <select aria-label="Bab" className={`${chip} max-w-[15rem] truncate`} value={p.babId} onChange={(e) => setP({ ...p, babId: e.target.value })}>
                <optgroup label="Bab bawaan">
                  {daftarBab.filter((b) => !b.sendiri).map((b) => <option key={b.id} value={b.id}>{b.judul}</option>)}
                </optgroup>
                {daftarBab.some((b) => b.sendiri) && (
                  <optgroup label="Materi saya">
                    {daftarBab.filter((b) => b.sendiri).map((b) => <option key={b.id} value={b.id}>{b.judul}</option>)}
                  </optgroup>
                )}
              </select>
              <select
                aria-label="Tujuan soal"
                className={chip}
                value={p.tujuan}
                onChange={(e) => {
                  const tujuan = e.target.value as (typeof TUJUAN)[number];
                  setP({ ...p, tujuan, level: ATURAN_TUJUAN[tujuan].level }); // komposisi level ikut tujuan
                }}
              >
                {TUJUAN.map((t) => <option key={t}>{t}</option>)}
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
              <span className="flex-1" />
              <button
                className="h-10 rounded-lg bg-hijau px-4 font-semibold text-white hover:bg-hijau-tua disabled:opacity-40"
                disabled={proses || jatahHabis || !!alasanTerkunci}
                onClick={buat}
              >
                Buat soal
              </button>
            </div>

            {buka === "jumlah" && (
              <fieldset className="mt-3 space-y-2 border-t pt-3">
                <legend className="sr-only">Jumlah soal × skor per soal</legend>
                <p className="text-xs text-gray-500">Jumlah soal × skor per soal</p>
                {BENTUK.map((b) => (
                  <div key={b} className="flex items-center justify-between gap-2 text-sm">
                    {NAMA_BENTUK[b]}
                    <span className="flex items-center gap-1 whitespace-nowrap">
                      <input type="number" min={0} max={MAKS_SOAL} aria-label={`Jumlah ${NAMA_BENTUK[b]}`} value={p.jumlah[b]} onChange={(e) => setP({ ...p, jumlah: { ...p.jumlah, [b]: Number(e.target.value) } })} className="w-14 rounded border p-1 text-right" />
                      ×
                      <input type="number" min={0} max={100} aria-label={`Skor per soal ${NAMA_BENTUK[b]}`} value={bobot[b]} onChange={(e) => setP({ ...p, bobot: { ...bobot, [b]: Number(e.target.value) } })} className="w-14 rounded border p-1 text-right" />
                    </span>
                  </div>
                ))}
                <p className={`text-sm ${totalSkor === 100 ? "text-gray-600" : "text-amber-700"}`}>
                  Total: {total} soal (maks {MAKS_SOAL}), skor {totalSkor}
                  {totalSkor !== 100 && " (bukan 100)"}
                </p>
              </fieldset>
            )}

            {buka === "lanjutan" && (
              <div className="mt-3 space-y-3 border-t pt-3">
                <fieldset className="space-y-2">
                  <legend className="mb-1 text-sm font-semibold">Komposisi level (total {totalLevel}%)</legend>
                  <p className="text-xs text-gray-500">Terisi otomatis sesuai tujuan soal, boleh diubah.</p>
                  <Angka label="LOTS (C1–C2) %" nilai={p.level.LOTS} ubah={(n) => setP({ ...p, level: { ...p.level, LOTS: n } })} />
                  <Angka label="MOTS (C3) %" nilai={p.level.MOTS} ubah={(n) => setP({ ...p, level: { ...p.level, MOTS: n } })} />
                  <Angka label="HOTS (C4–C6) %" nilai={p.level.HOTS} ubah={(n) => setP({ ...p, level: { ...p.level, HOTS: n } })} />
                </fieldset>
                {/* Daftar model hanya dikirim server untuk admin; guru tidak melihat pilihan ini. */}
                {daftarModel.length > 0 && (
                  <label className="block text-sm">
                    Model AI <span className="rounded bg-amber-100 px-1 text-xs">admin</span>
                    <select className="mt-1 w-full rounded border p-2" value={p.modelSlot} onChange={(e) => setP({ ...p, modelSlot: Number(e.target.value) })}>
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

          {/* Tombol cepat: mengisi pengaturan siap pakai (belum membuat soal); guru tetap menekan "Buat soal". */}
          <div className="flex flex-wrap justify-center gap-2">
            {CEPAT.map((c) => (
              <button key={c.label} className={`${chip} text-pudar hover:text-tinta`} onClick={() => setP({ ...p, ...c.isi, level: ATURAN_TUJUAN[c.isi.tujuan].level })}>
                {c.label}
              </button>
            ))}
            <Link href="/materi" className={`${chip} text-pudar hover:text-tinta`}>Pakai materi saya</Link>
          </div>

          {alasanTerkunci && <p className="text-center text-sm text-amber-700">{alasanTerkunci}</p>}
          <p className="text-center text-xs text-pudar">
            {jatah &&
              (jatah.batas
                ? `Sisa jatah hari ini: ${Math.max(0, jatah.batas - jatah.terpakai)} dari ${jatah.batas} set. `
                : `Hari ini Anda membuat ${jatah.terpakai} set (admin, tanpa batas). `)}
            AI tetap wajib mengikuti aturan, termasuk larangan mengarang ayat dan hadis.
          </p>
          {jatahHabis && <p className="text-center font-semibold text-red-600">Jatah hari ini habis. Silakan lanjutkan besok.</p>}
          {error && <p className="text-center text-red-600">{error}</p>}
          {banding.length > 0 && (
            <div className="space-y-1 rounded border border-blue-300 bg-blue-50 p-3 text-sm">
              <p className="font-semibold">Perbandingan dimulai. Buka tiap hasil (tab baru), tunggu sampai selesai:</p>
              {banding.map((b) =>
                b.id ? (
                  <a key={b.nama} className="block text-blue-700 underline" href={`?id=${b.id}`} target="_blank" rel="noreferrer">
                    {b.nama} (set {b.id})
                  </a>
                ) : (
                  <p key={b.nama} className="text-red-600">{b.nama}: {b.pesan}</p>
                ),
              )}
            </div>
          )}
        </section>
      )}

      {memuat && (
        <p className="flex items-center gap-3 text-gray-600 md:mt-16" role="status">
          <span className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-gray-200 border-t-gray-600" aria-hidden />
          Membuka set soal...
        </p>
      )}

      {proses && (
        <div className="mx-auto flex max-w-2xl items-center gap-4 rounded-2xl border border-hijau/25 bg-hijau-muda p-5 text-hijau-tua md:mt-16" role="status">
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

      {hasil?.status === "gagal" && <p className="rounded border border-red-300 bg-red-50 p-3 text-red-700">Gagal membuat soal: {hasil.pesan}</p>}

      {hasil?.status === "selesai" && (
        <section className="space-y-4">
          <div>
            <h1 className="text-xl">{bab.judul}</h1>
            <p className="text-sm text-gray-500">
              {soal.length} soal
              {hasil.model && <> · model: <b>{hasil.model}</b></>}
              {hasil.info && ` · ${hasil.info.detik} detik · ${(hasil.info.tokenMasuk + hasil.info.tokenKeluar).toLocaleString("id-ID")} token`}
              {` · ${soal.filter((s) => s.peringatan?.length).length} soal ditandai`}
            </p>
          </div>
          <p className="rounded-lg border border-amber-400 bg-amber-50 p-3 font-semibold text-amber-900">
            ⚠️ Soal dibuat AI, wajib diperiksa guru sebelum dipakai.
          </p>
          {!!hasil.info?.catatan?.length && (
            <div className="rounded-lg border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900">
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
                className={`h-11 w-11 rounded-md border text-sm md:h-8 md:w-8 ${s.peringatan?.length ? "border-red-400 bg-red-50 font-semibold text-red-700" : "border-gray-300 hover:bg-gray-100"}`}
              >
                {i + 1}
              </button>
            ))}
          </nav>

          <div className="flex flex-wrap items-center gap-2 border-b pb-3">
            {!!hasil.kisi?.length &&
              (["soal", "kisi"] as const).map((t) => (
                <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)} className={`${chip} ${tab === t ? "border-hijau bg-hijau-muda font-semibold text-hijau-tua" : ""}`}>
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
                <h2 className="text-lg font-bold">{NAMA_BENTUK[b]}</h2>
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
            <a className="inline-flex items-center rounded-lg bg-hijau px-4 py-1.5 text-sm font-semibold text-white hover:bg-hijau-tua max-md:min-h-11" href={`/api/word?id=${id}&jenis=soal`}>
              Soal
            </a>
            <a className={aksi2} href={`/api/word?id=${id}&jenis=kunci`}>Kunci<span className="hidden sm:inline"> & pembahasan</span></a>
            {!!hasil.kisi?.length && <a className={aksi2} href={`/api/word?id=${id}&jenis=kisi`}>Kisi-kisi</a>}
            <span className="hidden text-xs text-gray-500 sm:inline">Mengikuti isi terbaru, termasuk soal yang diedit/diganti.</span>
          </div>
        </section>
      )}
    </div>
  );
}
