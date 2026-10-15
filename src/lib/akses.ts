// Aturan akses tanpa import Next/DB, supaya bisa dites langsung: npm test

export type PenggunaAkses = { id: string; peran: "admin" | "guru" };

/** Aturan 3: guru hanya boleh membuka set miliknya; admin boleh semua. */
export function bolehAkses(guruId: string | null | undefined, p: PenggunaAkses | null): boolean {
  if (!p) return false;
  return p.peran === "admin" || (!!guruId && guruId === p.id);
}

/** Nama pengguna: huruf kecil, 3–30 karakter, hanya a-z, 0-9, titik, garis bawah. Kembalikan null kalau tidak valid. */
export function rapikanUsername(masukan: string): string | null {
  const u = String(masukan ?? "").trim().toLowerCase();
  return /^[a-z0-9._]{3,30}$/.test(u) ? u : null;
}

/** Better Auth mewajibkan email; guru tidak perlu email, jadi dibuat otomatis dari nama pengguna. */
export const emailDariUsername = (u: string) => `${u}@raciksoal.local`;
