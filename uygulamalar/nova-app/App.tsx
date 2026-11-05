import { useCallback, useEffect, useRef, useState } from "react";
import {
  KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, type ScrollViewInstance, StyleSheet, Switch, Text,
  TextInput, useWindowDimensions, Vibration, View,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as Speech from "expo-speech";
import * as SecureStore from "expo-secure-store";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { CameraView, useCameraPermissions } from "expo-camera";
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from "expo-speech-recognition";
import { Cekirdek, Durum, durumRengi } from "./src/Cekirdek";
import { hataMetni, sistemMetni, sor, SohbetDurumu } from "./src/claude";
import { yerelKomut } from "./src/komutlar";
import { bildirimGelince, zamanlayiciKur } from "./src/bildirim";
import { hafiza, Satir } from "./src/hafiza";

const R = { bg: "#070b0f", panel: "#0e151c", cizgi: "#1c2a35", buz: "#8fe3f0", kehribar: "#f2b45a", metin: "#dbe6ec", soluk: "#7b8f9c", kirmizi: "#ff7a6b" };
const mono = Platform.select({ ios: "Menlo", default: "monospace" });
const durumAdi: Record<Durum, string> = { hazir: "Hazır", dinliyor: "Dinliyorum", dusunuyor: "Düşünüyorum", konusuyor: "Konuşuyorum" };
const oneriler = ["Yarın sabah 9'da su içmemi hatırlat", "Hava nasıl?", "Feneri aç", "Benim adım ne, hatırlıyor musun?"];
const KARSILAMA = "Merhaba, ben NOVA. Konuşabilir ya da yazabilirsin. Zamanlayıcı, hatırlatma, hava durumu, arama ve fener işlerini de hallederim.";
const MAKS_MESAJ = 60; // sohbet bu kadar uzayınca yeni sohbete geçilir
const UYANMA = /(?:^|\s)(?:hey\s+|hay\s+|hei\s+)?nova[a-zçğıöşü'’]*[,.!?]?\s*(.*)$/i;

let sayac = Date.now();
const satir = (kim: Satir["kim"], metin: string): Satir => ({ id: ++sayac, kim, metin });

type DinlemeTipi = "tek" | "surekli" | null;

function Nova() {
  const { width, height } = useWindowDimensions();
  const [durum, setDurum] = useState<Durum>("hazir");
  const [satirlar, setSatirlar] = useState<Satir[]>([]);
  const [girdi, setGirdi] = useState("");
  const [saat, setSaat] = useState("");
  const [ayarAcik, setAyarAcik] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [sesli, setSesli] = useState(true);
  const [ellerSerbest, setEllerSerbest] = useState(false);
  const [fener, setFener] = useState(false);
  const [bilgiler, setBilgiler] = useState<string[]>([]);
  const [kameraIzni, kameraIzniIste] = useCameraPermissions();

  const sohbet = useRef<SohbetDurumu | null>(null);
  const kaydirma = useRef<ScrollViewInstance>(null);
  const yuklendi = useRef(false);
  const mesgul = useRef(false);
  const konusuyor = useRef(false);
  const sesliRef = useRef(sesli);
  const surekli = useRef(false);
  const dinleme = useRef<DinlemeTipi>(null);
  const sonDinlenen = useRef("");
  const komutBekleniyor = useRef(0);
  const isleRef = useRef<(m: string) => void>(() => {});

  // ---- Açılışta kayıtlı verileri yükle ----
  useEffect(() => {
    (async () => {
      const [k, s, ss, sat, soh, bil] = await Promise.all([
        SecureStore.getItemAsync("apiKey"), hafiza.ayar("sesli", true), hafiza.ayar("ellerSerbest", false),
        hafiza.satirlar(), hafiza.sohbet(), hafiza.bilgiler(),
      ]);
      if (k) setApiKey(k);
      setSesli(s); sesliRef.current = s;
      setSatirlar(sat.length ? sat : [satir("nova", KARSILAMA)]);
      sohbet.current = soh;
      setBilgiler(bil);
      yuklendi.current = true;
      if (ss) setEllerSerbest(true);
    })();
    const t = setInterval(() => setSaat(new Date().toLocaleTimeString("tr-TR")), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { if (yuklendi.current) hafiza.satirlarYaz(satirlar); }, [satirlar]);
  useEffect(() => { sesliRef.current = sesli; }, [sesli]);

  const ekle = (s: Satir) => setSatirlar((x) => [...x, s]);
  const guncelle = (id: number, metin: string) => setSatirlar((x) => x.map((s) => (s.id === id ? { ...s, metin } : s)));

  // ---- Dinleme ----
  const dinle = useCallback((tip: Exclude<DinlemeTipi, null>) => {
    dinleme.current = tip;
    ExpoSpeechRecognitionModule.start({
      lang: "tr-TR", interimResults: true, continuous: tip === "surekli",
      androidIntentOptions: { EXTRA_LANGUAGE_MODEL: "web_search" },
    });
  }, []);

  const durdur = useCallback(() => {
    if (dinleme.current) { dinleme.current = null; ExpoSpeechRecognitionModule.abort(); }
  }, []);

  // Eller serbest moddaysa ve meşgul değilsek dinlemeye geri dön.
  const devamEt = useCallback(() => {
    if (surekli.current && !mesgul.current && !konusuyor.current && !dinleme.current) {
      setTimeout(() => {
        if (surekli.current && !mesgul.current && !konusuyor.current && !dinleme.current) dinle("surekli");
      }, 350);
    }
  }, [dinle]);

  const konus = useCallback((metin: string) => {
    if (!sesliRef.current || !metin) { setDurum("hazir"); devamEt(); return; }
    durdur(); // kendi sesini duymasın
    Speech.stop();
    konusuyor.current = true;
    const bitti = () => { konusuyor.current = false; setDurum("hazir"); devamEt(); };
    Speech.speak(metin, {
      language: "tr-TR", rate: 1.0, pitch: 0.95,
      onStart: () => setDurum("konusuyor"), onDone: bitti, onStopped: bitti, onError: bitti,
    });
  }, [devamEt, durdur]);

  const fenerAyarla = useCallback(async (acik: boolean) => {
    if (acik && !kameraIzni?.granted) {
      const iz = await kameraIzniIste();
      if (!iz.granted) throw new Error("Kamera izni olmadan feneri açamıyorum.");
    }
    setFener(acik);
  }, [kameraIzni, kameraIzniIste]);

  const isle = useCallback(async (ham: string) => {
    const metin = ham.trim();
    if (!metin || mesgul.current) return;
    mesgul.current = true;
    durdur();
    Speech.stop();
    setGirdi("");
    ekle(satir("ben", metin));

    try {
      const yerel = yerelKomut(metin);
      if (yerel) {
        if (yerel.zamanlayici) await zamanlayiciKur(yerel.zamanlayici.saniye, yerel.zamanlayici.etiket);
        ekle(satir("nova", yerel.metin));
        mesgul.current = false;
        konus(yerel.metin);
        return;
      }

      setDurum("dusunuyor");
      if (!sohbet.current || sohbet.current.mesajlar.length > MAKS_MESAJ) {
        sohbet.current = { sistem: sistemMetni(await hafiza.bilgiler()), mesajlar: [] };
      }
      const cevapSatiri = satir("nova", "…");
      ekle(cevapSatiri);
      const cevap = await sor(apiKey, sohbet.current, metin, { fenerAyarla }, (t) => guncelle(cevapSatiri.id, t || "…"));
      guncelle(cevapSatiri.id, cevap || "Tamam.");
      await hafiza.sohbetYaz(sohbet.current);
      setBilgiler(await hafiza.bilgiler());
      mesgul.current = false;
      konus(cevap);
    } catch (e) {
      ekle(satir("nova", hataMetni(e)));
      mesgul.current = false;
      setDurum("hazir");
      devamEt();
    }
  }, [apiKey, konus, durdur, devamEt, fenerAyarla]);

  useEffect(() => { isleRef.current = isle; }, [isle]);

  // Uygulama açıkken gelen hatırlatmayı sesli söyle.
  useEffect(() => {
    const abone = bildirimGelince((m) => { if (m) { ekle(satir("nova", m)); konus(m); } });
    return () => abone.remove();
  }, [konus]);

  // Sürekli modda: "Nova ..." diye başlayan cümleyi komut olarak al.
  const surekliSonuc = (t: string) => {
    const bekliyor = Date.now() < komutBekleniyor.current;
    const m = t.toLocaleLowerCase("tr").match(UYANMA);
    let komut = "";
    if (m) komut = m[1].trim();
    else if (bekliyor) komut = t.trim();
    else return;
    if (komut.length > 1) {
      komutBekleniyor.current = 0;
      durdur();
      isleRef.current(komut);
    } else {
      komutBekleniyor.current = Date.now() + 8000;
      Vibration.vibrate(60);
      setDurum("dinliyor");
    }
  };

  useSpeechRecognitionEvent("start", () => {
    sonDinlenen.current = "";
    if (dinleme.current === "tek") setDurum("dinliyor");
  });
  useSpeechRecognitionEvent("result", (e) => {
    const t = e.results[0]?.transcript ?? "";
    if (dinleme.current === "tek") {
      setGirdi(t);
      if (e.isFinal) sonDinlenen.current = t;
    } else if (dinleme.current === "surekli" && e.isFinal) {
      surekliSonuc(t);
    }
  });
  useSpeechRecognitionEvent("end", () => {
    const tip = dinleme.current;
    dinleme.current = null;
    setDurum((d) => (d === "dinliyor" && Date.now() >= komutBekleniyor.current ? "hazir" : d));
    if (tip === "tek" && sonDinlenen.current) { isleRef.current(sonDinlenen.current); return; }
    devamEt();
  });
  useSpeechRecognitionEvent("error", (e) => {
    if (e.error === "not-allowed" || e.error === "service-not-allowed") {
      surekli.current = false;
      setEllerSerbest(false);
      ekle(satir("sistem", "Mikrofon izni verilmedi. Telefon ayarlarından açabilirsin."));
      return;
    }
    if (e.error === "no-speech" || e.error === "aborted" || e.error === "speech-timeout" || surekli.current) return;
    ekle(satir("sistem", `Ses tanıma hatası: ${e.message}`));
  });

  // ---- Eller serbest modu aç/kapat ----
  useEffect(() => {
    if (!yuklendi.current) return;
    hafiza.ayarYaz("ellerSerbest", ellerSerbest);
    surekli.current = ellerSerbest;
    (async () => {
      if (ellerSerbest) {
        const iz = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (!iz.granted) { setEllerSerbest(false); ekle(satir("sistem", "Mikrofon izni verilmedi.")); return; }
        await activateKeepAwakeAsync("nova");
        devamEt();
      } else {
        deactivateKeepAwake("nova");
        if (dinleme.current === "surekli") durdur();
      }
    })();
  }, [ellerSerbest, devamEt, durdur]);

  const mikrofon = async () => {
    Speech.stop();
    if (surekli.current) {
      // Eller serbest açıkken düğme "Nova" demekle aynı işi görür.
      komutBekleniyor.current = Date.now() + 8000;
      setDurum("dinliyor");
      if (!dinleme.current) dinle("surekli");
      return;
    }
    if (dinleme.current === "tek") { ExpoSpeechRecognitionModule.stop(); return; }
    const izin = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!izin.granted) { ekle(satir("sistem", "Mikrofon izni verilmedi. Telefon ayarlarından açabilirsin.")); return; }
    dinle("tek");
  };

  const ayarKaydet = async () => {
    await SecureStore.setItemAsync("apiKey", apiKey.trim());
    await hafiza.ayarYaz("sesli", sesli);
    setAyarAcik(false);
  };

  const sohbetiTemizle = async () => {
    sohbet.current = null;
    await hafiza.sohbetYaz(null);
    setSatirlar([satir("sistem", "Sohbet temizlendi.")]);
    setAyarAcik(false);
  };

  const bilgiSil = async (b: string) => {
    await hafiza.bilgiSil(b);
    setBilgiler(await hafiza.bilgiler());
    sohbet.current = null; // silinen bilgi eski sohbette kalmasın
    await hafiza.sohbetYaz(null);
  };

  const cekirdekBoyu = Math.min(width - 32, height * 0.32, 300);
  const renk = durumRengi[durum];
  const ilkAcilis = satirlar.length <= 1;

  return (
    <SafeAreaView style={s.ekran} edges={["top", "bottom", "left", "right"]}>
      <StatusBar style="light" />
      {fener && <CameraView style={s.gizliKamera} facing="back" enableTorch />}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={s.ust}>
          <Text style={s.marka}>NOVA</Text>
          <View style={s.durum}>
            <View style={[s.nokta, { backgroundColor: renk }]} />
            <Text style={s.durumYazi}>{durumAdi[durum].toLocaleUpperCase("tr")}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 6 }}>
            <Pressable style={[s.ikon, ellerSerbest && s.ikonAcik]} onPress={() => setEllerSerbest((v) => !v)}
              accessibilityLabel="Eller serbest mod">
              <Text style={{ color: ellerSerbest ? R.bg : R.soluk, fontSize: 15 }}>👂</Text>
            </Pressable>
            <Pressable style={s.ikon} onPress={() => setAyarAcik(true)} accessibilityLabel="Ayarlar">
              <Text style={{ color: R.soluk, fontSize: 18 }}>⚙</Text>
            </Pressable>
          </View>
        </View>

        <View style={s.merkez}>
          <Cekirdek durum={durum} boyut={cekirdekBoyu} />
          <Text style={s.okuma}>
            {saat} · {ellerSerbest ? "\"NOVA\" DE, DİNLİYORUM" : "SİSTEM ÇEVRİMİÇİ"}{fener ? " · FENER AÇIK" : ""}
          </Text>
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
          {ilkAcilis && (
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
          <ScrollView contentContainerStyle={s.pencere}>
            <Text style={s.baslik}>AYARLAR</Text>
            <View style={s.satirAyar}>
              <Text style={s.metin}>Cevapları sesli oku</Text>
              <Switch value={sesli} onValueChange={setSesli} trackColor={{ true: R.buz, false: R.cizgi }} />
            </View>
            <View style={s.satirAyar}>
              <View style={{ flex: 1 }}>
                <Text style={s.metin}>Eller serbest ("Nova" diye seslen)</Text>
                <Text style={s.not}>Uygulama açıkken sürekli dinler, ekranı açık tutar. Pil tüketir.</Text>
              </View>
              <Switch value={ellerSerbest} onValueChange={setEllerSerbest} trackColor={{ true: R.buz, false: R.cizgi }} />
            </View>

            <Text style={s.etiket}>Anthropic API anahtarı</Text>
            <TextInput style={s.anahtar} value={apiKey} onChangeText={setApiKey} placeholder="sk-ant-…"
              placeholderTextColor={R.soluk} secureTextEntry autoCapitalize="none" autoCorrect={false} />
            <Text style={s.not}>Anahtar yalnızca bu telefonda, şifreli depoda saklanır. console.anthropic.com adresinden alabilirsin.</Text>

            <Text style={s.etiket}>NOVA'nın hatırladıkları</Text>
            {bilgiler.length === 0 ? (
              <Text style={s.not}>Henüz bir şey yok. "Adımı hatırla, ben Salih" gibi söyleyebilirsin.</Text>
            ) : (
              bilgiler.map((b) => (
                <View key={b} style={s.bilgi}>
                  <Text style={[s.metin, { flex: 1, fontSize: 14 }]}>{b}</Text>
                  <Pressable onPress={() => bilgiSil(b)} accessibilityLabel="Sil" hitSlop={8}>
                    <Text style={{ color: R.kirmizi, fontSize: 16 }}>✕</Text>
                  </Pressable>
                </View>
              ))
            )}

            <View style={s.butonlar}>
              <Pressable style={s.ikincil} onPress={sohbetiTemizle}><Text style={s.metin}>Sohbeti temizle</Text></Pressable>
              <Pressable style={s.birincil} onPress={ayarKaydet}><Text style={{ color: R.bg, fontWeight: "600" }}>Kaydet</Text></Pressable>
            </View>
          </ScrollView>
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
  gizliKamera: { position: "absolute", width: 1, height: 1, opacity: 0 },
  ust: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 8 },
  marka: { color: R.buz, fontSize: 18, fontWeight: "700", letterSpacing: 6 },
  durum: { flexDirection: "row", alignItems: "center", gap: 8 },
  nokta: { width: 7, height: 7, borderRadius: 4 },
  durumYazi: { color: R.soluk, fontFamily: mono, fontSize: 11, letterSpacing: 1.5 },
  ikon: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: R.cizgi, alignItems: "center", justifyContent: "center" },
  ikonAcik: { backgroundColor: R.buz, borderColor: R.buz },
  merkez: { alignItems: "center", paddingVertical: 6 },
  okuma: { color: R.soluk, fontFamily: mono, fontSize: 11, letterSpacing: 1.2, marginTop: 2, textAlign: "center" },
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
  satirAyar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  etiket: { color: R.soluk, fontSize: 13, marginTop: 6 },
  anahtar: { height: 42, backgroundColor: R.bg, borderWidth: 1, borderColor: R.cizgi, borderRadius: 8, color: R.metin, paddingHorizontal: 10, fontFamily: mono },
  not: { color: R.soluk, fontSize: 12, lineHeight: 18 },
  bilgi: { flexDirection: "row", alignItems: "center", gap: 10, borderBottomWidth: 1, borderBottomColor: R.cizgi, paddingVertical: 6 },
  butonlar: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 8 },
  ikincil: { height: 40, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: R.cizgi, justifyContent: "center" },
  birincil: { height: 40, paddingHorizontal: 18, borderRadius: 8, backgroundColor: R.buz, justifyContent: "center" },
});
