CREATE TYPE "public"."DonationStatus" AS ENUM('pending', 'completed', 'failed', 'refunded', 'pledged');--> statement-breakpoint
CREATE TYPE "public"."DonationType" AS ENUM('one_time', 'recurring', 'pledge');--> statement-breakpoint
CREATE TYPE "public"."DonorType" AS ENUM('individual', 'organization', 'anonymous');--> statement-breakpoint
CREATE TABLE "donations" (
	"id" text PRIMARY KEY NOT NULL,
	"donor_name" text NOT NULL,
	"donor_email" text NOT NULL,
	"donor_type" "DonorType" DEFAULT 'individual' NOT NULL,
	"donation_type" "DonationType" DEFAULT 'one_time' NOT NULL,
	"campaign" text,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" "DonationStatus" DEFAULT 'pending' NOT NULL,
	"payment_method" text,
	"transaction_id" text,
	"donation_date" timestamp with time zone DEFAULT now() NOT NULL,
	"receipt_sent" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
