// Bir gruptan rastgele replik seçer; son N seçimi (tüm gruplarda) tekrar etmez.
export class Secici {
  constructor(gruplar, tekrarEngeli = 10, rastgele = Math.random) {
    this.gruplar = gruplar;
    this.son = [];
    this.n = tekrarEngeli;
    this.rastgele = rastgele;
  }

  sec(grup) {
    const liste = this.gruplar[grup];
    if (!liste?.length) return null;
    let adaylar = liste.filter((r) => !this.son.includes(r.id));
    // Grup engelden küçükse: yalnız bir önceki repliği dışarıda bırak.
    if (!adaylar.length) adaylar = liste.length > 1 ? liste.filter((r) => r.id !== this.son.at(-1)) : liste;
    const r = adaylar[Math.floor(this.rastgele() * adaylar.length)];
    this.son.push(r.id);
    if (this.son.length > this.n) this.son.shift();
    return r;
  }
}
