CREATE TYPE "public"."WorkspaceStatus" AS ENUM('ACTIVE', 'ARCHIVED', 'LOCKED');--> statement-breakpoint
CREATE TYPE "public"."WorkspaceType" AS ENUM('GENERAL', 'PROJECT', 'DOCUMENT', 'DISCUSSION', 'MEETING');--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"committee_id" uuid,
	"name" text NOT NULL,
	"description" text,
	"type" "WorkspaceType" DEFAULT 'GENERAL' NOT NULL,
	"status" "WorkspaceStatus" DEFAULT 'ACTIVE' NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"members" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"documents" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"tasks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"discussions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"meetings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"activity" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspaces_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_committee_id_committees_id_fk" FOREIGN KEY ("committee_id") REFERENCES "public"."committees"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workspaces_status_idx" ON "workspaces" USING btree ("status");--> statement-breakpoint
CREATE INDEX "workspaces_type_idx" ON "workspaces" USING btree ("type");--> statement-breakpoint
CREATE INDEX "workspaces_committee_id_idx" ON "workspaces" USING btree ("committee_id");