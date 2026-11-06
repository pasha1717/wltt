# Neşe AI VTuber: çalışma kuralları

Bu klasör, `wltt` deposundaki Reels projesinden bağımsızdır. Reels kuralları (Deniz sesi, 60 sn video vb.) burada geçerli değildir.

## Değişmez kurallar
1. Anahtar ve parolalar asla sohbete, loga ya da commit'e yazılmaz. Gerçek değerler yalnız `.env` içinde durur. `.env.example` yalnız değişken adlarını içerir. Denetim yalnız "dolu/boş" yazar (`npm run anahtarlar`).
2. Şunlardan önce kullanıcıya sorulur: yazılım indirmek/kurmak, ücretli servis çağırmak (`npm run ses-uret`, `--kuru` hariç), port açmak, dosya silmek, git push.
   Varsayılan ses üretimi yerel ve ücretsiz VoxCPM2'dir (`araclar/voxcpm-uret.ps1`, kullanıcının bilgisayarında); ElevenLabs alternatiftir.
3. Sunucu ve arayüzler yalnız 127.0.0.1'e bağlanır.
4. Her adım çalıştırılıp çıktısıyla kanıtlanır. Hata olursa kök neden bulunur.
5. Lisanslar: Live2D telif ibaresi overlay'de görünür kalır. Küfür listesinin CC BY-SA atfı korunur. tiktok-live-connector AGPL-3.0 ve resmî değildir. Karakter yapay zekâdır ve gerçek kişi gibi tanıtılmaz. Gerçek bir kişinin sesi ya da yüzü taklit edilmez. TikTok yapay zekâ içerik etiketi hatırlatılır.
6. Kullanıcıyla kısa ve sade Türkçe konuşulur.

## İçerik
- Replikler kısa tutulur: 1-2 cümle, en fazla 80 karakter (`npm run denetle`).
- Bilgi içeren konu replikleri güvenilir kaynakla doğrulanır, `kaynak` alanına yazılır. Doğrulanamayan bilgi yumuşatılır ya da çıkarılır.
- Metin değişince yalnız o repliğin sesi yeniden üretilir; dosya adı metin + duygu hash'idir.

## Komutlar
`npm test` · `npm run denetle` · `npm run saglik` · `npm run basla` · `npm run voxcpm -- hazirla --dene 3` · `npm run obs-kur` · `node araclar/uctan-uca.cjs`
