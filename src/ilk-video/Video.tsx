// src/ilk-video/Video.tsx: Kalem kapağındaki delik. Sahne planı: public/ilk-video/sahne-plani.md
// Tek defter dünyası, tek kesintisiz kamera. Bütün anlar kelime zamanlarından gelir (an), elle saniye yazılmaz.
import React from 'react';
import {AbsoluteFill, Audio, Composition, Easing, interpolate, staticFile, useCurrentFrame} from 'remotion';
import veri from '../../public/ilk-video/kelimeler.json';

type Kelime = {w: string; s: number; e: number; c: number};
const K = veri as Kelime[];
const FPS = 30;

const an = (satir: number, kelime = 0) => K.filter((k) => k.c === satir)[kelime].s;
const gir = (t: number, t0: number, sure = 0.8) =>
  interpolate(t, [t0, t0 + sure], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.45, 0, 0.55, 1)});
const dus = (t: number, t0: number, sure: number) =>
  interpolate(t, [t0, t0 + sure], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad)});
const karis = (a: number, b: number, u: number) => a + (b - a) * u;
// Çizgiyi baştan sona çizer. L yolun yaklaşık uzunluğu, biraz fazlası olabilir.
const ciz = (u: number, L: number) => ({strokeDasharray: `${L} ${L}`, strokeDashoffset: L * (1 - u), opacity: u > 0 ? 1 : 0});

const RENK = {
  kagit: '#f3ead6',
  kare: '#bcd4e6',
  murekkep: '#1f3a93',
  koyu: '#1c2147',
  kirmizi: '#d4362c',
  kapak: '#2f6fd6',
  kapakKoyu: '#2052a8',
  kece: '#2b3570',
};
const MUR = {fill: 'none', stroke: RENK.murekkep, strokeWidth: 7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const};

// ---------- Dünya yerleşimi ----------
// Kalem defterde çapraz yatıyor. Yerel eksende x kalemin boyu, +x ucun (ve kapağın) yönü.
const KALEM = {x: 500, y: 800, aci: -32};
const dunya = (lx: number, ly = 0): [number, number] => {
  const a = (KALEM.aci * Math.PI) / 180;
  return [KALEM.x + lx * Math.cos(a) - ly * Math.sin(a), KALEM.y + lx * Math.sin(a) + ly * Math.cos(a)];
};
const DAMLA: [number, number] = [905, 650];
const SORU: [number, number] = [700, 840];
const CIZIK = {a: [968, 600], k: [800, 745], b: [636, 918]} as const;
const cizikNokta = (u: number): [number, number] => {
  const {a, k, b} = CIZIK;
  const m = 1 - u;
  return [m * m * a[0] + 2 * m * u * k[0] + u * u * b[0], m * m * a[1] + 2 * m * u * k[1] + u * u * b[1]];
};
// Çocuk çizimi kalemin altında, nefes yolu şeması onun da altında.
const AGIZ: [number, number] = [566, 1765];
const BOGAZ: [number, number] = [545, 1880];
const YOL = {x: 540, agiz: 2420, ust: 2330, alt: 2890}; // okların aktığı eksen
const TIPA = {y: 2650, boy: 110}; // kapağın takıldığı yer
const TIPA_UST = TIPA.y - TIPA.boy / 2;
const MUHUR: [number, number] = [868, 2565];

