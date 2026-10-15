import { wajibMasuk } from "@/lib/sesi";
import { Kepala } from "../kepala";
import { FormKataSandi } from "./form";

export default async function HalamanAkun() {
  const p = await wajibMasuk();
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4">
      <Kepala p={p} />
      <section className="space-y-1 text-sm">
        <p>
          <span className="text-gray-500">Nama:</span> {p.nama}
        </p>
        <p>
          <span className="text-gray-500">Nama pengguna:</span> {p.username}
        </p>
        <p>
          <span className="text-gray-500">Peran:</span> {p.peran === "admin" ? "Admin" : "Guru"}
        </p>
      </section>
      <div className="max-w-sm">
        <FormKataSandi />
      </div>
    </main>
  );
}
