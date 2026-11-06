// Live2D dosyalarını resmî kaynaklardan indirir (src/arayuz/public/vendor/, git dışında).
// - Cubism Core: cubism.live2d.com (Live2D Proprietary Software License, "Redistributable Code")
// - Haru: github.com/Live2D/CubismWebSamples (Free Material License; kullanım koşulları README'de)
// - pixi.js 6 ve pixi-live2d-display 0.4 (MIT): npm paketlerinin jsDelivr kopyası
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { KOK } from '../src/ayar.js';

const HEDEF = process.argv[2] ? path.resolve(process.argv[2]) : path.join(KOK, 'src', 'arayuz', 'public', 'vendor');
const HARU = 'https://raw.githubusercontent.com/Live2D/CubismWebSamples/b1de66b/Samples/Resources/Haru';
const TEKLER = {
  'live2dcubismcore.min.js': 'https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js',
  'pixi.min.js': 'https://cdn.jsdelivr.net/npm/pixi.js@6.5.10/dist/browser/pixi.min.js',
  'pixi-live2d-cubism4.min.js': 'https://cdn.jsdelivr.net/npm/pixi-live2d-display@0.4.0/dist/cubism4.min.js',
};

async function indir(url, dosya) {
  if (existsSync(dosya)) return false;
  const y = await fetch(url, { signal: AbortSignal.timeout(60_000) });
  if (!y.ok) throw new Error(`${url} → HTTP ${y.status}`);
  mkdirSync(path.dirname(dosya), { recursive: true });
  writeFileSync(dosya, Buffer.from(await y.arrayBuffer()));
  return true;
}

let sayi = 0;
for (const [ad, url] of Object.entries(TEKLER)) if (await indir(url, path.join(HEDEF, ad))) sayi++;

// Haru: model3.json'u indirip içinde geçen her dosyayı ve tüm hareket dosyalarını indir.
const haruDizin = path.join(HEDEF, 'Haru');
await indir(`${HARU}/Haru.model3.json`, path.join(haruDizin, 'Haru.model3.json'));
const model = JSON.parse(await (await fetch(`${HARU}/Haru.model3.json`)).text());
const fr = model.FileReferences;
const dosyalar = [fr.Moc, ...fr.Textures, fr.Physics, fr.Pose, fr.UserData, fr.DisplayInfo,
  ...(fr.Expressions ?? []).map((e) => e.File),
  ...Object.values(fr.Motions ?? {}).flat().flatMap((m) => [m.File, m.Sound])].filter(Boolean);
for (const f of new Set(dosyalar)) if (await indir(`${HARU}/${f}`, path.join(haruDizin, f))) sayi++;

console.log(`Live2D dosyaları hazır: ${HEDEF} (${sayi} yeni dosya).`);
