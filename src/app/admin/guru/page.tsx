import { asc, count, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { hasilSoal, pengguna } from "@/db/schema";
import { wajibMasuk } from "@/lib/sesi";
import { Kepala } from "../../kepala";
import { AksiGuru, FormTambahGuru } from "./form";

export default async function KelolaGuru() {
  const p = await wajibMasuk();
  if (p.peran !== "admin") redirect("/");

  const daftar = await db
    .select({
      id: pengguna.id,
      nama: pengguna.name,
      username: pengguna.username,
      peran: pengguna.role,
      nonaktif: pengguna.banned,
      dibuat: pengguna.createdAt,
      jumlahSet: count(hasilSoal.id),
    })
    .from(pengguna)
    .leftJoin(hasilSoal, eq(hasilSoal.guruId, pengguna.id))
    .groupBy(pengguna.id)
    .orderBy(asc(pengguna.createdAt));

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4">
      <Kepala p={p} />
      <FormTambahGuru />
      <section className="space-y-3">
        <h2 className="font-semibold">Daftar akun ({daftar.length})</h2>
        {daftar.map((g) => (
          <article key={g.id} className={`space-y-2 rounded-lg border p-3 ${g.nonaktif ? "bg-gray-100 opacity-75" : ""}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p>
                <span className="font-semibold">{g.nama}</span> <span className="text-sm text-gray-500">@{g.username}</span>{" "}
                {g.peran === "admin" && <span className="rounded bg-amber-100 px-1 text-xs">admin</span>}{" "}
                {g.nonaktif && <span className="rounded bg-red-100 px-1 text-xs text-red-700">nonaktif</span>}
              </p>
              <p className="text-xs text-gray-500">
                {g.jumlahSet} set soal · dibuat {g.dibuat.toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })}
              </p>
            </div>
            <AksiGuru userId={g.id} nonaktif={!!g.nonaktif} dirinya={g.id === p.id} />
          </article>
        ))}
      </section>
    </main>
  );
}
