// Öncelik kuyruğu: küçük sayı önce çıkar, aynı öncelikte sıra korunur.
// Sohbet öğeleri sınırı aşarsa en eskisi atılır.
export class Kuyruk {
  constructor({ sohbetSiniri = 3 } = {}) {
    this.ogeler = [];
    this.sayac = 0;
    this.sohbetSiniri = sohbetSiniri;
  }

  ekle(oge) {
    this.ogeler.push({ ...oge, sira: this.sayac++ });
    if (oge.tur === 'sohbet') {
      const sohbetler = this.ogeler.filter((o) => o.tur === 'sohbet');
      if (sohbetler.length > this.sohbetSiniri) this.ogeler.splice(this.ogeler.indexOf(sohbetler[0]), 1);
    }
  }

  al() {
    if (!this.ogeler.length) return null;
    let en = 0;
    for (let i = 1; i < this.ogeler.length; i++) {
      const a = this.ogeler[i], b = this.ogeler[en];
      if (a.oncelik < b.oncelik || (a.oncelik === b.oncelik && a.sira < b.sira)) en = i;
    }
    const [o] = this.ogeler.splice(en, 1);
    delete o.sira;
    return o;
  }

  get uzunluk() { return this.ogeler.length; }
  temizle() { this.ogeler = []; }
}
