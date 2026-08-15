/**
 * Donation store (backlog D-series donations completion).
 *
 * Backoffice-recorded donations: a treasurer enters gifts received offline
 * or via channels the ledger does not track (no donor user FK on purpose —
 * anonymous and organization donors are not platform users). Campaigns are
 * free-text labels until a campaigns table exists; donation payments
 * (installments against a pledge) are not stored yet either.
 *
 * Amounts are numeric(10,2) string mode end to end, like the rest of the
 * finance schema (ADR-0015 §5).
 */
import { boolean, numeric, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/** Who gives: a person, an organization, or an unnamed donor. */
export const donorTypeEnum = pgEnum("DonorType", ["individual", "organization", "anonymous"]);

/** Shape of the gift: single payment, repeating, or a promise to pay. */
export const donationTypeEnum = pgEnum("DonationType", ["one_time", "recurring", "pledge"]);

/**
 * Lifecycle of a donation. `pledged` marks a promise not yet fulfilled;
 * `refunded` is terminal. Transitions are not constrained in the DB — the
 * service layer owns which updates make sense.
 */
export const donationStatusEnum = pgEnum("DonationStatus", [
  "pending",
  "completed",
  "failed",
  "refunded",
  "pledged",
]);

export const donation = pgTable("donations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  donorName: text("donor_name").notNull(),
  donorEmail: text("donor_email").notNull(),
  donorType: donorTypeEnum("donor_type").notNull().default("individual"),
  donationType: donationTypeEnum("donation_type").notNull().default("one_time"),
  /** Free-text campaign label; no campaigns table yet. */
  campaign: text("campaign"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  status: donationStatusEnum("status").notNull().default("pending"),
  paymentMethod: text("payment_method"),
  transactionId: text("transaction_id"),
  donationDate: timestamp("donation_date", { withTimezone: true }).notNull().defaultNow(),
  receiptSent: boolean("receipt_sent").notNull().default(false),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export type Donation = typeof donation.$inferSelect;
