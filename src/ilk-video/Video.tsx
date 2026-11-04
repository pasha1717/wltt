// src/ilk-video/Video.tsx: tek sahnelik iskelet. Çizimi kendi konuna göre değiştir, zaman mantığı aynı kalır.
import React from 'react';
import {AbsoluteFill, Audio, Composition, Easing, interpolate, staticFile, useCurrentFrame} from 'remotion';
import veri from '../../public/ilk-video/kelimeler.json';

type Kelime = {w: string; s: number; e: number; c: number};
const K = veri as Kelime[];
const FPS = 30;

// Sahne anı kelimeden gelir, elle saniye yazılmaz: an(1, 3) ikinci satırın dördüncü kelimesi.
const an = (satir: number, kelime = 0) => K.filter((k) => k.c === satir)[kelime].s;
// t0'dan başlayıp 0'dan 1'e yumuşakça gider. Kamera ve bütün hareketler bununla yapılır.
const gir = (t: number, t0: number, sure = 0.8) =>
  interpolate(t, [t0, t0 + sure], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.45, 0, 0.55, 1)});
const karis = (a: number, b: number, u: number) => a + (b - a) * u;

// Altyazı: satır kelime kelime açılır, söylenen kelime sarıdır. Görünmeyen kelime yer tutar, satır zıplamaz.
const Altyazi: React.FC<{t: number}> = ({t}) => {
  const aktif = K.filter((k) => k.s - 0.04 <= t).pop();
  if (!aktif) return null;
  return (
    <div style={{position: 'absolute', left: 70, right: 70, top: 1380, textAlign: 'center', fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: 58, lineHeight: 1.25}}>
      {K.filter((k) => k.c === aktif.c).map((k, i) => (
        <span key={i} style={{opacity: t >= k.s - 0.04 ? 1 : 0, color: k === aktif ? '#ffd84a' : '#fff', textShadow: '0 3px 10px rgba(0,0,0,.85)'}}>
          {k.w}{' '}
        </span>
      ))}
    </div>
  );
};

const Video: React.FC = () => {
  const t = useCurrentFrame() / FPS;
  const kaz = gir(t, an(0, 0), an(0, 5) - an(0, 0)); // kuyu cümle boyunca derinleşir
  const don = gir(t, an(1, 0), 1.2); // ikinci satırda kamera yana süzülür
  const su = gir(t, an(1, 4), 0.6); // "yanında" kelimesinde su belirir
  const nefes = Math.sin(t * 1.2) * 4; // adam hiç tam durmaz
  return (
    <AbsoluteFill style={{background: '#d9c8a0'}}>
      <Audio src={staticFile('ilk-video/ses.mp3')} />
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <g transform={`translate(${karis(0, -520, don)},${karis(0, -180, kaz) * (1 - don)})`}>
          <rect x={-600} y={760} width={2800} height={1500} fill="#8a6a43" />
          <rect x={440} y={760} width={200} height={karis(40, 560, kaz)} fill="#2d2118" />
          <rect x={1040} y={1010} width={500} height={120} rx={60} fill="#4aa3d8" opacity={su} />
          <g transform={`translate(540,${karis(680, 1240, kaz) + nefes})`} fill="none" stroke="#f3e6c8" strokeWidth={12} strokeLinecap="round">
            <circle cy={-40} r={36} fill="#f3e6c8" />
            <path d="M 0 0 L 0 70 M 0 20 L -40 50 M 0 20 L 40 50" />
          </g>
        </g>
      </svg>
      <Altyazi t={t} />
    </AbsoluteFill>
  );
};

const sure = Math.ceil((K[K.length - 1].e + 1.2) * FPS);
export const Root: React.FC = () => <Composition id="Video" component={Video} durationInFrames={sure} fps={FPS} width={1080} height={1920} />;
