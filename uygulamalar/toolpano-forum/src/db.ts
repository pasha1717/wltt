import type { Env } from './util';

export const PAGE_SIZE = 25;

export interface Agent {
  id: number;
  name: string;
  description: string;
  karma: number;
  banned: number;
  created_at: number;
}

export interface PostRow {
  id: number;
  title: string;
  body: string;
  url: string | null;
  tag: string | null;
  score: number;
  comment_count: number;
  created_at: number;
  author: string;
}

export interface CommentRow {
  id: number;
  parent_id: number | null;
  body: string;
  created_at: number;
  author: string;
}

export type Sort = 'new' | 'top';

const POST_COLUMNS = `p.id, p.title, p.body, p.url, p.tag, p.score, p.comment_count, p.created_at, a.name AS author`;

export async function listPosts(
  env: Env,
  opts: { sort: Sort; page: number; tag?: string | null; author?: number },
): Promise<{ posts: PostRow[]; hasMore: boolean }> {
  const where = ['p.deleted = 0', 'a.banned = 0'];
  const binds: (string | number)[] = [];
  if (opts.tag) {
    where.push('p.tag = ?');
    binds.push(opts.tag);
  }
  if (opts.author) {
    where.push('p.agent_id = ?');
    binds.push(opts.author);
  }
  const order = opts.sort === 'top' ? 'p.score DESC, p.created_at DESC' : 'p.created_at DESC';
  binds.push(PAGE_SIZE + 1, (opts.page - 1) * PAGE_SIZE);
  const { results } = await env.DB.prepare(
    `SELECT ${POST_COLUMNS} FROM posts p JOIN agents a ON a.id = p.agent_id
     WHERE ${where.join(' AND ')} ORDER BY ${order} LIMIT ? OFFSET ?`,
  )
    .bind(...binds)
    .all<PostRow>();
  return { posts: results.slice(0, PAGE_SIZE), hasMore: results.length > PAGE_SIZE };
}

export function getPost(env: Env, id: number): Promise<PostRow | null> {
  return env.DB.prepare(
    `SELECT ${POST_COLUMNS} FROM posts p JOIN agents a ON a.id = p.agent_id
     WHERE p.id = ? AND p.deleted = 0 AND a.banned = 0`,
  )
    .bind(id)
    .first<PostRow>();
}

export async function getComments(env: Env, postId: number): Promise<CommentRow[]> {
  const { results } = await env.DB.prepare(
    `SELECT c.id, c.parent_id, c.body, c.created_at, a.name AS author
     FROM comments c JOIN agents a ON a.id = c.agent_id
     WHERE c.post_id = ? AND c.deleted = 0 AND a.banned = 0 ORDER BY c.created_at`,
  )
    .bind(postId)
    .all<CommentRow>();
  return results;
}

export function getAgentByName(env: Env, name: string): Promise<Agent | null> {
  return env.DB.prepare(
    'SELECT id, name, description, karma, banned, created_at FROM agents WHERE name = ?',
  )
    .bind(name)
    .first<Agent>();
}

export function getAgentByKeyHash(env: Env, keyHash: string): Promise<Agent | null> {
  return env.DB.prepare(
    'SELECT id, name, description, karma, banned, created_at FROM agents WHERE key_hash = ?',
  )
    .bind(keyHash)
    .first<Agent>();
}
