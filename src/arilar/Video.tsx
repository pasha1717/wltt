// src/arilar/Video.tsx: Arılar yok olsaydı. Tek dünya: kahvaltı masası. Kamera tabak, söz kartı, tahıllar,
// pasta grafik ve tabak arasında süzülür. Bütün anlar kelime zamanlarından gelir (an).
import React from 'react';
import {AbsoluteFill, Audio, Composition, Easing, interpolate, staticFile, useCurrentFrame} from 'remotion';
import veri from '../../public/arilar/kelimeler.json';

type Kelime = {w: string; s: number; e: number; c: number};
const K = veri as Kelime[];
const FPS = 30;
const an = (satir: number, kelime = 0) => K.filter((k) => k.c === satir)[kelime].s;
const gir = (t: number, t0: number, sure = 0.8) =>
  interpolate(t, [t0, t0 + sure], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.45, 0, 0.55, 1)});
const karis = (a: number, b: number, u: number) => a + (b - a) * u;
const ciz = (u: number, L: number) => ({strokeDasharray: `${L} ${L}`, strokeDashoffset: L * (1 - u), opacity: u > 0 ? 1 : 0});

const RENK = {masa: '#7a4f31', masaKoyu: '#5e3b24', tabak: '#f4efe6', krem: '#f6ecd4', vurgu: '#ffcf4a', kirmizi: '#d93b30', koyu: '#2a1a10'};
const TABAK = {x: 540, y: 1000, r: 360};

// ---------- Kamera ----------
type Kamera = {cx: number; cy: number; s: number; fy: number};
const DURAKLAR: {t0: number; sure: number; k: Kamera}[] = [
  {t0: an(1, 0) - 0.3, sure: 1.1, k: {cx: 540, cy: 1000, s: 1.0, fy: 900}},
  {t0: an(2, 0) - 0.3, sure: 1.2, k: {cx: 540, cy: 280, s: 1.15, fy: 820}},
  {t0: an(5, 0) - 0.4, sure: 1.3, k: {cx: 540, cy: 1720, s: 1.1, fy: 820}},
  {t0: an(6, 0) - 0.3, sure: 1.1, k: {cx: 540, cy: 2200, s: 1.1, fy: 820}},
  {t0: an(7, 0) - 0.4, sure: 1.4, k: {cx: 540, cy: 900, s: 1.0, fy: 860}},
  {t0: an(9, 0) - 0.3, sure: 0.9, k: {cx: 560, cy: 1060, s: 1.2, fy: 860}},
  {t0: an(10, 0) - 0.5, sure: 1.0, k: {cx: 540, cy: 1000, s: 1.05, fy: 1150}},
  {t0: an(12, 0) - 0.6, sure: 1.0, k: {cx: 540, cy: 1000, s: 1.0, fy: 900}},
];
const kamera = (t: number): Kamera => {
  let k: Kamera = {cx: 540, cy: 1000, s: 1.25, fy: 1140};
  for (const d of DURAKLAR) {
    const u = gir(t, d.t0, d.sure);
    if (u <= 0) break;
    k = {cx: karis(k.cx, d.k.cx, u), cy: karis(k.cy, d.k.cy, u), s: Math.exp(karis(Math.log(k.s), Math.log(d.k.s), u)), fy: karis(k.fy, d.k.fy, u)};
  }
  return k;
};

