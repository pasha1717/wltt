// Giriş noktası: içerik + olay yöneticisi + yerel sunucu + terminal + (TEST_MODU=0 ise) TikTok.
import { writeFileSync, readFileSync, existsSync, mkdirSync, appendFileSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { ayar, VERI, anahtarDurumu, ayarKaydet, duzenlenebilirAyarlar } from './ayar.js';
import { yukle, tumReplikler, sesDosyasi } from './icerik.js';
import { Yonetici } from './olaylar/yonetici.js';
import { sunucuKur } from './arayuz/sunucu.js';

const KAYIT = path.join(VERI, 'kayitlar');
mkdirSync(KAYIT, { recursive: true });
const IZLEYICI = path.join(KAYIT, 'izleyiciler.json');
const LOG = path.join(KAYIT, `olaylar-${new Date().toISOString().slice(0, 10)}.log`);
const log = (s) => { const satir = `${new Date().toISOString()} ${s}`; console.log(satir); appendFileSync(LOG, satir + '\n'); };

const icerik = yukle();
const hepsi = tumReplikler(icerik);
let kayitBekliyor = null;
const kaydet = (iz) => {
  clearTimeout(kayitBekliyor);
  kayitBekliyor = setTimeout(() => writeFileSync(IZLEYICI, JSON.stringify(iz, null, 1)), 2000);
};

let yayinla = () => {};
const y = new Yonetici({ icerik, ayar, yayinla: (m) => yayinla(m), kaydet });
let tiktokDurum = 'kapalı';
let tiktok = null;
const durum = () => ({ ...y.durum(), testModu: ayar.testModu, tiktok: tiktokDurum });

// TikTok bağlantısını ayarlara göre (yeniden) kurar: TEST_MODU kapalı ve kullanıcı adı varsa bağlanır.
async function tiktokYenile() {
  tiktok?.kapat();
  tiktok = null;
  tiktokDurum = 'kapalı';
  if (!ayar.testModu && ayar.tiktokKullanici) {
    const { tiktokBagla } = await import('./giris/tiktok.js');
    tiktok = tiktokBagla({ kullanici: ayar.tiktokKullanici, islet, log, durumBildir: (d) => { tiktokDurum = d; y.durumGonder(); } });
  }
  y.durumGonder();
}

// Telefon: ayarlar ekranından gelen ses dosyası. Yalnız bilinen replik kimlikleri ve geçerli WAV/MP3 kabul edilir.
const SES_DIZIN = path.join(VERI, 'sesler');
function sesKaydet(id, uzanti, veri) {
  const hedefler = hepsi.filter((r) => r.id === id);
  if (!hedefler.length) return { hata: `bilinmeyen replik: ${id}` };
  const wav = veri.subarray(0, 4).toString('ascii') === 'RIFF' && veri.subarray(8, 12).toString('ascii') === 'WAVE';
  const mp3 = veri.subarray(0, 3).toString('ascii') === 'ID3' || (veri[0] === 0xff && (veri[1] & 0xe0) === 0xe0);
  if (uzanti === 'wav' ? !wav : !mp3) return { hata: 'dosya geçerli bir ses değil' };
  mkdirSync(SES_DIZIN, { recursive: true });
  writeFileSync(path.join(SES_DIZIN, `${id}.${uzanti}`), veri);
  for (const r of hedefler) r.ses = sesDosyasi(id);
  return { tamam: true, id, sesli: hepsi.filter((r) => r.ses).length, toplam: hepsi.length };
}

// Panel ve terminal aynı komut biçimini kullanır.
function islet(o) {
  switch (o.tur) {
    case 'sohbet': log(`sohbet ${o.ad}: ${o.mesaj}`); return { cevap: y.sohbet(o)?.grup ?? null };
    case 'hediye': log(`hediye ${o.ad} ${o.elmas} elmas`); return { saka: y.hediye({ ...o, elmas: Number(o.elmas) || 1 }).saka };
    case 'begeni': return { tetik: y.begeniEkle(Number(o.adet) || 1) };
    case 'komut':
      if (o.ad === 'test_modu') { ayarKaydet({ testModu: !ayar.testModu }); log(`TEST_MODU ${ayar.testModu ? 'açık' : 'kapalı'}`); tiktokYenile(); return { testModu: ayar.testModu }; }
      log(`komut ${o.ad}`); y.komut(o.ad); return { tamam: true };
    case 'ses': yayinla({ tur: 'ses', sustur: !!o.sustur }); return { tamam: true };
    case 'ayarlar':
      if (o.degisiklik) {
        const a = ayarKaydet(o.degisiklik);
        // Hedef listesi değişmiş olabilir: döngü mevcut toplamdan yeniden başlar.
        Object.assign(y.begeni, { taban: y.begeni.toplam, hedefIndeks: 0 });
        y.sessizlikKur();
        log('ayarlar güncellendi');
        tiktokYenile();
        return a;
      }
      return duzenlenebilirAyarlar();
    case 'replikler': return hepsi.map((r) => ({ id: r.id, metin: r.metin, ses: !!r.ses }));
    case 'kapat': setTimeout(kapat, 100); return { tamam: true }; // durdur.ps1 kayıtları kaydettirerek kapatır
    default: throw new Error(`bilinmeyen tür: ${o.tur}`);
  }
}

let srv;
try {
  srv = await sunucuKur({ port: ayar.port, host: ayar.host, islet, durum, sesKaydet });
} catch (e) {
  console.error(e.code === 'EADDRINUSE' ? `Port ${ayar.port} kullanımda. Neşe zaten açık olabilir (durdur.ps1) ya da .env'de PORT değiştir.` : e.message);
  process.exit(1);
}
writeFileSync(path.join(KAYIT, 'nese.pid'), String(process.pid));
yayinla = (m) => {
  srv.yayinla(m.tur === 'durum' ? { ...m, testModu: ayar.testModu, tiktok: tiktokDurum } : m);
  if (m.tur === 'oynat') log(`oynat ${m.olay}${m.efekt ? '/' + m.efekt : ''}: ${m.replikler.map((r) => r.metin).join(' | ')}`);
};

const izleyiciler = existsSync(IZLEYICI) ? JSON.parse(readFileSync(IZLEYICI, 'utf8')) : {};
y.baslat(izleyiciler);

const sesli = hepsi.filter((r) => r.ses).length;
const anahtar = anahtarDurumu();
console.log(`\nNeşe hazır. Sahne: http://${ayar.host}:${ayar.port}/sahne  Overlay: /overlay  Panel: /panel`);
console.log(`Replik ${hepsi.length}, sesi hazır ${sesli}. TEST_MODU ${ayar.testModu ? 'açık' : 'kapalı'}. TikTok kullanıcı: ${anahtar.TIKTOK_KULLANICI}.`);
console.log('Terminal: mesaj yaz (ad: mesaj), /hediye <elmas>, /begeni <adet>, /saka <ad>, /acilis, /kapanis, /konu, /cikis\n');

await tiktokYenile();

// Telefonda (nodejs-mobile) process.stdin yoktur; erişim hata verebileceği için korunur.
let terminalVar = false;
try { terminalVar = !!process.stdin?.isTTY || process.env.TERMINAL_GIRIS === '1'; } catch { /* stdin yok */ }
if (terminalVar) {
  const rl = readline.createInterface({ input: process.stdin });
  rl.on('line', (s) => {
    s = s.trim();
    if (!s) return;
    const [k, a] = s.split(/\s+/);
    try {
      if (k === '/cikis') return kapat();
      if (k === '/hediye') console.log(islet({ tur: 'hediye', ad: 'terminal', elmas: a }));
      else if (k === '/begeni') console.log(islet({ tur: 'begeni', adet: a }));
      else if (k === '/saka') console.log(islet({ tur: 'komut', ad: `saka:${a}` }));
      else if (k.startsWith('/')) console.log(islet({ tur: 'komut', ad: k.slice(1) }));
      else {
        const [ad, ...m] = s.includes(':') ? s.split(':') : ['terminal', s];
        console.log(islet({ tur: 'sohbet', ad: ad.trim(), mesaj: m.join(':').trim() }));
      }
    } catch (e) { console.log('hata:', e.message); }
  });
}

function kapat() {
  log('kapanıyor');
  y.durdur();
  tiktok?.kapat();
  writeFileSync(IZLEYICI, JSON.stringify(y.izleyiciler, null, 1));
  try { unlinkSync(path.join(KAYIT, 'nese.pid')); } catch {}
  srv.sunucu.close();
  process.exit(0);
}
process.on('SIGINT', kapat);
process.on('SIGTERM', kapat);
