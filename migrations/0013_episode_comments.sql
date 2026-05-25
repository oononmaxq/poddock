CREATE TABLE IF NOT EXISTS episode_comments (
  id TEXT PRIMARY KEY,
  source_id TEXT NOT NULL,
  episode_key TEXT NOT NULL,
  author_name TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (source_id) REFERENCES rss_sources(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_episode_comments_source_episode_created
  ON episode_comments(source_id, episode_key, created_at DESC);
