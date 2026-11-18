/**
 * Grafik data (0.52.0, ATURAN-SOAL 4.9): baris penanda "[[GRAFIK batang|garis|lingkaran: judul]]" tepat di atas tabel
 * "| a | b |" → tabel itu digambar sebagai grafik SVG di web; Word memakai grafik asli (`tabelAtauGrafik`, word.ts)
 * dengan data (`dataGrafik`) & sumbu (`skala`) yang sama. AI hanya menulis data.
 * Hitam-putih (lembar soal difotokopi): kelompok data dibedakan isi hitam/abu/putih atau garis utuh/putus/titik.
 */
export type JenisGrafik = "batang" | "garis" | "lingkaran";
export type Penanda = { jenis: JenisGrafik; judul: string };
export type DataGrafik = { sumbuX: string; label: string[]; seri: { nama: string; nilai: number[] }[] };

const POLA_PENANDA = /^\[\[\s*GRAFIK\s+(batang|garis|lingkaran)\s*(?::\s*(.*?))?\s*\]\]$/i;

/** Satu baris teks → penanda grafik, atau null. */
export function bacaPenanda(baris: string): Penanda | null {
  const m = POLA_PENANDA.exec(String(baris ?? "").trim());
  return m ? { jenis: m[1].toLowerCase() as JenisGrafik, judul: m[2] ?? "" } : null;
}

/** Penanda → teks baris (untuk jendela Ubah tabel). */
export const tulisPenanda = (p: Penanda) => `[[GRAFIK ${p.jenis}${p.judul ? `: ${p.judul}` : ""}]]`;

/** Angka gaya Indonesia: "30.000" → 30000, "2,5" → 2.5, "45%" → 45, "Rp 1.500" → 1500. Bukan angka → NaN. */
export function bacaAngka(s: string): number {
  let t = String(s ?? "").replace(/−/g, "-").replace(/[^\d.,-]/g, "").replace(/^[.,]+|[.,]+$/g, "");
  if (!/\d/.test(t)) return NaN;
  if (t.includes(",")) t = t.replace(/\./g, "").replace(",", ".");
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, "");
  return Number(t);
}

const bersih = (s: string) => String(s ?? "").replace(/[\t$]/g, "").trim();

/**
 * Aturan tiap jenis: banyak kolom angka & baris data, angka minus, dan CONTOH (isi abu-abu jendela grafik, 0.52.0:
 * grafik langsung tergambar sebelum guru mengisi; contoh tidak pernah tersimpan).
 */
export const ATURAN_GRAFIK: Record<JenisGrafik, { nama: string; kolom: [number, number]; baris: [number, number]; tanpaMinus?: boolean; contoh: string[][] }> = {
  batang: { nama: "Grafik batang", kolom: [1, 3], baris: [2, 12], contoh: [["Kelas", "Jumlah siswa"], ["X", "30"], ["XI", "45"], ["XII", "25"]] },
  garis: { nama: "Grafik garis", kolom: [1, 3], baris: [2, 12], contoh: [["Bulan", "Suhu (°C)"], ["Jan", "28"], ["Feb", "30"], ["Mar", "27"], ["Apr", "32"]] },
  lingkaran: { nama: "Grafik lingkaran", kolom: [1, 1], baris: [2, 8], tanpaMinus: true, contoh: [["Pekerjaan", "Jumlah"], ["Petani", "45"], ["Pedagang", "30"], ["Lainnya", "25"]] },
};

/** Isi contoh satu sel (baris 0 = judul kolom). Di luar ukuran contoh: "Data n" / angka contoh. */
export function contohSel(jenis: JenisGrafik, i: number, j: number): string {
  const c = ATURAN_GRAFIK[jenis].contoh;
  return c[i]?.[j] ?? (i === 0 ? `Kelompok ${j}` : j === 0 ? `Data ${i}` : String(10 + ((i * 7 + j * 5) % 25)));
}

