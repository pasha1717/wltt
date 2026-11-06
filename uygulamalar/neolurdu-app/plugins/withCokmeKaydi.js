// Yerel (native) çökmeleri yakalar: çökme anında hata kaydını ayrı bir süreçte (":cokme") çalışan
// sade bir ekranda gösterir ve files/son_cokme.txt dosyasına yazar. React Native'e bağlı değildir.
const fs = require("fs");
const path = require("path");
const { withAndroidManifest, withDangerousMod, withMainApplication } = require("expo/config-plugins");

const kayitKt = (pkg) => `package ${pkg}

import android.content.Context
import android.content.Intent
import android.os.Build
import java.io.File
import java.io.PrintWriter
import java.io.StringWriter

object CokmeKaydi {
  fun kur(ctx: Context) {
    Thread.setDefaultUncaughtExceptionHandler { t, e ->
      try {
        val sw = StringWriter()
        e.printStackTrace(PrintWriter(sw))
        val metin = "Thread: \${t.name}\\n\${Build.MANUFACTURER} \${Build.MODEL} / Android \${Build.VERSION.RELEASE} (API \${Build.VERSION.SDK_INT})\\n\\n" + sw.toString()
        File(ctx.filesDir, "son_cokme.txt").writeText(metin)
        val i = Intent(ctx, CokmeActivity::class.java)
          .putExtra("metin", metin.take(100000))
          .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK)
        ctx.startActivity(i)
      } catch (_: Throwable) {
      }
      android.os.Process.killProcess(android.os.Process.myPid())
      System.exit(10)
    }
  }

  fun cokmeSurecindeMi(): Boolean = try {
    File("/proc/self/cmdline").readText().trim { it <= ' ' || it == '\\u0000' }.endsWith(":cokme")
  } catch (_: Throwable) {
    false
  }
}
`;

const ekranKt = (pkg) => `package ${pkg}

import android.app.Activity
import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.graphics.Color
import android.os.Bundle
import android.widget.Button
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import android.widget.Toast
import java.io.File

class CokmeActivity : Activity() {
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    val metin = intent.getStringExtra("metin")
      ?: try { File(filesDir, "son_cokme.txt").readText() } catch (_: Throwable) { "Kayıt bulunamadı." }
    val d = resources.displayMetrics.density
    val kutu = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      setBackgroundColor(Color.parseColor("#111c3d"))
      setPadding((20 * d).toInt(), (48 * d).toInt(), (20 * d).toInt(), (20 * d).toInt())
    }
    kutu.addView(TextView(this).apply {
      text = "Uygulama çöktü"
      textSize = 22f
      setTextColor(Color.parseColor("#fff6e2"))
    })
    kutu.addView(TextView(this).apply {
      text = "Bu ekranın görüntüsünü ya da \\"Kopyala\\" ile metni geliştiriciye gönder."
      textSize = 14f
      setTextColor(Color.parseColor("#9aa6c4"))
      setPadding(0, (8 * d).toInt(), 0, (12 * d).toInt())
    })
    kutu.addView(Button(this).apply {
      text = "Kopyala"
      setOnClickListener {
        (getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager)
          .setPrimaryClip(ClipData.newPlainText("cokme", metin))
        Toast.makeText(this@CokmeActivity, "Kopyalandı", Toast.LENGTH_SHORT).show()
      }
    })
    val kaydir = ScrollView(this)
    kaydir.addView(TextView(this).apply {
      text = metin
      textSize = 11f
      setTextIsSelectable(true)
      setTextColor(Color.parseColor("#ffcf4a"))
      typeface = android.graphics.Typeface.MONOSPACE
    })
    kutu.addView(kaydir, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f))
    setContentView(kutu)
  }
}
`;

module.exports = function withCokmeKaydi(config) {
  const pkg = config.android?.package;

  config = withDangerousMod(config, ["android", async (c) => {
    const dir = path.join(c.modRequest.platformProjectRoot, "app/src/main/java", ...pkg.split("."));
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "CokmeKaydi.kt"), kayitKt(pkg));
    fs.writeFileSync(path.join(dir, "CokmeActivity.kt"), ekranKt(pkg));
    return c;
  }]);

  config = withMainApplication(config, (c) => {
    let s = c.modResults.contents;
    if (!s.includes("CokmeKaydi")) {
      s = s.replace(
        /class MainApplication : Application\(\), ReactApplication \{\n/,
        (m) => m + "\n  override fun attachBaseContext(base: android.content.Context) {\n    super.attachBaseContext(base)\n    CokmeKaydi.kur(base)\n  }\n",
      );
      s = s.replace(
        /override fun onCreate\(\) \{\n\s*super\.onCreate\(\)\n/,
        (m) => m + "    if (CokmeKaydi.cokmeSurecindeMi()) return\n",
      );
    }
    c.modResults.contents = s;
    return c;
  });

  config = withAndroidManifest(config, (c) => {
    const app = c.modResults.manifest.application[0];
    app.activity = app.activity || [];
    if (!app.activity.some((a) => a.$["android:name"] === ".CokmeActivity")) {
      app.activity.push({ $: { "android:name": ".CokmeActivity", "android:process": ":cokme", "android:exported": "false", "android:theme": "@android:style/Theme.Material.NoActionBar" } });
    }
    return c;
  });

  return config;
};
