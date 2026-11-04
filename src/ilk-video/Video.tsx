// src/ilk-video/Video.tsx: Kalem kapağındaki delik. Şimdilik sahne planının 0-2. satırları.
// Bütün anlar kelime zamanlarından gelir (an), elle saniye yazılmaz.
import React from 'react';
import {AbsoluteFill, Audio, Composition, Easing, interpolate, staticFile, useCurrentFrame} from 'remotion';
import veri from '../../public/ilk-video/kelimeler.json';

type Kelime = {w: string; s: number; e: number; c: number};
const K = veri as Kelime[];
const FPS = 30;

const an = (satir: number, kelime = 0) => K.filter((k) => k.c === satir)[kelime].s;
const gir = (t: number, t0: number, sure = 0.8) =>
  interpolate(t, [t0, t0 + sure], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.45, 0, 0.55, 1)});
const karis = (a: number, b: number, u: number) => a + (b - a) * u;
// Çizgiyi baştan sona çizer. L yolun yaklaşık uzunluğu, biraz fazlası olabilir.
const ciz = (u: number, L: number) => ({strokeDasharray: `${L} ${L}`, strokeDashoffset: L * (1 - u)});

const RENK = {
  kagit: '#f3ead6',
  kare: '#bcd4e6',
  murekkep: '#1f3a93',
  koyu: '#1c2147',
  kirmizi: '#d4362c',
  kapak: '#2f6fd6',
  kapakKoyu: '#2052a8',
};

// Kalem defterde çapraz yatıyor. Yerel eksende x kalemin boyu, +x ucun (ve kapağın) yönü.
const KALEM = {x: 500, y: 800, aci: -32};
const dunya = (lx: number, ly = 0): [number, number] => {
  const a = (KALEM.aci * Math.PI) / 180;
  return [KALEM.x + lx * Math.cos(a) - ly * Math.sin(a), KALEM.y + lx * Math.sin(a) + ly * Math.cos(a)];
};

// Sahne yerleri (dünya koordinatı)
const DAMLA: [number, number] = [905, 650];
const SORU: [number, number] = [700, 840];
const CIZIK = {a: [968, 600], k: [800, 745], b: [636, 918]} as const;
const cizikNokta = (u: number): [number, number] => {
  const {a, k, b} = CIZIK;
  const m = 1 - u;
  return [m * m * a[0] + 2 * m * u * k[0] + u * u * b[0], m * m * a[1] + 2 * m * u * k[1] + u * u * b[1]];
};

type Kamera = {cx: number; cy: number; s: number; fx: number; fy: number};
const kamera = (t: number): Kamera => {
  const [ux, uy] = dunya(512, 0);
  const yakin: Kamera = {cx: ux, cy: uy, s: karis(4.6, 5.2, gir(t, 0, an(1, 0))), fx: 560, fy: 1150};
  const genis: Kamera = {cx: 560, cy: 740, s: 0.95, fx: 540, fy: 820};
  const u = gir(t, an(1, 0) - 0.2, 1.4);
  const drift = Math.sin(t * 0.7) * 3;
  return {
    cx: karis(yakin.cx, genis.cx, u) + drift,
    cy: karis(yakin.cy, genis.cy, u),
    s: Math.exp(karis(Math.log(yakin.s), Math.log(genis.s), u)),
    fx: karis(yakin.fx, genis.fx, u),
    fy: karis(yakin.fy, genis.fy, u),
  };
};
const kameraDonusumu = (k: Kamera) => `translate(${k.fx},${k.fy}) scale(${k.s}) translate(${-k.cx},${-k.cy})`;

const Defter: React.FC = () => (
  <>
    <rect x={-1500} y={-1500} width={4200} height={4500} fill={RENK.kagit} />
    <rect x={-1500} y={-1500} width={4200} height={4500} fill="url(#kareler)" />
  </>
);

