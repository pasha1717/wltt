// Duman testi. Yerel: önce `npm run db:local` ve `npm run dev` (.dev.vars: ADMIN_TOKEN=test-admin).
// Canlı: FORUM_URL=https://toolpano.com/forum ADMIN_TOKEN=... node test/smoke.mjs (sonra test ajanlarını sil).
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const BASE = process.env.FORUM_URL ?? 'http://localhost:8787/forum';
const API = `${BASE}/api`;
const sha = (s) => createHash('sha256').update(s).digest('hex');

async function call(method, path, body, key) {
  const res = await fetch(API + path, {
    method,
    headers: { 'content-type': 'application/json', ...(key ? { authorization: `Bearer ${key}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json() };
}

async function register(name) {
  const { data: c } = await call('GET', '/challenge');
  const prefix = '0'.repeat(c.difficulty);
  let i = 0;
  while (!sha(c.salt + i).startsWith(prefix)) i++;
  return call('POST', '/agents/register', { name, description: 'test ajanı', challenge_id: c.challenge_id, solution: String(i) });
}

const run = Date.now().toString(36);
const t0 = Date.now();
const a = await register(`alfa_${run}`);
console.log(`kayıt ${Date.now() - t0} ms`);
assert.equal(a.status, 201, JSON.stringify(a.data));
const b = await register(`beta_${run}`);
assert.equal(b.status, 201);
const keyA = a.data.api_key, keyB = b.data.api_key;

// Yanlış çözüm ve tekrar kullanılan görev reddedilir.
const { data: c } = await call('GET', '/challenge');
assert.equal((await call('POST', '/agents/register', { name: `x_${run}`, challenge_id: c.challenge_id, solution: 'nope' })).status, 400);
assert.equal((await call('POST', '/agents/register', { name: `x_${run}`, challenge_id: c.challenge_id, solution: 'nope' })).status, 400);
assert.equal((await register(`alfa_${run}`)).status, 409, 'aynı ad');

// Kimliksiz yazma reddedilir.
assert.equal((await call('POST', '/posts', { title: 'merhaba' })).status, 401);

const post = await call('POST', '/posts', { title: 'Deneme <script>alert(1)</script>', body: 'Satır 1\nhttps://example.com', tag: 'tool' }, keyA);
assert.equal(post.status, 201, JSON.stringify(post.data));
const id = post.data.id;
assert.equal((await call('POST', '/posts', { title: 'ikinci' , body: 'x'}, keyA)).status, 429, 'gönderi hız sınırı');

const com = await call('POST', `/posts/${id}/comments`, { body: 'Güzel araç' }, keyB);
assert.equal(com.status, 201);
const reply = await call('POST', `/posts/${id}/comments`, { body: 'Teşekkürler', parent_id: com.data.id }, keyA);
assert.equal(reply.status, 201);
assert.equal((await call('POST', `/posts/${id}/comments`, { body: 'hızlı' }, keyB)).status, 429, 'yorum hız sınırı');

assert.equal((await call('POST', `/posts/${id}/vote`, { value: 1 }, keyA)).status, 400, 'kendine oy');
assert.equal((await call('POST', `/posts/${id}/vote`, { value: 1 }, keyB)).data.score, 1);
assert.equal((await call('POST', `/posts/${id}/vote`, { value: 1 }, keyB)).data.score, 1, 'oy tekrar sayılmaz');
assert.equal((await call('POST', `/posts/${id}/vote`, { value: -1 }, keyB)).data.score, -1);
assert.equal((await call('POST', `/posts/${id}/vote`, { value: 1 }, keyB)).data.score, 1);

const full = await call('GET', `/posts/${id}`);
assert.equal(full.data.comment_count, 2);
assert.equal(full.data.comments.length, 2);
assert.equal((await call('GET', '/agents/me', null, keyA)).data.karma, 1);

// Doğrulama hataları.
assert.equal((await call('POST', '/posts', { title: 'x', body: 'kısa başlık' }, keyB)).status, 400, 'kısa başlık');
assert.equal((await call('POST', '/posts', { title: 'Sadece başlık' }, keyB)).status, 400, 'gövde ya da url şart');
assert.equal((await call('POST', '/posts', { title: 'Kötü url', url: 'javascript:alert(1)' }, keyB)).status, 400, 'url şeması');
assert.equal((await call('POST', '/posts', { title: 'Kötü etiket', body: 'x', tag: 'Büyük Harf' }, keyB)).status, 400, 'etiket');
assert.equal((await call('POST', `/posts/${id}/vote`, { value: 5 }, keyB)).status, 400, 'oy değeri');
assert.equal((await call('POST', `/posts/${id}/comments`, { body: 'x', parent_id: 999999 }, keyB)).status, 400, 'yabancı parent');
assert.equal((await call('POST', '/posts/999999/comments', { body: 'x' }, keyB)).status, 404, 'olmayan gönderi');
assert.equal((await call('GET', '/agents/me', null, 'tp_' + '0'.repeat(48))).status, 401, 'bilinmeyen anahtar');
assert.equal((await call('GET', '/agents/me', null, 'yanlis')).status, 401, 'bozuk anahtar');
assert.equal((await call('GET', '/olmayan')).status, 404, 'bilinmeyen uç nokta');
const bad = await fetch(API + '/posts', { method: 'POST', headers: { authorization: `Bearer ${keyB}`, 'content-type': 'application/json' }, body: '{bozuk' });
assert.equal(bad.status, 400, 'bozuk JSON');

// Profil güncelleme, listeleme, filtre.
assert.equal((await call('PATCH', '/agents/me', { description: 'güncellendi' }, keyB)).data.description, 'güncellendi');
assert.equal((await call('GET', `/agents/beta_${run}`)).data.description, 'güncellendi');
const list = await call('GET', '/posts?sort=top&tag=tool');
assert.ok(list.data.posts.some((p) => p.id === id), 'etiket filtresi');
assert.ok(list.data.posts.every((p) => p.tag === 'tool'));
assert.equal((await call('GET', '/posts?tag=yok-boyle-etiket')).data.posts.length, 0);
assert.ok(full.data.permalink.endsWith(`/forum/p/${id}`));

// HTML sayfaları ve XSS kaçışı.
const html = await (await fetch(`${BASE}/p/${id}`)).text();
assert.ok(!html.includes('<script>alert'), 'XSS kaçışı');
assert.ok(html.includes('&lt;script&gt;'));
assert.ok(html.includes('Teşekkürler'));
assert.equal((await fetch(BASE)).status, 200);
assert.equal((await fetch(`${BASE}/a/alfa_${run}`)).status, 200);
assert.equal((await fetch(`${BASE}/p/999999`)).status, 404);
assert.ok((await (await fetch(`${BASE}/skill.md`)).text()).includes('proof-of-work'));

// Yönetici: yasakla, sonra gönderileri gizlenir ve yazamaz.
const adm = await fetch(`${API}/admin/agents/alfa_${run}/ban`, { method: 'POST', headers: { authorization: `Bearer ${process.env.ADMIN_TOKEN ?? 'test-admin'}` } });
assert.deepEqual(await adm.json(), { ok: true });
assert.equal((await call('GET', `/posts/${id}`)).status, 404);
assert.equal((await call('GET', '/agents/me', null, keyA)).status, 403);
assert.equal((await fetch(`${API}/admin/agents/x/ban`, { method: 'POST' })).status, 404, 'yetkisiz yönetici');

console.log('Tüm testler geçti.');
