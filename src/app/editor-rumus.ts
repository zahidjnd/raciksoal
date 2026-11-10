"use client";

/**
 * Jendela rumus visual (MathLive, 0.29.0): guru menyusun rumus seperti di Word (pecahan, akar, pangkat; di HP dengan
 * papan ketik rumus), hasilnya LaTeX untuk "$...$". MathLive (±0,8 MB) baru dimuat saat jendela pertama kali dibuka.
 * Hurufnya memakai huruf KaTeX yang sudah dimuat katex.min.css (fontsDirectory = null).
 */

/** LaTeX dari MathLive → bentuk yang dikenal KaTeX & rumusWord; desimal koma "2,5" → "2{,}5" (tanpa spasi lebar). */
export const rapikanLatex = (t: string) =>
  t
    .replace(/\\placeholder(\[[^\]]*\])?\{\}/g, "")
    .replace(/\\m(left|right)/g, "\\$1")
    .replace(/(\d),(?=\d)/g, "$1{,}")
    .trim();

const tombol = "rounded-lg border h-10 px-4";

/** Buka jendela rumus berisi `awal`. Hasil: LaTeX baru, atau null bila dibatalkan. */
export async function editRumus(awal: string): Promise<string | null> {
  const { MathfieldElement } = await import("mathlive");
  MathfieldElement.fontsDirectory = null;
  MathfieldElement.soundsDirectory = null;
  MathfieldElement.decimalSeparator = ","; // tombol desimal papan ketik = koma (kaidah Indonesia), hasil "2{,}5"

  // Lapisan biasa (bukan <dialog> modal): papan ketik rumus MathLive menempel di bawah layar dengan z-index 105 dan
  // tidak bisa tampil di atas jendela modal bawaan browser (sudah dicoba: tingginya 0, tak terlihat).
  const dlg = document.createElement("div");
  dlg.setAttribute("role", "dialog");
  dlg.setAttribute("aria-modal", "true");
  dlg.className = "fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[12vh]";
  dlg.innerHTML = `<div class="w-[min(92vw,600px)] rounded-xl border bg-kartu p-4 text-tinta shadow-lg">
<p class="font-semibold">${awal ? "Ubah rumus" : "Sisipkan rumus"}</p>
<p class="mb-3 text-xs text-pudar">Ketik / untuk pecahan, ^ untuk pangkat, _ untuk indeks, sqrt untuk akar; atau tekan gambar papan ketik di kanan kotak untuk tombol rumus.</p>
<div data-tempat></div>
<div class="mt-4 flex justify-end gap-2"><button type="button" data-batal class="${tombol}">Batal</button><button type="button" data-ok class="${tombol} border-hijau bg-hijau font-semibold text-white">${awal ? "Simpan rumus" : "Masukkan"}</button></div>
</div>`;
  const mf = new MathfieldElement();
  mf.value = awal;
  mf.mathVirtualKeyboardPolicy = "auto";
  mf.style.cssText = "display:block;width:100%;font-size:1.5rem;padding:8px;border:1px solid var(--color-batas);border-radius:8px;background:var(--color-kartu);color:var(--color-tinta)";
  dlg.querySelector("[data-tempat]")!.append(mf);
  document.body.append(dlg);
  mf.focus();

  return new Promise((selesai) => {
    const tutup = (hasil: string | null) => {
      window.mathVirtualKeyboard.hide();
      dlg.remove();
      selesai(hasil);
    };
    dlg.querySelector<HTMLButtonElement>("[data-batal]")!.onclick = () => tutup(null);
    dlg.querySelector<HTMLButtonElement>("[data-ok]")!.onclick = () => tutup(rapikanLatex(mf.getValue("latex-expanded")));
    dlg.addEventListener("keydown", (e) => e.key === "Escape" && tutup(null));
  });
}

/** Ganti isi kotak teks React (terkendali) dari luar: lewat setter asli + event input, supaya onChange ikut jalan. */
export function isiKotak(el: HTMLTextAreaElement | HTMLInputElement, nilai: string, kursor: number) {
  Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), "value")!.set!.call(el, nilai);
  el.dispatchEvent(new Event("input", { bubbles: true }));
  el.focus();
  el.setSelectionRange(kursor, kursor);
}
