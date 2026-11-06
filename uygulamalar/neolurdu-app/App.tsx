import { HataSiniri } from "./src/Hata";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, Vibration, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts, Caladea_400Regular, Caladea_700Bold } from "@expo-google-fonts/caladea";
import { BannerAd, BannerAdSize, useInterstitialAd, useRewardedAd } from "react-native-google-mobile-ads";
import { Kategori, KATEGORILER, SORULAR } from "./src/sorular";
import {
  bugun, bugunkuOdullu, guncelSeri, gununSorulari, Ilerleme, ilerlemeOku, ilerlemeYaz, OyunSorusu, paylasimMetni,
  serbestSorular, sonucuKaydet, krediEkle, krediHarca,
} from "./src/oyun";
import { arkaPlanaGecince, bulutVarMi, esitle, oturumAc } from "./src/bulut";
import { hatirlatmaAc, hatirlatmaKapat } from "./src/hatirlatma";
import { gizlilikSecenegiGerekli, gizlilikSecenekleriniAc, reklamlariBaslat } from "./src/reklam";
import { geriYukle, magazayiBaslat, magazayiKapat, satinAl, Urun } from "./src/magaza";
import { GIZLILIK_URL, KREDI_PAKETI, KURALLAR, REKLAM, URUN } from "./src/yapilandirma";
import { PaylasDugmesi } from "./src/Paylasim";

SplashScreen.preventAutoHideAsync().catch(() => {});

// Reklam/mağaza hataları sessizce kaydedilir (uygulamayı durdurmaz, hata ekranı da açmaz).
const hataKaydetSessiz = (e: unknown) => { if (__DEV__) console.warn(e); };

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
  | { ad: "koleksiyon" }
  | { ad: "magaza" };

export default function App() {
  return <HataSiniri><Uygulama /></HataSiniri>;
}

