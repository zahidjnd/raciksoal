import { wajibMasuk } from "@/lib/sesi";
import { Kerangka } from "../kepala";
import { FormKataSandi } from "./form";

export default async function HalamanAkun() {
  const p = await wajibMasuk();
  return (
    <Kerangka p={p}>
      <h1 className="text-2xl">Akun</h1>
      <section className="space-y-1 text-sm">
        <p>
          <span className="text-pudar">Nama:</span> {p.nama}
        </p>
        <p>
          <span className="text-pudar">Nama pengguna:</span> {p.username}
        </p>
        <p>
          <span className="text-pudar">Peran:</span> {p.peran === "admin" ? "Admin" : "Guru"}
        </p>
      </section>
      <div className="max-w-sm">
        <FormKataSandi />
      </div>
    </Kerangka>
  );
}
