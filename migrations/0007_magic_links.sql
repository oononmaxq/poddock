-- Magic link authentication

-- Magic links table for passwordless auth
CREATE TABLE IF NOT EXISTS magic_links (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL
);

-- Index for token lookup
CREATE INDEX IF NOT EXISTS idx_magic_links_token ON magic_links(token);

-- Index for cleanup of expired links
CREATE INDEX IF NOT EXISTS idx_magic_links_expires_at ON magic_links(expires_at);

-- Make password_hash optional (for existing users migrating to magic link)
-- SQLite doesn't support ALTER COLUMN, so we keep the column but allow NULL
-- New users created via magic link won't have a password
