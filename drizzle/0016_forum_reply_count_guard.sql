-- Issue #28: reply_count is maintained incrementally, and until this
-- commit the delete paths could double-decrement (delete race) or skip
-- the decrement entirely (report resolution deleted the comment without
-- touching the counter). Recompute the counter from the rows so any
-- drift accumulated in the past is healed before the CHECK constraint
-- below lands (mirrors the 0015 seat-counter reconciliation).
UPDATE "forum_posts" p
SET "reply_count" = (
  SELECT count(*) FROM "forum_comments" c
  WHERE c."post_id" = p."id" AND c."status" = 'PUBLISHED'
);
--> statement-breakpoint
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_reply_count_non_negative" CHECK ("forum_posts"."reply_count" >= 0);
