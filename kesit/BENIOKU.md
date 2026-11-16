# Yayın kesiti -> Shorts

Twitch, Kick ve YouTube yayın kayıtlarından dikey (1080x1920) kısa kesitler üretir.

## Kurulum (kendi bilgisayarında)
```
pip install -r requirements.txt
```
Ayrıca gerekenler: `ffmpeg`, YouTube için `node` ya da `deno`, seçim için Claude Code (`claude` komutu, isteğe bağlı). YouTube "bot değilim" doğrulaması isterse `--cerez chrome` ekle.

## Kullanım
```
python3 kesit.py kick:wtcn                      # kanalın son yayını
python3 kesit.py twitch:kanaladi --adet 8
python3 kesit.py https://www.youtube.com/watch?v=... --dil tr
python3 kesit.py <adres> --aralik 3600-7200     # yalnız 1. ve 2. saat arası
```
Çıktı: `cikti/<yayın>/kesit_01.mp4 ...` ve `aciklamalar.md` (başlık, açıklama, etiketler).

## Nasıl çalışır
1. Yayının yalnız sesi indirilir (tüm videoyu indirmez).
2. Sesin ortama göre yükseldiği yerler (bağırma, gülme, tepki) bulunur; en güçlü 15 aday seçilir.
3. Yalnız adaylar Whisper ile yazıya dökülür.
4. Claude metinleri okuyup en iyi anları seçer, başlık yazar. Claude yoksa ya da limit dolmuşsa ses puanıyla seçer (`--llm-yok`).
5. Seçilen kesitler 1080p indirilir, dikeye çevrilir:
   - yüz büyükse (sohbet yayını) yüze ortalı kırpma,
   - kamera köşedeyse üstte kamera, altta oyun,
   - yüz yoksa bulanık arka planlı tam görüntü.
6. Kelime kelime yanan altyazı gömülür.

Yarıda kalırsa aynı komutu tekrar çalıştır; biten aşamalar atlanır (`is/` klasörü).

## YouTube'a yükleme (isteğe bağlı)
```
python3 yukle.py cikti/<yayın> --gizlilik private
```
Google Cloud'da YouTube Data API v3 açıp "Masaüstü uygulaması" OAuth istemcisi oluştur, `client_secret.json` olarak bu klasöre koy.
Doğrulanmamış API projelerinden yüklenen videolar YouTube'da "özel" kalır; herkese açık için Google denetimi gerekir.
Instagram ve TikTok için dosyaları ve `aciklamalar.md` metnini elle (ya da bir zamanlayıcı araçla) yükle.

## Uyarı
Yayıncının izni olmadan kesit paylaşmak telif bildirimi ve kanal kapanmasına yol açabilir. İzin al, kaynak göster.
