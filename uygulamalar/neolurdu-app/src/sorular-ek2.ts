// Ek sorular (2/3): Doğa. Kaynak: ilgili videonun doğrulanmış metni (id öneki = video klasörü).
import type { Soru } from "./sorular";

export const EK2: Soru[] = [
  // arilar
  { id: "arilar-2", k: "Doğa", s: "\"Arılar yok olursa insanlığın dört yılı kalır\" sözünü Einstein mı söyledi?", d: "Buna dair hiçbir kanıt yok", y: ["Evet, 1940'ta", "Evet, ama 10 yıl dedi"], a: "Söz hem Einstein'a ait görünmüyor hem de doğru değil." },
  { id: "arilar-3", k: "Doğa", s: "Dünyadaki gıdanın ne kadarı arıya hiç ihtiyaç duymaz?", d: "Yarıdan fazlası", y: ["Neredeyse hiçbiri", "Yaklaşık onda biri"], a: "Buğday, pirinç ve mısır gibi temel ürünleri rüzgâr tozlaştırır." },
  { id: "arilar-4", k: "Doğa", s: "Arılar yok olsa hangisi çok azalırdı?", d: "Badem", y: ["Pirinç", "Buğday"], a: "Elma, badem, kiraz ve karpuz hayvan tozlaşmasına muhtaç." },
  // agac
  { id: "agac-2", k: "Doğa", s: "Dünyada yaklaşık kaç ağaç var?", d: "Yaklaşık 3 trilyon", y: ["Yaklaşık 3 milyar", "Yaklaşık 300 milyon"], a: "Bir çalışmaya göre insanlar her yıl yaklaşık 15 milyar ağaç kesiyor." },
  { id: "agac-3", k: "Doğa", s: "Tarımın başlangıcından bu yana ağaç sayısı ne oldu?", d: "Neredeyse yarıya indi", y: ["İki katına çıktı", "Hiç değişmedi"], a: "Ağaçlar havadaki karbonun büyük kısmını gövdelerinde saklar." },
  { id: "agac-4", k: "Doğa", s: "Karadaki türlerin büyük kısmı nerede yaşar?", d: "Ormanlarda", y: ["Çöllerde", "Dağ zirvelerinde"], a: "Ağaçlar yağmuru, toprağı ve hayatı bir arada tutar." },
  // ahtapot
  { id: "ahtapot-2", k: "Doğa", s: "Ahtapotun kaç kalbi var?", d: "Üç", y: ["Bir", "Sekiz"], a: "İkisi kanı solungaçlara, biri vücuda pompalar." },
  { id: "ahtapot-3", k: "Doğa", s: "Ahtapotun kanı ne renk?", d: "Mavi", y: ["Kırmızı", "Yeşil"], a: "Kanında bakır taşıyan bir protein var." },
  { id: "ahtapot-4", k: "Doğa", s: "Bir deneyde koparılmış ahtapot kolları ne kadar süre nesneleri tuttu?", d: "Bir saatten uzun", y: ["Birkaç saniye", "Hiç tutamadı"], a: "Her kol, dokunduğu şeyi kendi başına yoklayıp kavrayabiliyor." },
  // balina
  { id: "balina-2", k: "Doğa", s: "Ölen bir balinanın cesedine ne olur?", d: "Dibe batıp yıllarca canlıları besler", y: ["Hemen kıyıya vurur", "Yüzeyde kaybolur"], a: "Balinalar ayrıca karbonu okyanusun derinlerine taşır." },
  { id: "balina-3", k: "Doğa", s: "Balinasız bir okyanusta ne azalırdı?", d: "Yüzeydeki plankton", y: ["Dalgalar", "Tuz"], a: "Yüzey daha az beslenir, bu da bütün besin zincirini etkilerdi." },
  // kakao
  { id: "kakao-2", k: "Doğa", s: "Kakao ağacının çiçekleri nerede açar?", d: "Gövdenin üstünde", y: ["Yalnızca dalların ucunda", "Toprağın altında"], a: "Çiçekler çok küçüktür ve gövdede açar." },
  { id: "kakao-3", k: "Doğa", s: "Kakaoyu tozlaştıran sinekler nerede ürer?", d: "Nemli orman tabanındaki çürüyen yapraklarda", y: ["Kuru kumda", "Ağaç tepelerinde"], a: "Sineksiz bir kakao bahçesinde neredeyse hiç meyve oluşmazdı." },
  // karinca
  { id: "karinca-2", k: "Doğa", s: "Karınca tünelleri toprağa ne yapar?", d: "Havalandırır ve suyun sızmasını sağlar", y: ["Toprağı kurutur", "Toprağı tuzlandırır"], a: "Karıncalar ölü böcekleri ve artıkları parçalayarak toprağı da besler." },
  { id: "karinca-3", k: "Doğa", s: "Binlerce bitki türü tohumlarını yaymak için hangi canlıya güvenir?", d: "Karıncalara", y: ["Balıklara", "Yarasalara"], a: "Karıncasız bir orman tohumlarını daha az yayardı." },
  // kopek
  { id: "kopek-2", k: "Doğa", s: "Köpekler insanlarla en az kaç yıldır birlikte yaşıyor?", d: "En az 15 bin yıl", y: ["Yaklaşık 500 yıl", "Yaklaşık 2 bin yıl"], a: "Avcılara iz sürmede ve av yakalamada yardım ettiler." },
  { id: "kopek-3", k: "Doğa", s: "Köpekler bugün hangi işte çalışıyor?", d: "Arama kurtarma ve görme engellilere rehberlik", y: ["Posta taşıma", "Tarlada çift sürme"], a: "Köpekler sürüleri korudu, yerleşimlerde bekçilik yaptı." },
  // kopekbaligi
  { id: "kopekbaligi-2", k: "Doğa", s: "Köpekbalıkları çoğunlukla hangi hayvanları avlar?", d: "Hasta, yaşlı ve zayıf olanları", y: ["En güçlü olanları", "Yalnızca insanları"], a: "Böylece balık sürülerinin sağlıklı kalmasına yardım ederler." },
  { id: "kopekbaligi-3", k: "Doğa", s: "Kim kime daha çok zarar veriyor?", d: "İnsanlar köpekbalıklarına", y: ["Köpekbalıkları insanlara", "İkisi eşit"], a: "Her yıl milyonlarca köpekbalığı avlanıyor." },
  // kurbaga
  { id: "kurbaga-2", k: "Doğa", s: "Son on yıllarda yüzlerce amfibi türünü ne azalttı?", d: "Bir mantar hastalığı", y: ["Kuraklık", "Yılanlar"], a: "Bazı yerlerde kurbağa sesleri zaten susmaya başladı." },
  { id: "kurbaga-3", k: "Doğa", s: "Kurbağalar yok olsa ne artardı?", d: "Böcekler", y: ["Balıklar", "Kuşlar"], a: "Kurbağalar her gece milyonlarca böcek yiyerek sivrisinekleri sınırlıyor." },
  // kurt
  { id: "kurt-2", k: "Doğa", s: "Kurtlar Yellowstone'a hangi yıl geri getirildi?", d: "1995", y: ["1925", "2015"], a: "Kurtlar yokken geyik sayısı artmış, geyikler kıyılardaki genç ağaçları bitirmişti." },
  { id: "kurt-3", k: "Doğa", s: "Söğütler geri gelince hangi hayvanlar döndü?", d: "Kunduzlar ve kuşlar", y: ["Ayılar ve aslanlar", "Kurbağalar ve yılanlar"], a: "Bilim insanları bu etkinin büyüklüğünü hâlâ tartışıyor." },
  // kuslar
  { id: "kuslar-2", k: "Doğa", s: "Dünyada kaç kuş türü var?", d: "On binden fazla", y: ["Yaklaşık yüz", "Yaklaşık bin"], a: "Kuşlar doğanın en çalışkan taşıyıcılarından." },
  { id: "kuslar-3", k: "Doğa", s: "Meyve yiyen kuşlar ormanlara nasıl yardım eder?", d: "Tohumları uzağa taşıyarak", y: ["Ağaçları budayarak", "Toprağı kazarak"], a: "Sinek kuşları gibi türler de birçok çiçeği tozlaştırır." },
  // mantar
  { id: "mantar-2", k: "Doğa", s: "Mantarlar bitkilere su ve besin taşıyınca karşılığında ne alır?", d: "Şeker", y: ["Oksijen", "Tuz"], a: "Topraktaki mantar iplikleri ormanın görünmeyen ağıdır." },
  { id: "mantar-3", k: "Doğa", s: "Ekmeği kabartan maya ne tür bir canlıdır?", d: "Mantar", y: ["Bakteri", "Bitki"], a: "İlk antibiyotik penisilin de bir mantardan geldi." },
  // mercan
  { id: "mercan-2", k: "Doğa", s: "Mercanlar aslında nedir?", d: "Minicik hayvanların ördüğü kireç yapılar", y: ["Renkli taşlar", "Deniz bitkileri"], a: "Binlerce balık türü yavrularını resiflerde büyütür." },
  { id: "mercan-3", k: "Doğa", s: "Resifler kıyıları nasıl korur?", d: "Dalgaların gücünü kırarak", y: ["Suyu ısıtarak", "Kumu hapsederek"], a: "Milyonlarca insan besin ve geçim için de resiflere bağlıdır." },
  // ot
  { id: "ot-2", k: "Doğa", s: "Hangisi de buğdaygiller ailesindendir?", d: "Bambu", y: ["Patates", "Fasulye"], a: "Şeker kamışı ve bambu da otlar ailesinin üyesi; ailede on binden fazla tür var." },
  { id: "ot-3", k: "Doğa", s: "Otlaklar, buzla kaplı olmayan karaların ne kadarını kaplar?", d: "Üçte birinden fazlasını", y: ["Yüzde birini", "Neredeyse tamamını"], a: "İnekler ve koyunlar otla beslendiği için et ve süt de dolaylı olarak otlara bağlı." },
  // plankton
  { id: "plankton-2", k: "Doğa", s: "Deniz besin zincirinin tabanında ne var?", d: "Bitkisel planktonlar", y: ["Köpekbalıkları", "Yosunlu kayalar"], a: "Krilden balinaya pek çok canlı onlarla beslenir." },
  { id: "plankton-3", k: "Doğa", s: "Okyanusun ürettiği oksijenin ne kadarını yine okyanus tüketir?", d: "Neredeyse aynı kadarını", y: ["Hiçbirini", "Yarısını"], a: "Yine de planktonlar yok olsaydı deniz yaşamının çoğu açlıktan çökebilirdi." },
  // sivrisinek
  { id: "sivrisinek-2", k: "Doğa", s: "En çok insan öldüren hayvan hangisi?", d: "Sivrisinek", y: ["Köpekbalığı", "Yılan"], a: "Sıtmayı insana bulaştıran sivrisinektir." },
  { id: "sivrisinek-3", k: "Doğa", s: "Sivrisineklerin asıl besini ne?", d: "Çiçek nektarı", y: ["Kan", "Yaprak"], a: "Kanı yalnız dişiler, yumurtaları için emer." },
  { id: "sivrisinek-4", k: "Doğa", s: "Bütün sivrisinekler yok olsa, bilim insanlarının çoğuna göre doğa ne yapardı?", d: "Boşluğu büyük ölçüde doldururdu", y: ["Tamamen çökerdi", "Bütün kuşlar ölürdü"], a: "Yine de bazı balıklar ve kuşlar bir besini, bazı orkideler tozlaştırıcısını kaybederdi." },
  // solucan
  { id: "solucan-2", k: "Doğa", s: "Solucanlar toprağı nasıl karıştırır?", d: "Derindekini yukarı, üsttekini aşağı taşıyarak", y: ["Toprağı yiyip yok ederek", "Kazdıkları çukurları doldurarak"], a: "Tünelleri toprağa hava ve su taşır." },
  { id: "solucan-3", k: "Doğa", s: "Solucansız tarlalarda toprağa ne olurdu?", d: "Sertleşir, su zor sızardı", y: ["Daha verimli olurdu", "Hiç değişmezdi"], a: "Yapraklar da daha yavaş çürür, toprak daha yavaş beslenirdi." },
  // yarasa
  { id: "yarasa-2", k: "Doğa", s: "Bir yarasa tek gecede kaç sivrisinek boyutunda böcek yiyebilir?", d: "Binlerce", y: ["Birkaç tane", "Hiç yemez"], a: "Yarasalar tarımdaki zararlı böceklerin önemli bir kısmını yiyerek tarlaları korur." },
  { id: "yarasa-3", k: "Doğa", s: "Yarasalar karanlıkta nasıl yön bulur?", d: "Ses dalgalarıyla", y: ["Gece görüşüyle", "Kokuyla"], a: "Bu yetenek bilim insanlarına ilham verdi." },
  // mikrop
  { id: "mikrop-2", k: "Doğa", s: "Vücudunda kaç bakteri yaşar?", d: "Kabaca kendi hücrelerin kadar", y: ["Hiç yaşamaz", "Sadece birkaç tane"], a: "Vücudunda kabaca kendi hücrelerin kadar bakteri yaşıyor." },
  { id: "mikrop-3", k: "Doğa", s: "Havadaki azotu bitkilerin kullanabileceği hale kim getirir?", d: "Başta bakteriler", y: ["Rüzgâr", "Kuşlar"], a: "Bir değerlendirmeye göre mikroplar yok olsa bir yıl içinde fotosentez neredeyse durabilirdi." },
  // renk
  { id: "renk-2", k: "Doğa", s: "İnsan gözünde kaç tür renk hücresi var?", d: "Üç", y: ["Bir", "On iki"], a: "Kırmızıya, yeşile ve maviye en duyarlı olanlar." },
  { id: "renk-3", k: "Doğa", s: "Mantis karidesinin 12 tür renk hücresi var. Renkleri bizden iyi ayırt eder mi?", d: "Bir deneyde yakın renkleri daha kötü ayırt etti", y: ["Evet, çok daha iyi", "Hiç renk görmez"], a: "Daha çok hücre, daha iyi renk ayırımı anlamına gelmiyor." },
];
