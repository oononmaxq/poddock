-- Add plan field to admin_users and create analytics tables

-- Add plan column to admin_users (default: 'free')
ALTER TABLE admin_users ADD COLUMN plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro'));

-- PlayLog - 再生ログ（リダイレクト経由でカウント）
CREATE TABLE IF NOT EXISTS play_logs (
  id TEXT PRIMARY KEY,
  episode_id TEXT NOT NULL REFERENCES episodes(id) ON DELETE CASCADE,
  podcast_id TEXT NOT NULL REFERENCES podcasts(id) ON DELETE CASCADE,
  ip_hash TEXT,
  user_agent TEXT,
  country TEXT,
  played_at TEXT NOT NULL
);

-- MonthlyPlayStats - 月別再生統計（集計用）
CREATE TABLE IF NOT EXISTS monthly_play_stats (
  id TEXT PRIMARY KEY,
  podcast_id TEXT NOT NULL REFERENCES podcasts(id) ON DELETE CASCADE,
  year_month TEXT NOT NULL,
  play_count INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_play_logs_episode_id ON play_logs(episode_id);
CREATE INDEX IF NOT EXISTS idx_play_logs_podcast_id ON play_logs(podcast_id);
CREATE INDEX IF NOT EXISTS idx_play_logs_played_at ON play_logs(played_at);
CREATE INDEX IF NOT EXISTS idx_monthly_play_stats_podcast_id ON monthly_play_stats(podcast_id);
CREATE INDEX IF NOT EXISTS idx_monthly_play_stats_year_month ON monthly_play_stats(year_month);

-- Unique constraint for monthly stats per podcast
CREATE UNIQUE INDEX IF NOT EXISTS idx_monthly_play_stats_podcast_month ON monthly_play_stats(podcast_id, year_month);
