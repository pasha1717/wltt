// Sahne: Haru modelini yükler, olay akışını dinler, replikleri sırayla oynatır.
// Ağız: ses varsa sesin seviyesinden, yoksa (TEST_MODU / üretilmemiş ses) metin süresince yapay dalga.
import { Efektler } from './efektler.js';
import { mobilKur } from './mobil.js';

const $ = (s) => document.querySelector(s);
const kutu = $('#karakterKutu');
const balon = $('#balon');
const efekt = new Efektler($('#efekt'));
const sorgu = new URLSearchParams(location.search);

// Duygu → Haru ifadesi (F01-F08, ekran görüntüleriyle eşlendi, bkz. README).
const IFADE = { neseli: 'F01', heyecanli: 'F07', saskin: 'F03', korkmus: 'F08', utangac: 'F05', sakin: 'F02', uzgun: 'F04' };
const HAREKET_SINIF = ['zipla', 'sevinc', 'korku', 'saskin', 'utanma', 'elsalla', 'dusunme', 'dusme'];

let model = null;
let agiz = 0;           // 0-1, her karede modele yazılır
let sustur = false;
let sesBaglam = null;
const olcum = [];            // test için zaman kaydı: [{ad, t}]
const isaret = (ad, ek = {}) => olcum.push({ ad, t: Date.now(), ...ek });

// --- model -------------------------------------------------------------
async function modelYukle() {
  const app = new PIXI.Application({ view: $('#karakter'), width: 1080, height: 1540, backgroundAlpha: 0, antialias: true });
  model = await PIXI.live2d.Live2DModel.from('/vendor/Haru/Haru.model3.json', { autoInteract: false });
  const olcek = 1540 * 1.5 / model.height;
  model.scale.set(olcek);
  model.anchor.set(0.5, 0);
  model.x = 540;
  model.y = 30;
  app.stage.addChild(model);
  model.internalModel.on('beforeModelUpdate', () => {
    model.internalModel.coreModel.setParameterValueById('ParamMouthOpenY', agiz);
  });
  $('#yukleniyor').remove();
  if (sorgu.get('ifade')) model.expression(sorgu.get('ifade'));
  document.body.dataset.hazir = '1';
}

function ifade(duygu) { if (model && IFADE[duygu]) model.expression(IFADE[duygu]); }

function hareket(ad) {
  if (ad === 'sevinc' || ad === 'elsalla') model?.motion('TapBody', Math.floor(Math.random() * 4));
  kutu.classList.remove(...HAREKET_SINIF.map((h) => `h-${h}`));
  void kutu.offsetWidth; // animasyonu yeniden başlat
  if (HAREKET_SINIF.includes(ad)) kutu.classList.add(`h-${ad}`);
}

// --- ses ve ağız --------------------------------------------------------
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
const tahminiMs = (metin) => 900 + metin.length * 65;

async function konus(r) {
  if (r.ses && !sustur) {
    try { await sesCal(r.ses); return; } catch (e) { console.warn('ses çalınamadı, balonla devam', e); }
  }
  // Ses yok: metin süresince ağız yapay olarak oynar.
  const bitis = performance.now() + tahminiMs(r.metin);
  await new Promise((coz) => {
    const kare = () => {
      const t = performance.now();
      if (t >= bitis) { agiz = 0; return coz(); }
      agiz = Math.max(0, Math.sin(t / 70) * 0.5 + Math.sin(t / 37) * 0.3 + 0.2);
      requestAnimationFrame(kare);
    };
    kare();
  });
}

