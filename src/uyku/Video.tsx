// src/uyku/Video.tsx: İnsanlar hiç uyumasaydı. Tek dünya: gece bir yatak odası, yatakta uyuyan biri ve üstünde düşünce balonu (beyin).
// Bilgiler üst bölgede kartlarla gelir. Bütün anlar kelime zamanlarından gelir (an).
import React from 'react';
import {AbsoluteFill, Audio, Composition, Easing, interpolate, staticFile, useCurrentFrame} from 'remotion';
import veri from '../../public/uyku/kelimeler.json';

type Kelime = {w: string; s: number; e: number; c: number};
const K = veri as Kelime[];
const FPS = 30;
const an = (satir: number, kelime = 0) => K.filter((k) => k.c === satir)[kelime].s;
const gir = (t: number, t0: number, sure = 0.8) =>
  interpolate(t, [t0, t0 + sure], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.45, 0, 0.55, 1)});
const karis = (a: number, b: number, u: number) => a + (b - a) * u;
const ac = (t: number, a: number, b: number) => gir(t, a, 0.4) * (1 - gir(t, b, 0.4));

const RENK = {duvar: '#1b2347', duvarAcik: '#2a3566', zemin: '#3a2a22', yatak: '#e9e2d0', yorgan: '#4f7fc9', ten: '#f1c7a0', sac: '#3a2a1a', beyin: '#f3a3b5', krem: '#fff6e2', vurgu: '#ffcf4a', koyu: '#14213d', kirmizi: '#e5533d', yesil: '#5cc27a'};
const BALON = {x: 520, y: 760, r: 190};

type Kamera = {cx: number; cy: number; s: number; fy: number};
const DURAKLAR: {t0: number; sure: number; k: Kamera}[] = [
  {t0: an(1, 0) - 0.3, sure: 1.2, k: {cx: 540, cy: 1000, s: 1, fy: 1050}},
  {t0: an(6, 0) - 0.3, sure: 1.0, k: {cx: BALON.x, cy: BALON.y + 60, s: 1.35, fy: 1100}},
  {t0: an(7, 0) - 0.3, sure: 1.0, k: {cx: 540, cy: 1000, s: 1, fy: 1050}},
  {t0: an(10, 0) - 0.5, sure: 1.2, k: {cx: 540, cy: 1060, s: 1.1, fy: 1180}},
  {t0: an(12, 0) - 0.6, sure: 1.0, k: {cx: 540, cy: 1000, s: 1, fy: 1050}},
];
const kamera = (t: number): Kamera => {
  let k: Kamera = {cx: BALON.x, cy: BALON.y + 40, s: 1.4, fy: 1150};
  for (const d of DURAKLAR) {
    const u = gir(t, d.t0, d.sure);
    if (u <= 0) break;
    k = {cx: karis(k.cx, d.k.cx, u), cy: karis(k.cy, d.k.cy, u), s: Math.exp(karis(Math.log(k.s), Math.log(d.k.s), u)), fy: karis(k.fy, d.k.fy, u)};
  }
  return k;
};

