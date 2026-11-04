#!/usr/bin/env python3
"""Metinden ses ve kelime zamanları üretir. Anahtar ortam değişkeninden okunur, koda yazılmaz.
Kullanım: python3 ses.py public/ilk-video <ses_id>
Girdi metin.txt: her satır bir cümle grubu. [yönlendirme] okunmaz, gosterim|okunus ekranda ilkini gösterir, ikincisini okutur."""
import base64, json, os, re, ssl, sys, urllib.request

try:
    import certifi
    baglam = ssl.create_default_context(cafile=certifi.where())
except ImportError:
    baglam = ssl.create_default_context()

klasor, ses = sys.argv[1], sys.argv[2]
satirlar = [x.strip() for x in open(f"{klasor}/metin.txt", encoding="utf-8") if x.strip()]
metin, kelimeler = "", []
for c, satir in enumerate(satirlar):
    for parca in re.findall(r"\[[^\]]*\]|\S+", satir):
        if metin:
            metin += " "
        if parca.startswith("["):
            metin += parca
            continue
        gor, oku = parca.split("|", 1) if "|" in parca else (parca, parca)
        oku = oku.replace("_", " ")
        kelimeler.append({"w": gor, "a": len(metin), "b": len(metin) + len(oku), "c": c})
        metin += oku

istek = urllib.request.Request(
    f"https://api.elevenlabs.io/v1/text-to-speech/{ses}/with-timestamps?output_format=mp3_44100_128",
    data=json.dumps({"text": metin, "model_id": "eleven_v4", "language_code": "tr", "voice_settings": {"stability": 0.3, "similarity_boost": 0.75}}).encode(),
    headers={"xi-api-key": os.environ["ELEVENLABS_API_KEY"], "Content-Type": "application/json"},
)
with urllib.request.urlopen(istek, timeout=240, context=baglam) as yanit:
    sonuc = json.load(yanit)

open(f"{klasor}/ses.mp3", "wb").write(base64.b64decode(sonuc["audio_base64"]))
h = sonuc["alignment"]
cikti = [{"w": k["w"], "s": h["character_start_times_seconds"][k["a"]], "e": h["character_end_times_seconds"][k["b"] - 1], "c": k["c"]} for k in kelimeler]
json.dump(cikti, open(f"{klasor}/kelimeler.json", "w", encoding="utf-8"), ensure_ascii=False)
print("süre", round(cikti[-1]["e"], 1), "sn,", len(cikti), "kelime,", len(metin), "karakter")
