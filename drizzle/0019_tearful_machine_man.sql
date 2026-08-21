-- Keep the newest checkout and make older duplicate pending rows terminal.
WITH ranked_pending AS (
  SELECT
    "id",
    row_number() OVER (
      PARTITION BY "user_id"
      ORDER BY "created_at" DESC, "id" DESC
    ) AS position
  FROM "membership_subscriptions"
  WHERE "status"::text = 'PENDING_PAYMENT'
)
UPDATE "membership_subscriptions"
SET
  "status" = 'CANCELED',
  "canceled_at" = now(),
  "updated_at" = now()
WHERE "id" IN (
  SELECT "id" FROM ranked_pending WHERE position > 1
);
--> statement-breakpoint
ALTER TABLE "membership_subscriptions" ADD COLUMN "pending_payment_guard" text;
--> statement-breakpoint
UPDATE "membership_subscriptions"
SET "pending_payment_guard" = "user_id"
WHERE "status"::text = 'PENDING_PAYMENT';
--> statement-breakpoint
CREATE UNIQUE INDEX "membership_subscriptions_one_pending_per_user"
  ON "membership_subscriptions" USING btree ("pending_payment_guard");