// ---------- Kamera ----------
type Kamera = {cx: number; cy: number; s: number; fx: number; fy: number};
const [UX, UY] = dunya(512, 0);
const YAKIN: Kamera = {cx: UX, cy: UY, s: 4.6, fx: 560, fy: 1150};
const GENIS: Kamera = {cx: 560, cy: 740, s: 0.95, fx: 540, fy: 820};
// Her durak: ne zaman başlar, ne kadar sürer, nereye gider. kalkis: yolda geri çekilip yükselme payı.
const DURAKLAR: {t0: number; sure: number; k: Kamera; kalkis?: number}[] = [
  {t0: 0, sure: an(1, 0), k: {...YAKIN, s: 5.2}},
  {t0: an(1, 0) - 0.2, sure: 1.4, k: GENIS},
  {t0: an(3, 0) - 0.45, sure: 1.2, k: {cx: 560, cy: 1790, s: 1.3, fx: 540, fy: 820}},
  {t0: an(4, 0) + 0.1, sure: Math.max(1.3, an(4, 3) - an(4, 0) + 0.3), k: {cx: 560, cy: 2800, s: 1.0, fx: 540, fy: 800}},
  {t0: an(8, 0) - 0.35, sure: 0.9, k: {cx: 545, cy: 2760, s: 1.04, fx: 540, fy: 800}},
  {t0: an(9, 0) - 0.3, sure: 1.7, k: {...YAKIN, s: 5.0}, kalkis: 0.65},
  {t0: an(11, 0) - 0.1, sure: 1.3, k: GENIS},
];
const kamera = (t: number): Kamera => {
  let k = YAKIN;
  for (const d of DURAKLAR) {
    const u = gir(t, d.t0, d.sure);
    if (u <= 0) break;
    const kalk = 1 - (d.kalkis ?? 0) * Math.sin(Math.PI * u);
    k = {
      cx: karis(k.cx, d.k.cx, u),
      cy: karis(k.cy, d.k.cy, u),
      s: Math.exp(karis(Math.log(k.s), Math.log(d.k.s), u)) * kalk,
      fx: karis(k.fx, d.k.fx, u),
      fy: karis(k.fy, d.k.fy, u),
    };
  }
  return {...k, cx: k.cx + Math.sin(t * 0.7) * 3};
};
const kameraDonusumu = (k: Kamera) => `translate(${k.fx},${k.fy}) scale(${k.s}) translate(${-k.cx},${-k.cy})`;

// ---------- Nesneler ----------
const Defter: React.FC = () => (
  <>
    <rect x={-1500} y={-1500} width={4200} height={6000} fill={RENK.kagit} />
    <rect x={-1500} y={-1500} width={4200} height={6000} fill="url(#kareler)" />
  </>
);

