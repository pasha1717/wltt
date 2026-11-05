// Ek sorular (3/3): Vücut ve İcatlar. Kaynak: ilgili videonun doğrulanmış metni (id öneki = video klasörü).
import type { Soru } from "./sorular";

export const EK3: Soru[] = [
  // ---------- Vücut ----------
  // aci
  { id: "aci-2", k: "Vücut", s: "Acı hissetmeyen bir çocukta küçük yaralar neden tehlikeli olabilir?", d: "Fark edilmeden enfeksiyona dönüşebilir", y: ["Hiç iyileşmez", "Daha hızlı kanar"], a: "Bu kişiler vücutlarını her gün gözle kontrol etmek zorunda kalabiliyor." },
  { id: "aci-3", k: "Vücut", s: "Doktorlar hiç acı hissetmeme durumuna ne ad verir?", d: "Doğuştan acıya duyarsızlık", y: ["Süper refleks", "Sinir uykusu"], a: "Çok nadir görülen bir durum." },
  { id: "aci-4", k: "Vücut", s: "Burkulan bilek neden korunur?", d: "Ağrıdığı için dinlendiririz", y: ["Kendiliğinden kilitlenir", "Şişlik onu sabitler"], a: "Acı, dinlenmemiz gerektiğini de söyler." },
  // basparmak
  { id: "basparmak-2", k: "Vücut", s: "İlk taş aletler hangi tutuşla yapıldı?", d: "Başparmakla yapılan hassas tutuşla", y: ["Avucun içiyle", "Ayaklarla"], a: "İğne, kalem ve fırça da aynı hareketle kullanılır." },
  { id: "basparmak-3", k: "Vücut", s: "Başparmaksız insanlar en çok neyde zorlanırdı?", d: "Alet yapmakta", y: ["Yürümekte", "Görmekte"], a: "Yazı, sanat ve teknoloji belki çok daha geç gelişirdi." },
  // kemik
  { id: "kemik-2", k: "Vücut", s: "Vücuttaki kalsiyumun ne kadarı kemik ve dişlerde?", d: "Yüzde 99'dan fazlası", y: ["Yaklaşık yarısı", "Yüzde 10'u"], a: "Kemik, kanın kalsiyum deposudur." },
  { id: "kemik-3", k: "Vücut", s: "Kemik iliği saniyede yaklaşık kaç alyuvar üretir?", d: "Yaklaşık 2 milyon", y: ["Yaklaşık 20", "Yaklaşık 2 bin"], a: "Kemik sürekli yıkılıp yeniden yapılan canlı bir dokudur." },
  { id: "kemik-4", k: "Vücut", s: "Astronotlar uzayda ayda ne kadar kemik kaybedebilir?", d: "Yaklaşık yüzde 1 ila 2", y: ["Hiç kaybetmez", "Yaklaşık yarısını"], a: "Uzayda kemik yıkımı ile yapımı arasındaki denge bozulur." },
  // mide
  { id: "mide-2", k: "Vücut", s: "Mide asidinin pH değeri yaklaşık kaçtır?", d: "1 ile 3 arası", y: ["7", "12"], a: "Bu çok güçlü bir asittir, eti sindirebilir." },
  { id: "mide-3", k: "Vücut", s: "Mide hücreleri asidi nötrlemek için ne pompalar?", d: "Bikarbonat", y: ["Tuz", "Şeker"], a: "Bikarbonat, mukus tabakasında asidi yüzeyde nötrler." },
  { id: "mide-4", k: "Vücut", s: "Hangi ilaçlar midenin koruyucu tabakasını zayıflatabilir?", d: "Aspirin ve ibuprofen", y: ["Vitaminler", "Antibiyotikler"], a: "Koruma bozulunca asit duvara ulaşır ve ülser oluşabilir." },
  // ter
  { id: "ter-2", k: "Vücut", s: "Derimizde yaklaşık kaç ter bezi var?", d: "2 ila 5 milyon", y: ["Birkaç yüz", "Yaklaşık bin"], a: "Ter vücudun en güçlü soğutma sistemi." },
  { id: "ter-3", k: "Vücut", s: "Köpeklerin ter bezleri çoğunlukla nerede?", d: "Patilerinde", y: ["Dillerinde", "Kulaklarında"], a: "Bu yüzden köpekler soluyarak serinler." },
  { id: "ter-4", k: "Vücut", s: "Sıcağa alışmış biri bir saatte ne kadar terleyebilir?", d: "3 ila 4 litreye yakın", y: ["Bir bardak", "10 litre"], a: "Bir hipoteze göre atalarımız bazı avları sıcakta saatlerce kovalayıp yorardı." },
  // tukuruk
  { id: "tukuruk-2", k: "Vücut", s: "Tükürükteki hangi madde nişastayı şekere parçalar?", d: "Amilaz", y: ["İnsülin", "Kolesterol"], a: "Sindirim daha ilk lokmada tükürükle başlar." },
  { id: "tukuruk-3", k: "Vücut", s: "Tükürük dişlere nasıl yardım eder?", d: "Asidi dengeler, kalsiyum ve fosfat taşır", y: ["Dişleri beyazlatır", "Diş etini uyuşturur"], a: "Ağzı sürekli kuru olanlarda diş çürüğü sıklaşır." },
  { id: "tukuruk-4", k: "Vücut", s: "Tükürükteki lizozim ne işe yarar?", d: "Mikroplarla savaşır", y: ["Tat verir", "Dişleri sertleştirir"], a: "Lizozim ve laktoferrin gibi maddeler mikroplara karşı çalışır." },
  // tuz
  { id: "tuz-2", k: "Vücut", s: "Buzdolabından önce insanlar yiyecekleri nasıl saklardı?", d: "Tuzla", y: ["Şekerle", "Kumla"], a: "Tuz o kadar değerliydi ki ticaret yolları onun için kuruldu." },
  { id: "tuz-3", k: "Vücut", s: "Kalbin atması ve kasların kasılması hangi maddeye bağlıdır?", d: "Sodyum", y: ["Demir", "Altın"], a: "Tuzdaki sodyum vücudun elektrik sisteminin bir parçası." },
  // uyku
  { id: "uyku-2", k: "Vücut", s: "17 saat uyanık kalmanın etkisi bazı testlerde neye benzer?", d: "Hafif alkollü olmaya", y: ["Kahve içmeye", "Hiçbir etkisi olmaz"], a: "Tepkiler yavaşlar." },
  { id: "uyku-3", k: "Vücut", s: "Uyku sırasında beyin öğrendiklerine ne yapar?", d: "Kalıcı hale getirir", y: ["Siler", "Hiçbir şey yapmaz"], a: "Farelerle bir çalışmada uykuda beynin atıkları da daha hızlı temizlendi." },
  // gece
  { id: "gece-2", k: "Vücut", s: "Bazı bitkiler çiçek açma zamanını neye göre ayarlar?", d: "Gecenin uzunluğuna göre", y: ["Ay'ın rengine göre", "Rüzgârın yönüne göre"], a: "Gece olmasaydı canlıların iç saatleri karışırdı." },
  { id: "gece-3", k: "Vücut", s: "Hiç gece olmasaydı gökyüzü hakkında ne düşünürdük?", d: "Boş sanardık, yıldızları görmezdik", y: ["Hep mor görürdük", "Hiçbir şey değişmezdi"], a: "Yıldızları ancak karanlıkta görebiliriz." },
  // antibiyotik
  { id: "antibiyotik-2", k: "Vücut", s: "Penisilin hangi dönemde yaygın olarak üretilmeye başlandı?", d: "İkinci Dünya Savaşı sırasında", y: ["1800'lerde", "1990'larda"], a: "Antibiyotiklerden önce küçük bir sıyrık bile öldürebiliyordu." },
  { id: "antibiyotik-3", k: "Vücut", s: "Bakteriler antibiyotiklere karşı neden direnç kazanıyor?", d: "Gereksiz kullanım yüzünden", y: ["Antibiyotikler bozulduğu için", "Hiç direnç kazanmıyorlar"], a: "Antibiyotik sadece reçeteyle ve önerilen süre boyunca kullanılmalı." },
  { id: "antibiyotik-4", k: "Vücut", s: "Antibiyotikler bugün hangisinin de dayanağı?", d: "Ameliyatlar ve organ nakli", y: ["Gözlükler", "Diş fırçaları"], a: "Kemoterapi ve organ nakli de enfeksiyonları önlemek için antibiyotiklere dayanıyor." },
  // sabun
  { id: "sabun-2", k: "Vücut", s: "1847'de Viyana'da hekimlere el yıkatan doktor kim?", d: "Semmelweis", y: ["Pasteur", "Fleming"], a: "Doğum sonrası ölümler yüzde 10 civarından yüzde 1-2'ye indi. Fikri yine de kabul görmedi." },
  { id: "sabun-3", k: "Vücut", s: "2005'te Karaçi'de sabunla el yıkama küçük çocuklarda zatürreyi ne kadar azalttı?", d: "Yarıya indirdi", y: ["Hiç etkilemedi", "Yüzde 5 azalttı"], a: "El yıkamanın ishali de yaklaşık üçte bir azalttığı tahmin ediliyor." },

  // ---------- İcatlar ----------
  // ilk-video
  { id: "ilk-video-2", k: "İcatlar", s: "Kalem kapağı hangi durumda delikli olmak zorunda değil?", d: "Yutulamayacak kadar büyükse", y: ["Mavi renkliyse", "Metal ise"], a: "Delik, kapak takılsa bile nefes geçebilsin diye var." },
  // ates
  { id: "ates-2", k: "İcatlar", s: "Ateş, insanların nerelere yerleşmesini mümkün kıldı?", d: "Soğuk bölgelere", y: ["Okyanusların ortasına", "Ay'a"], a: "Ateş yırtıcıları uzak tuttu ve geceyi uzattı." },
  { id: "ates-3", k: "İcatlar", s: "Hangisi ateş olmadan yapılamazdı?", d: "Cam", y: ["Sepet", "Taş balta"], a: "Çömlek, metal ve cam da ateş olmadan yapılamazdı." },
  // buzdolabi
  { id: "buzdolabi-2", k: "İcatlar", s: "Frederic Tudor 1806'da Martinik'e ne gönderdi?", d: "Yaklaşık 130 ton buz", y: ["Bir gemi dolusu buzdolabı", "Dondurma makinesi"], a: "Buz sağlam vardı ama alıcı bulamadı." },
  { id: "buzdolabi-3", k: "İcatlar", s: "Aşıların çoğu hangi sıcaklık aralığında saklanmalı?", d: "2 ile 8 derece arasında", y: ["20 ile 25 derece", "Eksi 50 derece altında"], a: "Soğutma zinciri aşıların bozulmasını önler." },
  { id: "buzdolabi-4", k: "İcatlar", s: "Bazı araştırmalara göre buzdolabı yaygınlaşınca hangi kanser düştü?", d: "Mide kanseri", y: ["Cilt kanseri", "Kemik kanseri"], a: "Tuzlu ve tütsülü yiyecekler azalınca mide kanseri de azaldı." },
  // cam
  { id: "cam-2", k: "İcatlar", s: "Cam ne eritilerek yapılır?", d: "Kum, soda ve kireçtaşı", y: ["Buz ve tuz", "Demir ve kömür"], a: "Cam yaklaşık dört bin yıldır üretiliyor." },
  { id: "cam-3", k: "İcatlar", s: "1665'te mercekle bakıp \"hücre\" kelimesini kullanan kim?", d: "Robert Hooke", y: ["Isaac Newton", "Galileo"], a: "Galileo ise 1609'da teleskobu gökyüzüne çevirdi." },
  // elektrik
  { id: "elektrik-2", k: "İcatlar", s: "Bugün santrallerin çoğu elektriği nasıl üretir?", d: "Faraday'ın prensibiyle çalışan jeneratörlerle", y: ["Pillerle", "Yıldırımları toplayarak"], a: "Mıknatıs ile bobin arasındaki hareket elektrik üretir." },
  { id: "elektrik-3", k: "İcatlar", s: "Elektriksiz bir dünyada iletişim ne kadar hızlı olurdu?", d: "Mektuplar kadar yavaş", y: ["Bugünkü kadar hızlı", "Daha hızlı"], a: "İlaçları soğuk saklamak da çok zorlaşırdı." },
  // gozluk
  { id: "gozluk-2", k: "İcatlar", s: "Gözlükten önce insanlar yakını görmek için ne kullanıyordu?", d: "Okuma taşları", y: ["Su dolu bardaklar", "Ayna"], a: "Sayfanın üstüne konan bu taşlar yazıyı büyütüyordu." },
  { id: "gozluk-3", k: "İcatlar", s: "Bugün dünyada en az kaç kişinin bir görme sorunu var?", d: "En az 2,2 milyar", y: ["Yaklaşık 2 milyon", "Yaklaşık 200 milyon"], a: "Bir çalışmaya göre 2050'de dünyanın yaklaşık yarısı miyop olabilir." },
  { id: "gozluk-4", k: "İcatlar", s: "Göz kaç yaş civarında yakına odaklanma gücünü kaybetmeye başlar?", d: "40 yaş civarında", y: ["10 yaş civarında", "80 yaş civarında"], a: "Gözlük, insanların okuyup yazabildiği yılları uzattı." },
  // kahve
  { id: "kahve-2", k: "İcatlar", s: "Bir efsaneye göre kahveyi ilk kim fark etti?", d: "Etiyopya'da hoplayan keçiler", y: ["Bir Osmanlı padişahı", "Bir İtalyan aşçı"], a: "Kahve Etiyopya'nın dağlık ormanlarından geldi." },
  { id: "kahve-3", k: "İcatlar", s: "Kahve Osmanlı'ya hangi ülke üzerinden ulaştı?", d: "Yemen", y: ["Brezilya", "Hindistan"], a: "Kahvehaneler, insanların buluşup haber ve fikir paylaştığı yerler oldu." },
  // kanalizasyon
  { id: "kanalizasyon-2", k: "İcatlar", s: "1858 yazında Londra'da ne oldu?", d: "Şehir öyle koktu ki meclis taşınmayı konuştu", y: ["Thames nehri dondu", "Büyük bir yangın çıktı"], a: "Büyük Koku'dan sonra Londra'nın altına dev bir kanal ağı kuruldu." },
  { id: "kanalizasyon-3", k: "İcatlar", s: "John Snow 1854'te kolera salgınının nereden yayıldığını gösterdi?", d: "Tek bir su pompasından", y: ["Farelerden", "Kötü havadan"], a: "Bu keşif temiz suyun önemini gösterdi." },
  { id: "kanalizasyon-4", k: "İcatlar", s: "Bugün kaç insanın güvenli bir tuvaleti yok?", d: "3,4 milyar", y: ["340 bin", "34 milyon"], a: "Bu yüzden her yıl yarım milyondan fazla insan ölüyor." },
  // konserve
  { id: "konserve-2", k: "İcatlar", s: "Yiyecek saklama yöntemi bulana ödül veren ülke hangisi?", d: "Fransa", y: ["İngiltere", "Japonya"], a: "Ödülü, yiyeceği kapalı şişede kaynatan Nicolas Appert aldı." },
  { id: "konserve-3", k: "İcatlar", s: "Kaynatılan kaptaki yiyeceğin neden bozulmadığını kim açıkladı?", d: "Pasteur, yıllar sonra", y: ["Appert, hemen", "Hiç açıklanmadı"], a: "Bozulmanın sebebi mikroplardı." },
  // matbaa
  { id: "matbaa-2", k: "İcatlar", s: "Bir kâtip tek bir İncil'i elle kopyalamak için ne kadar uğraşırdı?", d: "Dört beş ay", y: ["Bir gün", "On yıl"], a: "Bir tahmine göre kâtip günde yaklaşık üç bin kelime yazabiliyordu." },
  { id: "matbaa-3", k: "İcatlar", s: "Gutenberg İncil'ini hangi şehirde bastı?", d: "Mainz", y: ["Paris", "Venedik"], a: "1500'e kadar Avrupa'da milyonlarca kitap basılmıştı." },
  { id: "matbaa-4", k: "İcatlar", s: "Elimizdeki en eski metal harfli kitap hangi ülkeden?", d: "Kore", y: ["Almanya", "Mısır"], a: "Hareketli harfi ilk Çin'de Bi Sheng geliştirdi." },
  // plastik
  { id: "plastik-2", k: "İcatlar", s: "Hastanelerde plastikten yapılan şeylere örnek hangisi?", d: "Tek kullanımlık şırınga ve serum torbası", y: ["Ameliyat masası", "Hasta yatağının yayları"], a: "Plastiksiz bir dünya daha temiz, ama daha ağır ve pahalı olurdu." },
  { id: "plastik-3", k: "İcatlar", s: "Üretilen plastiğin büyük kısmına ne oluyor?", d: "Geri dönüştürülmeden çöpe ya da doğaya karışıyor", y: ["Tamamı geri dönüştürülüyor", "Uzaya gönderiliyor"], a: "Asıl soru, plastiği ne kadar akıllıca kullandığımız." },
  // saat
  { id: "saat-2", k: "İcatlar", s: "Saat dilimlerinin gerekmesine ne yol açtı?", d: "Trenlerin yayılması", y: ["Uçakların icadı", "Televizyon yayınları"], a: "Her şehrin farklı saati tren tarifelerini karmakarışık hale getirdi." },
  { id: "saat-3", k: "İcatlar", s: "Başlangıç meridyeni olarak hangi yer kabul edildi?", d: "Greenwich", y: ["İstanbul", "Paris"], a: "1884'te kabul edildi; Dünya zamanla 24 saat dilimine bölündü." },
  // sifir
  { id: "sifir-2", k: "İcatlar", s: "Bilgisayarlar her şeyi hangi sayılarla yazar?", d: "Sıfır ve bir", y: ["Bir ve iki", "Sıfırdan dokuza"], a: "Sıfırsız bir dünyada bilgisayar çok zor gelişirdi." },
  { id: "sifir-3", k: "İcatlar", s: "Sıfır fikri Avrupa'ya hangi bilginler aracılığıyla yayıldı?", d: "Harezmi gibi Orta Doğulu bilginler", y: ["Romalı senatörler", "Vikingler"], a: "Sıfırla birlikte büyük sayılarla hesap yapmak çok kolaylaştı." },
  // takvim
  { id: "takvim-2", k: "İcatlar", s: "Gerçek yıl, 365 gün 6 saatten ne kadar kısa?", d: "Yaklaşık 11 dakika", y: ["Yaklaşık 11 saat", "Tam olarak aynı"], a: "Jülyen takvimi bu farkı yok sayıyordu; yüzyıllar içinde birikti." },
  { id: "takvim-3", k: "İcatlar", s: "Britanya yeni takvime geçtiğinde kaç gün atmak zorunda kaldı?", d: "11 gün", y: ["1 gün", "30 gün"], a: "Britanya 1752'de geçti; geç kaldığı için fark büyümüştü." },
  { id: "takvim-4", k: "İcatlar", s: "Bugünkü takvim kaç yılda bir gün kayar?", d: "Yaklaşık 3 bin yılda", y: ["Her yıl", "Hiç kaymaz"], a: "Bugünkü takvim de kusursuz değil ama çok yakın." },
  // tekerlek
  { id: "tekerlek-2", k: "İcatlar", s: "Bugün elektriğin büyük kısmı ne ile üretiliyor?", d: "Dönen türbinlerle", y: ["Güneş panelleriyle", "Pillerle"], a: "Türbinler de dönen birer tekerlektir." },
  { id: "tekerlek-3", k: "İcatlar", s: "Hangi uygarlık taşımada tekerlek kullanmadan büyük bir imparatorluk kurdu?", d: "İnkalar", y: ["Romalılar", "Mısırlılar"], a: "Tekerlekli arabalar yaklaşık 5.500 yıl önce Mezopotamya'da görülmeye başladı." },
  // yazi
  { id: "yazi-2", k: "İcatlar", s: "İlk yazılar neyin üzerine yazıldı?", d: "Kil tabletlere", y: ["Kâğıda", "Deriye"], a: "Yazı yaklaşık 5 bin yıl önce Mezopotamya'da başladı." },
  { id: "yazi-3", k: "İcatlar", s: "Yazı sayesinde bir fikre ne oldu?", d: "Düşünen öldükten sonra da yaşayabildi", y: ["Daha hızlı unutuldu", "Sadece krallara ait oldu"], a: "Bilim, bir önceki neslin bıraktığı yazılı bilgilerin üstüne kuruldu." },
];
