import { useEffect, useState } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import Svg, { Circle, Defs, Line, RadialGradient, Stop } from "react-native-svg";

export type Durum = "hazir" | "dinliyor" | "dusunuyor" | "konusuyor";

export const durumRengi: Record<Durum, string> = {
  hazir: "#8fe3f0",
  dinliyor: "#ff7a6b",
  dusunuyor: "#f2b45a",
  konusuyor: "#8fe3f0",
};

const hiz: Record<Durum, number> = { hazir: 1, dinliyor: 2.2, dusunuyor: 3, konusuyor: 2 };

function Halka({ boyut, r, parca, kalinlik, renk, sure, yon }: {
  boyut: number; r: number; parca: number; kalinlik: number; renk: string; sure: number; yon: 1 | -1;
}) {
  const donus = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    donus.setValue(0);
    const anim = Animated.loop(Animated.timing(donus, { toValue: 1, duration: sure, easing: Easing.linear, useNativeDriver: true }));
    anim.start();
    return () => anim.stop();
  }, [sure, donus]);
  const cevre = 2 * Math.PI * r;
  const dolu = (cevre / parca) * 0.6;
  const rotate = donus.interpolate({ inputRange: [0, 1], outputRange: ["0deg", `${360 * yon}deg`] });
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}>
      <Svg width={boyut} height={boyut}>
        <Circle cx={boyut / 2} cy={boyut / 2} r={r} stroke={renk} strokeOpacity={0.7} strokeWidth={kalinlik}
          fill="none" strokeDasharray={`${dolu} ${cevre / parca - dolu}`} />
      </Svg>
    </Animated.View>
  );
}

export function Cekirdek({ durum, boyut }: { durum: Durum; boyut: number }) {
  const renk = durumRengi[durum];
  const R = boyut * 0.36;
  const c = boyut / 2;
  const nabiz = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    const aktif = durum !== "hazir";
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(nabiz, { toValue: 1, duration: aktif ? 450 : 1800, useNativeDriver: true }),
      Animated.timing(nabiz, { toValue: 0, duration: aktif ? 450 : 1800, useNativeDriver: true }),
    ]));
    anim.start();
    return () => anim.stop();
  }, [durum, nabiz]);
  const olcek = nabiz.interpolate({ inputRange: [0, 1], outputRange: [0.9, durum === "hazir" ? 1.0 : 1.15] });
  const k = hiz[durum];

  const cizgiler = Array.from({ length: 60 }, (_, i) => {
    const a = (i / 60) * Math.PI * 2, r1 = R * 1.26, r2 = r1 + (i % 5 ? 4 : 9);
    return <Line key={i} x1={c + Math.cos(a) * r1} y1={c + Math.sin(a) * r1} x2={c + Math.cos(a) * r2} y2={c + Math.sin(a) * r2}
      stroke="#7b8f9c" strokeOpacity={0.4} strokeWidth={1} />;
  });

  return (
    <View style={{ width: boyut, height: boyut }}>
      <Svg width={boyut} height={boyut} style={StyleSheet.absoluteFill}>{cizgiler}</Svg>
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: olcek }] }]}>
        <Svg width={boyut} height={boyut}>
          <Defs>
            <RadialGradient id="parilti" cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={renk} stopOpacity={0.75} />
              <Stop offset="0.45" stopColor={renk} stopOpacity={0.15} />
              <Stop offset="1" stopColor={renk} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={c} cy={c} r={R * 0.7} fill="url(#parilti)" />
        </Svg>
      </Animated.View>
      <Halka boyut={boyut} r={R * 1.14} parca={8} kalinlik={1} renk={renk} sure={24000 / k} yon={-1} />
      <Halka boyut={boyut} r={R} parca={3} kalinlik={1.5} renk={renk} sure={10000 / k} yon={1} />
      <Halka boyut={boyut} r={R * 0.82} parca={5} kalinlik={2.2} renk={renk} sure={7000 / k} yon={-1} />
      <Halka boyut={boyut} r={R * 0.64} parca={2} kalinlik={1.6} renk={renk} sure={5000 / k} yon={1} />
    </View>
  );
}