// Tükenmez kalem: saydam gövde, mürekkep borusu, uç, yarı saydam mavi kapak.
const Kalem: React.FC<{kalk: number}> = ({kalk}) => {
  const cizgi = {stroke: RENK.koyu, strokeWidth: 3, strokeLinejoin: 'round' as const};
  return (
    <g transform={`translate(${KALEM.x},${KALEM.y}) rotate(${KALEM.aci})`}>
      <rect x={-525} y={-30} width={1050} height={74} rx={30} fill="#3a2f1c" opacity={0.16} filter="url(#golge)" />
      <rect x={-528} y={-27} width={36} height={54} rx={8} fill={RENK.kapak} {...cizgi} />
      <rect x={-500} y={-32} width={832} height={64} rx={4} fill="#e9f0f6" opacity={0.92} {...cizgi} />
      <rect x={-488} y={-7} width={830} height={14} rx={7} fill={RENK.murekkep} />
      <path d="M -496 -13 L 328 -13 M -496 13 L 328 13" stroke="#ffffff" strokeWidth={4} opacity={0.8} />
      <path d="M 330 -32 L 410 -9 L 410 9 L 330 32 Z" fill="#f4f6f8" {...cizgi} />
      <path d="M 410 -9 L 440 -4 L 440 4 L 410 9 Z" fill="#a3acb6" {...cizgi} />
      <circle cx={443} cy={0} r={3.5} fill="#5d6670" />
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

// Deftere giren yardımcı kalem (ucu sıfır noktasında, gövdesi sağ alta uzanır).
const ElKalemi: React.FC<{x: number; y: number; govde: string; ic?: string}> = ({x, y, govde, ic}) => (
  <g transform={`translate(${x},${y}) rotate(38)`}>
    <rect x={20} y={-18} width={700} height={52} rx={22} fill="#3a2f1c" opacity={0.15} filter="url(#golge)" />
    <path d="M 0 0 L 52 -20 L 52 20 Z" fill="#f4f6f8" stroke={RENK.koyu} strokeWidth={3} strokeLinejoin="round" />
    <path d="M 0 0 L 14 -5 L 14 5 Z" fill={ic ?? govde} />
    <rect x={52} y={-22} width={680} height={44} rx={6} fill={govde} stroke={RENK.koyu} strokeWidth={3} />
    {ic && <rect x={56} y={-6} width={672} height={12} rx={6} fill={ic} />}
    <path d="M 60 -13 L 725 -13" stroke="#ffffff" strokeWidth={5} opacity={0.35} />
  </g>
);

// Yutulan kapak (mürekkeple çizilmiş). Yerel: kapalı uç -x, açık uç +x. delik: 0..1 ortadan geçen kanal.
const KucukKapak: React.FC<{delik: number}> = ({delik}) => (
  <g>
    <path d="M -55 -38 L 55 -38 L 55 38 L -55 38 Q -66 38 -66 26 L -66 -26 Q -66 -38 -55 -38 Z" fill={RENK.kapak} stroke={RENK.murekkep} strokeWidth={6} strokeLinejoin="round" />
    <path d="M -40 -38 L -40 -52 L 45 -52 L 45 -38" fill={RENK.kapakKoyu} stroke={RENK.murekkep} strokeWidth={5} strokeLinejoin="round" />
    <path d="M -48 -20 L 44 -20" stroke="#ffffff" strokeWidth={5} opacity={0.35} strokeLinecap="round" />
    <path d="M -68 0 L 57 0" stroke={RENK.kagit} strokeWidth={11} strokeLinecap="round" {...ciz(delik, 130)} />
  </g>
);

// Keçeli kalemin kalın kapağı: nefes yoluna sığmaz.
const KeceKapak: React.FC = () => (
  <g>
    <path d="M -125 -60 Q -125 -100 -85 -100 L 85 -100 Q 125 -100 125 -60 L 125 95 L -125 95 Z" fill={RENK.kece} stroke={RENK.murekkep} strokeWidth={7} strokeLinejoin="round" />
    <path d="M -125 60 L 125 60" stroke={RENK.kagit} strokeWidth={6} opacity={0.5} />
    <path d="M -95 -70 L -95 40" stroke="#ffffff" strokeWidth={9} opacity={0.25} strokeLinecap="round" />
    <path d="M 95 -100 L 95 -128 L 138 -128 L 138 40 L 125 40" fill={RENK.kece} stroke={RENK.murekkep} strokeWidth={7} strokeLinejoin="round" />
  </g>
);

// Mürekkeple çizilmiş çocuk. sas: 0..1 irkilme, dusun: göz yukarıda.
const Cocuk: React.FC<{t: number; sas: number}> = ({t, sas}) => {
  const egim = Math.sin(t * 1.3) * 2 * (1 - sas);
  const kalk = -8 * sas;
  const gozRx = karis(16, 23, sas);
  const gozRy = karis(18, 27, sas);
  const bak = (1 - sas) * 1;
  const kas = -12 * sas;
  return (
    <g>
      {/* masa ve kol */}
      <path d="M 150 2010 L 940 2010 M 170 2040 L 920 2040" {...MUR} />
      <path d="M 310 2010 C 300 1900 380 1860 500 1850 L 500 1815 M 580 1815 L 580 1850 C 690 1858 760 1900 770 2010" {...MUR} />
      <path d="M 330 1985 C 400 2000 520 2000 610 1984" {...MUR} />
      <path d="M 600 1990 L 700 1915" {...MUR} strokeWidth={10} />
      <path d="M 700 1915 L 716 1903" {...MUR} strokeWidth={4} />
      <g transform={`translate(0,${kalk}) rotate(${egim} 540 1800)`}>
        <ellipse cx={540} cy={1690} rx={118} ry={130} {...MUR} fill={RENK.kagit} />
        <path d="M 420 1680 C 405 1565 500 1530 560 1545 C 645 1552 682 1612 660 1682 C 640 1632 602 1616 572 1632 C 540 1602 482 1620 450 1665 Z" fill={RENK.murekkep} stroke={RENK.murekkep} strokeWidth={5} strokeLinejoin="round" />
        <path d="M 424 1690 Q 404 1700 418 1728 M 656 1690 Q 676 1700 662 1728" {...MUR} strokeWidth={6} />
        {[495, 588].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy={1698} rx={gozRx} ry={gozRy} {...MUR} strokeWidth={5} fill="#fbf7ee" />
            <circle cx={x + 4 * bak} cy={1698 - 7 * bak} r={karis(8, 6, sas)} fill={RENK.murekkep} />
            <path d={`M ${x - 20} ${1664 + kas} Q ${x} ${1652 + kas} ${x + 20} ${1664 + kas}`} {...MUR} strokeWidth={6} />
          </g>
        ))}
        <path d="M 543 1712 Q 536 1738 552 1740" {...MUR} strokeWidth={5} />
        <ellipse cx={AGIZ[0]} cy={AGIZ[1]} rx={karis(13, 15, sas)} ry={karis(9, 17, sas)} {...MUR} strokeWidth={5} fill={RENK.murekkep} />
      </g>
    </g>
  );
};

