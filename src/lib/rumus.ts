// Rumus LaTeX ("$...$" di teks soal, 0.29.0) → rumus Word asli (OMML, seperti Insert → Equation) lewat library docx.
// Hanya bagian LaTeX yang lazim di soal MA: pecahan, akar, pangkat, indeks, huruf Yunani, simbol, sigma, integral, limit.
// Perintah yang tidak dikenal → null, lalu word.ts mencetak LaTeX-nya sebagai teks biasa (guru bisa membetulkan).
// Tanpa import "@/..." supaya bisa dites: npm test
import {
  BuilderElement,
  Math as RumusWord,
  MathFraction,
  MathFunction,
  MathIntegral,
  MathLimitLower,
  MathRadical,
  MathRun,
  MathSubScript,
  MathSubSuperScript,
  MathSum,
  MathSuperScript,
  type MathComponent,
  type XmlComponent,
} from "docx";

const SIMBOL: Record<string, string> = {
  alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", varepsilon: "ε", zeta: "ζ", eta: "η", theta: "θ",
  vartheta: "ϑ", iota: "ι", kappa: "κ", lambda: "λ", mu: "μ", nu: "ν", xi: "ξ", pi: "π", rho: "ρ", sigma: "σ", tau: "τ",
  upsilon: "υ", phi: "ϕ", varphi: "φ", chi: "χ", psi: "ψ", omega: "ω", Gamma: "Γ", Delta: "Δ", Theta: "Θ", Lambda: "Λ",
  Xi: "Ξ", Pi: "Π", Sigma: "Σ", Phi: "Φ", Psi: "Ψ", Omega: "Ω",
  times: "×", div: "÷", cdot: "·", pm: "±", mp: "∓", le: "≤", leq: "≤", ge: "≥", geq: "≥", ne: "≠", neq: "≠", approx: "≈",
  equiv: "≡", sim: "∼", cong: "≅", propto: "∝", infty: "∞", circ: "∘", degree: "°", to: "→", rightarrow: "→",
  leftarrow: "←", Rightarrow: "⇒", Leftarrow: "⇐", Leftrightarrow: "⇔", leftrightarrow: "↔", rightleftharpoons: "⇌",
  uparrow: "↑", downarrow: "↓", in: "∈", notin: "∉", subset: "⊂", subseteq: "⊆", supset: "⊃", cup: "∪", cap: "∩",
  emptyset: "∅", varnothing: "∅", forall: "∀", exists: "∃", neg: "¬", land: "∧", lor: "∨", angle: "∠", perp: "⊥",
  parallel: "∥", triangle: "△", partial: "∂", nabla: "∇", ldots: "…", cdots: "⋯", dots: "…", prime: "′", therefore: "∴",
  because: "∵", prod: "∏", hbar: "ℏ", ell: "ℓ", mid: "∣",
  "%": "%", "{": "{", "}": "}", $: "$", "#": "#", "&": "&", _: "_", "|": "‖",
  ",": " ", ";": " ", ":": " ", " ": " ", "!": "", quad: " ", qquad: "  ",
};
const FUNGSI = new Set(["sin", "cos", "tan", "cot", "sec", "csc", "arcsin", "arccos", "arctan", "log", "ln", "exp", "max", "min", "det"]);
const TANPA_ISI = new Set(["left", "right", "big", "Big", "bigg", "Bigg", "displaystyle", "textstyle", "limits", "nolimits"]);
const GAYA = new Set(["mathrm", "mathbf", "mathit", "boldsymbol", "mathsf", "operatorname"]);
const TEKS = new Set(["text", "textrm", "textbf", "textit", "mbox"]);
const AKSEN: Record<string, string> = { vec: "⃗", bar: "̅", overline: "̅", hat: "̂", dot: "̇", tilde: "̃" };

type Atom = string | MathComponent;

/** Gabungkan huruf/simbol berurutan menjadi satu MathRun. */
function jadi(a: Atom[]): MathComponent[] {
  const hasil: MathComponent[] = [];
  let teks = "";
  for (const x of a) {
    if (typeof x === "string") teks += x;
    else {
      if (teks) hasil.push(new MathRun(teks));
      teks = "";
      hasil.push(x);
    }
  }
  if (teks) hasil.push(new MathRun(teks));
  return hasil;
}

/** Dasar + indeks (_) dan/atau pangkat (^). Minimal salah satu terisi. */
function berskrip(isi: MathComponent[], { sub, sup }: { sub?: Atom[]; sup?: Atom[] }): MathComponent {
  if (sub && sup) return new MathSubSuperScript({ children: isi, subScript: jadi(sub), superScript: jadi(sup) });
  if (sub) return new MathSubScript({ children: isi, subScript: jadi(sub) });
  return new MathSuperScript({ children: isi, superScript: jadi(sup!) });
}

class TidakDidukung extends Error {}

