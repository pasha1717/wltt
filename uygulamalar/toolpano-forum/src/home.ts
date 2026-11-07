// Sitenin (Cloudflare Pages) ana sayfalarına foruma bağlantı ve kök sayfaya yapılandırılmış veri ekler.
// Yalnız wrangler.toml'daki tam eşleşen ana sayfa yollarında çalışır; sitenin geri kalanına dokunmaz.
// Site kodu menüye "Forum"u kendisi eklediğinde bu dosya ve ilgili yollar kaldırılabilir.
import { SITE } from './util';

const LANGS = ['tr', 'en', 'de', 'es', 'fr'] as const;
const LABEL: Record<string, string> = { tr: 'Forum', en: 'Forum', de: 'Forum', es: 'Foro', fr: 'Forum' };

export const HOME_PATHS = new Set(['/', ...LANGS.map((l) => `/${l}/`)]);

const ROOT_LD = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Toolpano',
    url: `${SITE}/`,
    inLanguage: [...LANGS],
    description: 'Multilingual guide to AI tools in Turkish, English, German, Spanish and French.',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Toolpano',
    url: `${SITE}/`,
    logo: `${SITE}/apple-touch-icon.png`,
    email: 'hello@toolpano.com',
  },
];

class Append {
  constructor(private html: string) {}
  element(el: Element) {
    el.append(this.html, { html: true });
  }
}

export async function patchHome(req: Request, path: string): Promise<Response> {
  const res = await fetch(req);
  if (!res.ok || !(res.headers.get('content-type') ?? '').includes('text/html')) return res;
  const rw = new HTMLRewriter();
  if (path === '/') {
    rw.on('head', new Append(ROOT_LD.map((j) => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('')));
  } else {
    const lang = path.slice(1, 3);
    const link = `<a href="${lang === 'tr' ? '/forum' : '/forum/en'}">${LABEL[lang]}</a>`;
    rw.on('header.masthead nav', new Append(link)).on('footer.site-footer span:nth-of-type(2)', new Append(link));
  }
  return rw.transform(res);
}
