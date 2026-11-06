// Telefon (nodejs-mobile, Node 18) giriş noktası. CommonJS; asıl kod src/ altında ESM olarak durur.
'use strict';
const path = require('path');
const os = require('os');
const tls = require('tls');
const crypto = require('crypto');

// 1) Yazılabilir veri klasörü: eklenti DATADIR verir (uygulama güncellense de korunur).
process.env.NESE_VERI = process.env.DATADIR || path.join(os.tmpdir(), 'nese');

// 2) Güvenlik: nodejs-mobile'ın Node 18 sertifika listesi güncellenmiyor ve Ekim 2026'da ele geçirilen
// eMudhra (emSign) otoritesine hâlâ güveniyor. Bu kökleri güven listesinden çıkarıyoruz.
const supheli = /emudhra|emsign/i;
const guvenilen = tls.rootCertificates.filter((pem) => {
  try { const c = new crypto.X509Certificate(pem); return !supheli.test(`${c.subject}\n${c.issuer}`); }
  catch { return true; }
});
// NODE_EXTRA_CA_CERTS (kurumsal vekil vb.) varsa korunur; telefonda normalde tanımlı değildir.
if (process.env.NODE_EXTRA_CA_CERTS) {
  try { guvenilen.push(require('fs').readFileSync(process.env.NODE_EXTRA_CA_CERTS, 'utf8')); } catch { /* okunamazsa geç */ }
}
const ozgunBaglam = tls.createSecureContext;
tls.createSecureContext = (secenek = {}) => ozgunBaglam({ ...secenek, ca: secenek.ca || guvenilen });
console.log(`Kök sertifika: ${tls.rootCertificates.length}, çıkarılan eMudhra/emSign: ${tls.rootCertificates.length - guvenilen.filter((p) => tls.rootCertificates.includes(p)).length}`);

// 3) Sunucuyu başlat (127.0.0.1:3900). Uygulama ekranı (WebView) bu adrese bağlanır.
import('./src/ana.js').catch((e) => console.error('Neşe başlatılamadı:', e));
