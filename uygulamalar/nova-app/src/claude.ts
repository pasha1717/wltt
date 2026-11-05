import Anthropic from "@anthropic-ai/sdk";

export type Mesaj = Anthropic.Beta.BetaMessageParam;

function sistem() {
  const simdi = new Date().toLocaleString("tr-TR", { dateStyle: "full", timeStyle: "short" });
  return (
    "Sen NOVA adında, sakin, zeki ve hafif esprili bir kişisel sesli asistansın. " +
    'Kullanıcıya "sen" diye hitap et ve her zaman Türkçe cevap ver. ' +
    "Cevapların sesli okunacak: kısa tut (genelde 1-3 cümle), markdown, liste ve emoji kullanma. " +
    `Bilmediğin şeyi uydurma. Şu an: ${simdi}.`
  );
}

export class AnahtarYok extends Error {}

export async function sor(apiKey: string, gecmis: Mesaj[]): Promise<string> {
  if (!apiKey) throw new AnahtarYok();
  // Anahtar kullanıcının kendi cihazında, güvenli depoda durur.
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
  const res = await client.beta.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 1024,
    output_config: { effort: "low" }, // sesli sohbet: hızlı ve kısa
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default", // güvenlik reddinde başka modelle otomatik dener
    system: sistem(),
    messages: gecmis,
  });
  if (res.stop_reason === "refusal") return "Bu konuda yardımcı olamıyorum, başka bir şey sorabilirsin.";
  return res.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

export function hataMetni(e: unknown): string {
  if (e instanceof AnahtarYok) return "Cevap verebilmem için ayarlardan Anthropic API anahtarını girmen gerekiyor.";
  if (e instanceof Anthropic.AuthenticationError) return "API anahtarı geçersiz görünüyor. Ayarlardan kontrol eder misin?";
  if (e instanceof Anthropic.RateLimitError) return "Biraz hızlı gittik. Birkaç saniye sonra tekrar dene.";
  if (e instanceof Anthropic.APIConnectionError) return "İnternete ulaşamadım. Bağlantını kontrol et.";
  if (e instanceof Anthropic.APIError) return `Sunucu hata verdi (${e.status}). Tekrar dener misin?`;
  return "Bir sorun çıktı. Tekrar dener misin?";
}
