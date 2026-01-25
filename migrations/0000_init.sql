-- Initial migration for poddock
-- Creates all tables based on ER diagram

-- AdminUser - 管理者ユーザー
CREATE TABLE IF NOT EXISTS admin_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- Asset - 音声/画像ファイル
CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('audio', 'image')),
  storage_provider TEXT NOT NULL,
  storage_bucket TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  public_url TEXT NOT NULL,
  content_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  checksum TEXT,
  created_at TEXT NOT NULL
);

-- FeedToken - 非公開RSS用トークン
CREATE TABLE IF NOT EXISTS feed_tokens (
  id TEXT PRIMARY KEY,
  podcast_id TEXT NOT NULL UNIQUE,
  token TEXT NOT NULL UNIQUE,
  revoked_at TEXT,
  created_at TEXT NOT NULL
);

-- Podcast - 番組
CREATE TABLE IF NOT EXISTS podcasts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  language TEXT NOT NULL,
  category TEXT NOT NULL,
  author_name TEXT,
  contact_email TEXT,
  explicit INTEGER NOT NULL DEFAULT 0,
  visibility TEXT NOT NULL DEFAULT 'private' CHECK (visibility IN ('public', 'private')),
  cover_image_asset_id TEXT REFERENCES assets(id),
  private_feed_token_id TEXT REFERENCES feed_tokens(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Episode - エピソード
CREATE TABLE IF NOT EXISTS episodes (
  id TEXT PRIMARY KEY,
  podcast_id TEXT NOT NULL REFERENCES podcasts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TEXT,
  audio_asset_id TEXT REFERENCES assets(id),
  duration_seconds INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- DistributionTarget - 配信先マスタ
CREATE TABLE IF NOT EXISTS distribution_targets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  submit_url TEXT NOT NULL,
  created_at TEXT NOT NULL
);

-- DistributionStatus - 番組×配信先のステータス
CREATE TABLE IF NOT EXISTS distribution_statuses (
  id TEXT PRIMARY KEY,
  podcast_id TEXT NOT NULL REFERENCES podcasts(id) ON DELETE CASCADE,
  target_id TEXT NOT NULL REFERENCES distribution_targets(id),
  status TEXT NOT NULL DEFAULT 'not_submitted' CHECK (status IN ('not_submitted', 'submitted', 'live', 'needs_attention')),
  note TEXT,
  last_checked_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_episodes_podcast_id ON episodes(podcast_id);
CREATE INDEX IF NOT EXISTS idx_distribution_statuses_podcast_id ON distribution_statuses(podcast_id);
CREATE INDEX IF NOT EXISTS idx_feed_tokens_token ON feed_tokens(token);
