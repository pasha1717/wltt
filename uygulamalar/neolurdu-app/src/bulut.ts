// Google Play Games bulut kaydı: ilerleme (kredi, seri, koleksiyon) kullanıcının Google hesabında saklanır.
import { AppState } from "react-native";
import { requireOptionalNativeModule } from "expo-modules-core";
import { birlestir, buluttanOku, type Ilerleme } from "./oyun";

type PlayGamesYerel = {
  etkinMi(): boolean;
  oturum(giris: boolean): Promise<boolean>;
  oku(ad: string): Promise<string | null>;
  yaz(ad: string, veri: string, aciklama: string): Promise<boolean>;
};

const yerel = requireOptionalNativeModule<PlayGamesYerel>("PlayGames");
const KAYIT = "ilerleme";

export function bulutVarMi(): boolean {
  try { return !!yerel?.etkinMi(); } catch { return false; }
}

export async function oturumAc(giris: boolean): Promise<boolean> {
  if (!bulutVarMi()) return false;
  try { return await yerel!.oturum(giris); } catch { return false; }
}

/** Buluttaki kaydı okur, yerelle birleştirir, birleşmiş hâli buluta yazar ve döndürür. */
export async function esitle(i: Ilerleme): Promise<Ilerleme | null> {
  if (!bulutVarMi()) return null;
  const metin = await yerel!.oku(KAYIT);
  const bulutta = metin ? buluttanOku(metin) : null;
  const sonuc = bulutta ? birlestir(i, bulutta) : i;
  await yerel!.yaz(KAYIT, JSON.stringify(sonuc), `${sonuc.bilinenler.length} soru · ${sonuc.kredi} kredi`);
  return sonuc;
}

/** Yalnız yazar (birleştirme yapılmış yerel durumu buluta gönderir). */
export async function buluta(i: Ilerleme): Promise<void> {
  if (!bulutVarMi()) return;
  await yerel!.yaz(KAYIT, JSON.stringify(i), `${i.bilinenler.length} soru · ${i.kredi} kredi`);
}

export const arkaPlanaGecince = (f: () => void) =>
  AppState.addEventListener("change", (s) => { if (s === "background") f(); });
