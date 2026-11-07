// src/ay-olmasaydi/Video.tsx: Ay olmasaydı. Sahne planı: public/ay-olmasaydi/sahne-plani.md
// Tek dünya: kıyı, Dünya küresinin üstünde küçük bir nokta (KIYI_NOKTA, olcek Q). Kamera uzay koordinatında
// gezer; kıyıya inerken ya da uzaya çıkarken üstel yakınlaşır, kesme yoktur.
// Bütün anlar kelime zamanlarından gelir (an), elle saniye yazılmaz.
import React from 'react';
import {AbsoluteFill, Audio, Composition, Easing, interpolate, staticFile, useCurrentFrame} from 'remotion';
import veri from '../../public/ay-olmasaydi/kelimeler.json';

type Kelime = {w: string; s: number; e: number; c: number};
const K = veri as Kelime[];
const FPS = 30;

const an = (satir: number, kelime = 0) => K.filter((k) => k.c === satir)[kelime].s;
const gir = (t: number, t0: number, sure = 0.8) =>
  interpolate(t, [t0, t0 + sure], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.45, 0, 0.55, 1)});
const karis = (a: number, b: number, u: number) => a + (b - a) * u;
const sinir = (x: number) => Math.max(0, Math.min(1, x));

const RENK = {
  gokUst: '#08102a',
  gokAlt: '#1f3566',
  deniz: '#0d1d42',
  denizAcik: '#18306a',
  kara: '#060b1c',
  ay: '#f4ead0',
  ayKoyu: '#d9cba2',
  isik: '#ffe7a8',
  krem: '#f1e6c8',
  vurgu: '#ffd76a',
  uzay: '#040918',
  okyanus: '#245aa6',
  kita: '#4c9a63',
  mercan: '#ff8fb1',
};

// ---------- Kıyı dünyası (kıyı koordinatı) ----------
const AY = {x: 620, y: 960, r: 150};
const UFUK = 1200;
const ISKELE = {y: 1505, kaziklar: [70, 170, 270, 370, 440]};
const CETVEL = {x: 520, ust: 1390, alt: 1700, orta: 1560, birim: 40};
const GUNES_KIYI = {x: 250};

const rastgele = (tohum: number) => {
  let s = tohum;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};
const YILDIZLAR = (() => {
  const r = rastgele(7);
  return Array.from({length: 160}, () => ({x: r() * 1300 - 110, y: r() * (UFUK - 40) - 150, b: 0.8 + r() * 2.2, f: r() * 6.28, h: 0.6 + r() * 1.6}));
})();
const UZAY_YILDIZ = (() => {
  const r = rastgele(23);
  return Array.from({length: 220}, () => ({x: r() * 1080, y: r() * 1920, b: 0.6 + r() * 1.8, f: r() * 6.28, h: 0.5 + r() * 1.4}));
})();
const DALGALAR = (() => {
  const r = rastgele(11);
  return Array.from({length: 90}, () => {
    const d = r();
    return {x: r() * 1400 - 160, y: UFUK + 12 + d * d * 900, w: 20 + d * 90 + r() * 30, f: r() * 6.28};
  });
})();

// ---------- Uzay (uzay koordinatı) ----------
const DUNYA = {x: 540, y: 960, r: 300};
const KIYI_NOKTA = {x: 720, y: 820}; // kıyı, kürenin gece yanında bir nokta
const Q = 0.003; // kıyı dünyasının uzaydaki ölçeği
const AY_UZAY = {x: 880, y: 600, r: 52};
const GUNES_UZAY = {x: -70, y: 900, r: 110};
const EGIM = -23.4; // eksen Güneş'e (sola) yatık

