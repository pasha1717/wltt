# Toolpano + Toolpano Forum: devir notu (yeni oturuma yapıştır)

Benimle Türkçe konuş, kısa raporla, onay isteme; ama paralel ajan (subagent) başlatmadan önce sor.

## Depolar ve yayın
- **Site kodu:** `pasha1717/toolpano` (Astro, 5 dil: tr/en/de/es/fr). Tek kaynak GitHub `main`. Kuralları README'de.
- **Yayın:** "box" (Grok'un makinesi) her 10 dakikada bir eşitler; `main`'den çekip derler ve Cloudflare Pages'e (`toolpano`) yayınlar. Yayın istemek için yönetim veritabanında (D1 `toolpano-admin`, id `64639119-a21e-4369-a254-af69360dd0de`) `meta.publish_requested_at` alanına şimdiki unix zamanı yazılır. Box kapalıysa Grok'a "main'den yayınla" denir.
- Bu oturumdan `wrangler pages deploy` çalışmaz: ağ katmanı Cloudflare token'ını Pages yükleme anahtarının üstüne yazıyor. Worker yayını (`wrangler deploy`) çalışır.
- Hazır ama birleştirilmemiş: `claude/deploy-workflow` dalı (GitHub Actions ile otomatik Pages yayını). `CLOUDFLARE_API_TOKEN` depo sırrı eklenip birleştirilirse box'a gerek kalmaz.
- Değişiklik akışı: dalda çalış, `npx astro build` ile derle, `main`'e fast-forward birleştir, yayın iste, canlıda kontrol et.

## Forum (`toolpano.com/forum`)
- Kod: `pasha1717/wltt`, dal `ccr-88cddcc8-6prs2z`, klasör `uygulamalar/toolpano-forum` (Cloudflare Worker + D1 `toolpano-forum`). Yayın: klasörde `CLOUDFLARE_API_TOKEN=proxy-injected CLOUDFLARE_ACCOUNT_ID=b34f295e07a1eab231f9be6a91c46d60 npx wrangler deploy`.
- Yalnız AI ajanları yazar (iş kanıtıyla kayıt, API anahtarı), insanlar okur. `/forum/en` İngilizce arayüz. skill.md, OpenAPI, llms.txt, RSS, site haritası, güvenlik başlıkları var.
- Worker ayrıca kökte `robots.txt`, `sitemap-index.xml` ve `llms.txt` (sitenin arama dizininden üretilir) yollarını karşılar.
- Saatlik görev (her saatin 23. dakikası): site haritasındaki yeni adresleri IndexNow'a bildirir (Yandex uç noktası; api.indexnow.org ve Bing Worker isteklerini 429 ile reddediyor), yeni İngilizce haber/rehberler için `toolpano` ajanıyla forumda konu açar. İlk tarama tamam (385 adres).
- Yönetici ve `toolpano` ajanı anahtarları önceki oturumun geçici klasöründeydi; kaybolduysa `npx wrangler secret put ADMIN_TOKEN` ile yenisi konur.

## Yapılanlar (canlıda)
Fontlar alt kümelendi (sayfalar ~%40 hafif), telefon üst kısmı 95 px, araç sayfalarında özet kutusu üstte, ana sayfa rehberleri konu gruplarında, fiyat tablosu telefonda okunur, menüde Forum bağlantısı, `SoftwareApplication` şeması, rehberlerde `datePublished`, sitemap `lastmod` ve tutarlı hreflang, RSS (`/feeds/<dil>.xml`), AdSense yükleyicisi çerez onayına bağlı (kapalı; README'de açma adımları), 47 meta açıklaması, 5 dilde forum haberi.
Yeni araç sayfaları (5 dil, resmi kaynaklardan doğrulanmış): Midjourney, Microsoft Copilot (resmi TL fiyatlarıyla), Perplexity.

## Açık işler
1. Araç sayfaları: Runway ve Grammarly. Canva'nın sitesi otomatik erişimi engelliyor; fiyatlar kullanıcıdan alınmalı. Kural: yalnız resmi sayfada doğrulananı yaz, doğrulanamayan Türkiye satırı `null` ("resmi sayfada belirtilmiyor"). Yapı: `src/data/tools.mjs` (kart + `TURKEY`), `src/content/tools/{de,es,fr}/<slug>.json`, `src/content/tool-bodies/<slug>/<dil>.html`, `src/data/prices.mjs`, `src/data/extra/free.mjs` (`tool:` bağlantısı).
2. Kullanıcı tarafı: forumu duyurmak (`DUYURU.md`), Search Console ve Bing Webmaster'da site haritası ve IndexNow kontrolü, isterse GitHub Actions'ı açmak.
3. Trafik panosu: https://claude.ai/artifact/9tYQYwJjTjiqGDHD7SHVGA. Veri Cloudflare Web Analytics'ten dosya olarak yüklü (site tag `1f6d147f0a5142efadd4a8feb6369165`); "panoyu güncelle" denince yeniden çekilir.
4. Zamanlanmış görev: her ayın 1'i 11:07 (İstanbul) fiyat kontrolü; fark bulursa dal açar, yayınlamaz.

## Ortam
"İçerik" ortamının kurulum betiği her yeni oturumda UI/UX Pro Max becerisini ve agent-browser'ı kurar (agent-browser, Chromium yolunu `~/.agent-browser/config.json`'dan okur). Cloudflare token'ı ağ sırrı olarak tanımlı (komutlarda `CLOUDFLARE_API_TOKEN=proxy-injected`).
