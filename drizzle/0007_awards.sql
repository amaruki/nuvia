CREATE TYPE "public"."AwardCategory" AS ENUM('ACHIEVEMENT', 'SERVICE', 'LEADERSHIP', 'INNOVATION', 'SCHOLARSHIP', 'LIFETIME_ACHIEVEMENT');--> statement-breakpoint
CREATE TYPE "public"."AwardNominationStatus" AS ENUM('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."AwardProgramStatus" AS ENUM('DRAFT', 'OPEN', 'CLOSED', 'ARCHIVED');--> statement-breakpoint
CREATE TABLE "award_nominations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"user_id" text,
	"nominee_name" text NOT NULL,
	"nominee_email" text NOT NULL,
	"nominator_name" text NOT NULL,
	"nominator_email" text NOT NULL,
	"status" "AwardNominationStatus" DEFAULT 'PENDING' NOT NULL,
	"statement" text,
	"created_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "award_programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" "AwardCategory" DEFAULT 'ACHIEVEMENT' NOT NULL,
	"status" "AwardProgramStatus" DEFAULT 'DRAFT' NOT NULL,
	"criteria" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"open_date" timestamp with time zone,
	"close_date" timestamp with time zone,
	"award_date" timestamp with time zone,
	"created_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "award_programs_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "award_nominations" ADD CONSTRAINT "award_nominations_program_id_award_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."award_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "award_nominations" ADD CONSTRAINT "award_nominations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "award_nominations_program_idx" ON "award_nominations" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "award_nominations_status_idx" ON "award_nominations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "award_nominations_user_idx" ON "award_nominations" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "award_programs_status_idx" ON "award_programs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "award_programs_category_idx" ON "award_programs" USING btree ("category");