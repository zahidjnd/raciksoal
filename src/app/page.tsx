import { wajibMasuk } from "@/lib/sesi";
import { BuatSoal } from "./buat-soal";
import { keluar } from "./masuk/actions";

export default async function Home() {
  const p = await wajibMasuk();
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Racik Soal</h1>
        <div className="flex items-center gap-3 text-sm">
          <span>
            {p.nama} {p.peran === "admin" && <span className="rounded bg-amber-100 px-1 text-xs">admin</span>}
          </span>
          <form action={keluar}>
            <button className="rounded border px-3 py-1">Keluar</button>
          </form>
        </div>
      </header>
      <BuatSoal />
    </main>
  );
}
