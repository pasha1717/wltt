# Neşe: Android uygulaması

Neşe'nin bütün sistemi (yerel sunucu, hazır replikler, şakalar, Live2D sahne ve TikTok sohbet/beğeni/hediye okuyucu) tek bir uygulamada, telefonda çalışır. Yayını TikTok'un **ekran paylaşımlı canlı yayını** ile yaparsın; Neşe uygulaması o sırada ekranda açık durur.

> Bu APK bulut ortamında derlendi ve parçaları burada, telefondakiyle aynı Node sürümüyle (18) test edildi. Ancak **gerçek bir telefonda henüz denenmedi**. İlk denemeyi test modunda yap (aşağıda).

## Gerekenler

- Android 7.0 veya üstü (ARM işlemcili, yani hemen her telefon). TikTok uygulama sesini yalnız Android 10+ yakalayabilir.
- Yaklaşık 250 MB boş alan (uygulama + ilk açılışta açılan dosyalar).
- TikTok hesabında **canlı yayın ve ekran paylaşımı** açık olmalı. TikTok bunu hesap koşullarına (yaş, takipçi sayısı vb.) bağlayabilir; uygulamada "Canlı" > "Oyun"/"Ekran paylaşımı" seçeneğini görüyorsan uygunsun.

## 1. Kurulum (APK)

1. `Nese-debug.apk` dosyasını telefona at (Drive, kablo ya da Telegram'a kendine gönder).
2. Dosyaya dokun. Android "bilinmeyen kaynaklar" uyarısı verirse o uygulamaya (ör. Dosyalar, Chrome) **bu kaynaktan yüklemeye izin ver**.
3. Play Protect "tanınmayan uygulama" derse **Yine de yükle** de. APK hata ayıklama anahtarıyla imzalı; Play Store'dan gelmediği için bu uyarı normaldir.
4. **Neşe** uygulamasını aç. İlk açılışta gömülü Node dosyaları açıldığı için 10-30 sn sürebilir; sonraki açılışlar hızlıdır.

## 2. Ayarlar

İlk açılışta ayarlar ekranı gelir (sonradan: yayın ekranında **sol üst köşeye 3 kez dokun**).

- **Kullanıcı adın:** TikTok adın, @ olmadan. Yalnız okunur; parola istenmez.
- **Beğeni hedefleri:** Varsayılan 5,10,20,30. TikTok'ta beğeniler çok hızlı gelir, büyük değerler (ör. 50,100,200,300) daha rahat olur.
- **Test modu:** Açıkken TikTok'a bağlanmaz. İlk denemede açık bırak, **Operatör paneli**nden sahte hediye ve beğeni göndererek şakaları dene.
- **Kaydet**'e bas. Üstteki durum satırında "TikTok: bağlı / yayında değil" görünür.

## 3. Sesleri yükle

Sesler telefonda üretilmez; bilgisayarda bir kez üretilir (ana README > "Ses üretimi: VoxCPM2").

1. Bilgisayardaki `ai-vtuber/sesler/` klasörünü telefona kopyala (ör. `İndirilenler/sesler`).
2. Ayarlar > **Sesleri yükle** > klasördeki bütün `.wav` dosyalarını seç (ilk dosyaya basılı tut, sonra "Tümünü seç").
3. "169/169 ses yüklendi" yazmalı. Ses yüklenmezse Neşe yalnız konuşma balonuyla çalışır.

## 4. Yayın

1. Ayarlar > **Yayın ekranını aç** > **Neşe'yi başlat**'a dokun (sesi açar, ekran kapanmaz, çubuklar gizlenir).
2. TikTok'u aç > **Canlı** > ekran paylaşımı (oyun yayını) > yayını başlat. Android "ekranı kaydet/paylaş" iznini sorarsa **Tüm ekran** ve uygulama sesini seç.
3. Görev değiştiriciden **Neşe**'ye geri dön. Yayında artık Neşe'nin ekranı ve sesi görünür.
4. Sohbet, beğeni ve hediyeler gelince Neşe kendisi tepki verir. Sohbeti TikTok'un yüzen penceresinden takip edebilirsin.
5. Bitirince TikTok'tan yayını kapat.

**Yapay zekâ etiketi:** TikTok canlı yayın ayarlarında **yapay zekâ ile üretilmiş içerik** etiketini aç. Neşe'nin ekranında "yapay zekâ karakteri" yazısı ve Live2D telif ibaresi sürekli görünür.

## Sık sorunlar

| Sorun | Ne yapmalı |
|---|---|
| "Neşe'nin sunucusu açılmadı" | Uygulamayı görev listesinden tamamen kapatıp yeniden aç. Sürerse telefonu yeniden başlat. |
| Yayında ses yok | Android 10+ gerekir. TikTok ekran paylaşımında uygulama/mikrofon sesi seçeneğini aç. Neşe'de "Neşe'yi başlat"a dokunduğundan emin ol. |
| Neşe yayın ortasında sustu | Ayarlar > Uygulamalar > Neşe > Pil > **Kısıtlama yok** yap. Bazı markalar (Xiaomi, Huawei, Samsung) arka plandaki uygulamaları kapatır; Neşe'yi ekranda açık tut. |
| TikTok: "yayında değil" | Önce TikTok'ta yayını başlat; Neşe her dakika yeniden dener. Kullanıcı adının doğru olduğunu kontrol et. |
| TikTok: "hata" / "koptu" | Bağlayıcı resmî değil; TikTok tarafı değişince bozulabilir. İnternetini kontrol et, uygulamayı yeniden aç. Sürerse yeni sürüm gerekir. |
| Telefon ısınıyor | Parlaklığı düşür, şarjda yayın yap, kılıfı çıkar. Live2D çizimi ve yayın birlikte işlemciyi yorar. |

## Bilinen sınırlar ve güvenlik

- **Node 18:** Gömülü Node (nodejs-mobile) artık güncellenmiyor. Uygulama, Ekim 2026'da ele geçirilen eMudhra/emSign kök sertifikalarını açılışta güven listesinden çıkarır. Yine de bu bir yamadır; nodejs-mobile güncellenmezse ileride başka sorunlar çıkabilir.
- **Lisanslar:** APK içinde Live2D Cubism Core ve Haru örnek modeli var. Kişisel kullanım ve küçük yayıncılar için uygundur. **Play Store'a ya da başkalarına dağıtmadan önce** Live2D'nin yayın lisansı ve örnek model koşullarına bak. tiktok-live-connector AGPL-3.0'dır; uygulamayı başkalarına dağıtırsan kaynak kodunu da paylaşman gerekir.
- APK hata ayıklama imzalıdır; Play Store'a yüklenemez. Yeni sürüm aynı imzayla derlendiği sürece üstüne kurulur, ayarlar ve sesler korunur.

## Geliştirici: APK'yı yeniden derlemek

Gereken: Node 20+, JDK 21, Android SDK (komut satırı araçları). Ayrıntılar `../CLAUDE.md` içinde.

```bash
cd ai-vtuber/mobil
npm install
npx cap add android        # yalnız android/ klasörü yoksa
npm run apk                # hazırla (www/nodejs) → cap sync → gradle assembleDebug
# çıktı: android/app/build/outputs/apk/debug/app-debug.apk
```

`hazirla.mjs`, bilgisayardaki `src/` ve `icerik/` klasörlerini telefona uygun bir Node projesine çevirir. TikTok kütüphanesini Node 18 uyumlu `got@13` ile kurar. İçerik değişince APK'yı yeniden derlemek yeterlidir.
