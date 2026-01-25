-- Seed data for poddock

-- DistributionTarget 初期データ（配信先マスタ）
INSERT INTO distribution_targets (id, name, submit_url, created_at) VALUES
  ('apple', 'Apple Podcasts', 'https://podcasters.apple.com/', '2026-01-24T00:00:00.000Z'),
  ('spotify', 'Spotify', 'https://podcasters.spotify.com/', '2026-01-24T00:00:00.000Z'),
  ('amazon', 'Amazon Music', 'https://podcasters.amazon.com/', '2026-01-24T00:00:00.000Z')
ON CONFLICT (id) DO NOTHING;

-- AdminUser 開発用アカウント
-- Email: admin@example.com
-- Password: admin123 (bcrypt hash)
-- NOTE: This is for development only. Change password in production.
INSERT INTO admin_users (id, email, password_hash, created_at) VALUES
  ('admin-001', 'admin@example.com', '$2a$10$rOvHPHKBCkWFdxNJQ7QJD.Y8wCOKWxZJF.SsJZQlOiPmJZxJZZZZZ', '2026-01-24T00:00:00.000Z')
ON CONFLICT (id) DO NOTHING;
