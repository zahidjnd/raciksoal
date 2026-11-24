import { wajibMasuk } from "@/lib/sesi";
import { pilihSapaan } from "@/lib/sapaan";
import { ambilPreferensi } from "@/lib/pemakaian";
import { BuatSoal } from "../buat-soal";
import { Kerangka } from "../kepala";

/** Racik Soal (sejak 1.0.1 di /racik; alamat / = halaman awal dua kartu). Set baru, atau set yang dibuka lewat ?id=. */
export default async function RacikSoal({ searchParams }: { searchParams: Promise<{ id?: string; materi?: string }> }) {
  const p = await wajibMasuk();
  const q = await searchParams;
  // Nomor set dari alamat (?id=) dikirim sejak awal, supaya form kosong tidak sempat tampil saat membuka set.
  // Pemeriksaan pemilik tetap di server (`cekHasil` → `bolehAkses`).
  const id = Number(q.id) || null;
  // "Pakai materi ini lagi": ?materi=materi-3,materi-5 (kepemilikan dicek lagi di mulaiBuatSoal).
  const materi = String(q.materi ?? "").split(",").filter((m) => /^materi-\d+$/.test(m)).slice(0, 5);
  return (
    <Kerangka p={p} lebar setAktif={id}>
      {/* Sapaan dipilih di server tiap halaman dibuka (berganti-ganti, sesuai jam WIB); tidak diacak di browser. */}
      <BuatSoal sapaan={pilihSapaan(p.nama)} awalId={id} awalMateri={materi} bawaan={await ambilPreferensi(p.id)} guruId={p.id} />
    </Kerangka>
  );
}
