// src/ay-olmasaydi/Video.tsx: Ay olmasaydı. Sahne planı: public/ay-olmasaydi/sahne-plani.md
// Şimdilik planın 0-2. satırları. Bütün anlar kelime zamanlarından gelir (an), elle saniye yazılmaz.
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
};

// ---------- Dünya yerleşimi ----------
const AY = {x: 620, y: 960, r: 150};
const UFUK = 1200;

// Sabit tohumlu rastgele: yıldızlar her karede aynı yerde.
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
const DALGALAR = (() => {
  const r = rastgele(11);
  return Array.from({length: 90}, () => {
    const d = r(); // 0 ufuk, 1 ön
    return {x: r() * 1400 - 160, y: UFUK + 12 + d * d * 900, w: 20 + d * 90 + r() * 30, f: r() * 6.28};
  });
})();

// ---------- Kamera ----------
type Kamera = {cx: number; cy: number; s: number; fx: number; fy: number};
const YAKIN: Kamera = {cx: AY.x, cy: AY.y, s: 2.0, fx: 540, fy: 1130};
const GENIS: Kamera = {cx: 540, cy: 960, s: 1.0, fx: 540, fy: 960};
const DURAKLAR: {t0: number; sure: number; k: Kamera}[] = [
  {t0: 0, sure: an(1, 0), k: {...YAKIN, s: 2.15}},
  {t0: an(1, 0) - 0.35, sure: 1.5, k: GENIS},
];
const kamera = (t: number): Kamera => {
  let k = YAKIN;
  for (const d of DURAKLAR) {
    const u = gir(t, d.t0, d.sure);
    if (u <= 0) break;
    k = {cx: karis(k.cx, d.k.cx, u), cy: karis(k.cy, d.k.cy, u), s: Math.exp(karis(Math.log(k.s), Math.log(d.k.s), u)), fx: karis(k.fx, d.k.fx, u), fy: karis(k.fy, d.k.fy, u)};
  }
  return {...k, cy: k.cy + Math.sin(t * 0.5) * 3};
};
const kameraDonusumu = (k: Kamera) => `translate(${k.fx},${k.fy}) scale(${k.s}) translate(${-k.cx},${-k.cy})`;

// ---------- Nesneler ----------
const Gok: React.FC<{t: number; yildiz: number}> = ({t, yildiz}) => (
  <>
    <rect x={-600} y={-1200} width={2300} height={UFUK + 1200} fill="url(#gok)" />
    {YILDIZLAR.map((y, i) => (
      <circle key={i} cx={y.x} cy={y.y} r={y.b} fill={RENK.krem} opacity={yildiz * (0.55 + 0.45 * Math.sin(t * y.h + y.f))} />
    ))}
  </>
);

const Ay: React.FC<{acik: number; kayip: number}> = ({acik, kayip}) => (
  <g transform={`translate(${AY.x},${AY.y})`}>
    <circle r={AY.r * 2.6} fill="url(#hale)" opacity={acik} />
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
    {/* kayıp Ay: yerinde kesik çizgili çember */}
    <circle r={AY.r} fill="none" stroke={RENK.krem} strokeWidth={4} strokeDasharray="18 16" opacity={0.55 * kayip} />
  </g>
);

const Deniz: React.FC<{t: number; yol: number}> = ({t, yol}) => (
  <>
    <rect x={-600} y={UFUK} width={2300} height={1400} fill="url(#deniz)" />
    {DALGALAR.map((d, i) => {
      const x = d.x + Math.sin(t * 0.6 + d.f) * 14;
      return <path key={i} d={`M ${x} ${d.y} q ${d.w / 2} -5 ${d.w} 0`} fill="none" stroke={RENK.denizAcik} strokeWidth={2 + (d.y - UFUK) / 250} strokeLinecap="round" opacity={0.8} />;
    })}
    {/* Ay'ın denizdeki ışık yolu */}
    <g opacity={yol}>
      {Array.from({length: 46}, (_, i) => {
        const d = i / 45;
        const y = UFUK + 8 + d * d * 760;
        const gen = (18 + d * 150) * (0.55 + 0.45 * Math.sin(t * 2.1 + i * 1.7));
        const x = AY.x + Math.sin(i * 2.3 + t * 0.8) * (8 + d * 60);
        return <rect key={i} x={x - gen / 2} y={y} width={gen} height={2 + d * 7} rx={3} fill={RENK.isik} opacity={0.75 - d * 0.35} />;
      })}
    </g>
  </>
);

