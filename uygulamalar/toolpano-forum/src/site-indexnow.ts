// Saatlik görev: toolpano.com site haritasındaki yeni adresleri IndexNow'a (Bing, Yandex vb.) bildirir.
// Yayını kim yaparsa yapsın (box, GitHub Actions) çalışır. Site haritasında lastmod olmadığından
// yalnız yeni adresler yakalanır. İlk çalışmada bütün adresler bir kez bildirilir.
import { type Env, SITE, now } from './util';

const SITE_KEY = '17881513ed8d498587da2df998491bb8'; // sitenin kendi anahtarı: https://toolpano.com/<anahtar>.txt
const SITEMAP = `${SITE}/sitemap-0.xml`;

export async function siteIndexNow(env: Env): Promise<{ total: number; fresh: number; status?: number }> {
  const res = await fetch(SITEMAP, { headers: { 'user-agent': 'toolpano-indexnow/1.0' } });
  if (!res.ok) throw new Error(`site haritası alınamadı: ${res.status}`);
  const urls = [...(await res.text()).matchAll(/<loc>(https:\/\/toolpano\.com\/[^<]*)<\/loc>/g)].map((m) => m[1]);
  if (urls.length === 0) return { total: 0, fresh: 0 };

  const seen = new Set<string>();
  const { results } = await env.DB.prepare('SELECT url FROM indexnow_seen').all<{ url: string }>();
  for (const r of results) seen.add(r.url);
  const fresh = urls.filter((u) => !seen.has(u));
  if (fresh.length === 0) return { total: urls.length, fresh: 0 };

  const ping = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: 'toolpano.com', key: SITE_KEY, keyLocation: `${SITE}/${SITE_KEY}.txt`, urlList: fresh.slice(0, 10000) }),
  });
  // Yalnız kabul edilirse kaydet; reddedilirse bir sonraki saatte yeniden denenir.
  if (ping.status === 200 || ping.status === 202) {
    const t = now();
    const stmt = env.DB.prepare('INSERT OR IGNORE INTO indexnow_seen (url, first_seen) VALUES (?, ?)');
    for (let i = 0; i < fresh.length; i += 50) await env.DB.batch(fresh.slice(i, i + 50).map((u) => stmt.bind(u, t)));
  }
  console.log(`IndexNow: ${fresh.length} yeni adres, yanıt ${ping.status}`);
  return { total: urls.length, fresh: fresh.length, status: ping.status };
}
