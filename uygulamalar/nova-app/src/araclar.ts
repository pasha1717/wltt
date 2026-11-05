// Claude'un telefonda iş yapmak için çağırdığı araçlar.
import type Anthropic from "@anthropic-ai/sdk";
import { Linking } from "react-native";
import * as Location from "expo-location";
import { Contact, requestPermissionsAsync as rehberIzniIste } from "expo-contacts";
import { bekleyenler, hatirlaticiKur, iptalEt, zamanlayiciKur } from "./bildirim";
import { hafiza } from "./hafiza";

export type AracBaglami = { fenerAyarla: (acik: boolean) => void };

const nesne = (properties: Record<string, unknown>, required: string[]) =>
  ({ type: "object" as const, properties, required, additionalProperties: false });

export const araclar: Anthropic.Beta.BetaTool[] = [
  {
    name: "zamanlayici_kur",
    description: "Belirli bir süre sonra çalan zamanlayıcı kurar. Uygulama kapalıyken de bildirim gelir. Kullanıcı 'X dakika sonra haber ver' gibi bir şey isterse kullan.",
    strict: true,
    input_schema: nesne({
      saniye: { type: "integer", description: "Kaç saniye sonra çalacağı" },
      etiket: { type: "string", description: "Bildirimde görünecek kısa ad, örn. '5 dakika' ya da 'Çay'" },
    }, ["saniye", "etiket"]),
  },
  {
    name: "hatirlatici_kur",
    description: "Belirli bir tarih ve saatte hatırlatma bildirimi kurar. Göreli zamanları (yarın, akşam 8) kullanıcının mesajındaki şu anki zamana göre hesapla.",
    strict: true,
    input_schema: nesne({
      zaman: { type: "string", description: "Yerel saatle YYYY-MM-DDTHH:mm biçiminde, örn. 2026-11-06T09:00" },
      mesaj: { type: "string", description: "Bildirimde yazacak hatırlatma metni" },
    }, ["zaman", "mesaj"]),
  },
  {
    name: "bekleyen_hatirlatmalar",
    description: "Kurulu zamanlayıcı ve hatırlatmaları listeler. İptal etmeden önce id'yi bulmak için de kullan.",
    strict: true,
    input_schema: nesne({}, []),
  },
  {
    name: "hatirlatma_iptal",
    description: "Kurulu bir zamanlayıcı ya da hatırlatmayı id ile iptal eder.",
    strict: true,
    input_schema: nesne({ id: { type: "string" } }, ["id"]),
  },
  {
    name: "hava_durumu",
    description: "Şu anki hava durumu ve 3 günlük tahmin. Şehir verilmezse telefonun konumu kullanılır.",
    strict: true,
    input_schema: nesne({ sehir: { type: "string", description: "Şehir adı; kullanıcının bulunduğu yer için boş bırak" } }, ["sehir"]),
  },
  {
    name: "kisi_ara",
    description: "Rehberdeki bir kişiyi telefonla arar (arama ekranını açar). Birden çok eşleşme olursa listeyi döndürür; kullanıcıya hangisi olduğunu sor.",
    strict: true,
    input_schema: nesne({
      isim: { type: "string", description: "Rehberde aranacak ad, örn. 'Annem' ya da 'Ahmet'" },
      numara: { type: "string", description: "Birden çok numara/kişi varsa seçilen numara; yoksa boş bırak" },
    }, ["isim", "numara"]),
  },
  {
    name: "fener",
    description: "Telefonun fenerini açar ya da kapatır.",
    strict: true,
    input_schema: nesne({ acik: { type: "boolean" } }, ["acik"]),
  },
  {
    name: "hatirla",
    description: "Kullanıcı hakkında kalıcı bir bilgiyi kaydeder (adı, tercihleri, önemli kişiler). Kullanıcı açıkça bir şeyi hatırlamanı isterse ya da kendisi hakkında kalıcı bir bilgi verirse kullan.",
    strict: true,
    input_schema: nesne({ bilgi: { type: "string", description: "Tek cümlelik bilgi, örn. 'Kullanıcının adı Salih.'" } }, ["bilgi"]),
  },
  {
    name: "unut",
    description: "Kayıtlı bir bilgiyi siler. Metni kayıttaki haliyle aynen ver.",
    strict: true,
    input_schema: nesne({ bilgi: { type: "string" } }, ["bilgi"]),
  },
];

// WMO hava kodları
const havaKodu: Record<number, string> = {
  0: "açık", 1: "çoğunlukla açık", 2: "parçalı bulutlu", 3: "kapalı", 45: "sisli", 48: "kırağılı sis",
  51: "hafif çisenti", 53: "çisenti", 55: "yoğun çisenti", 61: "hafif yağmur", 63: "yağmur", 65: "kuvvetli yağmur",
  66: "dondurucu yağmur", 67: "kuvvetli dondurucu yağmur", 71: "hafif kar", 73: "kar", 75: "yoğun kar", 77: "kar taneleri",
  80: "hafif sağanak", 81: "sağanak", 82: "şiddetli sağanak", 85: "kar sağanağı", 86: "yoğun kar sağanağı",
  95: "gök gürültülü fırtına", 96: "dolulu fırtına", 99: "şiddetli dolulu fırtına",
};