// Uzakta alçak bir burun, önde kayalık kıyı ve iskele. Sonraki satırlarda gelgit cetveli son kazıkta.
const ISKELE = {y: 1505, kaziklar: [70, 170, 270, 370, 440]};
const Kiyi: React.FC = () => (
  <g fill={RENK.kara}>
    <path d={`M -600 ${UFUK} L -600 1150 C -300 1140 -60 1150 60 1175 C 120 1188 170 1196 240 ${UFUK} Z`} opacity={0.85} />
    <path d="M -600 2000 L -600 1480 C -300 1470 -110 1495 30 1555 C 140 1602 215 1700 250 2000 Z" />
    <rect x={-20} y={ISKELE.y} width={480} height={16} />
    {ISKELE.kaziklar.map((x) => (
      <rect key={x} x={x} y={ISKELE.y} width={14} height={x === 440 ? 130 : 95} />
    ))}
  </g>
);

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
  const kam = kameraDonusumu(kamera(t));

  // 0: "dengesini" de ufuk hafifçe yamulup düzelir.
  const yamuk = interpolate(t, [an(0, 5) - 0.1, an(0, 5) + 0.35, an(0, 6) + 0.6], [0, -2.2, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin)});
  // 1: "kaybolsa" da Ay söner, kesik çember kalır.
  const son = gir(t, an(1, 3), 0.7);
  // 2: ışık yolu silinir, gece kararır, yıldızlar belirginleşir.
  const yol = (1 - son) * 1 + son * (1 - gir(t, an(2, 0), 1.0)) * 0.35;
  const karanlik = gir(t, an(2, 0) + 0.1, 1.4);
  const yildiz = karis(0.45, 1, karanlik);

  return (
    <AbsoluteFill style={{background: RENK.gokUst}}>
      <Audio src={staticFile('ay-olmasaydi/ses.mp3')} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <defs>
          <linearGradient id="gok" x1={0} y1={0} x2={0} y2={1}>
            <stop offset="0" stopColor={RENK.gokUst} />
            <stop offset="0.7" stopColor="#13234d" />
            <stop offset="1" stopColor={RENK.gokAlt} />
          </linearGradient>
          <linearGradient id="deniz" x1={0} y1={0} x2={0} y2={1}>
            <stop offset="0" stopColor="#14295a" />
            <stop offset="1" stopColor={RENK.deniz} />
          </linearGradient>
          <radialGradient id="hale">
            <stop offset="0.35" stopColor={RENK.isik} stopOpacity={0.35} />
            <stop offset="0.6" stopColor={RENK.isik} stopOpacity={0.08} />
            <stop offset="1" stopColor={RENK.isik} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="ayGolge" cx="0.38" cy="0.35" r="0.75">
            <stop offset="0.6" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#3a2f10" stopOpacity={0.35} />
          </radialGradient>
        </defs>

        <g transform={kam}>
          <Gok t={t} yildiz={yildiz} />
          <Ay acik={1 - son} kayip={son} />
          <g transform={`rotate(${yamuk} ${AY.x} ${UFUK})`}>
            <Deniz t={t} yol={yol} />
            <Kiyi />
          </g>
        </g>
        <rect width={1080} height={1920} fill="#02040c" opacity={0.28 * karanlik} />
      </svg>

      <DevYazi t={t} kelimeler={DEV0} cikis={an(1, 0) - 0.35} boyut={102} vurgu="sessiz" />
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