// ---------- Kamera ----------
type Kamera = {cx: number; cy: number; s: number; fx: number; fy: number};
const kiyidan = (k: Kamera): Kamera => ({cx: KIYI_NOKTA.x + Q * (k.cx - 540), cy: KIYI_NOKTA.y + Q * (k.cy - 960), s: k.s / Q, fx: k.fx, fy: k.fy});
const K_YAKIN: Kamera = {cx: AY.x, cy: AY.y, s: 2.0, fx: 540, fy: 1130};
const K_GENIS: Kamera = {cx: 540, cy: 960, s: 1.0, fx: 540, fy: 960};
const UZAY: Kamera = {cx: 540, cy: 960, s: 1.0, fx: 540, fy: 860};
const DURAKLAR: {t0: number; sure: number; k: Kamera}[] = [
  {t0: 0, sure: an(1, 0), k: kiyidan({...K_YAKIN, s: 2.15})},
  {t0: an(1, 0) - 0.35, sure: 1.5, k: kiyidan(K_GENIS)},
  {t0: an(3, 0) - 0.3, sure: 1.3, k: kiyidan({cx: CETVEL.x - 20, cy: 1540, s: 2.3, fx: 540, fy: 820})},
  {t0: an(4, 0) - 0.2, sure: 1.5, k: kiyidan({cx: 545, cy: 2600, s: 1.55, fx: 540, fy: 900})},
  {t0: an(5, 0) - 0.25, sure: 1.1, k: kiyidan(K_GENIS)},
  {t0: an(5, 3) - 0.1, sure: 1.9, k: UZAY},
  {t0: an(9, 10) - 0.3, sure: 1.8, k: kiyidan({...K_YAKIN, s: 2.1})},
  {t0: an(12, 0) - 0.7, sure: 1.4, k: kiyidan(K_GENIS)},
];
const kamera = (t: number): Kamera => {
  let k = kiyidan(K_YAKIN);
  for (const d of DURAKLAR) {
    const u = gir(t, d.t0, d.sure);
    if (u <= 0) break;
    const s = Math.exp(karis(Math.log(k.s), Math.log(d.k.s), u));
    // Ölçek çok değişirken merkez, ekranda düzgün kaysın diye 1/s ile ağırlıklanır.
    const w = Math.abs(Math.log(d.k.s / k.s)) > 0.05 ? (1 / s - 1 / k.s) / (1 / d.k.s - 1 / k.s) : u;
    k = {cx: karis(k.cx, d.k.cx, w), cy: karis(k.cy, d.k.cy, w), s, fx: karis(k.fx, d.k.fx, u), fy: karis(k.fy, d.k.fy, u)};
  }
  return k;
};
const kameraDonusumu = (k: Kamera) => `translate(${k.fx},${k.fy}) scale(${k.s}) translate(${-k.cx},${-k.cy})`;

// ---------- Kıyı nesneleri ----------
const Gok: React.FC<{t: number; yildiz: number; gun: number}> = ({t, yildiz, gun}) => (
  <>
    <rect x={-600} y={-1200} width={2300} height={UFUK + 1200} fill="url(#gok)" />
    <rect x={-600} y={-1200} width={2300} height={UFUK + 1200} fill="url(#gokGun)" opacity={gun} />
    {YILDIZLAR.map((y, i) => (
      <circle key={i} cx={y.x} cy={y.y} r={y.b} fill={RENK.krem} opacity={yildiz * (1 - gun) * (0.55 + 0.45 * Math.sin(t * y.h + y.f))} />
    ))}
    {gun > 0 && (
      <g transform={`translate(${GUNES_KIYI.x},${karis(UFUK + 70, UFUK - 150, gun)})`} opacity={gun}>
        <circle r={260} fill="url(#gunesHale)" />
        <circle r={62} fill="#ffe3a0" />
      </g>
    )}
  </>
);

const Ay: React.FC<{acik: number; kayip: number; parla: number}> = ({acik, kayip, parla}) => (
  <g transform={`translate(${AY.x},${AY.y})`}>
    <circle r={AY.r * 2.6} fill="url(#hale)" opacity={acik * parla} />
    <g opacity={acik}>
      <circle r={AY.r} fill={RENK.ay} />
      <path d="M -95 -40 C -70 -85 -10 -90 10 -55 C 25 -25 -20 -5 -55 -10 C -85 -14 -105 -20 -95 -40 Z" fill={RENK.ayKoyu} opacity={0.75} />
      <path d="M 20 20 C 50 0 95 15 92 50 C 88 85 40 95 22 70 C 10 52 5 32 20 20 Z" fill={RENK.ayKoyu} opacity={0.65} />
      <path d="M -60 60 C -40 45 -10 55 -15 80 C -20 100 -60 100 -68 82 Z" fill={RENK.ayKoyu} opacity={0.55} />
      {[
        [-30, -100, 11],
        [70, -60, 14],
        [-110, 40, 9],
        [40, 115, 10],
        [105, -5, 7],
        [-20, 30, 6],
      ].map(([x, y, r], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r={r} fill={RENK.ayKoyu} />
          <path d={`M ${x - r * 0.8} ${y - r * 0.3} A ${r} ${r} 0 0 1 ${x + r * 0.8} ${y - r * 0.3}`} fill="none" stroke="#fffaf0" strokeWidth={2} opacity={0.7} />
        </g>
      ))}
      <circle r={AY.r} fill="url(#ayGolge)" />
    </g>
    <circle r={AY.r} fill="none" stroke={RENK.krem} strokeWidth={4} strokeDasharray="18 16" opacity={0.55 * kayip} />
  </g>
);

