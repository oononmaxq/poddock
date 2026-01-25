import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// AdminUser - 管理者ユーザー
export const adminUsers = sqliteTable('admin_users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: text('created_at').notNull(),
});

// Asset - 音声/画像ファイル
export const assets = sqliteTable('assets', {
  id: text('id').primaryKey(),
  type: text('type', { enum: ['audio', 'image'] }).notNull(),
  storageProvider: text('storage_provider').notNull(),
  storageBucket: text('storage_bucket').notNull(),
  storageKey: text('storage_key').notNull(),
  publicUrl: text('public_url').notNull(),
  contentType: text('content_type').notNull(),
  byteSize: integer('byte_size').notNull(),
  checksum: text('checksum'),
  createdAt: text('created_at').notNull(),
});

// FeedToken - 非公開RSS用トークン
export const feedTokens = sqliteTable('feed_tokens', {
  id: text('id').primaryKey(),
  podcastId: text('podcast_id').notNull().unique(),
  token: text('token').notNull().unique(),
  revokedAt: text('revoked_at'),
  createdAt: text('created_at').notNull(),
});

// Podcast - 番組
export const podcasts = sqliteTable('podcasts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  language: text('language').notNull(),
  category: text('category').notNull(),
  authorName: text('author_name'),
  contactEmail: text('contact_email'),
  explicit: integer('explicit', { mode: 'boolean' }).notNull().default(false),
  podcastType: text('podcast_type', { enum: ['episodic', 'serial'] }).notNull().default('episodic'),
  visibility: text('visibility', { enum: ['public', 'private'] }).notNull().default('private'),
  coverImageAssetId: text('cover_image_asset_id').references(() => assets.id),
  privateFeedTokenId: text('private_feed_token_id').references(() => feedTokens.id),
  themeColor: text('theme_color').default('#6366f1'),
  themeMode: text('theme_mode', { enum: ['light', 'dark'] }).default('light'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Episode - エピソード
export const episodes = sqliteTable('episodes', {
  id: text('id').primaryKey(),
  podcastId: text('podcast_id')
    .notNull()
    .references(() => podcasts.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status', { enum: ['draft', 'published'] }).notNull().default('draft'),
  publishedAt: text('published_at'),
  audioAssetId: text('audio_asset_id').references(() => assets.id),
  durationSeconds: integer('duration_seconds'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// DistributionTarget - 配信先マスタ（Apple/Spotify/Amazon）
export const distributionTargets = sqliteTable('distribution_targets', {
  id: text('id').primaryKey(), // 'apple' | 'spotify' | 'amazon'
  name: text('name').notNull(),
  submitUrl: text('submit_url').notNull(),
  createdAt: text('created_at').notNull(),
});

// DistributionStatus - 番組×配信先のステータス
export const distributionStatuses = sqliteTable('distribution_statuses', {
  id: text('id').primaryKey(),
  podcastId: text('podcast_id')
    .notNull()
    .references(() => podcasts.id, { onDelete: 'cascade' }),
  targetId: text('target_id')
    .notNull()
    .references(() => distributionTargets.id),
  status: text('status', {
    enum: ['not_submitted', 'submitted', 'live', 'needs_attention'],
  })
    .notNull()
    .default('not_submitted'),
  note: text('note'),
  lastCheckedAt: text('last_checked_at'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

// Type exports for use in application layer
export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;

export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;

export type FeedToken = typeof feedTokens.$inferSelect;
export type NewFeedToken = typeof feedTokens.$inferInsert;

export type Podcast = typeof podcasts.$inferSelect;
export type NewPodcast = typeof podcasts.$inferInsert;

export type Episode = typeof episodes.$inferSelect;
export type NewEpisode = typeof episodes.$inferInsert;

export type DistributionTarget = typeof distributionTargets.$inferSelect;
export type NewDistributionTarget = typeof distributionTargets.$inferInsert;

export type DistributionStatus = typeof distributionStatuses.$inferSelect;
export type NewDistributionStatus = typeof distributionStatuses.$inferInsert;
