// .env okuma ve anahtar denetimi. Değerler asla ekrana basılmaz.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const KOK = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENV = path.join(KOK, '.env');
if (existsSync(ENV)) process.loadEnvFile(ENV);

const e = process.env;
const sayiListesi = (s, v) => (s || v).split(',').map(Number).filter((n) => n > 0);

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

const ANAHTARLAR = ['ELEVENLABS_API_KEY', 'ELEVEN_SES_ID', 'OBS_SIFRE', 'TIKTOK_KULLANICI'];
export const anahtarDurumu = () =>
  Object.fromEntries(ANAHTARLAR.map((k) => [k, e[k] && e[k].trim() ? 'dolu' : 'boş']));

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  console.log(`.env dosyası: ${existsSync(ENV) ? 'var' : 'yok (.env.example dosyasını kopyala)'}`);
  for (const [k, v] of Object.entries(anahtarDurumu())) console.log(`  ${k.padEnd(20)} ${v}`);
  console.log(`  TEST_MODU            ${ayar.testModu ? 'açık' : 'kapalı'}`);
}
