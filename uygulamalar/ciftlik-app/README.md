# Toprak Ağası (Android / iOS)

`../ciftlik` klasöründeki tarayıcı oyununu telefonda tam ekran açan Expo uygulaması. Oyun internetsiz çalışır, kayıt telefonda kalır. Android'de geri tuşu açık pencereyi kapatır ya da bir önceki ekrana döner; ana ekranda uygulamadan çıkar.

## Oyunu güncelleme

Oyunda değişiklik yaptıktan sonra paketi yenile:

```bash
npm run paketle
```

Bu komut `index.html`, `iller.js` ve `ilceler.js` dosyalarını tek HTML'de birleştirip `src/oyun.ts` dosyasına yazar.

## APK alma

Bilgisayarda Android Studio gerekmez, ücretsiz bir Expo hesabı yeter:

```bash
npm install
npx eas-cli@latest login
npx eas-cli@latest build -p android --profile preview
```

Derleme bitince verilen bağlantıdan APK'yı indirip telefona kur. Play Store için `--profile production` ile `.aab` dosyası alınır.

Android SDK kurulu bir bilgisayarda yerel derleme:

```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```

iPhone için `npx eas-cli@latest build -p ios --profile preview` (Apple Developer hesabı gerekir).

## Kontroller

```bash
npm run typecheck
npx expo lint
```
