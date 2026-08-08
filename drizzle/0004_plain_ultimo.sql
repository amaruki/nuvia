CREATE TYPE "public"."InvoiceStatus" AS ENUM('ISSUED', 'PAID', 'VOID');--> statement-breakpoint
CREATE TABLE "membership_invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_number" text NOT NULL,
	"user_id" text NOT NULL,
	"subscription_id" text NOT NULL,
	"tier_id" text NOT NULL,
	"status" "InvoiceStatus" DEFAULT 'ISSUED' NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"subtotal" numeric(10, 2) NOT NULL,
	"tax_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"paid_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"due_date" timestamp with time zone,
	"notes" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "membership_invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "membership_invoice_items" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text NOT NULL,
	"description" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "membership_payments" (
	"id" text PRIMARY KEY NOT NULL,
	"invoice_id" text,
	"user_id" text NOT NULL,
	"subscription_id" text NOT NULL,
	"transaction_id" text,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"status" "TransactionStatus" NOT NULL,
	"payment_method" text,
	"payment_provider" text,
	"provider_tx_id" text,
	"paid_at" timestamp with time zone,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "membership_webhook_events" (
	"id" text PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"subscription_id" text,
	"processed_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "membership_webhook_events_provider_event" UNIQUE("provider","event_id")
);
--> statement-breakpoint
ALTER TABLE "membership_invoices" ADD CONSTRAINT "membership_invoices_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_invoices" ADD CONSTRAINT "membership_invoices_subscription_id_membership_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."membership_subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_invoices" ADD CONSTRAINT "membership_invoices_tier_id_membership_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."membership_tiers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_invoice_items" ADD CONSTRAINT "membership_invoice_items_invoice_id_membership_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."membership_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_payments" ADD CONSTRAINT "membership_payments_invoice_id_membership_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."membership_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_payments" ADD CONSTRAINT "membership_payments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_payments" ADD CONSTRAINT "membership_payments_subscription_id_membership_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."membership_subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_payments" ADD CONSTRAINT "membership_payments_transaction_id_membership_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."membership_transactions"("id") ON DELETE cascade ON UPDATE no action;