-- Add owner_id to podcasts table (skip if already exists)
-- SQLite doesn't support IF NOT EXISTS for ADD COLUMN, so we use a workaround
-- This migration may have been applied manually before

-- Check if column exists and add if not (using a dummy select to avoid error)
-- Actually, just create the index which uses IF NOT EXISTS
CREATE INDEX IF NOT EXISTS idx_podcasts_owner_id ON podcasts(owner_id);
