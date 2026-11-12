// Menyiapkan data hadis 9 kitab (0.36.0) → data/hadis/<kitab>.tsv, satu hadis per baris: "nomor<TAB>teks Arab".
// Jalankan sekali (butuh internet): node scripts/siapkan-hadis.mjs. Hasilnya di-commit, aplikasi hanya membaca file.
// Sumber (data terbuka, teks berharakat):
//  - 7 kitab: github.com/fawazahmed0/hadith-api, nomor = `arabicnumber` (nomor baku Fuad Abdul Baqi; Muslim "49.01" → 49)
//  - Ahmad & Darimi: github.com/abdelrahmaan/Hadith-Data-Sets, nomor = urutan baris (sama dengan Ensiklopedi Hadits
//    9 Imam; dicek 12 Nov 2026 terhadap github.com/gadingnst/hadith-api: Ahmad 4305/4305, Darimi 2948/2949 cocok)
import { mkdirSync, writeFileSync } from "node:fs";

const FAWAZ = "https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions";
const ABDEL = "https://raw.githubusercontent.com/abdelrahmaan/Hadith-Data-Sets/master/All%20Hadith%20Books";
const KITAB = [
  ["bukhari", `${FAWAZ}/ara-bukhari.min.json`],
  ["muslim", `${FAWAZ}/ara-muslim.min.json`],
  ["abudawud", `${FAWAZ}/ara-abudawud.min.json`],
  ["tirmidzi", `${FAWAZ}/ara-tirmidhi.min.json`],
  ["nasai", `${FAWAZ}/ara-nasai.min.json`],
  ["ibnumajah", `${FAWAZ}/ara-ibnmajah.min.json`],
  ["malik", `${FAWAZ}/ara-malik.min.json`],
  ["ahmad", `${ABDEL}/Musnad%20Ahmad%20ibn%20Hanbal.csv`],
  ["darimi", `${ABDEL}/Sunan%20al%20Darami.csv`],
];

const rapi = (t) => String(t ?? "").normalize("NFC").replace(/\s+/g, " ").trim();

/** CSV satu kolom (teks hadis dalam tanda kutip bila perlu); baris pertama = nama kitab. */
function bacaCsv(isi) {
  const hasil = [];
  let sel = "", kutip = false;
  for (let i = 0; i < isi.length; i++) {
    const c = isi[i];
    if (kutip) {
      if (c === '"' && isi[i + 1] === '"') (sel += '"'), i++;
      else if (c === '"') kutip = false;
      else sel += c;
    } else if (c === '"') kutip = true;
    else if (c === "\n") (hasil.push(sel), (sel = ""));
    else if (c !== "\r") sel += c;
  }
  if (sel) hasil.push(sel);
  return hasil.slice(1);
}

mkdirSync("data/hadis", { recursive: true });
for (const [nama, url] of KITAB) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${nama}: ${r.status}`);
  const baris = url.endsWith(".json")
    ? (await r.json()).hadiths.map((h) => [String(h.arabicnumber ?? h.hadithnumber).split(".")[0], rapi(h.text)])
    : bacaCsv((await r.text()).replace(/^﻿/, "")).map((t, i) => [String(i + 1), rapi(t)]);
  const isi = baris.filter(([, t]) => t);
  writeFileSync(`data/hadis/${nama}.tsv`, isi.map(([n, t]) => `${n}\t${t}\n`).join(""));
  console.log(`${nama}: ${isi.length} hadis`);
}
