// src/dunya-dursaydi/Video.tsx: Dünya dönmeyi bıraksaydı. Tek dünya: büyük küre, üstünde bir bank, ev, ağaç ve deniz.
// Kamera yüzeyle küre arasında üstel yakınlaşır. Bütün anlar kelime zamanlarından gelir (an).
import React from 'react';
import {AbsoluteFill, Audio, Composition, Easing, interpolate, staticFile, useCurrentFrame} from 'remotion';
import veri from '../../public/dunya-dursaydi/kelimeler.json';

type Kelime = {w: string; s: number; e: number; c: number};
const K = veri as Kelime[];
const FPS = 30;
const an = (satir: number, kelime = 0) => K.filter((k) => k.c === satir)[kelime].s;
const gir = (t: number, t0: number, sure = 0.8) =>
  interpolate(t, [t0, t0 + sure], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.45, 0, 0.55, 1)});
const karis = (a: number, b: number, u: number) => a + (b - a) * u;

const RENK = {gokUst: '#0b1633', gokAlt: '#2c4f86', kara: '#3f8a4f', karaKoyu: '#2f6b3c', deniz: '#2a6fc0', krem: '#f6ecd4', vurgu: '#ffcf4a', koyu: '#14213d', kirmizi: '#e5533d'};
const G = {x: 540, y: 3200, r: 2200};

// ---------- Kamera ----------
type Kamera = {cx: number; cy: number; s: number; fy: number};
const YAKIN: Kamera = {cx: 540, cy: 1000, s: 1, fy: 1000};
const KURE: Kamera = {cx: 540, cy: 3200, s: 0.2, fy: 900};
const DURAKLAR: {t0: number; sure: number; k: Kamera}[] = [
  {t0: an(1, 0) - 0.3, sure: 1.6, k: KURE},
  {t0: an(2, 0) - 0.4, sure: 1.4, k: YAKIN},
  {t0: an(9, 0) - 0.3, sure: 1.5, k: KURE},
  {t0: an(10, 0) - 0.5, sure: 1.5, k: YAKIN},
];
const kamera = (t: number): Kamera => {
  let k = YAKIN;
  for (const d of DURAKLAR) {
    const u = gir(t, d.t0, d.sure);
    if (u <= 0) break;
    const s = Math.exp(karis(Math.log(k.s), Math.log(d.k.s), u));
    const w = Math.abs(Math.log(d.k.s / k.s)) > 0.05 ? (1 / s - 1 / k.s) / (1 / d.k.s - 1 / k.s) : u;
    k = {cx: karis(k.cx, d.k.cx, w), cy: karis(k.cy, d.k.cy, w), s, fy: karis(k.fy, d.k.fy, u)};
  }
  return k;
};

// Kürenin dönüş hızı (derece/sn): başta döner, "bıraksaydı" da durur, 9. satırda yeniden döner.
const hiz = (t: number) => 14 * (1 - gir(t, an(1, 4), 1.2)) + 14 * gir(t, an(9, 0), 1.0);
const donus = (kare: number) => {
  let a = 0;
  for (let i = 0; i < kare; i++) a += hiz(i / FPS) / FPS;
  return a;
};

// Yüzeydeki nesne: tepe noktasından "aci" derece uzakta.
const Yuzey: React.FC<{aci: number; children: React.ReactNode}> = ({aci, children}) => (
  <g transform={`rotate(${aci} ${G.x} ${G.y}) translate(${G.x},${G.y - G.r})`}>{children}</g>
);

const Bank: React.FC<{t: number}> = ({t}) => (
  <g>
    <rect x={-70} y={-48} width={140} height={12} rx={4} fill="#8a5a2b" />
    <rect x={-60} y={-36} width={8} height={36} fill="#5e3b1c" />
    <rect x={52} y={-36} width={8} height={36} fill="#5e3b1c" />
    <g transform={`translate(-5,${-48 + Math.sin(t * 1.5) * 1.5})`}>
      <rect x={-14} y={-62} width={30} height={52} rx={12} fill="#e5533d" />
      <circle cx={2} cy={-80} r={18} fill="#f1c7a0" />
      <path d="M -16 -88 Q 2 -108 20 -88" fill="#3a2a1a" />
      <path d="M 10 -14 L 40 -14 L 42 30" fill="none" stroke="#2d3d6b" strokeWidth={12} strokeLinecap="round" />
    </g>
  </g>
);
const Ev = () => (
  <g>
    <rect x={-70} y={-120} width={140} height={120} fill="#f2e3c4" />
    <path d="M -85 -118 L 0 -190 L 85 -118 Z" fill="#b8463a" />
    <rect x={-20} y={-60} width={40} height={60} fill="#7a4f31" />
    <rect x={30} y={-100} width={28} height={28} fill="#9cc7e8" />
  </g>
);
const Agac = () => (
  <g>
    <rect x={-10} y={-90} width={20} height={90} fill="#6b4429" />
    <circle cx={0} cy={-130} r={60} fill="#3f8a3a" />
    <circle cx={-30} cy={-105} r={38} fill="#4c9a44" />
  </g>
);