async function getJson(url: string) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Hava servisi ${r.status} döndü.`);
  return r.json();
}

async function havaDurumu(sehir: string) {
  let lat: number, lon: number, yer: string;
  if (sehir.trim()) {
    const g = await getJson(`https://geocoding-api.open-meteo.com/v1/search?count=1&language=tr&name=${encodeURIComponent(sehir.trim())}`);
    const s = g.results?.[0];
    if (!s) return { hata: `"${sehir}" adında bir yer bulamadım.` };
    lat = s.latitude; lon = s.longitude; yer = [s.name, s.admin1, s.country].filter(Boolean).join(", ");
  } else {
    const izin = await Location.requestForegroundPermissionsAsync();
    if (!izin.granted) return { hata: "Konum izni verilmedi. Kullanıcıdan şehir adı iste." };
    const k = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    lat = k.coords.latitude; lon = k.coords.longitude; yer = "kullanıcının konumu";
  }
  const h = await getJson(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&timezone=auto&forecast_days=3` +
      "&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code" +
      "&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code",
  );
  return {
    yer,
    simdi: {
      sicaklik_c: h.current.temperature_2m, hissedilen_c: h.current.apparent_temperature,
      nem_yuzde: h.current.relative_humidity_2m, ruzgar_kmh: h.current.wind_speed_10m,
      durum: havaKodu[h.current.weather_code] ?? "bilinmiyor",
    },
    gunler: h.daily.time.map((t: string, i: number) => ({
      tarih: t, en_yuksek_c: h.daily.temperature_2m_max[i], en_dusuk_c: h.daily.temperature_2m_min[i],
      yagis_olasiligi_yuzde: h.daily.precipitation_probability_max[i], durum: havaKodu[h.daily.weather_code[i]] ?? "bilinmiyor",
    })),
  };
}

async function kisiAra(isim: string, numara: string) {
  if (numara.trim()) {
    await Linking.openURL(`tel:${numara.replace(/[^\d+]/g, "")}`);
    return { tamam: true, arandi: numara };
  }
  const izin = await rehberIzniIste();
  if (!izin.granted) return { hata: "Rehber izni verilmedi." };
  const kisiler = await Contact.getAll({ name: isim, limit: 5 });
  const adaylar: { ad: string; numara: string }[] = [];
  for (const k of kisiler) {
    const ad = await k.getFullName();
    for (const p of await k.getPhones()) if (p.number) adaylar.push({ ad, numara: p.number });
  }
  if (adaylar.length === 0) return { hata: `Rehberde "${isim}" için numara bulamadım.` };
  if (adaylar.length > 1) return { birden_cok: adaylar, not: "Kullanıcıya hangisini aramak istediğini sor." };
  await Linking.openURL(`tel:${adaylar[0].numara.replace(/[^\d+]/g, "")}`);
  return { tamam: true, arandi: adaylar[0] };
}

function yerelTarih(s: string): Date | null {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
}

type Girdi = Record<string, unknown>;
const str = (v: unknown) => (typeof v === "string" ? v : "");

export async function araciCalistir(ad: string, girdi: Girdi, bag: AracBaglami): Promise<unknown> {
  switch (ad) {
    case "zamanlayici_kur": {
      const sn = Number(girdi.saniye);
      if (!Number.isFinite(sn) || sn <= 0) return { hata: "Geçersiz süre." };
      const id = await zamanlayiciKur(sn, str(girdi.etiket) || "Zamanlayıcı");
      return { tamam: true, id };
    }
    case "hatirlatici_kur": {
      const t = yerelTarih(str(girdi.zaman));
      if (!t) return { hata: "Zaman YYYY-MM-DDTHH:mm biçiminde olmalı." };
      if (t.getTime() <= Date.now()) return { hata: "Bu zaman geçmişte kalıyor." };
      const id = await hatirlaticiKur(t, str(girdi.mesaj));
      return { tamam: true, id, zaman: t.toLocaleString("tr-TR") };
    }
    case "bekleyen_hatirlatmalar":
      return { liste: await bekleyenler() };
    case "hatirlatma_iptal":
      await iptalEt(str(girdi.id));
      return { tamam: true };
    case "hava_durumu":
      return havaDurumu(str(girdi.sehir));
    case "kisi_ara":
      return kisiAra(str(girdi.isim), str(girdi.numara));
    case "fener":
      bag.fenerAyarla(girdi.acik === true);
      return { tamam: true, fener: girdi.acik === true ? "açık" : "kapalı" };
    case "hatirla":
      await hafiza.bilgiEkle(str(girdi.bilgi));
      return { tamam: true };
    case "unut":
      await hafiza.bilgiSil(str(girdi.bilgi));
      return { tamam: true };
    default:
      return { hata: `Bilinmeyen araç: ${ad}` };
  }
}
