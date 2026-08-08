CREATE TYPE "public"."ReportStatus" AS ENUM('PENDING', 'RESOLVED', 'DISMISSED');--> statement-breakpoint
CREATE TYPE "public"."ReportTargetType" AS ENUM('POST', 'COMMENT');--> statement-breakpoint
ALTER TYPE "public"."PostStatus" ADD VALUE 'PENDING_REVIEW' BEFORE 'PUBLISHED';--> statement-breakpoint
CREATE TABLE "forum_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"target_type" "ReportTargetType" NOT NULL,
	"post_id" text,
	"comment_id" text,
	"reason" text NOT NULL,
	"status" "ReportStatus" DEFAULT 'PENDING' NOT NULL,
	"reported_by_id" text NOT NULL,
	"resolved_by_id" text,
	"resolved_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "forum_reports" ADD CONSTRAINT "forum_reports_post_id_forum_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."forum_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_reports" ADD CONSTRAINT "forum_reports_comment_id_forum_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."forum_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_reports" ADD CONSTRAINT "forum_reports_reported_by_id_users_id_fk" FOREIGN KEY ("reported_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_reports" ADD CONSTRAINT "forum_reports_resolved_by_id_users_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "forum_reports_post_id_idx" ON "forum_reports" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "forum_reports_comment_id_idx" ON "forum_reports" USING btree ("comment_id");--> statement-breakpoint
CREATE INDEX "forum_reports_status_idx" ON "forum_reports" USING btree ("status");