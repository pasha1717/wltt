// src/mikrop/Video.tsx: Bütün mikroplar yok olsaydı. Tek dünya: soldan sağa bir insan, inek, ağaç, bitki kökleri ve güneş.
// Büyüteçler mikropları gösterir. Kamera paneller arasında süzülür. Bütün anlar kelime zamanlarından gelir (an).
import React from 'react';
import {AbsoluteFill, Audio, Composition, Easing, interpolate, staticFile, useCurrentFrame} from 'remotion';
import veri from '../../public/mikrop/kelimeler.json';

type Kelime = {w: string; s: number; e: number; c: number};
const K = veri as Kelime[];
const FPS = 30;
const an = (satir: number, kelime = 0) => K.filter((k) => k.c === satir)[kelime].s;
const gir = (t: number, t0: number, sure = 0.8) =>
  interpolate(t, [t0, t0 + sure], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.45, 0, 0.55, 1)});
const karis = (a: number, b: number, u: number) => a + (b - a) * u;

const RENK = {gok: '#bfe3f2', cim: '#7cc46a', toprak: '#7a5233', krem: '#fff6e2', vurgu: '#ffcf4a', koyu: '#1f2a3a', kirmizi: '#e5533d'};
const YER = 1250;
const P = [540, 1620, 2700, 3780, 4860];
const MIKROP_RENK = ['#8e6cf0', '#f07ab0', '#4fc3a1', '#f2a33a', '#5aa9f0'];

type Kamera = {cx: number; cy: number; s: number; fy: number};
const panel = (i: number, s = 1): Kamera => ({cx: P[i], cy: 960, s, fy: 960});
const DURAKLAR: {t0: number; sure: number; k: Kamera}[] = [
  {t0: an(1, 0) - 0.3, sure: 1.0, k: panel(0, 1)},
  {t0: an(3, 4) - 0.4, sure: 1.2, k: panel(1)},
  {t0: an(5, 0) - 0.4, sure: 1.1, k: panel(2)},
  {t0: an(6, 0) - 0.4, sure: 1.1, k: panel(3)},
  {t0: an(7, 0) - 0.4, sure: 1.1, k: panel(4)},
  {t0: an(8, 0) - 0.3, sure: 1.6, k: {cx: 2700, cy: 1000, s: 0.2, fy: 900}},
  {t0: an(10, 0) - 0.6, sure: 1.6, k: panel(0, 1.15)},
];
const kamera = (t: number): Kamera => {
  let k = panel(0, 1.3);
  for (const d of DURAKLAR) {
    const u = gir(t, d.t0, d.sure);
    if (u <= 0) break;
    const s = Math.exp(karis(Math.log(k.s), Math.log(d.k.s), u));
    const w = Math.abs(Math.log(d.k.s / k.s)) > 0.05 ? (1 / s - 1 / k.s) / (1 / d.k.s - 1 / k.s) : u;
    k = {cx: karis(k.cx, d.k.cx, w), cy: karis(k.cy, d.k.cy, w), s, fy: karis(k.fy, d.k.fy, u)};
  }
  return k;
};

// Büyüteç: içinde kıpır kıpır mikroplar. yok: mikroplar kaybolur, yerlerinde kesik çizgi kalır.
const Buyutec: React.FC<{x: number; y: number; r: number; t: number; yok: number; tohum: number; children?: React.ReactNode}> = ({x, y, r, t, yok, tohum, children}) => (
  <g transform={`translate(${x},${y})`}>
    <circle r={r} fill="#fdf8ec" />
    {children}
    {Array.from({length: 9}, (_, i) => {
      const a = i * 2.4 + tohum;
      const d = r * (0.25 + ((i * 37) % 10) / 16);
      const mx = Math.cos(a) * d * 0.8 + Math.sin(t * 2 + i) * 6;
      const my = Math.sin(a) * d * 0.8 + Math.cos(t * 2.3 + i) * 6;
      return (
        <g key={i} transform={`translate(${mx},${my}) rotate(${a * 50 + t * 30})`}>
          <ellipse rx={r * 0.11} ry={r * 0.06} fill={MIKROP_RENK[i % 5]} opacity={1 - yok} />
          <ellipse rx={r * 0.11} ry={r * 0.06} fill="none" stroke="#9a9a9a" strokeWidth={2} strokeDasharray="5 4" opacity={yok} />
        </g>
      );
    })}
    <circle r={r} fill="none" stroke={RENK.koyu} strokeWidth={10} />
    <path d={`M ${r * 0.7} ${r * 0.7} L ${r * 1.15} ${r * 1.15}`} stroke={RENK.koyu} strokeWidth={22} strokeLinecap="round" />
  </g>
);

