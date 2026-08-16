-- Issue #17: before this migration, content could be written with status
-- 'SCHEDULED' but nothing ever promoted it to 'PUBLISHED' (no cron, no
-- lazy publisher), and the read paths filter status = 'PUBLISHED'
-- strictly. The scheduled publisher promotes rows whose publish time has
-- arrived, gating on the `published_at` column, so heal historical rows
-- first: copy the intended publish moment out of metadata->ui->>
-- 'scheduledFor' (the only place the old write paths stored it). Rows
-- with no stored moment are backfilled to their update time so they
-- publish on the next sweep instead of staying invisible forever.
UPDATE "content"
SET "published_at" = COALESCE(
  (metadata->'ui'->>'scheduledFor')::timestamptz,
  "updated_at",
  now()
)
WHERE "status" = 'SCHEDULED' AND "published_at" IS NULL;
--> statement-breakpoint
-- Issue #17: forum_posts.like_count and forum_comments.like_count have no
-- writer anywhere (no likes table, no like/unlike endpoint) and no UI
-- consumer; they only made every post and comment promise a feature that
-- does not exist. Drop them instead of maintaining dead counters.
ALTER TABLE "forum_comments" DROP COLUMN "like_count";--> statement-breakpoint
ALTER TABLE "forum_posts" DROP COLUMN "like_count";
