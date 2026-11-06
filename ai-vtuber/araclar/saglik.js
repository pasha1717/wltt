// Sağlık kontrolü: araçlar, dosyalar, anahtarlar (yalnız dolu/boş), portlar, çalışan sunucu.
import { existsSync, readFileSync } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { ayar, anahtarDurumu, KOK } from '../src/ayar.js';
import { tumReplikler } from '../src/icerik.js';

const satirlar = [];
const yaz = (durum, ad, not = '') => satirlar.push(`${durum === true ? '✓' : durum === false ? '✗' : '!'} ${ad.padEnd(26)} ${not}`);

const portAcikMi = (port) => new Promise((coz) => {
  const s = net.connect({ host: '127.0.0.1', port }, () => { s.destroy(); coz(true); });
  s.on('error', () => coz(false));
  s.setTimeout(1500, () => { s.destroy(); coz(false); });
});

const [ana] = process.versions.node.split('.').map(Number);
yaz(ana >= 20, 'Node.js', `v${process.versions.node} (gerekli: 20+)`);
yaz(existsSync(path.join(KOK, 'node_modules', 'tiktok-live-connector')), 'npm paketleri', 'yoksa: npm install');
const vendor = path.join(KOK, 'src', 'arayuz', 'public', 'vendor');
yaz(['live2dcubismcore.min.js', 'pixi.min.js', 'pixi-live2d-cubism4.min.js', 'Haru/Haru.model3.json'].every((f) => existsSync(path.join(vendor, f))),
  'Live2D dosyaları', 'yoksa: node araclar/live2d-indir.js');
yaz(existsSync(path.join(KOK, 'src', 'filtre', 'veri', 'kufur-listesi.txt')), 'Küfür listesi');
const hepsi = tumReplikler();
const sesli = hepsi.filter((r) => r.ses).length;
yaz(sesli === hepsi.length ? true : sesli ? null : false, 'Hazır sesler', `${sesli}/${hepsi.length} (eksikse: npm run ses-uret)`);
yaz(existsSync(path.join(KOK, '.env')) || null, '.env dosyası', existsSync(path.join(KOK, '.env')) ? 'var' : 'yok: .env.example dosyasını .env olarak kopyala');
for (const [k, v] of Object.entries(anahtarDurumu())) yaz(v === 'dolu' || null, k, v);
yaz(null, 'TEST_MODU', ayar.testModu ? 'açık (TikTok bağlanmaz, yalnız panel/terminal)' : 'kapalı (TikTok okunur)');

const sunucu = await portAcikMi(ayar.port);
if (sunucu) {
  try {
    const d = await (await fetch(`http://127.0.0.1:${ayar.port}/api/saglik`, { signal: AbortSignal.timeout(2000) })).json();
    yaz(true, `Neşe sunucusu :${ayar.port}`, `çalışıyor · ekran ${d.istemci} · kuyruk ${d.kuyruk} · TikTok ${d.tiktok}`);
  } catch { yaz(false, `Port ${ayar.port}`, 'başka bir program kullanıyor'); }
} else yaz(null, `Neşe sunucusu :${ayar.port}`, 'çalışmıyor (başlatmak için basla.ps1)');
yaz(await portAcikMi(4455) || null, 'OBS WebSocket :4455', (await portAcikMi(4455)) ? 'açık' : 'kapalı (OBS kapalı ya da WebSocket sunucusu kapalı)');

const pidDosya = path.join(KOK, 'kayitlar', 'nese.pid');
if (existsSync(pidDosya)) yaz(null, 'PID dosyası', readFileSync(pidDosya, 'utf8').trim());

console.log('Neşe sağlık kontrolü\n' + satirlar.join('\n'));
console.log('\nHatırlatma: TikTok\'ta yayın ayarlarından "Yapay zekâ ile üretilmiş içerik" etiketini aç.');
console.log('Ekranda Live2D telif ibaresi ve "yapay zekâ karakteri" yazısı overlay\'de sürekli görünür.');