/** Kenapa tabel ini tidak bisa digambar (kalimat untuk guru, menyebut letak sel), atau null bila bisa. */
export function alasanGrafik(isi: string[][], jenis: JenisGrafik): string | null {
  const a = ATURAN_GRAFIK[jenis];
  const [judul, ...badan] = isi;
  const kolom = (judul?.length ?? 0) - 1;
  if (kolom < a.kolom[0] || kolom > a.kolom[1])
    return a.kolom[0] === a.kolom[1] ? `${a.nama} memakai tepat ${a.kolom[0]} kolom angka (sekarang ${Math.max(kolom, 0)}).` : `Isi ${a.kolom[0]}–${a.kolom[1]} kolom angka (sekarang ${Math.max(kolom, 0)}).`;
  if (badan.length < a.baris[0] || badan.length > a.baris[1]) return `Isi ${a.baris[0]}–${a.baris[1]} baris data (sekarang ${badan.length}).`;
  for (const [i, b] of badan.entries())
    for (let j = 1; j <= kolom; j++) {
      const n = bacaAngka(b[j]);
      if (!Number.isFinite(n)) return `Baris ${i + 1} kolom ${j + 1} harus angka.`;
      if (a.tanpaMinus && n < 0) return `Baris ${i + 1} kolom ${j + 1}: ${a.nama.toLowerCase()} tidak memakai angka minus.`;
    }
  if (jenis === "lingkaran" && !badan.some((b) => bacaAngka(b[1]) > 0)) return "Minimal satu angka lebih dari 0.";
  return null;
}

/** Tabel (baris pertama = judul kolom) → data grafik; null bila tidak bisa digambar (tetap tampil sebagai tabel). */
export function dataGrafik(isi: string[][], jenis: JenisGrafik): DataGrafik | null {
  if (alasanGrafik(isi, jenis)) return null;
  const [judul, ...badan] = isi;
  const seri = judul.slice(1).map((nama, k) => ({ nama: bersih(nama), nilai: badan.map((b) => bacaAngka(b[k + 1])) }));
  return { sumbuX: bersih(judul[0]), label: badan.map((b) => bersih(b[0])), seri };
}

const LEBAR = 480;
const ISI_BATANG = ["#404040", "#bfbfbf", "#ffffff"];
const PUTUS = ["", "6 4", "2 3"];
const ISI_IRIS = ["#404040", "#bfbfbf", "#ffffff", "#808080", "#e6e6e6", "#1a1a1a", "#a6a6a6", "#f2f2f2"];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const r = (n: number) => Math.round(n * 10) / 10;
const angka = (n: number) => n.toLocaleString("id-ID", { maximumFractionDigits: 2 });
const tulis = (x: number, y: number, isi: string, opsi = "") => `<text x="${r(x)}" y="${r(y)}" ${opsi}>${esc(isi)}</text>`;

