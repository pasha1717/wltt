# Parti üretimi (yarım kalırsa devam)
- `uretim/aciklamalar/<ad>.md`: partideki her videonun Instagram açıklaması + kaynakları. Metin ve ayarlar `public/<ad>`, `src/<ad>` içinde, commit'li.
- Devam: `mkdir -p /tmp/kilit && uretim/kuyruk.sh` (iki işçi için ikinci terminalde tekrar). `cikti/<ad>.mp4` olmayanları seslendirir ve render eder; sesi olanlar için kredi harcamaz.
- Kredi: `python3 uretim/kredi.py`. Kontrol: `python3 uretim/kontrol.py <ad>`.
- Bitince: 60 videoyu ve açıklamaları (Kaynaklar satırları olmadan) zip'le, `aciklamalar.md`'ye ekle, commit ve push.

## Durum (11 Kasım 2026)
- 60'lık parti ve 5'lik parti (tutulma, burusma, kemer, yengec, led) bitti, teslim edildi. Bekleyen video yok.
- Sıradaki iş: 10 yeni video. Konu/metin için `uretim/brief2.md` (açıklama yolu `uretim/aciklamalar/<ad>.md`), sonra `uretim/uret.sh <ad>...`, zip + `aciklamalar.md`.
- `kuyruk.sh` `cikti/` boşsa eski videoları da yeniden render eder; yeni oturumda `uret.sh`'yi adlarla çağır.
- Seslendirme video başına ~360 kredi harcıyor.
