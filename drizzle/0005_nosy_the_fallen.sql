CREATE TYPE "public"."ChapterRole" AS ENUM('PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY', 'TREASURER', 'ADMIN', 'MEMBER');--> statement-breakpoint
CREATE TYPE "public"."ChapterStatus" AS ENUM('ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED');--> statement-breakpoint
CREATE TABLE "chapters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"status" "ChapterStatus" DEFAULT 'PENDING' NOT NULL,
	"address" text,
	"city" text,
	"state" text,
	"country" text,
	"postal_code" text,
	"latitude" double precision,
	"longitude" double precision,
	"timezone" text,
	"region" text,
	"member_count" integer DEFAULT 0 NOT NULL,
	"established_date" timestamp with time zone,
	"parent_chapter_id" uuid,
	"contact_info" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"social_media" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "chapters_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "chapter_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chapter_id" uuid NOT NULL,
	"user_id" text,
	"role" "ChapterRole" DEFAULT 'MEMBER' NOT NULL,
	"title" text,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"avatar" text,
	"start_date" timestamp with time zone,
	"end_date" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_parent_chapter_id_chapters_id_fk" FOREIGN KEY ("parent_chapter_id") REFERENCES "public"."chapters"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapter_members" ADD CONSTRAINT "chapter_members_chapter_id_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chapter_members" ADD CONSTRAINT "chapter_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "chapters_status_idx" ON "chapters" USING btree ("status");--> statement-breakpoint
CREATE INDEX "chapters_region_idx" ON "chapters" USING btree ("region");--> statement-breakpoint
CREATE INDEX "chapters_parent_idx" ON "chapters" USING btree ("parent_chapter_id");--> statement-breakpoint
CREATE INDEX "chapter_members_chapter_idx" ON "chapter_members" USING btree ("chapter_id");--> statement-breakpoint
CREATE INDEX "chapter_members_user_idx" ON "chapter_members" USING btree ("user_id");