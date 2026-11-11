# Gambar Panduan (public/panduan/*.webp): kotak merah bernomor + potong + simpan webp. Koordinat di scripts/panduan-gambar.json = piksel CSS layar HP 375 px.
# Pakai: tangkapan layar HP (preview, ukuran mobile) disimpan sebagai <folder>/<nama>.jpg + panduan-gambar.json disalin ke <folder>/manifest.json, lalu:
#   python -I scripts/panduan-tandai.py <folder> public/panduan
import json, sys, os
from PIL import Image, ImageDraw, ImageFont
folder, keluar = sys.argv[1], sys.argv[2]
m = json.load(open(os.path.join(folder, "manifest.json")))
huruf = ImageFont.truetype("C:/Windows/Fonts/arialbd.ttf", 22)
for nama, d in m.items():
    im = Image.open(os.path.join(folder, nama + ".jpg")).convert("RGB")
    k = im.width / 375
    gb = ImageDraw.Draw(im)
    for i, (x0, y0, x1, y1) in enumerate(d["kotak"]):
        p = 4
        gb.rounded_rectangle([(x0 - p) * k, (y0 - p) * k, (x1 + p) * k, (y1 + p) * k], radius=10 * k / 1.25, outline=(214, 40, 40), width=max(3, round(2.5 * k)))
        if len(d["kotak"]) > 1:
            r = 13 * k / 1.25 * 1.1
            cx, cy = (x0 - p) * k + r * 0.2, (y0 - p) * k + r * 0.2
            gb.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(214, 40, 40), outline="white", width=2)
            f = huruf.font_variant(size=round(r * 1.3))
            gb.text((cx, cy), str(i + 1), fill="white", font=f, anchor="mm")
    y0, y1 = d["potong"]
    im = im.crop((0, round(y0 * k), im.width, min(im.height, round(y1 * k))))
    tujuan = os.path.join(keluar, nama + ".webp")
    im.save(tujuan, "WEBP", quality=80, method=6)
    print(nama, im.size, os.path.getsize(tujuan) // 1024, "KB")
