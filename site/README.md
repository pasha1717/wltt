# Denk

Ciddi evlilik düşünenler için uyum testi, üyelik, profil ve eşleşme. Tek dosya: `index.html`.

## Çalışma modları
- **Demo modu** (varsayılan): `SUPABASE_URL` boşsa hesaplar ve profiller tarayıcıda tutulur, 8 örnek profil gösterilir.
- **Canlı mod**: Supabase bilgileri girilince gerçek üyelik ve eşleşme çalışır.

## Canlıya alma
1. supabase.com'da ücretsiz proje açın.
2. SQL Editor'de `supabase.sql` dosyasının tamamını çalıştırın (tablolar, kurallar, fotoğraf kovası, realtime). Daha önce eski bir sürümü çalıştırdıysanız boş bir projede baştan kurmanız en kolayı.
3. Project Settings → API'den **Project URL** ve **anon public** anahtarını alın, `index.html` içindeki `SUPABASE_URL` ve `SUPABASE_ANON_KEY` satırlarına yazın. (anon anahtarı herkese açık olacak şekilde tasarlanmıştır; güvenliği RLS kuralları sağlar.)
4. Authentication → URL Configuration'da Site URL'yi Vercel adresiniz yapın. E-posta doğrulamayı açık ya da kapalı bırakabilirsiniz.
5. Realtime → Settings'te **"Allow public access"** seçeneğini kapatın (görüşme kanalları yalnızca yetkili iki kişiye açık olsun).
6. Vercel'de bu repoyu içe aktarın, Root Directory: `site`. Derleme ayarı gerekmez.

## Görüntülü görüşme
- Yalnızca karşılıklı ilgi olan iki üye arasında. Aranan kişinin sitede açık olması gerekir; gelen arama ekranın üstünde belirir.
- Görüntü ve ses WebRTC ile iki cihaz arasında doğrudan akar, kaydedilmez. Supabase yalnızca arama bildirimini ve bağlantı bilgisini taşır.
- Varsayılan olarak yalnızca STUN sunucusu var. Bazı kısıtlı ağlarda (bazı mobil operatörler, kurumsal ağlar) bağlantı kurulamayabilir. Bunun için `index.html` içindeki `TURN_SUNUCU` satırına bir TURN sunucusu (ör. Cloudflare Calls, Twilio, Metered) girin.
- Kamera ve mikrofon için site HTTPS üzerinden açılmalıdır (Vercel bunu sağlar).

## Google (Gmail) ile giriş
1. console.cloud.google.com → APIs & Services → **OAuth consent screen**: uygulama adını (Denk) ve destek e-postasını girin, yayınlayın.
2. **Credentials → Create credentials → OAuth client ID**, tür: Web application.
   - Authorized JavaScript origins: Vercel adresiniz (ör. `https://denk.vercel.app`)
   - Authorized redirect URIs: `https://<proje-kodunuz>.supabase.co/auth/v1/callback`
3. Çıkan **Client ID** ve **Client secret**'ı Supabase → Authentication → Providers → **Google** bölümüne yapıştırıp etkinleştirin.
4. Supabase → Authentication → URL Configuration → **Redirect URLs** listesine Vercel adresinizi ekleyin.

Kodda ek ayar gerekmez. Google ile gelen kullanıcının adı profil formuna otomatik yazılır.

## Mesajlaşma
- Yalnızca karşılıklı ilgi olan iki üye yazışabilir; kural veritabanında (RLS) uygulanır. İlgi geri alınırsa yeni mesaj gönderilemez.
- Mesajlar Realtime ile anında gelir; okunmamış sayısı üst menüde görünür. Alıcı mesajın yalnızca "okundu" bilgisini değiştirebilir.

## Güvenlik: engelleme, şikayet, askıya alma
- Engellenen kişi engelleyeni listede göremez, ona ilgi gönderemez, yazamaz, arayamaz; aradaki ilgi silinir. Kimin engellediği görünmez.
- Şikayetleri yalnızca yöneticiler görür. Yönetici bir profili askıya alınca o profil listelerden kalkar; mesaj, görüntülü görüşme ve iletişim bilgisi kapanır. Kullanıcı kendi askı durumunu değiştiremez (veritabanı tetikleyicisi engeller).
- **Kendinizi yönetici yapmak için** siteye bir kez giriş yapın, sonra SQL Editor'de:
  `insert into public.yoneticiler (id) select id from auth.users where email = 'sizin@gmail.com';`
  Sayfayı yenileyince menüde "Yönetim" belirir.

## Fotoğraflar
- Fotoğraf tarayıcıda küçültülür (en fazla 900 px) ve iki kopya yüklenir: 24 piksellik bulanık kopya herkese, net kopya yalnızca sahibine, karşılıklı ilgi olan kişiye ve yöneticiye açıktır. Bu kural Storage politikalarıyla sunucuda uygulanır.

## Hesap silme
- "Hesabımı sil" fotoğrafları siler, sonra `hesabimi_sil()` fonksiyonuyla giriş hesabını siler; profil, mesaj, ilgi, engel ve arama kayıtları zincirleme silinir.

## Yasal metinler (KVKK)
- Sitede Aydınlatma Metni, Açık Rıza Metni ve Kullanım Koşulları sayfaları var. Kayıtta koşullar, profil oluştururken açık rıza onayı alınır (din ve yaşam tarzı bilgisi özel nitelikli kişisel veridir).
- `index.html` içindeki `VERI_SORUMLUSU`, `ADRES` ve `DESTEK_EPOSTA` satırlarını kendi bilgilerinizle doldurun.
- **Metinler taslaktır.** Yayına almadan önce bir hukukçuya kontrol ettirin; veri sorumluları siciline (VERBİS) kayıt yükümlülüğünüz olup olmadığını da sorun.

## SQL'in sınanması
`supabase.sql`, Supabase'in auth, storage ve realtime şemalarını taklit eden yerel bir PostgreSQL 16 üzerinde kuruldu ve 24 senaryoyla sınandı. Sınanan senaryolar: karşılıklı ilgi olmadan mesaj, başkası adına mesaj, mesaj metnini değiştirme, başkasının adına fotoğraf, net fotoğraf erişimi, görüşme kanalı, engel sonrası görünürlük, şikayet okuma, askıya alma, hesap silme. Gerçek Supabase üzerinde henüz çalıştırılmadı.
