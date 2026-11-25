// Mesin pembaca LJK ASAS madrasah (Koreksi LJK tahap 1). Murni hitungan, tanpa AI dan tanpa library:
// cari 4 kotak hitam → luruskan foto (homografi) → ukur kehitaman tiap bulatan.
// Letak semua benda = titik (pt) di "LJK ASAS 26-1 FIX" (A4, cetak 100%), diukur dari PDF-nya.
// Dipakai di browser (foto HP/unggahan) dan di test Node; masukan = gambar abu-abu.

export type Gambar = { w: number; h: number; d: Uint8Array | Uint8ClampedArray }; // 0 = hitam, 255 = putih
type Titik = [number, number];
export type Homografi = number[]; // 8 angka, peta titik LJK (pt) → piksel foto

export const LJK = {
  // pusat kotak penanda: kiri-atas, kanan-atas, kanan-bawah, kiri-bawah
  kotak: [[43.3, 34.75], [548.8, 34.75], [548.8, 429.85], [43.3, 429.85]] as Titik[],
  sisi: 13.3,
  kolomX: [
    [71, 90.4, 109.1, 127.2, 145.9],
    [204.5, 223.8, 242.5, 260.7, 279.3],
    [339.2, 358.6, 377.3, 395.4, 414.1],
    [472.7, 492, 510.7, 528.9, 547.5],
  ],
  barisY: [222, 242.3, 262.6, 282.9, 303.2, 323.4, 343.7, 364, 384.3, 404.6],
  rx: 7.55, // setengah lebar bulatan
  ry: 6.5,
  garis: [102.1, 182.6], // garis dobel kop & bawah identitas (penentu arah foto)
  nama: { x0: 300, y0: 126, x1: 560, y1: 184 }, // Nama, Kelas, No ASAS (tulisan tangan)
  soal: 40,
  pilihan: 5,
};

export const HURUF = ["A", "B", "C", "D", "E"];

/** Ambang kehitaman relatif (0 = bulatan kosong, 1 = bulatan terisi biasa di lembar itu). Di antaranya = ragu (kuning). */
export const AMBANG = { coret: 0.15, ragu: 0.25, isi: 0.45 };

export type Jawab = { pilih: number[]; ragu: boolean; hitam: number[] };
export type HasilLjk = { ok: true; jawab: Jawab[]; H: Homografi; kotak: Titik[]; geser: Titik[] } | { ok: false; pesan: string };

export function keAbu(rgba: Uint8ClampedArray, w: number, h: number): Gambar {
  const d = new Uint8Array(w * h);
  for (let i = 0, j = 0; i < d.length; i++, j += 4) d[i] = (rgba[j] * 77 + rgba[j + 1] * 150 + rgba[j + 2] * 29) >> 8;
  return { w, h, d };
}

// ---------- homografi ----------
function selesaikan(A: number[][], b: number[]): number[] | null {
  const n = b.length;
  const M = A.map((r, i) => [...r, b[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-12) return null;
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((r, i) => r[n] / r[i]);
}

export function homografi(dari: Titik[], ke: Titik[]): Homografi | null {
  const A: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = dari[i];
    const [u, v] = ke[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y]);
    b.push(u);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y]);
    b.push(v);
  }
  return selesaikan(A, b);
}

export function peta(H: Homografi, x: number, y: number): Titik {
  const z = H[6] * x + H[7] * y + 1;
  return [(H[0] * x + H[1] * y + H[2]) / z, (H[3] * x + H[4] * y + H[5]) / z];
}

function ambil(g: Gambar, x: number, y: number): number {
  const xi = Math.min(g.w - 1, Math.max(0, Math.round(x)));
  const yi = Math.min(g.h - 1, Math.max(0, Math.round(y)));
  return g.d[yi * g.w + xi];
}

// ---------- kotak penanda ----------
type Calon = { x: number; y: number; sisi: number; penuh: number };

function kecilkan(g: Gambar, f: number): Gambar {
  if (f <= 1) return g;
  const w = Math.floor(g.w / f), h = Math.floor(g.h / f);
  const d = new Uint8Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let j = 0; j < f; j++) for (let i = 0; i < f; i++) s += g.d[(y * f + j) * g.w + x * f + i];
      d[y * w + x] = s / (f * f);
    }
  return { w, h, d };
}

