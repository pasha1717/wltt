// Oyun mantığı ve cihazda kalıcı ilerleme. İnternet ya da sunucu kullanmaz.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Kategori, Soru, SORULAR } from "./sorular";
import { KURALLAR } from "./yapilandirma";

export const GUNLUK_SORU = 5;
export const SERBEST_SORU = 10;

// Tarihe göre hep aynı sonucu veren basit rastgele sayı üreteci (günlük oyun herkes için aynı olsun).
function tohumlu(tohum: number) {
  let t = tohum >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const ozet = (s: string) => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261);

function karistir<T>(dizi: T[], rnd: () => number): T[] {
  const a = [...dizi];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const bugun = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dun = () => bugun(new Date(Date.now() - 864e5));

export type OyunSorusu = Soru & { secenekler: string[] };

function hazirla(sorular: Soru[], rnd: () => number): OyunSorusu[] {
  return sorular.map((s) => ({ ...s, secenekler: karistir([s.d, ...s.y], rnd) }));
}

export function gununSorulari(tarih = bugun()): OyunSorusu[] {
  const rnd = tohumlu(ozet("neolurdu-" + tarih));
  return hazirla(karistir(SORULAR, rnd).slice(0, GUNLUK_SORU), rnd);
}

export function serbestSorular(kategori: Kategori | null, bilinenler: string[]): OyunSorusu[] {
  const rnd = Math.random;
  const havuz = SORULAR.filter((s) => !kategori || s.k === kategori);
  // Önce henüz bilinmeyen sorular gelsin.
  const yeni = karistir(havuz.filter((s) => !bilinenler.includes(s.id)), rnd);
  const eski = karistir(havuz.filter((s) => bilinenler.includes(s.id)), rnd);
  return hazirla([...yeni, ...eski].slice(0, SERBEST_SORU), rnd);
}

// ---- Kalıcı ilerleme ----
export type Ilerleme = {
  bilinenler: string[]; // en az bir kez doğru bilinen soru id'leri
  gunluk: Record<string, boolean[]>; // tarih -> her sorunun doğru/yanlış sonucu
  seri: number;
  enIyiSeri: number;
  sonGun: string;
  hatirlatma: boolean;
  kredi: number; // = kazanilan - harcanan
  kazanilan: number; // başlangıç + satın alınan + ödül olarak kazanılan toplam kredi (hiç azalmaz)
  harcanan: number; // jokerle harcanan toplam kredi (hiç azalmaz)
  reklamsiz: boolean;
  oyunSayisi: number; // geçiş reklamı sıklığı için
  odullu: { tarih: string; sayi: number }; // bugün izlenen ödüllü reklam
};

const BOS: Ilerleme = {
  bilinenler: [], gunluk: {}, seri: 0, enIyiSeri: 0, sonGun: "", hatirlatma: false,
  kredi: KURALLAR.baslangicKredisi, kazanilan: KURALLAR.baslangicKredisi, harcanan: 0, reklamsiz: false, oyunSayisi: 0, odullu: { tarih: "", sayi: 0 },
};
const ANAHTAR = "neolurdu.ilerleme";

export async function ilerlemeOku(): Promise<Ilerleme> {
  try {
    const v = await AsyncStorage.getItem(ANAHTAR);
    if (!v) return BOS;
    const i = { ...BOS, ...JSON.parse(v) } as Ilerleme;
    // Sayaçlardan önceki sürümden gelen kayıt: mevcut bakiyeyi kazanılan say.
    if (typeof JSON.parse(v).kazanilan !== "number") { i.kazanilan = i.kredi; i.harcanan = 0; }
    return i;
  } catch {
    return BOS;
  }
}

export async function ilerlemeYaz(i: Ilerleme) {
  try { await AsyncStorage.setItem(ANAHTAR, JSON.stringify(i)); } catch {}
}

// Seri, bugün hâlâ geçerli mi? (Dün ya da bugün oynandıysa devam ediyor.)
export const guncelSeri = (i: Ilerleme) => (i.sonGun === bugun() || i.sonGun === dun() ? i.seri : 0);

export function sonucuKaydet(i: Ilerleme, sorular: OyunSorusu[], sonuclar: boolean[], gunlukMu: boolean): Ilerleme {
  const bilinen = new Set(i.bilinenler);
  sorular.forEach((s, n) => { if (sonuclar[n]) bilinen.add(s.id); });
  const yeni: Ilerleme = { ...i, bilinenler: [...bilinen], oyunSayisi: i.oyunSayisi + 1 };
  if (gunlukMu) {
    const t = bugun();
    if (!i.gunluk[t]) {
      Object.assign(yeni, krediEkle(i, KURALLAR.gunlukOdul));
      const seri = i.sonGun === dun() ? i.seri + 1 : i.sonGun === t ? i.seri : 1;
      yeni.seri = seri;
      yeni.enIyiSeri = Math.max(i.enIyiSeri, seri);
      yeni.sonGun = t;
    }
    yeni.gunluk = { ...i.gunluk, [t]: sonuclar };
  }
  return yeni;
}

export function paylasimMetni(sonuclar: boolean[], seri: number): string {
  const kareler = sonuclar.map((d) => (d ? "🟨" : "⬛")).join("");
  const dogru = sonuclar.filter(Boolean).length;
  const tarih = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long" });
  return `Ne Olurdu? · ${tarih}\n${kareler} ${dogru}/${sonuclar.length}\nSeri: ${seri} gün`;
}

export const bugunkuOdullu = (i: Ilerleme) => (i.odullu.tarih === bugun() ? i.odullu.sayi : 0);

// ---- Kredi: yalnız artan iki sayaçla tutulur, böylece cihazlar/bulut güvenle birleştirilebilir ----
export const krediEkle = (i: Ilerleme, n: number): Ilerleme =>
  ({ ...i, kazanilan: i.kazanilan + n, kredi: i.kazanilan + n - i.harcanan });
export const krediHarca = (i: Ilerleme, n: number): Ilerleme =>
  ({ ...i, harcanan: i.harcanan + n, kredi: i.kazanilan - (i.harcanan + n) });

/** Telefondaki ve buluttaki ilerlemeyi birleştirir. Hiçbir kazanım kaybolmaz, hiçbir şey iki kez sayılmaz. */
export function birlestir(yerel: Ilerleme, bulut: Ilerleme): Ilerleme {
  const gunluk = { ...bulut.gunluk };
  for (const [g, r] of Object.entries(yerel.gunluk)) if (!gunluk[g] || r.length >= gunluk[g].length) gunluk[g] = r;
  const seriKaynagi = (bulut.sonGun || "") > (yerel.sonGun || "") ? bulut : yerel;
  const odullu = yerel.odullu.tarih === bulut.odullu.tarih
    ? { tarih: yerel.odullu.tarih, sayi: Math.max(yerel.odullu.sayi, bulut.odullu.sayi) }
    : (yerel.odullu.tarih > bulut.odullu.tarih ? yerel.odullu : bulut.odullu);
  const kazanilan = Math.max(yerel.kazanilan, bulut.kazanilan ?? 0);
  const harcanan = Math.max(yerel.harcanan, bulut.harcanan ?? 0);
  return {
    ...yerel, // hatırlatma gibi cihaza özel ayarlar yerelden
    bilinenler: [...new Set([...yerel.bilinenler, ...bulut.bilinenler])],
    gunluk,
    seri: seriKaynagi.seri,
    sonGun: seriKaynagi.sonGun,
    enIyiSeri: Math.max(yerel.enIyiSeri, bulut.enIyiSeri),
    reklamsiz: yerel.reklamsiz || bulut.reklamsiz,
    oyunSayisi: Math.max(yerel.oyunSayisi, bulut.oyunSayisi),
    odullu,
    kazanilan,
    harcanan,
    kredi: kazanilan - harcanan,
  };
}

/** Bulut kaydından gelen JSON'u güvenle ilerlemeye çevirir (eksik alanlar varsayılanla dolar). */
export function buluttanOku(json: string): Ilerleme | null {
  try {
    const v = JSON.parse(json);
    if (!v || typeof v !== "object" || !Array.isArray(v.bilinenler)) return null;
    return { ...BOS, ...v, gunluk: v.gunluk ?? {}, odullu: v.odullu ?? BOS.odullu };
  } catch {
    return null;
  }
}
