// TikTok canlı yayın okuyucu. Yalnız OKUR: sohbet, beğeni, hediye. Hiçbir şey yazmaz/göndermez.
// tiktok-live-connector resmî değildir (TikTok'a bağlı değil) ve AGPL-3.0 lisanslıdır; bkz. README.
import { TikTokLiveConnection, WebcastEvent, ControlEvent } from 'tiktok-live-connector';

// Hediye olayını tek bir {ad, hediye, elmas} kaydına çevirir; kombo sürerken null döner.
export function hediyeCoz(d) {
  const g = d.giftDetails ?? {};
  if (g.giftType === 1 && !d.repeatEnd) return null; // kombo devam ediyor, bitişini bekle
  const adet = Math.max(1, Number(d.repeatCount) || 1);
  return {
    ad: d.user?.nickname || d.user?.uniqueId || 'bir izleyici',
    hediye: g.giftName || 'Hediye',
    elmas: Math.max(1, (Number(g.diamondCount) || 1) * adet),
  };
}

export function tiktokBagla({ kullanici, islet, log, durumBildir }) {
  let bekleme = 5_000;
  let zamanlayici = null;
  const baglanti = new TikTokLiveConnection(kullanici, { processInitialData: false });

  baglanti.on(WebcastEvent.CHAT, (d) =>
    islet({ tur: 'sohbet', ad: d.user?.nickname || d.user?.uniqueId, mesaj: d.comment || '' }));
  baglanti.on(WebcastEvent.LIKE, (d) => islet({ tur: 'begeni', adet: Number(d.likeCount) || 1 }));
  baglanti.on(WebcastEvent.GIFT, (d) => { const h = hediyeCoz(d); if (h) islet({ tur: 'hediye', ...h }); });
  baglanti.on(WebcastEvent.STREAM_END, () => { durumBildir('yayın bitti'); log('TikTok: yayın bitti'); });
  baglanti.on(ControlEvent.DISCONNECTED, () => { durumBildir('koptu'); planla(); });
  baglanti.on(ControlEvent.ERROR, ({ info }) => log(`TikTok hata: ${info ?? 'bilinmiyor'}`));

  async function baglan() {
    durumBildir('bağlanıyor');
    try {
      const s = await baglanti.connect();
      bekleme = 5_000;
      durumBildir('bağlı');
      log(`TikTok: @${kullanici} yayınına bağlandı (oda ${s.roomId})`);
    } catch (e) {
      const cevrimdisi = e?.constructor?.name === 'UserOfflineError';
      durumBildir(cevrimdisi ? 'yayında değil' : 'hata');
      log(`TikTok bağlanamadı: ${cevrimdisi ? `@${kullanici} şu an yayında değil` : e.message}`);
      planla(cevrimdisi ? 60_000 : undefined);
    }
  }

  // Yeniden bağlanma: 5 sn'den başlayıp 2 katına çıkar, en fazla 2 dk.
  function planla(ms = bekleme) {
    clearTimeout(zamanlayici);
    zamanlayici = setTimeout(baglan, ms);
    bekleme = Math.min(bekleme * 2, 120_000);
  }

  baglan();
  return { kapat: () => { clearTimeout(zamanlayici); baglanti.disconnect().catch(() => {}); } };
}