function sesCal(url) {
  sesBaglam ??= new AudioContext();
  return new Promise((coz, red) => {
    const ses = new Audio(url);
    ses.crossOrigin = 'anonymous';
    const kaynak = sesBaglam.createMediaElementSource(ses);
    const analiz = sesBaglam.createAnalyser();
    analiz.fftSize = 1024;
    kaynak.connect(analiz);
    analiz.connect(sesBaglam.destination);
    const veri = new Uint8Array(analiz.fftSize);
    let calisiyor = true;
    const kare = () => {
      if (!calisiyor) return;
      analiz.getByteTimeDomainData(veri);
      let t = 0;
      for (const v of veri) t += ((v - 128) / 128) ** 2;
      const seviye = Math.sqrt(t / veri.length);          // RMS
      agiz = agiz * 0.4 + Math.min(1, seviye * 6) * 0.6;   // yumuşatma
      requestAnimationFrame(kare);
    };
    ses.onplaying = () => isaret('ses_basladi', { url });
    ses.onended = () => { calisiyor = false; agiz = 0; isaret('ses_bitti'); coz(); };
    ses.onerror = () => { calisiyor = false; agiz = 0; red(new Error('ses hatası')); };
    sesBaglam.resume().then(() => ses.play()).then(kare).catch((e) => { calisiyor = false; red(e); });
  });
}

// --- balon --------------------------------------------------------------
const kacis = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
function balonGoster({ metin, alinti, ad, tesekkur }) {
  balon.innerHTML = (alinti ? `<small>@${kacis(ad)}: ${kacis(alinti)}</small>` : '')
    + kacis(metin) + (tesekkur ? `<span class="tesekkur">${kacis(tesekkur)}</span>` : '');
  balon.classList.add('acik');
  isaret('balon', { metin });
}
const balonKapat = () => balon.classList.remove('acik');

// --- olay oynatma -------------------------------------------------------
let sira = Promise.resolve();
async function oynat(k) {
  isaret('oynat', { olay: k.olay, efekt: k.efekt });
  if (k.efekt) efekt.baslat(k.efekt, { sahne: $('#sahne'), kutu });
  if (k.efekt === 'dusme') hareket('dusme');
  if (k.gecikme_ms) await bekle(k.gecikme_ms);
  for (const [i, r] of k.replikler.entries()) {
    ifade(r.duygu);
    if (k.efekt !== 'dusme' || i > 0) hareket(r.hareket);
    balonGoster({ metin: r.metin, alinti: i === 0 ? k.alinti : null, ad: k.ad, tesekkur: i === k.replikler.length - 1 ? k.balon : null });
    await konus(r);
    await bekle(350);
  }
  await bekle(600);
  balonKapat();
  ifade('neseli');
}

function bagla() {
  const kaynak = new EventSource('/olaylar');
  kaynak.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.tur === 'oynat') sira = sira.then(() => oynat(m)).catch(console.error);
    else if (m.tur === 'ses') sustur = m.sustur;
  };
}

// Gündüz/gece: pencere ve lamba yerel saate göre.
function gunIsigi() {
  const s = new Date().getHours();
  const gece = s < 7 || s >= 19;
  $('#gok1').setAttribute('stop-color', gece ? '#1d2b55' : '#8fd3ff');
  $('#gok2').setAttribute('stop-color', gece ? '#3d4f86' : '#d9f1ff');
  $('#gunes').style.opacity = gece ? 0 : 1;
  $('#bulut').style.opacity = gece ? 0.25 : 0.9;
  $('#ayYildiz').style.opacity = gece ? 1 : 0;
  $('#lambaIsik').style.opacity = gece ? 1 : 0.45;
}

gunIsigi();
setInterval(gunIsigi, 60_000);
modelYukle().catch((e) => { $('#yukleniyor').textContent = 'Model yüklenemedi: ' + e.message; console.error(e); });
bagla();
// /mobil: telefon modu. Ses bağlamı bir dokunuşla açılır (tarayıcı otomatik oynatma kuralı).
if (location.pathname === '/mobil') mobilKur({ sesAc: async () => { sesBaglam ??= new AudioContext(); await sesBaglam.resume(); } });
// Test kancası: uçtan uca test ağız değerini ve zaman kaydını buradan okur.
window.neseTest = { oynat, efekt, ifade, hareket, olcum, agiz: () => agiz };
