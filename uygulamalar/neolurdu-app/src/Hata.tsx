// Uygulama kapanmak yerine hatayı göstersin: çizim hataları (ErrorBoundary) ve diğer JS hataları (global işleyici).
import { Component, type ReactNode } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ANAHTAR = "neolurdu.sonHata";
type Dinleyici = (m: string) => void;
let dinleyici: Dinleyici | null = null;
let bekleyen: string | null = null;

const metin = (e: unknown) => (e instanceof Error ? `${e.name}: ${e.message}\n${e.stack ?? ""}` : String(e)).slice(0, 4000);

export function hataKaydet(e: unknown) {
  const m = metin(e);
  AsyncStorage.setItem(ANAHTAR, `${new Date().toISOString()}\n${m}`).catch(() => {});
  if (dinleyici) dinleyici(m); else bekleyen = m;
}

// Yakalanmamış JS hataları uygulamayı kapatmasın
type EU = { setGlobalHandler: (h: (e: unknown, fatal?: boolean) => void) => void };
const eu = (globalThis as unknown as { ErrorUtils?: EU }).ErrorUtils;
eu?.setGlobalHandler((e) => hataKaydet(e));

export const sonHatayiOku = () => AsyncStorage.getItem(ANAHTAR).catch(() => null);
export const sonHatayiSil = () => AsyncStorage.removeItem(ANAHTAR).catch(() => {});

export class HataSiniri extends Component<{ children: ReactNode }, { hata: string | null }> {
  state = { hata: bekleyen as string | null };
  componentDidMount() { dinleyici = (m) => this.setState({ hata: m }); }
  componentWillUnmount() { dinleyici = null; }
  static getDerivedStateFromError(e: unknown) { return { hata: metin(e) }; }
  componentDidCatch(e: unknown) { hataKaydet(e); }
  render() {
    if (!this.state.hata) return this.props.children;
    return (
      <View style={s.ekran}>
        <Text style={s.baslik}>Bir hata oluştu</Text>
        <Text style={s.not}>Bu ekranın görüntüsünü geliştiriciye gönderirsen sorunu hızla düzeltebilir.</Text>
        <ScrollView style={s.kutu}><Text selectable style={s.kod}>{this.state.hata}</Text></ScrollView>
        <Pressable style={s.dugme} onPress={() => this.setState({ hata: null })}><Text style={s.dugmeYazi}>Devam et</Text></Pressable>
      </View>
    );
  }
}

const s = StyleSheet.create({
  ekran: { flex: 1, backgroundColor: "#111c3d", padding: 24, paddingTop: 64, gap: 12 },
  baslik: { fontSize: 24, fontWeight: "700", color: "#fff6e2" },
  not: { fontSize: 15, color: "#9aa6c4", lineHeight: 21 },
  kutu: { flex: 1, backgroundColor: "#0b1430", borderRadius: 12, padding: 12 },
  kod: { fontFamily: "monospace", fontSize: 12, color: "#ffcf4a" },
  dugme: { backgroundColor: "#ffcf4a", borderRadius: 12, height: 48, alignItems: "center", justifyContent: "center" },
  dugmeYazi: { fontSize: 17, fontWeight: "700", color: "#1f2a3a" },
});
