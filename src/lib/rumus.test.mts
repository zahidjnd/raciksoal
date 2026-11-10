import { test } from "node:test";
import assert from "node:assert/strict";
import { Document, Packer, Paragraph } from "docx";
import JSZip from "jszip";
import { rumusWord } from "./rumus.ts";

/** XML rumus Word dari LaTeX (lewat dokumen sungguhan, seperti ekspor Word aplikasi). */
async function xml(tex: string) {
  const m = rumusWord(tex);
  assert.ok(m, `tidak didukung: ${tex}`);
  const buf = await Packer.toBuffer(new Document({ sections: [{ children: [new Paragraph({ children: [m] })] }] }));
  const doc = await (await JSZip.loadAsync(buf)).file("word/document.xml")!.async("string");
  return doc.slice(doc.indexOf("<m:oMath>"), doc.indexOf("</m:oMath>"));
}
const teks = (x: string) => [...x.matchAll(/<m:t[^>]*>([^<]*)<\/m:t>/g)].map((m) => m[1]).join("");

test("rumusWord: pecahan, akar, pangkat, indeks, simbol jadi rumus Word asli", async () => {
  const f = await xml(String.raw`v = \frac{s}{t}`);
  assert.match(f, /<m:f>/);
  assert.equal(teks(f), "v=st");

  const akar = await xml(String.raw`\sqrt{2} + \sqrt[3]{x}`);
  assert.equal((akar.match(/<m:rad>/g) ?? []).length, 2);

  const p = await xml(String.raw`x^{2} - 4 \geq 0`);
  assert.match(p, /<m:sSup>/);
  assert.equal(teks(p), "x2−4≥0".replace("−", "-"));

  const kimia = await xml(String.raw`\text{CO}_{2} \rightarrow 1{,}2 \times 10^{3}\ \text{kg}`);
  assert.match(kimia, /<m:sSub>/);
  assert.match(kimia, /<m:nor m:val="1"\/>/); // \text = teks biasa
  assert.match(teks(kimia), /CO2→1,2×103 kg/);

  assert.equal(teks(await xml(String.raw`\Delta T = \alpha \cdot \theta^{\circ}`)), "ΔT=α·θ∘");
  assert.match(await xml(String.raw`\sum_{i=1}^{n} x_i`), /<m:nary>/);
  assert.match(await xml(String.raw`\lim_{x \to 0} \frac{\sin x}{x}`), /<m:limLow>/);
  assert.match(await xml(String.raw`\int_{0}^{2} x\,dx`), /<m:nary>/);
  assert.match(await xml(String.raw`a_{1}^{2}`), /<m:sSubSup>/);
  assert.match(await xml(String.raw`\vec{F} = m\vec{a}`), /<m:acc><m:accPr><m:chr m:val="⃗"\/><\/m:accPr><m:e><m:r><m:t>F<\/m:t>/);
});

test("rumusWord: LaTeX yang belum didukung atau rusak → null (dicetak sebagai teks)", () => {
  for (const t of [String.raw`\begin{matrix} a \end{matrix}`, String.raw`a \\ b`, String.raw`\frac{1}{`, String.raw`\overrightarrow{AB}`, "x^2^3", "}"]) {
    assert.equal(rumusWord(t), null, t);
  }
});

test("bacaFileOffice: rumus Equation di Word jadi $LaTeX$ (dulu terbuang), dan bolak-balik dengan rumusWord", async () => {
  const { bacaFileOffice, ommlKeLatex } = await import("./office.ts");
  // Potongan seperti buatan Word sungguhan (w:rPr Cambria Math, m:ctrlPr, m:sty)
  const word = `<m:oMath><m:r><w:rPr><w:rFonts w:ascii="Cambria Math" w:hAnsi="Cambria Math"/></w:rPr><m:t>v=</m:t></m:r><m:f><m:fPr><m:ctrlPr><w:rPr><w:i/></w:rPr></m:ctrlPr></m:fPr><m:num><m:r><m:t>s</m:t></m:r></m:num><m:den><m:r><m:t>t</m:t></m:r></m:den></m:f></m:oMath>`;
  assert.equal(ommlKeLatex(word), String.raw`v=\frac{s}{t}`);
  const d = `<m:oMath><m:func><m:funcPr/><m:fName><m:r><m:rPr><m:sty m:val="p"/></m:rPr><m:t>sin</m:t></m:r></m:fName><m:e><m:r><m:t>θ</m:t></m:r></m:e></m:func><m:d><m:dPr><m:begChr m:val="["/><m:endChr m:val="]"/></m:dPr><m:e><m:r><m:t>a&amp;b</m:t></m:r></m:e></m:d></m:oMath>`;
  assert.equal(ommlKeLatex(d), String.raw`\sin θ\left[a\&b\right]`);

  const { Document, Packer, Paragraph, TextRun } = await import("docx");
  const tex = [String.raw`v = \frac{s}{t}`, String.raw`E_{k} = \frac{1}{2} m v^{2}`, String.raw`\sqrt[3]{x} + \sum_{i=1}^{n} x_{i}`, String.raw`\lim_{x \to 0} \frac{\sin x}{x}`, String.raw`\vec{F} = m\vec{a}`];
  const doc = new Document({ sections: [{ children: tex.map((t) => new Paragraph({ children: [new TextRun("Rumus "), rumusWord(t)!, new TextRun(" saja.")] })) }] });
  const hasil = (await bacaFileOffice(await Packer.toBuffer(doc), "Fisika.docx")).teks;
  assert.deepEqual(hasil, [
    String.raw`Rumus $v=\frac{s}{t}$ saja.`,
    String.raw`Rumus $E_{k}=\frac{1}{2}m{v}^{2}$ saja.`,
    String.raw`Rumus $\sqrt[3]{x}+\sum_{i=1}^{n} {x}_{i}$ saja.`,
    String.raw`Rumus $\lim_{x→0}\frac{\sin x}{x}$ saja.`,
    String.raw`Rumus $\vec{F}=m\vec{a}$ saja.`,
  ].map((t) => t.replace("E_{k}", "{E}_{k}")));
  // hasil bacaan bisa dicetak lagi sebagai rumus Word
  for (const t of hasil) assert.ok(rumusWord(t.slice(t.indexOf("$") + 1, t.lastIndexOf("$"))), t);
});

test("rapikanLatex: keluaran MathLive dirapikan dan tetap bisa jadi rumus Word", async () => {
  const { rapikanLatex } = await import("../app/editor-rumus.ts");
  assert.equal(rapikanLatex(String.raw`\frac12x^2+2,5\placeholder{}`), String.raw`\frac12x^2+2{,}5`);
  assert.equal(rapikanLatex(String.raw`\mleft(x+1\mright)^2`), String.raw`\left(x+1\right)^2`);
  for (const t of [String.raw`\frac12x^2+2{,}5`, String.raw`\left(x+1\right)^2`, String.raw`v_t=\sqrt{v_0^2+2as}`]) assert.ok(rumusWord(t), t);
});

test("POLA_RUMUS: $...$ dikenali, harga dolar tidak", async () => {
  const { adaRumus, POLA_RUMUS } = await import("./soal.ts");
  assert.ok(adaRumus(String.raw`Jika $v = \frac{s}{t}$ maka`));
  assert.ok(adaRumus("$x$"));
  assert.ok(!adaRumus("Harga US$ 5 dan US$ 10"));
  assert.ok(!adaRumus("Rp 5.000 atau $5 dan $10"));
  assert.deepEqual("a $x^2$ b $y$".split(new RegExp(`(${POLA_RUMUS})`)), ["a ", "$x^2$", " b ", "$y$", ""]);
});
