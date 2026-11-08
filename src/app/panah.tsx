/**
 * Ikon panah dropdown (chevron garis tipis) yang SAMA untuk semua pilihan & tombol panel (audit tampilan 2026-11-08:
 * dulu campur ⌄ bawaan browser dan huruf ▾). Bentuknya sama dengan panah kotak <select> di globals.css.
 * `buka`: panel sedang terbuka → panah menghadap ke atas. `kelas`: mis. "group-open:rotate-180" untuk <details>.
 */
export function Panah({ buka = false, kelas = "" }: { buka?: boolean; kelas?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`shrink-0 text-pudar transition-transform ${buka ? "rotate-180" : ""} ${kelas}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
