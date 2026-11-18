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


UZUN = False  # --uzun: yatay 1920x1080 uzun "funny moments" derlemesi
CEREZ = []  # --cerez ile doldurulur (YouTube "bot değilim" doğrulaması için)


def ytdlp_temel():
    cmd = [sys.executable, "-m", "yt_dlp", "-q", "--no-warnings", "--no-playlist", "-N", "8"] + CEREZ
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
        return [girdi]
    else:
        m = re.search(r"(twitch\.tv|kick\.com|youtube\.com)/@?([\w.-]+)", girdi)
        if not m:
            sys.exit(f"Tanınmayan girdi: {girdi}")
        plat = {"twitch.tv": "twitch", "kick.com": "kick", "youtube.com": "youtube"}[m[1]]
        liste = KANAL_LISTESI[plat].format(m[2])
    r = subprocess.run(ytdlp_temel() + ["--flat-playlist", "-I", "1:3", "--print", "url", liste],
                       capture_output=True, text=True)
    out = r.stdout.strip().splitlines()
    if not out:
        sys.exit(f"Son yayın bulunamadı: {liste}\n{r.stderr.strip()[-500:] or '(kanalda kayıtlı yayın yok)'}")
    return [u.split("#")[0] for u in out]


def bilgi_al(url, is_dizini):
    f = is_dizini / "bilgi.json"
    if f.exists():
        b = json.loads(f.read_text())
        if b.get("canli") is False:  # süren yayının durumu değişebilir: yeniden sor
            return b
    r = subprocess.run(ytdlp_temel() + ["-J", url], capture_output=True, text=True)
    if r.returncode:
        hata = r.stderr.strip().splitlines()[-1] if r.stderr.strip() else "bilinmeyen hata"
        ipucu = "\nYouTube doğrulama istiyorsa: --cerez chrome (ya da firefox, edge)" if "bot" in hata else ""
        sys.exit(f"Yayın bilgisi alınamadı: {hata}{ipucu}")
    j = json.loads(r.stdout)
    b = {"url": url, "baslik": j.get("title") or "", "sure": j.get("duration") or 0,
         "kanal": j.get("uploader") or j.get("channel") or j.get("uploader_id") or "",
         "platform": j.get("extractor_key", ""), "canli": j.get("live_status") == "is_live" or bool(j.get("is_live"))}
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


YAMNET = KOK / "modeller" / "yamnet.tflite"
YAMNET_URL = ("https://storage.googleapis.com/download.tensorflow.org/models/tflite/task_library/"
              "audio_classification/android/lite-model_yamnet_classification_tflite_1.tflite")
GULME_SINIFLARI = [13, 15, 16, 17, 18]  # Laughter, Giggle, Snicker, Belly laugh, Chuckle


