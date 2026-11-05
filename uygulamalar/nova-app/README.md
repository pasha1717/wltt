# NOVA: sesli kişisel asistan (React Native / Expo)

Türkçe konuşan, sesli dinleyip sesli cevap veren asistan. Cevaplar Claude'dan gelir.

- Ses tanıma: `expo-speech-recognition` (tr-TR)
- Sesli okuma: `expo-speech`
- API anahtarı: `expo-secure-store` (telefonda şifreli)
- Cihazda çalışan komutlar: saat, tarih, zamanlayıcı (`src/komutlar.ts`)
- Animasyonlu çekirdek: `react-native-svg` (`src/Cekirdek.tsx`)

## Telefona kurma

Ses tanıma yerel modül kullandığı için **Expo Go'da çalışmaz**, kendi derlemen gerekir.

**Android APK (en kolayı, bilgisayarda Android Studio gerekmez):**
```bash
npm install
npx eas-cli@latest login        # ücretsiz Expo hesabı
npx eas-cli@latest build -p android --profile preview
```
Bitince verilen bağlantıdan APK'yı telefona indirip kur.

**iPhone:** `npx eas-cli@latest build -p ios --profile preview` (Apple Developer hesabı gerekir)
ya da Mac'te `npx expo run:ios --device`.

**Geliştirme:** `npx expo run:android` (Android Studio kurulu bilgisayarda).

## İlk açılış

Sağ üstteki ⚙ simgesine dokun, Anthropic API anahtarını gir (console.anthropic.com). Anahtar yalnızca telefonda saklanır.

## Kontroller
```bash
npm run typecheck
npx expo lint
```
