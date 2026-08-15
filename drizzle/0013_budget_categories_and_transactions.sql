CREATE TYPE "public"."budget_transaction_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."budget_transaction_type" AS ENUM('expense', 'income', 'refund');--> statement-breakpoint
CREATE TABLE "budget_categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"color" text NOT NULL,
	"allocated_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budget_transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"category_id" text NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"type" "budget_transaction_type" NOT NULL,
	"status" "budget_transaction_status" DEFAULT 'pending' NOT NULL,
	"vendor" text,
	"receipt_url" text,
	"notes" text,
	"approved_by" text,
	"approved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "budget_transactions" ADD CONSTRAINT "budget_transactions_category_id_budget_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."budget_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget_transactions" ADD CONSTRAINT "budget_transactions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "budget_transactions_category_idx" ON "budget_transactions" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "budget_transactions_status_idx" ON "budget_transactions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "budget_transactions_date_idx" ON "budget_transactions" USING btree ("date");