const Oda: React.FC<{t: number; sabah: number; uyanik: number; akrep: number}> = ({t, sabah, uyanik, akrep}) => {
  const ba = karis(0, -70, uyanik);
  return (
    <g>
      <rect x={-500} y={-500} width={2100} height={1900} fill={RENK.duvar} />
      <rect x={-500} y={-500} width={2100} height={1900} fill="#f7d9a8" opacity={0.25 * sabah} />
      <rect x={-500} y={1400} width={2100} height={1200} fill={RENK.zemin} />
      {/* pencere */}
      <g transform="translate(830,420)">
        <rect x={-130} y={-150} width={260} height={300} rx={10} fill={sabah > 0.5 ? '#ffd9a0' : '#0d1430'} stroke="#6b5a4a" strokeWidth={14} />
        <rect x={-130} y={-150} width={260} height={300} rx={10} fill="#ffd9a0" opacity={sabah} />
        <circle cx={karis(40, -20, sabah)} cy={karis(-60, 40, sabah)} r={karis(30, 46, sabah)} fill={sabah > 0.5 ? '#ffb347' : '#f4ead0'} />
        <path d="M 0 -150 L 0 150 M -130 0 L 130 0" stroke="#6b5a4a" strokeWidth={10} />
      </g>
      {/* saat */}
      <g transform="translate(220,400)">
        <circle r={90} fill={RENK.krem} stroke="#6b5a4a" strokeWidth={10} />
        <path d={`M 0 0 L ${50 * Math.sin(akrep / 12)} ${-50 * Math.cos(akrep / 12)}`} stroke={RENK.koyu} strokeWidth={8} strokeLinecap="round" />
        <path d={`M 0 0 L ${72 * Math.sin(akrep)} ${-72 * Math.cos(akrep)}`} stroke={RENK.koyu} strokeWidth={5} strokeLinecap="round" />
        <circle r={7} fill={RENK.koyu} />
      </g>
      {/* yatak ve kişi */}
      <rect x={120} y={1180} width={860} height={160} rx={20} fill="#7a4f31" />
      <rect x={120} y={1140} width={860} height={70} rx={20} fill={RENK.yatak} />
      <rect x={150} y={1080} width={220} height={90} rx={40} fill="#ffffff" />
      <g transform={`translate(270,${1080 + ba}) rotate(${karis(0, 12, uyanik)})`}>
        <circle r={62} fill={RENK.ten} />
        <path d="M -62 -10 C -60 -80 60 -80 62 -10 C 40 -40 -40 -40 -62 -10 Z" fill={RENK.sac} />
        {uyanik > 0.5 ? (
          <g fill={RENK.koyu}>
            <circle cx={-20} cy={8} r={7} />
            <circle cx={22} cy={8} r={7} />
          </g>
        ) : (
          <path d="M -30 10 Q -20 18 -10 10 M 12 10 Q 22 18 32 10" fill="none" stroke={RENK.koyu} strokeWidth={4} strokeLinecap="round" />
        )}
      </g>
      <path d={`M 330 1130 C 450 ${1060 + Math.sin(t * 1.4) * 8 * (1 - uyanik)} 800 1070 960 1140 L 960 1220 L 330 1220 Z`} fill={RENK.yorgan} />
    </g>
  );
};

// Düşünce balonu: beyin. temiz: toz süpürülür; pil: uykusuzlukta azalır; kart: anılar çekmeceye girer.
const Balon: React.FC<{t: number; gor: number; temiz: number; pil: number; pilGor: number; kart: number; parlak: number}> = ({t, gor, temiz, pil, pilGor, kart, parlak}) => (
  <g opacity={gor}>
    <circle cx={330} cy={980} r={18} fill="#ffffff" opacity={0.9} />
    <circle cx={390} cy={910} r={28} fill="#ffffff" opacity={0.9} />
    <circle cx={BALON.x} cy={BALON.y} r={BALON.r} fill="#ffffff" />
    <g transform={`translate(${BALON.x},${BALON.y})`} opacity={karis(0.45, 1, parlak)}>
      <path d="M -110 10 C -130 -60 -70 -110 -20 -95 C 10 -130 80 -110 95 -60 C 140 -40 130 30 95 50 C 90 90 30 110 0 85 C -40 110 -100 90 -100 50 C -125 40 -120 25 -110 10 Z" fill={RENK.beyin} />
      <path d="M -60 -40 Q -30 -60 0 -40 Q 30 -20 60 -40 M -70 20 Q -30 0 10 20 Q 40 40 70 20 M 0 -90 L 0 80" fill="none" stroke="#d97a90" strokeWidth={6} strokeLinecap="round" />
      {/* atık tozları */}
      {Array.from({length: 12}, (_, i) => {
        const a = i * 2.1;
        return <circle key={i} cx={Math.cos(a) * (40 + (i % 4) * 18) + temiz * 160} cy={Math.sin(a) * 50} r={6} fill="#8a6a5a" opacity={1 - temiz} />;
      })}
      {temiz > 0 && temiz < 1 && (
        <g transform={`translate(${karis(-90, 120, temiz)},${40 + Math.sin(t * 12) * 6}) rotate(-30)`}>
          <rect x={-4} y={-90} width={8} height={80} fill="#8a5a2b" />
          <path d="M -22 -12 L 22 -12 L 30 30 L -30 30 Z" fill="#e8c062" />
        </g>
      )}
      {/* anı kartları */}
      {kart > 0 &&
        [0, 1, 2].map((i) => {
          const u = Math.max(0, Math.min(1, kart * 1.6 - i * 0.3));
          return <rect key={i} x={karis(-260 + i * 60, -30, u)} y={karis(-220, -10 + i * 8, u)} width={60} height={40} rx={6} fill={['#ffd24a', '#7fc8ff', '#a6e3a1'][i]} stroke={RENK.koyu} strokeWidth={3} opacity={1 - 0.6 * u} />;
        })}
    </g>
    {/* pil */}
    <g transform={`translate(${BALON.x - 70},${BALON.y + 120})`} opacity={pilGor}>
      <rect width={140} height={56} rx={10} fill="none" stroke={RENK.koyu} strokeWidth={6} />
      <rect x={140} y={16} width={12} height={24} rx={3} fill={RENK.koyu} />
      <rect x={8} y={8} width={124 * pil} height={40} rx={6} fill={pil > 0.4 ? RENK.yesil : RENK.kirmizi} />
    </g>
  </g>
);

