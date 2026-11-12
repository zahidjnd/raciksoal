import type { MetadataRoute } from "next";

/** Manifest PWA (0.37.0): tanpa ini Chrome hanya membuat pintasan berbilah judul & alamat, bukan aplikasi layar penuh.
 *  Ikon = bintang delapan halaman masuk, putih di atas hijau (pilihan pemilik). Satu gambar untuk "any" dan "maskable":
 *  bintang berada di dalam zona aman 80%. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Racik Soal",
    short_name: "Racik Soal",
    description: "Pembuatan soal berbasis AI untuk guru MA Al-Fatah",
    lang: "id",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#faf9f5",
    theme_color: "#f4f3ee",
    icons: [
      { src: "/ikon/ikon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/ikon/ikon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/ikon/ikon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
