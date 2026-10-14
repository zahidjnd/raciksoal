import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hasil build mandiri (folder .next/standalone) untuk diunggah ke hosting,
  // karena `next build` tidak boleh dijalankan di hosting (RAM 1 GB).
  output: "standalone",
};

export default nextConfig;
