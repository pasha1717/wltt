// Ayarlar: .env (bilgisayar) ve VERI/ayarlar.json (telefon uygulaması, ayarlar ekranından yazılır).
// Anahtar değerleri asla ekrana basılmaz; denetim yalnız "dolu/boş" yazar.
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// Yazılabilir veri klasörü: bilgisayarda proje kökü, telefonda uygulamanın veri klasörü (NESE_VERI).
export const VERI = process.env.NESE_VERI ? path.resolve(process.env.NESE_VERI) : KOK;
const ENV = path.join(KOK, '.env');
// process.loadEnvFile Node 20.12+; telefondaki Node 18'de .env zaten yok.
if (existsSync(ENV) && typeof process.loadEnvFile === 'function') process.loadEnvFile(ENV);

const AYAR_DOSYA = path.join(VERI, 'ayarlar.json');
const e = process.env;
const sayiListesi = (s, v) => String(s || v).split(',').map(Number).filter((n) => n > 0);

export const ayar = {
  testModu: (e.TEST_MODU ?? '1') !== '0',
  port: Number(e.PORT || 3900),
  host: '127.0.0.1',
  tiktokKullanici: (e.TIKTOK_KULLANICI || '').replace(/^@/, ''),
  begeniHedefleri: sayiListesi(e.BEGENI_HEDEFLERI, '5,10,20,30'),
  sessizlikSn: Number(e.SESSIZLIK_SN || 40),
  obsSifre: e.OBS_SIFRE || '',
  eleven: { anahtar: e.ELEVENLABS_API_KEY || '', ses: e.ELEVEN_SES_ID || '', model: e.ELEVEN_MODEL || 'eleven_v3' },
};

// Ayarlar ekranından değiştirilebilen alanlar (gizli değer içermez).
const DUZENLENEBILIR = {
  tiktokKullanici: (v) => String(v || '').trim().replace(/^@/, '').slice(0, 40),
  begeniHedefleri: (v) => { const l = sayiListesi(v, '5,10,20,30').slice(0, 8).sort((a, b) => a - b); return l.length ? l : [5, 10, 20, 30]; },
  sessizlikSn: (v) => Math.min(600, Math.max(10, Number(v) || 40)),
  testModu: (v) => v === true || v === 'true' || v === '1',
};

function uygula(degisiklik) {
  for (const [k, v] of Object.entries(degisiklik)) if (DUZENLENEBILIR[k]) ayar[k] = DUZENLENEBILIR[k](v);
}
if (existsSync(AYAR_DOSYA)) { try { uygula(JSON.parse(readFileSync(AYAR_DOSYA, 'utf8'))); } catch { /* bozuk dosya: varsayılanlar */ } }

export const duzenlenebilirAyarlar = () => Object.fromEntries(Object.keys(DUZENLENEBILIR).map((k) => [k, ayar[k]]));

export function ayarKaydet(degisiklik) {
  uygula(degisiklik);
  mkdirSync(VERI, { recursive: true });
  writeFileSync(AYAR_DOSYA, JSON.stringify(duzenlenebilirAyarlar(), null, 1));
  return duzenlenebilirAyarlar();
}

const ANAHTARLAR = ['ELEVENLABS_API_KEY', 'ELEVEN_SES_ID', 'OBS_SIFRE', 'TIKTOK_KULLANICI'];
export const anahtarDurumu = () => Object.fromEntries(ANAHTARLAR.map((k) => [k,
  (k === 'TIKTOK_KULLANICI' ? ayar.tiktokKullanici : e[k]?.trim()) ? 'dolu' : 'boş']));

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(`.env dosyası: ${existsSync(ENV) ? 'var' : 'yok (.env.example dosyasını kopyala)'}`);
  for (const [k, v] of Object.entries(anahtarDurumu())) console.log(`  ${k.padEnd(20)} ${v}`);
  console.log(`  TEST_MODU            ${ayar.testModu ? 'açık' : 'kapalı'}`);
}