/** LaTeX → rumus Word, atau null bila memakai bagian LaTeX yang belum didukung. */
export function rumusWord(tex: string): RumusWord | null {
  const tk = tex.match(/\\[A-Za-z]+|\\[^A-Za-z]|[\s\S]/g) ?? [];
  let i = 0;
  const lewatiSpasi = () => {
    while (i < tk.length && /^\s$/.test(tk[i])) i++;
  };

  // Satu argumen: {grup} atau satu token (LaTeX: "^23" = pangkat 2 lalu 3).
  function argumen(): Atom[] {
    lewatiSpasi();
    if (i >= tk.length) throw new TidakDidukung();
    if (tk[i] === "{") {
      i++;
      return daftar("}");
    }
    return atom();
  }

  // Pangkat (^) dan indeks (_) setelah sebuah atom, urutan bebas.
  function skrip(): { sub?: Atom[]; sup?: Atom[] } {
    const s: { sub?: Atom[]; sup?: Atom[] } = {};
    for (lewatiSpasi(); tk[i] === "_" || tk[i] === "^"; lewatiSpasi()) {
      const jenis = tk[i++] === "_" ? "sub" : "sup";
      if (s[jenis]) throw new TidakDidukung(); // x^2^3
      s[jenis] = argumen();
    }
    return s;
  }

  function atom(): Atom[] {
    lewatiSpasi();
    const t = tk[i++];
    if (t === undefined) return [];
    if (t === "{") return daftar("}");
    if (t === "}" || t === "&") throw new TidakDidukung();
    if (t === "~") return [" "];
    if (t === "'") return ["′"];
    if (!t.startsWith("\\")) return [t];
    const nama = t.slice(1);
    if (nama === "frac" || nama === "dfrac" || nama === "tfrac") {
      const atas = argumen();
      return [new MathFraction({ numerator: jadi(atas), denominator: jadi(argumen()) })];
    }
    if (nama === "sqrt") {
      lewatiSpasi();
      let pangkat: Atom[] | undefined;
      if (tk[i] === "[") {
        i++;
        pangkat = daftar("]");
      }
      return [new MathRadical({ children: jadi(argumen()), ...(pangkat ? { degree: jadi(pangkat) } : {}) })];
    }
    if (nama === "sum" || nama === "int") {
      const { sub, sup } = skrip();
      const isi = jadi(suku());
      const batas = { ...(sub ? { subScript: jadi(sub) } : {}), ...(sup ? { superScript: jadi(sup) } : {}) };
      return [nama === "sum" ? new MathSum({ children: isi, ...batas }) : new MathIntegral({ children: isi, ...batas })];
    }
    if (nama === "lim") {
      const { sub, sup } = skrip();
      if (sup) throw new TidakDidukung();
      const lim = new MathRun({ text: "lim", style: "plain" });
      return [sub ? new MathLimitLower({ children: [lim], limit: jadi(sub) }) : lim];
    }
    if (FUNGSI.has(nama)) {
      // Seperti Word: sin x = fungsi (nama tegak + argumennya), supaya terbaca lagi sebagai \sin x.
      const sebelum = i;
      const namaRun = new MathRun({ text: nama, style: "plain" });
      const s = skrip(); // sin^2 x
      const n = s.sub || s.sup ? berskrip([namaRun], s) : namaRun;
      lewatiSpasi();
      if (i >= tk.length || tk[i] === "}" || tk[i] === "]") {
        i = sebelum; // tanpa argumen: nama saja, pangkatnya diurus suku()
        return [namaRun];
      }
      return [new MathFunction({ name: [n], children: jadi(suku()) })];
    }
    if (TEKS.has(nama)) {
      lewatiSpasi();
      if (tk[i++] !== "{") throw new TidakDidukung();
      let isi = "";
      for (let d = 1; ; i++) {
        if (i >= tk.length) throw new TidakDidukung();
        d += tk[i] === "{" ? 1 : tk[i] === "}" ? -1 : 0;
        if (!d) break;
        isi += tk[i].replace(/^\\(.)$/, "$1");
      }
      i++;
      return [new MathRun({ text: isi, normalText: true })];
    }
    if (GAYA.has(nama)) return argumen();
    if (nama in AKSEN) {
      // m:acc buatan sendiri: docx belum punya kelas aksen, dan huruf gabung (F + U+20D7) panahnya bergeser di Word.
      const el = (name: string, children: XmlComponent[] = [], val?: string) =>
        new BuilderElement({ name, children, ...(val ? { attributes: { val: { key: "m:val", value: val } } } : {}) });
      return [el("m:acc", [el("m:accPr", [el("m:chr", [], AKSEN[nama])]), el("m:e", jadi(argumen()))]) as unknown as MathComponent];
    }
    if (TANPA_ISI.has(nama)) {
      if (tk[i] === ".") i++; // \left. / \right.
      return [];
    }
    if (nama in SIMBOL) return [SIMBOL[nama]];
    throw new TidakDidukung(); // \\, \begin, \overrightarrow, \ce, dst.
  }

  // Satu atom beserta pangkat/indeksnya.
  function suku(): Atom[] {
    const dasar = atom();
    const s = skrip();
    return s.sub || s.sup ? [berskrip(jadi(dasar.length ? dasar : [" "]), s)] : dasar;
  }

  function daftar(tutup?: string): Atom[] {
    const hasil: Atom[] = [];
    for (lewatiSpasi(); i < tk.length; lewatiSpasi()) {
      if (tk[i] === tutup) {
        i++;
        return hasil;
      }
      if (tk[i] === "}" || tk[i] === "^" || tk[i] === "_") throw new TidakDidukung();
      hasil.push(...suku());
    }
    if (tutup) throw new TidakDidukung(); // kurung kurawal tidak tertutup
    return hasil;
  }

  try {
    const isi = jadi(daftar());
    return isi.length ? new RumusWord({ children: isi }) : null;
  } catch (e) {
    if (e instanceof TidakDidukung) return null;
    throw e;
  }
}
