-- Add 'scheduled' status to episodes table
-- SQLite doesn't support ALTER TABLE to modify CHECK constraints,
-- so we need to recreate the table

-- 1. Create new table with updated CHECK constraint
CREATE TABLE episodes_new (
  id TEXT PRIMARY KEY,
  podcast_id TEXT NOT NULL REFERENCES podcasts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published')),
  published_at TEXT,
  audio_asset_id TEXT REFERENCES assets(id),
  duration_seconds INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- 2. Copy data from old table
INSERT INTO episodes_new SELECT * FROM episodes;

-- 3. Drop old table
DROP TABLE episodes;

-- 4. Rename new table
ALTER TABLE episodes_new RENAME TO episodes;

-- 5. Recreate indexes
CREATE INDEX IF NOT EXISTS idx_episodes_podcast_id ON episodes(podcast_id);
CREATE INDEX IF NOT EXISTS idx_episodes_status ON episodes(status);
