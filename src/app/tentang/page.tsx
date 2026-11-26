import Link from "next/link";
import { wajibMasuk } from "@/lib/sesi";
import { Kerangka, judulIkut, aplikasiTerakhir } from "../kepala";

export const generateMetadata = judulIkut("Tentang aplikasi");
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
  // Halaman bersama: isi & sidebar ikut aplikasi yang terakhir dibuka (Racik Soal / Koreksi LJK).
  if ((await aplikasiTerakhir()) === "koreksi")
    return (
      <Kerangka p={p} aplikasi="ikut">
        <h1 className="text-2xl">Tentang aplikasi</h1>
        <p className="text-sm text-pudar">Koreksi LJK · bagian dari Racik Soal v{paket.version} · MA Al-Fatah</p>

        <section className={kartu}>
          <p>
            <b>Koreksi LJK</b> menilai Lembar Jawab ASAS MA Al-Fatah dari foto: guru memotret LJK dengan kamera HP (atau
            mengunggah fotonya), aplikasi membaca bulatan yang dihitamkan, lalu nilai pilihan langsung terhitung. Nilai esai
            diketik guru, nilai akhir terisi sendiri.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>LJK dibaca <b>di HP/laptop guru sendiri</b>, tanpa AI dan tanpa internet untuk membacanya.</li>
            <li>
              Aplikasi mencari 4 kotak hitam di pojok LJK, meluruskan foto yang miring atau terbalik, lalu membandingkan
              kehitaman tiap bulatan dengan bulatan lain di lembar yang sama (tahan cahaya redup dan pensil tipis).
            </li>
            <li>
              Bulatan yang <b>ragu</b> (samar, dua jawaban, bekas hapusan) ditandai <b>kuning</b> dan tidak ditebak:
              guru yang memastikan.
            </li>
            <li>
              <b>Foto LJK tidak disimpan.</b> Yang disimpan hanya jawaban per nomor dan potongan kecil tulisan nama untuk
              dicocokkan guru.
            </li>
          </ul>
          <p className="rounded-lg border border-peringatan-garis bg-peringatan-muda p-3 text-peringatan">
            <b>Perhatian:</b> hasil baca wajib dicek sekilas oleh guru, terutama nomor yang berwarna kuning.
          </p>
        </section>

        <section className={kartu}>
          <h2 className="text-xl">Aturan nilai</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Skor tiap bentuk mengikuti format ASAS madrasah (surat Kepala MA No. 433/2026) atau skor dari set Racik Soal.</li>
            <li>PG, Benar/Salah, dan menjodohkan: satu jawaban tepat = skor penuh; kosong atau dua jawaban = 0.</li>
            <li>
              PG kompleks (keputusan madrasah, 26 November 2026): tiap kunci yang dihitamkan mendapat bagiannya (2 kunci,
              benar satu = setengah skor). Bulatan yang melebihi jumlah kunci mengurangi satu jawaban benar.
            </li>
            <li>Nilai pilihan selalu dihitung ulang di server dari kunci, bukan dari kiriman HP.</li>
          </ul>
        </section>

        <section className={kartu}>
          <h2 className="text-xl">Analisis butir</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li><b>Tingkat kesukaran</b> = persentase siswa yang menjawab benar: Mudah ≥ 70%, Sedang 30–70%, Sukar &lt; 30%.</li>
            <li>
              <b>Daya beda</b> = selisih kelompok nilai tertinggi dan terendah (masing-masing 27% siswa), dihitung bila
              minimal 10 lembar: Baik ≥ 0,40, Cukup 0,20–0,39, Perlu diperbaiki 0–0,19, Dibuang bila negatif.
            </li>
            <li><b>Pengecoh lemah</b> = pilihan salah yang dipilih kurang dari 5% siswa.</li>
          </ul>
        </section>

        <section className={kartu}>
          <h2 className="text-xl">Bantuan</h2>
          <p>Ada masalah atau saran? Ketuk Kirim masukan di menu, atau hubungi admin dan sebutkan nomor versi (v{paket.version}).</p>
        </section>
      </Kerangka>
    );
  return (
    <Kerangka p={p} aplikasi="ikut">
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
