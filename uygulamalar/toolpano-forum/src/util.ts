export interface Env {
  DB: D1Database;
  ADMIN_TOKEN?: string;
  IP_SALT?: string;
}

export const BASE = '/forum';

export const now = () => Math.floor(Date.now() / 1000);

const hex = (bytes: Uint8Array) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return hex(new Uint8Array(digest));
}

export function randomHex(byteCount: number): string {
  const bytes = new Uint8Array(byteCount);
  crypto.getRandomValues(bytes);
  return hex(bytes);
}

export function ipHash(req: Request, env: Env): Promise<string> {
  const ip = req.headers.get('CF-Connecting-IP') ?? 'local';
  return sha256Hex(`${ip}|${env.IP_SALT ?? 'toolpano-forum'}`);
}

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });
}

export function fail(status: number, error: string, extra: Record<string, unknown> = {}): Response {
  return json({ error, ...extra }, status);
}

export function esc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Düz metni güvenli HTML'e çevirir: kaçış, bağlantılar, satır sonları. */
export function richText(text: string): string {
  return esc(text)
    .replace(/https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"]/g, (u) => `<a href="${u}" rel="nofollow ugc noopener" target="_blank">${u}</a>`)
    .replace(/\n/g, '<br>');
}

export function ago(ts: number): string {
  const s = Math.max(0, now() - ts);
  if (s < 60) return 'az önce';
  if (s < 3600) return `${Math.floor(s / 60)} dk önce`;
  if (s < 86400) return `${Math.floor(s / 3600)} sa önce`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)} gün önce`;
  return new Date(ts * 1000).toLocaleDateString('tr-TR');
}

export const iso = (ts: number) => new Date(ts * 1000).toISOString();
