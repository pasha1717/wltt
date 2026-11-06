// OBS kurulumu, obs-websocket 5 protokolünü taklit eden sahte bir sunucuya karşı test edilir.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { WebSocketServer } from 'ws';
import { obsKur } from '../src/obs/kurulum.js';

const b64 = (s) => createHash('sha256').update(s).digest('base64');

function sahteObs(sifre) {
  const salt = 'tuz', challenge = 'meydan';
  const beklenen = b64(b64(sifre + salt) + challenge);
  const istekler = [];
  const durum = { sahneler: [{ sceneName: 'Sahne' }], girdiler: [], ogeler: [] };
  const wss = new WebSocketServer({ host: '127.0.0.1', port: 0 });
  wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ op: 0, d: { obsWebSocketVersion: '5.5.0', rpcVersion: 1, authentication: { salt, challenge } } }));
    ws.on('message', (ham) => {
      const { op, d } = JSON.parse(ham);
      if (op === 1) {
        if (d.authentication !== beklenen) return ws.close(4009, 'Authentication failed');
        return ws.send(JSON.stringify({ op: 2, d: { negotiatedRpcVersion: 1 } }));
      }
      if (op !== 6) return;
      istekler.push({ tur: d.requestType, veri: d.requestData });
      let cevap = {};
      switch (d.requestType) {
        case 'GetSceneList': cevap = { scenes: durum.sahneler }; break;
        case 'CreateScene': durum.sahneler.push({ sceneName: d.requestData.sceneName }); break;
        case 'GetInputList': cevap = { inputs: durum.girdiler }; break;
        case 'CreateInput':
          durum.girdiler.push({ inputName: d.requestData.inputName });
          durum.ogeler.push({ sourceName: d.requestData.inputName, sceneItemId: durum.ogeler.length + 1 });
          cevap = { sceneItemId: durum.ogeler.length }; break;
        case 'GetSceneItemList': cevap = { sceneItems: durum.ogeler }; break;
      }
      ws.send(JSON.stringify({ op: 7, d: { requestType: d.requestType, requestId: d.requestId, requestStatus: { result: true, code: 100 }, responseData: cevap } }));
    });
  });
  return new Promise((coz) => wss.on('listening', () => coz({ wss, istekler, adres: `ws://127.0.0.1:${wss.address().port}` })));
}

test('OBS: sahne ve iki tarayıcı kaynağı kurulur, sahnede ses OBS kontrolünde', async () => {
  const { wss, istekler, adres } = await sahteObs('gizli');
  const loglar = [];
  await obsKur({ adres, sifre: 'gizli', log: (s) => loglar.push(s) });
  wss.close();
  const turler = istekler.map((i) => i.tur);
  assert.ok(turler.includes('CreateScene'));
  const girdiler = istekler.filter((i) => i.tur === 'CreateInput').map((i) => i.veri);
  assert.deepEqual(girdiler.map((g) => g.inputName), ['Neşe Sahne', 'Neşe Overlay']);
  assert.equal(girdiler[0].inputSettings.reroute_audio, true);
  assert.equal(girdiler[0].inputSettings.width, 1080);
  assert.equal(girdiler[0].inputSettings.height, 1920);
  assert.match(girdiler[1].inputSettings.url, /^http:\/\/127\.0\.0\.1:\d+\/overlay$/);
  assert.equal(turler.at(-1), 'SetCurrentProgramScene');
  assert.ok(!loglar.join(' ').includes('gizli'), 'parola loga yazılmamalı');
});

test('OBS: yanlış parola reddedilir', async () => {
  const { wss, adres } = await sahteObs('gizli');
  await assert.rejects(obsKur({ adres, sifre: 'yanlis', log: () => {} }));
  wss.close();
});
