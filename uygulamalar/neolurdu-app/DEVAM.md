# "Ne Olurdu?" Android uygulaması — devir notu (yeni oturum için tek prompt)

Aşağıdaki metni yeni bir Claude Code oturumuna olduğu gibi yapıştır.

---

pasha1717/wltt reposunda, `ccr-8bb13781-bxrely` dalında `uygulamalar/neolurdu-app/` klasöründe "Ne Olurdu?" adlı bir Expo (SDK 58, React Native 0.88, TypeScript) bilim bilgi yarışması uygulaması var. Google Play'de yayınlanacak. Benimle Türkçe konuş, kısa raporla, onay isteme; ama paralel ajan (subagent) başlatmadan önce mutlaka bana sor (kullanım kotamı çok tüketiyor).

## Uygulama ne yapıyor
- 3.379 çoktan seçmeli soru, 6 kategori (Uzay, Doğa, Vücut, İcatlar, Dünya, Bilim). Sorular: `src/sorular.ts` + `src/sorular-ek1..3.ts` (Instagram videolarımın doğrulanmış metinlerinden) + `src/paketler/p01..p12.ts` (ajanlarla yazıldı). Denetim: `npx tsx scripts/sorulari-denetle.ts`.
- Günlük 5 soru (herkese aynı), seri, serbest oyun, koleksiyon, akşam 20.00 bildirimi.
- Kredi + "Yarı yarıya" jokeri; kredi = kazanilan − harcanan (iki sayaç, `src/oyun.ts`).
- AdMob reklamları (banner, geçiş, ödüllü) + UMP onay formu (`src/reklam.ts`, kimlikler `src/yapilandirma.ts` ve `app.json`).
- Google Play Billing (`expo-iap`, `src/magaza.ts`): ürünler `kredi_20`, `kredi_100` (tüketilebilir), `reklamsiz` (tek seferlik).
- Google Play Games bulut kaydı: kendi yerel modülüm `modules/play-games` (play-services-games-v2), JS tarafı `src/bulut.ts`, birleştirme `birlestir()` `src/oyun.ts`. Proje kimliği `540005577113` (`app.json` → `./plugins/withPlayGames`). Çalıştığı telefonda doğrulandı.
- Sonucu görsel olarak paylaşma (`src/Paylasim.tsx`, view-shot + expo-sharing).
- Hata yakalama: `src/Hata.tsx` (JS) + `plugins/withCokmeKaydi.js` (yerel çökmeyi ayrı süreçte ekrana basar).

## Önemli düzeltmeler (geri alma)
- Açılış çökmesi: reklam SDK'sı WorkManager 2.7.0 getiriyordu, R8 `WorkDatabase_Impl`'i siliyordu → `plugins/withWorkManager.js` WorkManager 2.11.2'yi zorlar ve keep kuralı ekler.
- `plugins/withYayinImzasi.js`: release'i `~/.gradle/gradle.properties` içindeki `NEOLURDU_UPLOAD_*` değişkenleriyle imzalar.

## Derleme (bu ortamda)
- `android/` CNG ile üretilir, elle düzenlenmez: `npx expo prebuild --platform android --clean --no-install`, sonra `echo "sdk.dir=$ANDROID_HOME" > android/local.properties`.
- `cd android && ./gradlew bundleRelease assembleRelease -PreactNativeArchitectures=arm64-v8a,armeabi-v7a,x86_64 --no-daemon --no-parallel` (arka planda çalıştır, ~5-25 dk).
- Bu bulut ortamında Maven Central 429 veriyor: `~/.gradle/init.d/ayna.gradle` ile Google'ın Central aynası (`https://maven-central.storage-download.googleapis.com/maven2`) listelerin başına konmalı ve `pluginManagement`'a `gradlePluginPortal()` açıkça eklenmeli.
- Android SDK yoksa: cmdline-tools kur, `platforms;android-37.0`, `build-tools;37.0.0`, `ndk;27.1.12297006`, `cmake;3.22.1` (lisansları kabul ettim).
- Yükleme anahtarı repoda YOK. Bende `neolurdu-upload.jks` + `SIFRE.txt` olarak duruyor; derlemeden önce senden güvenli biçimde (sohbete şifre yazmadan) ortama eklemeyi isteyeceğim. Yükleme anahtarı SHA-1: `E0:1B:08:09:7C:C5:50:7C:4E:91:87:61:4D:46:7E:89:C1:3C:C8:23`, SHA-256: `DA:44:13:35:FA:A0:E4:33:9F:19:CF:59:A2:6C:22:14:4A:72:22:4D:D0:B8:88:D5:62:2C:1B:E4:B9:DC:7A:23`.
- Her yeni AAB'de `app.json` → `android.versionCode` bir artmalı. Son: **5** (`cikti/NeOlurdu-1.0.0-v5.aab`).

## Play Console durumu
- Paket: `com.neolurdu.oyun`, mağaza adı "Ne Olurdu? Bilim Yarışması" (metinler `magaza/listeleme.md`, rehber `magaza/GOOGLE_PLAY.md`).
- Kapalı test (Alpha) kanalında sürüm kodu 3 vardı; v5 yüklenecek. Telefondaki elle kurulan APK kaldırılıp Play'den kurulmalı (yoksa satın alma fiyatları boş görünür).
- Tek seferlik ürünler oluşturuldu ve etkin; lisans testçisi eklendi.
- Play Games Services: Android kimlik bilgisi (yükleme anahtarı SHA-1) eklendi, test kullanıcısı eklendi, giriş çalışıyor.

## Kalan işler
1. v5'i kapalı teste yükle, telefonda Play'den temiz kurulumla satın alma fiyatlarının göründüğünü doğrula.
2. Play Games için ikinci Android kimlik bilgisi: Play uygulama imzalama anahtarının SHA-1'i (Google Play ile korunanlar > Play uygulama imzalama yönetimi).
3. Google Cloud (proje `fluted-karma-216108`) OAuth izin ekranını "In production" yap; Play Console'da Play Games yapılandırmasını yayınla.
4. GitHub Pages: Settings > Pages > dal `ccr-8bb13781-bxrely`, klasör `/docs` → gizlilik sayfası `https://pasha1717.github.io/wltt/ne-olurdu/gizlilik.html` (iletişim: hello@toolpano.com). Açıldığını kontrol et, Play Console'a gir.
5. 12+ test kullanıcısıyla 14 gün kapalı test (Google Grubu + Instagram duyurusu), sonra üretim erişimine başvur.
6. İsteğe bağlı: AdMob'da telefonumu test cihazı olarak eklemek; ileride satın alma imza doğrulaması.
