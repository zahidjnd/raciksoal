# Membuat cetakan lembar soal (public/word/template-soal.docx) dari file format AFTS milik madrasah.
# Kop, identitas, petunjuk, margin, dan 2 kolom diambil PERSIS dari file aslinya;
# judul & tahun pelajaran diganti penanda {{judul}} / {{tp}}, isi soal diganti {{isi}}.
# Pakai (jalankan ulang kalau kop madrasah berubah):
#   python scripts/buat-template-word.py "C:/.../FORMAT_AFTS_2526_Ganjil.docx"
import re, sys, zipfile

sumber = sys.argv[1]
tujuan = "public/word/template-soal.docx"
POLA_T = re.compile(r"(<w:t(?: [^>]*)?>)([^<]*)(</w:t>)")

with zipfile.ZipFile(sumber) as z:
    isi = {n: z.read(n) for n in z.namelist()}

kop = isi["word/header1.xml"].decode()
teks = [t[1] for t in POLA_T.findall(kop)]
# Pastikan struktur kop sesuai yang diharapkan sebelum diubah
for wajib in ["ASESMEN FORMATIF TENGAH", " SEMESTER G", "ANJIL ", "TAHUN PELAJARAN 202", "/202"]:
    assert wajib in teks, f"Teks kop '{wajib}' tidak ditemukan; format kop berubah, sesuaikan skrip."
i = teks.index("TAHUN PELAJARAN 202")
assert teks[i + 1 : i + 4] == ["5", "/202", "6"], teks[i : i + 4]

# Ganti per posisi supaya "5"/"6" di tempat lain tidak ikut terganti
posisi = {teks.index("ASESMEN FORMATIF TENGAH"): "{{judul}}", teks.index(" SEMESTER G"): "", teks.index("ANJIL "): "",
          i: "TAHUN PELAJARAN {{tp}}", i + 1: "", i + 2: "", i + 3: ""}
it = iter(range(len(teks)))
kop = POLA_T.sub(lambda m: (lambda k: m.group(1) + posisi.get(k, m.group(2)) + m.group(3))(next(it)), kop)
isi["word/header1.xml"] = kop.encode()

dok = isi["word/document.xml"].decode()
awal = dok[: dok.index("<w:body>") + len("<w:body>")]
sect = re.search(r"<w:sectPr\b.*?</w:sectPr>", dok, re.S).group(0)  # bagian soal: kop di halaman 1, 2 kolom
sect = sect.replace('<w:type w:val="continuous"/>', "")
sect = sect.replace("<w:cols ", '<w:cols w:sep="1" ', 1)  # garis tegak antar kolom, seperti di format asli
dok = awal + "<w:p><w:r><w:t>{{isi}}</w:t></w:r></w:p>" + sect + "</w:body></w:document>"
isi["word/document.xml"] = dok.encode()

with zipfile.ZipFile(tujuan, "w", zipfile.ZIP_DEFLATED) as z:
    for n, data in isi.items():
        z.writestr(n, data)
print("Cetakan dibuat:", tujuan)
