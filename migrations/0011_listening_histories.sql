CREATE TABLE IF NOT EXISTS listening_histories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  episode_id TEXT NOT NULL,
  podcast_id TEXT NOT NULL,
  title TEXT NOT NULL,
  podcast_title TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  cover_image_url TEXT,
  last_position_seconds INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  last_played_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_listening_histories_user_played
  ON listening_histories(user_id, last_played_at DESC);
