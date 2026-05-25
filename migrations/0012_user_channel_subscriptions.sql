CREATE TABLE IF NOT EXISTS user_channel_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  source_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE,
  FOREIGN KEY (source_id) REFERENCES rss_sources(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_channel_subscriptions_user_source
  ON user_channel_subscriptions(user_id, source_id);

CREATE INDEX IF NOT EXISTS idx_user_channel_subscriptions_user
  ON user_channel_subscriptions(user_id, created_at DESC);