const Insan = () => (
  <g transform={`translate(${P[0]},${YER})`}>
    <rect x={-90} y={-520} width={180} height={300} rx={80} fill="#5aa9f0" />
    <circle cx={0} cy={-610} r={90} fill="#f1c7a0" />
    <path d="M -90 -630 C -80 -720 80 -720 90 -630 C 60 -680 -60 -680 -90 -630 Z" fill="#3a2a1a" />
    <circle cx={-30} cy={-610} r={8} fill={RENK.koyu} />
    <circle cx={30} cy={-610} r={8} fill={RENK.koyu} />
    <path d="M -25 -570 Q 0 -555 25 -570" fill="none" stroke={RENK.koyu} strokeWidth={5} strokeLinecap="round" />
    <rect x={-70} y={-230} width={50} height={230} rx={20} fill="#2d3d6b" />
    <rect x={20} y={-230} width={50} height={230} rx={20} fill="#2d3d6b" />
  </g>
);
const Inek: React.FC<{zayif: number; t: number}> = ({zayif, t}) => (
  <g transform={`translate(${P[1]},${YER})`}>
    <ellipse cx={0} cy={-260} rx={karis(240, 190, zayif)} ry={karis(130, 100, zayif)} fill="#ffffff" stroke={RENK.koyu} strokeWidth={6} />
    <ellipse cx={-60} cy={-290} rx={60} ry={40} fill={RENK.koyu} />
    <ellipse cx={80} cy={-230} rx={50} ry={35} fill={RENK.koyu} />
    {[-160, -90, 90, 160].map((x) => (
      <rect key={x} x={x - 14} y={-170} width={28} height={170} fill="#ffffff" stroke={RENK.koyu} strokeWidth={5} />
    ))}
    <g transform={`translate(-250,${-200 + Math.sin(t * 2) * 6})`}>
      <ellipse rx={70} ry={55} fill="#ffffff" stroke={RENK.koyu} strokeWidth={6} />
      <ellipse cx={-35} cy={25} rx={30} ry={20} fill="#f3b3b8" />
      <circle cx={10} cy={-15} r={7} fill={RENK.koyu} />
      <path d="M -20 -55 L -40 -85 M 30 -50 L 45 -80" stroke="#c9a24a" strokeWidth={10} strokeLinecap="round" />
    </g>
    <path d="M -330 -20 l 10 -60 l 10 60 m 10 0 l 10 -50 l 10 50" fill="none" stroke="#3f8a3a" strokeWidth={6} />
  </g>
);
const Agac: React.FC<{yigin: number; t: number}> = ({yigin, t}) => (
  <g transform={`translate(${P[2]},${YER})`}>
    <rect x={-30} y={-520} width={60} height={520} fill="#6b4429" />
    <circle cx={0} cy={-560} r={220} fill="#d98a3a" />
    <circle cx={-120} cy={-480} r={130} fill="#c96f2a" />
    {Array.from({length: 10}, (_, i) => {
      const u = ((t * 0.25 + i / 10) % 1);
      return <ellipse key={i} cx={-200 + i * 45 + Math.sin(u * 10 + i) * 30} cy={-400 + u * 400} rx={16} ry={9} fill="#e0a040" />;
    })}
    <path d={`M -420 0 Q 0 ${-40 - 360 * yigin} 420 0 Z`} fill="#b8742f" />
    <path d={`M -380 0 Q 0 ${-30 - 300 * yigin} 380 0`} fill="none" stroke="#8a5523" strokeWidth={6} strokeDasharray="20 14" />
  </g>
);
const Kokler: React.FC<{t: number; azot: number}> = ({t, azot}) => (
  <g transform={`translate(${P[3]},${YER})`}>
    <path d="M 0 0 L 0 -320" stroke="#3f8a3a" strokeWidth={14} />
    {[-1, 1].map((s) => (
      <ellipse key={s} cx={s * 70} cy={-220} rx={70} ry={30} transform={`rotate(${s * -25} ${s * 70} -220)`} fill="#5cb85c" />
    ))}
    <path d="M 0 0 Q -60 120 -140 200 M 0 0 Q 50 140 130 230 M 0 0 L 0 260" fill="none" stroke="#e8d3a8" strokeWidth={10} strokeLinecap="round" />
    {/* havadaki azot: N≡N çiftleri köke inemez */}
    {Array.from({length: 8}, (_, i) => {
      const x = -380 + i * 110;
      const y = -700 + ((t * 40 + i * 70) % 300) * azot;
      return (
        <g key={i} transform={`translate(${x},${y})`}>
          <circle cx={-14} r={14} fill="#7f9bd8" />
          <circle cx={14} r={14} fill="#7f9bd8" />
          <text y={6} x={-14} textAnchor="middle" fontSize={16} fontWeight={700} fill="#fff">N</text>
          <text y={6} x={14} textAnchor="middle" fontSize={16} fontWeight={700} fill="#fff">N</text>
        </g>
      );
    })}
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
    <div style={{position: 'absolute', left: 50, right: 50, top: 170, textAlign: 'center', fontFamily: 'Caladea, Georgia, serif', fontWeight: 700, fontSize: boyut, lineHeight: 1.16, color: RENK.koyu, opacity: cik, textShadow: '0 0 6px #fff, 0 0 18px #fff, 0 0 30px rgba(255,255,255,.9)'}}>
      {kelimeler.map((k, i) => {
        if (!k) return <br key={i} />;
        const u = gir(t, k.s - 0.06, 0.3);
        return (
          <span key={i} style={{display: 'inline-block', margin: '0 12px', opacity: u, transform: `translateY(${karis(18, 0, u)}px)`, color: k.w === vurgu ? '#c0392b' : undefined}}>
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
    <div style={{position: 'absolute', left: 80, right: 80, top: 1440, textAlign: 'center', fontFamily: 'Caladea, Georgia, serif', fontWeight: 700, fontSize: 62, lineHeight: 1.25, textShadow: '0 3px 14px rgba(5,10,30,.95), 0 0 4px rgba(5,10,30,.9)'}}>
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

  const geri = gir(t, an(9, 1) - 0.1, 1.0) * (1 - gir(t, an(10, 0), 0.6)); // 9: mikroplar her yerde parlar
  const yok = Math.max(0, gir(t, an(1, 4) - 0.05, 0.6) - geri);
  const saglik = gir(t, an(2, 2) - 0.1, 0.5) * (1 - gir(t, an(3, 1), 0.5));
  const zayif = gir(t, an(4, 2), 1.4);
  const yigin = gir(t, an(5, 4) - 0.1, 2.2);
  const azot = 1 - gir(t, an(6, 7) - 0.2, 0.8) * 0.0;
  const fotosentez = 1 - gir(t, an(7, 5) - 0.1, 2.2) * 0.92;
  const zincir = gir(t, an(8, 0), 0.6) * (1 - gir(t, an(9, 0), 0.4));
  const sars = gir(t, an(8, 5) - 0.1, 0.6);
  const dur = gir(t, an(11, 0) - 0.2, 1.0);

  return (
    <AbsoluteFill style={{background: RENK.gok}}>
      <Audio src={staticFile('mikrop/ses.mp3')} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute', filter: `saturate(${karis(1, 0.2, dur)})`}}>
        <g transform={kam}>
          <rect x={-1500} y={-2000} width={8500} height={YER + 2000} fill={RENK.gok} />
          <rect x={-1500} y={YER} width={8500} height={300} fill={RENK.cim} />
          <rect x={-1500} y={YER + 300} width={8500} height={4000} fill={RENK.toprak} />
          <Insan />
          <Buyutec x={P[0] + 10} y={YER - 380} r={150} t={t} yok={yok} tohum={1} />
          <Inek zayif={zayif} t={t} />
          <Buyutec x={P[1] + 20} y={YER - 620} r={130} t={t} yok={yok} tohum={2}>
            {[0, 1, 2, 3].map((i) => (
              <path key={i} d={`M ${-60 + i * 30} 40 l 10 -60 l 10 60`} fill="none" stroke="#3f8a3a" strokeWidth={6} />
            ))}
          </Buyutec>
          <Agac yigin={yigin} t={t} />
          <Buyutec x={P[2] + 280} y={YER - 260} r={110} t={t} yok={yok} tohum={3} />
          <Kokler t={t} azot={azot} />
          <Buyutec x={P[3] + 170} y={YER + 120} r={110} t={t} yok={yok} tohum={4} />
          {/* güneş ve fotosentez göstergesi */}
          <g transform={`translate(${P[4]},${YER - 600})`}>
            <circle cx={0} cy={-200} r={110} fill="#ffcf4a" />
            <ellipse cx={0} cy={250} rx={170} ry={80} fill="#3f8a3a" opacity={karis(0.35, 1, fotosentez)} />
            <rect x={-300} y={420} width={600} height={60} rx={30} fill="#ffffff" stroke={RENK.koyu} strokeWidth={6} />
            <rect x={-294} y={426} width={588 * fotosentez} height={48} rx={24} fill={fotosentez > 0.4 ? '#5cb85c' : RENK.kirmizi} />
            <text x={0} y={560} textAnchor="middle" fontFamily="Caladea, Georgia, serif" fontWeight={700} fontSize={64} fill={RENK.koyu}>fotosentez · 1 yıl</text>
          </g>
          {/* mikroplar geri gelir: her yerde parıltı */}
          <g opacity={geri}>
            {Array.from({length: 60}, (_, i) => (
              <ellipse key={i} cx={(i * 977) % 5400} cy={YER - 600 + ((i * 431) % 1200)} rx={60} ry={34} fill={MIKROP_RENK[i % 5]} opacity={0.6 + 0.4 * Math.sin(t * 4 + i)} />
            ))}
          </g>
        </g>
      </svg>

      {/* 2: hastalık */}
      {saglik > 0 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 220, textAlign: 'center', fontSize: 150, opacity: saglik}}>
          🤒 <span style={{fontFamily: 'Caladea, Georgia, serif', fontWeight: 700, fontSize: 90, color: RENK.kirmizi}}>→ ?</span>
        </div>
      )}
      {/* 8: besin zinciri */}
      {zincir > 0 && (
        <div style={{position: 'absolute', left: 0, right: 0, top: 260, textAlign: 'center', fontSize: 120, opacity: zincir, transform: `translateX(${Math.sin(t * 30) * 8 * sars}px)`, filter: `grayscale(${sars})`}}>
          🌱 → 🐄 → 🧑
        </div>
      )}

      <DevYazi t={t} kelimeler={dev(0, [3])} cikis={an(1, 0) - 0.35} boyut={96} vurgu="bakteri" />
      <DevYazi t={t} kelimeler={dev(10, [3])} cikis={an(11, 0) - 0.35} boyut={100} vurgu="temiz" />
      <DevYazi t={t} kelimeler={dev(11, [])} cikis={an(12, 0) - 0.5} boyut={110} vurgu="Durmuş" />
      <Altyazi t={t} />
    </AbsoluteFill>
  );
};

const sure = Math.ceil((K[K.length - 1].e + 1.2) * FPS);
export const Root: React.FC = () => <Composition id="Video" component={Video} durationInFrames={sure} fps={FPS} width={1080} height={1920} />;
