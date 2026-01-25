-- Add YouTube Music to distribution targets

INSERT INTO distribution_targets (id, name, submit_url, created_at) VALUES
  ('youtube', 'YouTube Music', 'https://studio.youtube.com/', '2026-01-25T00:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
