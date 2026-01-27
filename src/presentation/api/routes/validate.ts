import { Hono } from "hono";
import { z } from "zod";
import { eq } from "drizzle-orm";
import type { AppEnv } from "../types";
import { AppError } from "../middleware/error-handler";
import { createDb } from "@infrastructure/db/client";
import { podcasts, episodes, assets } from "@infrastructure/db/schema";

const validateSchema = z.object({
  targets: z.array(z.enum(["apple", "spotify", "amazon"])).optional(),
});

interface ValidationError {
  code: string;
  message: string;
  field?: string;
  action: string;
}

interface ValidationResult {
  target: string;
  ok: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export const validateRoutes = new Hono<AppEnv>();

// Validate RSS for distribution targets
validateRoutes.post("/validate", async (c) => {
  const podcastId = c.req.param("podcastId");
  const body = await c.req.json().catch(() => ({}));
  const data = validateSchema.parse(body);

  const db = createDb(c.env.DB);

  // Get podcast with episodes
  const podcast = await db.query.podcasts.findFirst({
    where: eq(podcasts.id, podcastId),
  });

  if (!podcast) {
    throw new AppError(404, "not_found", "Podcast not found");
  }

  const podcastEpisodes = await db.query.episodes.findMany({
    where: eq(episodes.podcastId, podcastId),
  });

  const publishedEpisodes = podcastEpisodes.filter(
    (e) => e.status === "published",
  );

  const targets = data.targets || ["apple", "spotify", "amazon"];
  const results: ValidationResult[] = [];

  for (const target of targets) {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Common validations
    if (!podcast.title) {
      errors.push({
        code: "missing_title",
        message: "番組タイトルが必要です",
        field: "title",
        action: "番組設定でタイトルを入力してください",
      });
    }

    if (!podcast.description) {
      errors.push({
        code: "missing_description",
        message: "番組説明が必要です",
        field: "description",
        action: "番組設定で説明を入力してください",
      });
    }

    if (!podcast.coverImageAssetId) {
      warnings.push({
        code: "missing_cover_image",
        message: "アートワーク未設定です（推奨）",
        field: "cover_image_asset_id",
        action: "番組カバーアートを設定してください",
      });
    }

    if (publishedEpisodes.length === 0) {
      warnings.push({
        code: "no_published_episodes",
        message: "公開済みエピソードがありません",
        action: "少なくとも1つのエピソードを公開してください",
      });
    }

    // Target-specific validations
    if (target === "amazon") {
      if (!podcast.contactEmail) {
        errors.push({
          code: "missing_itunes_email",
          message: "Amazon向けに連絡先メールアドレスが必要です",
          field: "contact_email",
          action: "番組設定で連絡先メールを入力してください",
        });
      }
    }

    if (target === "apple") {
      // Apple specific checks
      if (!podcast.category) {
        errors.push({
          code: "missing_category",
          message: "Apple Podcasts向けにカテゴリが必要です",
          field: "category",
          action: "番組設定でカテゴリを選択してください",
        });
      }

      if (!podcast.language) {
        errors.push({
          code: "missing_language",
          message: "言語設定が必要です",
          field: "language",
          action: "番組設定で言語を選択してください",
        });
      }
    }

    if (target === "spotify") {
      // Spotify specific checks (similar to Apple)
      if (!podcast.category) {
        errors.push({
          code: "missing_category",
          message: "Spotify向けにカテゴリが必要です",
          field: "category",
          action: "番組設定でカテゴリを選択してください",
        });
      }
    }

    results.push({
      target,
      ok: errors.length === 0,
      errors,
      warnings,
    });
  }

  const allOk = results.every((r) => r.ok);

  return c.json({
    ok: allOk,
    results,
  });
});
