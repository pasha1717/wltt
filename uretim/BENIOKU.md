# Parti üretimi (yarım kalırsa devam)
- `uretim/aciklamalar/<ad>.md`: partideki her videonun Instagram açıklaması + kaynakları. Metin ve ayarlar `public/<ad>`, `src/<ad>` içinde, commit'li.
- Devam: `mkdir -p /tmp/kilit && uretim/kuyruk.sh` (iki işçi için ikinci terminalde tekrar). `cikti/<ad>.mp4` olmayanları seslendirir ve render eder; sesi olanlar için kredi harcamaz.
- Kredi: `python3 uretim/kredi.py`. Kontrol: `python3 uretim/kontrol.py <ad>`.
- Bitince: 60 videoyu ve açıklamaları (Kaynaklar satırları olmadan) zip'le, `aciklamalar.md`'ye ekle, commit ve push.
