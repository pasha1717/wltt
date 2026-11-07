#!/usr/bin/env python3
"""ElevenLabs sesindeki uzun boşlukları kısaltır, kelime zamanlarını kaydırır.
ajan_sistemleri/execution/jump_cut_vad_singlepass.py'den uyarlandı: VAD yerine ffmpeg silencedetect
ve kelime zamanları kullanılır (TTS sesi temiz, torch gerekmez). Ses hızlanmaz, yalnız sessizlik çıkar.
Kullanım: python3 kes.py public/klasor [en_uzun_bosluk_sn=0.35]
Sıra: ses.py -> kes.py -> sessizlik.py (satır araları sonra kontrollü eklenir)."""
import json, re, shutil, subprocess, sys

klasor = sys.argv[1]
SINIR = float(sys.argv[2]) if len(sys.argv) > 2 else 0.35  # bundan uzun boşluk bu süreye iner
BAS_SON = 0.15  # baştaki ve sondaki sessizlik bu kadar kalır
ses = f"{klasor}/ses.mp3"
k = json.load(open(f"{klasor}/kelimeler.json", encoding="utf-8"))

sure = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", ses],
                            capture_output=True, text=True, check=True).stdout)
log = subprocess.run(["ffmpeg", "-hide_banner", "-i", ses, "-af", f"silencedetect=n=-40dB:d={SINIR}", "-f", "null", "-"],
                     capture_output=True, text=True).stderr
bas = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", log)]
son = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
son += [sure] * (len(bas) - len(son))  # sondaki sessizlik kapanmamış olabilir

# Çıkarılacak aralıklar: sessizliğin ortası, kenarlarda SINIR/2 pay kalır; hiçbir kelimeye değmez.
cikar = []
for a, b in zip(bas, son):
    if a <= 0.01:  # baştaki sessizlik: ilk kelimeden önce BAS_SON kalsın
        ca, cb = 0.0, b - BAS_SON
    elif b >= sure - 0.01:  # sondaki sessizlik
        ca, cb = a + BAS_SON, sure
    else:
        ca, cb = a + SINIR / 2, b - SINIR / 2
    once = max([x["e"] for x in k if x["e"] <= cb] or [0.0])
    sonra = min([x["s"] for x in k if x["s"] >= ca] or [sure])
    ca, cb = max(ca, once), min(cb, sonra)
    if cb - ca > 0.05 and not any(x["s"] < cb and x["e"] > ca for x in k):
        cikar.append((ca, cb))
if not cikar:
    print("kesilecek boşluk yok, süre", round(sure, 1), "sn")
    sys.exit()

shutil.copy(ses, f"{klasor}/ses-kesilmemis.mp3")
tut, onceki = [], 0.0
for a, b in cikar:
    tut.append((onceki, a))
    onceki = b
tut.append((onceki, sure))
tut = [(a, b) for a, b in tut if b - a > 0.001]
filtre = "".join(f"[0]atrim={a}:{b},asetpts=N/SR/TB[p{i}];" for i, (a, b) in enumerate(tut))
filtre += "".join(f"[p{i}]" for i in range(len(tut))) + f"concat=n={len(tut)}:v=0:a=1"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", f"{klasor}/ses-kesilmemis.mp3", "-filter_complex", filtre,
                "-ac", "1", "-b:a", "128k", ses], check=True)
for x in k:
    d = sum(b - a for a, b in cikar if b <= x["s"])
    x["s"], x["e"] = round(x["s"] - d, 3), round(x["e"] - d, 3)
json.dump(k, open(f"{klasor}/kelimeler.json", "w", encoding="utf-8"), ensure_ascii=False)
print(f"{len(cikar)} boşluk kısaldı, {round(sure, 1)} -> {round(sure - sum(b - a for a, b in cikar), 1)} sn")
