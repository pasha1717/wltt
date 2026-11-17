import { type ComponentType, type Ref, useCallback, useEffect, useRef } from "react";
import { AppState, BackHandler, StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { WebView, type WebViewMessageEvent, type WebViewProps } from "react-native-webview";
import { OYUN_HTML } from "./src/oyun";

// Paketin sınıf tipi varsayılan genel parametreyle (undefined) TS 6'da "never" prop'a dönüşüyor; bileşeni açık tiple kullanıyoruz.
type WebRef = WebView<object>;
const Web = WebView as unknown as ComponentType<WebViewProps & { ref?: Ref<WebRef> }>;
const ZEMIN = "#0e1511";
// Geri tuşu: açık pencereyi kapatır, değilse bir önceki ekrana döner, ana ekrandaysa uygulamadan çıkar.
const GERI_JS = `(function(){try{var m=document.getElementById("modal");if(m&&!m.hidden){pencere(null);ciz(1);}else if(stack.length>1){geri();}else{window.ReactNativeWebView.postMessage("cik");}}catch(e){window.ReactNativeWebView.postMessage("cik");}})();true;`;
const KAYDET_JS = "try{kaydet();}catch(e){}true;";

export default function App() {
  const web = useRef<WebRef>(null);

  useEffect(() => {
    const geri = BackHandler.addEventListener("hardwareBackPress", () => {
      web.current?.injectJavaScript(GERI_JS);
      return true;
    });
    const durum = AppState.addEventListener("change", (s) => {
      if (s !== "active") web.current?.injectJavaScript(KAYDET_JS);
    });
    return () => {
      geri.remove();
      durum.remove();
    };
  }, []);

  const mesaj = useCallback((e: WebViewMessageEvent) => {
    if (e.nativeEvent.data === "cik") BackHandler.exitApp();
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={stil.kok} edges={["top", "bottom", "left", "right"]}>
        <StatusBar style="light" />
        <Web
          ref={web}
          source={{ html: OYUN_HTML, baseUrl: "https://toprakagasi.app/" }}
          originWhitelist={["*"]}
          javaScriptEnabled
          domStorageEnabled
          onMessage={mesaj}
          style={stil.kok}
          overScrollMode="never"
          bounces={false}
          textZoom={100}
          mediaPlaybackRequiresUserAction={false}
          allowsInlineMediaPlayback
          setSupportMultipleWindows={false}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const stil = StyleSheet.create({ kok: { flex: 1, backgroundColor: ZEMIN } });
