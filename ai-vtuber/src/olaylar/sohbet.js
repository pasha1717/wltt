// Sohbet mesajını anahtar kelime kurallarına göre bir replik grubuna eşler.
// Kısa kelimeler tam kelime olarak, 5+ harfli kelimeler ek alabilen kök olarak aranır.
// "=" ile başlayan kelime her zaman tam kelime aranır (ör. "=parti", "partiye" eşleşmez).
import { normalize } from '../filtre/filtre.js';

// "ı" filtrede ayrı tutulur; sohbette ise "nasılsın" = "nasilsin" kabul edilir.
const sade = (s) => normalize(s).replace(/ı/g, 'i');

export function derle(kurallar) {
  return kurallar.map(({ grup, kelimeler }) => ({
    grup,
    desenler: kelimeler.map((k) => {
      const tam = k.startsWith('=');
      const n = sade(tam ? k.slice(1) : k).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return new RegExp(`(?:^| )${n}${!tam && n.length >= 5 ? '' : '(?= |$)'}`);
    }),
  }));
}

export function eslestir(mesaj, derlenmis) {
  const m = sade(mesaj);
  if (!m) return null;
  for (const k of derlenmis) if (k.desenler.some((d) => d.test(m))) return k.grup;
  return null;
}
