/**
 * Membership management — translated from prisma/schema.prisma's
 * "MEMBERSHIP MANAGEMENT MODELS" section. No src/ code queries these tables
 * yet (the dues/membership UI is mock-backed — see TODO.md, module
 * "finance"); this is a structural translation, not a wired integration.
 */

import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";
import { membershipStatusEnum, transactionStatusEnum, invoiceStatusEnum } from "./enums";
import { user } from "./users";

export const membershipTier = pgTable("membership_tiers", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  /** 'monthly' | 'yearly' | 'lifetime' */
  billingCycle: text("billing_cycle").notNull(),
  features: jsonb("features").notNull(),
  benefits: jsonb("benefits").notNull(),
  permissions: jsonb("permissions").notNull(),
  maxUsers: integer("max_users"),
  isDefault: boolean("is_default").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  color: text("color"),
  icon: text("icon"),
  trialDays: integer("trial_days").notNull().default(0),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const membershipSubscription = pgTable("membership_subscriptions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  tierId: text("tier_id")
    .notNull()
    .references(() => membershipTier.id),
  status: membershipStatusEnum("status").notNull(),
  currentPeriodStart: timestamp("current_period_start", { withTimezone: true }).notNull(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  trialStart: timestamp("trial_start", { withTimezone: true }),
  trialEnd: timestamp("trial_end", { withTimezone: true }),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  canceledAt: timestamp("canceled_at", { withTimezone: true }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const membershipTransaction = pgTable("membership_transactions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  subscriptionId: text("subscription_id")
    .notNull()
    .references(() => membershipSubscription.id),
  tierId: text("tier_id")
    .notNull()
    .references(() => membershipTier.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  status: transactionStatusEnum("status").notNull(),
  paymentMethod: text("payment_method"),
  paymentProvider: text("payment_provider"),
  providerTxId: text("provider_tx_id"),
  description: text("description"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/**
 * Invoicing and payment recording (backlog C3). Invoices bill one
 * subscription; line items live in membership_invoice_items; recorded
 * payments live in membership_payments and each one matches a
 * membership_transactions row (the provider-facing ledger that C2 already
 * established). membership_webhook_events stores processed provider event
 * ids so webhook delivery retries stay no-ops.
 *
 * Amounts are numeric(10,2) string mode end to end, like the rest of the
 * finance schema (ADR-0015 §5).
 */
export const membershipInvoice = pgTable("membership_invoices", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  invoiceNumber: text("invoice_number").notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  subscriptionId: text("subscription_id")
    .notNull()
    .references(() => membershipSubscription.id),
  tierId: text("tier_id")
    .notNull()
    .references(() => membershipTier.id),
  status: invoiceStatusEnum("status").notNull().default("ISSUED"),
  currency: text("currency").notNull().default("USD"),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  taxAmount: numeric("tax_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  paidAmount: numeric("paid_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  notes: text("notes"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/** Invoice line items — immutable once written (no updated_at on purpose). */
export const membershipInvoiceItem = pgTable("membership_invoice_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  invoiceId: text("invoice_id")
    .notNull()
    .references(() => membershipInvoice.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const membershipPayment = pgTable("membership_payments", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  /** Null only for provider payments that match no invoice. */
  invoiceId: text("invoice_id").references(() => membershipInvoice.id, { onDelete: "cascade" }),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  subscriptionId: text("subscription_id")
    .notNull()
    .references(() => membershipSubscription.id),
  /** The matching membership_transactions ledger row. */
  transactionId: text("transaction_id").references(() => membershipTransaction.id, {
    onDelete: "cascade",
  }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  status: transactionStatusEnum("status").notNull(),
  paymentMethod: text("payment_method"),
  paymentProvider: text("payment_provider"),
  providerTxId: text("provider_tx_id"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/**
 * Processed provider webhook events — the idempotency ledger. One row per
 * verified provider event id; delivery retries hit the (provider, event_id)
 * unique constraint and no-op.
 */
export const membershipWebhookEvent = pgTable(
  "membership_webhook_events",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    provider: text("provider").notNull(),
    eventId: text("event_id").notNull(),
    eventType: text("event_type").notNull(),
    subscriptionId: text("subscription_id"),
    processedAt: timestamp("processed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique("membership_webhook_events_provider_event").on(table.provider, table.eventId)],
);

export const membershipInvoiceRelations = relations(membershipInvoice, ({ one, many }) => ({
  user: one(user, { fields: [membershipInvoice.userId], references: [user.id] }),
  subscription: one(membershipSubscription, {
    fields: [membershipInvoice.subscriptionId],
    references: [membershipSubscription.id],
  }),
  tier: one(membershipTier, {
    fields: [membershipInvoice.tierId],
    references: [membershipTier.id],
  }),
  items: many(membershipInvoiceItem),
  payments: many(membershipPayment),
}));

export const membershipInvoiceItemRelations = relations(membershipInvoiceItem, ({ one }) => ({
  invoice: one(membershipInvoice, {
    fields: [membershipInvoiceItem.invoiceId],
    references: [membershipInvoice.id],
  }),
}));

export const membershipPaymentRelations = relations(membershipPayment, ({ one }) => ({
  invoice: one(membershipInvoice, {
    fields: [membershipPayment.invoiceId],
    references: [membershipInvoice.id],
  }),
  user: one(user, { fields: [membershipPayment.userId], references: [user.id] }),
  subscription: one(membershipSubscription, {
    fields: [membershipPayment.subscriptionId],
    references: [membershipSubscription.id],
  }),
  transaction: one(membershipTransaction, {
    fields: [membershipPayment.transactionId],
    references: [membershipTransaction.id],
  }),
}));

export const membershipTierRelations = relations(membershipTier, ({ many }) => ({
  subscriptions: many(membershipSubscription),
  transactions: many(membershipTransaction),
}));

export const membershipSubscriptionRelations = relations(
  membershipSubscription,
  ({ one, many }) => ({
    user: one(user, { fields: [membershipSubscription.userId], references: [user.id] }),
    tier: one(membershipTier, {
      fields: [membershipSubscription.tierId],
      references: [membershipTier.id],
    }),
    transactions: many(membershipTransaction),
  }),
);

export const membershipTransactionRelations = relations(membershipTransaction, ({ one }) => ({
  user: one(user, { fields: [membershipTransaction.userId], references: [user.id] }),
  subscription: one(membershipSubscription, {
    fields: [membershipTransaction.subscriptionId],
    references: [membershipSubscription.id],
  }),
  tier: one(membershipTier, {
    fields: [membershipTransaction.tierId],
    references: [membershipTier.id],
  }),
}));

export type MembershipTier = typeof membershipTier.$inferSelect;
export type MembershipSubscription = typeof membershipSubscription.$inferSelect;
export type MembershipTransaction = typeof membershipTransaction.$inferSelect;
export type MembershipInvoice = typeof membershipInvoice.$inferSelect;
export type MembershipInvoiceItem = typeof membershipInvoiceItem.$inferSelect;
export type MembershipPayment = typeof membershipPayment.$inferSelect;
export type MembershipWebhookEvent = typeof membershipWebhookEvent.$inferSelect;
