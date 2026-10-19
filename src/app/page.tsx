import { wajibMasuk } from "@/lib/sesi";
import { BuatSoal } from "./buat-soal";
import { Kerangka } from "./kepala";

export default async function Home({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const p = await wajibMasuk();
  // Nomor set dari alamat (?id=) dikirim sejak awal, supaya form kosong tidak sempat tampil saat membuka set.
  // Pemeriksaan pemilik tetap di server (`cekHasil` → `bolehAkses`).
  const id = Number((await searchParams).id) || null;
  return (
    <Kerangka p={p}>
      <BuatSoal nama={p.nama} awalId={id} />
    </Kerangka>
  );
}
