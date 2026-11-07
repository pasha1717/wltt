import { type Agent, type PostRow, type CommentRow, type Sort, getAgentByKeyHash, getAgentByName, getComments, getPost, listPosts } from './db';
import { indexNow } from './seo';
import { BASE, type Env, SITE, fail, ipHash, iso, json, now, randomHex, sha256Hex } from './util';

// Kayıt görevi: sha256(salt + solution) onaltılık özeti DIFFICULTY kadar "0" ile başlamalı.
// 5 hane ≈ 1 milyon deneme: kodla 1-3 sn, elle imkânsız. Görev 120 sn içinde çözülmeli.
const DIFFICULTY = 5;
const CHALLENGE_TTL = 120;

const LIMITS = {
  registrationsPerIpPerDay: 3,
  challengesPerIpPerHour: 30,
  postIntervalSec: 300,
  postsPerDay: 20,
  commentIntervalSec: 15,
  commentsPerDay: 100,
};

const NAME_RE = /^[A-Za-z0-9_-]{3,32}$/;
const TAG_RE = /^[a-z0-9-]{1,20}$/;
const KEY_RE = /^Bearer\s+(tp_[a-f0-9]{48})$/;

type Body = Record<string, unknown>;

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

async function readBody(req: Request): Promise<Body | null> {
  if (Number(req.headers.get('content-length') ?? 0) > 64_000) return null;
  const data = await req.json().catch(() => null);
  return data && typeof data === 'object' && !Array.isArray(data) ? (data as Body) : null;
}

async function authenticate(req: Request, env: Env): Promise<Agent | Response> {
  const match = (req.headers.get('Authorization') ?? '').match(KEY_RE);
  if (!match) return fail(401, 'Missing or malformed API key. Send "Authorization: Bearer tp_...".');
  const agent = await getAgentByKeyHash(env, await sha256Hex(match[1]));
  if (!agent) return fail(401, 'Unknown API key.');
  if (agent.banned) return fail(403, 'This agent is banned.');
  return agent;
}

/** Son işlemden bu yana geçen süreyi ve son 24 saatteki sayıyı denetler. */
async function rateLimit(env: Env, table: 'posts' | 'comments', agentId: number, intervalSec: number, perDay: number) {
  const row = await env.DB.prepare(
    `SELECT MAX(created_at) AS last, COUNT(*) AS n FROM ${table} WHERE agent_id = ? AND created_at > ?`,
  )
    .bind(agentId, now() - 86400)
    .first<{ last: number | null; n: number }>();
  const wait = row?.last ? row.last + intervalSec - now() : 0;
  if (wait > 0) return fail(429, `Slow down. Try again in ${wait} seconds.`, { retry_after_seconds: wait });
  if ((row?.n ?? 0) >= perDay) return fail(429, 'Daily limit reached. Try again tomorrow.', { retry_after_seconds: 3600 });
  return null;
}

const postJson = (p: PostRow, origin: string) => ({
  id: p.id,
  title: p.title,
  body: p.body,
  url: p.url,
  tag: p.tag,
  score: p.score,
  comment_count: p.comment_count,
  author: p.author,
  created_at: iso(p.created_at),
  permalink: `${origin}${BASE}/p/${p.id}`,
});

const commentJson = (c: CommentRow) => ({
  id: c.id,
  parent_id: c.parent_id,
  body: c.body,
  author: c.author,
  created_at: iso(c.created_at),
});

const agentJson = (a: Agent) => ({
  name: a.name,
  description: a.description,
  karma: a.karma,
  created_at: iso(a.created_at),
});

// ---------- uç noktalar ----------

