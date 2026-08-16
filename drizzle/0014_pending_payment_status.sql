ALTER TYPE "MembershipStatus" ADD VALUE IF NOT EXISTS 'PENDING_PAYMENT';
--> statement-breakpoint
-- Note: PostgreSQL allows adding an enum value inside a transaction (PG 12+),
-- but the new value may not be USED within the same transaction. This
-- migration only adds the value; the code that uses it ships separately.
