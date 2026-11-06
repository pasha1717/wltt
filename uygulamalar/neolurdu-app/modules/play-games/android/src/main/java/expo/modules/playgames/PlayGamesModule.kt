package expo.modules.playgames

import android.content.Context
import android.content.pm.PackageManager
import com.google.android.gms.games.PlayGames
import com.google.android.gms.games.PlayGamesSdk
import com.google.android.gms.games.SnapshotsClient
import com.google.android.gms.games.snapshot.Snapshot
import com.google.android.gms.games.snapshot.SnapshotMetadataChange
import com.google.android.gms.tasks.Task
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Google Play Games v2: oturum açma ve bulut kaydı (Saved Games). APP_ID tanımlı değilse hiçbir şey yapmaz.
class PlayGamesModule : Module() {
  private var baslatildi = false

  private fun baglam(): Context? = appContext.reactContext?.applicationContext

  private fun etkin(): Boolean {
    val ctx = baglam() ?: return false
    return try {
      val ai = ctx.packageManager.getApplicationInfo(ctx.packageName, PackageManager.GET_META_DATA)
      val v = ai.metaData?.get("com.google.android.gms.games.APP_ID")?.toString()?.trim()
      !v.isNullOrEmpty()
    } catch (_: Throwable) {
      false
    }
  }

  private fun baslat(): Boolean {
    if (baslatildi) return true
    val ctx = baglam() ?: return false
    if (!etkin()) return false
    return try {
      PlayGamesSdk.initialize(ctx)
      baslatildi = true
      true
    } catch (_: Throwable) {
      false
    }
  }

  private fun <T> Task<T>.sonuc(hata: Promise, basari: (T) -> Unit) {
    addOnCompleteListener { t ->
      if (t.isSuccessful) {
        try { basari(t.result) } catch (e: Throwable) { hata.reject("PLAY_GAMES", e.message ?: "Hata", e) }
      } else {
        hata.reject("PLAY_GAMES", t.exception?.message ?: "Play Games hatası", t.exception)
      }
    }
  }

  private fun ac(ad: String, promise: Promise, devam: (SnapshotsClient, Snapshot) -> Unit) {
    val act = appContext.currentActivity ?: return promise.reject("PLAY_GAMES", "Etkinlik yok", null)
    val istemci = PlayGames.getSnapshotsClient(act)
    istemci.open(ad, true, SnapshotsClient.RESOLUTION_POLICY_MOST_RECENTLY_MODIFIED).sonuc(promise) { veya ->
      val snap = if (veya.isConflict) veya.conflict!!.snapshot else veya.data!!
      devam(istemci, snap)
    }
  }

  override fun definition() = ModuleDefinition {
    Name("PlayGames")

    Function("etkinMi") { etkin() }

    // Sessiz oturum kontrolü; giris=true ise gerekirse oturum açma ekranını da gösterir.
    AsyncFunction("oturum") { giris: Boolean, promise: Promise ->
      if (!baslat()) return@AsyncFunction promise.resolve(false)
      val act = appContext.currentActivity ?: return@AsyncFunction promise.resolve(false)
      val istemci = PlayGames.getGamesSignInClient(act)
      istemci.isAuthenticated().addOnCompleteListener { t ->
        val acik = t.isSuccessful && t.result.isAuthenticated
        if (acik || !giris) {
          promise.resolve(acik)
        } else {
          istemci.signIn().addOnCompleteListener { s -> promise.resolve(s.isSuccessful && s.result.isAuthenticated) }
        }
      }
    }

    AsyncFunction("oku") { ad: String, promise: Promise ->
      if (!baslat()) return@AsyncFunction promise.resolve(null)
      ac(ad, promise) { istemci, snap ->
        val bayt = snap.snapshotContents.readFully()
        istemci.discardAndClose(snap)
        promise.resolve(if (bayt.isEmpty()) null else String(bayt, Charsets.UTF_8))
      }
    }

    AsyncFunction("yaz") { ad: String, veri: String, aciklama: String, promise: Promise ->
      if (!baslat()) return@AsyncFunction promise.resolve(false)
      ac(ad, promise) { istemci, snap ->
        snap.snapshotContents.writeBytes(veri.toByteArray(Charsets.UTF_8))
        val meta = SnapshotMetadataChange.Builder().setDescription(aciklama).build()
        istemci.commitAndClose(snap, meta).sonuc(promise) { promise.resolve(true) }
      }
    }
  }
}
