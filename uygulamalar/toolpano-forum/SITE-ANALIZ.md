# toolpano.com teknik analizi (7 Kasım 2026)

Araçlar: [REA](https://github.com/morluto/rea) 6.8.0 (`rea-agents`, Chrome DevTools Protocol üzerinden sayfa incelemesi ve Playwright senaryoları), Chromium 153, ek olarak Playwright ile mobil performans ölçümü.

İncelenen sayfalar: `/tr/` (çerez onaylı ve onaysız), `/tr/rehber/chatgpt-kac-tl/`, `/tr/araclar/`, `/en/tools/chatgpt/`, `/tr/yapay-zeka-fiyatlari/`, `/tr/haberler/yapay-zeka-ajanlari-forumu/`, `/forum`.

## Özet

Site teknik olarak çok sağlam: hafif, hızlı, güvenlik başlıkları eksiksiz, konsol hatası yok, üçüncü taraf izleme yok. İyileştirme alanı iki konu: **fontlar** (sayfa ağırlığının %90'ı) ve **çerez bandının metni** (var olmayan çerezleri soruyor).

## 1. Ağ ve kaynaklar (REA senaryoları)

| Sayfa | İstek | Üçüncü taraf | Hata |
|---|---|---|---|
| /tr/ | 15 | yalnız Cloudflare Web Analytics | yok |
| /tr/rehber/chatgpt-kac-tl/ | 14 | aynı | yok |
| /tr/araclar/ | 12 | aynı | yok |
| /en/tools/chatgpt/ | 12 | aynı | yok |
| /tr/yapay-zeka-fiyatlari/ | 12 | aynı | yok |
| /tr/haberler/… | 16 | aynı | yok |
| /forum | 3 | aynı | yok |

- Sayfa başına tek JavaScript: Cloudflare Web Analytics işaretçisi (çerezsiz). Sitenin kendi betikleri yalnız küçük satır içi parçalar (tema ve çerez bandı).
- Konsolda hata ya da uyarı yok. 4xx/5xx yanıt yok.
- Önbellek doğru kurulmuş: fontlar ve CSS 1 yıl `immutable`, HTML `s-maxage=600`.

## 2. Performans (Pixel 7, yavaş 4G, 4× yavaş işlemci)

| Sayfa | TTFB | FCP | LCP | CLS | Tam yükleme | Aktarılan |
|---|---|---|---|---|---|---|
| /tr/ | 491 ms | 1,36 s | 1,37 s | 0,032 | 3,37 s | 465 KB |
| /tr/rehber/chatgpt-kac-tl/ | 168 ms | 0,74 s | 0,74 s | 0,019 | 2,70 s | 446 KB |
| /tr/yapay-zeka-fiyatlari/ | 162 ms | 0,80 s | 0,80 s | 0 | 2,16 s | 326 KB |
| /forum | 238 ms | 0,36 s | 0,36 s | 0 | 0,56 s | 4 KB |

LCP ve CLS, Google'ın "iyi" sınırlarının (2,5 s ve 0,1) çok altında. Tam yükleme süresini uzatan şey fontlar.

## 3. Fontlar (en büyük iyileştirme alanı)

- Ana sayfada aktarılan yaklaşık 477 KB'ın **yaklaşık 437 KB'ı font** (7 dosya). En büyük dosya 128 KB (Newsreader, Latin).
- 3 aile: Fraunces (başlıklar), Newsreader (metin), IBM Plex Mono (menü ve küçük yazılar); klasörde 17 dosya, 714 KB.
- Türkçe sayfalar her aile için iki dosya indiriyor: Latin, artı yalnız ğ, ş, İ gibi birkaç harf için tam "Latin genişletilmiş" dosyası (57-84 KB).

Öneri: her aileyi Türkçe ve Batı Avrupa harflerini içeren **tek bir alt kümeye** indirmek (fonttools/pyftsubset). Böylece Türkçe sayfalarda Latin genişletilmiş dosyaları hiç inmez. Kullanılmayan değişken eksenler (ör. optik boyut) sabitlenirse dosyalar daha da küçülür. Tahmini kazanç: font yükünün yarısı ya da daha fazlası. Görünüm değişmez.

## 4. Çerez bandı

- Bant "izin verirsen istatistik ve reklam çerezleri de" diyor. Ama **"Kabul et"e basıldıktan sonra hiçbir yeni betik yüklenmiyor** (REA onaylı senaryosu: onaysızla aynı 15 istek). Kodda da onay yalnız bandı gizliyor.
- Sitede reklam ya da istatistik çerezi yok; Cloudflare Web Analytics çerez kullanmıyor. Tema ve onay tercihi `localStorage`'da tutuluyor.

Öneri: ileride reklam (örneğin AdSense) eklenecekse bant kalsın, onay o betiği yükleyecek şekilde bağlansın. Eklenmeyecekse bant kaldırılsın ya da "Bu site izleme çerezi kullanmıyor" diye düzeltilsin. Şu anki metin ziyaretçiyi yanıltıyor ve her yeni ziyaretçinin ekranının altını kaplıyor.

## 5. Güvenlik

- Site: CSP, HSTS (1 yıl, alt alan adları dahil), `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP. Eksiksiz.
- CSP `script-src` içinde `'unsafe-inline'` var (satır içi tema/çerez betikleri için). İleride hash tabanlı CSP'ye geçilebilir; acil değil.
- Forum: bu analizde güvenlik başlıklarının olmadığı görüldü; aynı gün sitenin geri kalanıyla aynı başlıklar eklendi.
- E-posta gizleme kapatıldı (kırık `/cdn-cgi/l/email-protection` bağlantısı kalktı).

## 6. SEO özeti (önceki denetimden)

365+ sayfa 200 dönüyor; başlık ve açıklamalar benzersiz; kanonik, 5 dilde hreflang, tek H1, geniş yapılandırılmış veri. 47 meta açıklaması düzeltildi, kök sayfaya WebSite/Organization verisi ve her sayfanın menüsüne "Forum" bağlantısı eklendi.

## Öncelik sırası

1. Fontları alt kümelere indirmek (en büyük hız ve veri kazancı).
2. Çerez bandını düzeltmek ya da kaldırmak.
3. (İsteğe bağlı) CSP'de `'unsafe-inline'` yerine hash.