const Deniz: React.FC<{t: number; yol: number; gun: number; sakin: number}> = ({t, yol, gun, sakin}) => {
  const oyna = 1 - 0.85 * sakin;
  return (
    <>
      <rect x={-600} y={UFUK} width={2300} height={1400} fill="url(#deniz)" />
      <rect x={-600} y={UFUK} width={2300} height={900} fill="url(#denizGun)" opacity={gun * 0.85} />
      {DALGALAR.map((d, i) => {
        const x = d.x + Math.sin(t * 0.6 + d.f) * 14 * oyna;
        return <path key={i} d={`M ${x} ${d.y} q ${d.w / 2} ${-5 * oyna} ${d.w} 0`} fill="none" stroke={gun > 0.5 ? '#5f8fcb' : RENK.denizAcik} strokeWidth={2 + (d.y - UFUK) / 250} strokeLinecap="round" opacity={0.8} />;
      })}
      <g opacity={yol}>
        {Array.from({length: 46}, (_, i) => {
          const d = i / 45;
          const y = UFUK + 8 + d * d * 760;
          const gen = (18 + d * 150) * (0.55 + 0.45 * oyna * Math.sin(t * 2.1 + i * 1.7));
          const x = AY.x + Math.sin(i * 2.3 + t * 0.8 * oyna) * (8 + d * 60);
          return <rect key={i} x={x - gen / 2} y={y} width={gen} height={2 + d * 7} rx={3} fill={RENK.isik} opacity={0.75 - d * 0.35} />;
        })}
      </g>
    </>
  );
};

// Derinlik ve resif: kamera suya daldığında.
const MERCANLAR = [
  {x: 170, h: 170, renk: '#3f7b8f'},
  {x: 360, h: 240, renk: '#6b5f9e'},
  {x: 560, h: 200, renk: '#3f7b8f'},
  {x: 740, h: 260, renk: '#7b5a8a'},
  {x: 920, h: 180, renk: '#4a8a86'},
];
const TABAN = 2760;
const dallar = (h: number) => {
  // ana gövde ve iki yan dal: [x1,y1,x2,y2]
  return [
    [0, 0, 0, -h],
    [0, -h * 0.35, -h * 0.35, -h * 0.75],
    [0, -h * 0.5, h * 0.32, -h * 0.9],
    [-h * 0.2, -h * 0.58, -h * 0.42, -h * 0.68],
    [h * 0.18, -h * 0.75, h * 0.42, -h * 0.78],
  ];
};
const Derin: React.FC<{t: number; yumurta: number}> = ({t, yumurta}) => (
  <g>
    <rect x={-600} y={1800} width={2300} height={1900} fill="url(#derin)" />
    <path d={`M -600 ${TABAN + 10} C -200 ${TABAN - 30} 200 ${TABAN + 30} 540 ${TABAN} C 860 ${TABAN - 25} 1300 ${TABAN + 20} 1700 ${TABAN} L 1700 3700 L -600 3700 Z`} fill="#050b1e" />
    {MERCANLAR.map((m, i) => {
      const sal = Math.sin(t * 0.9 + i) * 2;
      return (
        <g key={i} transform={`translate(${m.x},${TABAN}) rotate(${sal})`}>
          {dallar(m.h).map(([x1, y1, x2, y2], j) => (
            <path key={j} d={`M ${x1} ${y1} L ${x2} ${y2}`} stroke={m.renk} strokeWidth={j === 0 ? 22 : 16} strokeLinecap="round" />
          ))}
          {dallar(m.h).map(([, , x2, y2], j) => (
            <g key={`u${j}`}>
              <circle cx={x2} cy={y2} r={11} fill="#9fc7c9" opacity={0.85} />
              {yumurta > 0 && <circle cx={x2} cy={y2 - 22 * yumurta} r={14 * yumurta} fill={RENK.mercan} />}
            </g>
          ))}
        </g>
      );
    })}
  </g>
);

const Kiyi: React.FC = () => (
  <g fill={RENK.kara}>
    <path d={`M -600 ${UFUK} L -600 1150 C -300 1140 -60 1150 60 1175 C 120 1188 170 1196 240 ${UFUK} Z`} opacity={0.85} />
    <path d="M -600 2100 L -600 1480 C -300 1470 -110 1495 30 1555 C 140 1602 215 1700 250 2100 Z" />
    <rect x={-20} y={ISKELE.y} width={480} height={16} />
    {ISKELE.kaziklar.map((x) => (
      <rect key={x} x={x} y={ISKELE.y} width={14} height={x === 440 ? 130 : 95} />
    ))}
  </g>
);

