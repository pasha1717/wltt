// www/nodejs klasörünü hazırlar: telefonda çalışacak Node projesi (sunucu + içerik + Live2D + TikTok okuyucu).
// Kullanım: node hazirla.mjs   (ardından: npx cap sync android && cd android && ./gradlew assembleDebug)
import { cpSync, rmSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BURASI = path.dirname(fileURLToPath(import.meta.url));
const PROJE = path.resolve(BURASI, '..');
const HEDEF = path.join(BURASI, 'www', 'nodejs');
const calistir = (k, cwd) => execSync(k, { cwd, stdio: 'inherit' });

if (!existsSync(path.join(PROJE, 'src/arayuz/public/vendor/Haru/Haru.model3.json'))) {
  console.log('Live2D dosyaları yok, resmî kaynaklardan indiriliyor...');
  calistir('node araclar/live2d-indir.js', PROJE);
}

rmSync(HEDEF, { recursive: true, force: true }); // yalnız bu betiğin ürettiği klasör
mkdirSync(HEDEF, { recursive: true });
cpSync(path.join(PROJE, 'src'), path.join(HEDEF, 'src'), {
  recursive: true,
  filter: (k) => !k.includes(`${path.sep}obs`), // OBS kurulumu telefonda yok
});
cpSync(path.join(PROJE, 'icerik'), path.join(HEDEF, 'icerik'), { recursive: true });
mkdirSync(path.join(HEDEF, 'sesler'));
cpSync(path.join(BURASI, 'nodejs-giris', 'index.js'), path.join(HEDEF, 'index.js'));
// Giriş CommonJS; src/ altındaki kod ESM.
writeFileSync(path.join(HEDEF, 'src', 'package.json'), JSON.stringify({ type: 'module' }) + '\n');
writeFileSync(path.join(HEDEF, 'package.json'), JSON.stringify({
  name: 'nese-telefon', private: true, main: 'index.js',
  dependencies: { 'tiktok-live-connector': '2.5.0' },
  // got@15 Node 20+ ister; telefondaki Node 18 için got@13 (Node 16+) kullanılır. Node 18'de denendi.
  overrides: { got: '13.0.0' },
}, null, 2) + '\n');
calistir('npm install --omit=dev --no-audit --no-fund --no-package-lock', HEDEF);
console.log('www/nodejs hazır.');
calistir('du -sh www/nodejs www/nodejs/node_modules www/nodejs/src/arayuz/public/vendor', BURASI);
