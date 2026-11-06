import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kufurVarMi, temizle, temizAd, listeBoyutu, normalize } from '../src/filtre/filtre.js';

const MASUM = [
  'Selam Neşe nasılsın', 'Bugün çok sıkıldım ya', 'Annem ana yemeği yaptı', 'Bu malzeme çok güzel',
  'Ana sayfada gördüm seni', 'Amca oğlum da izliyor', 'Saat kaç oldu', 'Sıkı çalıştım bugün',
  'Pasta mı yesek', 'Kediler tatlı sevmez mi', 'Meme kanseri farkındalık ayı', 'Şarkı söyle lütfen',
  'Sıktı beni bu ders', 'Ağaç dikmek istiyorum', 'Göteborg güzel şehir',
  'Bokser köpeği çok tatlı', 'Kaka yaptı bebek', 'İstanbul’dan selamlar', 'Ben de pembe isterim', 'Mal varlığı nedir',
  'Sikke koleksiyonum var',
];

const KOTU = ['amk', 'aq naber', 'siktir git', 'orospu', 'piç kurusu', 'yarrak', 'Ananı s1keyim', 'g0t', 'ibne misin', 'oç'];

test('küfür listesi yüklü', () => assert.ok(listeBoyutu() > 500, `boyut ${listeBoyutu()}`));

test('masum cümleler engellenmez', () => {
  const takilan = MASUM.filter(kufurVarMi);
  assert.deepEqual(takilan, [], `yanlış alarm: ${takilan.join(' | ')}`);
});

test('kötü örnekler yakalanır', () => {
  const kacan = KOTU.filter((c) => !kufurVarMi(c));
  assert.deepEqual(kacan, [], `kaçan: ${kacan.join(' | ')}`);
});

test('temizle: küfür ***, bağlantı atılır, uzun metin kesilir', () => {
  assert.equal(temizle('selam amk'), 'selam ***');
  assert.equal(temizle('bak https://kotu.site/x burada'), 'bak [bağlantı] burada');
  assert.equal(temizle('takip et ornek.com'), 'takip et [bağlantı]');
  assert.equal(temizle('a'.repeat(300)).length, 200);
});

test('temizAd: küfürlü ad gizlenir', () => {
  assert.equal(temizAd('ayse_23'), 'ayse_23');
  assert.equal(temizAd('amk kral'), 'bir izleyici');
  assert.equal(temizAd(''), 'bir izleyici');
});

test('normalize Türkçe harfleri sadeleştirir', () => assert.equal(normalize('Şİşli ÇÖĞÜ ılık'), 'sisli cogu ılık'));
