"use client";

import { useEffect } from "react";

/** Tautan ke topik (/panduan#merah) membuka lipatan <details> tujuannya; browser hanya menggulir, tidak membuka. */
export function BukaLipatan() {
  useEffect(() => {
    const buka = () => {
      const d = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (d instanceof HTMLDetailsElement) d.open = true;
    };
    buka();
    window.addEventListener("hashchange", buka);
    return () => window.removeEventListener("hashchange", buka);
  }, []);
  return null;
}