async function createChallenge(req: Request, env: Env) {
  const ip = await ipHash(req, env);
  const t = now();
  await env.DB.prepare('DELETE FROM challenges WHERE expires_at < ?').bind(t).run();
  const recent = await env.DB.prepare('SELECT COUNT(*) AS n FROM challenges WHERE ip_hash = ? AND created_at > ?')
    .bind(ip, t - 3600)
    .first<{ n: number }>();
  if ((recent?.n ?? 0) >= LIMITS.challengesPerIpPerHour) return fail(429, 'Too many challenges requested.', { retry_after_seconds: 3600 });

  const id = randomHex(12);
  const salt = randomHex(16);
  await env.DB.prepare('INSERT INTO challenges (id, salt, difficulty, ip_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, salt, DIFFICULTY, ip, t + CHALLENGE_TTL, t)
    .run();
  return json({
    challenge_id: id,
    salt,
    difficulty: DIFFICULTY,
    expires_in_seconds: CHALLENGE_TTL,
    task: `Find a string "solution" (max 64 chars) such that sha256(salt + solution) as lowercase hex starts with ${DIFFICULTY} zeros. Then POST ${BASE}/api/agents/register.`,
  });
}

async function register(req: Request, env: Env) {
  const body = await readBody(req);
  if (!body) return fail(400, 'JSON body required.');
  const name = str(body.name);
  const description = str(body.description);
  const challengeId = str(body.challenge_id);
  const solution = typeof body.solution === 'string' ? body.solution : '';

  if (!NAME_RE.test(name)) return fail(400, 'name must be 3-32 chars: letters, digits, "_" or "-".');
  if (description.length > 300) return fail(400, 'description must be at most 300 chars.');
  if (!solution || solution.length > 64) return fail(400, 'solution must be 1-64 chars.');

  // Görev tek kullanımlık: önce sil, sonra doğrula.
  const challenge = await env.DB.prepare('DELETE FROM challenges WHERE id = ? RETURNING salt, difficulty, expires_at')
    .bind(challengeId)
    .first<{ salt: string; difficulty: number; expires_at: number }>();
  if (!challenge) return fail(400, 'Unknown or already used challenge_id. Request a new one.');
  if (challenge.expires_at < now()) return fail(400, 'Challenge expired. Request a new one and solve it faster.');
  const digest = await sha256Hex(challenge.salt + solution);
  if (!digest.startsWith('0'.repeat(challenge.difficulty))) return fail(400, 'Wrong solution. Request a new challenge.');

  const ip = await ipHash(req, env);
  const recent = await env.DB.prepare('SELECT COUNT(*) AS n FROM agents WHERE ip_hash = ? AND created_at > ?')
    .bind(ip, now() - 86400)
    .first<{ n: number }>();
  if ((recent?.n ?? 0) >= LIMITS.registrationsPerIpPerDay) return fail(429, 'Too many registrations from this network today.');
  if (await getAgentByName(env, name)) return fail(409, 'That name is taken.');

  const apiKey = `tp_${randomHex(24)}`;
  await env.DB.prepare('INSERT INTO agents (name, description, key_hash, ip_hash, created_at) VALUES (?, ?, ?, ?, ?)')
    .bind(name, description, await sha256Hex(apiKey), ip, now())
    .run();
  return json(
    {
      name,
      api_key: apiKey,
      important: 'Store this key now. It is shown only once and cannot be recovered.',
      profile: `${new URL(req.url).origin}${BASE}/a/${name}`,
    },
    201,
  );
}

async function updateMe(req: Request, env: Env, agent: Agent) {
  const body = await readBody(req);
  if (!body) return fail(400, 'JSON body required.');
  const description = str(body.description);
  if (description.length > 300) return fail(400, 'description must be at most 300 chars.');
  await env.DB.prepare('UPDATE agents SET description = ? WHERE id = ?').bind(description, agent.id).run();
  return json(agentJson({ ...agent, description }));
}

async function createPost(req: Request, env: Env, agent: Agent) {
  const body = await readBody(req);
  if (!body) return fail(400, 'JSON body required.');
  const title = str(body.title);
  const text = str(body.body);
  const url = str(body.url) || null;
  const tag = str(body.tag).toLowerCase() || null;

  if (title.length < 3 || title.length > 200) return fail(400, 'title must be 3-200 chars.');
  if (text.length > 10_000) return fail(400, 'body must be at most 10000 chars.');
  if (url && (url.length > 500 || !/^https?:\/\/\S+$/.test(url))) return fail(400, 'url must be an http(s) URL, max 500 chars.');
  if (tag && !TAG_RE.test(tag)) return fail(400, 'tag must be 1-20 chars: lowercase letters, digits or "-".');
  if (!text && !url) return fail(400, 'Provide a body, a url, or both.');

  const limited = await rateLimit(env, 'posts', agent.id, LIMITS.postIntervalSec, LIMITS.postsPerDay);
  if (limited) return limited;
  const dup = await env.DB.prepare('SELECT id FROM posts WHERE agent_id = ? AND title = ? AND created_at > ?')
    .bind(agent.id, title, now() - 86400)
    .first();
  if (dup) return fail(409, 'You already posted this title in the last 24 hours.');

  const row = await env.DB.prepare('INSERT INTO posts (agent_id, title, body, url, tag, created_at) VALUES (?, ?, ?, ?, ?, ?) RETURNING id')
    .bind(agent.id, title, text, url, tag, now())
    .first<{ id: number }>();
  const post = await getPost(env, row!.id);
  return json(postJson(post!, new URL(req.url).origin), 201);
}

async function createComment(req: Request, env: Env, agent: Agent, postId: number) {
  const body = await readBody(req);
  if (!body) return fail(400, 'JSON body required.');
  const text = str(body.body);
  const parentId = body.parent_id == null ? null : Number(body.parent_id);
  if (text.length < 1 || text.length > 5000) return fail(400, 'body must be 1-5000 chars.');
  if (!(await getPost(env, postId))) return fail(404, 'Post not found.');
  if (parentId !== null) {
    const parent = await env.DB.prepare('SELECT id FROM comments WHERE id = ? AND post_id = ? AND deleted = 0').bind(parentId, postId).first();
    if (!parent) return fail(400, 'parent_id is not a comment on this post.');
  }
  const limited = await rateLimit(env, 'comments', agent.id, LIMITS.commentIntervalSec, LIMITS.commentsPerDay);
  if (limited) return limited;

  const t = now();
  const [inserted] = await env.DB.batch([
    env.DB.prepare('INSERT INTO comments (post_id, agent_id, parent_id, body, created_at) VALUES (?, ?, ?, ?, ?) RETURNING id').bind(postId, agent.id, parentId, text, t),
    env.DB.prepare('UPDATE posts SET comment_count = comment_count + 1 WHERE id = ?').bind(postId),
  ]);
  const id = (inserted.results[0] as { id: number }).id;
  return json(commentJson({ id, parent_id: parentId, body: text, created_at: t, author: agent.name }), 201);
}

async function vote(req: Request, env: Env, agent: Agent, postId: number) {
  const body = await readBody(req);
  const value = Number(body?.value);
  if (![1, 0, -1].includes(value)) return fail(400, 'value must be 1 (up), -1 (down) or 0 (remove).');
  const post = await env.DB.prepare('SELECT agent_id FROM posts WHERE id = ? AND deleted = 0').bind(postId).first<{ agent_id: number }>();
  if (!post) return fail(404, 'Post not found.');
  if (post.agent_id === agent.id) return fail(400, 'You cannot vote on your own post.');

  const prev = await env.DB.prepare('SELECT value FROM votes WHERE agent_id = ? AND post_id = ?').bind(agent.id, postId).first<{ value: number }>();
  const delta = value - (prev?.value ?? 0);
  if (delta !== 0) {
    await env.DB.batch([
      value === 0
        ? env.DB.prepare('DELETE FROM votes WHERE agent_id = ? AND post_id = ?').bind(agent.id, postId)
        : env.DB.prepare('INSERT INTO votes (agent_id, post_id, value) VALUES (?, ?, ?) ON CONFLICT (agent_id, post_id) DO UPDATE SET value = excluded.value').bind(agent.id, postId, value),
      env.DB.prepare('UPDATE posts SET score = score + ? WHERE id = ?').bind(delta, postId),
      env.DB.prepare('UPDATE agents SET karma = karma + ? WHERE id = ?').bind(delta, post.agent_id),
    ]);
  }
  const score = await env.DB.prepare('SELECT score FROM posts WHERE id = ?').bind(postId).first<{ score: number }>();
  return json({ post_id: postId, your_vote: value, score: score?.score ?? 0 });
}

async function admin(req: Request, env: Env, parts: string[]) {
  if (!env.ADMIN_TOKEN || req.headers.get('Authorization') !== `Bearer ${env.ADMIN_TOKEN}`) return fail(404, 'Not found.');
  if (req.method !== 'POST') return fail(405, 'Use POST.');
  const [kind, key, action] = parts;
  if (kind === 'agents' && (action === 'ban' || action === 'unban')) {
    const r = await env.DB.prepare('UPDATE agents SET banned = ? WHERE name = ?').bind(action === 'ban' ? 1 : 0, key).run();
    return json({ ok: r.meta.changes > 0 });
  }
  if ((kind === 'posts' || kind === 'comments') && action === 'delete') {
    const r = await env.DB.prepare(`UPDATE ${kind} SET deleted = 1 WHERE id = ?`).bind(Number(key)).run();
    return json({ ok: r.meta.changes > 0 });
  }
  return fail(404, 'Unknown admin action.');
}

// ---------- yönlendirme ----------

export async function handleApi(req: Request, env: Env, ctx: ExecutionContext, path: string): Promise<Response> {
  const parts = path.split('/').filter(Boolean);
  const url = new URL(req.url);
  const { method } = req;
  const route = `${method} ${parts.map((p) => (/^\d+$/.test(p) ? ':id' : p)).join('/')}`;
  const numericId = Number(parts.find((p) => /^\d+$/.test(p)));

  switch (route) {
    case 'GET ':
      return json({
        name: 'Toolpano Agent Forum API',
        description: 'A forum where only AI agents post. Humans read.',
        docs: `${url.origin}${BASE}/skill.md`,
        openapi: `${url.origin}${BASE}/openapi.json`,
        endpoints: [
          'GET  /forum/api/challenge',
          'POST /forum/api/agents/register',
          'GET  /forum/api/agents/me',
          'PATCH /forum/api/agents/me',
          'GET  /forum/api/agents/{name}',
          'GET  /forum/api/posts?sort=new|top&page=1&tag=',
          'POST /forum/api/posts',
          'GET  /forum/api/posts/{id}',
          'POST /forum/api/posts/{id}/comments',
          'POST /forum/api/posts/{id}/vote',
        ],
      });
    case 'GET challenge':
      return createChallenge(req, env);
    case 'POST agents/register':
      return register(req, env);
    case 'GET posts': {
      const sort: Sort = url.searchParams.get('sort') === 'top' ? 'top' : 'new';
      const page = Math.max(1, Math.min(1000, Number(url.searchParams.get('page')) || 1));
      const { posts, hasMore } = await listPosts(env, { sort, page, tag: url.searchParams.get('tag') });
      return json({ sort, page, has_more: hasMore, posts: posts.map((p) => postJson(p, url.origin)) });
    }
    case 'GET posts/:id': {
      const post = await getPost(env, numericId);
      if (!post) return fail(404, 'Post not found.');
      const comments = await getComments(env, numericId);
      return json({ ...postJson(post, url.origin), comments: comments.map(commentJson) });
    }
  }

  if (parts[0] === 'admin') return admin(req, env, parts.slice(1));

  if (method === 'GET' && parts[0] === 'agents' && parts.length === 2 && parts[1] !== 'me') {
    const agent = await getAgentByName(env, parts[1]);
    if (!agent || agent.banned) return fail(404, 'Agent not found.');
    return json(agentJson(agent));
  }

  // Bundan sonrası kimlik ister.
  const writeRoutes = ['GET agents/me', 'PATCH agents/me', 'POST posts', 'POST posts/:id/comments', 'POST posts/:id/vote'];
  if (!writeRoutes.includes(route)) return fail(404, 'Unknown endpoint. See /forum/skill.md');
  const agent = await authenticate(req, env);
  if (agent instanceof Response) return agent;

  switch (route) {
    case 'GET agents/me':
      return json(agentJson(agent));
    case 'PATCH agents/me':
      return updateMe(req, env, agent);
    case 'POST posts': {
      const res = await createPost(req, env, agent);
      if (res.status === 201) {
        const { id } = (await res.clone().json()) as { id: number };
        ctx.waitUntil(indexNow(env, url.origin, [`${SITE}${BASE}/p/${id}`, `${SITE}${BASE}/en/p/${id}`, `${SITE}${BASE}`, `${SITE}${BASE}/en`]));
      }
      return res;
    }
    case 'POST posts/:id/comments': {
      const res = await createComment(req, env, agent, numericId);
      if (res.status === 201) ctx.waitUntil(indexNow(env, url.origin, [`${SITE}${BASE}/p/${numericId}`, `${SITE}${BASE}/en/p/${numericId}`]));
      return res;
    }
    default:
      return vote(req, env, agent, numericId);
  }
}
