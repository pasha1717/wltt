// src/toz/Video.tsx: Dünya'da hiç toz olmasaydı. Tek dünya: soldan sağa Sahra, okyanus, Amazon; üstte gökyüzü ve bulutlar.
// Kamera bu manzarada süzülür. Bütün anlar kelime zamanlarından gelir (an).
import React from 'react';
import {AbsoluteFill, Audio, Composition, Easing, interpolate, staticFile, useCurrentFrame} from 'remotion';
import veri from '../../public/toz/kelimeler.json';

type Kelime = {w: string; s: number; e: number; c: number};
const K = veri as Kelime[];
const FPS = 30;
const an = (satir: number, kelime = 0) => K.filter((k) => k.c === satir)[kelime].s;
const gir = (t: number, t0: number, sure = 0.8) =>
  interpolate(t, [t0, t0 + sure], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.45, 0, 0.55, 1)});
const karis = (a: number, b: number, u: number) => a + (b - a) * u;

const RENK = {gokUst: '#3d7cc9', gokAlt: '#a9d2f2', kum: '#e6b873', kumKoyu: '#c9934f', deniz: '#2a6fb8', orman: '#2f7a3a', ormanKoyu: '#1f5a2a', toprak: '#6b4429', toz: '#e0b36a', krem: '#fff6e2', vurgu: '#ffcf4a', koyu: '#14213d'};
const YER = 1200;
const BULUT = {x: 3000, y: 220};

// ---------- Kamera ----------
type Kamera = {cx: number; cy: number; s: number; fy: number};
const ORMAN: Kamera = {cx: 3000, cy: 1000, s: 1.2, fy: 1150};
const DURAKLAR: {t0: number; sure: number; k: Kamera}[] = [
  {t0: an(2, 0) - 0.4, sure: 1.4, k: {cx: 3000, cy: 350, s: 1.0, fy: 820}},
  {t0: an(5, 0) - 0.3, sure: 1.3, k: {cx: BULUT.x + 30, cy: BULUT.y, s: 3.2, fy: 800}},
  {t0: an(7, 0) - 0.4, sure: 1.8, k: {cx: 1800, cy: 800, s: 0.3, fy: 860}},
  {t0: an(9, 0) - 0.4, sure: 1.5, k: {cx: 3000, cy: 1250, s: 1.3, fy: 860}},
  {t0: an(10, 0) - 0.5, sure: 1.2, k: ORMAN},
];
const kamera = (t: number): Kamera => {
  let k = ORMAN;
  for (const d of DURAKLAR) {
    const u = gir(t, d.t0, d.sure);
    if (u <= 0) break;
    const s = Math.exp(karis(Math.log(k.s), Math.log(d.k.s), u));
    const w = Math.abs(Math.log(d.k.s / k.s)) > 0.05 ? (1 / s - 1 / k.s) / (1 / d.k.s - 1 / k.s) : u;
    k = {cx: karis(k.cx, d.k.cx, w), cy: karis(k.cy, d.k.cy, w), s, fy: karis(k.fy, d.k.fy, u)};
  }
  return k;
};

const rastgele = (tohum: number) => {
  let s = tohum;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};
const AGACLAR = (() => {
  const r = rastgele(5);
  return Array.from({length: 40}, () => ({x: 2400 + r() * 1300, h: 120 + r() * 160, r: 60 + r() * 50}));
})().sort((a, b) => a.h - b.h);
const TOZLAR = (() => {
  const r = rastgele(9);
  return Array.from({length: 70}, () => ({x: r(), y: r(), f: r() * 6.28, b: 2 + r() * 4}));
})();

// Sahra'dan Amazon'a toz yolu (yay)
const yol = (u: number): [number, number] => [karis(500, 3000, u), YER - 300 - Math.sin(u * Math.PI) * 700];

const Manzara: React.FC<{t: number}> = ({t}) => (
  <g>
    <rect x={-1000} y={-1500} width={5600} height={YER + 1500} fill="url(#gok)" />
    {/* Sahra */}
    <path d={`M -1000 ${YER} L -1000 ${YER - 60} C -600 ${YER - 160} -300 ${YER - 40} 0 ${YER - 120} C 300 ${YER - 200} 600 ${YER - 40} 900 ${YER - 110} C 1000 ${YER - 130} 1080 ${YER - 60} 1150 ${YER} Z`} fill={RENK.kum} />
    <rect x={-1000} y={YER} width={2150} height={1400} fill={RENK.kumKoyu} />
    {/* okyanus */}
    <rect x={1150} y={YER - 10} width={1250} height={1410} fill={RENK.deniz} />
    {Array.from({length: 14}, (_, i) => (
      <path key={i} d={`M ${1180 + i * 85 + Math.sin(t + i) * 8} ${YER + 10 + (i % 3) * 30} q 20 -8 40 0`} fill="none" stroke="#9cc7f0" strokeWidth={4} strokeLinecap="round" />
    ))}
    {/* Amazon toprağı ve ağaçlar */}
    <rect x={2400} y={YER} width={2200} height={1400} fill={RENK.toprak} />
    {AGACLAR.map((a, i) => (
      <g key={i} transform={`translate(${a.x},${YER}) rotate(${Math.sin(t * 0.8 + i) * 1.2})`}>
        <rect x={-8} y={-a.h} width={16} height={a.h} fill="#4a2f1a" />
        <circle cx={0} cy={-a.h} r={a.r} fill={i % 2 ? RENK.orman : RENK.ormanKoyu} />
        <circle cx={-a.r * 0.5} cy={-a.h + a.r * 0.3} r={a.r * 0.7} fill={i % 3 ? RENK.ormanKoyu : '#3a8a44'} />
      </g>
    ))}
  </g>
);

