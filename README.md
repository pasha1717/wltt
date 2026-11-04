# Animasyon video projesi

Dikey (1080x1920, 30 fps) animasyon videoları. Görüntüler React + SVG (Remotion), ses ElevenLabs.
Yöntem: `Claude_Animasyon_Sistemi.md` rehberi.

## Kurulum

```bash
npm install
```

## Ses

```bash
export ELEVENLABS_API_KEY=...   # koda ya da sohbete yazma
python3 ses.py public/ilk-video SES_ID
```

Not: Repodaki `public/ilk-video/ses.mp3` (sessiz) ve `kelimeler.json` (eşit aralıklı zamanlar) yalnızca
iskeletin render alınabilmesi için konmuş **yer tutuculardır**. `ses.py` çalışınca ikisinin de üstüne yazılır.

## Önizleme ve render

```bash
npm run studio
npm run render        # cikti/ilk-video.mp4
```

## Kontrol panosu

```bash
ffmpeg -i cikti/ilk-video.mp4 -vf "fps=48/SURE,scale=240:-2,tile=8x6" -frames:v 1 pano.jpg
```
