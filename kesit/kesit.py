#!/usr/bin/env python3
"""Yayın kesiti -> Shorts. Twitch, Kick ve YouTube yayın kayıtlarından dikey kesitler üretir.

Kullanım:
  python3 kesit.py <VOD adresi | kanal adresi | twitch:ad | kick:ad | youtube:ad> [seçenekler]

Aşamalar diske yazılır; yarıda kalırsa aynı komutu tekrar çalıştırmak kaldığı yerden sürdürür.
"""
import argparse, json, math, os, re, shutil, subprocess, sys
from pathlib import Path

import numpy as np

KOK = Path(__file__).resolve().parent


def calistir(cmd, **kw):
    print("  $", " ".join(str(c) for c in cmd)[:200], flush=True)
    return subprocess.run([str(c) for c in cmd], check=True, **kw)


def ytdlp_temel():
    cmd = [sys.executable, "-m", "yt_dlp", "-q", "--no-warnings", "--no-playlist"]
    if not shutil.which("deno") and shutil.which("node"):
        cmd += ["--js-runtimes", "node:" + shutil.which("node")]
    return cmd


# ---------- 1. Kaynağı çöz ----------
KANAL_LISTESI = {
    "twitch": "https://www.twitch.tv/{}/videos?filter=archives&sort=time",
    "kick": "https://kick.com/{}/videos",
    "youtube": "https://www.youtube.com/@{}/streams",
}


def vod_mu(url):
    return bool(re.search(r"twitch\.tv/videos/\d+|kick\.com/[^/]+/videos/[\w-]+|youtube\.com/(watch|live/)|youtu\.be/", url))


def kaynagi_coz(girdi):
    m = re.match(r"^(twitch|kick|youtube):(.+)$", girdi)
    if m:
        liste = KANAL_LISTESI[m[1]].format(m[2].lstrip("@"))
    elif vod_mu(girdi):
        return girdi
    else:
        m = re.search(r"(twitch\.tv|kick\.com|youtube\.com)/@?([\w.-]+)", girdi)
        if not m:
            sys.exit(f"Tanınmayan girdi: {girdi}")
        plat = {"twitch.tv": "twitch", "kick.com": "kick", "youtube.com": "youtube"}[m[1]]
        liste = KANAL_LISTESI[plat].format(m[2])
    out = subprocess.run(ytdlp_temel() + ["--flat-playlist", "-I", "1", "--print", "url", liste],
                         capture_output=True, text=True).stdout.strip().splitlines()
    if not out:
        sys.exit(f"Son yayın bulunamadı: {liste}")
    return out[-1].split("#")[0]


def bilgi_al(url, is_dizini):
    f = is_dizini / "bilgi.json"
    if f.exists():
        return json.loads(f.read_text())
    out = subprocess.run(ytdlp_temel() + ["-J", url], capture_output=True, text=True, check=True).stdout
    j = json.loads(out)
    b = {"url": url, "baslik": j.get("title") or "", "sure": j.get("duration") or 0,
         "kanal": j.get("uploader") or j.get("channel") or j.get("uploader_id") or "",
         "platform": j.get("extractor_key", "")}
    f.write_text(json.dumps(b, ensure_ascii=False, indent=1))
    return b


# ---------- 2. Ses ve gürültü haritası ----------
def ses_indir(b, is_dizini, aralik):
    hedef = is_dizini / "ses.m4a"
    if hedef.exists():
        return hedef
    cmd = ytdlp_temel() + ["-f", "ba/bestaudio/worst", "-o", str(is_dizini / "ses_ham.%(ext)s")]
    if aralik:
        cmd += ["--download-sections", f"*{aralik[0]}-{aralik[1]}"]
    calistir(cmd + [b["url"]])
    ham = next(is_dizini.glob("ses_ham.*"))
    calistir(["ffmpeg", "-v", "error", "-y", "-i", ham, "-vn", "-ac", "1", "-c:a", "aac", "-b:a", "96k", hedef])
    ham.unlink()
    return hedef


