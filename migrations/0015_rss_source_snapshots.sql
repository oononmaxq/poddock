CREATE TABLE IF NOT EXISTS rss_source_snapshots (
  source_id TEXT PRIMARY KEY,
  feed_title TEXT,
  feed_description TEXT,
  feed_image_url TEXT,
  feed_author TEXT,
  feed_language TEXT,
  categories_json TEXT NOT NULL DEFAULT '[]',
  episode_count INTEGER NOT NULL DEFAULT 0,
  latest_published_at TEXT,
  last_fetched_at TEXT NOT NULL,
  fetch_error TEXT,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (source_id) REFERENCES rss_sources(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_rss_source_snapshots_latest
  ON rss_source_snapshots(latest_published_at DESC);
