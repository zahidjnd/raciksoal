import { test } from "node:test";
import assert from "node:assert/strict";
import { cariDalil, hadis } from "./hadis.ts";
import { mushaf } from "./mushaf.ts";
import { alasanDalil, rapikanMateri, susunDraf } from "./materi.ts";

const h = hadis();

test("data 9 kitab termuat", () => {
  assert.ok(h.jumlah > 65000, String(h.jumlah));
});

test("hadis buku PAI (tanpa harakat) ketemu, teks & sumber dari data", () => {
  const cek = (arab: string, sumber: string, petunjuk = "") => {
    const r = h.cari(arab, petunjuk);
    assert.equal(r?.sumber, sumber, arab);
    assert.match(r!.arab, /[ً-ْ]/, "berharakat");
  };
  cek("إنما الأعمال بالنيات وإنما لكل امرئ ما نوى", "HR. Bukhari no. 1");
  cek("الطهور شطر الإيمان", "HR. Muslim no. 223");
  cek("عجبا لأمر المؤمن إن أمره كله خير", "HR. Muslim no. 2999");
  cek("طلب العلم فريضة على كل مسلم", "HR. Ibnu Majah no. 224");
  cek("رضى الرب في رضى الوالد وسخط الرب في سخط الوالد", "HR. Tirmidzi no. 1899");
  cek("إنما بعثت لأتمم صالح الأخلاق", "HR. Ahmad no. 8595");
  // Kitab (dan nomor) yang disebut guru diutamakan.
  cek("إنما الأعمال بالنيات", "HR. Abu Dawud no. 2201", "HR. Abu Daud");
  cek("صلوا كما رأيتموني أصلي", "HR. Bukhari no. 6008", "HR. Bukhari no. 6008");
});

