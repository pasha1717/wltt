#!/usr/bin/env python3
"""Sese satır araları için sessizlik ekler, kelime zamanlarını kaydırır.
Kullanım: python3 sessizlik.py public/klasor
Her satır arasına 0,3 sn; [pause], [slowly] ya da [softly] ile başlayan satırdan önce 0,8 sn."""
import json, re, shutil, subprocess, sys
klasor = sys.argv[1]
satirlar = [x.strip() for x in open(f"{klasor}/metin.txt", encoding="utf-8") if x.strip()]
k = json.load(open(f"{klasor}/kelimeler.json", encoding="utf-8"))
kesimler = []
for c in range(1, len(satirlar)):
    once = [x for x in k if x["c"] == c - 1][-1]["e"]
    sonra = [x for x in k if x["c"] == c][0]["s"]
    sure = 0.8 if re.match(r"\[(pause|slowly|softly)", satirlar[c]) else 0.3
    kesimler.append(((once + sonra) / 2, sure))
shutil.copy(f"{klasor}/ses.mp3", f"{klasor}/ses-ham.mp3")
parcalar, bag, onceki = [], "", 0.0
for i, (n, sure) in enumerate(kesimler):
    parcalar.append(f"[0]atrim={onceki}:{n},asetpts=N/SR/TB[p{i}];anullsrc=r=44100:cl=mono,atrim=0:{sure}[s{i}];")
    bag += f"[p{i}][s{i}]"
    onceki = n
parcalar.append(f"[0]atrim={onceki},asetpts=N/SR/TB[son];")
bag += "[son]"
filtre = "".join(parcalar) + f"{bag}concat=n={2 * len(kesimler) + 1}:v=0:a=1"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{klasor}/ses-ham.mp3", "-filter_complex", filtre, "-ac", "1", "-b:a", "128k", f"{klasor}/ses.mp3"], check=True)
for x in k:
    d = sum(s for n, s in kesimler if x["s"] > n)
    x["s"], x["e"] = round(x["s"] + d, 3), round(x["e"] + d, 3)
json.dump(k, open(f"{klasor}/kelimeler.json", "w", encoding="utf-8"), ensure_ascii=False)
print("yeni süre", round(k[-1]["e"], 1), "sn")
