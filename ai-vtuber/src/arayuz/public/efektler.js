// Şaka efektleri: tümü canvas üzerinde kodla çizilir, dış görsel dosyası yok.
// Her efekt bir "parçacık" listesi üretir; parçacık { guncelle(dt, t) → yaşıyor mu, ciz(ctx) }.

const R = (a, b) => a + Math.random() * (b - a);
const SEC = (l) => l[Math.floor(Math.random() * l.length)];
const RENKLER = ['#ff5c8a', '#ffd166', '#06d6a0', '#4cc9f0', '#b388ff', '#ff9f1c', '#ffffff'];

// Karakterin başının sahnedeki yaklaşık konumu (1080x1920).
export const BAS = { x: 560, y: 740 };

function kalpCiz(c, x, y, s, renk) {
  c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = renk;
  c.beginPath(); c.moveTo(0, 6);
  c.bezierCurveTo(-14, -6, -8, -20, 0, -11); c.bezierCurveTo(8, -20, 14, -6, 0, 6); c.fill(); c.restore();
}

function yildizCiz(c, x, y, r, renk, aci = 0) {
  c.save(); c.translate(x, y); c.rotate(aci); c.fillStyle = renk; c.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.45 : r, a = (i * Math.PI) / 5 - Math.PI / 2;
    c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr);
  }
  c.closePath(); c.fill(); c.restore();
}

function pastaCiz(c, x, y, s = 1, aci = 0) {
  c.save(); c.translate(x, y); c.rotate(aci); c.scale(s, s);
  c.fillStyle = '#c8e7ff'; c.beginPath(); c.ellipse(0, 62, 120, 22, 0, 0, Math.PI * 2); c.fill();  // tabak
  c.fillStyle = '#8b5a3c'; c.fillRect(-95, 0, 190, 60);                                           // kek
  c.fillStyle = '#f6a5c0'; c.fillRect(-95, 22, 190, 14);                                          // krema katı
  c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-100, 0);
  for (let i = 0; i <= 10; i++) c.quadraticCurveTo(-90 + i * 19, 22, -81 + i * 19, 4);            // akan krema
  c.lineTo(100, -10); c.lineTo(-100, -10); c.fill();
  c.fillStyle = '#fff'; c.beginPath(); c.ellipse(0, -10, 100, 22, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#e8475f'; c.beginPath(); c.arc(0, -36, 18, 0, Math.PI * 2); c.fill();           // çilek
  c.fillStyle = '#4caf50'; c.fillRect(-3, -60, 6, 12);
  c.restore();
}

function kovaCiz(c, x, y, aci) {
  c.save(); c.translate(x, y); c.rotate(aci);
  c.fillStyle = '#7a8ca3'; c.beginPath(); c.moveTo(-70, -60); c.lineTo(70, -60); c.lineTo(55, 60); c.lineTo(-55, 60); c.closePath(); c.fill();
  c.fillStyle = '#9fb3c8'; c.fillRect(-74, -66, 148, 14);
  c.strokeStyle = '#56657a'; c.lineWidth = 6; c.beginPath(); c.arc(0, -60, 70, Math.PI, 0); c.stroke();
  c.restore();
}

export class Efektler {
  constructor(canvas) {
    this.c = canvas.getContext('2d');
    this.w = canvas.width; this.h = canvas.height;
    this.parcalar = [];
    this.son = performance.now();
    const dongu = (t) => { this.kare(t); requestAnimationFrame(dongu); };
    requestAnimationFrame(dongu);
  }

  ekle(p) { p.yas = 0; this.parcalar.push(p); }

  kare(t) {
    // Gerçek zamanla senkron kalsın diye kare süresi kısılmaz (yalnız sekme uykusu için 0,25 sn sınırı).
    const dt = Math.min(0.25, (t - this.son) / 1000);
    this.son = t;
    this.c.clearRect(0, 0, this.w, this.h);
    this.parcalar = this.parcalar.filter((p) => { p.yas += dt; const yasiyor = p.guncelle(dt); if (yasiyor) p.ciz(this.c); return yasiyor; });
  }

  baslat(ad, ortam = {}) { (this[ad] ?? (() => console.warn('bilinmeyen efekt', ad))).call(this, ortam); }

  // --- efektler ---------------------------------------------------------

