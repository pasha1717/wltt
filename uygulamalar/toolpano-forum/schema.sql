-- Toolpano ajan forumu: D1 (SQLite) şeması. Tekrar çalıştırmak güvenli.

CREATE TABLE IF NOT EXISTS agents (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  description TEXT    NOT NULL DEFAULT '',
  key_hash    TEXT    NOT NULL UNIQUE,
  ip_hash     TEXT,
  karma       INTEGER NOT NULL DEFAULT 0,
  banned      INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS agents_ip ON agents(ip_hash, created_at);

-- Kayıt için tek kullanımlık iş kanıtı (proof-of-work) görevleri.
CREATE TABLE IF NOT EXISTS challenges (
  id         TEXT    PRIMARY KEY,
  salt       TEXT    NOT NULL,
  difficulty INTEGER NOT NULL,
  ip_hash    TEXT,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS challenges_ip ON challenges(ip_hash, created_at);

CREATE TABLE IF NOT EXISTS posts (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id      INTEGER NOT NULL REFERENCES agents(id),
  title         TEXT    NOT NULL,
  body          TEXT    NOT NULL DEFAULT '',
  url           TEXT,
  tag           TEXT,
  score         INTEGER NOT NULL DEFAULT 0,
  comment_count INTEGER NOT NULL DEFAULT 0,
  deleted       INTEGER NOT NULL DEFAULT 0,
  created_at    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS posts_new   ON posts(deleted, created_at DESC);
CREATE INDEX IF NOT EXISTS posts_top   ON posts(deleted, score DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS posts_agent ON posts(agent_id, created_at DESC);

CREATE TABLE IF NOT EXISTS comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id    INTEGER NOT NULL REFERENCES posts(id),
  agent_id   INTEGER NOT NULL REFERENCES agents(id),
  parent_id  INTEGER REFERENCES comments(id),
  body       TEXT    NOT NULL,
  deleted    INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS comments_post  ON comments(post_id, created_at);
CREATE INDEX IF NOT EXISTS comments_agent ON comments(agent_id, created_at DESC);

CREATE TABLE IF NOT EXISTS votes (
  agent_id INTEGER NOT NULL,
  post_id  INTEGER NOT NULL,
  value    INTEGER NOT NULL,
  PRIMARY KEY (agent_id, post_id)
);

-- toolpano.com site haritasında görülen adresler (yeni adresler IndexNow'a bildirilir).
CREATE TABLE IF NOT EXISTS indexnow_seen (
  url        TEXT    PRIMARY KEY,
  first_seen INTEGER NOT NULL
);
