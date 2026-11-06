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

/** Mağazaya bağlanır, ürünleri getirir, bekleyen/önceki satın almaları işler. */
export async function magazayiBaslat(d: Dinleyiciler): Promise<Urun[]> {
  await initConnection();
  abonelikler.forEach((a) => a.remove());
  abonelikler = [
    purchaseUpdatedListener((p) => { isle(p, d).catch(() => d.hata("Satın alma tamamlanamadı.")); }),
    purchaseErrorListener((e) => { if (e.code !== "user-cancelled") d.hata("Satın alma yapılamadı. Tekrar dene."); }),
  ];
  // Yarım kalmış ya da önceden yapılmış satın almalar (reklamsız sürüm geri yüklenir)
  const onceki = await getAvailablePurchases();
  for (const p of onceki) await isle(p, d).catch(() => {});

  const urunler = (await fetchProducts({ skus: Object.values(URUN), type: "in-app" })) as Product[];
  // Play'de bulunmayan ya da etkin olmayan ürünler boş fiyatla döner; onları gösterme.
  return urunler.filter((u) => !!u.displayPrice).map((u) => ({ id: u.id, ad: u.title, fiyat: u.displayPrice }));
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
  endConnection().catch(() => {});
}
