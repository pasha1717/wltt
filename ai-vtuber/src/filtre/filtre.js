// Ekrana çıkan her ad ve mesaj buradan geçer.
// Küfür listesi: ooguz/turkce-kufur-karaliste (CC BY-SA 4.0), bkz. veri/ATIF.md.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const VERI = path.join(path.dirname(fileURLToPath(import.meta.url)), 'veri');
const EN_UZUN = 200;

// "ı" bilerek ayrı tutulur: "sıkı" ile "siki" farklı kelimelerdir.
const TR = { ç: 'c', ğ: 'g', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' };
const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', '@': 'a', $: 's', '!': 'i' };

// Metni eşleştirme biçimine çevirir: küçük harf, ç/ğ/ö/ş/ü sadeleşir, yalnız harf/rakam/boşluk.
export function normalize(s) {
  return s.toLocaleLowerCase('tr-TR')
    .replace(/[çğöşüâîû]/g, (h) => TR[h])
    .replace(/[013457@$!]/g, (h) => LEET[h])
    .replace(/[^a-zı0-9+\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
const tekrarSil = (k) => k.replace(/(.)\1{2,}/g, '$1');

function listeYukle() {
  const satirlar = (ad) => {
    const d = path.join(VERI, ad);
    return existsSync(d) ? readFileSync(d, 'utf8').split(/\r?\n/).map(normalize).filter(Boolean) : [];
  };
  const istisna = new Set(satirlar('istisnalar.txt'));
  // "a.q" gibi noktalı yazımlar normalize edilince boşluklu olur; boşluksuz biçimi de eklenir.
  return new Set(satirlar('kufur-listesi.txt').map((k) => k.replace(/ /g, '')).filter((k) => k && !istisna.has(k)));
}
const LISTE = listeYukle();
export const listeBoyutu = () => LISTE.size;

// Bir kelime küfür mü? Kısa kelimelerde tam eşleşme, uzunlarda kök + ek (ör. kökün sonuna ek).
function kotuKelime(k) {
  if (LISTE.has(k) || LISTE.has(tekrarSil(k))) return true;
  for (let n = k.length - 1; n >= 5; n--) if (LISTE.has(k.slice(0, n))) return true;
  return false;
}

export const kufurVarMi = (metin) => normalize(metin).split(' ').some(kotuKelime);

// Ekran için: küfürlü kelime *** olur, bağlantılar atılır, uzun metin kesilir.
export function temizle(metin, enUzun = EN_UZUN) {
  let s = String(metin ?? '')
    .replace(/[\u0000-\u001f\u007f​-‏‪-‮]/g, '')
    .replace(/\b(?:https?:\/\/|www\.)\S+/gi, '[bağlantı]')
    .replace(/\b[\w-]+\.(?:com|net|org|io|tv|gg|ly|me|tr|xyz)(?:\/\S*)?/gi, '[bağlantı]');
  s = s.split(/(\s+)/).map((p) => (p.trim() && kufurVarMi(p) ? '***' : p)).join('');
  if (s.length > enUzun) s = s.slice(0, enUzun - 1) + '…';
  return s.trim();
}

// İzleyici adı: küfürlüyse "bir izleyici", en fazla 24 karakter.
export function temizAd(ad) {
  const a = temizle(ad || '', 24);
  return !a || a.includes('***') || a.includes('[bağlantı]') ? 'bir izleyici' : a;
}
