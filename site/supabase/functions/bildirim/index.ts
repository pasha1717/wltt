// Denk e-posta bildirimleri (Supabase Edge Function).
// Veritabanı webhook'u "ilgi" ve "mesaj" tablolarına satır eklenince bu fonksiyonu çağırır.
// Kişi o an sitede açıksa ya da yakın zamanda aynı bildirimi aldıysa e-posta gönderilmez.
//
// Gerekli gizli değişkenler (supabase secrets set ...):
//   RESEND_API_KEY   Resend API anahtarı
//   BILDIRIM_FROM    Gönderen, ör. "Denk <bildirim@alanadiniz.com>" (Resend'de doğrulanmış alan adı)
//   SITE_URL         ör. https://denk-x.vercel.app
//   WEBHOOK_SECRET   Webhook'a eklenen x-webhook-secret başlığıyla aynı uzun rastgele metin
// SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY Supabase tarafından otomatik verilir.

type Ortam = Record<string, string | undefined>;
type Kayit = { from_id: string; to_id: string; metin?: string };
type Sonuc = { gonderildi: boolean; sebep: string };

const CEVRIMICI_DK = 5;        // son 5 dakikada sitede açıksa e-posta yok
const SUSKUN_SAAT = { ilgi: 24, karsilikli: 24, mesaj: 6 }; // aynı kişiden aynı türde tekrar için bekleme

export async function isle(govde: any, env: Ortam, f: typeof fetch = fetch, simdi = Date.now()): Promise<Sonuc> {
  const tablo = govde?.table, k: Kayit = govde?.record;
  if (govde?.type !== "INSERT" || !k?.to_id || !k?.from_id || !["ilgi", "mesaj"].includes(tablo)) return { gonderildi: false, sebep: "ilgisiz olay" };

  const rest = async (yol: string, init: RequestInit = {}) => {
    const r = await f(`${env.SUPABASE_URL}${yol}`, { ...init, headers: {
      apikey: env.SUPABASE_SERVICE_ROLE_KEY!, Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json", ...(init.headers || {}) } });
    if (!r.ok) throw new Error(`${yol} -> ${r.status}`);
    return r.status === 204 ? null : r.json();
  };

  const [alici, gonderen] = await Promise.all([k.to_id, k.from_id].map(id =>
    rest(`/rest/v1/profiles?id=eq.${id}&select=id,ad,eposta_bildirim,son_gorulme,askida`).then((d: any[]) => d[0])));
  if (!alici || !gonderen) return { gonderildi: false, sebep: "profil yok" };
  if (!alici.eposta_bildirim) return { gonderildi: false, sebep: "bildirim kapalı" };
  if (gonderen.askida) return { gonderildi: false, sebep: "gönderen askıda" };
  if (alici.son_gorulme && simdi - Date.parse(alici.son_gorulme) < CEVRIMICI_DK * 60e3) return { gonderildi: false, sebep: "çevrimiçi" };

  // Engel varsa bildirme
  const engel = await rest(`/rest/v1/engel?or=(and(from_id.eq.${k.to_id},to_id.eq.${k.from_id}),and(from_id.eq.${k.from_id},to_id.eq.${k.to_id}))&select=from_id`);
  if (engel.length) return { gonderildi: false, sebep: "engel" };

  let tur: "ilgi" | "karsilikli" | "mesaj" = "mesaj";
  if (tablo === "ilgi") {
    const geri = await rest(`/rest/v1/ilgi?from_id=eq.${k.to_id}&to_id=eq.${k.from_id}&select=from_id`);
    tur = geri.length ? "karsilikli" : "ilgi";
  }

  const esik = new Date(simdi - SUSKUN_SAAT[tur] * 36e5).toISOString();
  const onceki = await rest(`/rest/v1/bildirim_log?to_id=eq.${k.to_id}&from_id=eq.${k.from_id}&tur=eq.${tur}&zaman=gt.${encodeURIComponent(esik)}&select=id&limit=1`);
  if (onceki.length) return { gonderildi: false, sebep: "yakın zamanda bildirildi" };

  const kullanici = await rest(`/auth/v1/admin/users/${k.to_id}`);
  const eposta = kullanici?.email;
  if (!eposta) return { gonderildi: false, sebep: "e-posta yok" };

  const ad = esc(gonderen.ad), site = env.SITE_URL || "";
  const icerik = {
    ilgi:       { konu: `${gonderen.ad} sizinle ilgileniyor`, baslik: `${ad} sizinle ilgileniyor`, metin: `Profilinize göz atıp siz de ilgilenirseniz iletişim bilgileriniz karşılıklı açılır.`, link: `${site}/#eslesmeler`, dugme: "Eşleşmelerime bak" },
    karsilikli: { konu: `${gonderen.ad} ile karşılıklı ilgi`, baslik: `${ad} ile karşılıklı ilginiz var`, metin: `Artık site üzerinden yazışabilir ya da görüntülü görüşebilirsiniz.`, link: `${site}/#mesajlar`, dugme: "Mesaj yaz" },
    mesaj:      { konu: `${gonderen.ad} size mesaj gönderdi`, baslik: `${ad} size mesaj gönderdi`, metin: `“${esc(kisalt(k.metin || "", 140))}”`, link: `${site}/#mesajlar`, dugme: "Mesajı oku" },
  }[tur];

  const r = await f("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.BILDIRIM_FROM, to: [eposta], subject: icerik.konu, html: sablon(icerik, site) }),
  });
  if (!r.ok) throw new Error(`Resend -> ${r.status} ${await r.text()}`);

  await rest(`/rest/v1/bildirim_log`, { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify({ to_id: k.to_id, from_id: k.from_id, tur }) });
  return { gonderildi: true, sebep: tur };
}

function esc(s: string) { return String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" } as any)[c]); }
function kisalt(s: string, n: number) { return s.length > n ? s.slice(0, n - 1) + "…" : s; }
function sablon(i: { baslik: string; metin: string; link: string; dugme: string }, site: string) {
  return `<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#22181D">
  <p style="font-size:22px;font-weight:800;margin:0 0 20px">denk<span style="color:#B3284F">.</span></p>
  <h1 style="font-size:20px;margin:0 0 12px">${i.baslik}</h1>
  <p style="font-size:16px;line-height:1.5;margin:0 0 20px">${i.metin}</p>
  <a href="${i.link}" style="display:inline-block;background:#B3284F;color:#fff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:600">${i.dugme}</a>
  <p style="font-size:12px;color:#6E6068;margin:28px 0 0">Bu e-postaları almak istemiyorsanız <a href="${site}/#profil" style="color:#6E6068">Profilim</a> sayfasından kapatabilirsiniz.</p></div>`;
}

declare const Deno: any;
if (typeof Deno !== "undefined") {
  Deno.serve(async (req: Request) => {
    const env = Deno.env.toObject();
    if (!env.WEBHOOK_SECRET || req.headers.get("x-webhook-secret") !== env.WEBHOOK_SECRET) return new Response("yetkisiz", { status: 401 });
    try {
      const s = await isle(await req.json(), env);
      return Response.json(s);
    } catch (e) {
      console.error(e);
      return new Response(String(e), { status: 500 });
    }
  });
}