const Kart: React.FC<{u: number; children: React.ReactNode}> = ({u, children}) =>
  u > 0 ? (
    <div style={{position: 'absolute', left: 70, right: 70, top: 260, padding: '34px 40px', background: 'rgba(255,246,226,.96)', borderRadius: 28, boxShadow: '0 10px 40px rgba(0,0,0,.35)', fontFamily: 'Caladea, Georgia, serif', fontWeight: 700, color: RENK.koyu, opacity: u, transform: `translateY(${karis(-30, 0, u)}px)`}}>
      {children}
    </div>
  ) : null;

const Cubuk: React.FC<{ad: string; oran: number; renk: string}> = ({ad, oran, renk}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: 20, margin: '14px 0'}}>
    <div style={{width: 210, fontSize: 40}}>{ad}</div>
    <div style={{height: 40, width: 640 * oran, background: renk, borderRadius: 20}} />
  </div>
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
    <div style={{position: 'absolute', left: 50, right: 50, top: 200, textAlign: 'center', fontFamily: 'Caladea, Georgia, serif', fontWeight: 700, fontSize: boyut, lineHeight: 1.16, color: RENK.krem, opacity: cik, textShadow: '0 4px 22px rgba(5,10,30,.9)'}}>
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
    <div style={{position: 'absolute', left: 80, right: 80, top: 1480, textAlign: 'center', fontFamily: 'Caladea, Georgia, serif', fontWeight: 700, fontSize: 62, lineHeight: 1.25, textShadow: '0 3px 14px rgba(5,10,30,.95), 0 0 4px rgba(5,10,30,.9)'}}>
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

  const uyanik = gir(t, an(1, 2) - 0.1, 0.7) * (1 - gir(t, an(6, 0) - 0.2, 0.7));
  const temiz = gir(t, an(0, 5) - 0.2, 1.6) * (1 - gir(t, an(1, 0), 0.3));
  const pil = 1 - gir(t, an(3, 1), 2.0) * 0.85;
  const pilGor = ac(t, an(3, 0) - 0.2, an(4, 0));
  const kart = gir(t, an(6, 4) - 0.2, 1.4);
  const parlak = 1 - uyanik * 0.6;
  const akrep = t * 0.6 + gir(t, an(2, 2), 1.8) * Math.PI * 16;
  const sabah = gir(t, an(11, 0) - 0.3, 1.8);

  // kartlar
  const k2 = ac(t, an(2, 2) - 0.1, an(3, 0) - 0.2);
  const k4 = ac(t, an(4, 0) - 0.1, an(5, 0) - 0.3);
  const tepki = gir(t, an(4, 6) - 0.1, 0.8);
  const k5 = ac(t, an(5, 0) - 0.1, an(6, 0) - 0.3);
  const k7 = ac(t, an(7, 0) - 0.1, an(8, 0) - 0.3);
  const fare = gir(t, an(7, 4) - 0.1, 0.9);
  const k8 = ac(t, an(8, 0) - 0.1, an(9, 0) - 0.3);
  const gun = Math.max(1, Math.round(11 * gir(t, an(8, 7) - 0.3, 0.9)));
  const k9 = ac(t, an(9, 0) - 0.1, an(10, 0) - 0.4);
  const sayilar = [100, 93, 86, 79, 72, 65];
  const kac = Math.floor(gir(t, an(9, 3), an(9, 7) - an(9, 3)) * sayilar.length);
  const soru = gir(t, an(9, 7), 0.4);

  return (
    <AbsoluteFill style={{background: RENK.duvar}}>
      <Audio src={staticFile('uyku/ses.mp3')} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{position: 'absolute'}}>
        <g transform={kam}>
          <Oda t={t} sabah={sabah} uyanik={uyanik} akrep={akrep} />
          <Balon t={t} gor={1} temiz={temiz} pil={pil} pilGor={pilGor} kart={kart} parlak={parlak} />
        </g>
      </svg>

      <Kart u={k2}>
        <div style={{fontSize: 44, marginBottom: 10}}>Uyumasaydık günümüz:</div>
        <Cubuk ad="Bugün" oran={16 / 24} renk={RENK.vurgu} />
        <Cubuk ad="Uykusuz" oran={gir(0, 0) + karis(16 / 24, 1, k2)} renk={RENK.kirmizi} />
      </Kart>
      <Kart u={k4}>
        <div style={{fontSize: 56, marginBottom: 10}}>17 saat uyanık</div>
        <Cubuk ad="Dinlenmiş" oran={0.45} renk={RENK.yesil} />
        <Cubuk ad="Uykusuz" oran={karis(0.45, 0.8, tepki)} renk={RENK.kirmizi} />
        <div style={{fontSize: 34, color: '#5a5a6a'}}>tepki süresi</div>
      </Kart>
      <Kart u={k5}>
        <div style={{fontSize: 50, lineHeight: 1.25}}>17–19 saat uykusuzluk</div>
        <div style={{fontSize: 50, lineHeight: 1.25, color: RENK.kirmizi}}>≈ kanda ‰0,5 alkol</div>
        <div style={{fontSize: 32, color: '#5a5a6a', marginTop: 10}}>bazı testlerde · Williamson ve Feyer, 2000</div>
      </Kart>
      <Kart u={k7}>
        <div style={{fontSize: 44, marginBottom: 10}}>🐭 Beyindeki atık temizliği</div>
        <Cubuk ad="Uyanık" oran={0.35} renk="#9aa3b5" />
        <Cubuk ad="Uykuda" oran={karis(0.35, 0.95, fare)} renk={RENK.yesil} />
        <div style={{fontSize: 30, color: '#5a5a6a'}}>Xie ve ark., Science, 2013</div>
      </Kart>
      <Kart u={k8}>
        <div style={{textAlign: 'center', fontSize: 150, lineHeight: 1, color: RENK.kirmizi}}>{gun} gün</div>
        <div style={{textAlign: 'center', fontSize: 44}}>uykusuz · 1964</div>
      </Kart>
      <Kart u={k9}>
        <div style={{fontSize: 70, textAlign: 'center'}}>
          {sayilar.slice(0, Math.max(1, kac)).join(' → ')}
          <span style={{color: RENK.kirmizi, opacity: soru}}> → ?</span>
        </div>
        <div style={{fontSize: 34, textAlign: 'center', color: '#5a5a6a', marginTop: 8}}>100'den geriye 7'şer çıkarma</div>
      </Kart>

      <DevYazi t={t} kelimeler={dev(0, [2, 4])} cikis={an(1, 0) - 0.35} boyut={96} vurgu="temizlik" />
      <DevYazi t={t} kelimeler={dev(10, [2])} cikis={an(11, 0) - 0.35} boyut={100} vurgu="kaybedilmiş" />
      <DevYazi t={t} kelimeler={dev(11, [2])} cikis={an(12, 0) - 0.5} boyut={110} vurgu="mümkün" />
      <Altyazi t={t} />
      <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 60%, rgba(0,0,15,0.45) 100%)'}} />
    </AbsoluteFill>
  );
};

const sure = Math.ceil((K[K.length - 1].e + 1.2) * FPS);
export const Root: React.FC = () => <Composition id="Video" component={Video} durationInFrames={sure} fps={FPS} width={1080} height={1920} />;