/** Rentang sumbu Y "rapi" (langkah 1/2/2,5/5 × 10ⁿ, ±8 garis: mudah dibaca siswa). Batang selalu memuat 0. */
export function skala(min: number, max: number, nol: boolean) {
  let lo = nol ? Math.min(0, min) : min;
  let hi = nol ? Math.max(0, max) : max;
  if (hi === lo) {
    const d = Math.abs(hi) * 0.1 || 1;
    if (!nol || lo < 0) lo -= d;
    hi += d;
  }
  const kasar = (hi - lo) / 8;
  const p = 10 ** Math.floor(Math.log10(kasar));
  const f = kasar / p;
  const langkah = (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  return { a: Math.floor(lo / langkah + 1e-9) * langkah, b: Math.ceil(hi / langkah - 1e-9) * langkah, langkah };
}

/** Penanda kelompok data (titik garis): bulat hitam, kotak putih, bulat putih. */
function titik(k: number, x: number, y: number) {
  if (k === 1) return `<rect x="${r(x - 3.5)}" y="${r(y - 3.5)}" width="7" height="7" fill="#fff" stroke="#000"/>`;
  return `<circle cx="${r(x)}" cy="${r(y)}" r="3.5" fill="${k === 0 ? "#000" : "#fff"}" stroke="#000"/>`;
}

/** Keterangan kelompok data (≥ 2 kelompok), di tengah atas. */
function keterangan(d: DataGrafik, jenis: JenisGrafik, y: number) {
  const lebar = d.seri.map((s) => 30 + s.nama.length * 6.5);
  let x = (LEBAR - lebar.reduce((a, b) => a + b, 0)) / 2;
  return d.seri
    .map((s, k) => {
      const tanda =
        jenis === "batang"
          ? `<rect x="${r(x)}" y="${y - 9}" width="12" height="12" fill="${ISI_BATANG[k]}" stroke="#000" stroke-width="0.8"/>`
          : `<line x1="${r(x - 2)}" y1="${y - 3}" x2="${r(x + 16)}" y2="${y - 3}" stroke="#000" stroke-width="1.6" stroke-dasharray="${PUTUS[k]}"/>${titik(k, x + 7, y - 3)}`;
      const hasil = tanda + tulis(x + 20, y + 1, s.nama, 'font-size="11"');
      x += lebar[k];
      return hasil;
    })
    .join("");
}

/** Grafik batang/garis bersumbu. */
function bersumbu(d: DataGrafik, jenis: "batang" | "garis", atas: number) {
  const kiri = 60, kanan = 16, tinggiPlot = 190;
  const satu = d.seri.length === 1;
  const yAtas = atas + (satu ? 20 : 8);
  const yBawah = yAtas + tinggiPlot;
  const semua = d.seri.flatMap((s) => s.nilai);
  const { a, b, langkah } = skala(Math.min(...semua), Math.max(...semua), jenis === "batang");
  const y = (v: number) => yBawah - ((v - a) / (b - a)) * tinggiPlot;
  const n = d.label.length;
  const slot = (LEBAR - kiri - kanan) / n;
  const tengah = (i: number) => kiri + slot * (i + 0.5);
  const isi: string[] = [];

  for (let i = 0; i <= Math.round((b - a) / langkah); i++) {
    const v = a + i * langkah;
    isi.push(`<line x1="${kiri}" y1="${r(y(v))}" x2="${LEBAR - kanan}" y2="${r(y(v))}" stroke="#d9d9d9" stroke-width="0.8"/>`);
    isi.push(tulis(kiri - 6, y(v) + 4, angka(Math.round(v * 1e6) / 1e6), 'font-size="11" text-anchor="end"'));
  }
  if (satu) isi.push(tulis(8, yAtas - 10, d.seri[0].nama, 'font-size="11"'));

  const nilaiTampil = n * d.seri.length <= 24; // ponytail: lebih dari itu angka di atas batang/titik bertumpuk
  if (jenis === "batang") {
    const w = (slot * 0.7) / d.seri.length;
    const nol = y(Math.max(a, 0));
    d.seri.forEach((s, k) =>
      s.nilai.forEach((v, i) => {
        const x = kiri + slot * i + slot * 0.15 + k * w;
        const yv = y(v);
        isi.push(`<rect x="${r(x)}" y="${r(Math.min(nol, yv))}" width="${r(w)}" height="${r(Math.abs(nol - yv))}" fill="${ISI_BATANG[k]}" stroke="#000" stroke-width="0.8"/>`);
        if (nilaiTampil) isi.push(tulis(x + w / 2, v < 0 ? yv + 12 : yv - 4, angka(v), 'font-size="10" text-anchor="middle"'));
      }),
    );
  } else {
    d.seri.forEach((s, k) => {
      const p = s.nilai.map((v, i) => `${r(tengah(i))},${r(y(v))}`).join(" ");
      isi.push(`<polyline points="${p}" fill="none" stroke="#000" stroke-width="1.6" stroke-dasharray="${PUTUS[k]}"/>`);
      s.nilai.forEach((v, i) => {
        isi.push(titik(k, tengah(i), y(v)));
        if (nilaiTampil && satu) isi.push(tulis(tengah(i), y(v) - 8, angka(v), 'font-size="10" text-anchor="middle"'));
      });
    });
  }

  isi.push(`<line x1="${kiri}" y1="${yAtas - 4}" x2="${kiri}" y2="${yBawah}" stroke="#000"/>`);
  isi.push(`<line x1="${kiri}" y1="${r(y(Math.max(a, 0)))}" x2="${LEBAR - kanan}" y2="${r(y(Math.max(a, 0)))}" stroke="#000"/>`);
  const ukuran = n > 8 ? 10 : 11;
  d.label.forEach((t, i) => isi.push(tulis(tengah(i), yBawah + 16, t, `font-size="${ukuran}" text-anchor="middle"`)));
  if (d.sumbuX) isi.push(tulis(kiri + (LEBAR - kiri - kanan) / 2, yBawah + 36, d.sumbuX, 'font-size="11" text-anchor="middle"'));
  return { isi: isi.join(""), tinggi: yBawah + (d.sumbuX ? 46 : 28) };
}

/** Grafik lingkaran: iris berisi hitam/abu/putih, nama + persen di luar lingkaran. */
function lingkaran(d: DataGrafik, atas: number) {
  const nilai = d.seri[0].nilai;
  const total = nilai.reduce((a, b) => a + b, 0);
  const jari = 90, cx = LEBAR / 2, cy = atas + 24 + jari;
  const isi: string[] = [];
  let sudut = -Math.PI / 2;
  nilai.forEach((v, i) => {
    if (v <= 0) return;
    const bagian = v / total;
    const akhir = sudut + bagian * 2 * Math.PI;
    const warna = `fill="${ISI_IRIS[i]}" stroke="#000" stroke-width="0.8"`;
    if (bagian >= 0.9999) isi.push(`<circle cx="${cx}" cy="${cy}" r="${jari}" ${warna}/>`);
    else {
      const [x1, y1, x2, y2] = [cx + jari * Math.cos(sudut), cy + jari * Math.sin(sudut), cx + jari * Math.cos(akhir), cy + jari * Math.sin(akhir)];
      isi.push(`<path d="M${cx},${cy} L${r(x1)},${r(y1)} A${jari},${jari} 0 ${bagian > 0.5 ? 1 : 0} 1 ${r(x2)},${r(y2)} Z" ${warna}/>`);
    }
    const t = (sudut + akhir) / 2;
    const cos = Math.cos(t), sin = Math.sin(t);
    isi.push(`<line x1="${r(cx + jari * 0.92 * cos)}" y1="${r(cy + jari * 0.92 * sin)}" x2="${r(cx + (jari + 8) * cos)}" y2="${r(cy + (jari + 8) * sin)}" stroke="#000" stroke-width="0.8"/>`);
    const label = `${d.label[i]} (${angka(Math.round(bagian * 1000) / 10)}%)`;
    isi.push(tulis(cx + (jari + 11) * cos, cy + (jari + 11) * sin + 4, label, `font-size="11" text-anchor="${cos >= 0 ? "start" : "end"}"`));
    sudut = akhir;
  });
  return { isi: isi.join(""), tinggi: cy + jari + 28 };
}

/** Tabel + penanda → SVG utuh (latar putih, lebar 480), atau null bila datanya tidak bisa digambar. */
export function svgGrafik(isi: string[][], { jenis, judul }: Penanda): string | null {
  const d = dataGrafik(isi, jenis);
  if (!d) return null;
  const banyak = jenis !== "lingkaran" && d.seri.length > 1;
  const atas = (judul ? 30 : 10) + (banyak ? 24 : 0);
  const badan = jenis === "lingkaran" ? lingkaran(d, atas) : bersumbu(d, jenis, atas);
  const kepala = (judul ? tulis(LEBAR / 2, 20, judul, 'font-size="13" font-weight="bold" text-anchor="middle"') : "") + (banyak ? keterangan(d, jenis, atas - 8) : "");
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${LEBAR}" height="${badan.tinggi}" viewBox="0 0 ${LEBAR} ${badan.tinggi}" font-family="Arial, Helvetica, sans-serif" font-size="12" fill="#000">` +
    `<rect width="${LEBAR}" height="${badan.tinggi}" fill="#fff"/>${kepala}${badan.isi}</svg>`
  );
}
