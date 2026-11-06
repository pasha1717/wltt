// Telefon modu (/mobil): sahneyi ekrana ölçekler, overlay'i katman olarak ekler,
// "Başla" dokunuşuyla sesi açar ve ekranın uyumasını engeller. Sol üst köşeye 3 dokunuş: ayarlar.
export function mobilKur({ sesAc }) {
  document.documentElement.classList.add('mobil');
  const sahne = document.querySelector('#sahne');

  const ust = document.createElement('iframe');
  ust.src = '/overlay';
  ust.id = 'mobilOverlay';
  ust.setAttribute('aria-hidden', 'true');
  sahne.append(ust);

  const olcekle = () => {
    const o = Math.min(innerWidth / 1080, innerHeight / 1920);
    sahne.style.transform = `translate(${(innerWidth - 1080 * o) / 2}px, ${(innerHeight - 1920 * o) / 2}px) scale(${o})`;
  };
  addEventListener('resize', olcekle);
  olcekle();

  let kilit = null;
  const uyanikTut = async () => {
    try { if (document.visibilityState === 'visible' && 'wakeLock' in navigator) kilit = await navigator.wakeLock.request('screen'); }
    catch (e) { console.warn('ekran açık tutulamadı', e); }
  };
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && kilit?.released !== false) uyanikTut(); });

  const perde = document.createElement('div');
  perde.id = 'baslaPerde';
  perde.innerHTML = '<button type="button">Neşe\'yi başlat</button><p>Ses açılır ve ekran uyumaz.<br>Ayarlar için sol üst köşeye üç kez dokun.</p>';
  document.body.append(perde);
  perde.querySelector('button').addEventListener('click', async () => {
    await sesAc();
    await uyanikTut();
    try { await document.documentElement.requestFullscreen?.({ navigationUI: 'hide' }); } catch { /* izin yoksa geç */ }
    perde.remove();
  });

  let dokunus = [];
  addEventListener('pointerdown', (e) => {
    if (e.clientX > 90 || e.clientY > 90) return;
    const t = Date.now();
    dokunus = [...dokunus.filter((x) => t - x < 1200), t];
    if (dokunus.length >= 3) location.href = '/ayarlar';
  });
}