def gurultu_haritasi(ses, is_dizini):
    f = is_dizini / "gurultu.npy"
    if f.exists():
        return np.load(f)
    sr = 8000
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", str(ses), "-ac", "1", "-ar", str(sr), "-f", "s16le", "-"],
                         stdout=subprocess.PIPE)
    db = []
    while True:
        buf = p.stdout.read(sr * 2)
        if len(buf) < sr:
            break
        x = np.frombuffer(buf, dtype=np.int16).astype(np.float32) / 32768
        db.append(20 * math.log10(float(np.sqrt(np.mean(x * x))) + 1e-6))
    p.wait()
    a = np.array(db, dtype=np.float32)
    np.save(f, a)
    return a


def adaylari_bul(db, n, pencere, ofset):
    """Ortamına göre belirgin şekilde yükselen (bağırma, gülme, tepki) 'pencere' sn'lik bölümler."""
    T = len(db)
    if T < pencere:
        return [{"bas": ofset, "son": ofset + T, "puan": 0.0}]
    k = min(301, T if T % 2 else T - 1)
    pad = np.pad(db, k // 2, mode="edge")
    taban = np.array([np.median(pad[i:i + k]) for i in range(0, T, 5)])
    taban = np.repeat(taban, 5)[:T]
    fazla = np.clip(db - taban, 0, None)
    adaylar = []
    for s in range(0, T - pencere + 1, 5):
        tepe = np.sort(fazla[s:s + pencere])[-10:].mean()
        adaylar.append((float(tepe), s))
    adaylar.sort(reverse=True)
    secilen = []
    for puan, s in adaylar:
        if all(abs(s - x["bas"] + ofset) >= pencere for x in secilen):
            secilen.append({"bas": s + ofset, "son": s + pencere + ofset, "puan": round(puan, 2)})
        if len(secilen) >= n:
            break
    return sorted(secilen, key=lambda x: x["bas"])


# ---------- 3. Yalnız adayları yazıya dök ----------
def yaziya_dok(ses, adaylar, is_dizini, model_adi, dil, ofset):
    f = is_dizini / "metinler.json"
    if f.exists():
        return json.loads(f.read_text())
    from faster_whisper import WhisperModel
    model = WhisperModel(model_adi, device="cpu", compute_type="int8")
    sonuc = []
    for i, a in enumerate(adaylar):
        ham = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(a["bas"] - ofset), "-t", str(a["son"] - a["bas"]),
                              "-i", str(ses), "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                             capture_output=True, check=True).stdout
        seg, info = model.transcribe(np.frombuffer(ham, dtype=np.float32), language=dil,
                                     word_timestamps=True, vad_filter=True)
        kelimeler, cumleler = [], []
        for s in seg:
            cumleler.append({"t": round(a["bas"] + s.start, 1), "metin": s.text.strip()})
            for w in s.words or []:
                kelimeler.append({"k": w.word.strip(), "b": round(a["bas"] + w.start, 2), "s": round(a["bas"] + w.end, 2)})
        sonuc.append({**a, "id": i + 1, "dil": info.language, "cumleler": cumleler, "kelimeler": kelimeler})
        print(f"  aday {i + 1}/{len(adaylar)} yazıya döküldü", flush=True)
    f.write_text(json.dumps(sonuc, ensure_ascii=False, indent=1))
    return sonuc


# ---------- 4. En iyi anları seç (Claude, yoksa gürültü puanı) ----------
def sec(metinler, b, adet, is_dizini, llm):
    f = is_dizini / "secim.json"
    if f.exists():
        return json.loads(f.read_text())
    secim = None
    if llm and shutil.which("claude"):
        ozet = [{"id": m["id"], "bas": m["bas"], "son": m["son"], "gurultu": m["puan"],
                 "konusma": [f'{c["t"]}: {c["metin"]}' for c in m["cumleler"]]} for m in metinler]
        istem = (
            f"Bir canlı yayından ({b['kanal']}, \"{b['baslik']}\") aday bölümler aşağıda. Saniyeler yayının başından itibaren.\n"
            f"Shorts/Reels için en çok izlenecek {adet} anı seç: komik, şaşırtıcı, gergin ya da tek başına anlaşılan anlar.\n"
            "Her seçim 20-58 sn olsun, adayın bas-son aralığında kalsın, bir cümlenin ortasında başlayıp bitmesin.\n"
            "Başlık kısa ve merak uyandırıcı olsun, yayının dilinde yaz. Yalnızca JSON dizi döndür, başka hiçbir şey yazma:\n"
            '[{"id":1,"bas":123.0,"son":160.0,"baslik":"...","aciklama":"1-2 cümle","etiketler":["...","..."]}]\n\n'
            + json.dumps(ozet, ensure_ascii=False))
        try:
            r = subprocess.run(["claude", "-p"], input=istem, capture_output=True, text=True, timeout=600)
            m = re.search(r"\[.*\]", r.stdout, re.S)
            secim = json.loads(m[0]) if m else None
            if not secim:
                print("  Claude yanıtı okunamadı:", (r.stdout or r.stderr)[:300])
        except Exception as e:
            print("  Claude kullanılamadı:", e)
    if not secim:
        print("  Gürültü puanına göre seçiliyor (Claude yok).")
        secim = []
        for m in sorted(metinler, key=lambda x: -x["puan"])[:adet]:
            ilk = " ".join(c["metin"] for c in m["cumleler"])[:60]
            secim.append({"id": m["id"], "bas": m["bas"], "son": min(m["son"], m["bas"] + 55),
                          "baslik": ilk or f"{b['kanal']} yayınından", "aciklama": "", "etiketler": []})
    aday = {m["id"]: m for m in metinler}
    temiz = []
    for s in secim:
        a = aday.get(s.get("id"))
        if not a:
            continue
        bas = max(a["bas"], float(s["bas"]))
        son = min(a["son"], float(s["son"]), bas + 59)
        if son - bas >= 10:
            temiz.append({**s, "bas": bas, "son": son})
    f.write_text(json.dumps(temiz, ensure_ascii=False, indent=1))
    return temiz


# ---------- 5. Kes, dikeye çevir, altyazı göm ----------
YUNET = KOK / "modeller" / "yunet.onnx"
YUNET_URL = ("https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/"
             "face_detection_yunet/face_detection_yunet_2023mar.onnx")


def yuz_algilayici(W, H):
    """YuNet (yan profil ve küçük kamerada iyi); indirilemezse OpenCV Haar."""
    import cv2
    if not YUNET.exists():
        try:
            import urllib.request
            YUNET.parent.mkdir(exist_ok=True)
            urllib.request.urlretrieve(YUNET_URL, YUNET)
        except Exception as e:
            print("  YuNet indirilemedi, Haar kullanılıyor:", e)
    if YUNET.exists() and YUNET.stat().st_size > 10000:
        d = cv2.FaceDetectorYN.create(str(YUNET), "", (W, H), 0.8)
        return lambda kare: [] if (r := d.detect(kare)[1]) is None else [x[:4] for x in r]
    cas = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    return lambda kare: list(cas.detectMultiScale(cv2.cvtColor(kare, cv2.COLOR_BGR2GRAY), 1.1, 6,
                                                  minSize=(max(30, H // 25),) * 2))


def yuz_bul(video):
    import cv2
    cap = cv2.VideoCapture(str(video))
    n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) or 1
    W, H = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    bul = yuz_algilayici(W, H)
    kutular = []
    for i in range(16):
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(n * (i + 0.5) / 16))
        ok, kare = cap.read()
        if not ok:
            continue
        yuz = bul(kare)
        if len(yuz):
            kutular.append(max(yuz, key=lambda r: r[2] * r[3]))
    cap.release()
    if len(kutular) < 5:
        return W, H, None
    k = np.array(kutular, dtype=float)
    cx, cy = k[:, 0] + k[:, 2] / 2, k[:, 1] + k[:, 3] / 2
    if cx.std() > W * 0.12:  # tutarsız: yüz bir yerde sabit değil
        return W, H, None
    return W, H, (float(np.median(cx)), float(np.median(cy)), float(np.median(k[:, 2])))


def cift(x):
    return int(x) // 2 * 2


def yerlesim(W, H, yuz):
    if yuz and yuz[2] / W > 0.16:  # yüz büyük: sohbet yayını, yüze ortalı tam dikey kırp
        cw = cift(min(W, H * 9 / 16))
        x = cift(min(max(yuz[0] - cw / 2, 0), W - cw))
        return "yuz", f"[0:v]crop={cw}:{H}:{x}:0,scale=1080:1920,setsar=1[v]"
    if yuz:  # köşede kamera: üstte kamera, altta oyun
        cw = min(W, yuz[2] * 7)
        ch = min(H, cw / 1.6875)
        cw = ch * 1.6875
        x = min(max(yuz[0] - cw / 2, 0), W - cw)
        y = min(max(yuz[1] - ch * 0.45, 0), H - ch)
        gw = cift(min(W, H * 1080 / 1280))
        return "bolunmus", (
            f"[0:v]split[a][b];[a]crop={cift(cw)}:{cift(ch)}:{cift(x)}:{cift(y)},scale=1080:640,setsar=1[ust];"
            f"[b]crop={gw}:{H}:{cift((W - gw) / 2)}:0,scale=1080:1280,setsar=1[alt];[ust][alt]vstack[v]")
    return "bulanik", ("[0:v]split[a][b];[a]scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,"
                       "boxblur=25:2,eq=brightness=-0.08[bg];[b]scale=1080:-2[fg];[bg][fg]overlay=0:(H-h)/2,setsar=1[v]")


def tr_buyuk(s, dil):
    if dil == "tr":
        s = s.replace("i", "İ").replace("ı", "I")
    return s.upper()


def ass_zaman(t):
    t = max(0, t)
    return f"{int(t // 3600)}:{int(t % 3600 // 60):02d}:{t % 60:05.2f}"


def altyazi_yaz(kelimeler, bas, son, dil, dosya, mod):
    kel = [w for w in kelimeler if w["b"] >= bas - 0.1 and w["s"] <= son + 0.1 and w["k"]]
    alt = 560 if mod != "bulanik" else 420
    satirlar = ["[Script Info]", "ScriptType: v4.00+", "PlayResX: 1080", "PlayResY: 1920", "",
                "[V4+ Styles]",
                "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, "
                "Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
                f"Style: A,DejaVu Sans,80,&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,7,2,2,60,60,{alt},1",
                "", "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
    gruplar, g = [], []
    for w in kel:
        if g and (len(g) >= 3 or w["b"] - g[-1]["s"] > 0.8 or sum(len(x["k"]) for x in g) > 16):
            gruplar.append(g)
            g = []
        g.append(w)
    if g:
        gruplar.append(g)
    for gi, g in enumerate(gruplar):
        grup_sonu = gruplar[gi + 1][0]["b"] if gi + 1 < len(gruplar) and gruplar[gi + 1][0]["b"] - g[-1]["s"] < 0.5 else g[-1]["s"] + 0.2
        for wi, w in enumerate(g):
            b = w["b"]
            s = g[wi + 1]["b"] if wi + 1 < len(g) else grup_sonu
            metin = " ".join(("{\\c&H00E6FF&}" + tr_buyuk(x["k"], dil) + "{\\c&HFFFFFF&}") if x is w
                             else tr_buyuk(x["k"], dil) for x in g)
            satirlar.append(f"Dialogue: 0,{ass_zaman(b - bas)},{ass_zaman(s - bas)},A,,0,0,0,,{metin}")
    dosya.write_text("\n".join(satirlar) + "\n", encoding="utf-8")


def kesitleri_uret(b, secim, metinler, is_dizini, cikti):
    dil_haritasi = {m["id"]: m for m in metinler}
    uretilen = []
    for i, s in enumerate(secim, 1):
        son_dosya = cikti / f"kesit_{i:02d}.mp4"
        uretilen.append((son_dosya, s))
        if son_dosya.exists():
            continue
        pay = 2.0
        ham = is_dizini / f"ham_{i:02d}.mp4"
        if not ham.exists():
            calistir(ytdlp_temel() + ["-f", "bv*[height<=1080]+ba/b[height<=1080]/b", "--merge-output-format", "mp4",
                                      "--download-sections", f"*{max(0, s['bas'] - pay)}-{s['son'] + pay}",
                                      "-o", str(ham), b["url"]])
        W, H, yuz = yuz_bul(ham)
        mod, filtre = yerlesim(W, H, yuz)
        print(f"  kesit {i}: {mod} yerleşim")
        m = dil_haritasi[s["id"]]
        ass = is_dizini / f"altyazi_{i:02d}.ass"
        altyazi_yaz(m["kelimeler"], s["bas"], s["son"], m["dil"], ass, mod)
        bas_pay = min(pay, s["bas"])
        calistir(["ffmpeg", "-v", "error", "-y", "-ss", bas_pay, "-t", s["son"] - s["bas"], "-i", ham,
                  "-filter_complex", f"{filtre};[v]fps=30,ass={ass.name}[o]", "-map", "[o]", "-map", "0:a:0?",
                  "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
                  "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", son_dosya.resolve()], cwd=is_dizini)
    return uretilen


def aciklama_yaz(b, uretilen, cikti):
    sat = [f"# {b['kanal']} yayın kesitleri", "", f"Kaynak: {b['url']}", ""]
    for f, s in uretilen:
        et = " ".join("#" + re.sub(r"\W", "", e) for e in s.get("etiketler", []) if e)
        sat += [f"## {f.name}", "", f"**Başlık:** {s['baslik']}", "",
                f"{s.get('aciklama', '')}".strip(), "", f"Kaynak: {b['kanal']} yayını", "",
                f"{et} #shorts".strip(), "", f"(Yayındaki an: {int(s['bas']) // 60}:{int(s['bas']) % 60:02d})", ""]
    (cikti / "aciklamalar.md").write_text("\n".join(sat), encoding="utf-8")


def main():
    ap = argparse.ArgumentParser(description="Yayından Shorts kesitleri üretir (Twitch, Kick, YouTube).")
    ap.add_argument("kaynak", help="VOD adresi, kanal adresi ya da twitch:ad / kick:ad / youtube:ad")
    ap.add_argument("--adet", type=int, default=5, help="üretilecek kesit sayısı (varsayılan 5)")
    ap.add_argument("--aday", type=int, default=15, help="yazıya dökülecek aday bölüm sayısı (varsayılan 15)")
    ap.add_argument("--aralik", help="yalnız bu bölümü tara, saniye: 3600-7200")
    ap.add_argument("--dil", default=None, help="konuşma dili (tr, en...); boşsa otomatik")
    ap.add_argument("--model", default="small", help="whisper modeli: tiny/base/small/medium (varsayılan small)")
    ap.add_argument("--llm-yok", action="store_true", help="Claude kullanma, yalnız gürültü puanıyla seç")
    ap.add_argument("--is", dest="is_dir", default=str(KOK / "is"), help="ara dosyalar")
    ap.add_argument("--cikti", default=str(KOK / "cikti"), help="kesitlerin yazılacağı yer")
    a = ap.parse_args()

    url = kaynagi_coz(a.kaynak)
    kimlik = re.sub(r"[^\w-]", "_", url.rstrip("/").split("/")[-1].split("=")[-1])[:40]
    if a.aralik:
        kimlik += "_" + a.aralik
    aralik = tuple(int(x) for x in a.aralik.split("-")) if a.aralik else None
    ofset = aralik[0] if aralik else 0
    is_dizini, cikti = Path(a.is_dir) / kimlik, Path(a.cikti) / kimlik
    is_dizini.mkdir(parents=True, exist_ok=True)
    cikti.mkdir(parents=True, exist_ok=True)

    print("1/6 Kaynak:", url)
    b = bilgi_al(url, is_dizini)
    print(f"    {b['kanal']} | {b['baslik'][:70]} | {int(b['sure'] or 0) // 60} dk")
    print("2/6 Ses indiriliyor")
    ses = ses_indir(b, is_dizini, aralik)
    print("3/6 Hareketli anlar aranıyor")
    adaylar = adaylari_bul(gurultu_haritasi(ses, is_dizini), a.aday, 60, ofset)
    print(f"    {len(adaylar)} aday")
    print("4/6 Adaylar yazıya dökülüyor")
    metinler = yaziya_dok(ses, adaylar, is_dizini, a.model, a.dil, ofset)
    print("5/6 En iyi anlar seçiliyor")
    secim = sec(metinler, b, a.adet, is_dizini, not a.llm_yok)
    print("6/6 Kesitler hazırlanıyor")
    uretilen = kesitleri_uret(b, secim, metinler, is_dizini, cikti)
    aciklama_yaz(b, uretilen, cikti)
    print(f"\nBitti: {len(uretilen)} kesit -> {cikti}")


if __name__ == "__main__":
    main()
