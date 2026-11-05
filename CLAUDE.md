# Proje: "Ne olurdu?" Reels videoları

Dikey (1080x1920, 30 fps, yaklaşık 60 sn) animasyon videoları. Görüntü React + SVG (Remotion), ses ElevenLabs.
Ayrıntılı yöntem: `Claude_Animasyon_Sistemi.md`.

## Kullanıcının kalıcı tercihleri
- Onay isteme: metni, sahne planını ve videoyu doğrudan üret, bitince teslim et.
- Kısa rapor ver, az token harca. Her adımı mesajla anlatma.
- Toplu üretimde videoları tek bir zip dosyasında teslim et (`cikti/` içinde). Zip'e o partinin Instagram açıklamalarını da `aciklamalar.md` olarak ekle (yalnız o partideki videolar).
- Ses: ElevenLabs "Deniz" (`KAGDtM2gzDrjWlUp2KNe`), model `eleven_v4`.
- Seslendirmede satır aralarına sessizlik ekle: `python3 ses.py public/<ad> <ses_id>` sonra `python3 sessizlik.py public/<ad>`.
- Format: Reels (dikey). Hedef 60 sn civarı; biraz aşması sorun değil. Uzun video yok.
- Sesi hızlandırma (atempo vb. kullanma). Süreyi kısaltmak için metni kısalt.

## Becerileri (skills) bu işte nasıl kullan
Video ve açıklama üretirken aşağıdaki becerileri kullan:
- **idea-refine**: Yeni konu seçerken. Aday konuları çeşitlendir, sonra en güçlü "ne olurdu?" sorusunu ve kancayı seç. Kullanıcıya soru sorma, kendin karar ver.
- **doubt-driven-development**: Metindeki her rakam, tarih ve iddia için. Yaygın yanlışları ve abartıları ayıkla; doğrulayamadığını yumuşat ("yaklaşık", "bir çalışmaya göre") ya da çıkar.
- **source-driven-development**: İddiaları güvenilir kaynakla (NASA, NOAA, hakemli makale vb.) doğrula; kaynakları raporda kısaca listele.
- **humanizer**: Video metnini (`public/<ad>/metin.txt`) seslendirmeden önce ve Instagram açıklamalarını (`aciklamalar.md`) yazarken. Yapay zekâ kokan kalıpları temizle, anlamı değiştirme. Türkçe doğal konuşma dili kullan.
- **code-simplification**: Ortak kalıp (`src/ortak/Kalip.tsx`) ya da video kodları büyüyüp karmaşıklaşınca.

## Üretim akışı (kısa)
1. Konu ve doğrulama: `konu-arastirmaci` alt ajanını çalıştır (idea-refine + doubt-driven + source-driven onun içinde). Sonucundaki DOĞRULANDI/YUMUŞAT iddiaları kullan, ÇIKAR olanları kullanma. Metin 13 satır: kanca, soru, yaygın tahmin, dönüş, açıklama, ders (10-11), yorum çağrısı (12).
2. Metni humanizer ile düzelt, `public/<ad>/metin.txt` olarak yaz.
3. Ses + sessizlik.
4. Görüntü: `src/<ad>/ayar.ts` (ortak kalıp) ya da özel `Video.tsx`.
5. Render: `npx remotion render src/<ad>/index.ts Video cikti/<ad>.mp4 --concurrency=2`.
6. Açıklama: `aciklamalar.md` dosyasına humanizer'dan geçmiş Instagram açıklaması ekle.
7. Commit ve push.
