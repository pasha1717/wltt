// Hazır replikleri yükler. Her repliğin kimliği metin + duygudan üretilen kısa bir hash'tir;
// ses dosyası da bu adla saklanır (sesler/<id>.mp3 ya da .wav). Metin değişirse ses yeniden üretilir.
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { KOK } from './ayar.js';

const oku = (ad) => JSON.parse(readFileSync(path.join(KOK, 'icerik', ad), 'utf8'));

export const DUYGU_ETIKETI = {
  neseli: '[cheerfully]', heyecanli: '[excited]', saskin: '[surprised]', korkmus: '[scared]',
  utangac: '[shyly]', sakin: '', uzgun: '[sad]',
};
export const HAREKETLER = ['bekle', 'sevinc', 'saskin', 'utanma', 'korku', 'elsalla', 'zipla', 'dusunme'];

export const sesId = (r) => createHash('sha256').update(`${r.d}|${r.s}`).digest('hex').slice(0, 12);
export const ekranMetni = (s) => s.replace(/\[[^\]]+\]\s*/g, '').trim();
export const sesMetni = (r) => `${DUYGU_ETIKETI[r.d] ?? ''} ${r.s}`.trim();

// Ses dosyası: ElevenLabs mp3 ya da VoxCPM2 wav (sesler/<id>.mp3|wav).
function sesDosyasi(id) {
  for (const uz of ['mp3', 'wav']) if (existsSync(path.join(KOK, 'sesler', `${id}.${uz}`))) return `/sesler/${id}.${uz}`;
  return null;
}

function hazirla(r, kategori) {
  const id = sesId(r);
  return { id, kategori, metin: ekranMetni(r.s), ham: r.s, duygu: r.d, hareket: r.h,
    ses: sesDosyasi(id) };
}

export function yukle() {
  const ham = oku('replikler.json');
  const gruplar = {};
  for (const [k, liste] of Object.entries(ham)) gruplar[k] = liste.map((r) => hazirla(r, k));
  const konular = oku('konular.json').map((k) => ({
    konu: k.konu, kaynak: k.kaynak || null, satirlar: k.satirlar.map((r) => hazirla(r, `konu_${k.konu}`)),
  }));
  return { gruplar, konular, kurallar: oku('sohbet-kurallari.json'), aktiviteler: oku('aktiviteler.json') };
}

export function tumReplikler(ic = yukle()) {
  return [...Object.values(ic.gruplar).flat(), ...ic.konular.flatMap((k) => k.satirlar)];
}
