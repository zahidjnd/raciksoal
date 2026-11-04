"use client";

import { useEffect, useState } from "react";
import { ambilDaftarBab, ambilDaftarModel, ambilJatah, cekHasil, mulaiBuatSoal, ubahIdentitas } from "./actions";
import { simpanMateri } from "./materi/actions";
import { KartuSoal, Teks, TeksPeringatan } from "./kartu-soal";
import { KotakMateri, type MateriLama } from "./kotak-materi";
import { FormIdentitas, ringkasIdentitas } from "./form-identitas";
import { StepAngka } from "./step-angka";
import { skorOtomatis } from "@/lib/skor";
import { ATURAN_TUJUAN, BOBOT_BAWAAN, KESULITAN, MAKS_CATATAN, MAKS_SOAL, NAMA_BENTUK, NAMA_LEVEL_TKA, namaTujuan, semesterDari, TKA, TUJUAN, WAKTU_BAWAAN, type Identitas, type Pengaturan } from "@/lib/prompt";
import { KELAS, pilihanAngka, type BarisKisi, type Bentuk, type Soal } from "@/lib/soal";
import { DAFTAR_MAPEL, type IsianMateri } from "@/lib/materi";
import { useRouter } from "next/navigation";

// Mapel & kelas terakhir diingat per perangkat (kenyamanan saja; boleh hilang).
const INGAT = "raciksoal-mapel";
const bacaIngat = (): { mapel?: string; kelas?: string } => {
  try {
    return JSON.parse(localStorage.getItem(INGAT) ?? "{}");
  } catch {
    return {};
  }
};

/** Kartu jenis soal di atas kotak ketik (DESIGN.md). Keterangan diringkas dari ATURAN_TUJUAN di src/lib/prompt.ts. */
const ikon = (d: string) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d={d} />
  </svg>
);
const JENIS: { tujuan: (typeof TUJUAN)[number]; ket: string; ikon: React.ReactNode }[] = [
  { tujuan: "Ulangan Harian", ket: "Cek ketercapaian tiap TP dalam satu bab.", ikon: ikon("M7 4h10a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM9 13l2 2 4-4") },
  { tujuan: "PTS", ket: "Asesmen Formatif Tengah Semester, merata ke semua TP.", ikon: ikon("M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM4 10h16M9 3v4M15 3v4") },
  { tujuan: "PAS", ket: "Asesmen Sumatif Akhir Semester, merata ke semua materi.", ikon: ikon("M5 21V4h11l-2 4 2 4H5") },
  { tujuan: "Latihan", ket: "Pembahasan panjang agar siswa bisa belajar mandiri.", ikon: ikon("M4 20h4L19 9l-4-4L4 16z") },
  { tujuan: "Latihan TKA", ket: "Gaya TKA pusat: soal grup, tanpa uraian.", ikon: ikon("M12 3l9 5-9 5-9-5 9-5zM5 10.5V16l7 4 7-4v-5.5") },
];
/** Latihan TKA: bentuk PG / PGK / Kategori saja, bawaan 25 soal (ATURAN-SOAL.md bagian 9). */
const JUMLAH_TKA = { PG: 15, PGK: 5, BS: 5, MJ: 0, ISIAN: 0, URAIAN: 0 };
const JUMLAH_AWAL = { PG: 10, PGK: 5, BS: 5, MJ: 0, ISIAN: 0, URAIAN: 5 };
const BENTUK = Object.keys(NAMA_BENTUK) as Bentuk[];
/** Bentuk yang tidak dipakai Latihan TKA (TKA hanya PG, PGK, Kategori). */
const TANPA_TKA: Bentuk[] = ["MJ", "ISIAN", "URAIAN"];

type Hasil = NonNullable<Awaited<ReturnType<typeof cekHasil>>>;

/** Soal grup: "4–6" bila soal ke-i adalah soal pertama grupnya (wacana tampil di atasnya), selain itu null. */
function nomorGrup(soal: Soal[], i: number) {
  const g = soal[i].grup;
  if (!g || !soal[i].wacana || soal[i - 1]?.grup === g) return null;
  let j = i;
  while (soal[j + 1]?.grup === g) j++;
  return j > i ? `${i + 1}–${j + 1}` : `${i + 1}`;
}

