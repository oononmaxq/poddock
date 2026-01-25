-- Add podcast_type column (episodic or serial)
ALTER TABLE podcasts ADD COLUMN podcast_type TEXT NOT NULL DEFAULT 'episodic';
