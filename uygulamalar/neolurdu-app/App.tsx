import { useEffect, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Share, StyleSheet, Switch, Text, Vibration, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, Caladea_400Regular, Caladea_700Bold } from "@expo-google-fonts/caladea";
import { Kategori, KATEGORILER, SORULAR } from "./src/sorular";
import {
  bugun, guncelSeri, gununSorulari, Ilerleme, ilerlemeOku, ilerlemeYaz, OyunSorusu, paylasimMetni,
  serbestSorular, sonucuKaydet,
} from "./src/oyun";
import { hatirlatmaAc, hatirlatmaKapat } from "./src/hatirlatma";

SplashScreen.preventAutoHideAsync().catch(() => {});

// Videolardaki marka renkleri: gece laciverti, gezegen mavisi, soru işareti sarısı, krem kart.
const R = {
  gece: "#111c3d", derin: "#0b1430", gezegen: "#3f7fe0", sari: "#ffcf4a", krem: "#fff6e2",
  murekkep: "#1f2a3a", soluk: "#9aa6c4", cizgi: "#24325c", dogru: "#5cc98a", yanlis: "#ff7a6b",
};
const F = { baslik: "Caladea_700Bold", metin: "Caladea_400Regular" };

type Ekran =
  | { ad: "ana" }
  | { ad: "oyun"; sorular: OyunSorusu[]; gunluk: boolean }
  | { ad: "sonuc"; sorular: OyunSorusu[]; sonuclar: boolean[]; gunluk: boolean }
  | { ad: "koleksiyon" };

