# Görev: "Ne olurdu?" Reels videoları için konu + metin + sahne dosyaları (ses ve render YOK)

Depo: /home/user/wltt. Önce oku: CLAUDE.md, .claude/agents/konu-arastirmaci.md, örnek: public/oksijen/metin.txt, src/oksijen/ayar.ts, src/oksijen/index.ts, aciklamalar.md son bölüm.
Mevcut konular: `ls public/` — bunları ve benzerlerini tekrarlama. Sana verilen kategori dışına çıkma (diğer ajanlarla çakışmasın).

Her konu için:
1. konu-arastirmaci.md'deki gibi araştır ve doğrula (WebSearch). DOĞRULANDI/YUMUŞAT kullan, ÇIKAR kullanma. doubt-driven-development ve idea-refine yaklaşımı.
2. `public/<ad>/metin.txt`: TAM 13 satır. 0 kanca, 1 "...olsaydı/olmasaydı, ne olurdu?" sorusu, 2 yaygın tahmin, 3 dönüş, 4-9 açıklama, 10-11 ders (kısa, büyük yazı; "X değil, Y" kalıbı yok), 12 yorum çağrısı ("... Yorumlara yaz."). Satır başı yönlendirmeleri örnekteki gibi: satır 0 `[curious, calm storyteller, unhurried]`, 1,3,8 ve 12 `[pause]`, 4 `[calm]`, 10 `[slowly]`, 11 `[softly]`. Rakamlar okunuşla: `1806'da|bin_sekiz_yüz_altıda`, `%21|yüzde_yirmi_bir`, yabancı isim `Hooke|Huk`. Satır 0, 10, 11 kısa olsun (≤8 kelime). TOPLAM karakter (wc -m) 850 ile 950 arası (hedef ~58 sn) — 950 sert üst sınır, kredi kısıtlı.
3. humanizer becerisini (Skill aracı) metne uygula: doğal Türkçe konuşma dili, yapay zekâ kalıbı yok.
4. `src/<ad>/ayar.ts`: oksijen örneğiyle aynı yapı. ses "<ad>/ses.mp3", konuya uygun koyu ust/alt renkleri ve açık parca rengi, 13 sahne (her satıra bir). efekt yalnız: yuz son buyu kucul salla don dus kay. Satır 0, 10, 11'de "vurgu" o satırdaki bir kelimenin EKRANDA görünen hali (noktalama dahil, `|` öncesi kısım) olmalı. kirilma: 0/10/11 satırlarında satır kırılacak kelime indeksleri (örnek gibi). Bazı açıklama sahnelerine kısa "kart" (≤25 karakter).
5. `src/<ad>/index.ts`: oksijen/index.ts'nin aynısı, ad değişik.
6. `/tmp/claude-0/-home-user-wltt/2785774b-67eb-581a-8375-90c44b0ab6db/scratchpad/parti2/<ad>.md`: humanizer'dan geçmiş Instagram açıklaması, aciklamalar.md'deki biçimde ("## Başlık (`<ad>.mp4`)" + text bloğu, hashtag'ler dahil), altında "Kaynaklar:" 2-4 URL.
Dosya adı: küçük harf, Türkçe karaktersiz, tek kelime (ya da tireli). Ses üretme, render etme, commit etme. ELEVENLABS'e istek atma.
Bitince yalnızca oluşturduğun adları ve her metnin karakter sayısını tek satırda bildir.

Ek kurallar:
- Karakteri Python len(open(...).read()) ile say (wc -m bu ortamda bayt sayıyor).
- Aynı anda 10 ajan çalışıyor. Konuyu seçer seçmez `mkdir public/<ad>` (-p OLMADAN) ile ayır; klasör zaten varsa ya da başka ajanın yakın bir konusu görünüyorsa başka konu seç.
- Bitirince kontrol et: `cd /home/user/wltt && python3 -I /tmp/claude-0/-home-user-wltt/2785774b-67eb-581a-8375-90c44b0ab6db/scratchpad/kontrol.py <ad>...` hepsi OK olmalı.