// Tükenmez kalem: saydam gövde, mürekkep borusu, uç, yarı saydam mavi kapak.
const Kalem: React.FC<{kalk: number}> = ({kalk}) => {
  const cizgi = {stroke: RENK.koyu, strokeWidth: 3, strokeLinejoin: 'round' as const};
  return (
    <g transform={`translate(${KALEM.x},${KALEM.y}) rotate(${KALEM.aci})`}>
      {/* gölge */}
      <rect x={-525} y={-30} width={1050} height={74} rx={30} fill="#3a2f1c" opacity={0.16} filter="url(#golge)" />
      {/* arka tıpa */}
      <rect x={-528} y={-27} width={36} height={54} rx={8} fill={RENK.kapak} {...cizgi} />
      {/* gövde */}
      <rect x={-500} y={-32} width={832} height={64} rx={4} fill="#e9f0f6" opacity={0.92} {...cizgi} />
      <rect x={-488} y={-7} width={830} height={14} rx={7} fill={RENK.murekkep} />
      <path d="M -496 -13 L 328 -13 M -496 13 L 328 13" stroke="#ffffff" strokeWidth={4} opacity={0.8} />
      {/* uç */}
      <path d="M 330 -32 L 410 -9 L 410 9 L 330 32 Z" fill="#f4f6f8" {...cizgi} />
      <path d="M 410 -9 L 440 -4 L 440 4 L 410 9 Z" fill="#a3acb6" {...cizgi} />
      <circle cx={443} cy={0} r={3.5} fill="#5d6670" />
      {/* kapak */}
      <g transform={`translate(${karis(0, 135, kalk)},${karis(0, -78, kalk)}) rotate(${karis(0, 7, kalk)} 410 0)`}>
        <path d="M 300 -40 L 512 -40 Q 524 -40 524 -28 L 524 28 Q 524 40 512 40 L 300 40 Z" fill={RENK.kapak} opacity={0.8} {...cizgi} />
        <path d="M 306 -24 L 500 -24" stroke="#ffffff" strokeWidth={6} opacity={0.35} strokeLinecap="round" />
        <ellipse cx={520} cy={0} rx={11} ry={34} fill={RENK.kapakKoyu} stroke={RENK.koyu} strokeWidth={2.5} />
        <ellipse cx={521} cy={0} rx={5} ry={12} fill="#0d1838" />
        <path d="M 523 -9 Q 526 0 523 9" fill="none" stroke="#8fb4ff" strokeWidth={1.6} opacity={0.7} />
        <path d="M 382 -40 L 382 -58 L 508 -58 Q 516 -58 516 -50 L 516 -40" fill={RENK.kapakKoyu} {...cizgi} />
        <circle cx={392} cy={-58} r={8} fill={RENK.kapakKoyu} {...cizgi} />
      </g>
    </g>
  );
};

const KirmiziKalem: React.FC<{x: number; y: number; acik: number}> = ({x, y, acik}) => (
  <g transform={`translate(${x},${y}) rotate(38)`} opacity={acik}>
    <rect x={20} y={-18} width={700} height={52} rx={22} fill="#3a2f1c" opacity={0.15} filter="url(#golge)" />
    <path d="M 0 0 L 52 -20 L 52 20 Z" fill="#f4f6f8" stroke={RENK.koyu} strokeWidth={3} strokeLinejoin="round" />
    <path d="M 0 0 L 14 -5 L 14 5 Z" fill={RENK.kirmizi} />
    <rect x={52} y={-22} width={680} height={44} rx={6} fill={RENK.kirmizi} stroke={RENK.koyu} strokeWidth={3} />
    <path d="M 60 -9 L 725 -9" stroke="#ffffff" strokeWidth={5} opacity={0.3} />
  </g>
);

// Dev yazı: yalnız 0. satırda. Kelimeler söylendikçe gelir, "kural" kırmızı daireyle çevrilir.
const DevYazi: React.FC<{t: number}> = ({t}) => {
  const kelimeler = [
    {w: 'Bu', s: an(0, 2)},
    {w: 'deliği', s: an(0, 3)},
    {w: 'bir', s: an(0, 4)},
    null,
    {w: 'kural', s: an(0, 5)},
    {w: 'açtırdı.', s: an(0, 6)},
  ];
  const cik = 1 - gir(t, an(1, 0) - 0.3, 0.4);
  const daire = gir(t, an(0, 5) + 0.1, 0.5);
  if (cik <= 0) return null;
  return (
    <div style={{position: 'absolute', left: 60, right: 60, top: 300, textAlign: 'center', fontFamily: 'Caladea, Georgia, serif', fontWeight: 700, fontSize: 112, lineHeight: 1.18, color: RENK.murekkep, opacity: cik, paintOrder: 'stroke fill', WebkitTextStroke: `14px ${RENK.kagit}`}}>
      {kelimeler.map((k, i) => {
        if (!k) return <br key={i} />;
        const u = gir(t, k.s - 0.06, 0.25);
        return (
          <span key={i} style={{position: 'relative', display: 'inline-block', margin: '0 16px', opacity: u, transform: `translateY(${karis(18, 0, u)}px)`}}>
            {k.w}
            {k.w === 'kural' && (
              <svg style={{position: 'absolute', left: -14, top: -8, width: 'calc(100% + 50px)', height: 'calc(100% + 16px)', overflow: 'visible'}} viewBox="0 0 300 150" preserveAspectRatio="none">
                <path d="M 250 22 C 180 -6, 40 2, 14 60 C -6 110, 120 146, 220 130 C 300 116, 302 46, 222 18" fill="none" stroke={RENK.kirmizi} strokeWidth={9} strokeLinecap="round" {...ciz(daire, 820)} opacity={daire > 0 ? 1 : 0} />
              </svg>
            )}
          </span>
        );
      })}
    </div>
  );
};

// Altyazı: söylenen satır kelime kelime açılır. Dev yazı olan satırlarda (0, 9, 10) yoktur.
const DEV_YAZILI = [0, 9, 10];
const Altyazi: React.FC<{t: number}> = ({t}) => {
  const aktif = K.filter((k) => k.s - 0.04 <= t).pop();
  if (!aktif || DEV_YAZILI.includes(aktif.c)) return null;
  return (
    <div style={{position: 'absolute', left: 80, right: 80, top: 1380, textAlign: 'center', fontFamily: 'Caladea, Georgia, serif', fontWeight: 700, fontSize: 62, lineHeight: 1.25, paintOrder: 'stroke fill', WebkitTextStroke: `10px ${RENK.kagit}`}}>
      {K.filter((k) => k.c === aktif.c).map((k, i) => (
        <span key={i} style={{opacity: t >= k.s - 0.04 ? 1 : 0, color: k === aktif ? '#2a55d9' : RENK.koyu}}>
          {k.w}{' '}
        </span>
      ))}
    </div>
  );
};

