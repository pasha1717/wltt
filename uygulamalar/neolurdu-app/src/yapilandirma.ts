// Yayından önce doldurulacak kimlikler. Boş bırakılan reklam kimlikleri Google'ın TEST kimliklerine düşer.
import { TestIds } from "react-native-google-mobile-ads";

// AdMob > Uygulamalar > Reklam birimleri. Örnek biçim: "ca-app-pub-1234567890123456/1234567890"
const ADMOB = {
  banner: "ca-app-pub-1392510782822078/9927420817",
  gecis: "ca-app-pub-1392510782822078/7047152783", // geçiş (interstitial)
  odullu: "ca-app-pub-1392510782822078/3855827323", // ödüllü (rewarded)
};

const gercek = (id: string) => !__DEV__ && id.length > 0;

export const REKLAM = {
  banner: gercek(ADMOB.banner) ? ADMOB.banner : TestIds.ADAPTIVE_BANNER,
  gecis: gercek(ADMOB.gecis) ? ADMOB.gecis : TestIds.INTERSTITIAL,
  odullu: gercek(ADMOB.odullu) ? ADMOB.odullu : TestIds.REWARDED,
};

// Google Play Console > Para kazanma > Ürünler > Uygulama içi ürünler (aynı kimliklerle oluşturulmalı)
export const URUN = {
  kredi20: "kredi_20",
  kredi100: "kredi_100",
  reklamsiz: "reklamsiz",
} as const;

export const KREDI_PAKETI: Record<string, number> = { [URUN.kredi20]: 20, [URUN.kredi100]: 100 };

export const KURALLAR = {
  baslangicKredisi: 5,
  gunlukOdul: 1, // günün sorularını bitirince
  reklamOdulu: 3, // ödüllü reklam başına
  gunlukReklamSiniri: 5,
  jokerBedeli: 1, // yarı yarıya: bir yanlış şıkkı siler
  gecisSikligi: 2, // her 2 oyunda bir geçiş reklamı
};

// Gizlilik politikasının yayınlanacağı adres (Play Console'a da aynı adres girilir).
export const GIZLILIK_URL = "https://example.com/ne-olurdu/gizlilik";
