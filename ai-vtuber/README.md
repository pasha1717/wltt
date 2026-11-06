# Neşe: hazır replikli yapay zekâ yayıncısı (TikTok)

Neşe, oda sahnesinde duran bir Live2D karakter (Haru örnek modeli). TikTok canlı yayınında sohbeti, beğenileri ve hediyeleri okur, olaya uygun hazır bir repliği sesiyle, yüz ifadesiyle, hareketiyle ve efektiyle oynatır.

- **Konuşmalar önceden hazır.** 169 kısa replik ve 20 konu var. Yayında yapay zekâ metin üretmez, yani canlı API maliyeti yoktur.
- **Hediyeler şaka başlatır.** Elmas değerine göre üç kademe var:

| Kademe | Elmas | Olan |
|---|---|---|
| Küçük | 1-9 | Kalpler, kısa teşekkür |
| Orta | 10-99 | Kafasına pasta düşer, üstüne su dökülür ya da korkup zıplar |
| Büyük | 100+ | Yere düşüp kalkar ya da konfeti ve pasta yağar; ardından ayrıca teşekkür eder |

- **Beğeni hedefleri** (5/10/20/30, sonra döngü) sevinç hareketi ve yıldız efekti tetikler.
- **Sohbet:** Anahtar kelimelere göre cevap verir (selam, nasılsın, yapay zekâ mısın…). Yasak konularda (siyaset, din, +18, kişisel veri, marka) şakayla konuyu değiştirir.
- **Sessizlik:** 40 sn boyunca bir şey olmazsa sıradaki konuyu anlatır.
- Sesler önceden kaydedildiği için izleyicinin adı **sesle söylenmez**; ad balonda ve overlay'de yazar.

## Hızlı başlangıç (Windows)

