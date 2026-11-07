# Kullanım: python3 -I kontrol.py <ad>...  (cwd=/home/user/wltt) — metin ve ayar tutarlılığı
import json, re, sys
for ad in sys.argv[1:]:
    hata = []
    try:
        sat = [x.strip() for x in open(f"public/{ad}/metin.txt", encoding="utf-8") if x.strip()]
        ham = open(f"public/{ad}/metin.txt", encoding="utf-8").read()
        t = open(f"src/{ad}/ayar.ts", encoding="utf-8").read()
        a = json.loads(t[t.index("= {") + 2:].rstrip().rstrip(";"))
    except Exception as e:
        print(ad, "OKUNAMADI", e); continue
    if len(sat) != 13: hata.append(f"{len(sat)} satır")
    if len(ham) > 980: hata.append(f"{len(ham)} karakter")
    if len(a["sahneler"]) != 13: hata.append(f"{len(a['sahneler'])} sahne")
    for i, s in enumerate(a["sahneler"]):
        if i < len(sat) and s.get("vurgu"):
            gor = [p.split("|")[0] for p in re.findall(r"\[[^\]]*\]|\S+", sat[i]) if not p.startswith("[")]
            if s["vurgu"] not in gor: hata.append(f"vurgu yok: {i} {s['vurgu']}")
        if s.get("efekt") not in (None, "yuz", "son", "buyu", "kucul", "salla", "don", "dus", "kay"): hata.append(f"efekt {s['efekt']}")
    if a["ses"] != f"{ad}/ses.mp3": hata.append("ses yolu")
    print(ad, len(ham), "OK" if not hata else hata)