def gulme_haritasi(ses, is_dizini):
    """Saniye başına gülme olasılığı (YAMNet). Kurulamazsa None: yalnız ses düzeyi kullanılır."""
    f = is_dizini / "gulme.npy"
    if f.exists():
        return np.load(f)
    try:
        from ai_edge_litert.interpreter import Interpreter
        if not YAMNET.exists():
            import urllib.request
            YAMNET.parent.mkdir(exist_ok=True)
            urllib.request.urlretrieve(YAMNET_URL, YAMNET)
        it = Interpreter(str(YAMNET))
        it.allocate_tensors()
        gir, cik = it.get_input_details()[0]["index"], it.get_output_details()[0]["index"]
    except Exception as e:
        print("  Gülme algılama kullanılamıyor (yalnız ses düzeyi):", e)
        return None
    p = subprocess.Popen(["ffmpeg", "-v", "error", "-i", str(ses), "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                         stdout=subprocess.PIPE)
    sonuc = []
    while True:
        buf = p.stdout.read(16000 * 4)
        if len(buf) < 15600 * 4:
            break
        it.set_tensor(gir, np.frombuffer(buf, dtype=np.float32)[:15600].copy())
        it.invoke()
        sonuc.append(float(it.get_tensor(cik).reshape(-1)[GULME_SINIFLARI].max()))
    p.wait()
    a = np.array(sonuc, dtype=np.float32)
    np.save(f, a)
    return a


GULME_TABAN = 0.15  # bunun altı gürültü sayılır; yayın içi sıralama ayrıca yüzdelikle yapılır


def gulme_esigi(g):
    return max(GULME_TABAN, float(np.percentile(g, 99))) if g is not None and len(g) else 1.0


def adaylari_bul(db, gulme, n, pencere, ofset):
    """Aday bölümler: (1) gülme tepeleri, şaka gülmeden önce geldiği için tepe-45..tepe+15 sn;
    (2) ortamına göre sesin belirgin yükseldiği yerler. İkisinin birleşimi."""
    T = len(db)
    if T < pencere:
        return [{"bas": ofset, "son": ofset + T, "puan": 0.0, "gulme": 0.0, "gulmeler": [], "kaynak": "ses"}]
    esik = gulme_esigi(gulme)
    adaylar = []
    if gulme is not None:
        g = gulme[:T]
        for t in np.argsort(-g):
            if g[t] < esik or len(adaylar) >= math.ceil(n * 0.6):
                break
            if all(abs(t - (x["tepe"])) >= 40 for x in adaylar):
                bas = int(min(max(t - (pencere - 15), 0), T - pencere))
                adaylar.append({"bas": bas, "son": bas + pencere, "tepe": int(t), "kaynak": "gulme"})
    k = min(301, T if T % 2 else T - 1)
    pad = np.pad(db, k // 2, mode="edge")
    taban = np.repeat(np.array([np.median(pad[i:i + k]) for i in range(0, T, 5)]), 5)[:T]
    fazla = np.clip(db - taban, 0, None)
    yuksek = sorted(((float(np.sort(fazla[s:s + pencere])[-10:].mean()), s) for s in range(0, T - pencere + 1, 5)),
                    reverse=True)
    for _, s in yuksek:
        if len(adaylar) >= n:
            break
        if all(abs(s - x["bas"]) >= 30 for x in adaylar):
            adaylar.append({"bas": s, "son": s + pencere, "tepe": None, "kaynak": "ses"})
    sonuc = []
    for x in adaylar:
        bas, son = x["bas"], x["son"]
        gul = [] if gulme is None else [int(t) for t in range(bas, min(son, len(gulme))) if gulme[t] >= esik]
        sonuc.append({"bas": bas + ofset, "son": son + ofset, "kaynak": x["kaynak"],
                      "puan": round(float(np.sort(fazla[bas:son])[-10:].mean()), 2),
                      "gulme": round(float(gulme[bas:son].max()), 2) if gulme is not None else 0.0,
                      "gulmeler": [t + ofset for t in gul]})
    return sorted(sonuc, key=lambda x: x["bas"])


def aday_ozeti(adaylar, *ek):
    import hashlib
    return hashlib.md5(json.dumps([[a["bas"], a["son"]] for a in adaylar] + list(ek)).encode()).hexdigest()[:8]


# ---------- 3. Yalnız adayları yazıya dök ----------
_MODEL = {}


def whisper(model_adi):
    if model_adi not in _MODEL:
        from faster_whisper import WhisperModel
        _MODEL[model_adi] = WhisperModel(model_adi, device="cpu", compute_type="int8")
    return _MODEL[model_adi]


def sesi_oku(dosya, bas, sure):
    ham = subprocess.run(["ffmpeg", "-v", "error", "-ss", str(bas), "-t", str(sure), "-i", str(dosya),
                          "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True, check=True).stdout
    return np.frombuffer(ham, dtype=np.float32)


def yaziya_dok(ses, adaylar, is_dizini, model_adi, dil, ofset):
    f = is_dizini / f"metinler_{aday_ozeti(adaylar, dil, model_adi)}.json"
    if f.exists():
        return json.loads(f.read_text())
    model = whisper(model_adi)
    sonuc = []
    for i, a in enumerate(adaylar):
        seg, info = model.transcribe(sesi_oku(ses, a["bas"] - ofset, a["son"] - a["bas"]), language=dil,
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
def sec(metinler, b, adet, is_dizini, llm, mod):
    f = is_dizini / f"secim_{aday_ozeti(metinler, adet, mod, llm, UZUN)}.json"
    if f.exists():
        return json.loads(f.read_text())
    secim = None
    if llm and shutil.which("claude"):
        ozet = [{"id": m["id"], "bas": m["bas"], "son": m["son"], "ses_yukselmesi": m["puan"],
                 "gulme_anlari": m.get("gulmeler", []),
                 "konusma": [f'{c["t"]}: {c["metin"]}' for c in m["cumleler"]]} for m in metinler]
        if mod == "komik":
            hedef = (f"Shorts/Reels için en komik en fazla {adet} anı seç. Önce gerçekten komik olanlar: espri, "
                     "beklenmedik tepki, rezil olma, absürt diyalog, kahkaha. 'gulme_anlari' sesten algılanmış gülme "
                     "saniyeleridir; şakanın kurulumu genelde gülmeden 10-40 sn önce başlar. Kesit kurulumla başlasın, "
                     "gülmeden 1-3 sn sonra bitsin. Komik olmayan aday varsa seçme; daha az seçmek serbest.\n")
        else:
            hedef = (f"Shorts/Reels için en çok izlenecek en fazla {adet} anı seç: komik, şaşırtıcı, gergin ya da "
                     "tek başına anlaşılan anlar.\n")
        istem = (
            f"Bir canlı yayından ({b['kanal']}, \"{b['baslik']}\") aday bölümler aşağıda. Saniyeler yayının başından itibaren.\n"
            + hedef +
            + ("Bunlar uzun bir YouTube 'funny moments' derlemesinin bölümleri olacak; en iyisini ilk sıraya koy.\n" if UZUN else "")
            + f"Her seçim {'20-89' if UZUN else '15-58'} sn olsun, adayın bas-son aralığında kalsın, bir cümlenin ortasında başlayıp bitmesin.\n"
            "Başlık kısa ve merak uyandırıcı olsun (en fazla 45 karakter, emoji yok), yayının dilinde yaz.\n"
            "Yalnızca JSON dizi döndür, başka hiçbir şey yazma:\n"
            '[{"id":1,"bas":123.0,"son":160.0,"baslik":"...","aciklama":"1-2 cümle","etiketler":["...","..."]}]\n\n'
            + json.dumps(ozet, ensure_ascii=False))
        try:
            r = subprocess.run(["claude", "-p"], input=istem, capture_output=True, text=True, timeout=600)
            m = re.search(r"\[.*\]", r.stdout, re.S)
            secim = json.loads(m[0]) if m else None
            if secim is None:
                print("  Claude yanıtı okunamadı:", (r.stdout or r.stderr)[:300])
        except Exception as e:
            print("  Claude kullanılamadı:", e)
    if secim is None:
        print("  Gülme ve ses puanına göre seçiliyor (Claude yok).")
        secim = []
        for m in sorted(metinler, key=lambda x: (-x.get("gulme", 0), -x["puan"]))[:adet]:
            if m.get("gulmeler"):  # son gülmeden 2 sn sonra bit, 35 sn geriden başla
                son = min(m["son"], m["gulmeler"][-1] + 2)
                bas = max(m["bas"], son - 35)
            else:
                bas, son = m["bas"], min(m["son"], m["bas"] + 55)
            ilk = " ".join(c["metin"] for c in m["cumleler"] if bas <= c["t"] <= son)[:45]
            secim.append({"id": m["id"], "bas": bas, "son": son, "kanca": False,
                          "baslik": ilk or f"{b['kanal']} yayınından", "aciklama": "", "etiketler": []})
    aday = {m["id"]: m for m in metinler}
    temiz = []
    for s in secim if isinstance(secim, list) else []:
        try:
            a = aday[int(s["id"])]
            bas = max(a["bas"], float(s["bas"]))
            son = min(a["son"], float(s["son"]), bas + (89 if UZUN else 59))
        except (KeyError, TypeError, ValueError):
            continue
        if son - bas >= 10:
            temiz.append({"baslik": "", "aciklama": "", "etiketler": [], **s, "id": a["id"], "bas": bas, "son": son,
                          "gulmeler": [t for t in a.get("gulmeler", []) if bas <= t <= son]})
    temiz = temiz[:adet]
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
    kumeler = []  # yüzleri konumlarına göre grupla: en çok karede görünen = yayıncı kamerası
    for i in range(16):
        cap.set(cv2.CAP_PROP_POS_FRAMES, int(n * (i + 0.5) / 16))
        ok, kare = cap.read()
        if not ok:
            continue
        for x, y, w, h in bul(kare):
            cx, cy = x + w / 2, y + h / 2
            for k in kumeler:
                if abs(k["cx"] - cx) < max(k["w"], w) and abs(k["cy"] - cy) < max(k["w"], w) * 1.3:
                    k["kutular"].append((cx, cy, w)); k["kareler"].add(i)
                    break
            else:
                kumeler.append({"cx": cx, "cy": cy, "w": w, "kutular": [(cx, cy, w)], "kareler": {i}})
    cap.release()
    kumeler = [k for k in kumeler if len(k["kareler"]) >= 5]
    if not kumeler:
        return W, H, None
    en = max(kumeler, key=lambda k: (len(k["kareler"]), np.median([b[2] for b in k["kutular"]])))
    b = np.array(en["kutular"], dtype=float)
    w = float(np.median(b[:, 2]))
    sabit = float(b[:, 0].std()) < w * 0.6 and float(b[:, 1].std()) < w * 0.6
    return W, H, (float(np.median(b[:, 0])), float(np.median(b[:, 1])), w, sabit)


def cift(x):
    return int(x) // 2 * 2


def yerlesim(W, H, yuz):
    if UZUN:  # yatay: olduğu gibi 1920x1080
        return "yatay", ("[0:v]scale=1920:1080:force_original_aspect_ratio=decrease,"
                         "pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1[v]")
    if yuz and (yuz[2] / W > 0.10 or (not yuz[3] and yuz[2] / W > 0.06)):
        # yüz büyük (sohbet yayını) ya da hareketli kişi: yüze ortalı tam dikey kırp
        cw = cift(min(W, H * 9 / 16))
        x = cift(min(max(yuz[0] - cw / 2, 0), W - cw))
        return "yuz", f"[0:v]crop={cw}:{H}:{x}:0,scale=1080:1920,setsar=1[v]"
    if yuz and yuz[3]:  # köşede sabit kamera: üstte kamera, altta oyun
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


# Küfür kökleri (Türkçe + İngilizce). Kelime küçük harfe çevrilip baştan eşleştirilir.
KUFUR = re.compile(r"^(sik(?!ke)|siktir|amk|amq|aq$|amına|amina|amını|amcık|amcik|orospu|oç$|piç|pic$|yarra|yarak|"
                   r"göt(?!ür|ü?r)|kahpe|pezevenk|gavat|ibne|yavşak|puşt|fuck|shit|bitch|cunt|motherf)")


def kufur_mu(kelime):
    k = re.sub(r"[^\w]", "", kelime.replace("İ", "i").replace("I", "ı").lower())
    return bool(k) and bool(KUFUR.match(k))


def maskele(kelime):
    return kelime[0] + re.sub(r"\w", "*", kelime[1:])


def temiz_baslik(s):
    """Emoji vb. DejaVu'da kutu çıkan karakterleri at."""
    return re.sub(r"[^\w\s.,!?'\"%&()+\-:;/#…]", "", s or "").strip()


def altyazi_yaz(kelimeler, bas, son, dil, dosya, mod, baslik="", sansur=True):
    kel = [w for w in kelimeler if w["b"] >= bas - 0.1 and w["s"] <= son + 0.1 and w["k"]]
    if sansur:
        kel = [{**w, "k": maskele(w["k"])} if kufur_mu(w["k"]) else w for w in kel]
    alt = {"bulanik": 420, "yatay": 70}.get(mod, 560)
    gx, gy = (1920, 1080) if mod == "yatay" else (1080, 1920)
    fa, fb, hiza_b = (58, 44, 7) if mod == "yatay" else (80, 62, 8)
    satirlar = ["[Script Info]", "ScriptType: v4.00+", f"PlayResX: {gx}", f"PlayResY: {gy}", "",
                "[V4+ Styles]",
                "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, "
                "Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
                f"Style: A,DejaVu Sans,{fa},&H00FFFFFF,&H00FFFFFF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,7,2,2,60,60,{alt},1",
                f"Style: B,DejaVu Sans,{fb},&H00101010,&H00101010,&H00FFFFFF,&H00FFFFFF,-1,0,0,0,100,100,0,0,3,18,0,{hiza_b},90,90,0,1",
                "", "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text"]
    baslik = temiz_baslik(baslik)
    if baslik:  # kanca: ilk 3 sn üstte başlık kutusu (bölünmüşte kamera ile oyunun birleştiği yerde)
        y = {"bolunmus": 680, "yuz": 170, "bulanik": 260, "yatay": 60}[mod]
        satirlar.append(f"Dialogue: 1,{ass_zaman(0)},{ass_zaman(min(3.0, son - bas))},B,,0,0,{y},,{tr_buyuk(baslik, dil)}")
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


def kesitleri_uret(b, secim, metinler, is_dizini, cikti, model_adi, kanca=True, yakinlas=True, sansur=True, bip=False):
    dil_haritasi = {m["id"]: m for m in metinler}
    uretilen = []
    for i, s in enumerate(secim, 1):
        anahtar = f"{int(s['bas'])}-{int(s['son'])}"
        ek = ("y" if UZUN else "") + ("" if kanca else "k") + ("" if yakinlas else "z") + ("" if sansur else "u") + ("b" if bip else "")
        son_dosya = cikti / f"kesit_{i:02d}_{anahtar}{ek}.mp4"
        uretilen.append((son_dosya, s))
        if son_dosya.exists():
            continue
        pay = 2.0
        ham = is_dizini / f"ham_{anahtar}.mp4"
        if not ham.exists():
            calistir(ytdlp_temel() + ["-f", "bv*[height<=1080][vcodec^=avc1]+ba/bv*[height<=1080]+ba/b[height<=1080]/b", "--merge-output-format", "mp4",
                                      "--download-sections", f"*{max(0, s['bas'] - pay)}-{s['son'] + pay}",
                                      "-o", str(ham), b["url"]])
        W, H, yuz = (0, 0, None) if UZUN else yuz_bul(ham)
        mod, filtre = yerlesim(W, H, yuz)
        print(f"  kesit {i}: {mod} yerleşim")
        m = dil_haritasi[s["id"]]
        bas_pay, sure = min(pay, s["bas"]), s["son"] - s["bas"]
        # Altyazı zamanları kesitin kendi sesinden: indirilen parça anahtar karede başladığı için
        # analiz sesindeki zamanlar birkaç yüz ms kayabiliyor.
        seg, _ = whisper(model_adi).transcribe(sesi_oku(ham, bas_pay, sure), language=m["dil"],
                                               word_timestamps=True, vad_filter=True)
        kel = [{"k": w.word.strip(), "b": w.start, "s": w.end} for x in seg for w in (x.words or [])]
        ass = is_dizini / f"altyazi_{anahtar}.ass"
        altyazi_yaz(kel, 0, sure, m["dil"], ass, mod, s.get("baslik", "") if kanca and s.get("kanca", True) else "", sansur)
        # küfürlü kelimelerin üstüne bip sesi
        bipler = "+".join(f"between(t,{w['b'] - 0.05:.2f},{w['s'] + 0.05:.2f})" for w in kel if kufur_mu(w["k"])) if bip else ""
        ses_filtre, ses_map = "", "0:a:0?"
        if bipler:
            ses_filtre = (f";[0:a]volume=0:enable='{bipler}'[a0];sine=frequency=1000:sample_rate=48000,volume=2.5,"
                          f"volume=0:enable='not({bipler})'[bp];[a0][bp]amix=inputs=2:duration=first:normalize=0[a]")
            ses_map = "[a]"
        gecis = ""
        if UZUN:  # bölümler arası yumuşak geçiş
            gecis = f",fade=t=in:st=0:d=0.3,fade=t=out:st={sure - 0.35:.2f}:d=0.35"
            kaynak_ses = "[a]" if bipler else "[0:a]"
            ses_filtre += (f";{kaynak_ses}afade=t=in:st=0:d=0.3,afade=t=out:st={sure - 0.35:.2f}:d=0.35[af]")
            ses_map = "[af]"
        # gülme anında kısa yakınlaşma (altyazıdan önce: yazılar büyümez)
        zum = "+".join(f"between(t,{g - s['bas'] - 0.2:.2f},{g - s['bas'] + 1.3:.2f})"
                       for g in s.get("gulmeler", [])[:3]) if yakinlas else ""
        if zum:
            zw, zh = (1920, 1080) if UZUN else (1080, 1920)
            filtre += (f";[v]scale=w='trunc({zw}*(1+0.12*min(1,{zum}))/2)*2':h='trunc({zh}*(1+0.12*min(1,{zum}))/2)*2'"
                       f":eval=frame,crop={'1920:1080' if UZUN else '1080:1920'}[vz]")
        calistir(["ffmpeg", "-v", "error", "-y", "-ss", bas_pay, "-t", sure, "-i", ham,
                  "-filter_complex", f"{filtre};[{'vz' if zum else 'v'}]fps=30,ass={ass.name}{gecis}[o]{ses_filtre}", "-map", "[o]", "-map", ses_map,
                  "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p",
                  "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", son_dosya.resolve()], cwd=is_dizini)
    return uretilen


def derleme_yap(uretilen, cikti, ad="derleme.mp4"):
    """Kesitleri arka arkaya tek videoda birleştirir (hepsi aynı ayarla kodlandığı için yeniden kodlamadan)."""
    var = [f for f, _ in uretilen if f.exists()]
    if len(var) < 2:
        return None
    liste = cikti / "derleme.txt"
    liste.write_text("".join(f"file '{f.name}'\n" for f in var))
    hedef = cikti / ad
    calistir(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", liste.name, "-c", "copy",
              "-movflags", "+faststart", hedef.name], cwd=cikti)
    liste.unlink()
    return hedef


def bolum_listesi(b, uretilen, cikti):
    """Uzun video için YouTube açıklaması: bölüm zaman damgalarıyla (YouTube bunları bölüm olarak gösterir)."""
    sat, t = [f"{b['kanal']} yayınından en komik anlar", ""], 0.0
    for f, s in uretilen:
        if not f.exists():
            continue
        sat.append(f"{int(t) // 60:02d}:{int(t) % 60:02d} {temiz_baslik(s.get('baslik')) or 'Komik an'}")
        t += float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(f)],
                                  capture_output=True, text=True).stdout or 0)
    sat += ["", f"Kaynak: {b['kanal']} yayını", b["url"], "", "#funnymoments #komikanlar"]
    (cikti / "youtube_aciklama.txt").write_text("\n".join(sat) + "\n", encoding="utf-8")


def aciklama_yaz(b, uretilen, cikti):
    sat = [f"# {b['kanal']} yayın kesitleri", "", f"Kaynak: {b['url']}", ""]
    for f, s in uretilen:
        et = " ".join("#" + re.sub(r"\W", "", e) for e in s.get("etiketler", []) if e)
        sat += [f"## {f.name}", "", f"**Başlık:** {s['baslik']}", "",
                f"{s.get('aciklama', '')}".strip(), "", f"Kaynak: {b['kanal']} yayını", "",
                (et if "#shorts" in et.lower() else f"{et} #shorts").strip(), "", f"(Yayındaki an: {int(s['bas']) // 60}:{int(s['bas']) % 60:02d})", ""]
    (cikti / "aciklamalar.md").write_text("\n".join(sat), encoding="utf-8")


def main():
    ap = argparse.ArgumentParser(description="Yayından Shorts kesitleri üretir (Twitch, Kick, YouTube).")
    ap.add_argument("kaynak", help="VOD adresi, kanal adresi ya da twitch:ad / kick:ad / youtube:ad")
    ap.add_argument("--adet", type=int, default=None, help="kesit sayısı (varsayılan 5; --uzun ile 15)")
    ap.add_argument("--aday", type=int, default=None, help="yazıya dökülecek aday sayısı (varsayılan 15; --uzun ile 40)")
    ap.add_argument("--uzun", action="store_true", help="yatay uzun 'funny moments' videosu (YouTube, bölümlü)")
    ap.add_argument("--aralik", help="yalnız bu bölümü tara, saniye: 3600-7200")
    ap.add_argument("--dil", default=None, help="konuşma dili (tr, en...); boşsa otomatik")
    ap.add_argument("--model", default="small", help="whisper modeli: tiny/base/small/medium (varsayılan small)")
    ap.add_argument("--cerez", help="tarayıcı çerezlerini kullan (chrome/firefox/edge); YouTube bot doğrulaması için")
    ap.add_argument("--mod", default="komik", choices=["komik", "genel"],
                    help="komik: en komik anlar (varsayılan); genel: komik, şaşırtıcı, gergin")
    ap.add_argument("--gulme-yok", action="store_true", help="gülme algılamayı kapat, yalnız ses düzeyi")
    ap.add_argument("--kanca-yok", action="store_true", help="ilk 3 sn başlık kutusunu koyma")
    ap.add_argument("--zum-yok", action="store_true", help="gülme anında yakınlaşma yapma")
    ap.add_argument("--sansursuz", action="store_true", help="altyazıda küfürleri maskeleme")
    ap.add_argument("--bip", action="store_true", help="küfürlerin üstüne bip sesi koy")
    ap.add_argument("--derleme", action="store_true", help="kesitleri ayrıca tek videoda birleştir (derleme.mp4)")
    ap.add_argument("--yeni", action="store_true", help="bu yayın daha önce işlendiyse atla (günlük tarama için)")
    ap.add_argument("--temizle", action="store_true", help="bitince ara dosyaları (ses, ham parçalar) sil")
    ap.add_argument("--llm-yok", action="store_true", help="Claude kullanma, yalnız gürültü puanıyla seç")
    ap.add_argument("--is", dest="is_dir", default=str(KOK / "is"), help="ara dosyalar")
    ap.add_argument("--cikti", default=str(KOK / "cikti"), help="kesitlerin yazılacağı yer")
    a = ap.parse_args()
    global UZUN
    UZUN = a.uzun
    a.adet = a.adet or (15 if UZUN else 5)
    a.aday = a.aday or (40 if UZUN else 15)

    if a.cerez:
        CEREZ.extend(["--cookies-from-browser", a.cerez])
    adresler = kaynagi_coz(a.kaynak)
    url = adresler[0]
    kimlik = re.sub(r"[^\w-]", "_", url.rstrip("/").split("/")[-1].split("=")[-1])[:40]
    if a.aralik:
        kimlik += "_" + a.aralik
    aralik = tuple(int(x) for x in a.aralik.split("-")) if a.aralik else None
    ofset = aralik[0] if aralik else 0
    is_dizini, cikti = Path(a.is_dir) / kimlik, Path(a.cikti) / (kimlik + ("_uzun" if UZUN else ""))
    is_dizini.mkdir(parents=True, exist_ok=True)
    cikti.mkdir(parents=True, exist_ok=True)

    if a.yeni and (cikti / "bitti.json").exists():
        print("Zaten işlendi:", url)
        return
    print("1/6 Kaynak:", url)
    b = bilgi_al(url, is_dizini)
    if b.get("canli") and not aralik:
        # Süren yayının kaydı gerçek zamanlı iner (4 saatlik yayın = 4 saat). Kanal verildiyse biten son yayına geç.
        if len(adresler) > 1 and not vod_mu(a.kaynak):
            print("    Bu yayın hâlâ sürüyor; biten son yayına geçiliyor.")
            sys.argv = [sys.argv[0], adresler[1]] + sys.argv[2:]
            return main()
        sys.exit("Yayın hâlâ sürüyor: kaydı gerçek zamanlı iner. Bitince tekrar çalıştır ya da --aralik ver.")
    print(f"    {b['kanal']} | {b['baslik'][:70]} | {int(b['sure'] or 0) // 60} dk")
    print("2/6 Ses indiriliyor")
    ses = ses_indir(b, is_dizini, aralik)
    print("3/6 Hareketli anlar aranıyor")
    gulme = None if a.gulme_yok else gulme_haritasi(ses, is_dizini)
    adaylar = adaylari_bul(gurultu_haritasi(ses, is_dizini), gulme, a.aday, 90 if UZUN else 60, ofset)
    print(f"    {len(adaylar)} aday ({sum(x['kaynak'] == 'gulme' for x in adaylar)} gülme, "
          f"{sum(x['kaynak'] == 'ses' for x in adaylar)} ses yükselmesi)")
    print("4/6 Adaylar yazıya dökülüyor")
    metinler = yaziya_dok(ses, adaylar, is_dizini, a.model, a.dil, ofset)
    print("5/6 En iyi anlar seçiliyor")
    secim = sec(metinler, b, a.adet, is_dizini, not a.llm_yok, a.mod)
    print("6/6 Kesitler hazırlanıyor")
    uretilen = kesitleri_uret(b, secim, metinler, is_dizini, cikti, a.model, not a.kanca_yok, not a.zum_yok,
                              not a.sansursuz, a.bip)
    aciklama_yaz(b, uretilen, cikti)
    if UZUN:
        if derleme_yap(uretilen, cikti, "funny_moments.mp4"):
            bolum_listesi(b, uretilen, cikti)
            print("    funny_moments.mp4 ve youtube_aciklama.txt hazır")
    elif a.derleme and derleme_yap(uretilen, cikti):
        print("    derleme.mp4 hazır")
    (cikti / "bitti.json").write_text(json.dumps([f.name for f, _ in uretilen], ensure_ascii=False))
    if a.temizle:
        shutil.rmtree(is_dizini, ignore_errors=True)
    print(f"\nBitti: {len(uretilen)} kesit -> {cikti}")


if __name__ == "__main__":
    main()
