import { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView, Modal, type ScrollViewInstance, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput,
  useWindowDimensions, Vibration, View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Speech from "expo-speech";
import * as SecureStore from "expo-secure-store";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { Cekirdek, Durum, durumRengi } from "./src/Cekirdek";
import { hataMetni, Mesaj, sor } from "./src/claude";
import { yerelKomut } from "./src/komutlar";

const R = { bg: "#070b0f", panel: "#0e151c", cizgi: "#1c2a35", buz: "#8fe3f0", kehribar: "#f2b45a", metin: "#dbe6ec", soluk: "#7b8f9c", kirmizi: "#ff7a6b" };
const mono = Platform.select({ ios: "Menlo", default: "monospace" });
const durumAdi: Record<Durum, string> = { hazir: "Hazır", dinliyor: "Dinliyorum", dusunuyor: "Düşünüyorum", konusuyor: "Konuşuyorum" };
const oneriler = ["Saat kaç?", "5 dakikalık zamanlayıcı kur", "Bugün için bir motivasyon cümlesi", "Karadelikleri tek cümlede anlat"];

type Satir = { id: number; kim: "ben" | "nova" | "sistem"; metin: string };
let sayac = 0;
const satir = (kim: Satir["kim"], metin: string): Satir => ({ id: ++sayac, kim, metin });

function Nova() {
  const { width, height } = useWindowDimensions();
  const [durum, setDurum] = useState<Durum>("hazir");
  const [satirlar, setSatirlar] = useState<Satir[]>([
    satir("nova", "Merhaba, ben NOVA. Mikrofona dokunup konuşabilir ya da yazabilirsin. Saat, tarih ve zamanlayıcıyı hemen hallederim, gerisini düşünüp cevaplarım."),
  ]);
  const [girdi, setGirdi] = useState("");
  const [saat, setSaat] = useState("");
  const [ayarAcik, setAyarAcik] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [sesli, setSesli] = useState(true);
  const gecmis = useRef<Mesaj[]>([]);
  const mesgul = useRef(false);
  const kaydirma = useRef<ScrollViewInstance>(null);
  const sonDinlenen = useRef("");

  useEffect(() => {
    SecureStore.getItemAsync("apiKey").then((k) => k && setApiKey(k));
    SecureStore.getItemAsync("sesli").then((v) => v && setSesli(v === "1"));
    const t = setInterval(() => setSaat(new Date().toLocaleTimeString("tr-TR")), 1000);
    return () => clearInterval(t);
  }, []);

  const ekle = (s: Satir) => setSatirlar((x) => [...x, s]);

  const konus = useCallback((metin: string) => {
    if (!sesli) { setDurum("hazir"); return; }
    Speech.stop();
    Speech.speak(metin, {
      language: "tr-TR", rate: 1.0, pitch: 0.95,
      onStart: () => setDurum("konusuyor"),
      onDone: () => setDurum("hazir"),
      onStopped: () => setDurum("hazir"),
      onError: () => setDurum("hazir"),
    });
  }, [sesli]);

  const isle = useCallback(async (ham: string) => {
    const metin = ham.trim();
    if (!metin || mesgul.current) return;
    Speech.stop();
    setGirdi("");
    ekle(satir("ben", metin));

    const yerel = yerelKomut(metin);
    if (yerel) {
      ekle(satir("nova", yerel.metin));
      konus(yerel.metin);
      if (yerel.zamanlayici) {
        const { saniye, etiket } = yerel.zamanlayici;
        setTimeout(() => {
          Vibration.vibrate([0, 400, 200, 400, 200, 400]);
          const m = `${etiket} doldu.`;
          ekle(satir("nova", m));
          konus(m);
        }, saniye * 1000);
      }
      return;
    }

    mesgul.current = true;
    setDurum("dusunuyor");
    gecmis.current = [...gecmis.current, { role: "user" as const, content: metin }].slice(-12);
    while (gecmis.current.length && gecmis.current[0].role !== "user") gecmis.current.shift();
    try {
      const cevap = await sor(apiKey, gecmis.current);
      gecmis.current.push({ role: "assistant", content: cevap });
      ekle(satir("nova", cevap));
      konus(cevap);
    } catch (e) {
      gecmis.current.pop();
      ekle(satir("nova", hataMetni(e)));
      setDurum("hazir");
    } finally {
      mesgul.current = false;
    }
  }, [apiKey, konus]);

  // ---- Ses tanıma ----
  useSpeechRecognitionEvent("start", () => { sonDinlenen.current = ""; setDurum("dinliyor"); });
  useSpeechRecognitionEvent("result", (e) => {
    const t = e.results[0]?.transcript ?? "";
    setGirdi(t);
    if (e.isFinal) sonDinlenen.current = t;
  });
  useSpeechRecognitionEvent("end", () => {
    setDurum((d) => (d === "dinliyor" ? "hazir" : d));
    if (sonDinlenen.current) isle(sonDinlenen.current);
  });
  useSpeechRecognitionEvent("error", (e) => {
    if (e.error === "no-speech" || e.error === "aborted") return;
    ekle(satir("sistem", e.error === "not-allowed" ? "Mikrofon izni verilmedi. Telefon ayarlarından açabilirsin." : `Ses tanıma hatası: ${e.message}`));
  });

  const mikrofon = async () => {
    if (durum === "dinliyor") { ExpoSpeechRecognitionModule.stop(); return; }
    Speech.stop();
    const izin = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!izin.granted) { ekle(satir("sistem", "Mikrofon izni verilmedi. Telefon ayarlarından açabilirsin.")); return; }
    ExpoSpeechRecognitionModule.start({ lang: "tr-TR", interimResults: true, continuous: false });
  };

  const ayarKaydet = async () => {
    await SecureStore.setItemAsync("apiKey", apiKey.trim());
    await SecureStore.setItemAsync("sesli", sesli ? "1" : "0");
    setAyarAcik(false);
  };

  const cekirdekBoyu = Math.min(width - 32, height * 0.34, 300);
  const renk = durumRengi[durum];

  return (
    <SafeAreaView style={s.ekran} edges={["top", "bottom", "left", "right"]}>
      <StatusBar style="light" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={s.ust}>
          <Text style={s.marka}>NOVA</Text>
          <View style={s.durum}>
            <View style={[s.nokta, { backgroundColor: renk }]} />
            <Text style={s.durumYazi}>{durumAdi[durum].toLocaleUpperCase("tr")}</Text>
          </View>
          <Pressable style={s.ikon} onPress={() => setAyarAcik(true)} accessibilityLabel="Ayarlar">
            <Text style={{ color: R.soluk, fontSize: 18 }}>⚙</Text>
          </Pressable>
        </View>

        <View style={s.merkez}>
          <Cekirdek durum={durum} boyut={cekirdekBoyu} />
          <Text style={s.okuma}>{saat} · SİSTEM ÇEVRİMİÇİ</Text>
        </View>

        <ScrollView ref={kaydirma} style={{ flex: 1 }} contentContainerStyle={s.akis}
          onContentSizeChange={() => kaydirma.current?.scrollToEnd({ animated: true })}>
          {satirlar.map((m) =>
            m.kim === "sistem" ? (
              <Text key={m.id} style={s.sistem}>{m.metin}</Text>
            ) : (
              <View key={m.id} style={m.kim === "nova" ? s.nova : s.ben}>
                <Text style={[s.kim, { color: m.kim === "nova" ? R.buz : R.kehribar }]}>{m.kim === "nova" ? "NOVA" : "SEN"}</Text>
                <Text style={[s.metin, m.kim === "ben" && { textAlign: "right" }]}>{m.metin}</Text>
              </View>
            ),
          )}
          {durum === "dusunuyor" && <Text style={s.sistem}>…</Text>}
          {satirlar.length === 1 && (
            <View style={s.cipler}>
              {oneriler.map((o) => (
                <Pressable key={o} style={s.cip} onPress={() => isle(o)}><Text style={s.cipYazi}>{o}</Text></Pressable>
              ))}
            </View>
          )}
        </ScrollView>

        <View style={s.cubuk}>
          <Pressable onPress={mikrofon} accessibilityLabel="Konuş"
            style={[s.mik, durum === "dinliyor" && { backgroundColor: R.kirmizi, borderColor: R.kirmizi }]}>
            <Text style={{ fontSize: 20, color: durum === "dinliyor" ? R.bg : R.buz }}>🎙</Text>
          </Pressable>
          <TextInput style={s.girdi} value={girdi} onChangeText={setGirdi} placeholder="NOVA'ya bir şey sor…"
            placeholderTextColor={R.soluk} returnKeyType="send" onSubmitEditing={() => isle(girdi)} />
          <Pressable style={s.gonder} onPress={() => isle(girdi)} accessibilityLabel="Gönder">
            <Text style={{ fontSize: 20, color: R.bg, fontWeight: "700" }}>→</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <Modal visible={ayarAcik} transparent animationType="fade" onRequestClose={() => setAyarAcik(false)}>
        <View style={s.perde}>
          <View style={s.pencere}>
            <Text style={s.baslik}>AYARLAR</Text>
            <View style={s.satirAyar}>
              <Text style={s.metin}>Cevapları sesli oku</Text>
              <Switch value={sesli} onValueChange={setSesli} trackColor={{ true: R.buz, false: R.cizgi }} />
            </View>
            <Text style={s.etiket}>Anthropic API anahtarı</Text>
            <TextInput style={s.anahtar} value={apiKey} onChangeText={setApiKey} placeholder="sk-ant-…"
              placeholderTextColor={R.soluk} secureTextEntry autoCapitalize="none" autoCorrect={false} />
            <Text style={s.not}>Anahtar yalnızca bu telefonda, şifreli depoda saklanır. console.anthropic.com adresinden alabilirsin.</Text>
            <View style={s.butonlar}>
              <Pressable style={s.ikincil} onPress={() => { gecmis.current = []; setSatirlar([satir("sistem", "Sohbet temizlendi.")]); setAyarAcik(false); }}>
                <Text style={s.metin}>Sohbeti temizle</Text>
              </Pressable>
              <Pressable style={s.birincil} onPress={ayarKaydet}><Text style={{ color: R.bg, fontWeight: "600" }}>Kaydet</Text></Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

export default function App() {
  return <SafeAreaProvider><Nova /></SafeAreaProvider>;
}

const s = StyleSheet.create({
  ekran: { flex: 1, backgroundColor: R.bg, paddingHorizontal: 16 },
  ust: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 8 },
  marka: { color: R.buz, fontSize: 18, fontWeight: "700", letterSpacing: 6 },
  durum: { flexDirection: "row", alignItems: "center", gap: 8 },
  nokta: { width: 7, height: 7, borderRadius: 4 },
  durumYazi: { color: R.soluk, fontFamily: mono, fontSize: 11, letterSpacing: 1.5 },
  ikon: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: R.cizgi, alignItems: "center", justifyContent: "center" },
  merkez: { alignItems: "center", paddingVertical: 6 },
  okuma: { color: R.soluk, fontFamily: mono, fontSize: 11, letterSpacing: 1.2, marginTop: 2 },
  akis: { gap: 12, paddingVertical: 8 },
  nova: { borderLeftWidth: 2, borderLeftColor: R.buz, paddingLeft: 10, maxWidth: "88%" },
  ben: { alignSelf: "flex-end", maxWidth: "88%", alignItems: "flex-end" },
  kim: { fontFamily: mono, fontSize: 10, letterSpacing: 1.6, marginBottom: 3 },
  metin: { color: R.metin, fontSize: 15, lineHeight: 22 },
  sistem: { color: R.soluk, fontFamily: mono, fontSize: 12, textAlign: "center", alignSelf: "center" },
  cipler: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  cip: { backgroundColor: R.panel, borderWidth: 1, borderColor: R.cizgi, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 11 },
  cipYazi: { color: R.metin, fontSize: 12 },
  cubuk: { flexDirection: "row", gap: 8, alignItems: "center", paddingVertical: 10 },
  mik: { width: 46, height: 46, borderRadius: 12, borderWidth: 1, borderColor: R.cizgi, backgroundColor: R.panel, alignItems: "center", justifyContent: "center" },
  girdi: { flex: 1, height: 46, backgroundColor: R.panel, borderWidth: 1, borderColor: R.cizgi, borderRadius: 12, color: R.metin, paddingHorizontal: 14, fontSize: 15 },
  gonder: { width: 46, height: 46, borderRadius: 12, backgroundColor: R.buz, alignItems: "center", justifyContent: "center" },
  perde: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 16 },
  pencere: { backgroundColor: R.panel, borderRadius: 14, borderWidth: 1, borderColor: R.cizgi, padding: 18, gap: 10 },
  baslik: { color: R.buz, fontSize: 16, fontWeight: "600", letterSpacing: 2 },
  satirAyar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  etiket: { color: R.soluk, fontSize: 13 },
  anahtar: { height: 42, backgroundColor: R.bg, borderWidth: 1, borderColor: R.cizgi, borderRadius: 8, color: R.metin, paddingHorizontal: 10, fontFamily: mono },
  not: { color: R.soluk, fontSize: 12, lineHeight: 18 },
  butonlar: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 4 },
  ikincil: { height: 40, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: R.cizgi, justifyContent: "center" },
  birincil: { height: 40, paddingHorizontal: 18, borderRadius: 8, backgroundColor: R.buz, justifyContent: "center" },
});
