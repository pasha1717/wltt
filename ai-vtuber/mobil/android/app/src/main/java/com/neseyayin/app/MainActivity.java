package com.neseyayin.app;

import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebSettings;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Yayın sırasında ekran kapanmasın (WebView'de Screen Wake Lock API'ye güvenilemez).
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        // Hazır replik sesleri dokunuş beklemeden çalabilsin.
        WebSettings ayar = bridge.getWebView().getSettings();
        ayar.setMediaPlaybackRequiresUserGesture(false);
        tamEkran();
    }

    @Override
    public void onWindowFocusChanged(boolean odak) {
        super.onWindowFocusChanged(odak);
        if (odak) tamEkran();
    }

    // Ekran paylaşımında yalnız sahne görünsün: durum ve gezinme çubukları gizlenir, kaydırınca geçici görünür.
    private void tamEkran() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat k = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        k.hide(WindowInsetsCompat.Type.systemBars());
        k.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }
}
