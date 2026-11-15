import type { NextConfig } from "next";

// Header keamanan (audit 2026-11-04 C13). CSP sengaja hanya bagian yang tidak menyentuh skrip/gaya: script-src
// yang ketat butuh nonce lewat middleware, dan middleware tidak dipakai (proxy hosting mengubah Host).
const headerKeamanan = [
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
  { key: "X-Frame-Options", value: "DENY" }, // browser lama yang belum paham frame-ancestors
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

const nextConfig: NextConfig = {
  // Hasil build mandiri (folder .next/standalone) untuk diunggah ke hosting,
  // karena `next build` tidak boleh dijalankan di hosting (RAM 1 GB).
  output: "standalone",
  poweredByHeader: false,
  // 0.33.0: analisa materi mengirim teks (kini maks 150 ribu huruf, Arab ±2 byte per huruf) + 20 pratinjau gambar (±670 KB): bawaan 1 MB terlalu mepet.
  experimental: { serverActions: { bodySizeLimit: "2mb" } },
  async headers() {
    return [{ source: "/:path*", headers: headerKeamanan }];
  },
};

export default nextConfig;
