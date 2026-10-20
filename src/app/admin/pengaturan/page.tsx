import { redirect } from "next/navigation";
import { ambilNamaMadrasah } from "@/lib/sekolah";
import { wajibMasuk } from "@/lib/sesi";
import { Kerangka } from "../../kepala";
import { FormNamaMadrasah } from "./form";

/** Pengaturan web yang diatur admin sekali (keputusan pemilik 2026-10-20: nama madrasah tidak dipilih guru tiap kali). */
export default async function Pengaturan() {
  const p = await wajibMasuk();
  if (p.peran !== "admin") redirect("/");
  return (
    <Kerangka p={p}>
      <h1 className="text-2xl">Pengaturan</h1>
      <FormNamaMadrasah awal={await ambilNamaMadrasah()} />
    </Kerangka>
  );
}