// ---------- Tabaktakiler ----------
const Ekmek = () => (
  <g transform="translate(380,830) rotate(-12)">
    <path d="M -110 60 L -110 -40 C -110 -100 -60 -110 0 -110 C 60 -110 110 -100 110 -40 L 110 60 Z" fill="#c98b45" />
    <path d="M -94 50 L -94 -36 C -94 -86 -52 -94 0 -94 C 52 -94 94 -86 94 -36 L 94 50 Z" fill="#f2d7a0" />
  </g>
);
const Peynir = () => (
  <g transform="translate(590,770) rotate(8)">
    <rect x={-80} y={-45} width={160} height={90} rx={8} fill="#fbf3d2" stroke="#e3d6a6" strokeWidth={4} />
    <circle cx={-30} cy={-8} r={8} fill="#efe2b4" />
    <circle cx={35} cy={15} r={6} fill="#efe2b4" />
  </g>
);
const Zeytin = () => (
  <g>
    {[[720, 860], [760, 830], [745, 890], [790, 870]].map(([x, y], i) => (
      <g key={i}>
        <ellipse cx={x} cy={y} rx={22} ry={17} fill="#2b2a24" />
        <ellipse cx={x - 6} cy={y - 5} rx={6} ry={4} fill="#6a675c" />
      </g>
    ))}
  </g>
);
const Domates = () => (
  <g>
    {[[760, 1010], [700, 1040]].map(([x, y], i) => (
      <g key={i}>
        <circle cx={x} cy={y} r={46} fill="#e04a35" />
        <circle cx={x} cy={y} r={36} fill="#f2735c" />
        {[0, 120, 240].map((a) => (
          <ellipse key={a} cx={x + 16 * Math.cos((a * Math.PI) / 180)} cy={y + 16 * Math.sin((a * Math.PI) / 180)} rx={8} ry={5} fill="#ffd28a" />
        ))}
      </g>
    ))}
  </g>
);
const Salatalik = () => (
  <g>
    {[[560, 1150], [610, 1120], [520, 1105]].map(([x, y], i) => (
      <g key={i}>
        <circle cx={x} cy={y} r={34} fill="#3f8a3a" />
        <circle cx={x} cy={y} r={28} fill="#cfe8a4" />
      </g>
    ))}
  </g>
);
const Elma: React.FC<{u: number}> = ({u}) => (
  <g transform={`translate(360,1050) scale(${karis(1, 0.3, u)})`} opacity={karis(1, 0.35, u)}>
    {[-30, 0, 30].map((a, i) => (
      <g key={i} transform={`rotate(${a}) translate(0,-10)`}>
        <path d="M -70 0 A 70 70 0 0 0 70 0 Z" fill="#c8262c" />
        <path d="M -62 0 A 62 62 0 0 0 62 0 Z" fill="#fbf1d2" />
      </g>
    ))}
  </g>
);
const Badem: React.FC<{u: number}> = ({u}) => (
  <g transform={`translate(680,1190) scale(${karis(1, 0.3, u)})`} opacity={karis(1, 0.35, u)}>
    {[[-40, 0, 20], [0, -18, -15], [38, 6, 35], [5, 26, 5]].map(([x, y, a], i) => (
      <ellipse key={i} cx={x} cy={y} rx={24} ry={14} transform={`rotate(${a} ${x} ${y})`} fill="#a8683a" stroke="#7d4a26" strokeWidth={3} />
    ))}
  </g>
);
const Kiraz: React.FC<{u: number}> = ({u}) => (
  <g transform={`translate(470,1220) scale(${karis(1, 0.3, u)})`} opacity={karis(1, 0.35, u)}>
    <path d="M -25 0 Q -10 -70 20 -80 Q 30 -40 30 0" fill="none" stroke="#4f7a2c" strokeWidth={5} />
    <circle cx={-25} cy={0} r={24} fill="#a3121e" />
    <circle cx={30} cy={4} r={24} fill="#b8141f" />
    <circle cx={-32} cy={-7} r={6} fill="#ff8a8a" />
  </g>
);
const Karpuz: React.FC<{u: number}> = ({u}) => (
  <g transform={`translate(800,1170) rotate(-20) scale(${karis(1, 0.3, u)})`} opacity={karis(1, 0.35, u)}>
    <path d="M -95 0 A 95 95 0 0 0 95 0 Z" fill="#3c8a3a" />
    <path d="M -84 0 A 84 84 0 0 0 84 0 Z" fill="#f0f4d0" />
    <path d="M -76 0 A 76 76 0 0 0 76 0 Z" fill="#ef4b55" />
    {[[-40, 20], [0, 40], [38, 22], [-15, 55], [20, 58]].map(([x, y], i) => (
      <ellipse key={i} cx={x} cy={y} rx={4} ry={7} fill="#2a1a10" />
    ))}
  </g>
);
const Bal = () => (
  <g transform="translate(900,600)">
    <rect x={-60} y={-70} width={120} height={140} rx={24} fill="#f2a31c" opacity={0.9} />
    <rect x={-66} y={-92} width={132} height={30} rx={8} fill="#8a5a2b" />
    <rect x={-40} y={-30} width={80} height={50} rx={6} fill="#fff3d6" opacity={0.8} />
  </g>
);

