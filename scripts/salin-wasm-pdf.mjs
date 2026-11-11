// Salin pembaca gambar pdf.js (JPEG 2000 = openjpeg, JBIG2, warna) ke public/pdfjs-wasm/ sebelum dev & build (0.32.1).
// Tanpa file ini PDF scan bergambar JPX/JBIG2 terfoto kosong (mis. buku "Al-Muyassar fi Ilmi an-Nahwi"): pdf.js butuh
// opsi `wasmUrl` (office.ts) yang menunjuk ke folder ini. Folder hasil salinan tidak di-commit (.gitignore), selalu
// mengikuti versi pdfjs-dist yang terpasang.
import { cpSync } from "node:fs";

cpSync("node_modules/pdfjs-dist/wasm", "public/pdfjs-wasm", { recursive: true });