function Uygulama() {
  const [fontlar] = useFonts({ Caladea_400Regular, Caladea_700Bold });
  const [ilerleme, setIlerleme] = useState<Ilerleme | null>(null);
  const [ekran, setEkran] = useState<Ekran>({ ad: "ana" });
  const [reklamHazir, setReklamHazir] = useState(false);
  const [gizlilikGerekli, setGizlilikGerekli] = useState(false);
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [mesaj, setMesaj] = useState("");

  const goster = useCallback((m: string) => { setMesaj(m); setTimeout(() => setMesaj(""), 2800); }, []);

  // İlerlemeyi değiştir ve kaydet
  const guncelle = useCallback((f: (i: Ilerleme) => Ilerleme) => {
    setIlerleme((i) => { if (!i) return i; const y = f(i); ilerlemeYaz(y); return y; });
  }, []);

  useEffect(() => { ilerlemeOku().then(setIlerleme); }, []);
  useEffect(() => { if (fontlar && ilerleme) SplashScreen.hideAsync().catch(() => {}); }, [fontlar, ilerleme]);

  // Mağaza
  const dinleyiciler = useMemo(() => ({
    krediEkle: (n: number) => { guncelle((i) => krediEkle(i, n)); goster(`${n} kredi eklendi.`); },
    reklamlariKaldir: () => guncelle((i) => (i.reklamsiz ? i : { ...i, reklamsiz: true })),
    hata: goster,
  }), [guncelle, goster]);
  useEffect(() => {
    // İlk ekran çizildikten sonra başlat; mağaza hatası uygulamayı durdurmasın.
    const t = setTimeout(() => {
      try { magazayiBaslat(dinleyiciler).then(setUrunler).catch(hataKaydetSessiz); } catch (e) { hataKaydetSessiz(e); }
    }, 1500);
    return () => { clearTimeout(t); try { magazayiKapat(); } catch {} };
  }, [dinleyiciler]);

  // Reklamlar (onaydan sonra)
  useEffect(() => {
    const t = setTimeout(() => {
      reklamlariBaslat()
        .then((ok) => { setReklamHazir(ok); return gizlilikSecenegiGerekli().then(setGizlilikGerekli); })
        .catch(hataKaydetSessiz);
    }, 800);
    return () => clearTimeout(t);
  }, []);
  const reklamsiz = ilerleme?.reklamsiz ?? false;
  const gecis = useInterstitialAd(reklamHazir && !reklamsiz ? REKLAM.gecis : null);
  const odullu = useRewardedAd(reklamHazir ? REKLAM.odullu : null);
  useEffect(() => { if (reklamHazir && !reklamsiz && !gecis.isLoaded) gecis.load(); }, [reklamHazir, reklamsiz, gecis.isLoaded, gecis.isClosed]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (reklamHazir && !odullu.isLoaded) odullu.load(); }, [reklamHazir, odullu.isLoaded, odullu.isClosed]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ödüllü reklam izlendiyse krediyi bir kez ver
  const odulVerildi = useRef(false);
  useEffect(() => {
    if (odullu.isEarnedReward && !odulVerildi.current) {
      odulVerildi.current = true;
      guncelle((i) => ({
        ...krediEkle(i, KURALLAR.reklamOdulu),
        odullu: { tarih: bugun(), sayi: bugunkuOdullu(i) + 1 },
      }));
      goster(`${KURALLAR.reklamOdulu} kredi kazandın!`);
    }
  }, [odullu.isEarnedReward, guncelle, goster]);

  // ---- Google Play Games bulut kaydı ----
  const [bulutBagli, setBulutBagli] = useState(false);
  const sonIlerleme = useRef<Ilerleme | null>(null);
  useEffect(() => { sonIlerleme.current = ilerleme; }, [ilerleme]);
  const esitleniyor = useRef(false);
  const bulutlaEsitle = useCallback(async () => {
    const simdi = sonIlerleme.current;
    if (!simdi || esitleniyor.current) return;
    esitleniyor.current = true;
    try {
      const birlesik = await esitle(simdi);
      // Yalnız buluttan gerçekten yeni bir şey geldiyse güncelle (yoksa her yazma yeni bir eşitleme tetiklerdi)
      if (birlesik && JSON.stringify(birlesik) !== JSON.stringify(simdi)) {
        setIlerleme(birlesik);
        ilerlemeYaz(birlesik);
      }
    } catch (e) { hataKaydetSessiz(e); } finally { esitleniyor.current = false; }
  }, []);
  const bulutaBaglan = useCallback(async (giris: boolean) => {
    const ok = await oturumAc(giris);
    setBulutBagli(ok);
    if (ok) await bulutlaEsitle();
    else if (giris) goster("Google Play Games'e bağlanılamadı.");
  }, [bulutlaEsitle, goster]);
  // Açılışta sessizce bağlan ve eşitle
  const yuklendiMi = ilerleme !== null;
  useEffect(() => {
    if (!yuklendiMi || !bulutVarMi()) return;
    const t = setTimeout(() => { bulutaBaglan(false); }, 2000);
    return () => clearTimeout(t);
  }, [yuklendiMi, bulutaBaglan]);
  // Her değişiklikten birkaç saniye sonra ve uygulama arka plana geçince buluta yaz
  useEffect(() => {
    if (!bulutBagli || !ilerleme) return;
    const t = setTimeout(() => { bulutlaEsitle(); }, 5000);
    return () => clearTimeout(t);
  }, [ilerleme, bulutBagli, bulutlaEsitle]);
  useEffect(() => {
    if (!bulutBagli) return;
    const a = arkaPlanaGecince(() => { bulutlaEsitle(); });
    return () => a.remove();
  }, [bulutBagli, bulutlaEsitle]);

  if (!fontlar || !ilerleme) return null;

  const bitir = (sorular: OyunSorusu[], sonuclar: boolean[], gunluk: boolean) => {
    guncelle((i) => sonucuKaydet(i, sorular, sonuclar, gunluk));
    if (gunluk && !ilerleme.gunluk[bugun()]) goster(`Günlük ödül: ${KURALLAR.gunlukOdul} kredi`);
    setEkran({ ad: "sonuc", sorular, sonuclar, gunluk });
  };

  // Sonuç ekranından çıkarken, belirli sıklıkta geçiş reklamı
  const anaya = () => {
    if (!reklamsiz && gecis.isLoaded && ilerleme.oyunSayisi % KURALLAR.gecisSikligi === 0) {
      try { gecis.show(); } catch (e) { hataKaydetSessiz(e); }
    }
    setEkran({ ad: "ana" });
  };

  const hatirlatmaDegis = async (acik: boolean) => {
    const ok = acik ? await hatirlatmaAc() : (await hatirlatmaKapat(), true);
    guncelle((i) => ({ ...i, hatirlatma: acik && ok }));
  };

  const jokerKullan = () => {
    if (ilerleme.kredi < KURALLAR.jokerBedeli) { goster("Yeterli kredin yok."); return false; }
    guncelle((i) => krediHarca(i, KURALLAR.jokerBedeli));
    return true;
  };

  const reklamIzle = () => {
    if (bugunkuOdullu(ilerleme) >= KURALLAR.gunlukReklamSiniri) { goster("Bugünlük reklam hakkın doldu."); return; }
    if (!odullu.isLoaded) { goster("Reklam henüz hazır değil, biraz sonra dene."); return; }
    odulVerildi.current = false;
    try { odullu.show(); } catch (e) { hataKaydetSessiz(e); goster("Reklam açılamadı."); }
  };

  const banner = reklamHazir && !reklamsiz ? (
    <View style={s.banner}><BannerAd unitId={REKLAM.banner} size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER} /></View>
  ) : null;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={s.ekran} edges={["top", "bottom", "left", "right"]}>
        <StatusBar style="light" />
        <View style={{ flex: 1 }}>
          {ekran.ad === "ana" && <Ana ilerleme={ilerleme} git={setEkran} hatirlatmaDegis={hatirlatmaDegis} bulutBagli={bulutBagli} bulutaBaglan={() => bulutaBaglan(true)} />}
          {ekran.ad === "oyun" && (
            <Oyun sorular={ekran.sorular} gunluk={ekran.gunluk} bitir={bitir} cik={() => setEkran({ ad: "ana" })}
              kredi={ilerleme.kredi} jokerKullan={jokerKullan} />
          )}
          {ekran.ad === "sonuc" && <Sonuc {...ekran} seri={guncelSeri(ilerleme)} anaya={anaya} />}
          {ekran.ad === "koleksiyon" && <Koleksiyon bilinenler={ilerleme.bilinenler} geri={() => setEkran({ ad: "ana" })} />}
          {ekran.ad === "magaza" && (
            <Magaza ilerleme={ilerleme} urunler={urunler} geri={() => setEkran({ ad: "ana" })}
              reklamIzle={reklamIzle} reklamHazir={odullu.isLoaded} gizlilikGerekli={gizlilikGerekli}
              geriYukle={() => geriYukle(dinleyiciler).then(() => goster("Satın almalar kontrol edildi.")).catch(() => goster("Geri yükleme yapılamadı."))}
              satinAl={(id) => satinAl(id).catch(() => goster("Mağazaya bağlanılamadı."))} />
          )}
        </View>
        {mesaj !== "" && <View style={s.mesaj}><Text style={s.mesajYazi}>{mesaj}</Text></View>}
        {(ekran.ad === "ana" || ekran.ad === "sonuc") && banner}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// ---------------- Ana ekran ----------------