export default function App() {
  const [fontlar] = useFonts({ Caladea_400Regular, Caladea_700Bold });
  const [ilerleme, setIlerleme] = useState<Ilerleme | null>(null);
  const [ekran, setEkran] = useState<Ekran>({ ad: "ana" });

  useEffect(() => { ilerlemeOku().then(setIlerleme); }, []);
  useEffect(() => { if (fontlar && ilerleme) SplashScreen.hideAsync().catch(() => {}); }, [fontlar, ilerleme]);

  if (!fontlar || !ilerleme) return null;

  const bitir = (sorular: OyunSorusu[], sonuclar: boolean[], gunluk: boolean) => {
    const yeni = sonucuKaydet(ilerleme, sorular, sonuclar, gunluk);
    setIlerleme(yeni);
    ilerlemeYaz(yeni);
    setEkran({ ad: "sonuc", sorular, sonuclar, gunluk });
  };

  const hatirlatmaDegis = async (acik: boolean) => {
    const ok = acik ? await hatirlatmaAc() : (await hatirlatmaKapat(), true);
    const yeni = { ...ilerleme, hatirlatma: acik && ok };
    setIlerleme(yeni);
    ilerlemeYaz(yeni);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={s.ekran} edges={["top", "bottom", "left", "right"]}>
        <StatusBar style="light" />
        {ekran.ad === "ana" && (
          <Ana ilerleme={ilerleme} git={setEkran} hatirlatmaDegis={hatirlatmaDegis} />
        )}
        {ekran.ad === "oyun" && (
          <Oyun sorular={ekran.sorular} gunluk={ekran.gunluk} bitir={bitir} cik={() => setEkran({ ad: "ana" })} />
        )}
        {ekran.ad === "sonuc" && (
          <Sonuc {...ekran} seri={guncelSeri(ilerleme)} anaya={() => setEkran({ ad: "ana" })} />
        )}
        {ekran.ad === "koleksiyon" && (
          <Koleksiyon bilinenler={ilerleme.bilinenler} geri={() => setEkran({ ad: "ana" })} />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// ---------------- Ana ekran ----------------
function Ana({ ilerleme, git, hatirlatmaDegis }: {
  ilerleme: Ilerleme; git: (e: Ekran) => void; hatirlatmaDegis: (a: boolean) => void;
}) {
  const [kategori, setKategori] = useState<Kategori | null>(null);
  const bugunku = ilerleme.gunluk[bugun()];
  const seri = guncelSeri(ilerleme);

  return (
    <ScrollView contentContainerStyle={s.ana}>
      <View style={s.ust}>
        <Image source={require("./assets/logo.png")} style={s.logo} />
        <View style={{ flex: 1 }}>
          <Text style={s.marka}>Ne Olurdu?</Text>
          <Text style={s.altBaslik}>Videolardaki bilgilerle bilim oyunu</Text>
        </View>
      </View>

      <View style={s.istatistikler}>
        <Istatistik deger={`${seri}`} etiket="günlük seri" />
        <Istatistik deger={`${ilerleme.bilinenler.length}/${SORULAR.length}`} etiket="koleksiyon" />
        <Istatistik deger={`${ilerleme.enIyiSeri}`} etiket="en iyi seri" />
      </View>

      <View style={s.kart}>
        <Text style={s.kartEtiket}>GÜNÜN SORULARI</Text>
        {bugunku ? (
          <>
            <Text style={s.kartBaslik}>Bugünkü skorun {bugunku.filter(Boolean).length}/{bugunku.length}</Text>
            <Text style={s.kareler}>{bugunku.map((d) => (d ? "🟨" : "⬛")).join(" ")}</Text>
            <Text style={s.kartNot}>Yarın yeni 5 soru gelecek.</Text>
            <Pressable style={s.ikincilButon} onPress={() => Share.share({ message: paylasimMetni(bugunku, seri) })}>
              <Text style={s.ikincilYazi}>Sonucu paylaş</Text>
            </Pressable>
          </>
        ) : (
          <>
            <Text style={s.kartBaslik}>5 soru, herkese aynı</Text>
            <Text style={s.kartNot}>Her gün bir kez oyna, serini büyüt, sonucunu arkadaşlarınla karşılaştır.</Text>
            <Pressable style={s.anaButon} onPress={() => git({ ad: "oyun", sorular: gununSorulari(), gunluk: true })}>
              <Text style={s.anaButonYazi}>Başla</Text>
            </Pressable>
          </>
        )}
      </View>

      <View style={s.bolum}>
        <Text style={s.bolumBaslik}>Serbest oyun</Text>
        <Text style={s.bolumNot}>10 soru. Önce henüz bilmediklerin gelir.</Text>
        <View style={s.cipler}>
          {[null, ...KATEGORILER].map((k) => (
            <Pressable key={k ?? "hepsi"} onPress={() => setKategori(k)} style={[s.cip, kategori === k && s.cipSecili]}>
              <Text style={[s.cipYazi, kategori === k && { color: R.murekkep }]}>{k ?? "Hepsi"}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={s.ikincilButon}
          onPress={() => git({ ad: "oyun", sorular: serbestSorular(kategori, ilerleme.bilinenler), gunluk: false })}>
          <Text style={s.ikincilYazi}>{kategori ?? "Karışık"} sorularla oyna</Text>
        </Pressable>
      </View>

      <Pressable style={s.bolum} onPress={() => git({ ad: "koleksiyon" })}>
        <Text style={s.bolumBaslik}>Koleksiyon →</Text>
        <Text style={s.bolumNot}>Doğru bildiğin her soru buraya eklenir. {SORULAR.length - ilerleme.bilinenler.length} soru seni bekliyor.</Text>
        <View style={s.cubukDis}>
          <View style={[s.cubukIc, { width: `${(ilerleme.bilinenler.length / SORULAR.length) * 100}%` }]} />
        </View>
      </Pressable>

      <View style={[s.bolum, s.satir]}>
        <View style={{ flex: 1 }}>
          <Text style={s.bolumBaslik}>Akşam hatırlat</Text>
          <Text style={s.bolumNot}>Her gün 20.00'de günün soruları için bildirim.</Text>
        </View>
        <Switch value={ilerleme.hatirlatma} onValueChange={hatirlatmaDegis}
          trackColor={{ true: R.sari, false: R.cizgi }} thumbColor={R.krem} />
      </View>
    </ScrollView>
  );
}

const Istatistik = ({ deger, etiket }: { deger: string; etiket: string }) => (
  <View style={s.istatistik}>
    <Text style={s.istDeger}>{deger}</Text>
    <Text style={s.istEtiket}>{etiket}</Text>
  </View>
);

// ---------------- Oyun ekranı ----------------
function Oyun({ sorular, gunluk, bitir, cik }: {
  sorular: OyunSorusu[]; gunluk: boolean; bitir: (s: OyunSorusu[], r: boolean[], g: boolean) => void; cik: () => void;
}) {
  const [sira, setSira] = useState(0);
  const [secim, setSecim] = useState<string | null>(null);
  const [sonuclar, setSonuclar] = useState<boolean[]>([]);
  const soru = sorular[sira];

  const sec = (cevap: string) => {
    if (secim) return;
    setSecim(cevap);
    const dogru = cevap === soru.d;
    if (!dogru) Vibration.vibrate(120);
    setSonuclar((r) => [...r, dogru]);
  };

  const devam = () => {
    if (sira + 1 >= sorular.length) { bitir(sorular, sonuclar, gunluk); return; }
    setSira(sira + 1);
    setSecim(null);
  };

  return (
    <ScrollView contentContainerStyle={s.oyun}>
      <View style={s.oyunUst}>
        <Pressable onPress={cik} hitSlop={10}><Text style={s.kapat}>✕</Text></Pressable>
        <View style={s.ilerleme}>
          {sorular.map((_, i) => (
            <View key={i} style={[s.ilerlemeParca,
              i < sonuclar.length && { backgroundColor: sonuclar[i] ? R.sari : R.soluk },
              i === sira && i >= sonuclar.length && { backgroundColor: R.krem }]} />
          ))}
        </View>
        <Text style={s.sayac}>{sira + 1}/{sorular.length}</Text>
      </View>

      <Text style={s.kategori}>{soru.k.toLocaleUpperCase("tr")}</Text>
      <View style={s.soruKart}>
        <Text style={s.soruMetni}>{soru.s}</Text>
      </View>

      <View style={{ gap: 10 }}>
        {soru.secenekler.map((c) => {
          const dogruMu = c === soru.d;
          const secilen = c === secim;
          const stil = secim ? (dogruMu ? s.secenekDogru : secilen ? s.secenekYanlis : s.secenekSoluk) : null;
          return (
            <Pressable key={c} onPress={() => sec(c)} style={[s.secenek, stil]} disabled={!!secim}>
              <Text style={[s.secenekYazi, secim && dogruMu && { color: R.murekkep }]}>{c}</Text>
              {secim && dogruMu && <Text style={s.isaret}>✓</Text>}
              {secilen && !dogruMu && <Text style={[s.isaret, { color: R.krem }]}>✕</Text>}
            </Pressable>
          );
        })}
      </View>

      {secim && (
        <View style={s.aciklama}>
          <Text style={[s.aciklamaBaslik, { color: secim === soru.d ? R.dogru : R.yanlis }]}>
            {secim === soru.d ? "Doğru!" : "Yanlış"}
          </Text>
          <Text style={s.aciklamaMetni}>{soru.a}</Text>
          <Pressable style={s.anaButon} onPress={devam}>
            <Text style={s.anaButonYazi}>{sira + 1 >= sorular.length ? "Sonucu gör" : "Devam"}</Text>
          </Pressable>
        </View>
      )}
    </ScrollView>
  );
}

// ---------------- Sonuç ekranı ----------------
function Sonuc({ sorular, sonuclar, gunluk, seri, anaya }: {
  sorular: OyunSorusu[]; sonuclar: boolean[]; gunluk: boolean; seri: number; anaya: () => void;
}) {
  const dogru = sonuclar.filter(Boolean).length;
  const oran = dogru / sonuclar.length;
  const yorum = oran === 1 ? "Kusursuz! Bütün videoları izlemişsin." : oran >= 0.6 ? "Gayet iyi. Biraz daha merak, biraz daha soru." : "Sorun yok, her yanlış yeni bir bilgi demek.";
  return (
    <ScrollView contentContainerStyle={s.sonuc}>
      <Text style={s.kartEtiket}>{gunluk ? "GÜNÜN SORULARI" : "SERBEST OYUN"}</Text>
      <Text style={s.skor}>{dogru}/{sonuclar.length}</Text>
      <Text style={s.kareler}>{sonuclar.map((d) => (d ? "🟨" : "⬛")).join(" ")}</Text>
      <Text style={s.yorum}>{yorum}</Text>
      {gunluk && <Text style={s.seriYazi}>Seri: {seri} gün</Text>}

      <View style={{ gap: 8, alignSelf: "stretch" }}>
        {sorular.map((q, i) => (
          <View key={q.id} style={s.ozetSatir}>
            <Text style={[s.ozetIsaret, { color: sonuclar[i] ? R.sari : R.soluk }]}>{sonuclar[i] ? "✓" : "✕"}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.ozetSoru}>{q.s}</Text>
              <Text style={s.ozetCevap}>{q.d}</Text>
            </View>
          </View>
        ))}
      </View>

      {gunluk && (
        <Pressable style={s.anaButon} onPress={() => Share.share({ message: paylasimMetni(sonuclar, seri) })}>
          <Text style={s.anaButonYazi}>Sonucu paylaş</Text>
        </Pressable>
      )}
      <Pressable style={s.ikincilButon} onPress={anaya}><Text style={s.ikincilYazi}>Ana sayfa</Text></Pressable>
    </ScrollView>
  );
}

// ---------------- Koleksiyon ----------------
function Koleksiyon({ bilinenler, geri }: { bilinenler: string[]; geri: () => void }) {
  const gruplar = useMemo(() => KATEGORILER.map((k) => ({ k, sorular: SORULAR.filter((q) => q.k === k) })), []);
  return (
    <ScrollView contentContainerStyle={s.koleksiyon}>
      <View style={s.oyunUst}>
        <Pressable onPress={geri} hitSlop={10}><Text style={s.kapat}>←</Text></Pressable>
        <Text style={[s.bolumBaslik, { flex: 1 }]}>Koleksiyon</Text>
        <Text style={s.sayac}>{bilinenler.length}/{SORULAR.length}</Text>
      </View>
      {gruplar.map(({ k, sorular }) => (
        <View key={k} style={{ gap: 8 }}>
          <Text style={s.kategori}>
            {k.toLocaleUpperCase("tr")} · {sorular.filter((q) => bilinenler.includes(q.id)).length}/{sorular.length}
          </Text>
          {sorular.map((q) => {
            const acik = bilinenler.includes(q.id);
            return (
              <View key={q.id} style={[s.kolSatir, !acik && { opacity: 0.55 }]}>
                <Text style={s.ozetSoru}>{q.s}</Text>
                <Text style={acik ? s.ozetCevap : s.kilitli}>{acik ? q.d : "Henüz doğru bilinmedi"}</Text>
              </View>
            );
          })}
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  ekran: { flex: 1, backgroundColor: R.gece },
  ana: { padding: 16, gap: 16 },
  ust: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 8 },
  logo: { width: 56, height: 56, borderRadius: 14 },
  marka: { fontFamily: F.baslik, fontSize: 30, color: R.krem },
  altBaslik: { fontFamily: F.metin, fontSize: 14, color: R.soluk },
  istatistikler: { flexDirection: "row", gap: 10 },
  istatistik: { flex: 1, backgroundColor: R.derin, borderRadius: 14, paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: R.cizgi },
  istDeger: { fontFamily: F.baslik, fontSize: 24, color: R.sari, fontVariant: ["tabular-nums"] },
  istEtiket: { fontSize: 11, color: R.soluk, letterSpacing: 0.5 },
  kart: { backgroundColor: R.krem, borderRadius: 22, padding: 20, gap: 10 },
  kartEtiket: { fontSize: 11, fontWeight: "700", letterSpacing: 1.6, color: R.gezegen },
  kartBaslik: { fontFamily: F.baslik, fontSize: 24, color: R.murekkep },
  kartNot: { fontFamily: F.metin, fontSize: 15, color: "#4a5568", lineHeight: 21 },
  kareler: { fontSize: 22, letterSpacing: 2 },
  anaButon: { backgroundColor: R.sari, borderRadius: 14, height: 52, alignItems: "center", justifyContent: "center", alignSelf: "stretch", marginTop: 4 },
  anaButonYazi: { fontFamily: F.baslik, fontSize: 19, color: R.murekkep },
  ikincilButon: { borderWidth: 1.5, borderColor: R.gezegen, borderRadius: 14, height: 48, alignItems: "center", justifyContent: "center", alignSelf: "stretch", marginTop: 4 },
  ikincilYazi: { fontFamily: F.baslik, fontSize: 16, color: R.gezegen },
  bolum: { backgroundColor: R.derin, borderRadius: 18, padding: 16, gap: 8, borderWidth: 1, borderColor: R.cizgi },
  bolumBaslik: { fontFamily: F.baslik, fontSize: 20, color: R.krem },
  bolumNot: { fontFamily: F.metin, fontSize: 14, color: R.soluk, lineHeight: 20 },
  satir: { flexDirection: "row", alignItems: "center", gap: 12 },
  cipler: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cip: { borderWidth: 1, borderColor: R.cizgi, borderRadius: 999, paddingVertical: 7, paddingHorizontal: 13 },
  cipSecili: { backgroundColor: R.sari, borderColor: R.sari },
  cipYazi: { fontSize: 14, color: R.krem },
  cubukDis: { height: 8, borderRadius: 4, backgroundColor: R.cizgi, overflow: "hidden" },
  cubukIc: { height: 8, backgroundColor: R.sari },
  oyun: { padding: 16, gap: 16, flexGrow: 1 },
  oyunUst: { flexDirection: "row", alignItems: "center", gap: 12 },
  kapat: { color: R.soluk, fontSize: 22, width: 24 },
  ilerleme: { flex: 1, flexDirection: "row", gap: 4 },
  ilerlemeParca: { flex: 1, height: 6, borderRadius: 3, backgroundColor: R.cizgi },
  sayac: { color: R.soluk, fontSize: 13, fontVariant: ["tabular-nums"] },
  kategori: { fontSize: 12, fontWeight: "700", letterSpacing: 1.6, color: R.sari, marginTop: 6 },
  soruKart: { backgroundColor: R.krem, borderRadius: 22, padding: 22 },
  soruMetni: { fontFamily: F.baslik, fontSize: 25, lineHeight: 32, color: R.murekkep },
  secenek: { flexDirection: "row", alignItems: "center", borderWidth: 1.5, borderColor: R.cizgi, backgroundColor: R.derin, borderRadius: 16, paddingVertical: 15, paddingHorizontal: 16, gap: 10 },
  secenekDogru: { backgroundColor: R.dogru, borderColor: R.dogru },
  secenekYanlis: { backgroundColor: R.yanlis, borderColor: R.yanlis },
  secenekSoluk: { opacity: 0.45 },
  secenekYazi: { flex: 1, fontFamily: F.metin, fontSize: 18, color: R.krem },
  isaret: { fontSize: 18, fontWeight: "700", color: R.murekkep },
  aciklama: { backgroundColor: R.derin, borderRadius: 18, padding: 16, gap: 8, borderWidth: 1, borderColor: R.cizgi },
  aciklamaBaslik: { fontFamily: F.baslik, fontSize: 20 },
  aciklamaMetni: { fontFamily: F.metin, fontSize: 16, lineHeight: 23, color: R.krem },
  sonuc: { padding: 20, gap: 14, alignItems: "center" },
  skor: { fontFamily: F.baslik, fontSize: 72, color: R.sari, lineHeight: 80 },
  yorum: { fontFamily: F.metin, fontSize: 18, color: R.krem, textAlign: "center" },
  seriYazi: { fontSize: 14, color: R.soluk, letterSpacing: 0.5 },
  ozetSatir: { flexDirection: "row", gap: 10, backgroundColor: R.derin, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: R.cizgi },
  ozetIsaret: { fontSize: 18, fontWeight: "700", width: 18 },
  ozetSoru: { fontFamily: F.metin, fontSize: 15, color: R.krem, lineHeight: 21 },
  ozetCevap: { fontFamily: F.baslik, fontSize: 15, color: R.sari, marginTop: 2 },
  koleksiyon: { padding: 16, gap: 12 },
  kolSatir: { backgroundColor: R.derin, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: R.cizgi },
  kilitli: { fontSize: 13, color: R.soluk, marginTop: 2, fontStyle: "italic" },
});
