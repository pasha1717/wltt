# NOVA: sesli kişisel asistan (React Native / Expo)

Türkçe konuşan, sesli dinleyip sesli cevap veren asistan. Cevaplar Claude'dan gelir.

## Neler yapıyor
- **Sesle ya da yazıyla sohbet.** Cevap kelime kelime ekrana gelir, sonra telefonun Türkçe sesiyle okunur.
- **Eller serbest mod (👂).** Uygulama açıkken sürekli dinler; "Nova, ..." diye başlayan cümleyi komut olarak alır. Sadece "Nova" dersen telefon titrer ve sıradaki cümleni bekler. Ekranı açık tutar, pil tüketir.
- **Zamanlayıcı ve hatırlatıcı.** "10 dakika sonra haber ver", "yarın 9'da ilacımı hatırlat". Bildirimle çalıştığı için uygulama kapalıyken de gelir. "Kurulu hatırlatmalarım ne?", "onu iptal et" de anlar.
- **Hava durumu.** Bulunduğun yer ya da söylediğin şehir için şu an ve 3 gün (Open-Meteo, anahtarsız).
- **Arama.** "Annemi ara": rehberde bulur, arama ekranını açar. Birden çok eşleşme varsa sorar.
- **Fener.** "Feneri aç / kapat".
- **Hafıza.** Adını, tercihlerini hatırlar; sohbet de uygulama kapanınca kaybolmaz. Ayarlardan hatırladıklarını görüp silebilirsin.

## Dosyalar
- `App.tsx`: ekran, dinleme (tek seferlik ve eller serbest), sesli okuma
- `src/claude.ts`: Claude ile akan cevap ve araç döngüsü
- `src/araclar.ts`: Claude'un çağırdığı araçlar (zamanlayıcı, hava, arama, fener, hafıza)
- `src/bildirim.ts`: yerel bildirimler
- `src/hafiza.ts`: cihazda kalıcı veri
- `src/komutlar.ts`: internetsiz cevaplanan saat, tarih, zamanlayıcı
- `src/Cekirdek.tsx`: animasyonlu çekirdek

## Telefona kurma

Yerel modüller kullandığı için **Expo Go'da çalışmaz**, kendi derlemen gerekir.

**Android APK (bilgisayarda Android Studio gerekmez):**
```bash
npm install
npx eas-cli@latest login        # ücretsiz Expo hesabı
npx eas-cli@latest build -p android --profile preview
```
Bitince verilen bağlantıdan APK'yı telefona indirip kur.

**Yerelde (Android SDK kurulu bilgisayarda):**
```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release.apk
```

**iPhone:** `npx eas-cli@latest build -p ios --profile preview` (Apple Developer hesabı gerekir).

## İlk açılış
Sağ üstteki ⚙ simgesine dokun, Anthropic API anahtarını gir (console.anthropic.com). Anahtar yalnızca telefonda şifreli saklanır.

## Bilinen sınırlar
- Eller serbest mod yalnız uygulama ekranda açıkken çalışır; telefon kilitliyken dinlemez.
- Android'de zamanlayıcı bildirimleri pil tasarrufu yüzünden birkaç saniye gecikebilir.
- Sesli okuma telefondaki Türkçe sesi kullanır.

## Kontroller
```bash
npm run typecheck
npx expo lint
```