function Ana({ ilerleme, git, hatirlatmaDegis, bulutBagli, bulutaBaglan }: {
  ilerleme: Ilerleme; git: (e: Ekran) => void; hatirlatmaDegis: (a: boolean) => void;
  bulutBagli: boolean; bulutaBaglan: () => void;
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
          <Text style={s.altBaslik}>{SORULAR.length} soruluk bilim oyunu</Text>
        </View>
        <Pressable style={s.krediRozet} onPress={() => git({ ad: "magaza" })} accessibilityLabel="Mağaza">
          <Text style={s.krediYazi}>◆ {ilerleme.kredi}</Text>
        </Pressable>
      </View>

      <View style={s.istatistikler}>
        <Istatistik deger={`${seri}`} etiket="günlük seri" />
        <Istatistik deger={`${ilerleme.bilinenler.length}`} etiket={`/${SORULAR.length} koleksiyon`} />
        <Istatistik deger={`${ilerleme.enIyiSeri}`} etiket="en iyi seri" />
      </View>

      <View style={s.kart}>
        <Text style={s.kartEtiket}>GÜNÜN SORULARI</Text>
        {bugunku ? (
          <>
            <Text style={s.kartBaslik}>Bugünkü skorun {bugunku.filter(Boolean).length}/{bugunku.length}</Text>
            <Kareler sonuclar={bugunku} />
            <Text style={s.kartNot}>Yarın yeni 5 soru gelecek.</Text>
            <PaylasDugmesi sonuclar={bugunku} baslik="Günün soruları" seri={seri} metin={paylasimMetni(bugunku, seri)}
              dugmeStili={s.ikincilButon} yaziStili={s.ikincilYazi} />
          </>
        ) : (
          <>
            <Text style={s.kartBaslik}>5 soru, herkese aynı</Text>
            <Text style={s.kartNot}>Her gün bir kez oyna, serini büyüt, {KURALLAR.gunlukOdul} kredi kazan.</Text>
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

      <Pressable style={s.bolum} onPress={() => git({ ad: "magaza" })}>
        <Text style={s.bolumBaslik}>Mağaza →</Text>
        <Text style={s.bolumNot}>Kredi al ya da reklam izleyerek kazan. {ilerleme.reklamsiz ? "Reklamsız sürüm aktif." : "Reklamları kaldırabilirsin."}</Text>
      </Pressable>

      {bulutVarMi() && (
        <View style={s.bolum}>
          <Text style={s.bolumBaslik}>Bulut kaydı</Text>
          {bulutBagli ? (
            <Text style={s.bolumNot}>Kredin, serin ve koleksiyonun Google Play Games hesabında yedekleniyor. Uygulamayı silip yeniden kursan da geri gelir.</Text>
          ) : (
            <>
              <Text style={s.bolumNot}>Kredin ve ilerlemen yalnız bu telefonda. Google Play Games ile bağlanırsan hesabına yedeklenir.</Text>
              <Pressable style={s.ikincilButon} onPress={bulutaBaglan}><Text style={s.ikincilYazi}>Google Play Games ile bağlan</Text></Pressable>
            </>
          )}
        </View>
      )}

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

const Kareler = ({ sonuclar }: { sonuclar: boolean[] }) => (
  <View style={s.kareler}>
    {sonuclar.map((d, i) => <View key={i} style={[s.kare, { backgroundColor: d ? R.sari : R.cizgi }]} />)}
  </View>
);

// ---------------- Oyun ekranı ----------------
function Oyun({ sorular, gunluk, bitir, cik, kredi, jokerKullan }: {
  sorular: OyunSorusu[]; gunluk: boolean; bitir: (s: OyunSorusu[], r: boolean[], g: boolean) => void; cik: () => void;
  kredi: number; jokerKullan: () => boolean;
}) {
  const [sira, setSira] = useState(0);
  const [secim, setSecim] = useState<string | null>(null);
  const [sonuclar, setSonuclar] = useState<boolean[]>([]);
  const [elenen, setElenen] = useState<string | null>(null);
  const soru = sorular[sira];

  const sec = (cevap: string) => {
    if (secim) return;
    setSecim(cevap);
    const dogru = cevap === soru.d;
    if (!dogru) Vibration.vibrate(120);
    setSonuclar((r) => [...r, dogru]);
  };

  const joker = () => {
    if (secim || elenen || !jokerKullan()) return;
    setElenen(soru.y[Math.floor(Math.random() * soru.y.length)]);
  };

  const devam = () => {
    if (sira + 1 >= sorular.length) { bitir(sorular, sonuclar, gunluk); return; }
    setSira(sira + 1);
    setSecim(null);
    setElenen(null);
  };

  return (
    <ScrollView contentContainerStyle={s.oyun}>
      <View style={s.oyunUst}>
        <Pressable onPress={cik} hitSlop={10} accessibilityLabel="Çık"><Text style={s.kapat}>✕</Text></Pressable>
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
          const silik = c === elenen;
          const stil = secim ? (dogruMu ? s.secenekDogru : secilen ? s.secenekYanlis : s.secenekSoluk) : silik ? s.secenekSoluk : null;
          return (
            <Pressable key={c} onPress={() => sec(c)} style={[s.secenek, stil]} disabled={!!secim || silik}>
              <Text style={[s.secenekYazi, secim && dogruMu && { color: R.murekkep }, silik && !secim && s.ustuCizili]}>{c}</Text>
              {secim && dogruMu && <Text style={s.isaret}>✓</Text>}
              {secilen && !dogruMu && <Text style={[s.isaret, { color: R.krem }]}>✕</Text>}
            </Pressable>
          );
        })}
      </View>

      {!secim && (
        <Pressable style={[s.joker, (elenen || kredi < KURALLAR.jokerBedeli) && { opacity: 0.4 }]} onPress={joker} disabled={!!elenen}>
          <Text style={s.jokerYazi}>Yarı yarıya · {KURALLAR.jokerBedeli} kredi</Text>
          <Text style={s.jokerKredi}>◆ {kredi}</Text>
        </Pressable>
      )}

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
      <Kareler sonuclar={sonuclar} />
      <Text style={s.yorum}>{yorum}</Text>
      {gunluk && <Text style={s.seriYazi}>Seri: {seri} gün</Text>}

      <PaylasDugmesi sonuclar={sonuclar} baslik={gunluk ? "Günün soruları" : "Serbest oyun"} seri={gunluk ? seri : undefined}
        metin={paylasimMetni(sonuclar, seri)} dugmeStili={s.anaButon} yaziStili={s.anaButonYazi} />
      <Pressable style={s.ikincilButon} onPress={anaya}><Text style={s.ikincilYazi}>Ana sayfa</Text></Pressable>

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
    </ScrollView>
  );
}

// ---------------- Koleksiyon ----------------
function Koleksiyon({ bilinenler, geri }: { bilinenler: string[]; geri: () => void }) {
  const [acikKategori, setAcikKategori] = useState<Kategori>(KATEGORILER[0]);
  const bilinen = useMemo(() => new Set(bilinenler), [bilinenler]);
  const sorular = useMemo(() => SORULAR.filter((q) => q.k === acikKategori), [acikKategori]);
  return (
    <ScrollView contentContainerStyle={s.koleksiyon}>
      <View style={s.oyunUst}>
        <Pressable onPress={geri} hitSlop={10} accessibilityLabel="Geri"><Text style={s.kapat}>←</Text></Pressable>
        <Text style={[s.bolumBaslik, { flex: 1 }]}>Koleksiyon</Text>
        <Text style={s.sayac}>{bilinenler.length}/{SORULAR.length}</Text>
      </View>
      <View style={s.cipler}>
        {KATEGORILER.map((k) => {
          const toplam = SORULAR.filter((q) => q.k === k);
          return (
            <Pressable key={k} onPress={() => setAcikKategori(k)} style={[s.cip, acikKategori === k && s.cipSecili]}>
              <Text style={[s.cipYazi, acikKategori === k && { color: R.murekkep }]}>
                {k} {toplam.filter((q) => bilinen.has(q.id)).length}/{toplam.length}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {sorular.map((q) => {
        const acik = bilinen.has(q.id);
        return (
          <View key={q.id} style={[s.kolSatir, !acik && { opacity: 0.55 }]}>
            <Text style={s.ozetSoru}>{q.s}</Text>
            <Text style={acik ? s.ozetCevap : s.kilitli}>{acik ? q.d : "Henüz doğru bilinmedi"}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

// ---------------- Mağaza ----------------
function Magaza({ ilerleme, urunler, geri, reklamIzle, reklamHazir, gizlilikGerekli, geriYukle, satinAl }: {
  ilerleme: Ilerleme; urunler: Urun[]; geri: () => void; reklamIzle: () => void; reklamHazir: boolean;
  gizlilikGerekli: boolean; geriYukle: () => void; satinAl: (id: string) => void;
}) {
  const fiyat = (id: string) => urunler.find((u) => u.id === id)?.fiyat;
  const kalanReklam = KURALLAR.gunlukReklamSiniri - bugunkuOdullu(ilerleme);
  return (
    <ScrollView contentContainerStyle={s.ana}>
      <View style={s.oyunUst}>
        <Pressable onPress={geri} hitSlop={10} accessibilityLabel="Geri"><Text style={s.kapat}>←</Text></Pressable>
        <Text style={[s.bolumBaslik, { flex: 1 }]}>Mağaza</Text>
        <Text style={s.krediYazi}>◆ {ilerleme.kredi}</Text>
      </View>
      <Text style={s.bolumNot}>
        Krediyle "Yarı yarıya" jokerini kullanırsın: bir yanlış şık silinir. Günün sorularını bitirince {KURALLAR.gunlukOdul} kredi kazanırsın.
      </Text>

      <View style={s.bolum}>
        <Text style={s.bolumBaslik}>Reklam izle, kredi kazan</Text>
        <Text style={s.bolumNot}>Her reklam {KURALLAR.reklamOdulu} kredi. Bugün {Math.max(0, kalanReklam)} hakkın kaldı.</Text>
        <Pressable style={[s.ikincilButon, (!reklamHazir || kalanReklam <= 0) && { opacity: 0.4 }]} onPress={reklamIzle}>
          <Text style={s.ikincilYazi}>{reklamHazir ? `Reklam izle · +${KURALLAR.reklamOdulu}` : "Reklam yükleniyor…"}</Text>
        </Pressable>
      </View>

      {[URUN.kredi20, URUN.kredi100].map((id) => (
        <View key={id} style={[s.bolum, s.satir]}>
          <View style={{ flex: 1 }}>
            <Text style={s.bolumBaslik}>◆ {KREDI_PAKETI[id]} kredi</Text>
            <Text style={s.bolumNot}>{KREDI_PAKETI[id]} joker hakkı</Text>
          </View>
          <Pressable style={[s.fiyatButon, !fiyat(id) && { opacity: 0.4 }]} onPress={() => fiyat(id) && satinAl(id)}>
            <Text style={s.fiyatYazi}>{fiyat(id) ?? "—"}</Text>
          </Pressable>
        </View>
      ))}

      <View style={[s.bolum, s.satir]}>
        <View style={{ flex: 1 }}>
          <Text style={s.bolumBaslik}>Reklamları kaldır</Text>
          <Text style={s.bolumNot}>{ilerleme.reklamsiz ? "Aktif. Teşekkürler!" : "Banner ve geçiş reklamları bir daha çıkmaz. Tek seferlik."}</Text>
        </View>
        {!ilerleme.reklamsiz && (
          <Pressable style={[s.fiyatButon, !fiyat(URUN.reklamsiz) && { opacity: 0.4 }]}
            onPress={() => fiyat(URUN.reklamsiz) && satinAl(URUN.reklamsiz)}>
            <Text style={s.fiyatYazi}>{fiyat(URUN.reklamsiz) ?? "—"}</Text>
          </Pressable>
        )}
      </View>
      {urunler.length === 0 && <Text style={s.bolumNot}>Ürünler yüklenemedi. Uygulama Google Play'den yüklendiyse ve internet açıksa birazdan görünür.</Text>}

      <Pressable style={s.ikincilButon} onPress={geriYukle}><Text style={s.ikincilYazi}>Satın almaları geri yükle</Text></Pressable>
      {gizlilikGerekli && (
        <Pressable style={s.ikincilButon} onPress={gizlilikSecenekleriniAc}><Text style={s.ikincilYazi}>Reklam gizlilik seçenekleri</Text></Pressable>
      )}
      <Pressable onPress={() => Linking.openURL(GIZLILIK_URL)}><Text style={s.baglanti}>Gizlilik politikası</Text></Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  ekran: { flex: 1, backgroundColor: R.gece },
  banner: { alignItems: "center", backgroundColor: R.derin },
  mesaj: { position: "absolute", left: 16, right: 16, bottom: 80, backgroundColor: R.krem, borderRadius: 12, padding: 12 },
  mesajYazi: { fontFamily: F.baslik, fontSize: 15, color: R.murekkep, textAlign: "center" },
  ana: { padding: 16, gap: 16 },
  ust: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 8 },
  logo: { width: 56, height: 56, borderRadius: 14 },
  marka: { fontFamily: F.baslik, fontSize: 30, color: R.krem },
  altBaslik: { fontFamily: F.metin, fontSize: 14, color: R.soluk },
  krediRozet: { borderWidth: 1, borderColor: R.sari, borderRadius: 999, paddingVertical: 6, paddingHorizontal: 12 },
  krediYazi: { fontFamily: F.baslik, fontSize: 16, color: R.sari, fontVariant: ["tabular-nums"] },
  istatistikler: { flexDirection: "row", gap: 10 },
  istatistik: { flex: 1, backgroundColor: R.derin, borderRadius: 14, paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: R.cizgi },
  istDeger: { fontFamily: F.baslik, fontSize: 24, color: R.sari, fontVariant: ["tabular-nums"] },
  istEtiket: { fontSize: 11, color: R.soluk, letterSpacing: 0.5 },
  kart: { backgroundColor: R.krem, borderRadius: 22, padding: 20, gap: 10 },
  kartEtiket: { fontSize: 11, fontWeight: "700", letterSpacing: 1.6, color: R.gezegen },
  kartBaslik: { fontFamily: F.baslik, fontSize: 24, color: R.murekkep },
  kartNot: { fontFamily: F.metin, fontSize: 15, color: "#4a5568", lineHeight: 21 },
  kareler: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  kare: { width: 26, height: 26, borderRadius: 6 },
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
  ustuCizili: { textDecorationLine: "line-through" },
  isaret: { fontSize: 18, fontWeight: "700", color: R.murekkep },
  joker: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderWidth: 1, borderColor: R.sari, borderStyle: "dashed", borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16 },
  jokerYazi: { fontFamily: F.baslik, fontSize: 16, color: R.sari },
  jokerKredi: { fontSize: 14, color: R.soluk, fontVariant: ["tabular-nums"] },
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
  fiyatButon: { backgroundColor: R.sari, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 16, minWidth: 84, alignItems: "center" },
  fiyatYazi: { fontFamily: F.baslik, fontSize: 16, color: R.murekkep },
  baglanti: { color: R.soluk, fontSize: 14, textAlign: "center", textDecorationLine: "underline", paddingVertical: 8 },
});
