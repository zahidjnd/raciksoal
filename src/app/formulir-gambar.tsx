"use client";

import { useMemo, useState } from "react";
import { formulir, pakaiJudul, type Baris, type Isian } from "@/lib/formulir";
import { ATURAN_GRAFIK, svgGrafik, type JenisGrafik } from "@/lib/grafik";

const kotak = "h-10 rounded-lg border px-2 max-md:h-11";
const kecil = "h-8 min-w-8 shrink-0 rounded-lg border px-2 text-sm hover:bg-krem";

/** Kolom yang disebut pesan pemeriksa (mis. "AC tertulis 11") diberi garis merah. */
const disebut = (alasan: string | null, kunci?: string) => !!alasan && !!kunci && new RegExp(`(^|[^A-Za-z])${kunci.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^A-Za-z]|$)`, "i").test(alasan);

/**
 * Formulir gambar (0.61.0): isian dari resep `formulir()` (lib/formulir.ts). Tiap perubahan = baris tabel baru →
 * `ubah` (tabel lengkap dengan baris judul). Baris yang tidak dikenali resep ditampilkan supaya bisa dihapus.
 */
export function FormulirGambar({ jenis, isi, ubah, alasan }: { jenis: JenisGrafik; isi: string[][]; ubah: (isi: string[][]) => void; alasan: string | null }) {
  // grafik data: baris judul (nama sumbu & seri) ikut diatur formulir
  const judul = pakaiJudul(jenis);
  const baris = (judul ? isi : isi.slice(1)).map((b) => [...b] as Baris);
  const f = formulir(jenis, baris);
  if (!f) return null;
  const set = (b: Baris[]) => ubah(judul ? b : [isi[0] ?? ["Bagian", "Isi"], ...b]);
  return (
    <div className="space-y-3">
      <Deret xs={f.isian} set={set} alasan={alasan} />
      {f.sisa.length > 0 && (
        <fieldset className="space-y-1 rounded-lg border border-peringatan-garis bg-peringatan-muda p-2">
          <legend className="px-1 text-peringatan">Baris lain (tidak dikenali formulir)</legend>
          {f.sisa.map((i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="min-w-0 flex-1 break-words">
                {baris[i].filter(Boolean).join(" | ")}
              </span>
              <button type="button" className={kecil} title="Hapus baris ini" aria-label={`Hapus baris ${baris[i][0]}`} onClick={() => set(baris.filter((_, j) => j !== i))}>
                ✕
              </button>
            </div>
          ))}
        </fieldset>
      )}
    </div>
  );
}

/** Isian berurutan; tombol yang berdampingan ("+ Titik", "+ Garis", ...) dijadikan satu baris berjarak. */
function Deret({ xs, set, alasan }: { xs: Isian[]; set: (b: Baris[]) => void; alasan: string | null }) {
  const grup: Isian[][] = [];
  for (const x of xs) {
    const akhir = grup[grup.length - 1];
    if (x.t === "tombol" && akhir?.[0].t === "tombol") akhir.push(x);
    else grup.push([x]);
  }
  return grup.map((g, i) =>
    g[0].t === "tombol" ? (
      <div key={i} className="flex flex-wrap gap-2">
        {g.map((x, j) => (
          <SatuIsian key={j} x={x} set={set} alasan={alasan} />
        ))}
      </div>
    ) : (
      <SatuIsian key={i} x={g[0]} set={set} alasan={alasan} />
    ),
  );
}