// Okyanus: yüzeyde bir yay. "dev dalgalar" da bir dalga tepesi doğuya yürür.
const Deniz: React.FC<{t: number; dalga: number; ucus: number}> = ({t, dalga, ucus}) => {
  const tepeX = karis(-80, 340, dalga);
  return (
    <g>
      <path d={`M ${G.x - G.r * Math.sin(0.1)} 0`} />
      {[0, 1].map(() => null)}
      <g transform={`translate(${ucus * 300},0)`}>
        <path d={`M 0 4 ${Array.from({length: 12}, (_, i) => `Q ${i * 40 + 20} ${-8 + Math.sin(t * 3 + i) * 4} ${(i + 1) * 40} 4`).join(' ')} L 480 60 L 0 60 Z`} fill={RENK.deniz} />
        {dalga > 0 && dalga < 1 && <path d={`M ${tepeX - 120} 4 Q ${tepeX - 30} -150 ${tepeX + 20} -120 Q ${tepeX + 60} -100 ${tepeX + 80} -60 Q ${tepeX + 60} -20 ${tepeX + 120} 4 Z`} fill="#3d86d8" opacity={Math.sin(dalga * Math.PI)} />}
      </g>
    </g>
  );
};

const KITALAR = [
  [10, 300, 180],
  [80, 360, 140],
  [150, 280, 200],
  [220, 340, 160],
  [300, 310, 190],
];

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
    <div style={{position: 'absolute', left: 50, right: 50, top: 230, textAlign: 'center', fontFamily: 'Caladea, Georgia, serif', fontWeight: 700, fontSize: boyut, lineHeight: 1.16, color: RENK.krem, opacity: cik, textShadow: '0 4px 22px rgba(5,10,30,.9)'}}>
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

const Cubuk: React.FC<{y: number; u: number; oran: number; renk: string; yazi: string}> = ({y, u, oran, renk, yazi}) => (
  <div style={{position: 'absolute', left: 90, top: y, width: 900, opacity: u > 0 ? 1 : 0}}>
    <div style={{fontFamily: 'Caladea, Georgia, serif', fontWeight: 700, fontSize: 46, color: RENK.krem, textShadow: '0 3px 12px rgba(5,10,30,.9)', marginBottom: 12}}>{yazi}</div>
    <div style={{height: 46, width: 900 * oran * u, background: renk, borderRadius: 23, boxShadow: '0 4px 18px rgba(0,0,0,.35)'}} />
  </div>
);

