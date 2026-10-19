import Link from "next/link";

/** Alamat yang tidak ada, atau materi milik guru lain (dijawab "tidak ditemukan", aturan 3). */
export default function TidakDitemukan() {
  return (
    <main className="mx-auto max-w-sm space-y-4 p-4 pt-16 text-center">
      <h1 className="text-xl">Halaman tidak ditemukan</h1>
      <p className="text-gray-600">Alamatnya mungkin salah ketik, atau isinya sudah dihapus.</p>
      <Link href="/" className="inline-flex items-center rounded-lg bg-hijau px-4 py-2 font-semibold text-white hover:bg-hijau-tua max-md:min-h-11">
        Ke halaman awal
      </Link>
    </main>
  );
}
