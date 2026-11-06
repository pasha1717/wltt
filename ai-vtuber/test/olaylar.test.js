import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { yukle } from '../src/icerik.js';
import { Secici } from '../src/olaylar/secici.js';
import { Kuyruk } from '../src/olaylar/kuyruk.js';
import { derle, eslestir } from '../src/olaylar/sohbet.js';
import { Yonetici } from '../src/olaylar/yonetici.js';

const ic = yukle();
const ayar = { begeniHedefleri: [5, 10, 20, 30], sessizlikSn: 40 };

function kur(rastgele = () => 0.5) {
  const giden = [];
  let saat = 1_000_000;
  const y = new Yonetici({ icerik: ic, ayar, yayinla: (m) => giden.push(m), rastgele, simdi: () => saat });
  return { y, giden, oynat: () => giden.filter((m) => m.tur === 'oynat'), ilerle: (ms) => { saat += ms; } };
}

test('seçici son 10 repliği tekrar etmez', () => {
  const s = new Secici(ic.gruplar, 10);
  const secilen = Array.from({ length: 15 }, () => s.sec('selam').id);
  for (let i = 0; i < secilen.length; i++)
    assert.ok(!secilen.slice(Math.max(0, i - 10), i).includes(secilen[i]), `tekrar: ${i}`);
});

test('seçici küçük grupta art arda aynı repliği seçmez', () => {
  const s = new Secici(ic.gruplar, 10);
  const seri = Array.from({ length: 8 }, () => s.sec('sohbet_isim').id);
  for (let i = 1; i < seri.length; i++) assert.notEqual(seri[i], seri[i - 1]);
});

test('kuyruk önceliğe göre çıkar, sohbet sınırı en eskiyi atar', () => {
  const k = new Kuyruk({ sohbetSiniri: 2 });
  k.ekle({ tur: 'sohbet', oncelik: 5, n: 1 });
  k.ekle({ tur: 'sohbet', oncelik: 5, n: 2 });
  k.ekle({ tur: 'sohbet', oncelik: 5, n: 3 });
  k.ekle({ tur: 'hediye', oncelik: 1, n: 4 });
  k.ekle({ tur: 'begeni', oncelik: 4, n: 5 });
  assert.deepEqual([k.al(), k.al(), k.al(), k.al()].map((o) => o.n), [4, 5, 2, 3]);
  assert.equal(k.al(), null);
});

test('sohbet eşleştirme', () => {
  const d = derle(ic.kurallar);
  const ornek = {
    'Selam Neşe!': 'selam', 'naber nasılsın': 'sohbet_nasilsin', 'sen yapay zeka mısın?': 'sohbet_yapayzeka',
    'kaç yaşındasın': 'sohbet_yas', 'şarkı söyle': 'sohbet_sarki', 'seçim kimin olacak': 'yasak_siyaset',
    'adresin ne': 'yasak_kisisel', 'çok tatlısın': 'sohbet_iltifat', 'hahahaha': 'sohbet_gulme',
    'takip ettim': 'sohbet_takip', 'iyi geceler herkese': 'sohbet_hosca_kal', 'dinledim seni': null,
    'sabah oldu': null, 'partiyi kaçırdım': null, 'saat kaç': null,
  };
  for (const [m, beklenen] of Object.entries(ornek)) assert.equal(eslestir(m, d), beklenen, m);
});

test('hediye kademeleri doğru şakayı seçer', () => {
  const { y } = kur(() => 0);
  assert.equal(y.hediye({ ad: 'a', elmas: 1 }).saka, 'kalp');
  assert.equal(y.hediye({ ad: 'b', elmas: 10 }).saka, 'pasta');
  assert.equal(y.hediye({ ad: 'c', elmas: 99 }).kademe, 'orta');
  assert.equal(y.hediye({ ad: 'd', elmas: 100 }).saka, 'dusme');
  assert.equal(y.hediye({ ad: 'e', elmas: 5000 }).kademe, 'buyuk');
  y.durdur();
});

test('beğeni hedefleri döngüsel tetiklenir', () => {
  const { y } = kur();
  const tetikler = [4, 1, 5, 10, 9, 1, 5].map((n) => y.begeniEkle(n));
  // toplam: 4,5,10,20,29,30,35  → hedefler 5,10,20,30 ve yeni döngüde 35
  assert.deepEqual(tetikler, [0, 1, 1, 1, 0, 1, 1]);
  y.durdur();
});

test('öncelik: büyük hediye sohbetten önce oynar, aynı anda tek olay', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const { y, oynat } = kur();
    y.sohbet({ ad: 'ali', mesaj: 'selam' });          // hemen oynar
    y.sohbet({ ad: 'veli', mesaj: 'nasılsın' });      // bekler
    y.hediye({ ad: 'ayse', elmas: 500 });             // bekler ama önce çıkar
    assert.equal(oynat().length, 1);
    const bekle = (o) => { mock.timers.tick(o.sure_ms); mock.timers.tick(3000); };
    bekle(oynat()[0]);
    assert.equal(oynat()[1].olay, 'hediye');
    assert.equal(oynat()[1].balon, 'Teşekkürler @ayse!');
    assert.equal(oynat()[1].replikler.length, 2, 'büyük hediyede şaka + teşekkür');
    bekle(oynat()[1]);
    assert.equal(oynat()[2].alinti, 'nasılsın');
    y.durdur();
  } finally { mock.timers.reset(); }
});

test('aynı izleyiciye 30 sn içinde ikinci cevap verilmez, küfürlü ad gizlenir', () => {
  const { y, giden, ilerle } = kur();
  assert.ok(y.sohbet({ ad: 'ali', mesaj: 'selam' }));
  assert.equal(y.sohbet({ ad: 'ali', mesaj: 'nasılsın' }), null);
  ilerle(31_000);
  assert.ok(y.sohbet({ ad: 'ali', mesaj: 'nasılsın' }));
  y.sohbet({ ad: 'amk', mesaj: 'selam amk' });
  const son = giden.filter((m) => m.tur === 'sohbet').at(-1);
  assert.deepEqual([son.ad, son.mesaj], ['bir izleyici', 'selam ***']);
  y.durdur();
});

test('40 sn sessizlikte konu anlatılır', () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  try {
    const { y, oynat } = kur();
    y.baslat();
    mock.timers.tick(39_999);
    assert.equal(oynat().length, 0);
    mock.timers.tick(1);
    assert.equal(oynat()[0].olay, 'konu');
    y.durdur();
  } finally { mock.timers.reset(); }
});