test("gaya buku PAI (dibaca AI dari PDF): pembuka, rujukan, lafal sedikit berbeda", () => {
  const cek = (arab: string, sumber: string, awal: RegExp) => {
    const r = cariDalil(arab);
    assert.equal(r?.sumber, sumber, arab);
    assert.match(r!.arab, awal, arab);
  };
  // Pembuka "عن ... قال رسول الله ﷺ" dan "(رواه المسلم)" dibuang; yang tampil matan dari data.
  cek("عَنْ أَبِي مَالِكٍ الْأَشْعَرِيِّ قَالَ رَسُولُ اللهِ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ الطُّهُورُ شَطْرُ الْإِيمَانِ (رواه المسلم)", "HR. Muslim no. 223", /^الطُّهُورُ/);
  // "صوم عرفة" (buku) vs "صوم يوم عرفة" (Muslim): cocok mirip, kitab yang disebut buku menang.
  cek("عَنْ أَبِي قَتَادَةَ الْأَنْصَارِي رَضِيَ اللّٰهُ عَنْهُ أَنَّ رَسُوْلَ اللّٰهِ صَلَّى اللّٰهُ عَلَيْهِ وَسَلَّمَ قَالَ سُئِلَ عَنْ صَوْمِ عَرَفَةَ يُكَفِّرُ السَّنَةَ الْمَاضِيَةَ وَالْبَاقِيَةَ. (رواه مسلم)", "HR. Muslim no. 1162", /سُئِلَ عَنْ صَوْمِ يَوْمِ عَرَفَةَ/);
  cek("عَنْ أَبِي هُرَيْرَةَ رَضِيَ اللَّهُ عَنْهُ قَالَ: قَالَ رَسُولُ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ إِنَّ اللَّهَ عَزَّ وَجَلَّ يَقْبَلُ الصَّدَقَةَ وَيَأْخُذُهَا بِيَمِينِهِ فَيُرَبِّيهَا لِأَحَدِكُمْ كَمَا يُرَبِّي أَحَدُكُمْ مُهْرَهُ أَوْ فَلُوَّهُ أَوْ فَصِيلَهُ حَتَّى إِنَّ اللُّقْمَةَ لَتَصِيرُ مِثْلَ أُحُدٍ (رواه الترمذي)", "HR. Tirmidzi no. 662", /^إِنَّ اللَّهَ يَقْبَلُ/);
  // "أَخْرَجَهُ أَبُو دَاوُدَ ..." (berharakat, tanpa kurung) di akhir.
  cek("عَنْ أَبِي هُرَيْرَةَ رَضِيَ اللهُ عَنْهُ قَالَ: قَالَ رَسُولُ اللهِ صَلَّى اللهُ عَلَيْهِ وَسَلَّمَ: إِيَّاكُمْ وَالْحَسَدَ، فَإِنَّ الْحَسَدَ يَأْكُلُ الْحَسَنَاتِ، كَمَا تَأْكُلُ النَّارُ الْحَطَبَ. أَخْرَجَهُ أَبُو دَاوُدَ وَابْنُ مَاجَهْ مِنْ حَدِيثِ أَنَسٍ نَحْوُهُ.", "HR. Abu Dawud no. 4903", /^إِيَّاكُمْ/);
  // Ayat dengan rujukan buku di belakangnya (dulu tidak dikenali).
  cek("وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ وَارْكَعُوا مَعَ الرَّاكِعِينَ (البقرة/٢: ٤٣)", "QS. Al-Baqarah [2]: 43", /^وَأَقِيمُوا/);
  // Bukan hadis: definisi, kaidah, mahfuzhat, doa berbuka → tidak dikenali (tetap kotak kuning).
  for (const t of [
    "الصَّوْمُ لُغَةً الْإِمْسَاكُ وَشَرْعًا الْإِمْسَاكُ عَنِ الْمُفْطِرَاتِ مِنْ طُلُوعِ الْفَجْرِ إِلَى غُرُوبِ الشَّمْسِ مَعَ النِّيَّةِ",
    "الْمَشَقَّةُ تَجْلِبُ التَّيْسِيرَ وَالضَّرَرُ يُزَالُ وَالْعَادَةُ مُحَكَّمَةٌ",
    "مَنْ جَدَّ وَجَدَ وَمَنْ زَرَعَ حَصَدَ وَمَنْ صَبَرَ ظَفِرَ",
    "اللَّهُمَّ لَكَ صُمْتُ وَبِكَ آمَنْتُ وَعَلَى رِزْقِكَ أَفْطَرْتُ بِرَحْمَتِكَ يَا أَرْحَمَ الرَّاحِمِينَ",
  ])
    assert.equal(cariDalil(t), null, t);
});

test("kata awal tanpa huruf kunci tidak hilang (يَا, لَا)", () => {
  assert.match(h.cari("لا يؤمن أحدكم حتى يحب لأخيه ما يحب لنفسه")!.arab, /^لاَ? يُؤْمِنُ/);
  const r = mushaf().cari("يا أيها الذين آمنوا كتب عليكم الصيام كما كتب على الذين من قبلكم لعلكم تتقون");
  assert.equal(r?.sumber, "QS. Al-Baqarah [2]: 183");
  assert.match(r!.arab, /^يَا أَيُّهَا/);
});