function Angka({ label, nilai, ubah }: { label: string; nilai: number; ubah: (n: number) => void }) {
  return (
    <label className="flex items-center justify-between gap-2 text-sm">
      {label}
      <StepAngka label={label} nilai={nilai} ubah={ubah} max={100} />
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
                  {k.peringatan?.map((w, i) => <span key={i} className="block font-semibold text-bahaya"><TeksPeringatan w={w} /></span>)}
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

export function BuatSoal({ nama, awalId, awalMateri }: { nama: string; awalId: number | null; awalMateri: string[] }) {
  const router = useRouter();
  const [p, setP] = useState<Pengaturan>({
    babId: "",
    identitas: { ...semesterDari(new Date()), waktu: WAKTU_BAWAAN },
    tujuan: TUJUAN[0],
    jumlah: JUMLAH_AWAL,
    level: ATURAN_TUJUAN[TUJUAN[0]].level,
    kesulitan: "Sedang",
    bobot: BOBOT_BAWAAN,
    modelSlot: 1,
  });
  const [daftarModel, setDaftarModel] = useState<{ slot: number; nama: string }[]>([]);
  const [mapel, setMapel] = useState("");
  const [kelas, setKelas] = useState("");
  const [daftarBab, setDaftarBab] = useState<MateriLama[]>([]); // materi milik guru (tersimpan otomatis)
  const [pilihan, setPilihan] = useState<string[]>(awalMateri); // materi lama yang dipakai (?materi= dari "Pakai materi ini lagi")
  const [draf, setDraf] = useState<IsianMateri | null>(null); // materi baru hasil analisa AI, tersimpan saat "Buat soal"
  const [menyiapkan, setMenyiapkan] = useState(false);
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

  const tka = p.tujuan === TKA;
  const total = BENTUK.reduce((s, b) => s + p.jumlah[b], 0);
  // Skor per soal: otomatis (bulat, total 100) kecuali guru membuka "Atur skor".
  const [aturSkor, setAturSkor] = useState(false);
  const otomatis = skorOtomatis(p.jumlah);
  const bobot = aturSkor ? p.bobot ?? BOBOT_BAWAAN : otomatis.bobot;
  const totalSkor = BENTUK.reduce((s, b) => s + p.jumlah[b] * bobot[b], 0);
  const totalLevel = p.level.LOTS + p.level.MOTS + p.level.HOTS;
  const memuat = id !== null && !hasil; // set dibuka, data belum terbaca (bisa set lama yang sudah selesai)
  const proses = hasil?.status === "proses";

  useEffect(() => {
    ambilDaftarModel().then(setDaftarModel).catch(() => {});
    ambilDaftarBab()
      .then((d) => {
        setDaftarBab(d);
        // Mapel & kelas: dari materi yang dibuka lewat "Pakai materi ini lagi", atau pilihan terakhir di perangkat ini.
        const dari = d.find((m) => m.id === awalMateri[0]) ?? bacaIngat();
        if (dari.mapel) setMapel(dari.mapel);
        if (dari.kelas) setKelas(dari.kelas);
      })
      .catch(() => {});
    muatJatah();
  }, [awalMateri]);

  /** Ganti mapel/kelas: materi yang sudah dipilih (mapel lain) dilepas, pilihan diingat di perangkat ini. */
  function pilihMapel(m: string, k: string) {
    setMapel(m);
    setKelas(k);
    setPilihan([]);
    setDraf(null);
    try {
      localStorage.setItem(INGAT, JSON.stringify({ mapel: m, kelas: k }));
    } catch {}
  }

  /** Materi baru (draf) disimpan dulu, lalu semua id materi untuk set ini. Mengembalikan pesan kalau gagal. */
  async function siapkanMateri(): Promise<string[] | string> {
    if (!draf) return pilihan;
    const r = await simpanMateri(null, { ...draf, mapel, kelas }).catch(() => ({ ok: false as const, pesan: "Koneksi terputus. Coba lagi." }));
    if (!r.ok) return r.pesan;
    const id = `materi-${r.id}`;
    setDraf(null);
    setPilihan([...pilihan, id]); // supaya tidak tersimpan dua kali kalau pembuatan soal diulang
    setDaftarBab([{ id, judul: r.isian.judul, mapel, kelas }, ...daftarBab]);
    return [...pilihan, id];
  }

  // Cek hasil tiap 3 detik selama AI masih bekerja.
  useEffect(() => {
    if (id === null) return;
    let berhenti = false;
    let sempatProses = false;
    let adaBab = false; // bab cukup diambil sekali selama proses (untuk draf soal), lalu dipertahankan
    const mulai = Date.now();
    const cek = async () => {
      if (berhenti) return;
      setDetik(Math.round((Date.now() - mulai) / 1000));
      const h = await cekHasil(id, !adaBab).catch(() => null);
      if (berhenti) return;
      if (!h) {
        setId(null);
        return setError("Hasil tidak ditemukan.");
      }
      if (h.bab) adaBab = true;
      setHasil((lama) => (h.bab ? h : { ...h, bab: lama?.bab ?? null }));
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
    setMenyiapkan(true);
    const babIds = await siapkanMateri();
    setMenyiapkan(false);
    if (typeof babIds === "string") return setError(babIds);
    const isian = { ...p, bobot, babIds, babId: babIds[0] };
    if (p.modelSlot === 0) {
      // Bandingkan: pengaturan sama persis, satu set per model. Tiap hasil dibuka di tab sendiri.
      for (const m of daftarModel) {
        const r = await mulaiBuatSoal({ ...isian, modelSlot: m.slot, bandingkan: true }).catch(() => ({ ok: false as const, pesan: "Koneksi terputus." }));
        setBanding((b) => [...b, r.ok ? { nama: m.nama, id: r.id } : { nama: m.nama, pesan: r.pesan }]);
      }
      return;
    }
    const r = await mulaiBuatSoal(isian);
    if (!r.ok) return setError(r.pesan);
    // Buka halaman set baru dengan pemuatan penuh (sama seperti membuka dari riwayat): sidebar langsung memuat
    // set ini (⏳) dan pengecekan status dimulai dari ?id=. JANGAN router.replace / history.replaceState + router.refresh
    // di sini: navigasi router di tengah pengecekan memutusnya (macet "0 detik"), dan refresh mengembalikan alamat ke "/".
    location.assign(`/?id=${r.id}`);
  }

  const bab = hasil?.bab; // salinan bab milik set (berisi ayat terverifikasi untuk tampilan & edit)
  const soal = hasil?.soal ?? [];

  /** Deret nomor: pindah ke tab Soal dulu (kartu belum tampil saat tab Kisi-kisi), lalu gulir ke soalnya. */
  function lompat(no: number) {
    setTab("soal");
    setTimeout(() => document.getElementById(`soal-${no}`)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  // Form tampil saat belum ada set yang dibuka, atau set gagal (supaya bisa langsung dicoba lagi).
  const tampilForm = id === null || hasil?.status === "gagal";
  const alasanTerkunci =
    !mapel || !kelas ? "Pilih mata pelajaran dan kelas dulu." :
    !pilihan.length && !draf ? "Masukkan materi dulu (tempel teks, lampirkan file, atau pakai materi sebelumnya)." :
    total < 1 ? "Isi jumlah soal dulu." :
    total > MAKS_SOAL ? `Jumlah soal maksimal ${MAKS_SOAL}.` :
    totalLevel !== 100 ? `Komposisi level harus 100% (sekarang ${totalLevel}%), buka Lanjutan.` :
    tka && TANPA_TKA.some((b) => p.jumlah[b]) ? "Latihan TKA hanya memakai PG, PG kompleks, dan Kategori." : "";
  // Pilihan dan aksi sama-sama kotak bersudut lembut seperti claude.ai (DESIGN.md).
  const chip = "inline-flex items-center rounded-lg border bg-kartu h-8 px-3 text-sm hover:bg-krem max-md:min-h-11";
  const aksi2 = "inline-flex items-center rounded-lg border bg-kartu h-8 px-3 text-sm hover:bg-krem max-md:min-h-11";
  const chipPanel = (b: typeof buka) => `${chip} ${buka === b ? "border-hijau bg-hijau-muda text-hijau-teks" : ""}`;

  return (
    <div className="space-y-6">

      {tampilForm && (
        <section className="space-y-3 pt-4 md:pt-12">
          <div className="pb-2 text-center">
            <h1 className="text-3xl md:text-4xl">Assalamu&apos;alaikum, {nama}</h1>
            <p className="mt-1 text-sm text-pudar">Pilih mapel dan kelas, masukkan materi, lalu pilih jenis soal.</p>
          </div>

          <PilihMapel mapel={mapel} kelas={kelas} ubah={pilihMapel} />
          {/* Identitas ujian (kop Word) di bawah mapel & kelas (pilihan pemilik), terisi otomatis. Dilipat supaya
              di HP guru cepat sampai ke Materi (audit 2026-11-04); ringkasannya tetap terlihat. */}
          <details className="rounded-xl border bg-kartu px-3 text-sm">
            <summary className="flex min-h-10 cursor-pointer items-center gap-2 py-2 max-md:min-h-11">
              <span className="shrink-0 font-semibold">Kop ujian</span>
              <span className="min-w-0 truncate text-pudar">{ringkasIdentitas(p.identitas ?? {})}</span>
              <span className="ml-auto text-pudar" aria-hidden>▾</span>
            </summary>
            <div className="pb-3">
              <FormIdentitas nilai={p.identitas ?? {}} ubah={(identitas) => setP({ ...p, identitas })} />
            </div>
          </details>
          <KotakMateri mapel={mapel} kelas={kelas} daftar={daftarBab} pilihan={pilihan} setPilihan={setPilihan} draf={draf} setDraf={setDraf} />

          {/* Kartu jenis soal: pilihan setara, jadi sengaja berbentuk sama. Memilih kartu ikut mengatur komposisi level. */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5" role="radiogroup" aria-label="Jenis soal">
            {JENIS.map((j) => {
              const pilih = p.tujuan === j.tujuan;
              return (
                <button
                  key={j.tujuan}
                  role="radio"
                  aria-checked={pilih}
                  onClick={() =>
                    setP({
                      ...p,
                      tujuan: j.tujuan,
                      level: ATURAN_TUJUAN[j.tujuan].level,
                      // masuk TKA: komposisi bentuk gaya TKA; keluar dari TKA: kembali ke komposisi bawaan
                      ...(j.tujuan === TKA ? { jumlah: JUMLAH_TKA } : p.tujuan === TKA ? { jumlah: JUMLAH_AWAL } : {}),
                    })
                  }
                  className={`rounded-xl border bg-kartu p-3 text-left hover:border-pudar/40 ${pilih ? "border-hijau bg-hijau-muda/50 ring-1 ring-hijau" : ""}`}
                >
                  <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-hijau-muda text-hijau-teks">{j.ikon}</span>
                  <span className="block text-sm font-semibold">{namaTujuan(j.tujuan)}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-pudar">{j.ket}</span>
                </button>
              );
            })}
          </div>


          <div className="rounded-2xl border bg-kartu p-3 shadow-sm focus-within:border-hijau focus-within:ring-2 focus-within:ring-hijau">
            <textarea
              className="w-full resize-none p-1 outline-none"
              rows={3}
              maxLength={MAKS_CATATAN}
              aria-label="Catatan untuk AI (opsional)"
              placeholder="Catatan untuk AI (opsional), bebas seperti chat. Mis. soal cerita tentang kehidupan pesantren; bahasa sederhana; dan lain-lain"
              value={p.catatan ?? ""}
              onChange={(e) => setP({ ...p, catatan: e.target.value })}
            />
            <div className="flex flex-wrap items-center gap-2">
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
                disabled={proses || menyiapkan || jatahHabis || !!alasanTerkunci}
                onClick={buat}
              >
                {menyiapkan ? "Menyimpan materi..." : "Buat soal"}
              </button>
            </div>

            {buka === "jumlah" && (
              <fieldset className="mt-3 border-t pt-3">
                <legend className="sr-only">Jumlah soal dan skor per soal</legend>
                <p className="pb-1 text-xs text-pudar">Jumlah soal per jenis</p>
                <div className="divide-y text-sm">
                  {BENTUK.filter((b) => !(tka && TANPA_TKA.includes(b))).map((b) => {
                    const n = p.jumlah[b];
                    return (
                      <div key={b} className="flex flex-col gap-1 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                        <span className={n ? "" : "text-pudar"}>
                          {NAMA_BENTUK[b]}
                          {!aturSkor && n > 0 && <span className="ml-2 text-xs text-pudar">{bobot[b]} poin/soal</span>}
                        </span>
                        <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
                          {aturSkor && n > 0 && (
                            <span className="flex items-center gap-1 text-xs text-pudar">
                              poin
                              <StepAngka label={`Skor per soal ${NAMA_BENTUK[b]}`} nilai={bobot[b]} ubah={(v) => setP({ ...p, bobot: { ...bobot, [b]: v } })} max={100} />
                            </span>
                          )}
                          <StepAngka label={`Jumlah ${NAMA_BENTUK[b]}`} nilai={n} ubah={(v) => setP({ ...p, jumlah: { ...p.jumlah, [b]: v } })} max={MAKS_SOAL} />
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3 text-sm">
                  <p className={totalSkor === 100 ? "text-hijau-teks" : "text-peringatan"}>
                    {total} soal (maks {MAKS_SOAL}) · skor {totalSkor}
                    {totalSkor === 100 && " ✓"}
                    {totalSkor !== 100 && aturSkor && ` (${totalSkor < 100 ? "kurang" : "lebih"} ${Math.abs(100 - totalSkor)})`}
                    {totalSkor !== 100 && !aturSkor && total > 0 && ": dengan jumlah ini skor bulat tidak bisa pas 100. Ubah jumlah soal atau atur skor sendiri."}
                  </p>
                  <span className="flex gap-2">
                    {aturSkor && totalSkor !== 100 && <button type="button" className={aksi2} onClick={() => setP({ ...p, bobot: skorOtomatis(p.jumlah, bobot).bobot })}>Pas-kan 100</button>}
                    <button type="button" className={aksi2} onClick={() => { if (!aturSkor) setP({ ...p, bobot: otomatis.bobot }); setAturSkor(!aturSkor); }}>
                      {aturSkor ? "Skor otomatis" : "Atur skor ▾"}
                    </button>
                  </span>
                </div>
              </fieldset>
            )}

            {buka === "lanjutan" && (
              <div className="mt-3 space-y-3 border-t pt-3">
                <fieldset className="space-y-2">
                  <legend className="mb-1 text-sm font-semibold">Komposisi level (total {totalLevel}%)</legend>
                  <p className="text-xs text-pudar">Terisi otomatis sesuai tujuan soal, boleh diubah.</p>
                  <Angka label={`${tka ? `${NAMA_LEVEL_TKA.LOTS} / ` : ""}LOTS (C1–C2) %`} nilai={p.level.LOTS} ubah={(n) => setP({ ...p, level: { ...p.level, LOTS: n } })} />
                  <Angka label={`${tka ? `${NAMA_LEVEL_TKA.MOTS} / ` : ""}MOTS (C3) %`} nilai={p.level.MOTS} ubah={(n) => setP({ ...p, level: { ...p.level, MOTS: n } })} />
                  <Angka label={`${tka ? `${NAMA_LEVEL_TKA.HOTS} / ` : ""}HOTS (C4–C6) %`} nilai={p.level.HOTS} ubah={(n) => setP({ ...p, level: { ...p.level, HOTS: n } })} />
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

      {proses && !!soal.length && (
        <div className="flex items-center gap-2 rounded-lg border border-hijau/25 bg-hijau-muda px-3 py-2 text-sm text-hijau-teks" role="status">
          <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-hijau/25 border-t-hijau" aria-hidden />
          <span>Masih meracik: {soal.length} dari {hasil?.kisi?.length ?? "?"} soal sudah jadi · {detik} detik</span>
        </div>
      )}

      {proses && !soal.length && (
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

      {/* Tampil bertahap: kisi-kisi begitu jadi, lalu soal per tahap sebagai draf (hanya dibaca). */}
      {proses && hasil?.kisi?.length ? (
        <section className="space-y-4">
          <details open={!soal.length} className="rounded-xl border bg-kartu">
            <summary className="cursor-pointer p-3 font-semibold">Kisi-kisi ({hasil.kisi.length} soal)</summary>
            <TabelKisi kisi={hasil.kisi} />
          </details>
          {!!soal.length && bab && (
            <>
              <p className="rounded-lg border border-peringatan-garis bg-peringatan-muda p-3 text-sm">
                <b>Draf: {soal.length} dari {hasil.kisi.length} soal sudah jadi.</b> Kunci, urutan pilihan, dan skor ditetapkan
                setelah semua selesai; edit dan unduh Word tersedia setelah itu.
              </p>
              {soal.map((s, i) => (
                <KartuSoal key={i} draf hasilId={id!} no={i + 1} s={s} bab={bab} semuaKunci={false} nomorGrup={nomorGrup(soal, i)} onUbah={() => {}} />
              ))}
            </>
          )}
        </section>
      ) : null}

      {hasil?.status === "gagal" && <p className="rounded-lg border border-bahaya-garis bg-bahaya-muda p-3 text-bahaya">Gagal membuat soal: {hasil.pesan}</p>}

      {hasil?.status === "selesai" && bab && (
        <section className="space-y-5">
          <div className="space-y-1">
            <h1 className="text-2xl">{hasil.nama ?? bab.judul}</h1>
            {/* Ganti nama & hapus set lewat menu ⋯ / klik kanan di riwayat sidebar (baris-riwayat.tsx). */}
            {hasil.nama && <p className="text-sm text-pudar">Materi: {bab.judul}</p>}
            <p className="text-sm text-pudar">
              {soal.length} soal
              {hasil.model && <> · model: <b>{hasil.model}</b></>}
              {hasil.info && ` · ${hasil.info.detik} detik · ${(hasil.info.tokenMasuk + hasil.info.tokenKeluar).toLocaleString("id-ID")} token`}
              {` · ${soal.filter((s) => s.peringatan?.length).length} soal ditandai`}
            </p>
            <p className="text-xs text-pudar">File Word di bilah bawah selalu mengikuti isi terbaru, termasuk soal yang diedit atau diganti.</p>
            {/* Set dari materi (bukan set lama dari bab bawaan): buat set baru dengan materi yang sama. Muat penuh, lihat komentar di kepala.tsx. */}
            {hasil.babId.split(",").every((b) => /^materi-\d+$/.test(b)) && (
              <a href={`/?materi=${hasil.babId}`} className="inline-block text-sm text-hijau-teks underline">
                Pakai materi ini lagi untuk set baru
              </a>
            )}
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
          {/* HP: satu baris yang bisa digeser (dulu 4 baris untuk 25 soal); laptop: membungkus. */}
          <nav aria-label="Lompat ke nomor soal" className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0">
            {soal.map((s, i) => (
              <button
                key={i}
                onClick={() => lompat(i + 1)}
                title={s.peringatan?.length ? `Soal ${i + 1} ditandai, wajib dicek` : `Soal ${i + 1}`}
                className={`h-11 w-11 shrink-0 rounded-lg border text-sm md:h-8 md:w-8 ${s.peringatan?.length ? "border-bahaya-garis bg-bahaya-muda font-semibold text-bahaya" : "bg-kartu hover:bg-krem"}`}
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
                        nomorGrup={nomorGrup(soal, i)}
                        onUbah={(baru) => {
                          setHasil({ ...hasil, soal: soal.map((x, j) => (j === i ? baru : x)) });
                          cekHasil(id!).then((h) => h && setHasil(h)).catch(() => {}); // kisi-kisi ikut berubah di server
                        }}
                        onSetBerubah={(ke) =>
                          cekHasil(id!)
                            .then((h) => {
                              if (h) setHasil(h);
                              if (ke) lompat(ke); // soal tambahan langsung terlihat
                            })
                            .catch(() => {})
                        }
                      />
                    ),
                )}
              </div>
            ))
          )}

          <IdentitasHasil key={id} id={id!} awal={hasil.identitas} />

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

/** Mapel (daftar tetap + "Lainnya") dan kelas, di atas kotak materi. */
function PilihMapel({ mapel, kelas, ubah }: { mapel: string; kelas: string; ubah: (mapel: string, kelas: string) => void }) {
  const lain = !!mapel && !DAFTAR_MAPEL.includes(mapel);
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
        {DAFTAR_MAPEL.map((m) => <option key={m}>{m}</option>)}
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

/** Halaman hasil: identitas ujian (kop Word) bisa diubah kapan saja tanpa membuat soal ulang (tanpa AI). */
function IdentitasHasil({ id, awal }: { id: number; awal: Identitas }) {
  const [buka, setBuka] = useState(false);
  const [nilai, setNilai] = useState<Identitas>(awal);
  const [pesan, setPesan] = useState("");
  const [proses, setProses] = useState(false);
  async function simpan() {
    setProses(true);
    const r = await ubahIdentitas(id, nilai).catch(() => ({ ok: false as const, pesan: "Koneksi terputus. Coba lagi." }));
    setProses(false);
    setPesan(r.ok ? "Tersimpan. Unduh ulang Word untuk melihat perubahannya." : r.pesan);
  }
  return (
    <div className="rounded-xl border bg-kartu p-3 text-sm">
      <button className="font-semibold" aria-expanded={buka} onClick={() => setBuka(!buka)}>
        Identitas ujian di kop Word {buka ? "▴" : "▾"}
      </button>
      {buka && (
        <div className="mt-3 space-y-3">
          <FormIdentitas nilai={nilai} ubah={setNilai} />
          <div className="flex flex-wrap items-center gap-2">
            <button className="h-8 rounded-lg bg-hijau px-3 font-semibold text-white disabled:opacity-50 max-md:min-h-11" disabled={proses} onClick={simpan}>
              {proses ? "Menyimpan..." : "Simpan identitas"}
            </button>
            {pesan && <span className="text-pudar">{pesan}</span>}
          </div>
        </div>
      )}
    </div>
  );
}