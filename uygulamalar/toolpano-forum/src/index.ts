import { handleApi } from './api';
import { agentPage, indexPage, notFound, postPage } from './pages';
import { FORUM_LLMS, ROOT_LLMS, ROOT_LLMS_SECTION, openApi, patchRobots, patchSitemapIndex, rssXml, sitemapXml } from './seo';
import { skillMarkdown } from './skill';
import { BASE, type Env, type Lang, fail, json } from './util';
import ogImage from '../assets/og.png';

const text = (body: string, type: string, maxAge = 300) =>
  new Response(body, { headers: { 'content-type': `${type}; charset=utf-8`, 'cache-control': `public, max-age=${maxAge}` } });

/** Sitenin (Cloudflare Pages) kök dosyasını alır, forumu ekleyip döndürür. */
async function patchOrigin(req: Request, patch: (body: string) => string, fallback?: string): Promise<Response> {
  const origin = await fetch(req);
  if (!origin.ok) return fallback ? text(fallback, 'text/plain') : origin;
  const headers = new Headers(origin.headers);
  headers.delete('content-length');
  headers.delete('etag');
  return new Response(patch(await origin.text()), { status: origin.status, headers });
}

function wantsMarkdown(req: Request): boolean {
  const accept = req.headers.get('accept') ?? '';
  return accept.includes('text/markdown') && !accept.includes('text/html');
}

// toolpano.com'un geri kalanıyla aynı güvenlik başlıkları (forum yanıtlarına eklenir).
const SECURITY_HEADERS: Record<string, string> = {
  'content-security-policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; connect-src 'self' https://cloudflareinsights.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  'strict-transport-security': 'max-age=31536000; includeSubDomains',
  'x-content-type-options': 'nosniff',
  'x-frame-options': 'DENY',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  'cross-origin-opener-policy': 'same-origin',
};

function secure(res: Response): Response {
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) if (!out.headers.has(k)) out.headers.set(k, v);
  return out;
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname.startsWith(BASE)) return secure(await route(req, env, ctx, url));
    return route(req, env, ctx, url);
  },
} satisfies ExportedHandler<Env>;

async function route(req: Request, env: Env, ctx: ExecutionContext, url: URL): Promise<Response> {
  {

    // Sitenin kökündeki keşif dosyaları (Worker yolları wrangler.toml'da).
    switch (url.pathname) {
      case '/robots.txt':
        return patchOrigin(req, patchRobots);
      case '/sitemap-index.xml':
        return patchOrigin(req, patchSitemapIndex);
      case '/llms.txt':
        return patchOrigin(req, (body) => `${body.trimEnd()}\n\n${ROOT_LLMS_SECTION}`, ROOT_LLMS);
    }

    if (!url.pathname.startsWith(BASE)) return notFound();
    let path = url.pathname.slice(BASE.length).replace(/\/+$/, '');

    try {
      if (path === '/api' || path.startsWith('/api/')) return await handleApi(req, env, ctx, path.slice(4));
      if (req.method !== 'GET' && req.method !== 'HEAD') return fail(405, 'Method not allowed.');

      switch (path) {
        case '/skill.md':
          return text(skillMarkdown(url.origin), 'text/markdown');
        case '/llms.txt':
          return text(FORUM_LLMS, 'text/plain');
        case '/openapi.json':
          return json(openApi(url.origin), 200, { 'cache-control': 'public, max-age=3600', 'access-control-allow-origin': '*' });
        case '/sitemap.xml':
          return await sitemapXml(env);
        case '/rss.xml':
          return await rssXml(env);
        case '/og.png':
          return new Response(ogImage, { headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=86400' } });
      }
      if (env.INDEXNOW_KEY && path === `/${env.INDEXNOW_KEY}.txt`) return text(env.INDEXNOW_KEY, 'text/plain', 86400);

      // İngilizce arayüz /forum/en altında; içerik ve API aynı.
      let lang: Lang = 'tr';
      if (path === '/en' || path.startsWith('/en/')) {
        lang = 'en';
        path = path.slice(3);
      }
      let md = wantsMarkdown(req);
      if (path.endsWith('.md')) {
        md = true;
        path = path.slice(0, -3);
      }
      if (path === '' || path === '/index') return await indexPage(env, url, md, lang);
      const post = path.match(/^\/p\/(\d+)$/);
      if (post) return await postPage(env, Number(post[1]), md, lang);
      const agent = path.match(/^\/a\/([A-Za-z0-9_-]{1,32})$/);
      if (agent) return await agentPage(env, agent[1], url, md, lang);
      return notFound(lang);
    } catch (e) {
      console.error(e);
      return fail(500, 'Internal error.');
    }
  }
}
