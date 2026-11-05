import Anthropic from "@anthropic-ai/sdk";
import { fetch as expoFetch } from "expo/fetch";
import { AracBaglami, araciCalistir, araclar } from "./araclar";

export type Mesaj = Anthropic.Beta.BetaMessageParam;
export type SohbetDurumu = { sistem: string; mesajlar: Mesaj[] };

// Sistem metni sohbetin başında bir kez kurulur ve değişmez. Saat bilgisi her kullanıcı mesajına eklenir.
export function sistemMetni(bilgiler: string[]) {
  const hafiza = bilgiler.length
    ? "\n\nKullanıcı hakkında hatırladıkların:\n" + bilgiler.map((b) => "- " + b).join("\n")
    : "";
  return (
    "Sen NOVA adında, sakin, zeki ve hafif esprili bir kişisel sesli asistansın. " +
    'Kullanıcıya "sen" diye hitap et ve her zaman Türkçe cevap ver. ' +
    "Cevapların sesli okunacak: kısa tut (genelde 1-3 cümle), markdown, liste ve emoji kullanma; sayıları ve birimleri okunur biçimde yaz. " +
    "Telefonda iş yapmak için araçların var: zamanlayıcı, hatırlatıcı, hava durumu, rehberden arama, fener ve hafıza. " +
    "Kullanıcı bunlardan birini istediğinde aracı kullan, sonra ne yaptığını tek cümleyle söyle. " +
    "Kullanıcı kendisi hakkında kalıcı bir bilgi verirse (adı, sevdiği şeyler, önemli kişiler) hatırla aracıyla kaydet. " +
    "Her kullanıcı mesajının başında köşeli parantez içinde o anki tarih ve saat var; zaman hesaplarını buna göre yap. " +
    "Bilmediğin şeyi uydurma." +
    hafiza
  );
}

export const zamanEtiketi = () =>
  "[" + new Date().toLocaleString("tr-TR", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) + "]";

export class AnahtarYok extends Error {}

/**
 * Kullanıcı mesajını sohbete ekler, cevabı akış halinde üretir, araç çağrılarını çalıştırır.
 * Sohbet yalnızca sona eklenerek büyür (geçmiş düzenlenmez). Hata olursa bu turda eklenenler geri alınır.
 */
export async function sor(
  apiKey: string,
  sohbet: SohbetDurumu,
  metin: string,
  bag: AracBaglami,
  akis: (metin: string) => void,
): Promise<string> {
  if (!apiKey) throw new AnahtarYok();
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true, fetch: expoFetch as unknown as typeof fetch });
  const baslangic = sohbet.mesajlar.length;
  sohbet.mesajlar.push({ role: "user", content: `${zamanEtiketi()}\n${metin}` });

  let onceki = "";
  try {
    for (let tur = 0; tur < 6; tur++) {
      const stream = client.beta.messages.stream({
        model: "claude-haiku-5-5", // en ucuz model
        max_tokens: 4096,
        output_config: { effort: "low" }, // sesli sohbet: hızlı ve kısa
        system: sohbet.sistem,
        tools: araclar,
        messages: sohbet.mesajlar,
      });
      stream.on("text", (_delta, snapshot) => akis(onceki + snapshot));
      const yanit = await stream.finalMessage();

      if (yanit.stop_reason === "refusal") {
        sohbet.mesajlar.splice(baslangic);
        return "Bu konuda yardımcı olamıyorum, başka bir şey sorabilirsin.";
      }
      // Yanıtın tamamını (düşünme blokları dahil) olduğu gibi geri gönder.
      sohbet.mesajlar.push({ role: "assistant", content: yanit.content });
      const yazi = yanit.content
        .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");
      if (yazi) onceki = (onceki ? onceki + " " : "") + yazi.trim();

      const cagrilar = yanit.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
      if (yanit.stop_reason !== "tool_use" || cagrilar.length === 0) return onceki.trim();

      const sonuclar = await Promise.all(
        cagrilar.map(async (c): Promise<Anthropic.Beta.BetaToolResultBlockParam> => {
          try {
            const s = await araciCalistir(c.name, (c.input ?? {}) as Record<string, unknown>, bag);
            return { type: "tool_result", tool_use_id: c.id, content: JSON.stringify(s) };
          } catch (e) {
            return { type: "tool_result", tool_use_id: c.id, is_error: true, content: e instanceof Error ? e.message : "Araç çalışmadı." };
          }
        }),
      );
      sohbet.mesajlar.push({ role: "user", content: sonuclar });
    }
    return onceki.trim() || "İşlemi tamamlayamadım, tekrar dener misin?";
  } catch (e) {
    sohbet.mesajlar.splice(baslangic);
    throw e;
  }
}

export function hataMetni(e: unknown): string {
  if (e instanceof AnahtarYok) return "Cevap verebilmem için ayarlardan Anthropic API anahtarını girmen gerekiyor.";
  if (e instanceof Anthropic.AuthenticationError) return "API anahtarı geçersiz görünüyor. Ayarlardan kontrol eder misin?";
  if (e instanceof Anthropic.RateLimitError) return "Biraz hızlı gittik. Birkaç saniye sonra tekrar dene.";
  if (e instanceof Anthropic.APIConnectionError) return "İnternete ulaşamadım. Bağlantını kontrol et.";
  if (e instanceof Anthropic.APIError) return `Sunucu hata verdi (${e.status}). Tekrar dener misin?`;
  return "Bir sorun çıktı. Tekrar dener misin?";
}