test("materi: hadis 9 kitab jadi kotak hijau tanpa centang; doa/niat tetap wajib centang", () => {
  const m = mushaf();
  const isi = "Puasa Ramadan wajib bagi setiap muslim yang sudah balig dan berakal. Niat dilakukan pada malam hari sebelum fajar.";
  const { isian } = susunDraf({ mapel: "Fiqih", kelas: "X", paragraf: [isi, "إنما الأعمال بالنيات وإنما لكل امرئ ما نوى", "نويت صوم غد عن أداء فرض شهر رمضان هذه السنة لله تعالى"] }, cariDalil, m.basmalah);
  assert.deepEqual(isian.dalil.map((d) => [d.sumber, !!d.kitab, !!d.usulan]), [["HR. Bukhari no. 1", true, false], ["", false, true]]);
  const dasar = { ...isian, judul: "Puasa", tp: "TP 1: Menjelaskan puasa" };
  // Hadis saja (niat dihapus guru) → tersimpan tanpa centang, sumber & teks dari data.
  const r = rapikanMateri({ ...dasar, dalil: [{ sumber: "HR. Abu Daud", arab: "إنما الأعمال بالنيات", terjemah: "Amal tergantung niat" }] }, "", cariDalil);
  assert.ok(typeof r !== "string", String(r));
  assert.equal(r.bab.dalil[0].sumber, "HR. Abu Dawud no. 2201");
  assert.equal(r.bab.dalil[0].kitab, true);
  assert.equal(r.bab.dalil[0].terjemah, "Amal tergantung niat");
  // Niat (tidak ada di data) → masih wajib centang.
  const niat = dasar.dalil.map((d) => (d.usulan ? { ...d, sumber: "Lafal niat puasa" } : d));
  assert.match(String(rapikanMateri({ ...dasar, dalil: niat }, "", cariDalil)), /sudah saya periksa/);
  assert.ok(typeof rapikanMateri({ ...dasar, dalil: niat, diverifikasi: true }, "", cariDalil) !== "string");
  // Mode Bahasa Arab memakai pencari ayat saja: hadis tetap teks biasa.
  const bahasa = susunDraf({ mapel: "Bahasa Arab", kelas: "X", paragraf: [isi, "إنما الأعمال بالنيات وإنما لكل امرئ ما نوى"] }, m.cari, m.basmalah);
  assert.equal(bahasa.isian.dalil.length, 0);
});

test("0.36.1: kekurangan kotak hadis terbaca sebelum Buat soal, sama dengan pemeriksaan server", () => {
  const dasar = { mapel: "Fiqih", kelas: "X", teksArab: "dalil" as const, judul: "Puasa", tp: "TP 1: Menjelaskan puasa", isi: "x".repeat(120), diverifikasi: false };
  const arab = "قال النبي صلى الله عليه وسلم كذا وكذا في حديث طويل";
  const kasus = [
    { dalil: [{ sumber: "", arab: "", terjemah: "" }], harap: null }, // kotak kosong diabaikan server
    { dalil: [{ sumber: "HR. Baihaqi", arab: "", terjemah: "" }], harap: "Teks Arab di kotak dalil ke-1 belum diisi." },
    { dalil: [{ sumber: "", arab, terjemah: "" }], harap: "Teks Arab ke-1 di Ayat & hadis belum selesai: hadis atau bukan?" },
    { dalil: [{ sumber: "HR. Baihaqi", arab, terjemah: "" }], harap: "Periksa teks hadis, lalu tekan tombol pemeriksaan di kotak Ayat & hadis." },
    { dalil: [{ sumber: "Bukan ayat/hadis", arab, terjemah: "", bukan: true }], harap: null },
    { dalil: [{ sumber: "HR. Bukhari no. 1", arab, terjemah: "", kitab: true }], harap: null },
  ];
  for (const k of kasus) {
    const isian = { ...dasar, dalil: k.dalil };
    assert.equal(alasanDalil(isian)?.pesan ?? null, k.harap, JSON.stringify(k.dalil));
    // Lolos pemeriksaan browser ⇔ lolos server (kotak kitab dicocokkan ulang, jadi pakai teks hadis sungguhan).
    const server = rapikanMateri({ ...isian, dalil: isian.dalil.map((d) => ("kitab" in d ? { ...d, arab: "إنما الأعمال بالنيات" } : d)) }, "", cariDalil);
    assert.equal(typeof server === "string", k.harap !== null, `${JSON.stringify(k.dalil)} → ${String(server)}`);
  }
});

test("bukan hadis atau terlalu pendek → tidak ketemu (tetap kotak kuning)", () => {
  assert.equal(h.cari("نويت صوم غد عن أداء فرض شهر رمضان هذه السنة لله تعالى"), null);
  assert.equal(h.cari("الدين النصيحة"), null); // < 10 huruf kunci
});
