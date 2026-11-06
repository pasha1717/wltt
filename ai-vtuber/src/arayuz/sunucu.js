// Yerel web sunucusu: yalnız 127.0.0.1. Sayfalar, sesler, canlı olay akışı (SSE) ve panel API'si.
import http from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { KOK } from '../ayar.js';

const PUBLIC = path.join(KOK, 'src', 'arayuz', 'public');
const SESLER = path.join(KOK, 'sesler');
const TURLER = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.png': 'image/png', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml', '.wav': 'audio/wav',
};
const SAYFALAR = { '/': '/panel.html', '/sahne': '/sahne.html', '/overlay': '/overlay.html', '/panel': '/panel.html' };

// Kök dışına çıkan yolları reddeder.
function guvenliYol(kok, istek) {
  const y = path.normalize(path.join(kok, decodeURIComponent(istek)));
  return y.startsWith(kok + path.sep) ? y : null;
}

function dosyaGonder(res, yol) {
  if (!yol || !existsSync(yol) || !statSync(yol).isFile()) { res.writeHead(404).end('yok'); return; }
  res.writeHead(200, { 'Content-Type': TURLER[path.extname(yol)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  createReadStream(yol).pipe(res);
}

function govdeOku(req, sinir = 10_000) {
  return new Promise((coz, red) => {
    let v = '';
    req.on('data', (p) => { v += p; if (v.length > sinir) { red(new Error('çok büyük')); req.destroy(); } });
    req.on('end', () => { try { coz(v ? JSON.parse(v) : {}); } catch (e) { red(e); } });
  });
}

export function sunucuKur({ port, host = '127.0.0.1', islet, durum }) {
  const istemciler = new Set();
  const yayinla = (mesaj) => {
    const veri = `data: ${JSON.stringify(mesaj)}\n\n`;
    for (const r of istemciler) r.write(veri);
  };

  const sunucu = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    const p = url.pathname;
    try {
      if (p === '/olaylar') {
        res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
        res.write(`data: ${JSON.stringify(durum())}\n\n`);
        istemciler.add(res);
        req.on('close', () => istemciler.delete(res));
        return;
      }
      if (p === '/api/olay' && req.method === 'POST') {
        const sonuc = await islet(await govdeOku(req));
        res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(sonuc ?? { tamam: true }));
        return;
      }
      if (p === '/api/saglik') {
        res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify({ ...durum(), istemci: istemciler.size }));
        return;
      }
      if (p.startsWith('/sesler/')) return dosyaGonder(res, guvenliYol(SESLER, p.slice(8)));
      return dosyaGonder(res, guvenliYol(PUBLIC, SAYFALAR[p] ?? p));
    } catch (e) {
      res.writeHead(400, { 'Content-Type': 'application/json' }).end(JSON.stringify({ hata: e.message }));
    }
  });

  // Bağlantıyı canlı tutmak için 20 sn'de bir yorum satırı gönderilir.
  const nabiz = setInterval(() => { for (const r of istemciler) r.write(': nabiz\n\n'); }, 20_000);
  sunucu.on('close', () => clearInterval(nabiz));

  return new Promise((coz, red) => {
    sunucu.once('error', red);
    sunucu.listen(port, host, () => coz({ sunucu, yayinla, istemciSayisi: () => istemciler.size }));
  });
}
