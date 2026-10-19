import { wajibMasuk } from "@/lib/sesi";
import { BuatSoal } from "./buat-soal";
import { Kerangka } from "./kepala";

export default async function Home() {
  const p = await wajibMasuk();
  return (
    <Kerangka p={p}>
      <BuatSoal nama={p.nama} />
    </Kerangka>
  );
}
