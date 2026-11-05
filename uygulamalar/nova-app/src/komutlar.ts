// Model çağırmadan cihazda cevaplanan kısa komutlar: saat, tarih, zamanlayıcı.
const pad = (n: number) => String(n).padStart(2, "0");

const sayilar: Record<string, number> = {
  bir: 1, iki: 2, "üç": 3, "dört": 4, "beş": 5, "altı": 6, yedi: 7, sekiz: 8, dokuz: 9, on: 10,
  "on beş": 15, yirmi: 20, otuz: 30, "kırk": 40, elli: 50, "altmış": 60,
};

export type Zamanlayici = { saniye: number; etiket: string };
export type YerelCevap = { metin: string; zamanlayici?: Zamanlayici } | null;

export function yerelKomut(girdi: string): YerelCevap {
  const s = girdi.toLocaleLowerCase("tr");
  const d = new Date();
  if (/saat kaç|saati söyle/.test(s)) return { metin: `Saat ${pad(d.getHours())}:${pad(d.getMinutes())}.` };
  if (/(bugün|tarih).*(ne|kaç|günlerden)|hangi gün/.test(s)) {
    return { metin: "Bugün " + d.toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) + "." };
  }
  const m = s.match(/(\d+|on beş|[a-zçğıöşü]+)\s*(saniye|dakika|dk|saat)(lık|lik)?\s*.*(zamanlayıcı|alarm|hatırlat|sayaç)/);
  if (m) {
    const n = /^\d+$/.test(m[1]) ? Number(m[1]) : sayilar[m[1]];
    if (n) {
      const birim = m[2] === "dk" ? "dakika" : m[2];
      const carpan = birim === "saniye" ? 1 : birim === "saat" ? 3600 : 60;
      const etiket = `${n} ${birim}`;
      return { metin: `Tamam, ${etiket} sonra haber veririm.`, zamanlayici: { saniye: n * carpan, etiket } };
    }
  }
  return null;
}
