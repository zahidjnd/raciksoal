import { test } from "node:test";
import assert from "node:assert/strict";
import { apaRagu, bacaLjk, hitungBenar, homografi, LJK, peta, type Gambar } from "./ljk.ts";

// LJK tiruan: lembar digambar miring/terbalik di atas "meja" bercorak, jawaban tertentu dihitamkan.
function lembar(jawaban: (number | null)[], sudut: number, terbalik = false): Gambar {
  const w = 900, h = 1200;
  const c = Math.cos(sudut), s = Math.sin(sudut);
  const tengah: [number, number] = [w / 2, h / 2 - 150];
  const k = 1.4; // piksel per pt
  const ke = (x: number, y: number): [number, number] => {
    let [u, v] = [(x - 297) * k, (y - 230) * k];
    if (terbalik) [u, v] = [-u, -v];
    return [tengah[0] + u * c - v * s, tengah[1] + u * s + v * c];
  };
  const pojok: [number, number][] = [[0, 0], [595, 0], [595, 842], [0, 842]];
  const balik = homografi(pojok.map(([x, y]) => ke(x, y)), pojok)!;
  const isi = new Set(jawaban.flatMap((j, n) => (j === null ? [] : [`${n},${j}`])));
  const d = new Uint8Array(w * h);
  for (let py = 0; py < h; py++)
    for (let px = 0; px < w; px++) {
      const [x, y] = peta(balik, px, py);
      let v = (Math.floor(px / 40) + Math.floor(py / 40)) % 2 ? 90 : 150; // meja kotak-kotak
      if (x >= 0 && x <= 595 && y >= 0 && y <= 842) {
        v = 235;
        if (LJK.kotak.some(([kx, ky]) => Math.abs(x - kx) < LJK.sisi / 2 && Math.abs(y - ky) < LJK.sisi / 2)) v = 20;
        if (LJK.garis.some((gy) => Math.abs(y - gy) < 0.6 || Math.abs(y - gy - 2) < 0.6) && x > 37 && x < 557) v = 30;
        for (let n = 0; n < 40; n++) {
          const by = LJK.barisY[n % 10];
          if (Math.abs(y - by) > 8) continue;
          LJK.kolomX[Math.floor(n / 10)].forEach((bx, o) => {
            const r = Math.hypot((x - bx) / LJK.rx, (y - by) / LJK.ry);
            if (isi.has(`${n},${o}`) && r < 0.95) v = 60;
            else if (Math.abs(r - 1) < 0.08) v = 80;
            else if (o === 1 && r < 0.45) v = 150; // huruf B tercetak lebih tebal dari A/C/D/E
          });
        }
      }
      d[py * w + px] = v;
    }
  return { w, h, d };
}

const JAWAB = Array.from({ length: 40 }, (_, n) => (n === 7 ? null : (n * 3) % 5));

for (const [nama, sudut, terbalik] of [["lurus", 0, false], ["miring 8°", 0.14, false], ["terbalik", -0.05, true]] as const) {
  test(`LJK: baca jawaban (${nama})`, () => {
    const r = bacaLjk(lembar(JAWAB, sudut, terbalik));
    assert.ok(r.ok, r.ok ? "" : r.pesan);
    assert.deepEqual(r.jawab.map((j) => (j.pilih.length ? j.pilih[0] : null)), JAWAB);
    assert.equal(r.jawab.filter((j) => j.ragu).length, 0);
    assert.equal(hitungBenar(r.jawab, JAWAB), 39); // nomor 8 kosong tidak dihitung
  });
}

test("LJK: lembar hampir kosong tidak terbaca B (huruf B lebih tebal)", () => {
  const jawab = Array.from({ length: 40 }, (_, n) => (n === 0 ? 0 : n === 18 ? 4 : n === 30 ? 2 : null));
  const r = bacaLjk(lembar(jawab, 0.05));
  assert.ok(r.ok, r.ok ? "" : r.pesan);
  assert.deepEqual(r.jawab.map((j) => (j.pilih.length ? j.pilih[0] : null)), jawab);
  assert.equal(r.jawab.filter((j) => j.ragu).length, 0);
});

test("LJK: tanpa kotak penanda = pesan, bukan nilai asal", () => {
  const g: Gambar = { w: 400, h: 500, d: new Uint8Array(400 * 500).fill(230) };
  const r = bacaLjk(g);
  assert.equal(r.ok, false);
});

test("LJK: dua huruf kuning untuk PG, tidak untuk PG kompleks; bulatan samar tetap kuning", () => {
  assert.equal(apaRagu([1, 0, 0, 0.9, 0]), true);
  assert.equal(apaRagu([1, 0, 0, 0.9, 0], true), false);
  assert.equal(apaRagu([1, 0, 0.3, 0.9, 0], true), true);
  assert.equal(apaRagu([0, 0, 0.2, 0, 0], true), true);
  assert.equal(apaRagu([0, 1, 0, 0, 0]), false);
});
