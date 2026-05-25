CREATE TABLE IF NOT EXISTS rss_sources (
  id TEXT PRIMARY KEY,
  name TEXT,
  feed_url TEXT NOT NULL UNIQUE,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO rss_sources (id, name, feed_url, is_active, created_at, updated_at)
VALUES (
  'why-are-you',
  'WHY ARE YOU？ ～プロが惚れ込むクリエーターのXXX〜',
  'https://anchor.fm/s/fbb64fd0/podcast/rss',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT(id) DO UPDATE SET
  name = excluded.name,
  feed_url = excluded.feed_url,
  is_active = excluded.is_active,
  updated_at = CURRENT_TIMESTAMP;
