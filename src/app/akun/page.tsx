import { wajibMasuk } from "@/lib/sesi";
import { Kerangka } from "../kepala";
import { FormKataSandi } from "./form";

export default async function HalamanAkun() {
  const p = await wajibMasuk();
  return (
    <Kerangka p={p}>
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
    </Kerangka>
  );
}
