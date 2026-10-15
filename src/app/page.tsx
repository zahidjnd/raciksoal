import { wajibMasuk } from "@/lib/sesi";
import { BuatSoal } from "./buat-soal";
import { Kepala } from "./kepala";

export default async function Home() {
  const p = await wajibMasuk();
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4">
      <Kepala p={p} />
      <BuatSoal />
    </main>
  );
}
