CREATE TABLE IF NOT EXISTS episode_favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  episode_key TEXT NOT NULL,
  title TEXT NOT NULL,
  podcast_title TEXT NOT NULL,
  cover_image_url TEXT,
  link TEXT,
  enclosure_url TEXT,
  pub_date TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE,
  FOREIGN KEY (source_id) REFERENCES rss_sources(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_episode_favorites_user_created
  ON episode_favorites(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_episode_favorites_user_source_episode
  ON episode_favorites(user_id, source_id, episode_key);