const Ari: React.FC<{x: number; y: number; t: number; o: number; kayip: number}> = ({x, y, t, o, kayip}) => {
  const kanat = 0.4 + 0.6 * Math.abs(Math.sin(t * 40));
  return (
    <g transform={`translate(${x},${y})`}>
      <g opacity={o}>
        <ellipse cx={-6} cy={-26} rx={22} ry={14 * kanat} fill="#e8f4ff" opacity={0.75} />
        <ellipse cx={14} cy={-26} rx={22} ry={14 * kanat} fill="#e8f4ff" opacity={0.75} />
        <ellipse rx={38} ry={24} fill="#f7c21a" />
        <path d="M -14 -22 L -14 22 M 4 -24 L 4 24 M 20 -20 L 20 20" stroke={RENK.koyu} strokeWidth={8} />
        <circle cx={-36} cy={-2} r={13} fill={RENK.koyu} />
      </g>
      <ellipse rx={44} ry={30} fill="none" stroke={RENK.krem} strokeWidth={4} strokeDasharray="10 8" opacity={0.8 * kayip} />
    </g>
  );
};

// ---------- Söz kartı, tahıllar, pasta, çiçekler ----------
const Kart: React.FC<{t: number}> = ({t}) => {
  const gel = gir(t, an(2, 0) - 0.1, 0.8);
  const imza = gir(t, an(3, 2) - 0.1, 0.5);
  const muhur = gir(t, an(3, 6) - 0.05, 0.25);
  const cizik = gir(t, an(4, 3) - 0.05, 0.4);
  return (
    <g transform={`translate(${karis(-500, 540, gel)},300) rotate(-3)`}>
      <rect x={-380} y={-190} width={760} height={380} rx={14} fill="#fbf6ea" stroke="#d8ccb0" strokeWidth={4} />
      <text x={-330} y={-110} fontFamily="Caladea, Georgia, serif" fontSize={120} fill="#c9b994">“</text>
      <text textAnchor="middle" fontFamily="Caladea, Georgia, serif" fontWeight={700} fill={RENK.koyu}>
        <tspan x={0} y={-50} fontSize={48}>Arılar yok olursa,</tspan>
        <tspan x={0} y={20} fontSize={48}>insanlığın</tspan>
        <tspan x={0} y={110} fontSize={96} fill={RENK.kirmizi}>4 yılı kalır.</tspan>
      </text>
      <text x={330} y={165} textAnchor="end" fontFamily="Caladea, Georgia, serif" fontStyle="italic" fontSize={38} fill="#6b5a43" opacity={imza}>— Einstein?</text>
      <g transform={`translate(230,-120) rotate(-14) scale(${karis(1.6, 1, muhur)})`} opacity={muhur * 0.9}>
        <rect x={-150} y={-44} width={300} height={88} rx={10} fill="none" stroke={RENK.kirmizi} strokeWidth={8} />
        <text y={18} textAnchor="middle" fontFamily="Caladea, Georgia, serif" fontWeight={700} fontSize={52} fill={RENK.kirmizi}>KANIT YOK</text>
      </g>
      <path d="M -340 130 L 340 -10" stroke={RENK.kirmizi} strokeWidth={16} strokeLinecap="round" {...ciz(cizik, 700)} />
    </g>
  );
};

