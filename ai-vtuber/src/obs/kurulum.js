// OBS'de "Yayın" sahnesini kurar (obs-websocket 5, OBS 28+ içinde gelir).
// OBS > Araçlar > WebSocket Sunucu Ayarları: sunucuyu aç, parolayı .env'de OBS_SIFRE olarak yaz.
//   node src/obs/kurulum.js            # sahneyi kur/güncelle
//   node src/obs/kurulum.js --cozunurluk  # tuvali de 1080x1920 yap (yayın/kayıt kapalıyken)
// JSON alt protokolü: OBS her ikisini de destekler; JSON, hata ayıklaması ve test için daha basit.
import { OBSWebSocket } from 'obs-websocket-js/json';
import { ayar } from '../ayar.js';

const SAHNE = 'Yayın';
const ADRES = process.env.OBS_ADRES || 'ws://127.0.0.1:4455';
const kok = `http://${ayar.host}:${ayar.port}`;
const KAYNAKLAR = [
  // reroute_audio = "Control audio via OBS": sesi OBS mikserine taşır, böylece yayına gider.
  { ad: 'Neşe Sahne', url: `${kok}/sahne`, ses: true },
  { ad: 'Neşe Overlay', url: `${kok}/overlay`, ses: false },
];

export async function obsKur({ obs = new OBSWebSocket(), adres = ADRES, sifre = ayar.obsSifre, cozunurluk = false, log = console.log } = {}) {
  let zaman;
  const sure = new Promise((_, red) => { zaman = setTimeout(() => red(new Error('OBS 10 sn içinde cevap vermedi')), 10_000); });
  const { obsWebSocketVersion, negotiatedRpcVersion } = await Promise.race([obs.connect(adres, sifre || undefined), sure])
    .catch(async (e) => { await obs.disconnect().catch(() => {}); throw e; })
    .finally(() => clearTimeout(zaman));
  log(`OBS'ye bağlandı (obs-websocket ${obsWebSocketVersion}, rpc ${negotiatedRpcVersion}).`);
  try {
    if (cozunurluk) {
      await obs.call('SetVideoSettings', { baseWidth: 1080, baseHeight: 1920, outputWidth: 1080, outputHeight: 1920 });
      log('Tuval ve çıkış çözünürlüğü 1080x1920 yapıldı.');
    }
    const { scenes } = await obs.call('GetSceneList');
    if (!scenes.some((s) => s.sceneName === SAHNE)) { await obs.call('CreateScene', { sceneName: SAHNE }); log(`"${SAHNE}" sahnesi oluşturuldu.`); }
    const { inputs } = await obs.call('GetInputList');
    for (const k of KAYNAKLAR) {
      const ayarlar = { url: k.url, width: 1080, height: 1920, fps: 30, reroute_audio: k.ses, shutdown: false, restart_when_active: false };
      if (inputs.some((i) => i.inputName === k.ad)) {
        await obs.call('SetInputSettings', { inputName: k.ad, inputSettings: ayarlar });
        log(`"${k.ad}" güncellendi.`);
      } else {
        await obs.call('CreateInput', { sceneName: SAHNE, inputName: k.ad, inputKind: 'browser_source', inputSettings: ayarlar });
        log(`"${k.ad}" eklendi (${k.url}).`);
      }
    }
    // Sıra: sahne altta, overlay üstte.
    const { sceneItems } = await obs.call('GetSceneItemList', { sceneName: SAHNE });
    const ust = sceneItems.find((i) => i.sourceName === 'Neşe Overlay');
    if (ust) await obs.call('SetSceneItemIndex', { sceneName: SAHNE, sceneItemId: ust.sceneItemId, sceneItemIndex: sceneItems.length - 1 });
    await obs.call('SetCurrentProgramScene', { sceneName: SAHNE });
    log(`"${SAHNE}" sahnesi hazır ve seçildi.`);
  } finally {
    await obs.disconnect();
  }
}

if (process.argv[1]?.endsWith('kurulum.js')) {
  obsKur({ cozunurluk: process.argv.includes('--cozunurluk') }).catch((e) => {
    console.error(`OBS kurulumu başarısız: ${e.message}`);
    console.error('OBS açık mı? Araçlar > WebSocket Sunucu Ayarları açık mı? OBS_SIFRE doğru mu?');
    process.exit(1);
  });
}