1. [Node.js 20+](https://nodejs.org/en/download) ve [OBS Studio](https://obsproject.com/download) kur.
2. Bu klasörde PowerShell aç:
   ```powershell
   .\basla.ps1
   ```
   İlk çalıştırmada `npm install` yapılır, Live2D dosyaları resmî kaynaklardan indirilir ve `.env` oluşturulur. Ardından panel tarayıcıda açılır.
3. `.env` dosyasını Not Defteri ile aç ve değerleri **yalnız orada** doldur (aşağıdaki "Anahtarlar" bölümüne bak).
4. Sesleri bir kez üret: aşağıdaki "Ses üretimi: VoxCPM2" bölümüne bak (yerel ve ücretsiz). Ses üretilmeden de sistem çalışır; o durumda yalnız balon gösterilir.
5. OBS'de **Araçlar > WebSocket Sunucu Ayarları** bölümünden sunucuyu aç ve parolayı `.env` içine `OBS_SIFRE` olarak yaz. Sonra: `.\basla.ps1 -ObsKur`. Tuvali de 1080x1920 yapmak için, yayın kapalıyken `node src/obs/kurulum.js --cozunurluk`.
6. TikTok'a bağlanmak için `.env` içinde `TEST_MODU=0` ve `TIKTOK_KULLANICI=kullaniciadin` yaz, `.\durdur.ps1` ve `.\basla.ps1` ile yeniden başlat.
7. Durdurmak için `.\durdur.ps1`, durum için `.\saglik.ps1`.

Linux/macOS'ta `./basla.sh` ve `./durdur.sh` kullanılır.

**Telefonda (Android):** Tüm sistem tek bir uygulama olarak da çalışır; yayın TikTok'un ekran paylaşımıyla yapılır. Kurulum ve kullanım: [`mobil/README.md`](mobil/README.md).

## Sayfalar (yalnız 127.0.0.1)

| Adres | Ne |
|---|---|
| `http://127.0.0.1:3900/sahne` | 1080x1920 oda, Haru, efektler, konuşma balonu, ses. OBS'de "Control audio via OBS" açık. |
| `http://127.0.0.1:3900/overlay` | Beğeni çubuğu, son hediyeler, "yapay zekâ karakteri" yazısı, Live2D telif ibaresi |
| `http://127.0.0.1:3900/panel` | Operatör paneli: açılış/kapanış, duraklat, sustur, sahte sohbet/hediye/beğeni, şakaları elle deneme, olay akışı |

Terminalden de deneyebilirsin: `npm run basla`, ardından `ali: selam`, `/hediye 100`, `/begeni 5`, `/saka pasta`, `/konu`, `/cikis`.

## Anahtarlar ve nereden alınır

Değerleri sohbete ya da koda yazma. Yalnız `.env` içine yaz; `.env` git'e girmez. `npm run anahtarlar` komutu değerleri göstermeden yalnız "dolu/boş" yazar.

| Değişken | Nereden |
|---|---|
| `ELEVENLABS_API_KEY`, `ELEVEN_SES_ID` | Yalnız VoxCPM2 yerine ElevenLabs kullanırsan gerekir: https://elevenlabs.io/app/settings/api-keys ve https://elevenlabs.io/app/voice-library |
| `OBS_SIFRE` | OBS > Araçlar > WebSocket Sunucu Ayarları > "Bağlantı bilgilerini göster" |
| `TIKTOK_KULLANICI` | TikTok kullanıcı adın (@ olmadan). Parola ya da yazma yetkisi istenmez, yalnız okunur. |

## İçeriği düzenleme

- `icerik/replikler.json`: Gruplar halinde replikler. Alanlar: `s` metin (en fazla 80 karakter; `[laughs]` gibi v3 etiketleri balonda görünmez), `d` duygu (neseli, heyecanli, saskin, korkmus, utangac, sakin, uzgun), `h` hareket (bekle, sevinc, saskin, utanma, korku, elsalla, zipla, dusunme).
- `icerik/konular.json`: Sessizlikte anlatılan konular. Bilgi içerenlerin `kaynak` alanı var.
- `icerik/sohbet-kurallari.json`: Anahtar kelime → replik grubu. Yukarıdaki kural önce kazanır. 5+ harfli kelime ek alabilir ("takip" → "takipteyim"); `=` ile başlayan kelime yalnız tam kelime olarak eşleşir.
- `icerik/aktiviteler.json`: Hediye kademeleri, şakalar, öncelik, bekleme süreleri.
- Değişiklikten sonra: `npm run denetle` (uzunluk, adlar, eksik gruplar, küfür kontrolü), ardından `npm run ses-uret` (yalnız değişen ya da yeni replikler üretilir).

Duygu → Haru ifadesi eşlemesi ekran görüntüleriyle yapıldı: neşeli F01, sakin F02, şaşkın F03, üzgün F04, utangaç F05, heyecanlı F07, korkmuş F08.

## Ses üretimi: VoxCPM2 (yerel, ücretsiz)

Sesler [voxcpm2-turkce-ses-tasarimi](https://github.com/alexturkey/voxcpm2-turkce-ses-tasarimi) ile, senin bilgisayarında ve ücretsiz üretilir (Apache-2.0, ticari kullanım serbest). Ses bir İngilizce tariften **tasarlanır**, kimseyi taklit etmez. NVIDIA ekran kartı (en az 4 GB, sürücü 570+) ve 64-bit Python 3.10-3.13 gerekir. Kurulum yaklaşık 10 dk sürer ve 3,7 GB indirir.

1. **VoxCPM2'yi kur.** Kendi README'sindeki "Hızlı başlangıç (Windows)" adımlarını izle. Klasör yolu yalnız İngilizce harf içermeli (ör. `C:\vox\voxcpm2-turkce-ses-tasarimi`). Kurulum betiğini çalıştırmadan önce oku.
2. **Neşe'nin sesini tasarla.** VoxCPM2 klasöründe şunu çalıştır:
   ```powershell
   .venv\Scripts\python.exe -m ses_tasarim.tasarla --ad nese --cesit 4 --metin @<proje>\araclar\voxcpm-tasarim.txt --tarif "A cheerful young Turkish woman in her early twenties with a bright, warm and slightly playful voice. Energetic and friendly like a lively livestream host, clear articulation, natural Turkish accent, medium pace. Clean studio recording, no background noise."
   ```
   Dört çeşidi dinle (web arayüzü de olur: `baslat.bat` → *Ses tasarla*) ve en neşelisini seç, ör. `nese/2`.
3. **Önce 3 repliği dene, sonra hepsini üret** (ai-vtuber klasöründe):
   ```powershell
   .\araclar\voxcpm-uret.ps1 -VoxKlasor C:\vox\voxcpm2-turkce-ses-tasarimi -Ses nese/2 -Dene 3
   .\araclar\voxcpm-uret.ps1 -VoxKlasor C:\vox\voxcpm2-turkce-ses-tasarimi -Ses nese/2
   ```
   Betik eksik replikleri tek bir metin dosyasına yazar ve VoxCPM2'ye tek seferde okutur; model yalnız bir kez yüklenir. Çıkan `okuma.wav` dosyasını `ozet.json` içindeki satır zamanlarına göre `sesler/<id>.wav` dosyalarına böler. "Hız kapısı" uyarısı veren satırları dinleyip kontrol et. Yaklaşık 7.200 karakter, 8-10 dk ses eder. GTX 1050 Ti'de bu yaklaşık 20 dk sürer, yeni kartlarda daha kısa.
4. Repliği sonradan değiştirirsen ya da yeni replik eklersen aynı komut yalnız sesi olmayanları üretir.

Notlar:
- VoxCPM2 Türkçede rakam, tırnak ve kesme işaretini okumaz. Köprü kesme işaretini sesten atar ("Venüs'te" → "Venüste"), ekranda ise korur. `npm test` tüm repliklerin bu kurala uyduğunu denetler.
- VoxCPM2'de duygu etiketi yoktur. Neşe'nin neşesi sesin tarifinden gelir; şaşkınlık ve korku yüz ifadesiyle, hareketle ve efektle verilir.
- Seslerin yapay olduğunu belirt (VoxCPM2'nin sorumlu kullanım kuralı). Overlay ve TikTok yapay zekâ etiketi bunu karşılar.

**Alternatif: ElevenLabs (ücretli, duygu etiketli).** `.env` içinde `ELEVENLABS_API_KEY` ve `ELEVEN_SES_ID` doldurulur. `npm run ses-uret -- --kuru` yalnız sayar. `npm run ses-uret -- --dene 3` üç repliği üretir, `npm run ses-uret` hepsini üretir. Çıktı `sesler/<id>.mp3` olur; mp3 varsa wav'dan önce o kullanılır.

## Testler

- `npm test`: 22 birim testi (filtre, seçici, kuyruk, sohbet eşleştirme, hediye kademeleri, beğeni döngüsü, sessizlik, TikTok kombo, OBS kurulumu sahte sunucuyla, VoxCPM2 metin kuralları ve WAV bölme).
- `node araclar/uctan-uca.cjs`: Çalışan sunucuya karşı tarayıcıda uçtan uca test. Playwright gerektirir (`npm i -D playwright`).

Bulut ortamında yapılan son uçtan uca test (sanal, GPU'suz tarayıcı; ses yerine geçici test tonu):

| Adım | Süre (ms) | Sonuç |
|---|---:|---|
| Sahne + Haru yüklendi | 908 | geçti |
| Sohbet → kural eşleşmesi | 7 | geçti |
| Selam → balon görünür | 49 | geçti |
| Selam → ilk ses (mp3 / VoxCPM biçiminde wav) | 1166 / 188 | geçti |
| Ağız sesle hareket ediyor (en yüksek 0,46) | - | geçti |
| Küfür filtresi (ad + mesaj) | 649 | geçti |
| 10💎 hediye → pasta şakası + teşekkür | 4361* | geçti |
| 299💎 hediye → düşme + 2. replik | 4339* | geçti |
| 5 beğeni → kutlama + çubuk 5/10 | 3178* | geçti |
| Sessizlik (6 sn'ye kısaltıldı) → konu | 8233 | geçti |

\* Yaklaşık 3 sn'si, olaylar arasındaki bilinçli bekleme (`olaylar_arasi_ms`).

## Maliyet

- **VoxCPM2 ile: 0 $.** Ses senin ekran kartında üretilir; yalnız elektrik harcanır. Canlı yapay zekâ çağrısı da yoktur.
- **ElevenLabs ile (alternatif):** Fiyatlar 06.11.2026'da https://elevenlabs.io/pricing sayfasından alındı. Tüm replikler yaklaşık 9.100 karakter, tek seferlik. Free paket ticari lisans içermez. Para kazanılan yayın için Starter paketi (6 $/ay, ilk ay 1 $, 30 bin kredi) bir ay yeter.
- TikTok okuma, OBS ve Live2D örnek model ücretsiz.

## Lisanslar ve kurallar

- **Live2D Haru**: [Free Material License](https://www.live2d.com/eula/live2d-free-material-license-agreement_en.html) ve [örnek model koşulları](https://www.live2d.com/eula/live2d-sample-model-terms_en.html). Ticari kullanımdan önce koşulları oku (belirli bir yıllık gelir sınırının üstündeki kurumlar için kısıt var). Overlay'de sürekli şu yazar: "This content uses sample data owned and copyrighted by Live2D Inc."
- **Cubism Core**: [Live2D Proprietary Software License](https://www.live2d.com/eula/live2d-proprietary-software-license-agreement_en.html). Bu yüzden `vendor/` git'e konmaz; `araclar/live2d-indir.js` resmî kaynaktan indirir.
- **Küfür listesi**: [ooguz/turkce-kufur-karaliste](https://github.com/ooguz/turkce-kufur-karaliste), CC BY-SA 4.0, bkz. `src/filtre/veri/ATIF.md`.
- **tiktok-live-connector**: AGPL-3.0 lisanslı ve **resmî değil**; TikTok'la bağlantısı yok. TikTok tarafı değişince bozulabilir. Sistemi başkalarına ağ üzerinden hizmet olarak sunarsan AGPL kaynak kodunu paylaşma yükümlülüğü getirir. Yalnız okuma yapılır.
- **Yapay zekâ bildirimi**: Neşe açılışta ve sorulunca yapay zekâ olduğunu söyler, overlay'de de sürekli yazar. **TikTok'ta yayın ayarlarında yapay zekâ ile üretilmiş içerik etiketini aç.** Neşe gerçek bir kişi gibi tanıtılmaz.
- **VoxCPM2 araçları**: Apache-2.0 (VoxCPM2 modeli OpenBMB, Apache-2.0). Kurulum ve üretim senin bilgisayarında yapılır; bu depoya yalnız köprü kodu girer.
- obs-websocket-js MIT, pixi.js MIT, pixi-live2d-display MIT.

## Bilinen sınırlar

- Sohbet anahtar kelimeyle eşleşir. Alakasız sorulara cevap gelmez; her mesaja cevap verilmez. Aynı kişiye 30 sn içinde bir kez cevap verilir.
- TikTok bağlantısı bulut ortamında yalnız yayında olmayan gerçek bir hesapla denendi ("yayında değil" cevabı geldi); canlı bir yayından sohbet/hediye akışı henüz denenmedi. OBS orada yok; OBS betiği sahte bir obs-websocket sunucusuyla, TikTok kombo mantığı birim testiyle doğrulandı. İlk gerçek denemeyi kendi bilgisayarında yap.
- TikTok'ta beğeniler çok hızlı gelir. 5/10/20/30 hedefleri sık tetiklenir; kuyruk ve bekleme bunu yumuşatır. Gerekirse `.env` içindeki `BEGENI_HEDEFLERI` değerini büyüt.
- Ses dosyası yoksa (TEST_MODU ya da üretilmemiş ses) yalnız balon gösterilir ve ağız metin süresince yapay olarak oynar.
- Enjeksiyon filtresi gerekmedi, çünkü canlı yapay zekâ çağrısı yok. Mesajlar yalnız ekranda gösterilir, hiçbir zaman seslendirilmez.
