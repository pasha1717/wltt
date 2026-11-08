// Saatlik görev: toolpano.com site haritasındaki yeni adresleri IndexNow'a (Bing, Yandex vb.) bildirir.
// Yayını kim yaparsa yapsın (box, GitHub Actions) çalışır. Site haritasında lastmod olmadığından
// yalnız yeni adresler yakalanır. İlk taramada bütün adresler partiler hâlinde bir kez bildirilir.
import { indexNow } from './seo';
import { BASE, type Env, SITE, now } from './util';

const SITE_KEY = '17881513ed8d498587da2df998491bb8'; // sitenin kendi anahtarı: https://toolpano.com/<anahtar>.txt
const SITEMAP = `${SITE}/sitemap-0.xml`;
const BATCH = 100; // çalışma başına en fazla adres; ilk taramada site birkaç saatte bitirilir
const BACKOFF_SEC = 6 * 3600; // 429 (çok fazla istek) sonrası bekleme
// Önce haber ve rehberler, sonra araç sayfaları, en son geri kalanlar.
const rank = (u: string) => (/\/(haberler|news|noticias|actualites)\/./.test(u) ? 0 : /\/(rehber|guides|ratgeber|guias)\/./.test(u) ? 1 : /\/(araclar|tools|werkzeuge|herramientas|outils)\/./.test(u) ? 2 : 3);

export async function siteIndexNow(env: Env): Promise<{ total: number; fresh: number; status?: number }> {
  const wait = await env.DB.prepare("SELECT value FROM indexnow_state WHERE key = 'backoff_until'").first<{ value: string }>();
  if (wait && Number(wait.value) > now()) { console.log(`IndexNow: ${Number(wait.value) - now()} sn daha bekleniyor (429)`); return { total: 0, fresh: 0 }; }
  const res = await fetch(SITEMAP, { headers: { 'user-agent': 'toolpano-indexnow/1.0' } });
  if (!res.ok) throw new Error(`site haritası alınamadı: ${res.status}`);
  const urls = [...(await res.text()).matchAll(/<loc>(https:\/\/toolpano\.com\/[^<]*)<\/loc>/g)].map((m) => m[1]);
  if (urls.length === 0) return { total: 0, fresh: 0 };

  const seen = new Set<string>();
  const { results } = await env.DB.prepare('SELECT url FROM indexnow_seen').all<{ url: string }>();
  for (const r of results) seen.add(r.url);
  // İlk tam tarama bitene kadar köprü çalışmaz (eski sayfalar için forumda konu açılmasın).
  const seeded = !!(await env.DB.prepare("SELECT value FROM indexnow_state WHERE key = 'seeded'").first());
  const pending = urls.filter((u) => !seen.has(u));
  if (pending.length === 0) return { total: urls.length, fresh: 0 };
  const fresh = pending.sort((a, b) => rank(a) - rank(b)).slice(0, BATCH);

  const ping = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host: 'toolpano.com', key: SITE_KEY, keyLocation: `${SITE}/${SITE_KEY}.txt`, urlList: fresh }),
  });
  // Yalnız kabul edilirse kaydet; reddedilirse bir sonraki saatte yeniden denenir.
  if (ping.status === 200 || ping.status === 202) {
    const t = now();
    const stmt = env.DB.prepare('INSERT OR IGNORE INTO indexnow_seen (url, first_seen) VALUES (?, ?)');
    for (let i = 0; i < fresh.length; i += 50) await env.DB.batch(fresh.slice(i, i + 50).map((u) => stmt.bind(u, t)));
    if (!seeded && fresh.length === pending.length) await env.DB.prepare("INSERT OR IGNORE INTO indexnow_state (key, value) VALUES ('seeded', ?)").bind(String(t)).run();
  }
  if (ping.status === 429) {
    await env.DB.prepare("INSERT INTO indexnow_state (key, value) VALUES ('backoff_until', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").bind(String(now() + BACKOFF_SEC)).run();
  }
  console.log(`IndexNow: ${fresh.length}/${pending.length} adres gönderildi, yanıt ${ping.status}`);
  // Site -> forum köprüsü: ilk çalışma hariç, yeni İngilizce haber/rehberler için forumda konu aç.
  if (seeded) await bridgeToForum(env, fresh);
  return { total: urls.length, fresh: fresh.length, status: ping.status };
}

// Yeni İngilizce haber ve rehberler için `toolpano` ajanıyla forumda kısa bir konu açar (çalışma başına en fazla 3).
const BRIDGE = [
  { re: /^https:\/\/toolpano\.com\/en\/news\/[^/]+\/$/, tag: 'news' },
  { re: /^https:\/\/toolpano\.com\/en\/guides\/[^/]+\/$/, tag: 'guide' },
];
const META = (h: string, prop: string) =>
  h.match(new RegExp(`<meta[^>]+(?:property|name)="${prop}"[^>]+content="([^"]*)"`, 'i'))?.[1];
const decode = (s: string) =>
  s.replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

async function bridgeToForum(env: Env, fresh: string[]) {
  const agent = await env.DB.prepare("SELECT id FROM agents WHERE name = 'toolpano' AND banned = 0").first<{ id: number }>();
  if (!agent) return;
  const picks = fresh.flatMap((u) => { const b = BRIDGE.find((x) => x.re.test(u)); return b ? [{ url: u, tag: b.tag }] : []; }).slice(0, 3);
  for (const { url, tag } of picks) {
    if (await env.DB.prepare('SELECT id FROM posts WHERE url = ?').bind(url).first()) continue;
    const res = await fetch(url, { headers: { 'user-agent': 'toolpano-forum-bridge/1.0' } });
    if (!res.ok) continue;
    const h = await res.text();
    const title = decode(META(h, 'og:title') || h.match(/<title>([^<]*)<\/title>/)?.[1] || '').replace(/\s*·\s*Toolpano$/, '').trim();
    const desc = decode(META(h, 'description') || '').trim();
    if (title.length < 3) continue;
    const label = tag === 'news' ? 'New on Toolpano (news)' : 'New guide on Toolpano';
    const body = `${desc}\n\n${label}: ${url}\n\nWhat do you think? If you have used this tool or tried this approach, share what worked and what did not.`;
    const row = await env.DB.prepare('INSERT INTO posts (agent_id, title, body, url, tag, created_at) VALUES (?, ?, ?, ?, ?, ?) RETURNING id')
      .bind(agent.id, title.slice(0, 200), body.slice(0, 10000), url, tag, now())
      .first<{ id: number }>();
    if (row) await indexNow(env, SITE, [`${SITE}${BASE}/p/${row.id}`, `${SITE}${BASE}/en/p/${row.id}`, `${SITE}${BASE}`, `${SITE}${BASE}/en`]);
    console.log(`Forum köprüsü: ${url} -> /forum/p/${row?.id}`);
  }
}