const Bulutlar: React.FC<{incel: number}> = ({incel}) => (
  <g opacity={1 - 0.75 * incel}>
    {[[BULUT.x - 260, BULUT.y + 20, 1], [BULUT.x + 220, BULUT.y - 30, 0.8], [BULUT.x - 40, BULUT.y + 120, 0.9], [BULUT.x - 700, BULUT.y + 60, 0.7]].map(([x, y, s], i) => (
      <g key={i} transform={`translate(${x},${y}) scale(${s * (1 - 0.35 * incel)})`} fill="#ffffff">
        <circle r={90} />
        <circle cx={90} cy={20} r={70} />
        <circle cx={-90} cy={25} r={65} />
        <circle cx={30} cy={-50} r={70} />
      </g>
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
const DevYazi: React.FC<{t: number; kelimeler: DevKelime[]; cikis: number; boyut: number; vurgu?: string}> = ({t, kelimeler, cikis, boyut, vurgu}) => {
  const ilk = kelimeler.find((k) => k)!.s;
  if (t < ilk - 0.1 || t > cikis + 0.45) return null;
  const cik = 1 - gir(t, cikis, 0.45);
  return (
    <div style={{position: 'absolute', left: 50, right: 50, top: 230, textAlign: 'center', fontFamily: 'Caladea, Georgia, serif', fontWeight: 700, fontSize: boyut, lineHeight: 1.16, color: RENK.krem, opacity: cik, textShadow: '0 4px 22px rgba(5,10,30,.85)'}}>
      {kelimeler.map((k, i) => {
        if (!k) return <br key={i} />;
        const u = gir(t, k.s - 0.06, 0.3);
        return (
          <span key={i} style={{display: 'inline-block', margin: '0 12px', opacity: u, transform: `translateY(${karis(18, 0, u)}px)`, color: k.w === vurgu ? RENK.vurgu : undefined}}>
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
    <div style={{position: 'absolute', left: 80, right: 80, top: 1420, textAlign: 'center', fontFamily: 'Caladea, Georgia, serif', fontWeight: 700, fontSize: 62, lineHeight: 1.25, textShadow: '0 3px 14px rgba(5,10,30,.95), 0 0 4px rgba(5,10,30,.9)'}}>
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
  const k = kamera(t);
  const kam = `translate(540,${k.fy}) scale(${k.s}) translate(${-k.cx},${-k.cy})`;

  // 0: orman üstüne toz yağar. 1: "toz olmasaydı" da toz silinir, 8. satırda geri gelir.
  const tozYok = gir(t, an(1, 2), 0.7) * (1 - gir(t, an(7, 0), 0.6));
  // 3: gaz molekülleri mavi ışığı saçar.
  const molekul = gir(t, an(3, 4) - 0.1, 0.6) * (1 - gir(t, an(4, 0), 0.6));
  // 5: parçacık etrafında damla büyür. 6: parçacıksız yerde damla oluşmaz, bulutlar incelir.
  const damla = gir(t, an(5, 4) - 0.1, 1.2);
  const bos = gir(t, an(6, 0) - 0.1, 0.5);
  const incel = gir(t, an(6, 4) - 0.1, 1.0) * (1 - gir(t, an(7, 0), 0.8));
  // 8: toz bulutu çölden ormana akar, sayaç. 9: fosfor toprağa iner.
  const akis = gir(t, an(8, 0), an(8, 12) - an(8, 0) + 0.4);
  const sayac = gir(t, an(8, 4) - 0.1, 0.4) * (1 - gir(t, an(9, 0) - 0.3, 0.4));
  const fosfor = gir(t, an(9, 1) - 0.1, 1.6);
  const besle = gir(t, an(9, 4), 1.0);

  return (
    <AbsoluteFill style={{background: RENK.gokUst}}>
      <Audio src={staticFile('toz/ses.mp3')} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <defs>
          <linearGradient id="gok" x1={0} y1={0} x2={0} y2={1}>
            <stop offset="0" stopColor={RENK.gokUst} />
            <stop offset="1" stopColor={RENK.gokAlt} />
          </linearGradient>
        </defs>
        <g transform={kam}>
          <Manzara t={t} />
          {/* toprak beslenir */}
          <rect x={2400} y={YER} width={2200} height={220} fill="#3f8a3a" opacity={0.35 * besle * (1 - gir(t, an(10, 0), 1))} />
          <Bulutlar incel={incel} />

          {/* orman üstünde süzülen toz */}
          <g opacity={1 - tozYok}>
            {TOZLAR.map((p, i) => {
              const x = 2500 + p.x * 1100 + Math.sin(t * 0.7 + p.f) * 30;
              const y = 300 + ((p.y * 900 + t * 40) % 900);
              return <circle key={i} cx={x} cy={y} r={p.b} fill={RENK.toz} opacity={0.85} />;
            })}
          </g>
          {/* gaz molekülleri: mavi ışığı saçar */}
          <g opacity={molekul}>
            {Array.from({length: 18}, (_, i) => {
              const x = 2620 + (i % 6) * 150;
              const y = 120 + Math.floor(i / 6) * 160;
              return (
                <g key={i} transform={`translate(${x},${y})`}>
                  {[0, 60, 120, 180, 240, 300].map((a) => (
                    <path key={a} d={`M 0 0 L ${40 * Math.cos((a * Math.PI) / 180)} ${40 * Math.sin((a * Math.PI) / 180)}`} stroke="#2f66d8" strokeWidth={4} strokeLinecap="round" opacity={0.5 + 0.5 * Math.sin(t * 6 + i + a)} />
                  ))}
                  <circle r={9} fill="#ffffff" />
                </g>
              );
            })}
          </g>
          {/* bulut damlası yakın plan */}
          <g transform={`translate(${BULUT.x},${BULUT.y})`}>
            <circle r={karis(0, 26, damla)} fill="#cfe6ff" opacity={0.75} stroke="#ffffff" strokeWidth={2} />
            <circle r={4} fill={RENK.toz} opacity={damla > 0 ? 1 : 0} />
            <g transform="translate(70,0)" opacity={bos * (1 - gir(t, an(7, 0), 0.5))}>
              <circle r={22} fill="none" stroke="#ffffff" strokeWidth={2} strokeDasharray="5 5" />
            </g>
          </g>
          {/* çölden ormana toz akışı */}
          <g opacity={(1 - tozYok) * (akis > 0 ? 1 : 0) * (1 - gir(t, an(10, 0), 0.8))}>
            {Array.from({length: 60}, (_, i) => {
              const u = ((i / 60 + akis * 1.2) % 1) * Math.min(1, akis * 1.5);
              const [x, y] = yol(u);
              return <circle key={i} cx={x + Math.sin(i) * 60} cy={y + Math.cos(i * 1.7) * 60} r={14} fill={RENK.toz} opacity={0.75} />;
            })}
          </g>
          {/* fosfor toprağa iner */}
          <g opacity={fosfor > 0 ? 1 - gir(t, an(10, 0), 0.8) : 0}>
            {Array.from({length: 10}, (_, i) => {
              const x = 2680 + i * 64;
              const y = karis(950, YER + 60 + (i % 3) * 30, sinirli(fosfor * 1.3 - i * 0.03));
              return (
                <g key={i} transform={`translate(${x},${y})`}>
                  <circle r={16} fill={RENK.vurgu} />
                  <text y={6} textAnchor="middle" fontFamily="Caladea, Georgia, serif" fontWeight={700} fontSize={18} fill={RENK.koyu}>P</text>
                </g>
              );
            })}
          </g>
          {/* etiketler (geniş planda) */}
          <g opacity={gir(t, an(7, 0), 0.8) * (1 - gir(t, an(9, 0) - 0.3, 0.5))} fontFamily="Caladea, Georgia, serif" fontWeight={700} fontSize={140} fill={RENK.krem} textAnchor="middle">
            <text x={500} y={YER + 260}>SAHRA</text>
            <text x={1780} y={YER + 260}>OKYANUS</text>
            <text x={3000} y={YER + 260}>AMAZON</text>
          </g>
        </g>
      </svg>

      {sayac > 0 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center', fontFamily: 'Caladea, Georgia, serif', fontWeight: 700, fontSize: 96, color: RENK.krem, opacity: sayac, textShadow: '0 4px 20px rgba(5,10,30,.9)'}}>
          ≈ 28 milyon ton <span style={{fontSize: 52}}>/ yıl</span>
        </div>
      )}

      <DevYazi t={t} kelimeler={dev(0, [2, 7])} cikis={an(1, 0) - 0.35} boyut={92} vurgu="toz" />
      <DevYazi t={t} kelimeler={dev(10, [2])} cikis={an(11, 0) - 0.35} boyut={100} vurgu="kir" />
      <DevYazi t={t} kelimeler={dev(11, [3])} cikis={an(12, 0) - 0.5} boyut={104} vurgu="köprü." />
      <Altyazi t={t} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 60%, rgba(0,0,15,0.35) 100%)'}} />
    </AbsoluteFill>
  );
};
const sinirli = (x: number) => Math.max(0, Math.min(1, x));

const sure = Math.ceil((K[K.length - 1].e + 1.2) * FPS);
export const Root: React.FC = () => <Composition id="Video" component={Video} durationInFrames={sure} fps={FPS} width={1080} height={1920} />;
