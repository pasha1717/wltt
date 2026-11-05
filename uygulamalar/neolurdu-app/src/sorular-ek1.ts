// Ek sorular (1/3): Uzay ve Dünya. Kaynak: ilgili videonun doğrulanmış metni (id öneki = video klasörü).
import type { Soru } from "./sorular";

export const EK1: Soru[] = [
  // ay-olmasaydi
  { id: "ay-olmasaydi-2", k: "Uzay", s: "Ay kaybolsa gelgitler ne olurdu?", d: "Üçte birine kadar küçülürdü", y: ["Tamamen dururdu", "İki katına çıkardı"], a: "Gelgitleri büyük ölçüde Ay yaratır. Ay olmasa, kalan gelgitler (Güneş'in etkisi) üçte birine kadar küçülürdü." },
  { id: "ay-olmasaydi-3", k: "Uzay", s: "Ay olmasa hangi deniz canlıları yumurtlama gecesini kaçırabilirdi?", d: "Mercanlar", y: ["Balinalar", "Köpekbalıkları"], a: "Bazı mercanlar yumurtlama zamanını Ay ışığına göre ayarlar." },
  { id: "ay-olmasaydi-4", k: "Uzay", s: "Dünya'nın eğimi bugün yaklaşık ne kadar oynar?", d: "Yaklaşık 2,5 derece", y: ["Yaklaşık 25 derece", "Hiç oynamaz"], a: "Ay bu oynamayı küçük tutar. Bu küçük oynama bile buzul çağlarının ritmini etkileyen nedenlerden biri." },
  // gunes
  { id: "gunes-2", k: "Uzay", s: "Güneş sönse Ay'ı görmeye devam eder miydik?", d: "Hayır, Ay da kaybolurdu", y: ["Evet, Ay kendi ışığını üretir", "Evet, ama kırmızı görünürdü"], a: "Ay kendi ışığını üretmez, Güneş'in ışığını yansıtır." },
  { id: "gunes-3", k: "Uzay", s: "Güneş'in çekimi kaybolsa Dünya ne yapardı?", d: "Düz bir çizgide uzaklaşırdı", y: ["Güneş'in yerine düşerdi", "Aynı yörüngede dönmeye devam ederdi"], a: "Çekim kaybolunca Dünya yörüngesinden çıkıp düz bir çizgide ilerlerdi." },
  { id: "gunes-4", k: "Uzay", s: "Güneş bir gün aniden söner mi?", d: "Hayır, yıldızlar böyle ölmez", y: ["Evet, her an olabilir", "Evet, yaklaşık bin yıl içinde"], a: "Güneş milyarlarca yıl daha yanacak ve bir anda sönmeyecek." },
  // jupiter
  { id: "jupiter-2", k: "Uzay", s: "Jüpiter, Dünya'dan yaklaşık kaç kat ağır?", d: "Yaklaşık 318 kat", y: ["Yaklaşık 3 kat", "Yaklaşık 30 kat"], a: "Jüpiter, öteki gezegenlerin toplamının iki katından da ağır." },
  { id: "jupiter-3", k: "Uzay", s: "1994'te Jüpiter'e ne çarptı?", d: "Parçalanmış bir kuyruklu yıldız", y: ["Bir uzay aracı", "Satürn'ün bir uydusu"], a: "Parçalanmış bir kuyruklu yıldızın parçaları Jüpiter'e çarptı." },
  { id: "jupiter-4", k: "Uzay", s: "Bir çalışmada Jüpiter'in kütlesi beşte birine indirilince Dünya'ya çarpışmalar ne oldu?", d: "Neredeyse iki katına çıktı", y: ["Tamamen bitti", "Hiç değişmedi"], a: "Simülasyonlar, Jüpiter'in etkisinin sanıldığından karışık olduğunu gösteriyor." },
  // venus
  { id: "venus-2", k: "Uzay", s: "Venüs'te bir gün mü uzun, bir yıl mı?", d: "Bir gün, yani kendi çevresinde bir tur", y: ["Bir yıl", "İkisi eşit"], a: "Venüs Güneş'in çevresini yaklaşık 225 günde, kendi çevresini yaklaşık 243 günde dolaşır." },
  { id: "venus-3", k: "Uzay", s: "Venüs'te Güneş hangi yönden doğar?", d: "Batıdan", y: ["Doğudan", "Kuzeyden"], a: "Venüs ters yönde döndüğü için orada Güneş batıdan doğar." },
  { id: "venus-4", k: "Uzay", s: "Venüs'ün bulutları neden oluşur?", d: "Sülfürik asitten", y: ["Su buharından", "Buz kristallerinden"], a: "Atmosferi neredeyse tamamen karbondioksit, bulutları sülfürik asit. Yüzey kurşunu eritecek kadar sıcak." },
  // dunya-dursaydi
  { id: "dunya-dursaydi-2", k: "Uzay", s: "Dünya bir anda dursa, üstündeki şeylere ne olurdu?", d: "Dönmeye devam edip doğuya fırlarlardı", y: ["Hemen dururlardı", "Uzaya uçarlardı"], a: "Dünya dursa bile insanlar, binalar, denizler ve hava doğuya doğru hareket etmeye devam ederdi." },
  { id: "dunya-dursaydi-3", k: "Uzay", s: "Dünya'yı bir anda durduracak bilinen bir kuvvet var mı?", d: "Hayır, yok", y: ["Evet, büyük bir göktaşı", "Evet, Ay'ın çekimi"], a: "Dünya'yı bir anda durduracak bilinen hiçbir kuvvet yok." },
  { id: "dunya-dursaydi-4", k: "Uzay", s: "Kasırgada ölçülen en güçlü rüzgâr, ekvatordaki dönüş hızının ne kadarı?", d: "Yaklaşık dörtte biri", y: ["İki katı", "Yarısı"], a: "Ekvatorda dönüş hızı saatte 1.670 kilometreyi aşar." },
  // gps
  { id: "gps-2", k: "Uzay", s: "Telefonun GPS ile konumunu nasıl bulur?", d: "Sinyalin uydudan gelme süresini ölçerek", y: ["Baz istasyonlarına sorarak", "Pusulayla"], a: "Bu süreyi çok hassas saatlerle ölçülen zaman sayesinde hesaplar." },
  { id: "gps-3", k: "Uzay", s: "Uydulardaki saatler yerçekimi yüzünden nasıl çalışır?", d: "Dünya'dakilerden biraz hızlı", y: ["Dünya'dakilerden biraz yavaş", "Tamamen aynı"], a: "Zayıf yerçekimi saatleri hızlandırır, yüksek hız ise biraz yavaşlatır. Toplamda günde yaklaşık 38 mikrosaniye öne geçerler." },
  { id: "gps-4", k: "Uzay", s: "GPS'in doğru çalışması hangi bilimsel teoriye dayanır?", d: "Görelilik", y: ["Evrim", "Kuantum dolanıklığı"], a: "Uydu saatleri görelilik hesaba katılarak ayarlanıyor." },
  // mevsim
  { id: "mevsim-2", k: "Uzay", s: "Dünya Güneş'e yılın hangi döneminde en yakındır?", d: "Ocak başında", y: ["Temmuzda", "Ekimde"], a: "Ocakta temmuza göre yaklaşık yüzde 7 fazla ışık alırız, ama bu fark mevsimleri belirleyecek kadar büyük değil." },
  { id: "mevsim-3", k: "Uzay", s: "Dünya'nın ekseni yaklaşık kaç derece eğik?", d: "23,5 derece", y: ["45 derece", "5 derece"], a: "Eksen yıl boyunca aynı yöne bakar; yarım kürelerden biri ışığı dik alırken öteki eğik alır." },
  { id: "mevsim-4", k: "Uzay", s: "Eksen hiç eğik olmasaydı ne olurdu?", d: "Mevsimler olmazdı", y: ["Her yer hep kış olurdu", "Günler iki kat uzardı"], a: "Her yer yıl boyunca hemen hemen aynı havayı yaşar, gece ile gündüz de çoğu yerde eşit olurdu." },
  // manyetik
  { id: "manyetik-2", k: "Uzay", s: "Güneş'in uzaya savurduğu yüklü parçacıklara ne denir?", d: "Güneş rüzgârı", y: ["Güneş lekesi", "Kozmik toz"], a: "Dünya'nın manyetik alanı bu rüzgârın büyük kısmını gezegenin etrafından saptırır." },
  { id: "manyetik-3", k: "Uzay", s: "Kutup ışıkları nasıl oluşur?", d: "Kutuplara yönelen parçacıklar havayı parlatır", y: ["Buz Güneş ışığını yansıtır", "Yıldırımlar gökyüzünü boyar"], a: "Manyetik alan parçacıkları kutuplara yönlendirir; orada havayı parlatırlar." },
  { id: "manyetik-4", k: "Uzay", s: "Hangi hayvanlar yön bulmak için manyetik alanı kullanır?", d: "Bazı kuşlar ve deniz kaplumbağaları", y: ["Köpekler ve kediler", "Arılar ve karıncalar"], a: "Bazı kuşlar ve deniz kaplumbağaları Dünya'nın manyetik alanından yön alır." },
  // ses
  { id: "ses-2", k: "Uzay", s: "Ses havada saniyede yaklaşık kaç metre gider?", d: "Yaklaşık 340 metre", y: ["Yaklaşık 3 metre", "Yaklaşık 300 bin kilometre"], a: "Ses, havadaki moleküllerin birbirini itmesiyle ilerleyen bir titreşimdir." },
  { id: "ses-3", k: "Uzay", s: "Ses suda havaya göre nasıl gider?", d: "Yaklaşık 4 kat hızlı", y: ["Daha yavaş", "Hiç gitmez"], a: "Ses suda havadakinden yaklaşık dört kat hızlı yayılır." },
  { id: "ses-4", k: "Uzay", s: "Astronotlar uzayda nasıl konuşur?", d: "Telsizle", y: ["Bağırarak", "Kask camına vurarak"], a: "Uzay neredeyse boş olduğu için ses yayılamaz; telsiz radyo dalgalarıyla çalışır." },
  // yildiz
  { id: "yildiz-2", k: "Uzay", s: "Denizciler yüzyıllarca okyanusta yönünü nasıl buldu?", d: "Yıldızlara bakarak", y: ["Dalgaları sayarak", "Suyun rengine bakarak"], a: "Yıldızlar binlerce yıl boyunca insanlığın haritasıydı." },
  { id: "yildiz-3", k: "Uzay", s: "Eski toplumlar ekim ve hasat zamanını neye göre belirledi?", d: "Yıldızların konumuna göre", y: ["Ay tutulmalarına göre", "Kuşların sesine göre"], a: "Gökyüzü eski toplumların takvimiydi. Gökbilim de yıldızlara duyulan merakla başladı." },
  // sera
  { id: "sera-2", k: "Uzay", s: "Hangisi bir sera gazıdır?", d: "Su buharı", y: ["Oksijen", "Azot"], a: "Su buharı, karbondioksit ve metan, yerin geri yaydığı ısının bir kısmını tutar." },
  { id: "sera-3", k: "Uzay", s: "Sera etkisi bugün Dünya'yı yaklaşık kaç derece ısıtıyor?", d: "33 derece", y: ["3 derece", "100 derece"], a: "Ortalama eksi 18 yerine artı 15 derece. Sorun sera etkisinin kendisi değil, onu hızla artırmamız." },

  // ---------- Dünya ----------
  // bulut
  { id: "bulut-2", k: "Dünya", s: "Bulutlar gündüz ne yapar?", d: "Güneş ışığının bir kısmını uzaya yansıtır", y: ["Havayı ısıtır", "Rüzgârı durdurur"], a: "Bu yüzden bulutlu günler daha serin geçer." },
  { id: "bulut-3", k: "Dünya", s: "Hiç bulut olmasaydı ne olmazdı?", d: "Yağmur, kar ve dolu", y: ["Rüzgâr", "Gökkuşağı dışında her şey olurdu"], a: "Bulutsuz bir gökyüzü yağmursuz bir gökyüzü demek; günler daha sıcak, geceler daha soğuk olurdu." },
  // buz
  { id: "buz-2", k: "Dünya", s: "Buz sudan yaklaşık ne kadar hafiftir?", d: "Yaklaşık yüzde 9", y: ["Yaklaşık yarı yarıya", "Hiç hafif değil"], a: "Su donunca genişler, bu yüzden buz kendi sıvısında yüzer." },
  { id: "buz-3", k: "Dünya", s: "Buz batsaydı göller nasıl donardı?", d: "Dipten yukarı doğru", y: ["Yüzeyden aşağı doğru", "Hiç donmazdı"], a: "Her donan katman dibe çökerdi; bazı göller tamamen buz olabilirdi." },
  { id: "buz-4", k: "Dünya", s: "Balıklar donmuş bir gölde kışı nerede geçirir?", d: "Buzun altındaki suda", y: ["Buzun içinde donarak", "Göçerek"], a: "Üstteki buz örtüsü alttaki suyu soğuktan korur." },
  // buzul
  { id: "buzul-2", k: "Dünya", s: "Dünyadaki tatlı suyun büyük kısmı nerede saklanıyor?", d: "Buz olarak", y: ["Nehirlerde", "Göllerde"], a: "Tatlı suyun büyük kısmı buzullarda ve buz tabakalarında." },
  { id: "buzul-3", k: "Dünya", s: "Buz eriyince gezegen neden daha çok ısınır?", d: "Beyaz yüzey ışığı daha az yansıtır", y: ["Eriyen buz ısı yayar", "Deniz suyu tuzlanır"], a: "Beyaz buz Güneş ışığını yansıtır; eridiğinde koyu yüzeyler daha çok ısı emer." },
  { id: "buzul-4", k: "Dünya", s: "Bütün buzların tamamen erimesi ne kadar sürer?", d: "Binlerce yıl", y: ["Birkaç ay", "On yıl"], a: "Bir anda olmaz. Ama bugün buzullar ölçülebilir bir hızla küçülüyor." },
  // dag
  { id: "dag-2", k: "Dünya", s: "Dünyanın büyük nehirlerinin çoğu nereden doğar?", d: "Dağlardan", y: ["Göllerden", "Okyanuslardan"], a: "Dağlardaki kar ve buzullar yıl boyunca nehirleri besler." },
  { id: "dag-3", k: "Dünya", s: "Dağlar olmasa yağmurlar nasıl dağılırdı?", d: "Daha düzensiz", y: ["Daha eşit", "Hiç değişmezdi"], a: "Dağlar rüzgârları ve iklimi şekillendirir; dağsız bir Dünya'da birçok şehir susuz kalırdı." },
  // kar
  { id: "kar-2", k: "Dünya", s: "Kar örtüsü bitkiler için ne işe yarar?", d: "Toprağı dondurucu soğuktan korur", y: ["Bitkileri dondurur", "Hiçbir işe yaramaz"], a: "Kar battaniye gibi örter; birçok küçük hayvan da kışı karın altındaki tünellerde geçirir." },
  { id: "kar-3", k: "Dünya", s: "Kar olmasaydı yazın nehirlere ne olurdu?", d: "Birçoğu çok daha erken kururdu", y: ["Taşardı", "Hiçbir şey olmazdı"], a: "Dağlardaki kar baharda yavaş yavaş eriyerek nehirleri besler." },
  // kum
  { id: "kum-2", k: "Dünya", s: "Sudan sonra en çok kullandığımız doğal kaynak hangisi?", d: "Kum ve çakıl", y: ["Petrol", "Demir"], a: "Her yıl yaklaşık 50 milyar ton kum ve çakıl kullanıyoruz." },
  { id: "kum-3", k: "Dünya", s: "Telefonundaki çiplerin silisyumu nereden gelir?", d: "Kumdan", y: ["Altından", "Tuzdan"], a: "Beton, cam ve çiplerdeki silisyum kumdan gelir." },
  // okyanus
  { id: "okyanus-2", k: "Dünya", s: "Okyanuslar, insanların saldığı karbondioksitin yaklaşık ne kadarını yuttu?", d: "Yaklaşık dörtte birini", y: ["Hepsini", "Neredeyse hiç"], a: "Okyanuslar ayrıca küresel ısınmanın getirdiği fazla ısının yaklaşık yüzde 90'ını emdi." },
  { id: "okyanus-3", k: "Dünya", s: "Yağmurun büyük kısmı nereden gelir?", d: "Okyanuslardan buharlaşan sudan", y: ["Göllerden", "Bitkilerin terlemesinden"], a: "Okyanussuz bir Dünya, sıcak ve kuru bir çöl olurdu." },
  // ozon
  { id: "ozon-2", k: "Dünya", s: "Ozon tabakası neyi emer?", d: "Zararlı morötesi ışınların çoğunu", y: ["Karbondioksiti", "Radyo dalgalarını"], a: "Morötesi ışınlar deride yanık ve kansere, gözde hasara yol açabilir." },
  { id: "ozon-3", k: "Dünya", s: "Ülkeler ozonu incelten gazları yasaklamak için hangi yıl anlaştı?", d: "1987", y: ["1957", "2015"], a: "Seksenlerde ozon tabakasında büyük bir delik fark edildi; anlaşmadan sonra tabaka iyileşmeye başladı." },
  // plaka
  { id: "plaka-2", k: "Dünya", s: "Himalayalar nasıl yükseldi?", d: "İki kıtanın çarpışmasıyla", y: ["Bir volkan patlamasıyla", "Buzulların taşımasıyla"], a: "Himalayalar, iki kıtanın milyonlarca yıldır çarpışmasıyla yükseldi." },
  { id: "plaka-3", k: "Dünya", s: "Kıtalar hareket etmeseydi dağlara ne olurdu?", d: "Zamanla aşınıp düzleşirlerdi", y: ["Sonsuza dek büyürlerdi", "Hiç değişmezlerdi"], a: "Yer kabuğu hareket ettikçe yeni kayalar yüzeye çıkar, karbon ve mineraller dolaşır." },
  // ruzgar
  { id: "ruzgar-2", k: "Dünya", s: "Rüzgâr ısıyı nasıl dağıtır?", d: "Ekvatorun sıcağını kutuplara taşır", y: ["Isıyı uzaya atar", "Isıyı toprağa gömer"], a: "Rüzgârsız bir Dünya'da ekvator daha sıcak, kutuplar daha soğuk olurdu." },
  { id: "ruzgar-3", k: "Dünya", s: "Karahindiba tohumlarını ne yayar?", d: "Rüzgâr", y: ["Karıncalar", "Su"], a: "Rüzgâr bazı tohumları kilometrelerce uzağa savurur." },
  // surtunme
  { id: "surtunme-2", k: "Dünya", s: "Sürtünme olmasa vidalara ve düğümlere ne olurdu?", d: "Gevşer ve çözülürlerdi", y: ["Daha sıkı tutarlardı", "Hiçbir şey olmazdı"], a: "Dikiş iplikleri bile kumaşı tutamazdı." },
  { id: "surtunme-3", k: "Dünya", s: "Sürtünmesiz bir dünyada itilen top ne yapardı?", d: "Bir yere çarpana kadar giderdi", y: ["Hemen dururdu", "Yerinde dönerdi"], a: "Onu yavaşlatacak bir kuvvet kalmazdı." },
  // toz
  { id: "toz-2", k: "Dünya", s: "Gökyüzünü mavi yapan nedir?", d: "Havadaki gaz molekülleri", y: ["Havadaki toz", "Okyanusun yansıması"], a: "Toz gökyüzünün rengini yapmaz. Asıl etkisi bulutlarda: bulut damlaları minicik parçacıkların etrafında oluşur." },
  { id: "toz-3", k: "Dünya", s: "Sahra tozundaki hangi madde Amazon toprağını besler?", d: "Fosfor", y: ["Altın", "Tuz"], a: "Yağmurların yıkadığı toprağı Sahra'dan gelen fosfor yeniden besler." },
  // volkan
  { id: "volkan-2", k: "Dünya", s: "Hawaii ve İzlanda nasıl oluştu?", d: "Volkanlar denizden yükseltti", y: ["Kıtalardan koptular", "Mercanlar ördü"], a: "Bu adalar volkanların denizden yükselttiği karalardır." },
  { id: "volkan-3", k: "Dünya", s: "Volkanik küller zamanla neye dönüşür?", d: "Çok verimli topraklara", y: ["Çöl kumuna", "Kömüre"], a: "Volkanik toprak dünyanın en verimli topraklarından bazılarıdır." },
  { id: "volkan-4", k: "Dünya", s: "Volkanlar iklimde nasıl bir rol oynar?", d: "Karbonu havaya geri vererek termostat gibi", y: ["Gezegeni sürekli soğutur", "Hiçbir rolü yok"], a: "Bu döngü olmasa Dünya milyonlarca yıl içinde giderek soğuyabilirdi." },
  // yagmur
  { id: "yagmur-2", k: "Dünya", s: "Yağmur havaya ne yapar?", d: "Tozu ve kirliliği yıkar", y: ["Havayı ısıtır", "Oksijeni azaltır"], a: "Yağmur ayrıca nehirleri, gölleri ve yeraltı sularını doldurur." },
  { id: "yagmur-3", k: "Dünya", s: "Hiç yağmur yağmasaydı hayat nereye sıkışırdı?", d: "Kıyılara ve kaynak sularına", y: ["Dağ zirvelerine", "Çöllerin ortasına"], a: "Nehirler kurur, karalar çöle dönerdi." },
];
