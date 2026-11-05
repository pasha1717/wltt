// Sonucu görsel olarak paylaşma: ekranda görünmeyen bir kartı PNG'ye çevirip paylaşım menüsünü açar.
import { type ComponentRef, useRef } from "react";
import { Image, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";

const R = { gece: "#111c3d", derin: "#0b1430", sari: "#ffcf4a", krem: "#fff6e2", soluk: "#9aa6c4", cizgi: "#24325c", gezegen: "#3f7fe0" };

type Props = {
  sonuclar: boolean[];
  baslik: string; // "Günün soruları" ya da "Serbest oyun"
  seri?: number;
  metin: string; // görsel paylaşılamazsa gönderilecek yazı
  dugmeStili: object;
  yaziStili: object;
  etiket?: string;
};

export function PaylasDugmesi({ sonuclar, baslik, seri, metin, dugmeStili, yaziStili, etiket = "Sonucu paylaş" }: Props) {
  const kart = useRef<ComponentRef<typeof View>>(null);
  const dogru = sonuclar.filter(Boolean).length;
  const tarih = new Date().toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });

  const paylas = async () => {
    try {
      if (!kart.current || !(await Sharing.isAvailableAsync())) throw new Error("yok");
      const uri = await captureRef(kart, { format: "png", quality: 1, width: 1080, height: 1350, result: "tmpfile" });
      await Sharing.shareAsync(uri, { mimeType: "image/png", dialogTitle: "Sonucunu paylaş" });
    } catch {
      await Share.share({ message: metin });
    }
  };

  return (
    <>
      <Pressable style={dugmeStili} onPress={paylas}><Text style={yaziStili}>{etiket}</Text></Pressable>
      {/* Paylaşılan görsel. Ekran dışında çizilir, kullanıcı görmez. */}
      <View style={s.gizli} pointerEvents="none">
        <View ref={kart} collapsable={false} style={s.kart}>
          <View style={s.ust}>
            <Image source={require("../assets/logo.png")} style={s.logo} />
            <View>
              <Text style={s.marka}>Ne Olurdu?</Text>
              <Text style={s.tarih}>{tarih}</Text>
            </View>
          </View>
          <Text style={s.baslik}>{baslik.toLocaleUpperCase("tr")}</Text>
          <Text style={s.skor}>{dogru}<Text style={s.skorAlt}>/{sonuclar.length}</Text></Text>
          <View style={s.kareler}>
            {sonuclar.map((d, i) => <View key={i} style={[s.kare, { backgroundColor: d ? R.sari : R.cizgi }]} />)}
          </View>
          {seri !== undefined && seri > 0 && <Text style={s.seri}>{seri} günlük seri</Text>}
          <View style={s.alt}>
            <Text style={s.davet}>Sen kaç bilirsin?</Text>
            <Text style={s.magaza}>{"Google Play'de \"Ne Olurdu?\""}</Text>
          </View>
        </View>
      </View>
    </>
  );
}

const s = StyleSheet.create({
  gizli: { position: "absolute", left: -2000, top: 0, opacity: 1 },
  kart: { width: 360, height: 450, backgroundColor: R.gece, padding: 28, justifyContent: "space-between" },
  ust: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: { width: 52, height: 52, borderRadius: 12 },
  marka: { fontFamily: "Caladea_700Bold", fontSize: 26, color: R.krem },
  tarih: { fontFamily: "Caladea_400Regular", fontSize: 14, color: R.soluk },
  baslik: { fontSize: 12, fontWeight: "700", letterSpacing: 2, color: R.sari, marginTop: 12 },
  skor: { fontFamily: "Caladea_700Bold", fontSize: 96, color: R.krem, lineHeight: 104 },
  skorAlt: { fontSize: 44, color: R.soluk },
  kareler: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  kare: { width: 38, height: 38, borderRadius: 8 },
  seri: { fontFamily: "Caladea_700Bold", fontSize: 18, color: R.sari },
  alt: { borderTopWidth: 1, borderTopColor: R.cizgi, paddingTop: 14, gap: 2 },
  davet: { fontFamily: "Caladea_700Bold", fontSize: 20, color: R.krem },
  magaza: { fontSize: 13, color: R.soluk },
});