// Nefes yolu şeması: ağız, nefes borusu, iki bronş, iki akciğer ve göğüs çizgisi.
const Sema: React.FC<{nefes: number}> = ({nefes}) => (
  <g>
    <g transform={`translate(540,3050) scale(${1 + 0.04 * nefes},${1 + 0.03 * nefes}) translate(-540,-3050)`}>
      <path d="M 205 2905 C 175 3190 300 3335 540 3335 C 780 3335 905 3190 875 2905" {...MUR} strokeWidth={6} opacity={0.75} />
      <path d="M 478 2905 C 380 2880 268 2950 262 3090 C 258 3215 340 3270 410 3255 C 470 3240 490 3160 492 3060 Z" {...MUR} strokeWidth={6} />
      <path d="M 602 2905 C 700 2880 812 2950 818 3090 C 822 3215 740 3270 670 3255 C 610 3240 590 3160 588 3060 Z" {...MUR} strokeWidth={6} />
    </g>
    <path d="M 410 2420 C 470 2450 500 2480 500 2545 L 500 2850 C 500 2900 450 2930 405 2990" {...MUR} />
    <path d="M 670 2420 C 610 2450 580 2480 580 2545 L 580 2850 C 580 2900 630 2930 675 2990" {...MUR} />
    <path d="M 432 3024 C 470 2960 530 2935 540 2898 C 550 2935 610 2960 648 3024" {...MUR} />
    <path d="M 512 2600 L 524 2600 M 512 2700 L 524 2700 M 512 2800 L 524 2800 M 556 2600 L 568 2600 M 556 2700 L 568 2700 M 556 2800 L 568 2800" {...MUR} strokeWidth={4} opacity={0.6} />
  </g>
);

// Hava okları. Her ok n bir akıştır; kapak takılınca üstünde birikir, delik açılınca yeniden akar.
const HIZ = 140;
const ARA = 80;
const Oklar: React.FC<{t: number; acik: number; tb: number; tu: number; kapakVar: number}> = ({t, acik, tb, tu, kapakVar}) => {
  if (acik <= 0) return null;
  const serbest = (n: number, tt: number) => YOL.ust + HIZ * tt - ARA * n;
  const n0 = Math.ceil((YOL.ust + HIZ * tb - TIPA_UST) / ARA);
  const yigin = (r: number) => (r <= 6 ? TIPA_UST - 24 - r * 30 : TIPA_UST - 24 - 180 - (r - 6) * ARA);
  const enYeni = Math.floor((YOL.ust + HIZ * t - YOL.ust) / ARA) + 1;
  const oklar: React.ReactNode[] = [];
  for (let n = enYeni; n > enYeni - 30; n--) {
    let y = serbest(n, t);
    if (t > tb && n >= n0) {
      const dur = yigin(n - n0);
      y = t < tu ? Math.min(y, dur) : Math.min(serbest(n, tu), dur) + HIZ * (t - tu);
    }
    if (y < YOL.ust || y > YOL.alt) continue;
    const gorun = interpolate(y, [YOL.ust, YOL.ust + 40, YOL.alt - 60, YOL.alt], [0, 1, 1, 0]);
    const delikte = kapakVar > 0.5 && y > TIPA_UST - 10 && y < TIPA.y + TIPA.boy / 2 + 10;
    oklar.push(
      <g key={n} transform={`translate(${YOL.x},${y}) scale(${delikte ? 0.35 : 1},1)`} opacity={gorun * acik}>
        <path d="M 0 -26 L 0 8 M -15 -6 L 0 9 L 15 -6" {...MUR} stroke={delikte ? RENK.kagit : RENK.murekkep} strokeWidth={delikte ? 9 : 6} />
      </g>,
    );
  }
  return <g>{oklar}</g>;
};

