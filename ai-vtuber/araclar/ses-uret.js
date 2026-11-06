// Tek seferlik ses üretimi: her repliği ElevenLabs v3 ile mp3'e çevirir (sesler/<id>.mp3).
// Var olan ses atlanır; metin değişirse kimlik değiştiği için yalnız o replik yeniden üretilir.
//   node araclar/ses-uret.js --kuru      # yalnız sayar, hiçbir istek atmaz
//   node araclar/ses-uret.js --dene 3    # ilk 3 eksik repliği üretir
//   node araclar/ses-uret.js             # tüm eksikleri üretir
// Anahtar ve ses kimliği yalnız .env'den okunur, ekrana basılmaz.
import { writeFileSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import { ayar, KOK } from '../src/ayar.js';
import { yukle, tumReplikler, sesMetni } from '../src/icerik.js';

const arg = process.argv.slice(2);
const kuru = arg.includes('--kuru');
const dene = arg.includes('--dene') ? Number(arg[arg.indexOf('--dene') + 1]) || 3 : Infinity;
const SESLER = path.join(KOK, 'sesler');
mkdirSync(SESLER, { recursive: true });

const hepsi = tumReplikler(yukle());
const eksik = hepsi.filter((r) => !r.ses);
const sec = eksik.slice(0, dene);
const karakter = sec.reduce((t, r) => t + sesMetni({ s: r.ham, d: r.duygu }).length, 0);
const fazlalar = readdirSync(SESLER).filter((f) => f.endsWith('.mp3') && !hepsi.some((r) => `${r.id}.mp3` === f));

console.log(`Replik ${hepsi.length}, sesi hazır ${hepsi.length - eksik.length}, eksik ${eksik.length}.`);
console.log(`Bu çalıştırmada üretilecek: ${sec.length} replik, ${karakter} karakter (model ${ayar.eleven.model}).`);
if (fazlalar.length) console.log(`Artık kullanılmayan ${fazlalar.length} ses dosyası var (silmek için --temizle).`);
if (arg.includes('--temizle')) { fazlalar.forEach((f) => unlinkSync(path.join(SESLER, f))); console.log('Kullanılmayan sesler silindi.'); }
if (kuru || !sec.length) process.exit(0);
if (!ayar.eleven.anahtar || !ayar.eleven.ses) {
  console.error('ELEVENLABS_API_KEY ve ELEVEN_SES_ID .env içinde dolu olmalı (npm run anahtarlar ile kontrol et).');
  process.exit(1);
}

const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
async function uret(r, deneme = 1) {
  const t0 = performance.now();
  const yanit = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(ayar.eleven.ses)}?output_format=mp3_44100_128`,
    {
      method: 'POST',
      headers: { 'xi-api-key': ayar.eleven.anahtar, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text: sesMetni({ s: r.ham, d: r.duygu }), model_id: ayar.eleven.model, language_code: 'tr' }),
      signal: AbortSignal.timeout(60_000),
    },
  );
  if (yanit.status === 429 && deneme < 4) { await bekle(2000 * deneme); return uret(r, deneme + 1); }
  if (!yanit.ok) throw new Error(`HTTP ${yanit.status}: ${(await yanit.text()).slice(0, 200)}`);
  writeFileSync(path.join(SESLER, `${r.id}.mp3`), Buffer.from(await yanit.arrayBuffer()));
  return Math.round(performance.now() - t0);
}

let tamam = 0;
for (const r of sec) {
  try {
    const ms = await uret(r);
    tamam++;
    console.log(`  ✓ ${r.id} (${ms} ms) ${r.metin}`);
  } catch (e) {
    console.error(`  ✗ ${r.id} ${r.metin}\n    ${e.message}`);
    if (/HTTP 40[13]/.test(e.message)) break; // anahtar/izin sorunu: devam etmenin anlamı yok
  }
}
console.log(`Üretilen: ${tamam}/${sec.length}.`);
process.exit(tamam === sec.length ? 0 : 1);
