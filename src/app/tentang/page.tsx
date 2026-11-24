import Link from "next/link";
import { wajibMasuk } from "@/lib/sesi";
import { Kerangka } from "../kepala";
import paket from "../../../package.json";

/**
 * Tentang aplikasi (0.38.0): versi, cara kerja singkat, sumber data (Tanzil WAJIB disebut + tautan, lisensinya),
 * dan rujukan aturan soal. Daftar rujukan = dokumen ✔ di RUJUKAN.md; dokumen baru dibaca → tambahkan juga di sini.
 */

const RUJUKAN: { judul: string; isi: string }[] = [
  { judul: "KMA 1503 Tahun 2025", isi: "Pedoman Implementasi Kurikulum RA & Madrasah: asesmen formatif & sumatif, prinsip asesmen berkeadilan." },
  { judul: "Kepdirjen Pendis 9941 Tahun 2025", isi: "Capaian Pembelajaran PAI & Bahasa Arab pada madrasah." },
  { judul: "Kepdirjen Pendis 751 Tahun 2026", isi: "POS Ujian Madrasah: format kisi-kisi resmi." },
  { judul: "Kepdirjen Pendis 6077 Tahun 2025", isi: "Panduan Kurikulum Berbasis Cinta: nilai Panca Cinta di dalam soal." },
  { judul: "Perka BSKAP 045/H/AN/2025, Kepmendikdasmen 56/2026, dan Kerangka TKA Pusmendik", isi: "Bentuk, level, dan contoh soal Latihan TKA." },
  { judul: "Panduan Pembelajaran dan Asesmen Edisi Revisi 2025 (BSKAP)", isi: "Pembanding: TP dirumuskan guru, bentuk tes tertulis, bobot, rubrik." },
  { judul: "PMA 44 Tahun 2016", isi: "Penerbitan, pentashihan, dan peredaran mushaf." },
  { judul: "Taksonomi Bloom revisi (Anderson & Krathwohl)", isi: "Level kognitif C1–C6." },
  { judul: "Surat Kepala MA Al-Fatah No. 433/P/MA/PP.006/SPb/11/2026", isi: "Jumlah soal per bentuk dan komposisi level ASAS." },
  { judul: "Format AFTS MA Al-Fatah", isi: "Kop, susunan, dan bobot lembar soal." },
];

export default async function Tentang() {
  const p = await wajibMasuk();
  const kartu = "space-y-2 rounded-xl border bg-kartu p-4 text-sm leading-relaxed";
  return (
    <Kerangka p={p}>
      <h1 className="text-2xl">Tentang aplikasi</h1>
      <p className="text-sm text-pudar">Racik Soal v{paket.version} · dipakai resmi MA Al-Fatah</p>

      <section className={kartu}>
        <p>
          <b>Racik Soal</b> membantu guru MA Al-Fatah menyusun kisi-kisi, soal, kunci, pembahasan, dan rubrik dari materi
          yang dimasukkan guru, mengikuti kurikulum Kemenag, lalu mengunduhnya sebagai file Word berkop madrasah.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>AI menyusun kisi-kisi dulu, lalu soal per nomor. Aplikasi memeriksa hasilnya dan menandai soal bermasalah dengan warna merah.</li>
          <li>Ayat Al-Qur&apos;an dan hadis <b>tidak dikarang AI</b>: diambil dari data mushaf dan data 9 kitab hadis di aplikasi, atau dari teks yang ditempel dan diperiksa guru.</li>
          <li>Soal hanya dibuat dari materi yang Anda masukkan.</li>
        </ul>
        <p className="rounded-lg border border-peringatan-garis bg-peringatan-muda p-3 text-peringatan">
          <b>Perhatian:</b> soal dibuat AI dan <b>wajib diperiksa guru sebelum dipakai</b>.
        </p>
      </section>

      <section className={kartu}>
        <h2 className="text-xl">Rujukan aturan soal</h2>
        <p className="text-pudar">Aturan penyusunan soal di aplikasi ini disusun berdasarkan dokumen berikut.</p>
        <ul className="list-disc space-y-1 pl-5">
          {RUJUKAN.map((r) => (
            <li key={r.judul}><b>{r.judul}</b>: {r.isi}</li>
          ))}
        </ul>
        <p className="text-pudar">
          Hal yang belum diatur dokumen resmi (mis. komposisi level Ulangan Harian dan AFTS, skor PG kompleks) mengikuti
          keputusan madrasah sambil menunggu pedoman asesmen madrasah dari Dirjen Pendis.
        </p>
      </section>

      <section className={kartu}>
        <h2 className="text-xl">Sumber data</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Teks Al-Qur&apos;an: <a className="underline" href="https://tanzil.net" target="_blank" rel="noreferrer">Tanzil Project (tanzil.net)</a>, versi Simple, tanpa diubah.
          </li>
          <li>
            Terjemah ayat (bila guru tidak menulis terjemah di materi): Kementerian Agama RI, dari{" "}
            <a className="underline" href="https://tanzil.net/trans/" target="_blank" rel="noreferrer">Tanzil</a> (id.indonesian), untuk pemakaian non-komersial.
          </li>
          <li>
            Teks hadis 9 kitab: <a className="underline" href="https://github.com/fawazahmed0/hadith-api" target="_blank" rel="noreferrer">hadith-api</a> (7 kitab)
            dan <a className="underline" href="https://github.com/abdelrahmaan/Hadith-Data-Sets" target="_blank" rel="noreferrer">Hadith-Data-Sets</a> (Musnad Ahmad &amp; Sunan ad-Darimi).
          </li>
        </ul>
      </section>

      <section className={kartu}>
        <h2 className="text-xl">Bantuan</h2>
        <p>
          Cara memakai: lihat <Link href="/panduan" className="underline">Panduan</Link>. Ada masalah atau saran? Hubungi admin dan sebutkan
          nomor versi (v{paket.version}).
        </p>
      </section>
    </Kerangka>
  );
}