const Muhur: React.FC<{u: number}> = ({u}) => {
  if (u <= 0) return null;
  const s = karis(1.5, 1, u);
  return (
    <g transform={`translate(${MUHUR[0]},${MUHUR[1]}) rotate(-14) scale(${s})`} opacity={Math.min(1, u * 2) * 0.9}>
      <circle r={112} fill="none" stroke={RENK.murekkep} strokeWidth={9} />
      <circle r={94} fill="none" stroke={RENK.murekkep} strokeWidth={4} />
      <path d="M -40 -40 L 40 -40 M -40 40 L 40 40" stroke={RENK.murekkep} strokeWidth={4} />
      <text x={0} y={-50} textAnchor="middle" fontFamily="Caladea, Georgia, serif" fontWeight={700} fontSize={20} fill={RENK.murekkep}>★ ★ ★</text>
      <text x={0} y={14} textAnchor="middle" fontFamily="Caladea, Georgia, serif" fontWeight={700} fontSize={40} fill={RENK.murekkep}>ISO 11540</text>
      <text x={0} y={70} textAnchor="middle" fontFamily="Caladea, Georgia, serif" fontWeight={700} fontSize={20} fill={RENK.murekkep}>★ ★ ★</text>
    </g>
  );
};

// ---------- Yazılar ----------
type DevKelime = {w: string; s: number} | null;
const DevYazi: React.FC<{t: number; kelimeler: DevKelime[]; cikis: number; boyut: number; daire?: string}> = ({t, kelimeler, cikis, boyut, daire}) => {
  const ilk = kelimeler.find((k) => k)!.s;
  if (t < ilk - 0.1 || t > cikis + 0.4) return null;
  const cik = 1 - gir(t, cikis, 0.4);
  return (
    <div style={{position: 'absolute', left: 50, right: 50, top: 300, textAlign: 'center', fontFamily: 'Caladea, Georgia, serif', fontWeight: 700, fontSize: boyut, lineHeight: 1.18, color: RENK.murekkep, opacity: cik, paintOrder: 'stroke fill', WebkitTextStroke: `14px ${RENK.kagit}`}}>
      {kelimeler.map((k, i) => {
        if (!k) return <br key={i} />;
        const u = gir(t, k.s - 0.06, 0.25);
        const d = gir(t, k.s + 0.1, 0.5);
        return (
          <span key={i} style={{position: 'relative', display: 'inline-block', margin: '0 14px', opacity: u, transform: `translateY(${karis(18, 0, u)}px)`}}>
            {k.w}
            {k.w === daire && (
              <svg style={{position: 'absolute', left: -14, top: -8, width: 'calc(100% + 50px)', height: 'calc(100% + 16px)', overflow: 'visible'}} viewBox="0 0 300 150" preserveAspectRatio="none">
                <path d="M 250 22 C 180 -6, 40 2, 14 60 C -6 110, 120 146, 220 130 C 300 116, 302 46, 222 18" fill="none" stroke={RENK.kirmizi} strokeWidth={9} strokeLinecap="round" {...ciz(d, 820)} />
              </svg>
            )}
          </span>
        );
      })}
    </div>
  );
};
const dev = (satir: number, kirilma: number[]): DevKelime[] => {
  const ks = K.filter((k) => k.c === satir);
  const sonuc: DevKelime[] = [];
  ks.forEach((k, i) => {
    if (kirilma.includes(i)) sonuc.push(null);
    sonuc.push({w: k.w, s: k.s});
  });
  return sonuc;
};
const DEV0 = dev(0, [5]); // "Kalem kapağına" dev yazıda yok
const DEV0_YAZI = DEV0.filter((k) => !k || (k.w !== 'Kalem' && k.w !== 'kapağına')).map((k, i) => (k && i === 0 ? {...k, w: k.w[0].toLocaleUpperCase('tr') + k.w.slice(1)} : k));
const DEV9 = dev(9, [3, 6]);
const DEV10 = dev(10, [2]);