function cariCalon(g: Gambar): Calon[] {
  const { w, h, d } = g;
  // ambang setempat: piksel gelap bila jauh lebih gelap daripada rata-rata sekitarnya (tahan bayangan)
  const I = new Float64Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let s = 0;
    for (let x = 0; x < w; x++) {
      s += d[y * w + x];
      I[(y + 1) * (w + 1) + x + 1] = I[y * (w + 1) + x + 1] + s;
    }
  }
  const r = Math.max(8, Math.round(Math.max(w, h) / 40));
  const gelap = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const y0 = Math.max(0, y - r), y1 = Math.min(h, y + r + 1);
    for (let x = 0; x < w; x++) {
      const x0 = Math.max(0, x - r), x1 = Math.min(w, x + r + 1);
      const rata = (I[y1 * (w + 1) + x1] - I[y0 * (w + 1) + x1] - I[y1 * (w + 1) + x0] + I[y0 * (w + 1) + x0]) / ((x1 - x0) * (y1 - y0));
      const v = d[y * w + x];
      if (v < rata * 0.65 && v < 150) gelap[y * w + x] = 1;
    }
  }
  const label = new Int32Array(w * h);
  const tumpuk: number[] = [];
  const calon: Calon[] = [];
  const maks = Math.max(w, h) / 12;
  let n = 0;
  for (let s = 0; s < w * h; s++) {
    if (!gelap[s] || label[s]) continue;
    n++;
    label[s] = n;
    tumpuk.push(s);
    let luas = 0, sx = 0, sy = 0, xa = w, xb = 0, ya = h, yb = 0;
    while (tumpuk.length) {
      const p = tumpuk.pop()!;
      const x = p % w, y = (p - x) / w;
      luas++;
      sx += x;
      sy += y;
      if (x < xa) xa = x;
      if (x > xb) xb = x;
      if (y < ya) ya = y;
      if (y > yb) yb = y;
      if (x > 0 && gelap[p - 1] && !label[p - 1]) { label[p - 1] = n; tumpuk.push(p - 1); }
      if (x < w - 1 && gelap[p + 1] && !label[p + 1]) { label[p + 1] = n; tumpuk.push(p + 1); }
      if (y > 0 && gelap[p - w] && !label[p - w]) { label[p - w] = n; tumpuk.push(p - w); }
      if (y < h - 1 && gelap[p + w] && !label[p + w]) { label[p + w] = n; tumpuk.push(p + w); }
    }
    const bw = xb - xa + 1, bh = yb - ya + 1;
    const sisi = Math.sqrt(luas);
    if (sisi < 4 || sisi > maks || bw / bh > 2 || bh / bw > 2) continue;
    const penuh = luas / (bw * bh);
    if (penuh < 0.6) continue;
    // sekelilingnya harus kertas terang (bukan pola lantai/baju)
    const m = Math.ceil(sisi * 0.6);
    let cincin = 0, gelapCincin = 0;
    for (let y = ya - m; y <= yb + m; y++)
      for (let x = xa - m; x <= xb + m; x++) {
        if (x >= xa && x <= xb && y >= ya && y <= yb) continue;
        cincin++;
        if (x < 0 || y < 0 || x >= w || y >= h || gelap[y * w + x]) gelapCincin++;
      }
    if (gelapCincin / cincin > 0.15) continue;
    calon.push({ x: sx / luas + 0.5, y: sy / luas + 0.5, sisi, penuh });
  }
  return calon.sort((a, b) => b.penuh - a.penuh).slice(0, 30);
}

const jarak = (a: Calon | Titik, b: Calon | Titik) => {
  const [ax, ay] = Array.isArray(a) ? a : [a.x, a.y];
  const [bx, by] = Array.isArray(b) ? b : [b.x, b.y];
  return Math.hypot(ax - bx, ay - by);
};

/** Seberapa jelas garis dobel kop terlihat di tempat seharusnya (0–1). Foto terbalik = rendah. */
function skorGaris(g: Gambar, H: Homografi): number {
  let ada = 0, semua = 0;
  for (const gy of LJK.garis) {
    const putih: number[] = [];
    for (let x = 50; x <= 545; x += 15) putih.push(ambil(g, ...peta(H, x, gy + 7)));
    putih.sort((a, b) => a - b);
    const p = putih[Math.floor(putih.length / 2)];
    for (let x = 45; x <= 550; x += 8) {
      let min = 255;
      for (let dy = -3; dy <= 3; dy += 0.75) min = Math.min(min, ambil(g, ...peta(H, x, gy + dy)));
      semua++;
      if (min < p * 0.7) ada++;
    }
  }
  return ada / semua;
}

