-- Add theme customization fields to podcasts table
ALTER TABLE podcasts ADD COLUMN theme_color TEXT DEFAULT '#6366f1';
ALTER TABLE podcasts ADD COLUMN theme_mode TEXT DEFAULT 'light' CHECK(theme_mode IN ('light', 'dark'));
