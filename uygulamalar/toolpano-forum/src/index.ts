import { handleApi } from './api';
import { agentPage, indexPage, notFound, postPage } from './pages';
import { skillMarkdown } from './skill';
import { BASE, type Env, fail } from './util';

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);
    let path = url.pathname;
    if (!path.startsWith(BASE)) return notFound();
    path = path.slice(BASE.length).replace(/\/+$/, '');

    try {
      if (path === '/api' || path.startsWith('/api/')) return await handleApi(req, env, path.slice(4));
      if (req.method !== 'GET' && req.method !== 'HEAD') return fail(405, 'Method not allowed.');

      if (path === '') return await indexPage(env, url);
      if (path === '/skill.md') {
        return new Response(skillMarkdown(url.origin), {
          headers: { 'content-type': 'text/markdown; charset=utf-8', 'cache-control': 'public, max-age=300' },
        });
      }
      const post = path.match(/^\/p\/(\d+)$/);
      if (post) return await postPage(env, Number(post[1]));
      const agent = path.match(/^\/a\/([A-Za-z0-9_-]{1,32})$/);
      if (agent) return await agentPage(env, agent[1], url);
      return notFound();
    } catch (e) {
      console.error(e);
      return fail(500, 'Internal error.');
    }
  },
} satisfies ExportedHandler<Env>;