const Video: React.FC = () => {
  const kare = useCurrentFrame();
  const t = kare / FPS;
  const kam = kameraDonusumu(kamera(t));
  const kaynar = Math.floor(kare / 5) % 7; // mürekkep çizgileri hafifçe titrer

  const kalk = gir(t, an(1, 0) + 0.45, 0.9); // kapak biraz kalkar
  const damla = interpolate(t, [an(1, 1) - 0.05, an(1, 1) + 0.25, an(1, 1) + 0.4], [0, 1.12, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const soru = gir(t, an(1, 3) - 0.1, 0.6);
  const soruNokta = gir(t, an(1, 3) + 0.45, 0.15);

  // Kırmızı kalem: "Değil." den önce gelir, tek çizgiyle üstünü çizer, sakin anda yerinde kalır, sonra çekilir.
  const gel = gir(t, an(2, 0) - 0.8, 0.75);
  const cizgi = gir(t, an(2, 0) - 0.05, 0.4);
  const git = gir(t, an(3, 0) - 0.5, 0.9);
  const [ux, uy] = cizgi > 0 ? cizikNokta(cizgi) : CIZIK.a;
  const kx = karis(karis(1300, ux, gel), 1400, git);
  const ky = karis(karis(380, uy, gel), 1250, git);

  return (
    <AbsoluteFill style={{background: RENK.kagit}}>
      <Audio src={staticFile('ilk-video/ses.mp3')} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <defs>
          <pattern id="kareler" width={56} height={56} patternUnits="userSpaceOnUse">
            <path d="M 56 0 L 0 0 L 0 56" fill="none" stroke={RENK.kare} strokeWidth={1.6} />
          </pattern>
          <filter id="golge" x="-10%" y="-50%" width="120%" height="200%">
            <feGaussianBlur stdDeviation={8} />
          </filter>
          <filter id="titrek">
            <feTurbulence type="fractalNoise" baseFrequency={0.018} numOctaves={2} seed={kaynar} />
            <feDisplacementMap in="SourceGraphic" scale={4} />
          </filter>
        </defs>

        <g transform={kam}>
          <Defter />
          <Kalem kalk={kalk} />
        </g>

        {/* mürekkep katmanı: elle çizilmiş gibi titrer */}
        <g filter="url(#titrek)">
          <g transform={kam}>
            <g transform={`translate(${DAMLA[0]},${DAMLA[1]}) rotate(-20) scale(${damla})`}>
              <path d="M 0 -48 C 16 -20 30 0 30 18 A 30 30 0 1 1 -30 18 C -30 0 -16 -20 0 -48 Z" fill={RENK.murekkep} stroke={RENK.murekkep} strokeWidth={3} />
              <path d="M -14 12 Q -16 26 -6 34" fill="none" stroke="#ffffff" strokeWidth={5} strokeLinecap="round" opacity={0.5} />
            </g>
            <g transform={`translate(${SORU[0]},${SORU[1]})`}>
              <path d="M -50 -46 C -50 -112 52 -116 52 -50 C 52 -10 2 -6 2 34" fill="none" stroke={RENK.murekkep} strokeWidth={14} strokeLinecap="round" {...ciz(soru, 340)} opacity={soru > 0 ? 1 : 0} />
              <circle cx={2} cy={78} r={11 * soruNokta} fill={RENK.murekkep} />
            </g>
            <path d={`M ${CIZIK.a[0]} ${CIZIK.a[1]} Q ${CIZIK.k[0]} ${CIZIK.k[1]} ${CIZIK.b[0]} ${CIZIK.b[1]}`} fill="none" stroke={RENK.kirmizi} strokeWidth={17} strokeLinecap="round" {...ciz(cizgi, 490)} opacity={cizgi > 0 ? 1 : 0} />
          </g>
        </g>

        <g transform={kam}>{gel > 0 && <KirmiziKalem x={kx} y={ky} acik={1} />}</g>
      </svg>

      <DevYazi t={t} />
      <Altyazi t={t} />

      {/* gren ve vinyet */}
      <svg width={1080} height={1920} style={{position: 'absolute', mixBlendMode: 'multiply', opacity: 0.16}}>
        <filter id="gren">
          <feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={2} seed={kare % 9} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={1080} height={1920} filter="url(#gren)" />
      </svg>
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(60,40,15,0.28) 100%)'}} />
    </AbsoluteFill>
  );
};

const sure = Math.ceil((K[K.length - 1].e + 1.2) * FPS);
export const Root: React.FC = () => <Composition id="Video" component={Video} durationInFrames={sure} fps={FPS} width={1080} height={1920} />;