  kalpler() {
    for (let i = 0; i < 28; i++) {
      const x0 = R(150, 930), gecik = R(0, 0.8), renk = SEC(['#ff5c8a', '#ff8fab', '#ff4d6d', '#ffc2d1']), s = R(1.6, 3.2);
      this.ekle({ guncelle() { return this.yas < 2.6 + gecik; },
        ciz(c) { const t = this.yas - gecik; if (t < 0) return;
          c.globalAlpha = Math.max(0, 1 - t / 2.6); kalpCiz(c, x0 + Math.sin(t * 4 + x0) * 30, 1700 - t * 520, s, renk); c.globalAlpha = 1; } });
    }
  }

  yildiz() {
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2, hiz = R(380, 650), renk = SEC(['#ffd166', '#fff3b0', '#ffffff', '#ff9f1c']);
      this.ekle({ guncelle() { return this.yas < 1.6; },
        ciz(c) { const t = this.yas; c.globalAlpha = 1 - t / 1.6;
          yildizCiz(c, BAS.x + Math.cos(a) * hiz * t, BAS.y + 80 + Math.sin(a) * hiz * t, 26 - t * 10, renk, t * 5); c.globalAlpha = 1; } });
    }
  }

  pasta() {
    const dusus = 0.9;
    this.ekle({ guncelle() { return this.yas < dusus; },
      ciz(c) { const k = Math.min(1, this.yas / dusus); pastaCiz(c, BAS.x + 10, -200 + (BAS.y - 60 + 200) * k * k, 1.15, Math.sin(this.yas * 8) * 0.15); } });
    // çarpma: krema sıçraması ve yüzde kalan lekeler
    setTimeout(() => {
      for (let i = 0; i < 40; i++) {
        let x = BAS.x, y = BAS.y - 40, vx = R(-520, 520), vy = R(-700, -150);
        const r = R(10, 26), renk = Math.random() < 0.75 ? '#ffffff' : '#f6a5c0';
        this.ekle({ guncelle(dt) { vy += 1500 * dt; x += vx * dt; y += vy * dt; return y < 1950; },
          ciz(c) { c.fillStyle = renk; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); } });
      }
      const lekeler = Array.from({ length: 9 }, () => ({ x: BAS.x + R(-95, 95), y: BAS.y + R(-70, 70), r: R(26, 52) }));
      this.ekle({ guncelle() { return this.yas < 4; },
        ciz(c) { c.globalAlpha = Math.min(1, (4 - this.yas) / 1.2); c.fillStyle = '#fffaf2';
          for (const l of lekeler) { c.beginPath(); c.arc(l.x, l.y, l.r, 0, Math.PI * 2); c.fill(); c.fillRect(l.x - l.r * 0.3, l.y, l.r * 0.6, l.r + this.yas * 25); }
          c.fillStyle = '#e8475f'; c.beginPath(); c.arc(BAS.x + 30, BAS.y - 85, 18, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1; } });
    }, dusus * 1000);
  }

  su() {
    // kova gelir, devrilir, su akar
    this.ekle({ guncelle() { return this.yas < 2.2; },
      ciz(c) { const t = this.yas; const y = t < 0.35 ? -120 + t / 0.35 * 300 : 180; const aci = t < 0.35 ? 0 : Math.min(2.2, (t - 0.35) * 6);
        c.globalAlpha = t > 1.8 ? (2.2 - t) / 0.4 : 1; kovaCiz(c, BAS.x - 40, y, aci); c.globalAlpha = 1; } });
    setTimeout(() => {
      for (let i = 0; i < 160; i++) {
        const gecik = R(0, 0.7);
        let x = BAS.x + R(-40, 80), y = 220, vx = R(-120, 120), vy = R(100, 400);
        this.ekle({ guncelle(dt) { if (this.yas < gecik) return true; vy += 2400 * dt; x += vx * dt; y += vy * dt;
            if (y > BAS.y - 60 && y < BAS.y) vx += (x < BAS.x ? -1 : 1) * 900 * dt; return y < 1950; },
          ciz(c) { if (this.yas < gecik) return; c.fillStyle = 'rgba(76,175,255,.85)'; c.beginPath(); c.ellipse(x, y, 7, 14, 0, 0, Math.PI * 2); c.fill(); } });
      }
      this.ekle({ guncelle() { return this.yas < 3.5; },
        ciz(c) { c.fillStyle = `rgba(90,170,255,${0.18 * Math.max(0, 1 - this.yas / 3.5)})`; c.fillRect(0, 0, 1080, 1920);
          c.fillStyle = 'rgba(76,175,255,.8)';
          for (let i = 0; i < 6; i++) { const x = BAS.x - 150 + i * 60, y = BAS.y + 60 + ((this.yas * 300 + i * 70) % 500); c.beginPath(); c.ellipse(x, y, 6, 11, 0, 0, Math.PI * 2); c.fill(); } } });
    }, 500);
  }

  korku({ sahne } = {}) {
    sahne?.classList.remove('sars'); void sahne?.offsetWidth; sahne?.classList.add('sars');
    this.ekle({ guncelle() { return this.yas < 0.35; },
      ciz(c) { c.fillStyle = `rgba(255,255,255,${1 - this.yas / 0.35})`; c.fillRect(0, 0, 1080, 1920); } });
    this.ekle({ guncelle() { return this.yas < 2.4; },
      ciz(c) { const s = Math.min(1, this.yas * 6) * (1 + Math.sin(this.yas * 30) * 0.04); c.save(); c.translate(BAS.x + 250, BAS.y - 140); c.scale(s, s);
        c.globalAlpha = Math.min(1, (2.4 - this.yas) * 2); c.font = '900 170px system-ui'; c.textAlign = 'center';
        c.lineWidth = 16; c.strokeStyle = '#fff'; c.strokeText('!!', 0, 0); c.fillStyle = '#ff3b5c'; c.fillText('!!', 0, 0); c.restore(); } });
    for (let i = 0; i < 4; i++) {
      const x = BAS.x + R(-150, 150), y0 = BAS.y + R(-120, -40);
      this.ekle({ guncelle() { return this.yas < 1.8; },
        ciz(c) { c.globalAlpha = 1 - this.yas / 1.8; c.fillStyle = '#7fd3ff'; c.beginPath(); const y = y0 + this.yas * 90;
          c.moveTo(x, y - 22); c.quadraticCurveTo(x + 16, y + 6, x, y + 12); c.quadraticCurveTo(x - 16, y + 6, x, y - 22); c.fill(); c.globalAlpha = 1; } });
    }
  }

  dusme() {
    // yere çarpma anında toz bulutu, yerdeyken başının etrafında dönen yıldızlar
    setTimeout(() => {
      for (let i = 0; i < 26; i++) {
        let x = R(200, 900), y = R(1640, 1760), vx = R(-160, 160), vy = R(-160, -40); const r = R(26, 60);
        this.ekle({ guncelle(dt) { x += vx * dt; y += vy * dt; return this.yas < 1.4; },
          ciz(c) { c.fillStyle = `rgba(230,210,190,${0.7 * (1 - this.yas / 1.4)})`; c.beginPath(); c.arc(x, y, r + this.yas * 30, 0, Math.PI * 2); c.fill(); } });
      }
      this.ekle({ guncelle() { return this.yas < 1.1; },
        ciz(c) { for (let i = 0; i < 5; i++) { const a = this.yas * 5 + (i * Math.PI * 2) / 5;
            yildizCiz(c, BAS.x - 40 + Math.cos(a) * 130, BAS.y + 400 + Math.sin(a) * 40, 24, '#ffd166', this.yas * 6); } } });
    }, 1000);
  }

  konfeti() {
    for (let i = 0; i < 260; i++) {
      let x = R(0, 1080), y = R(-900, -20), vy = R(220, 480), aci = R(0, 6);
      const w = R(12, 22), h = R(6, 12), renk = SEC(RENKLER), don = R(-8, 8), salinim = R(0, 6);
      this.ekle({ guncelle(dt) { y += vy * dt; aci += don * dt; return y < 1950 && this.yas < 7; },
        ciz(c) { c.save(); c.translate(x + Math.sin(this.yas * 3 + salinim) * 40, y); c.rotate(aci); c.fillStyle = renk; c.fillRect(-w / 2, -h / 2, w, h); c.restore(); } });
    }
    for (let i = 0; i < 7; i++) {
      const x = R(120, 960), gecik = R(0.2, 2.5), vy = R(500, 750);
      this.ekle({ guncelle() { return this.yas < gecik + 3.5; },
        ciz(c) { const t = this.yas - gecik; if (t < 0) return; pastaCiz(c, x, -150 + t * vy, 0.45, Math.sin(t * 5) * 0.4); } });
    }
  }
}
