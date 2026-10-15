// Terjemahan pesan error Better Auth ke bahasa sederhana.
const PESAN: Record<string, string> = {
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Nama pengguna ini sudah dipakai.",
  USER_ALREADY_EXISTS: "Nama pengguna ini sudah dipakai.",
  USERNAME_IS_ALREADY_TAKEN: "Nama pengguna ini sudah dipakai.",
  INVALID_PASSWORD: "Kata sandi lama salah.",
  PASSWORD_TOO_SHORT: "Kata sandi minimal 8 karakter.",
  PASSWORD_TOO_LONG: "Kata sandi terlalu panjang.",
  YOU_CANNOT_BAN_YOURSELF: "Anda tidak bisa menonaktifkan akun sendiri.",
  USER_NOT_FOUND: "Akun tidak ditemukan.",
};

export function pesanAuth(e: unknown) {
  const err = e as { body?: { code?: string; message?: string }; message?: string };
  return PESAN[err.body?.code ?? ""] ?? err.body?.message ?? err.message ?? "Terjadi kesalahan.";
}
