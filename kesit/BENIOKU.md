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
2. Komik an adayları iki yoldan bulunur:
   - **Gülme algılama** (YAMNet ses modeli): kahkaha, kıkırdama. Şaka gülmeden önce geldiği için aday, gülmeden 45 sn önce başlar.
   - **Ses yükselmesi**: bağırma, tepki.
3. Yalnız adaylar Whisper ile yazıya dökülür.
4. Claude metinleri ve gülme anlarını okuyup en komik anları seçer (`--mod komik`, varsayılan), başlık yazar. Komik bulmadığını seçmez. Claude yoksa ya da limit dolmuşsa gülme ve ses puanıyla seçer (`--llm-yok`). Komik dışı anlar için `--mod genel`.
5. Seçilen kesitler 1080p indirilir, dikeye çevrilir:
   - yüz büyükse (sohbet yayını) yüze ortalı kırpma,
   - kamera köşedeyse üstte kamera, altta oyun,
   - yüz yoksa bulanık arka planlı tam görüntü.
6. Kelime kelime yanan altyazı (kesitin kendi sesinden, senkronlu), ilk 3 sn kanca başlığı ve gülme anında kısa yakınlaşma eklenir (`--kanca-yok`, `--zum-yok` ile kapatılır).

Gülme algılama kurulamazsa (ör. `ai-edge-litert` o sistemde yoksa) araç uyarı verip yalnız ses düzeyiyle devam eder. Oyun sesi yüksek yayınlarda gülme sinyali zayıf kalabilir; Claude seçimi bunu telafi eder.

## Ek seçenekler
- Küfürler altyazıda otomatik maskelenir (`S*****`); kapatmak için `--sansursuz`. `--bip` küfürlerin üstüne bip sesi koyar.
- `--derleme`: kesitleri ayrıca tek videoda birleştirir (`derleme.mp4`).
- Kanal verildiğinde son yayın hâlâ sürüyorsa biten son yayına geçilir.

## Günlük tarama
`kanallar.ornek.txt` dosyasını `kanallar.txt` olarak kopyala, kanalları yaz, sonra:
```
python3 takip.py
```
Her kanalın biten son yayınını işler (derleme dahil), daha önce işlediğini atlar, bitince ara dosyaları siler.
Her gün kendiliğinden çalışsın:
- Linux/Mac (`crontab -e`): `0 10 * * * cd /yol/kesit && python3 takip.py >> takip.log 2>&1`
- Windows: Görev Zamanlayıcı'da günlük görev, program `python`, bağımsız değişken `takip.py`, başlangıç klasörü `kesit`.

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
