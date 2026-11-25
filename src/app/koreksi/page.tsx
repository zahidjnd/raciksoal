import { wajibMasuk } from "@/lib/sesi";
import { Kerangka } from "../kepala";
import { CobaBaca } from "./coba-baca";

/** Koreksi LJK tahap 1: uji mesin pembaca dengan foto. Belum menyimpan apa pun (semua dihitung di browser).
 *  Kartu di halaman awal masih "Segera hadir" (aplikasi.ts) sampai alur lengkap jadi. */
export default async function Koreksi() {
  const p = await wajibMasuk();
  return (
    <Kerangka p={p}>
      <h1 className="text-2xl">Koreksi LJK</h1>
      <p className="text-sm text-pudar">
        Tahap uji: pilih foto LJK ASAS (boleh beberapa). Foto dibaca di perangkat ini saja, tidak diunggah dan tidak disimpan.
      </p>
      <CobaBaca />
    </Kerangka>
  );
}
