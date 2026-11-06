// İçerik denetimi: uzunluk, duygu/hareket adları, eksik gruplar, tekrar, yasak kelime, ses dosyaları.
import { yukle, tumReplikler, DUYGU_ETIKETI, HAREKETLER, sesMetni } from '../src/icerik.js';
import { kufurVarMi } from '../src/filtre/filtre.js';

const EN_UZUN = 80;
const ic = yukle();
const hepsi = tumReplikler(ic);
const hatalar = [];

for (const r of hepsi) {
  if (r.metin.length > EN_UZUN) hatalar.push(`${r.kategori}: ${r.metin.length} karakter > ${EN_UZUN}: "${r.metin}"`);
  if (!(r.duygu in DUYGU_ETIKETI)) hatalar.push(`${r.kategori}: bilinmeyen duygu "${r.duygu}"`);
  if (!HAREKETLER.includes(r.hareket)) hatalar.push(`${r.kategori}: bilinmeyen hareket "${r.hareket}"`);
  if (kufurVarMi(r.metin)) hatalar.push(`${r.kategori}: küfür listesine takıldı: "${r.metin}"`);
}
const idler = new Map();
for (const r of hepsi) {
  if (idler.has(r.id)) hatalar.push(`tekrar eden replik: "${r.metin}"`);
  idler.set(r.id, r);
}
const gerekli = new Set([
  ...ic.kurallar.map((k) => k.grup),
  ...Object.values(ic.aktiviteler.sakalar).flatMap((s) => [s.replik, s.sonra].filter(Boolean)),
  'acilis', 'selam', 'kapanis',
]);
for (const g of gerekli) if (!ic.gruplar[g]?.length) hatalar.push(`eksik replik grubu: ${g}`);
for (const k of ic.aktiviteler.hediye_kademeleri)
  for (const s of k.sakalar) if (!ic.aktiviteler.sakalar[s]) hatalar.push(`tanımsız şaka: ${s}`);

const karakter = hepsi.reduce((t, r) => t + sesMetni({ s: r.ham, d: r.duygu }).length, 0);
const sesli = hepsi.filter((r) => r.ses).length;
console.log(`Replik: ${hepsi.length} (grup ${Object.keys(ic.gruplar).length}, konu ${ic.konular.length})`);
console.log(`Ses üretimi için toplam karakter (etiketler dahil): ${karakter}`);
console.log(`En uzun replik: ${Math.max(...hepsi.map((r) => r.metin.length))} karakter`);
console.log(`Sesi hazır olan: ${sesli}/${hepsi.length}`);
if (hatalar.length) {
  console.log(`\nHATA (${hatalar.length}):\n- ` + hatalar.join('\n- '));
  process.exit(1);
}
console.log('Denetim geçti.');
