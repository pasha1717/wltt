// src/ortak/Kalip.tsx: "Ne olurdu?" videoları için hızlı ortak kalıp.
// Her satırda büyük, hareketli bir simge (emoji) ve isteğe bağlı bilgi kartı. Dev yazı 0, 10 ve 11. satırlarda.
// Anlar kelime zamanlarından gelir; simge satırın ilk kelimesinde değişir.
import React from 'react';
import {AbsoluteFill, Audio, Composition, Easing, interpolate, staticFile, useCurrentFrame} from 'remotion';

export type Kelime = {w: string; s: number; e: number; c: number};
export type Efekt = 'yuz' | 'son' | 'buyu' | 'kucul' | 'salla' | 'don' | 'dus' | 'kay';
export type Sahne = {ikon: string; efekt?: Efekt; kart?: string; vurgu?: string};
export type Ayar = {ses: string; ust: string; alt: string; parca: string; sahneler: Sahne[]; kirilma: {0: number[]; 10: number[]; 11: number[]}};

const FPS = 30;
const gir = (t: number, t0: number, sure = 0.8) =>
  interpolate(t, [t0, t0 + sure], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.45, 0, 0.55, 1)});
const karis = (a: number, b: number, u: number) => a + (b - a) * u;
const KREM = '#fff6e2';
const VURGU = '#ffcf4a';

const efektStil = (e: Efekt | undefined, u: number, t: number): React.CSSProperties => {
  switch (e) {
    case 'son':
      return {filter: `grayscale(${u}) brightness(${karis(1, 0.35, u)})`, transform: `scale(${karis(1, 0.85, u)})`};
    case 'buyu':
      return {transform: `scale(${karis(0.7, 1.15, u)})`};
    case 'kucul':
      return {transform: `scale(${karis(1.1, 0.45, u)})`, opacity: karis(1, 0.6, u)};
    case 'salla':
      return {transform: `rotate(${Math.sin(t * 9) * 10 * u}deg)`};
    case 'don':
      return {transform: `rotate(${u * 360}deg)`};
    case 'dus':
      return {transform: `translateY(${karis(-200, 120, u)}px)`};
    case 'kay':
      return {transform: `translateX(${karis(-120, 260, u)}px) rotate(${u * 25}deg)`};
    default:
      return {transform: `translateY(${Math.sin(t * 1.6) * 18}px)`};
  }
};

export const kalipKur = (K: Kelime[], ayar: Ayar) => {
  const an = (satir: number, kelime = 0) => K.filter((k) => k.c === satir)[kelime].s;
  const SATIR = Math.max(...K.map((k) => k.c)) + 1;
  const DEV = [0, 10, 11];

  const Dev: React.FC<{t: number; satir: number}> = ({t, satir}) => {
    const ks = K.filter((k) => k.c === satir);
    const sonraki = satir + 1 < SATIR ? an(satir + 1) : 1e9;
    if (t < ks[0].s - 0.1 || t > sonraki) return null;
    const cik = 1 - gir(t, sonraki - 0.4, 0.4);
    const kir = ayar.kirilma[satir as 0 | 10 | 11];
    return (
      <div style={{position: 'absolute', left: 50, right: 50, top: 200, textAlign: 'center', fontFamily: 'Caladea, Georgia, serif', fontWeight: 700, fontSize: 100, lineHeight: 1.15, color: KREM, opacity: cik, textShadow: '0 4px 22px rgba(0,0,0,.75)'}}>
        {ks.map((k, i) => {
          const u = gir(t, k.s - 0.06, 0.3);
          return (
            <React.Fragment key={i}>
              {kir.includes(i) && <br />}
              <span style={{display: 'inline-block', margin: '0 12px', opacity: u, transform: `translateY(${karis(18, 0, u)}px)`, color: k.w === ayar.sahneler[satir].vurgu ? VURGU : undefined}}>{k.w}</span>
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const Altyazi: React.FC<{t: number}> = ({t}) => {
    const aktif = K.filter((k) => k.s - 0.04 <= t).pop();
    if (!aktif || DEV.includes(aktif.c)) return null;
    return (
      <div style={{position: 'absolute', left: 80, right: 80, top: 1440, textAlign: 'center', fontFamily: 'Caladea, Georgia, serif', fontWeight: 700, fontSize: 62, lineHeight: 1.25, textShadow: '0 3px 14px rgba(0,0,0,.9), 0 0 4px rgba(0,0,0,.9)'}}>
        {K.filter((k) => k.c === aktif.c).map((k, i) => (
          <span key={i} style={{opacity: t >= k.s - 0.04 ? 1 : 0, color: k === aktif ? VURGU : KREM}}>
            {k.w}{' '}
          </span>
        ))}
      </div>
    );
  };

  const Video: React.FC = () => {
    const kare = useCurrentFrame();
    const t = kare / FPS;
    const satir = Math.max(0, ...K.filter((k) => k.s - 0.3 <= t).map((k) => k.c));
    const sahne = ayar.sahneler[satir];
    const bas = an(satir) - 0.3;
    const son = satir + 1 < SATIR ? an(satir + 1) - 0.3 : 1e9;
    const gel = gir(t, bas, 0.45);
    const git = gir(t, son - 0.35, 0.35);
    const efekt = gir(t, an(satir) + 0.2, Math.max(0.8, son - bas - 1));
    const devde = DEV.includes(satir);
    return (
      <AbsoluteFill style={{background: `linear-gradient(180deg, ${ayar.ust}, ${ayar.alt})`}}>
        <Audio src={staticFile(ayar.ses)} />
        {/* süzülen parçacıklar */}
        <svg width={1080} height={1920} style={{position: 'absolute'}}>
          {Array.from({length: 40}, (_, i) => {
            const x = (i * 263) % 1080;
            const y = 1920 - ((i * 517 + t * (20 + (i % 5) * 8)) % 2000);
            return <circle key={i} cx={x + Math.sin(t + i) * 20} cy={y} r={3 + (i % 4) * 2} fill={ayar.parca} opacity={0.35} />;
          })}
        </svg>
        <div style={{position: 'absolute', left: 0, right: 0, top: devde ? 820 : 560, height: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: gel * (1 - git), transform: `scale(${karis(0.85, 1, gel)})`}}>
          <div style={{fontSize: devde ? 340 : 400, lineHeight: 1, ...efektStil(sahne.efekt, efekt, t)}}>{sahne.ikon}</div>
        </div>
        {sahne.kart && !devde && (
          <div style={{position: 'absolute', left: 90, right: 90, top: 260, padding: '26px 34px', background: 'rgba(255,246,226,.95)', borderRadius: 26, boxShadow: '0 10px 40px rgba(0,0,0,.35)', textAlign: 'center', fontFamily: 'Caladea, Georgia, serif', fontWeight: 700, fontSize: 58, color: '#1f2a3a', opacity: gir(t, an(satir) + 0.1, 0.4) * (1 - git), transform: `translateY(${karis(-24, 0, gir(t, an(satir) + 0.1, 0.4))}px)`}}>
            {sahne.kart}
          </div>
        )}
        {DEV.map((d) => (
          <Dev key={d} t={t} satir={d} />
        ))}
        <Altyazi t={t} />
        <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.4) 100%)'}} />
      </AbsoluteFill>
    );
  };

  const sure = Math.ceil((K[K.length - 1].e + 1.2) * FPS);
  const Root: React.FC = () => <Composition id="Video" component={Video} durationInFrames={sure} fps={FPS} width={1080} height={1920} />;
  return Root;
};
