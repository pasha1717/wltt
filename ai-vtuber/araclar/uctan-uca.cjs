// Uçtan uca test: çalışan sunucuya sahte olaylar gönderir, sahneyi tarayıcıda açıp sonucu ölçer.
// Gerekli: çalışan Neşe sunucusu ve Playwright (npm i -D playwright). Kullanım: node araclar/uctan-uca.cjs [kare-klasoru]
const { chromium } = require('playwright');

const KOK = `http://127.0.0.1:${process.env.PORT || 3900}`;
const api = (o) => fetch(`${KOK}/api/olay`, { method: 'POST', body: JSON.stringify(o) }).then((r) => r.json());
const sonuclar = [];
const kaydet = (adim, ms, gecti, not = '') => sonuclar.push({ adim, ms, gecti, not });

(async () => {
  const kareDizin = process.argv[2];
  const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--use-gl=angle', '--use-angle=swiftshader'] });
  const sahne = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 0.5 });
  const overlay = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 0.5 });
  const hatalar = [];
  for (const p of [sahne, overlay]) p.on('pageerror', (e) => hatalar.push(e.message));

  let t = Date.now();
  await sahne.goto(`${KOK}/sahne`);
  await sahne.waitForSelector('body[data-hazir="1"]', { timeout: 30000 });
  kaydet('Sahne + Haru yüklendi', Date.now() - t, true);
  await overlay.goto(`${KOK}/overlay`);
  await api({ tur: 'komut', ad: 'kuyrugu_bosalt' });

  // Bir koşul sağlanana kadar sahneyi yoklar; süreyi döner.
  const bekle = async (kosul, sinir = 15000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < sinir) { if (await sahne.evaluate(kosul)) return Date.now() - t0; await sahne.waitForTimeout(25); }
    return null;
  };
  const olcum = () => sahne.evaluate(() => window.neseTest.olcum.map((o) => ({ ...o })));
  const sifirla = () => sahne.evaluate(() => { window.neseTest.olcum.length = 0; });
  const bosta = () => bekle(() => !document.querySelector('#balon').classList.contains('acik'), 30000);

  // 1) Sohbet "Selam": filtre → kural → replik → ses → ağız
  await sifirla();
  t = Date.now();
  const c1 = await api({ tur: 'sohbet', ad: 'yeni_izleyici', mesaj: 'Selam Neşe!' });
  kaydet('Sohbet → kural eşleşmesi', Date.now() - t, c1.cevap === 'selam', `grup: ${c1.cevap}`);
  const balonMs = await bekle(() => document.querySelector('#balon').classList.contains('acik'));
  kaydet('Selam → balon görünür', balonMs + (Date.now() - t - balonMs), balonMs !== null);
  const sesMs = await bekle(() => window.neseTest.olcum.some((o) => o.ad === 'ses_basladi'), 8000);
  kaydet('Selam → ilk ses (gecikme)', sesMs === null ? null : Date.now() - t, sesMs !== null);
  let enAgiz = 0;
  for (let i = 0; i < 30; i++) { enAgiz = Math.max(enAgiz, await sahne.evaluate(() => window.neseTest.agiz())); await sahne.waitForTimeout(40); }
  kaydet('Ağız sesle hareket ediyor', null, enAgiz > 0.1, `en yüksek açıklık ${enAgiz.toFixed(2)}`);
  if (kareDizin) await sahne.screenshot({ path: `${kareDizin}/e2e-selam.png` });
  await bosta();

  // 2) Küfürlü sohbet: ekranda *** ve ad gizlenir
  t = Date.now();
  const akis = [];
  await overlay.exposeFunction('akisKaydet', (m) => akis.push(m));
  await overlay.evaluate(() => { new EventSource('/olaylar').onmessage = (e) => window.akisKaydet(JSON.parse(e.data)); });
  await overlay.waitForTimeout(300);
  await api({ tur: 'sohbet', ad: 'amk_kral', mesaj: 'selam amk www.spam.com' });
  await overlay.waitForTimeout(300);
  const s = akis.find((m) => m.tur === 'sohbet');
  kaydet('Küfür filtresi (ad + mesaj)', Date.now() - t, s?.ad === 'bir izleyici' && s?.mesaj === 'selam *** [bağlantı]', s ? `${s.ad}: ${s.mesaj}` : 'olay gelmedi');
  await bosta();

  // 3) Sahte 10 elmas hediye → orta kademe şaka + teşekkür balonu
  await sifirla();
  t = Date.now();
  const h = await api({ tur: 'hediye', ad: 'ayse_23', hediye: 'Donut', elmas: 10 });
  const tesekkurMs = await bekle(() => document.querySelector('#balon .tesekkur')?.textContent.includes('@ayse_23'));
  const o3 = await olcum();
  kaydet('10💎 hediye → şaka + teşekkür', tesekkurMs, tesekkurMs !== null && ['pasta', 'su', 'korku'].includes(h.saka), `şaka: ${h.saka}, efekt: ${o3.find((o) => o.ad === 'oynat')?.efekt}`);
  if (kareDizin) await sahne.screenshot({ path: `${kareDizin}/e2e-hediye.png` });
  await bosta();

  // 4) 100 elmas → büyük kademe, iki replik (şaka + büyük teşekkür)
  await sifirla();
  t = Date.now();
  const hb = await api({ tur: 'hediye', ad: 'mehmet', hediye: 'Corgi', elmas: 299 });
  const ikinciMs = await bekle(() => window.neseTest.olcum.filter((o) => o.ad === 'balon').length >= 2, 20000);
  kaydet('299💎 hediye → büyük şaka + 2. replik', ikinciMs, ikinciMs !== null && ['dusme', 'konfeti'].includes(hb.saka), `şaka: ${hb.saka}`);
  await bosta();

  // 5) 5 beğeni → hedef kutlaması, overlay çubuğu
  await sifirla();
  t = Date.now();
  const bg = await api({ tur: 'begeni', adet: 5 });
  const bgMs = await bekle(() => window.neseTest.olcum.some((o) => o.ad === 'oynat' && o.olay === 'begeni'));
  const cubuk = await overlay.evaluate(() => document.querySelector('#sayi').textContent);
  kaydet('5 beğeni → kutlama + çubuk', bgMs, bg.tetik === 1 && bgMs !== null, `overlay: ${cubuk}`);
  await bosta();

  // 6) Sessizlik → konu anlatımı
  await sifirla();
  const sinir = Number(process.env.SESSIZLIK_SN || 40) * 1000 + 8000;
  const konuMs = await bekle(() => window.neseTest.olcum.some((o) => o.ad === 'oynat' && o.olay === 'konu'), sinir);
  kaydet(`Sessizlik (${process.env.SESSIZLIK_SN || 40} sn) → konu`, konuMs, konuMs !== null);

  kaydet('Tarayıcı hataları', null, hatalar.length === 0, hatalar.join(' | ').slice(0, 120));
  await b.close();

  console.log('\n| Adım | Süre (ms) | Sonuç | Not |\n|---|---:|---|---|');
  for (const r of sonuclar) console.log(`| ${r.adim} | ${r.ms ?? '-'} | ${r.gecti ? 'geçti' : 'KALDI'} | ${r.not} |`);
  process.exit(sonuclar.every((r) => r.gecti) ? 0 : 1);
})();
