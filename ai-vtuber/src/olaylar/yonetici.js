// Olay yöneticisi: girişlerden (sohbet, hediye, beğeni, panel) gelen olayları kuyruğa koyar,
// sırayla sahneye "oynat" komutu gönderir. Aynı anda tek olay oynar.
import { Secici } from './secici.js';
import { Kuyruk } from './kuyruk.js';
import { derle, eslestir } from './sohbet.js';
import { temizle, temizAd } from '../filtre/filtre.js';

// Ses dosyası süresi sunucuda bilinmez; konuşma süresi metin uzunluğundan tahmin edilir.
export const konusmaMs = (metin) => 900 + metin.length * 65;

export class Yonetici {
  constructor({ icerik, ayar, yayinla, kaydet = () => {}, rastgele = Math.random, simdi = Date.now }) {
    this.ic = icerik;
    this.ak = icerik.aktiviteler;
    this.ayar = ayar;
    this.yayinla = yayinla;
    this.kaydet = kaydet;
    this.rastgele = rastgele;
    this.simdi = simdi;
    this.secici = new Secici(icerik.gruplar, this.ak.tekrar_engeli, rastgele);
    this.kuyruk = new Kuyruk({ sohbetSiniri: this.ak.sohbet_kuyruk_siniri });
    this.kurallar = derle(icerik.kurallar);
    this.izleyiciler = {};
    this.sonCevap = {};
    this.begeni = { toplam: 0, taban: 0, hedefIndeks: 0 };
    this.konuIndeks = 0;
    this.oynuyor = false;
    this.duraklat = false;
    this.zamanlayici = null;
    this.sessizlik = null;
    this.gecmis = [];
  }

  baslat(izleyiciler = {}) {
    this.izleyiciler = izleyiciler;
    this.sessizlikKur();
    this.durumGonder();
  }

  durdur() {
    clearTimeout(this.zamanlayici);
    clearTimeout(this.sessizlik);
  }

  // --- girişler ---------------------------------------------------------

  sohbet({ ad, mesaj }) {
    const temizAdi = temizAd(ad);
    const metin = temizle(mesaj);
    const iz = (this.izleyiciler[temizAdi] ??= { mesaj: 0, sonKonu: null });
    const ilkMesaj = iz.mesaj === 0;
    iz.mesaj++;
    this.yayinla({ tur: 'sohbet', ad: temizAdi, mesaj: metin });

    let grup = eslestir(mesaj, this.kurallar);
    if (grup) iz.sonKonu = grup;
    else if (ilkMesaj) grup = 'selam';
    else if (metin.includes('?') && this.rastgele() < this.ak.eslesmeyen_mesaja_cevap_orani) grup = 'sohbet_soru';
    this.kaydet(this.izleyiciler);
    if (!grup) return null;

    const t = this.simdi();
    if (t - (this.sonCevap[temizAdi] ?? -Infinity) < this.ak.ayni_izleyici_bekleme_ms) return null;
    this.sonCevap[temizAdi] = t;
    return this.ekle({ tur: 'sohbet', oncelik: this.ak.oncelik.sohbet, grup, ad: temizAdi, alinti: metin });
  }

  hediye({ ad, hediye = 'Hediye', elmas = 1 }) {
    const kademe = this.ak.hediye_kademeleri.find((k) => elmas >= k.min && elmas <= k.max)
      ?? this.ak.hediye_kademeleri.at(-1);
    const saka = kademe.sakalar[Math.floor(this.rastgele() * kademe.sakalar.length)];
    const temizAdi = temizAd(ad);
    this.yayinla({ tur: 'hediye', ad: temizAdi, hediye: temizle(hediye, 30), elmas, kademe: kademe.ad });
    return this.ekle({ tur: 'hediye', oncelik: this.ak.oncelik[kademe.ad], saka, ad: temizAdi, kademe: kademe.ad });
  }

  begeniEkle(adet = 1) {
    const b = this.begeni;
    b.toplam += adet;
    const hedefler = this.ayar.begeniHedefleri;
    let tetik = 0;
    while (b.toplam >= b.taban + hedefler[b.hedefIndeks]) {
      tetik++;
      b.hedefIndeks++;
      if (b.hedefIndeks >= hedefler.length) { b.taban += hedefler.at(-1); b.hedefIndeks = 0; }
    }
    // Aynı anda birden çok hedef geçilse de tek kutlama yapılır.
    if (tetik) this.ekle({ tur: 'begeni', oncelik: this.ak.oncelik.begeni, saka: 'begeni' });
    this.durumGonder();
    return tetik;
  }

