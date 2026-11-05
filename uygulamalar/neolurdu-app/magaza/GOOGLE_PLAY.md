# Ne Olurdu? — Google Play yayın rehberi

## 0. Yayından önce kodda değişecek 3 şey
| Dosya | Ne yapılacak |
|---|---|
| `app.json` → `react-native-google-mobile-ads.androidAppId` | AdMob'daki **uygulama kimliğin** (`ca-app-pub-…~…`). Şu an Google'ın test kimliği var. |
| `src/yapilandirma.ts` → `ADMOB` | AdMob'da açtığın 3 reklam biriminin kimliği (banner, geçiş, ödüllü). Boş kalırsa **test reklamı** gösterilir, gelir gelmez. |
| `src/yapilandirma.ts` → `GIZLILIK_URL` | `magaza/gizlilik.html` sayfasını yayınladığın adres. |
| `magaza/gizlilik.html` | `[İLETİŞİM E-POSTASI]` yerine e-postanı yaz. |

Her yeni sürümde `app.json` içindeki `android.versionCode` bir artırılmalı (1 → 2 → 3…), `version` da istenirse güncellenmeli.

## 1. İmzalama
- Yükleme anahtarı: `neolurdu-upload.jks` + `SIFRE.txt` (sana ayrıca teslim edildi, **repoda yok**).
- Play Console'da **Play Uygulama İmzalama** açık kalsın (varsayılan). Google uygulamayı kendi anahtarıyla imzalar; senin anahtarın yalnızca yükleme içindir.
- Anahtarı kaybedersen Play Console > Uygulama bütünlüğü'nden yükleme anahtarı sıfırlama istenebilir.
- Kendi bilgisayarında derlemek için `~/.gradle/gradle.properties` dosyasına:
  ```
  NEOLURDU_UPLOAD_STORE_FILE=/tam/yol/neolurdu-upload.jks
  NEOLURDU_UPLOAD_STORE_PASSWORD=...
  NEOLURDU_UPLOAD_KEY_ALIAS=upload
  NEOLURDU_UPLOAD_KEY_PASSWORD=...
  ```
  sonra `npx expo prebuild -p android && cd android && ./gradlew bundleRelease` → `android/app/build/outputs/bundle/release/app-release.aab`

## 2. Uygulama içi ürünler (Play Console > Para kazanma > Ürünler > Uygulama içi ürünler)
Kimlikler **aynen** böyle olmalı:
| Ürün kimliği | Tür | Önerilen ad | Fiyat önerisi |
|---|---|---|---|
| `kredi_20` | Tüketilebilir | 20 Kredi | ₺29,99 |
| `kredi_100` | Tüketilebilir | 100 Kredi | ₺99,99 |
| `reklamsiz` | Tek seferlik (tüketilemez) | Reklamları Kaldır | ₺79,99 |

Ürünler ancak uygulamanın ilk sürümü bir test kanalına (Dahili test yeterli) yüklendikten sonra oluşturulabilir. Satın almayı test etmek için Play Console > Lisans testi'ne kendi Gmail adresini ekle.

## 3. AdMob kurulumu
1. admob.google.com → Uygulama ekle → Android → (Play'de yayınlandıktan sonra mağaza bağlantısı kurulur).
2. Reklam birimleri: **Banner (uyarlanabilir)**, **Geçiş**, **Ödüllü** (ödül: 3, birim: kredi).
3. Gizlilik ve mesajlar > **GDPR** mesajı oluştur ve yayınla (uygulama bu formu otomatik gösterir). İstersen ABD eyalet mesajı da.
4. `app-ads.txt`: bir web siten varsa AdMob'un verdiği satırı `siteadresin.com/app-ads.txt` olarak yayınla ve Play mağaza kaydında bu siteyi "Web sitesi" olarak gir.

## 4. Mağaza kaydı
- Metinler: `magaza/listeleme.md`
- Simge 512×512: `magaza/gorseller/ikon-512.png`
- Öne çıkan görsel 1024×500: `magaza/gorseller/one-cikan-1024x500.png`
- Telefon ekran görüntüleri: en az 2 adet (uygulamayı telefonda açıp al; ana ekran, soru, cevap, sonuç, mağaza).

## 5. Uygulama içeriği beyanları (Play Console > Politika > Uygulama içeriği)
| Bölüm | Cevap |
|---|---|
| Gizlilik politikası | `GIZLILIK_URL` adresi |
| Reklamlar | **Evet, reklam içeriyor** |
| Uygulama erişimi | Tüm işlevler kısıtlamasız (giriş yok) |
| İçerik derecelendirmesi | Anket: "Bilgi/Eğitim – Trivia/Quiz". Şiddet, cinsellik, kumar yok; **dijital ürün satın alımı var**. Beklenen sonuç: PEGI 3 / Herkes. |
| Hedef kitle | **13 yaş ve üzeri** (13-15, 16-17, 18+). 13 altı seçilirse Aileler politikası devreye girer; reklam ayarları değişmeli. |
| Haber uygulaması | Hayır |
| Devlet uygulaması | Hayır |
| Finansal özellikler | Hayır |
| Sağlık | Hayır |
| Reklam kimliği | **Evet**, reklam ve analiz için kullanılıyor (AdMob) |

### Veri güvenliği formu
| Veri türü | Toplanıyor mu | Paylaşılıyor mu | Amaç | Not |
|---|---|---|---|---|
| Cihaz veya diğer kimlikler (reklam kimliği) | Evet | Evet (Google AdMob) | Reklam/pazarlama, Analiz, Dolandırıcılık önleme | İsteğe bağlı değil; kullanıcı OS'tan sıfırlayabilir |
| Uygulama etkileşimleri | Evet | Evet (AdMob) | Reklam, Analiz | |
| Kilitlenme günlükleri / Tanılama | Evet | Evet (AdMob) | Analiz | |
| Yaklaşık konum | Evet | Evet (AdMob, IP'den) | Reklam | |
| Satın alma geçmişi | Evet | Hayır | Uygulama işlevi | Google Play Faturalandırma |
- Veriler aktarım sırasında şifreleniyor mu? **Evet** (Google SDK'ları HTTPS kullanır).
- Kullanıcı veri silme isteyebilir mi? Uygulamada hesap yok; cihazdaki veriler uygulama silinince silinir.

## 6. Yayın sırası
1. Play Console'da uygulama oluştur (ad: Ne Olurdu?, dil: Türkçe, oyun, ücretsiz).
2. **Dahili test** kanalına `app-release.aab` yükle → ürünleri oluştur → kendin test et.
3. Yeni kişisel geliştirici hesapları için: **Kapalı test**, en az 12 test kullanıcısıyla 14 gün (Google kuralı). Sonra üretime başvur.
4. Üretim sürümü yayına alınınca AdMob'da uygulamayı mağaza kaydına bağla.

## 7. Bu derlemede kontrol edilenler
- Paket adı: `com.neolurdu.oyun` (ilk yüklemeden sonra **değiştirilemez**; istersen şimdi değiştir).
- Hedef SDK 36, AAB, yükleme anahtarıyla imzalı.
- Gereksiz izinler kaldırıldı (pencere üstü çizim, depolama).
- Reklam içerik sınırı: T (Genç).