// Gelgit cetveli: su düzeyi inip çıkar. "üçte birine" de aralık küçülür, eski sınırlar kesik çizgi olarak kalır.
const Cetvel: React.FC<{t: number; genlik: number; iz: number; suGor: number}> = ({t, genlik, iz, suGor}) => {
  const su = CETVEL.orta + genlik * Math.sin((t * 2 * Math.PI) / 1.8);
  const x = CETVEL.x;
  const cizgiler: React.ReactNode[] = [];
  for (let y = CETVEL.ust + 10; y <= CETVEL.alt - 20; y += 10) {
    const kalin = (y - CETVEL.orta) % CETVEL.birim === 0;
    cizgiler.push(<path key={y} d={`M ${x} ${y} L ${x + (kalin ? 26 : 13)} ${y}`} stroke={RENK.kara} strokeWidth={kalin ? 3.5 : 2} />);
  }
  return (
    <g>
      <rect x={x - 8} y={CETVEL.ust - 20} width={10} height={CETVEL.alt - CETVEL.ust + 20} fill={RENK.kara} />
      <rect x={x} y={CETVEL.ust} width={34} height={CETVEL.alt - CETVEL.ust} rx={2} fill="#e9dfc2" opacity={karis(0.35, 1, suGor)} />
      {cizgiler}
      {[CETVEL.orta - 60, CETVEL.orta + 60].map((y) => (
        <path key={y} d={`M ${x - 60} ${y} L ${x + 94} ${y}`} stroke={RENK.krem} strokeWidth={3} strokeDasharray="10 8" opacity={0.8 * iz * suGor} />
      ))}
      <g opacity={suGor}>
        <rect x={-600} y={su} width={2300} height={CETVEL.alt + 200 - su} fill="#1d4782" opacity={0.7} />
        <path d={`M -600 ${su} ${Array.from({length: 46}, () => 'q 25 -6 50 0').join(' ')}`} fill="none" stroke="#bcd6f2" strokeWidth={3} strokeLinecap="round" />
      </g>
    </g>
  );
};

// ---------- Uzay nesneleri ----------
const KITALAR = [
  'M -150 -200 C -60 -240 40 -190 20 -120 C 0 -60 -80 -40 -120 -80 C -170 -120 -210 -170 -150 -200 Z',
  'M 60 -20 C 140 -40 190 30 160 110 C 130 190 70 230 40 170 C 20 120 0 30 60 -20 Z',
  'M -320 20 C -260 0 -220 60 -250 120 C -280 170 -340 150 -350 90 C -360 50 -350 30 -320 20 Z',
  'M 300 -160 C 380 -190 460 -140 430 -80 C 400 -30 330 -40 300 -80 C 280 -110 270 -145 300 -160 Z',
  'M -480 -120 C -420 -150 -360 -110 -380 -60 C -400 -20 -460 -30 -490 -70 Z',
];
const nokta = (aci: number, r: number): [number, number] => {
  const a = (aci * Math.PI) / 180;
  return [DUNYA.x + r * Math.sin(a), DUNYA.y - r * Math.cos(a)];
};
const dilim = (a1: number, a2: number, r1: number, r2: number) => {
  const [x1, y1] = nokta(a1, r2);
  const [x2, y2] = nokta(a2, r2);
  const [x3, y3] = nokta(a2, r1);
  const [x4, y4] = nokta(a1, r1);
  return `M ${x1} ${y1} A ${r2} ${r2} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${r1} ${r1} 0 0 0 ${x4} ${y4} Z`;
};

const GunesIkon: React.FC<{x: number; y: number; o: number}> = ({x, y, o}) => (
  <g transform={`translate(${x},${y})`} opacity={o}>
    <circle r={18} fill={RENK.vurgu} />
    {Array.from({length: 8}, (_, i) => {
      const a = (i * Math.PI) / 4;
      return <path key={i} d={`M ${26 * Math.cos(a)} ${26 * Math.sin(a)} L ${38 * Math.cos(a)} ${38 * Math.sin(a)}`} stroke={RENK.vurgu} strokeWidth={5} strokeLinecap="round" />;
    })}
  </g>
);
const KarIkon: React.FC<{x: number; y: number; o: number}> = ({x, y, o}) => (
  <g transform={`translate(${x},${y})`} opacity={o} stroke="#cfe6ff" strokeWidth={5} strokeLinecap="round">
    {[0, 60, 120].map((a) => (
      <g key={a} transform={`rotate(${a})`}>
        <path d="M 0 -34 L 0 34 M -9 -24 L 0 -15 L 9 -24 M -9 24 L 0 15 L 9 24" fill="none" />
      </g>
    ))}
  </g>
);

