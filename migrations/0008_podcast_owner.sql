-- Add owner_id to podcasts table
ALTER TABLE podcasts ADD COLUMN owner_id TEXT REFERENCES admin_users(id);

-- Create index for owner lookup
CREATE INDEX IF NOT EXISTS idx_podcasts_owner_id ON podcasts(owner_id);
