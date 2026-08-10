CREATE TYPE "public"."ApplicationStatus" AS ENUM('PENDING', 'REVIEWING', 'SHORTLISTED', 'REJECTED', 'INTERVIEWING', 'OFFERED', 'HIRED', 'WITHDRAWN');--> statement-breakpoint
CREATE TYPE "public"."CommentStatus" AS ENUM('PUBLISHED', 'PENDING', 'HIDDEN', 'DELETED');--> statement-breakpoint
CREATE TYPE "public"."ContentStatus" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED', 'DELETED', 'SCHEDULED');--> statement-breakpoint
CREATE TYPE "public"."ContentType" AS ENUM('ARTICLE', 'BLOG_POST', 'PAGE', 'NEWS', 'TUTORIAL', 'DOCUMENTATION', 'RESOURCE', 'ANNOUNCEMENT');--> statement-breakpoint
CREATE TYPE "public"."ContentVisibility" AS ENUM('PUBLIC', 'MEMBERS_ONLY', 'PREMIUM_MEMBERS', 'SPECIFIC_ROLES', 'PRIVATE');--> statement-breakpoint
CREATE TYPE "public"."EmploymentType" AS ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'FREELANCE', 'INTERNSHIP', 'TEMPORARY', 'VOLUNTEER');--> statement-breakpoint
CREATE TYPE "public"."EventFormat" AS ENUM('IN_PERSON', 'VIRTUAL', 'HYBRID', 'RECORDED', 'LIVE_STREAM');--> statement-breakpoint
CREATE TYPE "public"."EventStatus" AS ENUM('DRAFT', 'PUBLISHED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED', 'POSTPONED');--> statement-breakpoint
CREATE TYPE "public"."EventType" AS ENUM('CONFERENCE', 'MEETUP', 'WORKSHOP', 'WEBINAR', 'NETWORKING', 'SOCIAL', 'TRAINING', 'PANEL_DISCUSSION', 'KEYNOTE', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."EventVisibility" AS ENUM('PUBLIC', 'MEMBERS_ONLY', 'PREMIUM_MEMBERS', 'SPECIFIC_ROLES', 'PRIVATE', 'INVITE_ONLY');--> statement-breakpoint
CREATE TYPE "public"."ExperienceLevel" AS ENUM('ENTRY_LEVEL', 'JUNIOR', 'MID_LEVEL', 'SENIOR', 'LEAD', 'EXECUTIVE', 'NOT_SPECIFIED');--> statement-breakpoint
CREATE TYPE "public"."JobStatus" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED', 'CLOSED', 'FILLED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."MembershipStatus" AS ENUM('ACTIVE', 'TRIALING', 'CANCELED', 'PAST_DUE', 'UNPAID', 'PAUSED');--> statement-breakpoint
CREATE TYPE "public"."PostStatus" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED', 'DELETED', 'HIDDEN');--> statement-breakpoint
CREATE TYPE "public"."PostType" AS ENUM('DISCUSSION', 'QUESTION', 'ANNOUNCEMENT', 'POLL', 'RESOURCE', 'JOB_POSTING', 'EVENT_PROMOTION');--> statement-breakpoint
CREATE TYPE "public"."RegistrationStatus" AS ENUM('PENDING', 'CONFIRMED', 'WAITLISTED', 'CANCELED', 'ATTENDED', 'NO_SHOW');--> statement-breakpoint
CREATE TYPE "public"."SponsorTier" AS ENUM('PLATINUM', 'GOLD', 'SILVER', 'BRONZE', 'PARTNER', 'MEDIA');--> statement-breakpoint
CREATE TYPE "public"."TransactionStatus" AS ENUM('PENDING', 'COMPLETED', 'FAILED', 'CANCELED', 'REFUNDED', 'PARTIALLY_REFUNDED');--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"name" text NOT NULL,
	"legal_name" text,
	"logo" text,
	"website" text,
	"support_email" text,
	"locale" text DEFAULT 'en' NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"settings" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "active_devices" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"device_id" text NOT NULL,
	"device_name" text,
	"device_type" text,
	"ip_address" text,
	"user_agent" text,
	"last_active" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"first_name" text,
	"last_name" text,
	"profile_photo" text,
	"bio" text,
	"external_links" jsonb,
	"role" text DEFAULT 'user' NOT NULL,
	"password_hash" text,
	"email_verification_token" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	"name" text NOT NULL,
	"image" text,
	"display_name" text,
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_email_verification_token_unique" UNIQUE("email_verification_token")
);
--> statement-breakpoint
CREATE TABLE "user_login_activities" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"ip_address" text NOT NULL,
	"user_agent" text,
	"device_type" text,
	"location" text,
	"login_at" timestamp with time zone DEFAULT now() NOT NULL,
	"successful" boolean NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"access_token_expires_at" timestamp with time zone,
	"scope" text,
	"id_token" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"refresh_token_expires_at" timestamp with time zone,
	"password" text,
	CONSTRAINT "accounts_provider_account_unique" UNIQUE("provider_id","account_id")
);
--> statement-breakpoint
CREATE TABLE "auth_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"event_type" text NOT NULL,
	"severity" text NOT NULL,
	"message" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"device_id" text,
	"location" text,
	"metadata" jsonb,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "custom_roles" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name" text,
	"description" text,
	"permissions" jsonb NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "custom_roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "role_change_history" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"previous_role" text NOT NULL,
	"new_role" text NOT NULL,
	"changed_by" text NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reason" text,
	"ip_address" text,
	"user_agent" text,
	"role_id" text
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ip_address" text,
	"user_agent" text,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user_role_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"role_id" text NOT NULL,
	"assigned_by" text,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "user_role_assignments_user_role_unique" UNIQUE("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_tokens_token_unique" UNIQUE("token"),
	CONSTRAINT "verification_tokens_identifier_token_unique" UNIQUE("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "membership_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"tier_id" text NOT NULL,
	"status" "MembershipStatus" NOT NULL,
	"current_period_start" timestamp with time zone NOT NULL,
	"current_period_end" timestamp with time zone,
	"trial_start" timestamp with time zone,
	"trial_end" timestamp with time zone,
	"cancel_at_period_end" boolean DEFAULT false NOT NULL,
	"canceled_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "membership_tiers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"billing_cycle" text NOT NULL,
	"features" jsonb NOT NULL,
	"benefits" jsonb NOT NULL,
	"permissions" jsonb NOT NULL,
	"max_users" integer,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"color" text,
	"icon" text,
	"trial_days" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "membership_tiers_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "membership_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"subscription_id" text NOT NULL,
	"tier_id" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" "TransactionStatus" NOT NULL,
	"payment_method" text,
	"payment_provider" text,
	"provider_tx_id" text,
	"description" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"short_description" text,
	"category_id" text NOT NULL,
	"type" "EventType" NOT NULL,
	"format" "EventFormat" NOT NULL,
	"status" "EventStatus" NOT NULL,
	"visibility" "EventVisibility" NOT NULL,
	"capacity" integer,
	"registered_count" integer DEFAULT 0 NOT NULL,
	"waitlist_count" integer DEFAULT 0 NOT NULL,
	"is_virtual" boolean DEFAULT false NOT NULL,
	"is_free" boolean DEFAULT true NOT NULL,
	"price" numeric(10, 2),
	"currency" text DEFAULT 'USD' NOT NULL,
	"location" text,
	"virtual_url" text,
	"timezone" text NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"registration_start" timestamp with time zone,
	"registration_end" timestamp with time zone,
	"allow_waitlist" boolean DEFAULT true NOT NULL,
	"requires_approval" boolean DEFAULT false NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"metadata" jsonb,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "event_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name" text,
	"description" text,
	"color" text,
	"icon" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "event_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "event_registrations" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"event_id" text NOT NULL,
	"status" "RegistrationStatus" DEFAULT 'PENDING' NOT NULL,
	"registered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"checked_in_at" timestamp with time zone,
	"checked_out_at" timestamp with time zone,
	"qr_code" text,
	"ticket_data" jsonb,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"location" text,
	"virtual_url" text,
	"speakers" jsonb,
	"order" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_speakers" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"name" text NOT NULL,
	"bio" text,
	"title" text,
	"company" text,
	"photo" text,
	"email" text,
	"order" integer DEFAULT 0 NOT NULL,
	"is_keynote" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_sponsors" (
	"id" text PRIMARY KEY NOT NULL,
	"event_id" text NOT NULL,
	"name" text NOT NULL,
	"logo" text,
	"website" text,
	"description" text,
	"tier" "SponsorTier" DEFAULT 'BRONZE' NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forum_attachments" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"user_id" text NOT NULL,
	"filename" text NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"path" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forum_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"icon" text,
	"color" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_private" boolean DEFAULT false NOT NULL,
	"required_role" text,
	"parent_id" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "forum_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "forum_comments" (
	"id" text PRIMARY KEY NOT NULL,
	"post_id" text NOT NULL,
	"user_id" text NOT NULL,
	"content" text NOT NULL,
	"parent_id" text,
	"status" "CommentStatus" DEFAULT 'PUBLISHED' NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "forum_posts" (
	"id" text PRIMARY KEY NOT NULL,
	"category_id" text NOT NULL,
	"user_id" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"type" "PostType" DEFAULT 'DISCUSSION' NOT NULL,
	"status" "PostStatus" DEFAULT 'PUBLISHED' NOT NULL,
	"is_sticky" boolean DEFAULT false NOT NULL,
	"is_locked" boolean DEFAULT false NOT NULL,
	"views" integer DEFAULT 0 NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL,
	"reply_count" integer DEFAULT 0 NOT NULL,
	"last_reply_at" timestamp with time zone,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"content" text NOT NULL,
	"excerpt" text,
	"type" "ContentType" NOT NULL,
	"status" "ContentStatus" DEFAULT 'DRAFT' NOT NULL,
	"visibility" "ContentVisibility" DEFAULT 'PUBLIC' NOT NULL,
	"category_id" text,
	"author_id" text NOT NULL,
	"featured_image" text,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"metadata" jsonb,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "content_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"icon" text,
	"color" text,
	"parent_id" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"logo" text,
	"website" text,
	"industry" text,
	"size" text,
	"founded_year" integer,
	"location" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "companies_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "job_applications" (
	"id" text PRIMARY KEY NOT NULL,
	"job_id" text NOT NULL,
	"user_id" text NOT NULL,
	"status" "ApplicationStatus" DEFAULT 'PENDING' NOT NULL,
	"cover_letter" text,
	"resume_path" text,
	"portfolio_url" text,
	"salary_expectation" numeric(10, 2),
	"availability" text,
	"notes" text,
	"metadata" jsonb,
	"applied_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"icon" text,
	"color" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "job_categories_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "job_postings" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text NOT NULL,
	"requirements" text,
	"responsibilities" text,
	"benefits" text,
	"category_id" text NOT NULL,
	"type_id" text NOT NULL,
	"location_id" text NOT NULL,
	"company_id" text NOT NULL,
	"posted_by" text NOT NULL,
	"status" "JobStatus" DEFAULT 'DRAFT' NOT NULL,
	"employment_type" "EmploymentType" NOT NULL,
	"experience_level" "ExperienceLevel" NOT NULL,
	"salary_min" numeric(10, 2),
	"salary_max" numeric(10, 2),
	"currency" text DEFAULT 'USD' NOT NULL,
	"is_remote" boolean DEFAULT false NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"application_deadline" timestamp with time zone,
	"view_count" integer DEFAULT 0 NOT NULL,
	"application_count" integer DEFAULT 0 NOT NULL,
	"tags" text[] DEFAULT '{}' NOT NULL,
	"metadata" jsonb,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "job_postings_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "job_types" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "job_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name" text NOT NULL,
	"country" text,
	"state" text,
	"city" text,
	"remote" boolean DEFAULT false NOT NULL,
	"timezone" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "locations_name_unique" UNIQUE("name")
);
--> statement-breakpoint
ALTER TABLE "active_devices" ADD CONSTRAINT "active_devices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_login_activities" ADD CONSTRAINT "user_login_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auth_logs" ADD CONSTRAINT "auth_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_change_history" ADD CONSTRAINT "role_change_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_change_history" ADD CONSTRAINT "role_change_history_role_id_custom_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."custom_roles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_role_assignments" ADD CONSTRAINT "user_role_assignments_role_id_custom_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."custom_roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_subscriptions" ADD CONSTRAINT "membership_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_subscriptions" ADD CONSTRAINT "membership_subscriptions_tier_id_membership_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."membership_tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_transactions" ADD CONSTRAINT "membership_transactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_transactions" ADD CONSTRAINT "membership_transactions_subscription_id_membership_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."membership_subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_transactions" ADD CONSTRAINT "membership_transactions_tier_id_membership_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."membership_tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_category_id_event_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."event_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_sessions" ADD CONSTRAINT "event_sessions_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_speakers" ADD CONSTRAINT "event_speakers_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_sponsors" ADD CONSTRAINT "event_sponsors_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_attachments" ADD CONSTRAINT "forum_attachments_post_id_forum_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."forum_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_categories" ADD CONSTRAINT "forum_categories_parent_id_forum_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."forum_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_comments" ADD CONSTRAINT "forum_comments_post_id_forum_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."forum_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_comments" ADD CONSTRAINT "forum_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_comments" ADD CONSTRAINT "forum_comments_parent_id_forum_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."forum_comments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_category_id_forum_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."forum_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "forum_posts" ADD CONSTRAINT "forum_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_category_id_content_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."content_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_categories" ADD CONSTRAINT "content_categories_parent_id_content_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."content_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_id_job_postings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_postings"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_category_id_job_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."job_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_type_id_job_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."job_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_posted_by_users_id_fk" FOREIGN KEY ("posted_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "active_devices_user_device_unique" ON "active_devices" USING btree ("user_id","device_id");--> statement-breakpoint
CREATE INDEX "users_username_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_deleted_at_idx" ON "users" USING btree ("deleted_at");--> statement-breakpoint
CREATE INDEX "events_category_id_idx" ON "events" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "events_type_idx" ON "events" USING btree ("type");--> statement-breakpoint
CREATE INDEX "events_status_idx" ON "events" USING btree ("status");--> statement-breakpoint
CREATE INDEX "events_start_time_idx" ON "events" USING btree ("start_time");--> statement-breakpoint
CREATE INDEX "events_created_by_idx" ON "events" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "event_registrations_user_event_unique" ON "event_registrations" USING btree ("user_id","event_id");--> statement-breakpoint
CREATE INDEX "forum_comments_post_id_idx" ON "forum_comments" USING btree ("post_id");--> statement-breakpoint
CREATE INDEX "forum_comments_user_id_idx" ON "forum_comments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "forum_comments_parent_id_idx" ON "forum_comments" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "forum_comments_created_at_idx" ON "forum_comments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "forum_posts_category_id_idx" ON "forum_posts" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "forum_posts_user_id_idx" ON "forum_posts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "forum_posts_status_idx" ON "forum_posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "forum_posts_created_at_idx" ON "forum_posts" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "forum_posts_is_sticky_idx" ON "forum_posts" USING btree ("is_sticky");--> statement-breakpoint
CREATE INDEX "content_type_idx" ON "content" USING btree ("type");--> statement-breakpoint
CREATE INDEX "content_status_idx" ON "content" USING btree ("status");--> statement-breakpoint
CREATE INDEX "content_author_id_idx" ON "content" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "content_published_at_idx" ON "content" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "job_applications_job_user_unique" ON "job_applications" USING btree ("job_id","user_id");--> statement-breakpoint
CREATE INDEX "job_postings_category_id_idx" ON "job_postings" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "job_postings_type_id_idx" ON "job_postings" USING btree ("type_id");--> statement-breakpoint
CREATE INDEX "job_postings_location_id_idx" ON "job_postings" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "job_postings_company_id_idx" ON "job_postings" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "job_postings_status_idx" ON "job_postings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "job_postings_published_at_idx" ON "job_postings" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "job_postings_is_featured_idx" ON "job_postings" USING btree ("is_featured");