// ---------- Video ----------
const Video: React.FC = () => {
  const kare = useCurrentFrame();
  const t = kare / FPS;
  const k = kamera(t);
  const kam = `translate(540,${k.fy}) scale(${k.s}) translate(${-k.cx},${-k.cy})`;
  const don = donus(kare);

  // 2-4: dünya durur ama üstündekiler doğuya kayar, sonra fırlar. 8: her şey yerine döner.
  const kay = gir(t, an(2, 6), 1.2) * 0.06;
  const firla = gir(t, an(4, 3) - 0.1, 0.9);
  const geri = gir(t, an(8, 0), 1.0);
  const ucus = (kay + firla) * (1 - geri);
  const vurgu = (i: number) => interpolate(t, [an(3, i) - 0.05, an(3, i) + 0.15, an(3, i) + 0.45], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const ruzgar = (gir(t, an(3, 4) - 0.1, 0.5) * (1 - gir(t, an(5, 0), 0.6)) + gir(t, an(6, 4) - 0.1, 0.4) * (1 - gir(t, an(7, 0), 0.5))) * (1 - geri);
  const dalga = gir(t, an(7, 2) - 0.1, 1.6);
  const say = Math.round(1200 * gir(t, an(0, 5) - 0.1, 0.9));
  const sayGor = gir(t, an(0, 5) - 0.2, 0.3) * (1 - gir(t, an(1, 0) - 0.4, 0.4));
  const bar1 = gir(t, an(5, 4) - 0.1, 0.9) * (1 - gir(t, an(7, 0) - 0.2, 0.5));
  const bar2 = gir(t, an(6, 4) - 0.1, 0.9) * (1 - gir(t, an(7, 0) - 0.2, 0.5));
  const ucan = (x: number, i: number) => ({transform: `translate(${ucus * (1400 + i * 120)},${-ucus * (120 + i * 30)}) rotate(${ucus * (20 + i * 10)})`, opacity: 1 - firla * (1 - geri) * 0.9});

  return (
    <AbsoluteFill style={{background: RENK.gokUst}}>
      <Audio src={staticFile('dunya-dursaydi/ses.mp3')} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <defs>
          <linearGradient id="gok" x1={0} y1={0} x2={0} y2={1}>
            <stop offset="0" stopColor={RENK.gokUst} />
            <stop offset="1" stopColor={RENK.gokAlt} />
          </linearGradient>
          <radialGradient id="atmosfer">
            <stop offset="0.96" stopColor="#7fb2ff" stopOpacity={0.4} />
            <stop offset="1" stopColor="#7fb2ff" stopOpacity={0} />
          </radialGradient>
          <clipPath id="kure">
            <circle cx={G.x} cy={G.y} r={G.r} />
          </clipPath>
        </defs>
        <rect width={1080} height={1920} fill="url(#gok)" />
        {Array.from({length: 120}, (_, i) => {
          const x = (i * 397) % 1080;
          const y = (i * 911) % 1920;
          return <circle key={i} cx={x} cy={y} r={1 + (i % 3) * 0.6} fill={RENK.krem} opacity={0.35 + 0.3 * Math.sin(t * 1.3 + i)} />;
        })}
        <g transform={kam}>
          <circle cx={G.x} cy={G.y} r={G.r * 1.04} fill="url(#atmosfer)" />
          <circle cx={G.x} cy={G.y} r={G.r} fill={RENK.deniz} />
          <g clipPath="url(#kure)">
            <g transform={`rotate(${don} ${G.x} ${G.y})`}>
              {KITALAR.map(([a, d, r], i) => {
                const rad = (a * Math.PI) / 180;
                return <circle key={i} cx={G.x + (G.r - d * 2) * Math.sin(rad)} cy={G.y - (G.r - d * 2) * Math.cos(rad)} r={r * 3} fill={RENK.kara} />;
              })}
            </g>
            {/* bizim kıyımız: tepedeki kara parçası */}
            <path d={`M ${G.x - 700} ${G.y - G.r + 30} L ${G.x + 240} ${G.y - G.r + 30} L ${G.x + 240} ${G.y - G.r + 800} L ${G.x - 700} ${G.y - G.r + 800} Z`} fill={RENK.kara} />
          </g>
          <circle cx={G.x} cy={G.y} r={G.r} fill="none" stroke={RENK.karaKoyu} strokeWidth={6} />
          {/* yüzeydeki nesneler */}
          <Yuzey aci={6.2}>
            <Deniz t={t} dalga={dalga} ucus={ucus} />
          </Yuzey>
          <Yuzey aci={-9}>
            <g style={ucan(0, 0)}>
              <g transform={`scale(${1 + 0.15 * vurgu(1)})`}>
                <Agac />
              </g>
            </g>
          </Yuzey>
          <Yuzey aci={3}>
            <g style={ucan(0, 1)}>
              <g transform={`scale(${1 + 0.15 * vurgu(1)})`}>
                <Ev />
              </g>
            </g>
          </Yuzey>
          <Yuzey aci={-3.5}>
            <g style={ucan(0, 2)}>
              <g transform={`scale(${1 + 0.18 * vurgu(0)})`}>
                <Bank t={t} />
              </g>
            </g>
          </Yuzey>
        </g>
        {/* rüzgâr çizgileri */}
        <g opacity={ruzgar}>
          {Array.from({length: 14}, (_, i) => {
            const y = 380 + ((i * 137) % 620);
            const x = ((t * 1600 + i * 233) % 1500) - 300;
            return <path key={i} d={`M ${x} ${y} L ${x + 220 + (i % 3) * 60} ${y}`} stroke={RENK.krem} strokeWidth={4} strokeLinecap="round" opacity={0.6} />;
          })}
          <text x={880} y={330} textAnchor="end" fontFamily="Caladea, Georgia, serif" fontWeight={700} fontSize={54} fill={RENK.vurgu} opacity={gir(t, an(4, 1) - 0.1, 0.4) * (1 - gir(t, an(5, 0), 0.5))}>DOĞU →</text>
        </g>
      </svg>

      {sayGor > 0 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 1240, textAlign: 'center', fontFamily: 'Caladea, Georgia, serif', fontWeight: 700, fontSize: 110, color: RENK.krem, opacity: sayGor, textShadow: '0 4px 20px rgba(5,10,30,.9)'}}>
          {say.toLocaleString('tr-TR')}+ <span style={{fontSize: 56}}>km/sa</span>
        </div>
      )}
      <Cubuk y={420} u={bar1} oran={1} renk={RENK.vurgu} yazi="Ekvatorda dönüş hızı: 1.670 km/sa" />
      <Cubuk y={600} u={bar2} oran={408 / 1670} renk={RENK.kirmizi} yazi="Kasırgada ölçülen en güçlü: 408 km/sa" />

      <DevYazi t={t} kelimeler={dev(0, [4, 8])} cikis={an(1, 0) - 0.35} boyut={88} vurgu="hızlı" />
      <DevYazi t={t} kelimeler={dev(10, [3, 5])} cikis={an(11, 0) - 0.35} boyut={96} vurgu="yolculuk" />
      <DevYazi t={t} kelimeler={dev(11, [3])} cikis={an(12, 0) - 0.5} boyut={110} vurgu="durmuyor." />
      <Altyazi t={t} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,15,0.45) 100%)'}} />
    </AbsoluteFill>
  );
};

const sure = Math.ceil((K[K.length - 1].e + 1.2) * FPS);
export const Root: React.FC = () => <Composition id="Video" component={Video} durationInFrames={sure} fps={FPS} width={1080} height={1920} />;