function cariKotak(g: Gambar): { H: Homografi; kotak: Titik[] } | null {
  const f = Math.max(1, Math.round(Math.max(g.w, g.h) / 1000));
  const kecil = kecilkan(g, f);
  const c = cariCalon(kecil);
  const [lebarT, tinggiT] = [LJK.kotak[1][0] - LJK.kotak[0][0], LJK.kotak[3][1] - LJK.kotak[0][1]];
  let terbaik: { H: Homografi; kotak: Titik[]; skor: number } | null = null;
  for (let a = 0; a < c.length; a++)
    for (let b = a + 1; b < c.length; b++)
      for (let e = b + 1; e < c.length; e++)
        for (let k = e + 1; k < c.length; k++) {
          const empat = [c[a], c[b], c[e], c[k]];
          const sisi = empat.map((t) => t.sisi);
          if (Math.max(...sisi) / Math.min(...sisi) > 1.8) continue;
          const cx = empat.reduce((s, t) => s + t.x, 0) / 4, cy = empat.reduce((s, t) => s + t.y, 0) / 4;
          empat.sort((p, q) => Math.atan2(p.y - cy, p.x - cx) - Math.atan2(q.y - cy, q.x - cx)); // searah jarum jam (y ke bawah)
          const rataSisi = sisi.reduce((s, v) => s + v, 0) / 4;
          for (let r = 0; r < 4; r++) {
            const [tl, tr, br, bl] = [0, 1, 2, 3].map((i) => empat[(i + r) % 4]);
            const atas = jarak(tl, tr), bawah = jarak(bl, br), kiri = jarak(tl, bl), kanan = jarak(tr, br);
            const banding = (atas + bawah) / (kiri + kanan) / (lebarT / tinggiT);
            if (banding < 0.65 || banding > 1.5) continue;
            if (atas / bawah < 0.6 || atas / bawah > 1.67 || kiri / kanan < 0.6 || kiri / kanan > 1.67) continue;
            const besar = rataSisi / (((atas + bawah) / 2) * (LJK.sisi / lebarT));
            if (besar < 0.55 || besar > 1.8) continue;
            const ke: Titik[] = [tl, tr, br, bl].map((t) => [t.x * f, t.y * f]);
            const H = homografi(LJK.kotak, ke);
            if (!H) continue;
            const skor = skorGaris(g, H);
            if (skor < 0.6) continue;
            if (!terbaik || skor > terbaik.skor) terbaik = { H, kotak: ke, skor };
          }
        }
  return terbaik && { H: terbaik.H, kotak: terbaik.kotak };
}

// ---------- bulatan ----------
function rataBulatan(g: Gambar, H: Homografi, cx: number, cy: number, skala: number): number {
  let s = 0, n = 0;
  for (let j = -3; j <= 3; j++)
    for (let i = -3; i <= 3; i++) {
      const u = i / 3, v = j / 3;
      if (u * u + v * v > 1) continue;
      s += ambil(g, ...peta(H, cx + u * LJK.rx * skala, cy + v * LJK.ry * skala));
      n++;
    }
  return s / n;
}

function putihSekitar(g: Gambar, H: Homografi, cx: number, cy: number): number {
  const v: number[] = [];
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * 2 * Math.PI;
    v.push(ambil(g, ...peta(H, cx + Math.cos(a) * LJK.rx * 1.3, cy + Math.sin(a) * LJK.ry * 1.45)));
  }
  v.sort((a, b) => a - b);
  return v[Math.floor(v.length * 0.75)];
}

/** Kecocokan garis tepi bulatan tercetak di (cx, cy): tepi gelap, celah antarbulatan terang. */
function cocokTepi(g: Gambar, H: Homografi, xs: number[], cy: number): number {
  let tepi = 0, celah = 0, nt = 0, nc = 0;
  for (const cx of xs) {
    for (let k = 0; k < 16; k++) {
      const a = (k / 16) * 2 * Math.PI;
      tepi += ambil(g, ...peta(H, cx + Math.cos(a) * LJK.rx, cy + Math.sin(a) * LJK.ry));
      nt++;
    }
    for (const [dx, dy] of [[9.6, 0], [-9.6, 0], [0, 10.1], [0, -10.1], [9.6, 10.1], [-9.6, -10.1]]) {
      celah += ambil(g, ...peta(H, cx + dx, cy + dy));
      nc++;
    }
  }
  return celah / nc - tepi / nt;
}

/** Kertas yang dipegang tangan melengkung: 4 kotak saja tidak cukup. Cari geseran terbaik per kolom,
 *  lalu per nomor (lebih sempit). Kembalikan geseran (pt) tiap nomor. */