  komut(ad) {
    if (ad === 'acilis' || ad === 'kapanis') this.ekle({ tur: ad, oncelik: 0, grup: ad });
    else if (ad === 'konu') this.konuEkle();
    else if (ad === 'duraklat') this.duraklat = true;
    else if (ad === 'devam') { this.duraklat = false; this.sonraki(); }
    else if (ad === 'kuyrugu_bosalt') this.kuyruk.temizle();
    else if (ad.startsWith('saka:')) {
      const saka = ad.slice(5);
      if (this.ak.sakalar[saka]) this.ekle({ tur: 'hediye', oncelik: 0, saka, ad: 'Panel' });
    }
    this.durumGonder();
  }

  // --- oynatma ----------------------------------------------------------

  ekle(oge) {
    this.kuyruk.ekle(oge);
    this.durumGonder();
    if (!this.oynuyor) this.sonraki();
    return oge;
  }

  konuEkle() {
    const konu = this.ic.konular[this.konuIndeks++ % this.ic.konular.length];
    konu.satirlar.forEach((r, i) =>
      this.kuyruk.ekle({ tur: 'konu', oncelik: this.ak.oncelik.konu, replik: r, konu: konu.konu, parca: i }));
    if (!this.oynuyor) this.sonraki();
  }

  // Kuyruktan bir öğe çıkarıp sahne komutuna çevirir.
  hazirla(o) {
    const saka = o.saka ? this.ak.sakalar[o.saka] : null;
    const replik = o.replik ?? this.secici.sec(saka ? saka.replik : o.grup);
    const sonra = saka?.sonra ? this.secici.sec(saka.sonra) : null;
    const balon = o.tur === 'hediye' || o.tur === 'begeni'
      ? (o.ad && o.ad !== 'Panel' ? `Teşekkürler @${o.ad}!` : null)
      : null;
    const gecikme = saka?.carpma_ms ?? 0;
    const sure = Math.max(saka?.sure_ms ?? 0, gecikme + konusmaMs(replik.metin))
      + (sonra ? konusmaMs(sonra.metin) : 0);
    return {
      tur: 'oynat', olay: o.tur, efekt: saka?.efekt ?? null, kademe: o.kademe ?? null, ad: o.ad ?? null,
      alinti: o.alinti ?? null, balon, gecikme_ms: gecikme, sure_ms: sure,
      replikler: [replik, sonra].filter(Boolean).map(({ id, metin, duygu, hareket, ses }) => ({ id, metin, duygu, hareket, ses })),
    };
  }

  sonraki() {
    if (this.oynuyor || this.duraklat) return;
    const o = this.kuyruk.al();
    if (!o) { this.sessizlikKur(); return; }
    clearTimeout(this.sessizlik);
    const komut = this.hazirla(o);
    this.oynuyor = true;
    this.gecmis.push({ zaman: this.simdi(), olay: komut.olay, efekt: komut.efekt, metin: komut.replikler.map((r) => r.metin) });
    if (this.gecmis.length > 50) this.gecmis.shift();
    this.yayinla(komut);
    this.durumGonder();
    this.zamanlayici = setTimeout(() => {
      this.oynuyor = false;
      this.yayinla({ tur: 'bitti' });
      this.zamanlayici = setTimeout(() => this.sonraki(), this.ak.olaylar_arasi_ms);
    }, komut.sure_ms);
  }

  sessizlikKur() {
    clearTimeout(this.sessizlik);
    this.sessizlik = setTimeout(() => {
      if (!this.oynuyor && !this.duraklat && !this.kuyruk.uzunluk) this.konuEkle();
      else this.sessizlikKur();
    }, this.ayar.sessizlikSn * 1000);
  }

  durum() {
    const h = this.ayar.begeniHedefleri;
    return {
      tur: 'durum', duraklat: this.duraklat, oynuyor: this.oynuyor, kuyruk: this.kuyruk.uzunluk,
      begeni: { toplam: this.begeni.toplam, sonraki: this.begeni.taban + h[this.begeni.hedefIndeks],
        onceki: this.begeni.hedefIndeks ? this.begeni.taban + h[this.begeni.hedefIndeks - 1] : this.begeni.taban },
    };
  }

  durumGonder() { this.yayinla(this.durum()); }
}