function SatuIsian({ x, set, alasan }: { x: Isian; set: (b: Baris[]) => void; alasan: string | null }) {
  switch (x.t) {
    case "lembar":
      return <Lembar x={x} set={set} alasan={alasan} />;
    case "tempel":
      return <Tempel x={x} set={set} />;
    case "info":
      return <p className="rounded-lg bg-krem p-2 text-pudar">{x.teks}</p>;
    case "tombol":
      return (
        <button type="button" className={`${kotak} hover:bg-krem`} onClick={() => set(x.jalankan())}>
          {x.label}
        </button>
      );
    case "centang":
      return (
        <label className="flex items-start gap-2">
          <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-hijau" checked={x.nilai} onChange={(e) => set(x.ubah(e.target.checked))} />
          <span>{x.label}</span>
        </label>
      );
    case "pilih": {
      const salah = disebut(alasan, x.kunci);
      return x.kartu ? (
        <fieldset>
          <legend className="mb-1 font-medium">{x.label}</legend>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-2">
            {x.opsi.map(([v, label]) => (
              <button
                key={v}
                type="button"
                aria-pressed={x.nilai === v}
                className={`min-h-10 rounded-lg border px-2 py-1 text-left ${x.nilai === v ? "border-hijau bg-hijau-muda font-medium" : "hover:bg-krem"}`}
                onClick={() => x.nilai !== v && set(x.ubah(v))}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      ) : (
        <label className="flex flex-col gap-1">
          <span className="font-medium">{x.label}</span>
          <select className={`${kotak} ${salah ? "border-bahaya-garis bg-bahaya-muda" : ""}`} aria-invalid={salah || undefined} value={x.nilai} onChange={(e) => set(x.ubah(e.target.value))}>
            {!x.opsi.some(([v]) => v === x.nilai) && <option value={x.nilai}>(pilih)</option>}
            {x.opsi.map(([v, label]) => (
              <option key={v} value={v}>
                {label}
              </option>
            ))}
          </select>
        </label>
      );
    }
    case "simpul":
      return (
        <div className="flex items-center gap-1" style={{ paddingLeft: `${x.tingkat * 1.5}rem` }}>
          {x.tingkat > 0 && <span className="shrink-0 text-pudar">└</span>}
          {x.nomor && <span className="w-6 shrink-0 text-right text-pudar">{x.nomor}</span>}
          <input
            className={`${kotak} min-w-0 flex-1 ${x.tanya.aktif ? "opacity-50" : ""}`}
            aria-label={x.nomor ? `Langkah ${x.nomor}` : `Kotak tingkat ${x.tingkat + 1}`}
            placeholder={x.tanya.aktif ? "ditanyakan (tampil ....)" : x.contoh}
            disabled={x.tanya.aktif}
            value={x.nilai}
            onChange={(e) => set(x.ubah(e.target.value))}
          />
          <label className="flex shrink-0 items-center gap-1 text-pudar" title="Ditanyakan: tulisan kotak diganti ....">
            <input type="checkbox" className="h-4 w-4 accent-hijau" checked={x.tanya.aktif} onChange={(e) => set(x.tanya.ubah(e.target.checked))} />
            <span className="max-sm:sr-only">ditanyakan</span>
          </label>
          {/* lebar tetap supaya kotak isian semua baris rata kanan (pohon: + ↑ ↓ ✕; daftar: ↑ ↓ ✕) */}
          <span className={`flex shrink-0 gap-1 ${x.nomor ? "w-[6.5rem]" : "w-[8.75rem]"}`}>
            {x.aksi.map((a) => (
              <button key={a.judul} type="button" className={kecil} title={a.judul} aria-label={a.judul} onClick={() => set(a.jalankan())}>
                {a.label}
              </button>
            ))}
          </span>
        </div>
      );
    case "isi": {
      const salah = disebut(alasan, x.kunci);
      return (
        <div className="flex flex-col gap-1">
          <span className="font-medium">{x.label}</span>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-1">
              <input
                className={`${kotak} min-w-0 flex-1 ${salah ? "border-bahaya-garis bg-bahaya-muda" : ""} ${x.tanya?.aktif ? "opacity-50" : ""}`}
                inputMode={x.angka ? "decimal" : undefined}
                aria-label={x.label}
                aria-invalid={salah || undefined}
                placeholder={x.tanya?.aktif ? "ditanyakan (tampil ?)" : x.contoh}
                list={x.saran ? `saran-${x.kunci ?? x.label}` : undefined}
                disabled={x.tanya?.aktif}
                value={x.nilai}
                onChange={(e) => set(x.ubah(e.target.value))}
              />
              {x.satuan && <span className="shrink-0 text-pudar">{x.satuan}</span>}
              {x.saran && (
                <datalist id={`saran-${x.kunci ?? x.label}`}>
                  {x.saran.map((v) => (
                    <option key={v} value={v} />
                  ))}
                </datalist>
              )}
            </div>
            {x.tanya && (
              <label className="flex shrink-0 items-center gap-1 text-pudar">
                <input type="checkbox" className="h-4 w-4 accent-hijau" checked={x.tanya.aktif} onChange={(e) => set(x.tanya!.ubah(e.target.checked))} />
                ditanyakan
              </label>
            )}
          </div>
          {salah && <span className="text-bahaya">Periksa isian ini (lihat pesan di kotak kuning).</span>}
        </div>
      );
    }
    case "kelompok":
      return (
        <fieldset className="rounded-lg border p-2">
          <legend className="flex items-center gap-1 px-1 font-medium">
            {x.label}
            {x.aksi?.map((a) => (
              <button key={a.judul} type="button" className={kecil} title={a.judul} aria-label={a.judul} onClick={() => set(a.jalankan())}>
                {a.label}
              </button>
            ))}
          </legend>
          <div className={x.grid ? "grid gap-2 sm:grid-cols-2" : "space-y-2"}>
            <Deret xs={x.isian} set={set} alasan={alasan} />
          </div>
        </fieldset>
      );
  }
}

/**
 * Lembar data grafik (0.63.0): tabel kotak isian seperti Excel. Enter = kotak di bawahnya; menempel tabel (ada tab /
 * baris baru) di kotak mana pun = seluruh data diganti tempelan. Sel yang disebut pemeriksa ("Baris 2 kolom 3") merah.
 */
function Lembar({ x, set, alasan }: { x: Extract<Isian, { t: "lembar" }>; set: (b: Baris[]) => void; alasan: string | null }) {
  const [pesan, setPesan] = useState("");
  const m = /Baris (\d+) kolom (\d+)/i.exec(alasan ?? "");
  const salah = m ? [Number(m[1]) - 1, Number(m[2]) - 1] : null;
  return (
    <div className="space-y-1">
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1">
          <thead>
            <tr>
              {x.kolom.map((k, j) => (
                <th key={j} scope="col" className="px-1 text-left font-medium">
                  {k.label}
                </th>
              ))}
              <th>
                <span className="sr-only">Tombol baris</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {x.isi.map((r, i) => (
              <tr key={i}>
                {r.map((v, j) => {
                  const merah = salah?.[0] === i && salah?.[1] === j;
                  return (
                    <td key={j}>
                      <input
                        data-sel={`${i}-${j}`}
                        className={`${kotak} w-full min-w-16 ${merah ? "border-bahaya-garis bg-bahaya-muda" : ""}`}
                        aria-label={`${x.kolom[j]?.label ?? "Kolom"} baris ${i + 1}`}
                        aria-invalid={merah || undefined}
                        inputMode={x.kolom[j]?.angka ? "decimal" : undefined}
                        value={v}
                        onChange={(e) => set(x.ubah(i, j, e.target.value))}
                        onKeyDown={(e) => {
                          if (e.key !== "Enter") return;
                          e.preventDefault();
                          e.currentTarget.closest("table")?.querySelector<HTMLInputElement>(`[data-sel="${i + 1}-${j}"]`)?.focus();
                        }}
                        onPaste={(e) => {
                          const t = e.clipboardData.getData("text");
                          if (!/[\t\n]/.test(t.trim())) return; // satu angka biasa: tempel seperti biasa
                          e.preventDefault();
                          const h = x.tempel(t);
                          if (typeof h === "string") setPesan(h);
                          else {
                            setPesan("");
                            set(h);
                          }
                        }}
                      />
                    </td>
                  );
                })}
                <td className="whitespace-nowrap">
                  <span className="flex gap-1">
                    {x.aksi(i).map((a) => (
                      <button key={a.judul} type="button" className={kecil} title={a.judul} aria-label={a.judul} onClick={() => set(a.jalankan())}>
                        {a.label}
                      </button>
                    ))}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pesan && <p className="text-bahaya">{pesan}</p>}
    </div>
  );
}

/** Kotak tempel (0.63.0): tempelan langsung dipakai; kalau ditolak, teksnya tetap ada beserta alasannya. */
function Tempel({ x, set }: { x: Extract<Isian, { t: "tempel" }>; set: (b: Baris[]) => void }) {
  const [teks, setTeks] = useState("");
  const [pesan, setPesan] = useState("");
  const pakai = (t: string) => {
    const h = x.jalankan(t);
    if (typeof h === "string") return setPesan(h);
    set(h);
    setTeks("");
    setPesan("");
  };
  return (
    <details className="rounded-lg border p-2">
      <summary className="cursor-pointer font-medium">{x.label}</summary>
      <div className="mt-2 space-y-2">
        <p className="text-pudar">{x.petunjuk}</p>
        <textarea
          className="w-full rounded-lg border p-2"
          rows={4}
          aria-label={x.label}
          value={teks}
          onChange={(e) => setTeks(e.target.value)}
          onPaste={(e) => {
            const t = e.clipboardData.getData("text");
            e.preventDefault();
            setTeks(t);
            pakai(t);
          }}
        />
        {pesan && <p className="text-bahaya">{pesan}</p>}
        <button type="button" className={`${kotak} hover:bg-krem disabled:opacity-50`} disabled={!teks.trim()} onClick={() => pakai(teks)}>
          Pakai teks ini
        </button>
      </div>
    </details>
  );
}

/** Kelompok kartu pilih jenis (0.61.0), tiap kartu bergambar contohnya. */
const KELOMPOK: [string, JenisGrafik[]][] = [
  ["Data angka", ["batang", "garis", "lingkaran", "histogram", "pencar", "piramida"]],
  ["Urutan & hubungan", ["waktu", "alur", "siklus", "pohon"]],
  ["Matematika", ["koordinat", "bilangan", "datar", "sudut", "ruang"]],
  ["Fisika", ["listrik", "optik", "gaya", "katrol", "tuas"]],
  ["Kimia & Biologi", ["atom", "jaring"]],
  ["Agama", ["shaf", "waris", "arah"]],
  ["IPS", ["lapisan", "langit", "ekonomi"]],
];

/** Kata kunci pencarian di luar nama kartu (guru mencari "segitiga", bukan "bangun datar"). */
const KATA: Partial<Record<JenisGrafik, string>> = {
  batang: "diagram batang perbandingan",
  garis: "diagram garis perubahan suhu waktu",
  lingkaran: "diagram lingkaran persen pie",
  histogram: "frekuensi data berkelompok statistika",
  pencar: "korelasi regresi titik",
  piramida: "penduduk umur demografi",
  waktu: "sejarah tahun peristiwa timeline",
  alur: "flowchart langkah tata cara sanad urutan",
  siklus: "daur metamorfosis",
  pohon: "klasifikasi struktur organisasi peta konsep cabang",
  koordinat: "kartesius fungsi kuadrat parabola persamaan garis gradien vektor program linear permintaan penawaran v-t",
  bilangan: "pertidaksamaan himpunan penyelesaian",
  datar: "segitiga persegi panjang trapesium jajargenjang belah ketupat layang lingkaran juring pythagoras trigonometri",
  sudut: "berpelurus berpenyiku bertolak belakang sejajar sehadap berseberangan",
  ruang: "kubus balok prisma limas tabung kerucut bola dimensi tiga diagonal",
  listrik: "hambatan resistor lampu seri paralel amperemeter voltmeter baterai ohm",
  optik: "cermin lensa cekung cembung bayangan fokus",
  gaya: "newton bidang miring gesek normal berat balok",
  katrol: "tali beban meja",
  tuas: "pengungkit linggis gerobak sekop pesawat sederhana",
  atom: "bohr elektron kulit konfigurasi unsur kimia",
  jaring: "rantai makanan ekosistem produsen konsumen",
  shaf: "sholat salat jamaah berjamaah imam makmum",
  waris: "mawaris faraidh warisan ahli waris",
  arah: "mata angin kiblat kompas",
  lapisan: "atmosfer bumi tanah horizon troposfer",
  langit: "gerhana matahari bulan fase purnama",
  ekonomi: "pelaku ekonomi sektor rumah tangga konsumen produsen arus uang",
};

export function PilihJenis({ terpilih, pilih }: { terpilih: JenisGrafik | ""; pilih: (j: JenisGrafik | "") => void }) {
  const [cari, setCari] = useState("");
  // gambar kecil tiap jenis dari contohnya (dibuat sekali)
  const gambar = useMemo(() => Object.fromEntries(KELOMPOK.flatMap(([, js]) => js).map((j) => [j, svgGrafik(ATURAN_GRAFIK[j].contoh, { jenis: j, judul: "" }) ?? ""])), []);
  const kata = cari.trim().toLowerCase();
  const cocok = (j: JenisGrafik, kelompok: string) => !kata || `${ATURAN_GRAFIK[j].nama} ${kelompok} ${j} ${KATA[j] ?? ""}`.toLowerCase().includes(kata);
  return (
    <div className="space-y-3">
      <input className={`${kotak} w-full`} placeholder="Cari jenis, mis. segitiga, lensa, waris" aria-label="Cari jenis gambar" value={cari} onChange={(e) => setCari(e.target.value)} />
      {KELOMPOK.map(([kelompok, js]) => {
        const ada = js.filter((j) => cocok(j, kelompok));
        if (!ada.length) return null;
        return (
          <section key={kelompok}>
            <h3 className="mb-1 font-medium text-pudar">{kelompok}</h3>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(8.5rem,1fr))] gap-2">
              {ada.map((j) => (
                <button
                  key={j}
                  type="button"
                  aria-pressed={terpilih === j}
                  className={`flex flex-col items-stretch gap-1 rounded-lg border p-1.5 text-left hover:bg-krem ${terpilih === j ? "border-hijau bg-hijau-muda" : ""}`}
                  onClick={() => pilih(j)}
                >
                  <span className="flex h-20 items-center justify-center overflow-hidden rounded bg-kartu [&_svg]:h-full [&_svg]:w-auto [&_svg]:max-w-full" dangerouslySetInnerHTML={{ __html: gambar[j] }} />
                  <span className="text-sm leading-tight">{ATURAN_GRAFIK[j].nama}</span>
                </button>
              ))}
            </div>
          </section>
        );
      })}
      {(!kata || "tabel biasa".includes(kata)) && (
        <button type="button" className={`${kotak} hover:bg-krem`} onClick={() => pilih("")}>
          ▦ Tabel biasa (tanpa gambar)
        </button>
      )}
    </div>
  );
}
