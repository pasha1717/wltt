import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { voxMetni, wavOku, wavYaz, bol } from '../araclar/voxcpm.js';
import { tumReplikler } from '../src/icerik.js';

test('VoxCPM metni: etiket, kesme işareti ve tırnak atılır; rakam reddedilir', () => {
  assert.equal(voxMetni("[laughs] Venüs'te bir gün"), 'Venüste bir gün');
  assert.equal(voxMetni('"Selam" dedi'), 'Selam dedi');
  assert.throws(() => voxMetni('5 beğeni'), /rakam/);
});

test('tüm replikler VoxCPM kurallarına uyar', () => {
  for (const r of tumReplikler()) assert.doesNotThrow(() => voxMetni(r.ham), r.metin);
});

test('okuma.wav satır zamanlarına göre doğru bölünür', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'vox-'));
  try {
    const hiz = 48000;
    // 0,0-1,0 sn 300 Hz | 1,0-1,5 sessiz | 1,5-2,2 600 Hz | 2,2-2,7 sessiz | 2,7-3,0 900 Hz
    const parcalar = [[0, 1.0, 300], [1.5, 2.2, 600], [2.7, 3.0, 900]];
    const veri = Buffer.alloc(3.0 * hiz * 2);
    for (const [a, b, f] of parcalar)
      for (let i = Math.round(a * hiz); i < Math.round(b * hiz); i++) veri.writeInt16LE(Math.round(Math.sin((2 * Math.PI * f * i) / hiz) * 12000), i * 2);
    const cikti = path.join(dir, 'cikti'), klasor = path.join(dir, 'klasor'), hedef = path.join(dir, 'sesler');
    mkdirSync(cikti); mkdirSync(klasor);
    writeFileSync(path.join(cikti, 'okuma.wav'), wavYaz({ kanal: 1, hiz, veri }));
    writeFileSync(path.join(cikti, 'ozet.json'), JSON.stringify({
      satirlar: parcalar.map(([t0, t1], i) => ({ satir: i + 1, metin: `s${i}`, t0, t1 })), supheli_satirlar: [2] }));
    writeFileSync(path.join(klasor, 'sira.json'), JSON.stringify(['aaa', 'bbb', 'ccc']));

    const { yazilan, supheli } = bol(cikti, { klasor, hedef });
    assert.deepEqual(readdirSync(hedef).sort(), ['aaa.wav', 'bbb.wav', 'ccc.wav']);
    assert.deepEqual(supheli, [2]);
    // süre = satır süresi + iki kenar payı (0,04 sn), dosya sınırında kırpılır
    assert.deepEqual(yazilan.map((y) => y.sn), [1.04, 0.78, 0.34]);
    // her parçanın baskın frekansı doğru: sıfır geçişlerinden kaba frekans
    const frekans = (id) => {
      const w = wavOku(readFileSync(path.join(hedef, `${id}.wav`)));
      // yalnız sesli örnekler sayılır (kenar paylarındaki sessizlik frekansı düşürmesin)
      let gecis = 0, onceki = 0, sesli = 0;
      for (let i = 0; i < w.veri.length / 2; i++) {
        const v = w.veri.readInt16LE(i * 2);
        if (v === 0) continue;
        sesli++;
        if (onceki !== 0 && (v > 0) !== (onceki > 0)) gecis++;
        onceki = v;
      }
      return gecis / 2 / (sesli / w.hiz);
    };
    const f = ['aaa', 'bbb', 'ccc'].map(frekans);
    assert.ok(Math.abs(f[0] - 300) < 30 && Math.abs(f[1] - 600) < 60 && Math.abs(f[2] - 900) < 90, `frekanslar ${f.map(Math.round)}`);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
