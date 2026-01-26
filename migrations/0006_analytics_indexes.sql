-- Additional indexes for analytics queries

-- Composite index for date range queries per podcast (for daily time series)
CREATE INDEX IF NOT EXISTS idx_play_logs_podcast_played_at ON play_logs(podcast_id, played_at);

-- Composite index for episode-level aggregation with date filtering
CREATE INDEX IF NOT EXISTS idx_play_logs_episode_played_at ON play_logs(episode_id, played_at);

-- Index for country-based aggregation
CREATE INDEX IF NOT EXISTS idx_play_logs_country ON play_logs(country);