function geseran(g: Gambar, H: Homografi): Titik[] {
  const hasil: Titik[] = [];
  for (let kol = 0; kol < 4; kol++) {
    const xs = LJK.kolomX[kol];
    let terbaik: Titik = [0, 0], skor = -Infinity;
    for (let dx = -8; dx <= 8; dx += 1)
      for (let dy = -8; dy <= 8; dy += 1) {
        let s = 0;
        for (const y of LJK.barisY) s += cocokTepi(g, H, xs.map((x) => x + dx), y + dy);
        if (s > skor) { skor = s; terbaik = [dx, dy]; }
      }
    for (const y of LJK.barisY) {
      let lokal: Titik = terbaik, sl = -Infinity;
      for (let dx = -3; dx <= 3; dx += 0.5)
        for (let dy = -3; dy <= 3; dy += 0.5) {
          const s = cocokTepi(g, H, xs.map((x) => x + terbaik[0] + dx), y + terbaik[1] + dy);
          if (s > sl) { sl = s; lokal = [terbaik[0] + dx, terbaik[1] + dy]; }
        }
      hasil.push(lokal);
    }
  }
  return hasil;
}

export function bacaLjk(g: Gambar): HasilLjk {
  const k = cariKotak(g);
  if (!k) return { ok: false, pesan: "Empat kotak hitam di pojok LJK belum terlihat jelas. Foto ulang dari atas, seluruh bagian atas LJK masuk." };
  const { H } = k;
  const hitam = LJK.kotak.map(([x, y]) => rataBulatan(g, H, x, y, 0.5)).reduce((s, v) => s + v, 0) / 4;
  const geser = geseran(g, H);
  const mentah = Array.from({ length: LJK.soal }, (_, n) => {
    const kol = Math.floor(n / 10), bar = n % 10;
    const cy = LJK.barisY[bar] + geser[n][1];
    return LJK.kolomX[kol].map((x) => {
      const cx = x + geser[n][0];
      const p = putihSekitar(g, H, cx, cy);
      const m = rataBulatan(g, H, cx, cy, 0.7);
      return Math.max(0, (p - m) / Math.max(30, p - hitam));
    });
  });
  // Pensil tiap anak & cahaya tiap foto berbeda: ukur relatif terhadap lembar itu sendiri.
  // dasar = bulatan kosong (huruf tercetak di dalamnya), penuh = bulatan terisi yang umum di lembar ini.
  const urut = (a: number[]) => [...a].sort((p, q) => p - q);
  const dasar = urut(mentah.flat())[Math.floor(LJK.soal * LJK.pilihan * 0.5)];
  const penuh = Math.max(0.25, urut(mentah.map((b) => Math.max(...b) - dasar))[Math.floor(LJK.soal * 0.75)]);
  const jawab: Jawab[] = [];
  for (const baris of mentah) {
    const nilai = baris.map((v) => Math.max(0, Math.min(1, (v - dasar) / penuh)));
    const pilih = nilai.flatMap((v, i) => (v >= AMBANG.isi ? [i] : []));
    // ragu: ada bulatan setengah hitam, dua jawaban (atau coretan batal), atau kosong tapi ada coretan tipis
    const ragu = nilai.some((v) => v >= AMBANG.ragu && v < AMBANG.isi) || pilih.length > 1 || (!pilih.length && Math.max(...nilai) >= AMBANG.coret);
    jawab.push({ pilih, ragu, hitam: nilai.map((v) => Math.round(v * 100) / 100) });
  }
  return { ok: true, jawab, H, kotak: k.kotak, geser };
}

/** Potongan lurus satu wilayah LJK (pt) selebar `lebar` piksel, mis. tulisan nama. */
export function potong(g: Gambar, H: Homografi, a: { x0: number; y0: number; x1: number; y1: number }, lebar: number): Gambar {
  const tinggi = Math.round((lebar * (a.y1 - a.y0)) / (a.x1 - a.x0));
  const d = new Uint8Array(lebar * tinggi);
  for (let y = 0; y < tinggi; y++)
    for (let x = 0; x < lebar; x++)
      d[y * lebar + x] = ambil(g, ...peta(H, a.x0 + ((x + 0.5) / lebar) * (a.x1 - a.x0), a.y0 + ((y + 0.5) / tinggi) * (a.y1 - a.y0)));
  return { w: lebar, h: tinggi, d };
}

/** Nilai PG: kunci per nomor = indeks huruf (null = nomor tidak dipakai). Ragu/dua jawaban = salah sampai dibetulkan guru. */
export function hitungBenar(jawab: Jawab[], kunci: (number | null)[]): number {
  return kunci.reduce<number>((s, k, i) => s + (k !== null && jawab[i]?.pilih.length === 1 && jawab[i].pilih[0] === k ? 1 : 0), 0);
}
