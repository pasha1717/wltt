// VoxCPM2 (yerel, ücretsiz) ile ses üretimi için köprü.
// https://github.com/alexturkey/voxcpm2-turkce-ses-tasarimi (Apache-2.0)
//
//   node araclar/voxcpm.js hazirla [klasor] [--dene N]  # sesi olmayan replikleri metin.txt + sira.json olarak yazar
//   node araclar/voxcpm.js bol <cikti-klasoru> # okuma.wav'ı ozet.json'daki satır zamanlarına göre sesler/<id>.wav'a böler
//
// Arada VoxCPM2 kendi klasöründe çalıştırılır (araclar/voxcpm-uret.ps1 hepsini sırayla yapar):
//   .venv\Scripts\python.exe -m ses_tasarim.oku --ses <ses> --metin @<klasor>\metin.txt --cikti <cikti>
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { KOK } from '../src/ayar.js';
import { tumReplikler, ekranMetni } from '../src/icerik.js';

const SESLER = path.join(KOK, 'sesler');
const VARSAYILAN = path.join(KOK, 'kayitlar', 'voxcpm');
const PAY_SN = 0.04; // satır kenarlarında bırakılan küçük pay

// VoxCPM2 Türkçede rakam, tırnak ve kesme işaretini reddeder; v3 duygu etiketleri de okunmaz.
export function voxMetni(ham) {
  const s = ekranMetni(ham).replace(/[’‘'`´]/g, '').replace(/["“”„«»‹›]/g, '').replace(/\s+/g, ' ').trim();
  if (/\d/.test(s)) throw new Error(`rakam yazıyla yazılmalı: "${s}"`);
  return s;
}

export function hazirla(klasor = VARSAYILAN, dene = Infinity) {
  const eksik = tumReplikler().filter((r) => !r.ses).slice(0, dene);
  mkdirSync(klasor, { recursive: true });
  // Satır başına bir replik; "|| normal" 0,5 sn durak, bölerken kenar payı için yeterli boşluk bırakır.
  writeFileSync(path.join(klasor, 'metin.txt'), eksik.map((r) => `${voxMetni(r.ham)} || normal`).join('\n') + '\n');
  writeFileSync(path.join(klasor, 'sira.json'), JSON.stringify(eksik.map((r) => r.id)));
  return { klasor, adet: eksik.length, karakter: eksik.reduce((t, r) => t + voxMetni(r.ham).length, 0) };
}

// --- WAV (PCM) okuma/yazma: VoxCPM2 48 kHz, 16 bit, mono yazar ---------------
export function wavOku(tampon) {
  if (tampon.toString('ascii', 0, 4) !== 'RIFF' || tampon.toString('ascii', 8, 12) !== 'WAVE') throw new Error('WAV değil');
  let i = 12, bicim = null, veri = null;
  while (i + 8 <= tampon.length) {
    const ad = tampon.toString('ascii', i, i + 4), boy = tampon.readUInt32LE(i + 4);
    if (ad === 'fmt ') bicim = { kanal: tampon.readUInt16LE(i + 10), hiz: tampon.readUInt32LE(i + 12), bit: tampon.readUInt16LE(i + 22) };
    if (ad === 'data') veri = tampon.subarray(i + 8, i + 8 + boy);
    i += 8 + boy + (boy % 2);
  }
  if (!bicim || !veri) throw new Error('WAV içinde fmt/data yok');
  if (bicim.bit !== 16) throw new Error(`yalnız 16 bit PCM desteklenir (gelen ${bicim.bit} bit)`);
  return { ...bicim, veri };
}

export function wavYaz({ kanal, hiz, veri }) {
  const b = Buffer.alloc(44);
  b.write('RIFF', 0); b.writeUInt32LE(36 + veri.length, 4); b.write('WAVE', 8);
  b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(kanal, 22);
  b.writeUInt32LE(hiz, 24); b.writeUInt32LE(hiz * kanal * 2, 28); b.writeUInt16LE(kanal * 2, 32); b.writeUInt16LE(16, 34);
  b.write('data', 36); b.writeUInt32LE(veri.length, 40);
  return Buffer.concat([b, veri]);
}

export function bol(cikti, { klasor = VARSAYILAN, hedef = SESLER } = {}) {
  const ozet = JSON.parse(readFileSync(path.join(cikti, 'ozet.json'), 'utf8'));
  const sira = JSON.parse(readFileSync(path.join(klasor, 'sira.json'), 'utf8'));
  if (ozet.satirlar.length !== sira.length)
    throw new Error(`satır sayısı tutmuyor: ozet ${ozet.satirlar.length}, sıra ${sira.length}. metin.txt değişmiş olabilir; yeniden hazırla.`);
  const wav = wavOku(readFileSync(path.join(cikti, 'okuma.wav')));
  const ornekBoy = wav.kanal * 2, toplam = wav.veri.length / ornekBoy;
  mkdirSync(hedef, { recursive: true });
  const yazilan = [];
  ozet.satirlar.forEach((s, i) => {
    const bas = Math.max(0, Math.floor((s.t0 - PAY_SN) * wav.hiz));
    const son = Math.min(toplam, Math.ceil((s.t1 + PAY_SN) * wav.hiz));
    const dosya = path.join(hedef, `${sira[i]}.wav`);
    writeFileSync(dosya, wavYaz({ ...wav, veri: wav.veri.subarray(bas * ornekBoy, son * ornekBoy) }));
    yazilan.push({ id: sira[i], sn: +((son - bas) / wav.hiz).toFixed(2), metin: s.metin });
  });
  return { yazilan, supheli: ozet.supheli_satirlar ?? [] };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const arg = process.argv.slice(2);
  const dene = arg.includes('--dene') ? Number(arg.splice(arg.indexOf('--dene'), 2)[1]) || 3 : Infinity;
  const [komut, yol] = arg;
  try {
    if (komut === 'hazirla') {
      const r = hazirla(yol ? path.resolve(yol) : undefined, dene);
      console.log(`${r.adet} replik, ${r.karakter} karakter → ${path.join(r.klasor, 'metin.txt')}`);
    } else if (komut === 'bol' && yol) {
      const { yazilan, supheli } = bol(path.resolve(yol));
      console.log(`${yazilan.length} ses dosyası yazıldı (sesler/). Toplam ${yazilan.reduce((t, y) => t + y.sn, 0).toFixed(1)} sn.`);
      if (supheli.length) console.log(`Dinleyip kontrol et (hız kapısı), satır: ${supheli.join(', ')} → ${supheli.map((n) => yazilan[n - 1]?.id).join(', ')}`);
    } else {
      console.log('Kullanım: node araclar/voxcpm.js hazirla [klasor] | bol <cikti-klasoru>');
      process.exit(1);
    }
  } catch (e) { console.error('Hata:', e.message); process.exit(1); }
}
