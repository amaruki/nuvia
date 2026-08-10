CREATE TABLE "committees" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"purpose" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"type" text DEFAULT 'functional' NOT NULL,
	"authority_level" text DEFAULT 'advisory' NOT NULL,
	"charter" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"contact_email" text NOT NULL,
	"contact_phone" text,
	"meeting_location" text,
	"virtual_meeting_link" text,
	"website" text,
	"meetings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metrics" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"parent_committee_id" uuid,
	"created_by" text NOT NULL,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "committees_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "committee_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"committee_id" uuid NOT NULL,
	"user_id" text,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"title" text,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"expertise" text[] DEFAULT '{}' NOT NULL,
	"contribution_level" text,
	"responsibilities" text[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "committees" ADD CONSTRAINT "committees_parent_committee_id_committees_id_fk" FOREIGN KEY ("parent_committee_id") REFERENCES "public"."committees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "committees" ADD CONSTRAINT "committees_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "committees" ADD CONSTRAINT "committees_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "committee_members" ADD CONSTRAINT "committee_members_committee_id_committees_id_fk" FOREIGN KEY ("committee_id") REFERENCES "public"."committees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "committee_members" ADD CONSTRAINT "committee_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "committees_status_idx" ON "committees" USING btree ("status");--> statement-breakpoint
CREATE INDEX "committees_type_idx" ON "committees" USING btree ("type");--> statement-breakpoint
CREATE INDEX "committees_parent_committee_id_idx" ON "committees" USING btree ("parent_committee_id");--> statement-breakpoint
CREATE INDEX "committee_members_committee_id_idx" ON "committee_members" USING btree ("committee_id");--> statement-breakpoint
CREATE INDEX "committee_members_user_id_idx" ON "committee_members" USING btree ("user_id");