const Tahillar: React.FC<{t: number}> = ({t}) => {
  const ruzgar = gir(t, an(5, 4) - 0.1, 0.6);
  const sal = (i: number) => Math.sin(t * 3 + i) * (3 + 9 * ruzgar);
  const gor = [gir(t, an(5, 0) - 0.1, 0.4), gir(t, an(5, 1) - 0.1, 0.4), gir(t, an(5, 3) - 0.1, 0.4)];
  return (
    <g>
      <g transform={`translate(320,1880) rotate(${sal(0)})`} opacity={gor[0]}>
        <path d="M 0 0 L 0 -260" stroke="#c9a24a" strokeWidth={8} />
        {Array.from({length: 7}, (_, i) => (
          <g key={i}>
            <ellipse cx={-14} cy={-200 - i * 18} rx={9} ry={16} transform={`rotate(-25 -14 ${-200 - i * 18})`} fill="#e8c062" />
            <ellipse cx={14} cy={-200 - i * 18} rx={9} ry={16} transform={`rotate(25 14 ${-200 - i * 18})`} fill="#e8c062" />
          </g>
        ))}
      </g>
      <g transform={`translate(540,1880) rotate(${sal(1)})`} opacity={gor[1]}>
        <path d="M 0 0 L 0 -230 Q 30 -300 90 -280" fill="none" stroke="#8fae4a" strokeWidth={7} />
        {Array.from({length: 7}, (_, i) => (
          <ellipse key={i} cx={20 + i * 11} cy={-262 - Math.sin(i / 2) * 20 + i * 2} rx={6} ry={11} fill="#efe0a8" />
        ))}
      </g>
      <g transform={`translate(760,1880) rotate(${sal(2)})`} opacity={gor[2]}>
        <path d="M 0 0 L 0 -250" stroke="#6f9a3c" strokeWidth={9} />
        <ellipse cx={18} cy={-170} rx={26} ry={70} fill="#f3c63c" />
        <path d="M 0 -110 Q 50 -160 40 -240 M 0 -110 Q -10 -180 20 -235" fill="none" stroke="#7fb04a" strokeWidth={10} />
      </g>
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M ${60} ${1600 + i * 70} q 120 -40 240 0 t 240 0 q 60 20 30 -40`} fill="none" stroke={RENK.krem} strokeWidth={5} strokeLinecap="round" {...ciz(gir(t, an(5, 4) + i * 0.15, 0.9), 700)} />
      ))}
    </g>
  );
};

const dilim = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const p = (a: number) => [cx + r * Math.sin(a * 2 * Math.PI), cy - r * Math.cos(a * 2 * Math.PI)];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  return `M ${cx} ${cy} L ${x0} ${y0} A ${r} ${r} 0 ${a1 - a0 > 0.5 ? 1 : 0} 1 ${x1} ${y1} Z`;
};
const Pasta: React.FC<{t: number}> = ({t}) => {
  const u = gir(t, an(6, 2) - 0.1, 0.8);
  const gor = gir(t, an(6, 0) - 0.2, 0.5);
  const {x, y, r} = {x: 540, y: 2200, r: 240};
  return (
    <g opacity={gor}>
      <circle cx={x} cy={y} r={r + 14} fill={RENK.tabak} />
      <circle cx={x} cy={y} r={r} fill="#b9b2a6" />
      <path d={dilim(x, y, r, 0, Math.max(0.001, 0.6 * u))} fill="#e3c36a" />
      <path d={dilim(x, y, r, 0.6, 0.6 + Math.max(0.001, 0.35 * u))} fill="#e2725b" opacity={u} />
      <text x={x - 70} y={y + 80} textAnchor="middle" fontFamily="Caladea, Georgia, serif" fontWeight={700} fontSize={74} fill={RENK.koyu} opacity={u}>%60</text>
    </g>
  );
};

const Cicekler: React.FC<{t: number}> = ({t}) => {
  const gor = gir(t, an(8, 3) - 0.15, 0.4) * (1 - gir(t, an(9, 0) - 0.2, 0.4));
  const polen = gir(t, an(8, 4) - 0.1, 0.5);
  return (
    <g opacity={gor}>
      {[270, 450, 630, 810].map((x, i) => {
        const p = i < 3 ? polen : 0;
        return (
          <g key={i} transform={`translate(${x},560)`}>
            {Array.from({length: 6}, (_, j) => (
              <ellipse key={j} cx={0} cy={-34} rx={20} ry={32} transform={`rotate(${j * 60})`} fill={i < 3 ? '#f6a6c1' : '#d9d2c4'} />
            ))}
            <circle r={20} fill={karis(0, 1, p) > 0.5 ? RENK.vurgu : '#b9a98a'} />
            {p > 0 && <circle r={34 + 10 * Math.sin(t * 6)} fill="none" stroke={RENK.vurgu} strokeWidth={4} opacity={0.6 * p} />}
          </g>
        );
      })}
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
const DevYazi: React.FC<{t: number; kelimeler: DevKelime[]; cikis: number; boyut: number; vurgu?: string}> = ({t, kelimeler, cikis, boyut, vurgu}) => {
  const ilk = kelimeler.find((k) => k)!.s;
  if (t < ilk - 0.1 || t > cikis + 0.45) return null;
  const cik = 1 - gir(t, cikis, 0.45);
  return (
    <div style={{position: 'absolute', left: 50, right: 50, top: 240, textAlign: 'center', fontFamily: 'Caladea, Georgia, serif', fontWeight: 700, fontSize: boyut, lineHeight: 1.16, color: RENK.krem, opacity: cik, textShadow: '0 4px 22px rgba(30,15,5,.9)'}}>
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
    <div style={{position: 'absolute', left: 80, right: 80, top: 1420, textAlign: 'center', fontFamily: 'Caladea, Georgia, serif', fontWeight: 700, fontSize: 62, lineHeight: 1.25, textShadow: '0 3px 14px rgba(30,15,5,.95), 0 0 4px rgba(30,15,5,.9)'}}>
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

  const ucus = gir(t, 0, an(1, 0));
  const ariX = karis(120, 380, ucus) + Math.sin(t * 2.5) * 30;
  const ariY = karis(760, 960, ucus) + Math.sin(t * 4) * 18;
  const yokOl = gir(t, an(1, 3) - 0.05, 0.6);
  const kayipGor = yokOl * (1 - gir(t, an(2, 0) - 0.3, 0.4)) + gir(t, an(12, 0), 0.6);
  const azal = [gir(t, an(9, 0), 0.6), gir(t, an(9, 1), 0.6), gir(t, an(9, 2), 0.6), gir(t, an(9, 4), 0.6)];
  const gri = gir(t, an(11, 2) - 0.1, 1.0);

  return (
    <AbsoluteFill style={{background: RENK.masaKoyu}}>
      <Audio src={staticFile('arilar/ses.mp3')} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <defs>
          <pattern id="tahta" width={1080} height={140} patternUnits="userSpaceOnUse">
            <rect width={1080} height={140} fill={RENK.masa} />
            <path d="M 0 138 L 1080 138" stroke={RENK.masaKoyu} strokeWidth={4} />
            <path d="M 0 40 C 200 30 400 55 600 42 S 900 30 1080 45 M 0 95 C 250 85 500 105 750 92 S 1000 88 1080 98" fill="none" stroke="#6b4429" strokeWidth={2.5} opacity={0.6} />
          </pattern>
          <radialGradient id="tabakGolge">
            <stop offset="0.85" stopColor="#000" stopOpacity={0.35} />
            <stop offset="1" stopColor="#000" stopOpacity={0} />
          </radialGradient>
        </defs>
        <g transform={kam}>
          <g style={{filter: `saturate(${karis(1, 0.1, gri)})`}}>
            <rect x={-800} y={-800} width={2700} height={3800} fill="url(#tahta)" />
            <Kart t={t} />
            <Bal />
            <circle cx={TABAK.x + 14} cy={TABAK.y + 22} r={TABAK.r + 30} fill="url(#tabakGolge)" />
            <circle cx={TABAK.x} cy={TABAK.y} r={TABAK.r} fill={RENK.tabak} />
            <circle cx={TABAK.x} cy={TABAK.y} r={TABAK.r - 50} fill="none" stroke="#e4ddcf" strokeWidth={6} />
            <Ekmek />
            <Peynir />
            <Zeytin />
            <Domates />
            <Salatalik />
            <Elma u={azal[0]} />
            <Badem u={azal[1]} />
            <Kiraz u={azal[2]} />
            <Karpuz u={azal[3]} />
            <Cicekler t={t} />
            <Tahillar t={t} />
            <Pasta t={t} />
            <Ari x={ariX} y={ariY} t={t} o={1 - yokOl} kayip={kayipGor} />
          </g>
        </g>
      </svg>

      <DevYazi t={t} kelimeler={dev(0, [3])} cikis={an(1, 0) - 0.35} boyut={96} vurgu="renkleri," />
      <DevYazi t={t} kelimeler={dev(10, [3])} cikis={an(11, 0) - 0.35} boyut={100} />
      <DevYazi t={t} kelimeler={dev(11, [2])} cikis={an(12, 0) - 0.5} boyut={110} vurgu="renge" />
      <Altyazi t={t} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(20,8,0,0.45) 100%)'}} />
    </AbsoluteFill>
  );
};

const sure = Math.ceil((K[K.length - 1].e + 1.2) * FPS);
export const Root: React.FC = () => <Composition id="Video" component={Video} durationInFrames={sure} fps={FPS} width={1080} height={1920} />;
