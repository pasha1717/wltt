# Denk

Ciddi evlilik düşünenler için uyum testi, üyelik, profil ve eşleşme. Tek dosya: `index.html`.

## Çalışma modları
- **Demo modu** (varsayılan): `SUPABASE_URL` boşsa hesaplar ve profiller tarayıcıda tutulur, 8 örnek profil gösterilir.
- **Canlı mod**: Supabase bilgileri girilince gerçek üyelik ve eşleşme çalışır.

## Canlıya alma
1. supabase.com'da ücretsiz proje açın.
2. SQL Editor'de `supabase.sql` dosyasını çalıştırın.
3. Project Settings → API'den **Project URL** ve **anon public** anahtarını alın, `index.html` içindeki `SUPABASE_URL` ve `SUPABASE_ANON_KEY` satırlarına yazın. (anon anahtarı herkese açık olacak şekilde tasarlanmıştır; güvenliği RLS kuralları sağlar.)
4. Authentication → URL Configuration'da Site URL'yi Vercel adresiniz yapın. E-posta doğrulamayı açık ya da kapalı bırakabilirsiniz.
5. Vercel'de bu repoyu içe aktarın, Root Directory: `site`. Derleme ayarı gerekmez.
