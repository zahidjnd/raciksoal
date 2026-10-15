// Siapa yang sedang masuk. Dipakai di halaman, server action, dan rute unduh.
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth, type Pengguna } from "./auth";

export async function penggunaSaatIni(): Promise<Pengguna | null> {
  const s = await auth.api.getSession({ headers: await headers() });
  if (!s) return null;
  const u = s.user as typeof s.user & { username?: string | null; role?: string | null; banned?: boolean | null };
  if (u.banned) return null;
  return { id: u.id, nama: u.name, username: u.username ?? "", peran: u.role === "admin" ? "admin" : "guru" };
}

/** Untuk halaman: belum masuk → ke /masuk. (Jangan dipakai di dalam try/catch server action.) */
export async function wajibMasuk(): Promise<Pengguna> {
  const p = await penggunaSaatIni();
  if (!p) redirect("/masuk");
  return p;
}
