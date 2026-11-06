// Google Play uygulama içi satın alma: kredi paketleri (tüketilebilir) ve reklamsız sürüm (tek seferlik).
import {
  endConnection, fetchProducts, finishTransaction, getAvailablePurchases, initConnection,
  purchaseErrorListener, purchaseUpdatedListener, requestPurchase, restorePurchases,
  type Product, type Purchase,
} from "expo-iap";
import { KREDI_PAKETI, URUN } from "./yapilandirma";

export type Urun = { id: string; ad: string; fiyat: string };

type Dinleyiciler = {
  krediEkle: (miktar: number) => void;
  reklamlariKaldir: () => void;
  hata: (mesaj: string) => void;
};

let abonelikler: { remove: () => void }[] = [];

async function isle(p: Purchase, d: Dinleyiciler) {
  if (p.purchaseState !== "purchased") return; // bekleyen ödemeler tamamlanınca tekrar gelir
  const kredi = KREDI_PAKETI[p.productId];
  if (kredi) {
    await finishTransaction({ purchase: p, isConsumable: true });
    d.krediEkle(kredi);
  } else if (p.productId === URUN.reklamsiz) {
    await finishTransaction({ purchase: p, isConsumable: false });
    d.reklamlariKaldir();
  }
}

export type MagazaSonucu = { urunler: Urun[]; durum: string };

let bagli = false;

const hataYazisi = (e: unknown) => {
  const h = e as { code?: string; message?: string };
  return [h?.code, h?.message].filter(Boolean).join(": ") || String(e);
};

/**
 * Mağazaya bağlanır ve ürünleri getirir. Hata fırlatmaz; ürün gelmezse nedenini `durum` içinde döndürür.
 * Önceki/yarım satın almalar ayrıca işlenir, ürün listesini engellemez. Tekrar çağrılabilir.
 */
export async function magazayiBaslat(d: Dinleyiciler): Promise<MagazaSonucu> {
  try {
    if (!bagli) {
      await initConnection();
      bagli = true;
      abonelikler.forEach((a) => a.remove());
      abonelikler = [
        purchaseUpdatedListener((p) => { isle(p, d).catch(() => d.hata("Satın alma tamamlanamadı.")); }),
        purchaseErrorListener((e) => { if (e.code !== "user-cancelled") d.hata("Satın alma yapılamadı. Tekrar dene."); }),
      ];
      // Yarım kalmış ya da önceden yapılmış satın almalar (reklamsız sürüm geri yüklenir)
      getAvailablePurchases()
        .then(async (onceki) => { for (const p of onceki) await isle(p, d).catch(() => {}); })
        .catch(() => {});
    }
  } catch (e) {
    bagli = false;
    return { urunler: [], durum: `Google Play'e bağlanılamadı (${hataYazisi(e)})` };
  }

  try {
    const gelen = ((await fetchProducts({ skus: Object.values(URUN), type: "in-app" })) ?? []) as Product[];
    const urunler = gelen.filter((u) => !!u.displayPrice).map((u) => ({ id: u.id, ad: u.title, fiyat: u.displayPrice }));
    const eksik = Object.values(URUN).filter((id) => !urunler.some((u) => u.id === id));
    const durum = eksik.length === 0 ? "" : `Google Play'den gelmeyen ürünler: ${eksik.join(", ")}`;
    return { urunler, durum };
  } catch (e) {
    return { urunler: [], durum: `Ürünler alınamadı (${hataYazisi(e)})` };
  }
}

export const satinAl = (id: string) =>
  requestPurchase({ request: { google: { skus: [id] }, apple: { sku: id } }, type: "in-app" });

export async function geriYukle(d: Dinleyiciler) {
  await restorePurchases();
  for (const p of await getAvailablePurchases()) await isle(p, d).catch(() => {});
}

export function magazayiKapat() {
  abonelikler.forEach((a) => a.remove());
  abonelikler = [];
  bagli = false;
  endConnection().catch(() => {});
}