const Kure: React.FC<{t: number; egim: number; eksen: number; buz: number; mevsim: number}> = ({t, egim, eksen, buz, mevsim}) => {
  const don = (t * 22) % 1000;
  const {x, y, r} = DUNYA;
  const [kx, ky] = nokta(egim, r + 150);
  const [gx, gy] = nokta(egim + 180, r + 150);
  const kuzeyYaz = egim < 0 ? 1 : 0;
  return (
    <g>
      <circle cx={x} cy={y} r={r + 40} fill="url(#atmosfer)" />
      <g clipPath="url(#kureKes)">
        <circle cx={x} cy={y} r={r} fill={RENK.okyanus} />
        <g transform={`rotate(${egim} ${x} ${y})`}>
          {[-1000, 0, 1000].map((o) => (
            <g key={o} transform={`translate(${x - don + o},${y})`}>
              {KITALAR.map((d, i) => (
                <path key={i} d={d} fill={RENK.kita} />
              ))}
            </g>
          ))}
          <circle cx={x} cy={y - r} r={buz} fill="#f4f8fb" />
          <circle cx={x} cy={y + r} r={40} fill="#f4f8fb" />
        </g>
        <circle cx={x} cy={y} r={r} fill="url(#geceYani)" />
        <circle cx={x} cy={y} r={r} fill="url(#kureIsik)" />
      </g>
      {/* eksen */}
      <g transform={`rotate(${egim} ${x} ${y})`} opacity={eksen > 0 ? 1 : 0}>
        <path d={`M ${x} ${y - r - 90} L ${x} ${y + r + 90}`} stroke={RENK.krem} strokeWidth={5} strokeLinecap="round" strokeDasharray={`${(2 * r + 180) * eksen} 2000`} />
        <path d={`M ${x - 12} ${y - r - 74} L ${x} ${y - r - 92} L ${x + 12} ${y - r - 74}`} fill="none" stroke={RENK.krem} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={eksen} />
      </g>
      <GunesIkon x={kx} y={ky} o={mevsim * kuzeyYaz} />
      <KarIkon x={kx} y={ky} o={mevsim * (1 - kuzeyYaz)} />
      <GunesIkon x={gx} y={gy} o={mevsim * (1 - kuzeyYaz)} />
      <KarIkon x={gx} y={gy} o={mevsim * kuzeyYaz} />
    </g>
  );
};

// ---------- Yazılar ----------
type DevKelime = {w: string; s: number} | null;
const dev = (satir: number, kirilma: number[]): DevKelime[] => {
  const sonuc: DevKelime[] = [];
  K.filter((k) => k.c === satir).forEach((k, i) => {
    if (kirilma.includes(i)) sonuc.push(null);
    sonuc.push({w: k.w, s: k.s});
  });
  return sonuc;
};
const DEV0 = dev(0, [1, 4, 5]);
const DEV10 = dev(10, [2]);
const DEV11 = dev(11, [3, 6, 10]);

const DevYazi: React.FC<{t: number; kelimeler: DevKelime[]; cikis: number; boyut: number; vurgu?: string}> = ({t, kelimeler, cikis, boyut, vurgu}) => {
  const ilk = kelimeler.find((k) => k)!.s;
  if (t < ilk - 0.1 || t > cikis + 0.45) return null;
  const cik = 1 - gir(t, cikis, 0.45);
  return (
    <div style={{position: 'absolute', left: 50, right: 50, top: 260, textAlign: 'center', fontFamily: 'Caladea, Georgia, serif', fontWeight: 700, fontSize: boyut, lineHeight: 1.16, color: RENK.krem, opacity: cik, textShadow: '0 4px 24px rgba(4,8,24,.9)'}}>
      {kelimeler.map((k, i) => {
        if (!k) return <br key={i} />;
        const u = gir(t, k.s - 0.06, 0.3);
        return (
          <span key={i} style={{display: 'inline-block', margin: '0 14px', opacity: u, transform: `translateY(${karis(18, 0, u)}px)`, color: k.w === vurgu ? RENK.vurgu : undefined}}>
            {k.w}
          </span>
        );
      })}
    </div>
  );
};

