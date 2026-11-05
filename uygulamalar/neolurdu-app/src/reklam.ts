// Reklam: önce kullanıcı onayı (AB/İngiltere için zorunlu UMP formu), sonra SDK başlatma.
import mobileAds, { AdsConsent, AdsConsentPrivacyOptionsRequirementStatus, MaxAdContentRating } from "react-native-google-mobile-ads";

let baslatildi: Promise<boolean> | null = null;

/** Onay formunu gerekiyorsa gösterir, reklam istenebiliyorsa SDK'yı başlatır. Bir kez çalışır. */
export function reklamlariBaslat(): Promise<boolean> {
  if (!baslatildi) {
    baslatildi = (async () => {
      try {
        const bilgi = await AdsConsent.gatherConsent();
        if (!bilgi.canRequestAds) return false;
        await mobileAds().setRequestConfiguration({ maxAdContentRating: MaxAdContentRating.T });
        await mobileAds().initialize();
        return true;
      } catch {
        return false;
      }
    })();
  }
  return baslatildi;
}

/** Gizlilik seçenekleri düğmesi gösterilmeli mi? (AB kullanıcıları onayını değiştirebilmeli.) */
export async function gizlilikSecenegiGerekli(): Promise<boolean> {
  try {
    const b = await AdsConsent.getConsentInfo();
    return b.privacyOptionsRequirementStatus === AdsConsentPrivacyOptionsRequirementStatus.REQUIRED;
  } catch {
    return false;
  }
}

export const gizlilikSecenekleriniAc = () => AdsConsent.showPrivacyOptionsForm().catch(() => {});