// Altyazı: söylenen satır kelime kelime açılır. Dev yazılı satırlarda (0, 9, 10) yoktur.
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

// Son satır: sayfanın köşesi kıvrılır, kâğıt uçak olup uçar.
const UCAK = {p0: [960, 1800], p1: [1075, 1330], p2: [940, 760], p3: [1260, 280]} as const;
const ucakNokta = (u: number): [number, number] => {
  const m = 1 - u;
  const f = (i: 0 | 1) => m * m * m * UCAK.p0[i] + 3 * m * m * u * UCAK.p1[i] + 3 * m * u * u * UCAK.p2[i] + u * u * u * UCAK.p3[i];
  return [f(0), f(1)];
};
const KoseVeUcak: React.FC<{t: number}> = ({t}) => {
  const kivril = gir(t, an(11, 1), 0.6);
  const kalk = gir(t, an(11, 3) - 0.15, 1.35);
  if (kivril <= 0) return null;
  const a = 230 * kivril;
  const [x, y] = ucakNokta(kalk);
  const [x2, y2] = ucakNokta(Math.min(1, kalk + 0.02));
  const aci = (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI;
  return (
    <svg width={1080} height={1920} style={{position: 'absolute'}}>
      <path d={`M ${1080 - a} 1920 L 1080 ${1920 - a} L 1080 1920 Z`} fill="#cdb98f" />
      {kalk <= 0.02 && (
        <path d={`M ${1080 - a} 1920 L 1080 ${1920 - a} L ${1080 - a} ${1920 - a} Z`} fill="#e7ddc5" stroke={RENK.koyu} strokeWidth={3} strokeLinejoin="round" />
      )}
      {kalk > 0.02 && (
        <g transform={`translate(${x},${y}) rotate(${aci}) scale(${karis(0.9, 1.25, kalk)})`}>
          <path d="M 70 0 L -70 -58 L -36 0 L -70 58 Z" fill="#f8f1e0" stroke={RENK.koyu} strokeWidth={3} strokeLinejoin="round" />
          <path d="M 70 0 L -36 0 L -70 18" fill="none" stroke={RENK.koyu} strokeWidth={3} strokeLinejoin="round" />
        </g>
      )}
    </svg>
  );
};

// ---------- Video ----------
const Video: React.FC = () => {
  const kare = useCurrentFrame();
  const t = kare / FPS;
  const kam = kameraDonusumu(kamera(t));
  const kaynar = Math.floor(kare / 5) % 7;

  // 1-2: kapak kalkar, damla ve soru işareti, kırmızı kalemle üstünü çizme. Kamera gidince sayfadan silinir.
  const kalk = gir(t, an(1, 0) + 0.45, 0.9) * (1 - gir(t, an(4, 0), 0.5));
  const damla = interpolate(t, [an(1, 1) - 0.05, an(1, 1) + 0.25, an(1, 1) + 0.4], [0, 1.12, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const soru = gir(t, an(1, 3) - 0.1, 0.6);
  const soruNokta = gir(t, an(1, 3) + 0.45, 0.15);
  const ilkIzler = 1 - gir(t, an(4, 0), 0.6);
  const gel = gir(t, an(2, 0) - 0.8, 0.75);
  const cizgi = gir(t, an(2, 0) - 0.05, 0.4);
  const git = gir(t, an(3, 0) - 0.5, 0.9);
  const [cux, cuy] = cizgi > 0 ? cizikNokta(cizgi) : CIZIK.a;
  const kx = karis(karis(1300, cux, gel), 1400, git);
  const ky = karis(karis(380, cuy, gel), 1250, git);

  // 3: çocuk sayfada belirir, kapağı ağzında. "yutar" da kapak kaybolur, gözler irileşir.
  const cocukCiz = gir(t, an(3, 0) - 0.5, 1.0);
  const cocukKalir = 1 - gir(t, an(5, 0), 0.5); // kamera gidince sayfadan silinir, son karede görünmez
  const sas = gir(t, an(3, 7) + 0.05, 0.35);
  const yut = gir(t, an(3, 7), 0.25);

  // 4: kapak boğazdan şemaya iner, "tıpa" da yolu kapatır.
  const semaCiz = gir(t, an(4, 0) + 0.2, 1.1);
  const in1 = gir(t, an(4, 0) + 0.05, an(4, 3) - an(4, 0));
  const in2 = gir(t, an(4, 3) + 0.05, an(4, 6) - an(4, 3) - 0.1);
  const tb = an(4, 6);
  // 6: kalem ucu kapağın tepesine nokta basar, delik açılır. 7: oklar delikten geçer, göğüs iner kalkar.
  const tu = an(7, 0) - 0.1;
  const kalemGel = gir(t, an(6, 0) - 0.3, 0.8);
  const kalemGit = gir(t, an(6, 5) + 0.1, 0.9);
  const bas = interpolate(t, [an(6, 3) - 0.12, an(6, 3), an(6, 3) + 0.18], [0, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const delik = gir(t, an(6, 3), 0.4);
  const nefesBas = gir(t, an(7, 7) - 0.1, 0.8);
  const nefes = nefesBas * Math.sin(((t - an(7, 7)) * 2 * Math.PI) / 3.0);
  const kucukKalir = 1 - gir(t, an(8, 0) - 0.3, 0.5);

  let kapak = {x: AGIZ[0] + 52, y: AGIZ[1] - 2, r: Math.sin(t * 6) * 4 * (1 - yut), s: 0.62 * (1 - yut), o: cocukCiz};
  if (yut > 0) kapak = {...kapak, x: karis(AGIZ[0] + 52, AGIZ[0], yut), y: AGIZ[1]};
  if (t >= an(4, 0)) {
    const belir = gir(t, an(4, 0), 0.3);
    kapak = {
      x: karis(karis(BOGAZ[0], YOL.x, in1), YOL.x, in2),
      y: karis(karis(BOGAZ[1], YOL.agiz - 40, in1), TIPA.y, in2),
      r: 90,
      s: karis(0.62, 1, in1),
      o: belir * kucukKalir,
    };
    if (belir < 1) kapak.s *= belir;
  }

  // 8: keçeli kalemin kapağı yolun ağzına düşer, sığmaz, kenara yuvarlanır.
  const kDus = dus(t, an(8, 0) - 0.15, 0.6);
  const kZipla = interpolate(t, [an(8, 0) + 0.45, an(8, 0) + 0.6, an(8, 0) + 0.8], [0, -26, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const kKay = gir(t, an(8, 3) - 0.1, 1.0);
  const keceO = gir(t, an(8, 0) - 0.3, 0.2) * (1 - gir(t, an(9, 0) + 0.6, 0.4));
  const keceX = karis(548, 255, kKay);
  const keceY = karis(karis(2060, YOL.agiz - 95, kDus) + kZipla, 2392, kKay);
  const keceR = karis(karis(-12, 0, kDus), -22, kKay);

  // 10: delikten ince hava çizgisi çıkar.
  const hava = gir(t, an(10, 0) - 0.2, 0.8) * (1 - gir(t, an(11, 0) + 0.3, 0.6));

  // 6: deliği açan kalem
  const ucX = karis(1350, YOL.x + 4, kalemGel);
  const ucY = karis(2300, TIPA_UST - 8 + 10 * bas, kalemGel);

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
          <clipPath id="cocukAc">
            <rect x={0} y={1500} width={1100} height={640 * cocukCiz} />
          </clipPath>
          <clipPath id="semaAc">
            <rect x={0} y={2380} width={1100} height={1000 * semaCiz} />
          </clipPath>
        </defs>

        <g transform={kam}>
          <Defter />
          <Kalem kalk={kalk} />
        </g>

        {/* mürekkep katmanı: elle çizilmiş gibi titrer */}
        <g filter="url(#titrek)">
          <g transform={kam}>
            <g opacity={ilkIzler}>
              <g transform={`translate(${DAMLA[0]},${DAMLA[1]}) rotate(-20) scale(${damla})`}>
                <path d="M 0 -48 C 16 -20 30 0 30 18 A 30 30 0 1 1 -30 18 C -30 0 -16 -20 0 -48 Z" fill={RENK.murekkep} stroke={RENK.murekkep} strokeWidth={3} />
                <path d="M -14 12 Q -16 26 -6 34" fill="none" stroke="#ffffff" strokeWidth={5} strokeLinecap="round" opacity={0.5} />
              </g>
              <g transform={`translate(${SORU[0]},${SORU[1]})`}>
                <path d="M -50 -46 C -50 -112 52 -116 52 -50 C 52 -10 2 -6 2 34" fill="none" stroke={RENK.murekkep} strokeWidth={14} strokeLinecap="round" {...ciz(soru, 340)} />
                <circle cx={2} cy={78} r={11 * soruNokta} fill={RENK.murekkep} />
              </g>
              <path d={`M ${CIZIK.a[0]} ${CIZIK.a[1]} Q ${CIZIK.k[0]} ${CIZIK.k[1]} ${CIZIK.b[0]} ${CIZIK.b[1]}`} fill="none" stroke={RENK.kirmizi} strokeWidth={17} strokeLinecap="round" {...ciz(cizgi, 490)} />
            </g>

            {cocukCiz > 0 && (
              <g clipPath="url(#cocukAc)" opacity={cocukKalir}>
                <Cocuk t={t} sas={sas} />
              </g>
            )}

            {semaCiz > 0 && (
              <g clipPath="url(#semaAc)">
                <Sema nefes={nefes} />
              </g>
            )}
            <Muhur u={gir(t, an(5, 5) - 0.05, 0.22)} />

            {kapak.o > 0 && kapak.s > 0 && (
              <g transform={`translate(${kapak.x},${kapak.y}) rotate(${kapak.r}) scale(${kapak.s})`} opacity={kapak.o}>
                <KucukKapak delik={delik} />
              </g>
            )}
            <Oklar t={t} acik={semaCiz} tb={tb} tu={tu} kapakVar={kucukKalir} />

            {keceO > 0 && (
              <g transform={`translate(${keceX},${keceY}) rotate(${keceR})`} opacity={keceO}>
                <KeceKapak />
              </g>
            )}

            {hava > 0 && (
              <g transform={`translate(${KALEM.x},${KALEM.y}) rotate(${KALEM.aci})`} opacity={hava}>
                {[-6, 4, 12].map((dy, i) => (
                  <path key={i} d={`M 527 ${dy} C 550 ${dy - 8} 570 ${dy + 8} 595 ${dy} C 615 ${dy - 8} 635 ${dy + 6} 660 ${dy}`} fill="none" stroke="#5b7fe0" strokeWidth={1.6} strokeLinecap="round" strokeDasharray="14 10" strokeDashoffset={-t * 40 - i * 9} opacity={0.8 - i * 0.2} />
                ))}
              </g>
            )}
          </g>
        </g>

        <g transform={kam}>
          {gel > 0 && git < 1 && <ElKalemi x={kx} y={ky} govde={RENK.kirmizi} />}
          {kalemGel > 0 && kalemGit < 1 && <ElKalemi x={karis(ucX, 1400, kalemGit)} y={karis(ucY, 2350, kalemGit)} govde="#e9f0f6" ic={RENK.murekkep} />}
        </g>
      </svg>

      <DevYazi t={t} kelimeler={DEV0_YAZI} cikis={an(1, 0) - 0.3} boyut={112} daire="kural" />
      <DevYazi t={t} kelimeler={DEV9} cikis={an(10, 0) - 0.4} boyut={104} />
      <DevYazi t={t} kelimeler={DEV10} cikis={an(11, 0) - 0.25} boyut={136} />
      <Altyazi t={t} />
      <KoseVeUcak t={t} />

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