const DEV_YAZILI = [0, 10, 11];
const Altyazi: React.FC<{t: number}> = ({t}) => {
  const aktif = K.filter((k) => k.s - 0.04 <= t).pop();
  if (!aktif || DEV_YAZILI.includes(aktif.c)) return null;
  return (
    <div style={{position: 'absolute', left: 80, right: 80, top: 1380, textAlign: 'center', fontFamily: 'Caladea, Georgia, serif', fontWeight: 700, fontSize: 62, lineHeight: 1.25, textShadow: '0 3px 14px rgba(4,8,24,.95), 0 0 4px rgba(4,8,24,.9)'}}>
      {K.filter((k) => k.c === aktif.c).map((k, i) => (
        <span key={i} style={{opacity: t >= k.s - 0.04 ? 1 : 0, color: k === aktif ? RENK.vurgu : RENK.krem}}>
          {k.w}{' '}
        </span>
      ))}
    </div>
  );
};

// ---------- Video ----------
const Video: React.FC = () => {
  const kare = useCurrentFrame();
  const t = kare / FPS;
  const kam = kamera(t);
  const donusum = kameraDonusumu(kam);
  const kiyiOlcek = kam.s * Q;
  const kiyiGor = interpolate(kiyiOlcek, [0.1, 0.45], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const uzayGor = 1 - interpolate(kiyiOlcek, [0.2, 0.7], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

  // --- Kıyı durumu ---
  const yamuk = interpolate(t, [an(0, 5) - 0.1, an(0, 5) + 0.35, an(0, 6) + 0.6], [0, -2.2, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin)});
  const geriGel = gir(t, an(9, 5), 0.5); // kamera uzaydayken Ay kıyıda yerine döner
  const son = gir(t, an(1, 3), 0.7) * (1 - geriGel);
  const yolSil = gir(t, an(2, 0), 1.0);
  const yol = (1 - son) + son * (1 - yolSil) * 0.35;
  const gun = gir(t, an(3, 0) - 0.3, 1.2) * (1 - gir(t, an(4, 0) - 0.2, 1.2));
  const karanlik = gir(t, an(2, 0) + 0.1, 1.4) * (1 - geriGel) * (1 - gun);
  const yildiz = karis(0.45, 1, karanlik);
  const genlik = karis(60, 20, gir(t, an(3, 3), 0.8));
  const iz = gir(t, an(3, 3), 0.5);
  const yumurta = interpolate(t, [an(4, 4) - 0.1, an(4, 4) + 0.5, an(4, 6), an(4, 6) + 0.9], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const sakin = gir(t, an(11, 8), 1.4);
  const parla = 1 + 0.12 * gir(t, an(12, 0), 1) * Math.sin(t * 2.2);

  // --- Uzay durumu ---
  const eksen = gir(t, an(6, 0), 0.9);
  const mevsimSal = gir(t, an(6, 3) - 0.1, 1.0) - gir(t, an(6, 6) + 0.1, 1.0);
  const mevsim = gir(t, an(6, 3) - 0.1, 0.4) * (1 - gir(t, an(7, 0), 0.5));
  const ayVar = sinir(gir(t, an(7, 0) - 0.1, 0.7) * (1 - gir(t, an(8, 0), 0.6)) + gir(t, an(9, 0), 0.7));
  const bag = gir(t, an(7, 3) - 0.1, 0.6) * ayVar;
  const kucuk = gir(t, an(7, 5), 1.0) * 1.2;
  const buyu = gir(t, an(8, 7) - 0.2, 1.8) * (1 - gir(t, an(9, 1), 1.4));
  const genlikE = karis(kucuk, 10, buyu);
  const faz = Math.sin(((t - an(7, 5)) * 2 * Math.PI) / 2.4);
  const egim = EGIM * (1 - 2 * mevsimSal) + genlikE * faz;
  const dilimGor = gir(t, an(7, 8) - 0.1, 0.5);
  const etiket = dilimGor * (1 - sinir((genlikE - 1.2) / 3));
  const buzul = gir(t, an(9, 5) - 0.1, 0.8);
  const buz = 46 + buzul * (26 - 26 * faz);
  const sayacGor = gir(t, an(8, 2) - 0.2, 0.3) * (1 - gir(t, an(9, 0), 0.5));
  const sayac = Math.round(40 * gir(t, an(8, 2), an(8, 10) - an(8, 2))) * 1000;
  const [ekx, eky] = nokta(egim, DUNYA.r + 90);

  return (
    <AbsoluteFill style={{background: RENK.uzay}}>
      <Audio src={staticFile('ay-olmasaydi/ses.mp3')} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <defs>
          <linearGradient id="gok" x1={0} y1={0} x2={0} y2={1}>
            <stop offset="0" stopColor={RENK.gokUst} />
            <stop offset="0.7" stopColor="#13234d" />
            <stop offset="1" stopColor={RENK.gokAlt} />
          </linearGradient>
          <linearGradient id="gokGun" x1={0} y1={0} x2={0} y2={1}>
            <stop offset="0" stopColor="#3f72b8" />
            <stop offset="0.75" stopColor="#9cb9d8" />
            <stop offset="1" stopColor="#f2c99c" />
          </linearGradient>
          <linearGradient id="deniz" x1={0} y1={0} x2={0} y2={1}>
            <stop offset="0" stopColor="#14295a" />
            <stop offset="1" stopColor={RENK.deniz} />
          </linearGradient>
          <linearGradient id="denizGun" x1={0} y1={0} x2={0} y2={1}>
            <stop offset="0" stopColor="#4f7fb8" />
            <stop offset="1" stopColor="#24508c" />
          </linearGradient>
          <linearGradient id="derin" x1={0} y1={0} x2={0} y2={1}>
            <stop offset="0" stopColor={RENK.deniz} stopOpacity={0} />
            <stop offset="0.12" stopColor="#0b1838" />
            <stop offset="1" stopColor="#030817" />
          </linearGradient>
          <radialGradient id="hale">
            <stop offset="0.35" stopColor={RENK.isik} stopOpacity={0.35} />
            <stop offset="0.6" stopColor={RENK.isik} stopOpacity={0.08} />
            <stop offset="1" stopColor={RENK.isik} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="gunesHale">
            <stop offset="0.2" stopColor="#ffe3a0" stopOpacity={0.6} />
            <stop offset="1" stopColor="#ffe3a0" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="ayGolge" cx="0.38" cy="0.35" r="0.75">
            <stop offset="0.6" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#3a2f10" stopOpacity={0.35} />
          </radialGradient>
          <radialGradient id="kiyiMaskeRenk">
            <stop offset="0.85" stopColor="#fff" />
            <stop offset="1" stopColor="#000" />
          </radialGradient>
          <mask id="kiyiMaske" maskUnits="userSpaceOnUse" x={-2000} y={-2000} width={5000} height={8000}>
            <ellipse cx={540} cy={1600} rx={1500} ry={2300} fill="url(#kiyiMaskeRenk)" />
          </mask>
          <clipPath id="kureKes">
            <circle cx={DUNYA.x} cy={DUNYA.y} r={DUNYA.r} />
          </clipPath>
          <linearGradient id="geceYani" x1={0} y1={0} x2={1} y2={0}>
            <stop offset="0.48" stopColor="#020616" stopOpacity={0} />
            <stop offset="0.62" stopColor="#020616" stopOpacity={0.72} />
            <stop offset="1" stopColor="#020616" stopOpacity={0.8} />
          </linearGradient>
          <radialGradient id="kureIsik" cx="0.3" cy="0.35" r="0.8">
            <stop offset="0" stopColor="#fff" stopOpacity={0.18} />
            <stop offset="0.6" stopColor="#fff" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="atmosfer">
            <stop offset="0.86" stopColor="#7fb2ff" stopOpacity={0.35} />
            <stop offset="1" stopColor="#7fb2ff" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="uzayGunes">
            <stop offset="0.15" stopColor="#fff2c4" stopOpacity={0.9} />
            <stop offset="0.45" stopColor="#ffd27a" stopOpacity={0.25} />
            <stop offset="1" stopColor="#ffd27a" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="ayUzayHale">
            <stop offset="0.4" stopColor={RENK.isik} stopOpacity={0.3} />
            <stop offset="1" stopColor={RENK.isik} stopOpacity={0} />
          </radialGradient>
        </defs>

        {/* uzay yıldızları ekrana sabit */}
        <g opacity={uzayGor}>
          {UZAY_YILDIZ.map((y, i) => (
            <circle key={i} cx={y.x} cy={y.y} r={y.b} fill={RENK.krem} opacity={0.5 + 0.4 * Math.sin(t * y.h + y.f)} />
          ))}
        </g>

        <g transform={donusum}>
          {/* uzay: kamera kıyıdayken hiç çizilmez (dev ölçekte tarayıcıyı kilitliyor) */}
          {uzayGor > 0 && (
          <>
          <circle cx={GUNES_UZAY.x} cy={GUNES_UZAY.y} r={560} fill="url(#uzayGunes)" opacity={uzayGor} />
          <circle cx={GUNES_UZAY.x} cy={GUNES_UZAY.y} r={GUNES_UZAY.r} fill="#fff1c9" opacity={uzayGor} />
          <ellipse cx={DUNYA.x} cy={DUNYA.y} rx={440} ry={130} transform={`rotate(-18 ${DUNYA.x} ${DUNYA.y})`} fill="none" stroke={RENK.krem} strokeWidth={2} strokeDasharray="6 12" opacity={0.35 * uzayGor * eksen} />
          <path d={dilim(EGIM - genlikE, EGIM + genlikE + 0.01, DUNYA.r + 20, DUNYA.r + 120)} fill={RENK.vurgu} opacity={0.32 * dilimGor} />
          <Kure t={t} egim={egim} eksen={eksen} buz={buz} mevsim={mevsim} />
          {etiket > 0 && (() => {
            const [lx, ly] = nokta(EGIM - 14, DUNYA.r + 150);
            return (
              <text x={lx} y={ly} textAnchor="middle" fontFamily="Caladea, Georgia, serif" fontWeight={700} fontSize={44} fill={RENK.vurgu} opacity={etiket}>
                2,5°
              </text>
            );
          })()}
          <path d={`M ${AY_UZAY.x} ${AY_UZAY.y} L ${ekx} ${eky}`} stroke={RENK.isik} strokeWidth={2.5} strokeDasharray="4 8" opacity={0.8 * bag} />
          <g transform={`translate(${AY_UZAY.x},${AY_UZAY.y})`}>
            <circle r={AY_UZAY.r * 2.4} fill="url(#ayUzayHale)" opacity={ayVar} />
            <circle r={AY_UZAY.r} fill={RENK.ay} opacity={ayVar} />
            <circle cx={-14} cy={-10} r={12} fill={RENK.ayKoyu} opacity={ayVar} />
            <circle cx={16} cy={16} r={9} fill={RENK.ayKoyu} opacity={ayVar} />
            <circle r={AY_UZAY.r} fill="none" stroke={RENK.krem} strokeWidth={3} strokeDasharray="10 9" opacity={0.6 * (1 - ayVar) * uzayGor} />
          </g>
          </>
          )}

          {/* kıyı: küre üstündeki nokta */}
          {kiyiGor > 0 && (
            <g transform={`translate(${KIYI_NOKTA.x},${KIYI_NOKTA.y}) scale(${Q}) translate(-540,-960)`} opacity={kiyiGor} mask="url(#kiyiMaske)">
              <Gok t={t} yildiz={yildiz} gun={gun} />
              <Ay acik={1 - son} kayip={son} parla={parla} />
              <g transform={`rotate(${yamuk} ${AY.x} ${UFUK})`}>
                <Deniz t={t} yol={yol} gun={gun} sakin={sakin} />
                <Derin t={t} yumurta={yumurta} />
                <Kiyi />
                <Cetvel t={t} genlik={genlik} iz={iz} suGor={gun} />
              </g>
              <rect x={-600} y={-1200} width={2300} height={4900} fill="#02040c" opacity={0.28 * karanlik} />
            </g>
          )}
        </g>
      </svg>

      {sayacGor > 0 && (
        <div style={{position: 'absolute', right: 70, top: 250, fontFamily: 'Caladea, Georgia, serif', fontWeight: 700, fontSize: 64, color: RENK.krem, opacity: sayacGor, textShadow: '0 3px 14px rgba(4,8,24,.95)'}}>
          {sayac.toLocaleString('tr-TR')} yıl
        </div>
      )}

      <DevYazi t={t} kelimeler={DEV0} cikis={an(1, 0) - 0.35} boyut={102} vurgu="sessiz" />
      <DevYazi t={t} kelimeler={DEV10} cikis={an(11, 0) - 0.35} boyut={112} vurgu="lambası" />
      <DevYazi t={t} kelimeler={DEV11} cikis={an(12, 0) - 0.55} boyut={98} vurgu="el." />
      <Altyazi t={t} />

      <svg width={1080} height={1920} style={{position: 'absolute', mixBlendMode: 'screen', opacity: 0.07}}>
        <filter id="gren">
          <feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={2} seed={kare % 9} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={1080} height={1920} filter="url(#gren)" />
      </svg>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,10,0.45) 100%)'}} />
    </AbsoluteFill>
  );
};

const sure = Math.ceil((K[K.length - 1].e + 1.2) * FPS);
export const Root: React.FC = () => <Composition id="Video" component={Video} durationInFrames={sure} fps={FPS} width={1080} height={1920} />;
