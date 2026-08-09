/**
 * Finance request schemas (backlog C2 + C3). Zod is the source of truth for
 * request shapes (CODING_STANDARD §2.2); the tier/subscription services and
 * the /api/v1/finance routes both parse through these.
 *
 * Money rule (ADR-0015): every amount is numeric(10,2) string mode. The
 * schemas accept string decimals ONLY — a JSON number has already lost
 * decimal exactness by the time it arrives.
 */

import { z } from "zod";

/** A decimal string fitting numeric(10,2): up to 8 integer + 2 fraction digits, never negative. */
export const moneyString = z
  .string()
  .regex(
    /^\d{1,8}(\.\d{1,2})?$/,
    'Amount must be a decimal string like "100.00" (max 10 digits total, 2 decimals)',
  );

/** membership_tiers.billing_cycle — the schema column is free text with these three values. */
export const billingCycleSchema = z.enum(["monthly", "yearly", "lifetime"]);

export const createTierSchema = z.object({
  name: z.string().trim().min(1).max(100),
  displayName: z.string().trim().min(1).max(200),
  description: z.string().max(2000).nullish(),
  price: moneyString,
  billingCycle: billingCycleSchema,
  features: z.array(z.string()).default([]),
  benefits: z.array(z.string()).default([]),
  permissions: z.array(z.string()).default([]),
  maxUsers: z.number().int().positive().nullish(),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).default(0),
  color: z.string().max(50).nullish(),
  icon: z.string().max(50).nullish(),
  trialDays: z.number().int().min(0).default(0),
  metadata: z.record(z.string(), z.unknown()).nullish(),
});

/** Input shape callers provide (defaults not yet applied). */
export type CreateTierInput = z.input<typeof createTierSchema>;

/**
 * PATCH shape: every field optional, and no .default() anywhere — a default
 * here would silently overwrite stored values the client never sent.
 */
export const updateTierSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    displayName: z.string().trim().min(1).max(200).optional(),
    description: z.string().max(2000).nullish(),
    price: moneyString.optional(),
    billingCycle: billingCycleSchema.optional(),
    features: z.array(z.string()).optional(),
    benefits: z.array(z.string()).optional(),
    permissions: z.array(z.string()).optional(),
    maxUsers: z.number().int().positive().nullish(),
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional(),
    color: z.string().max(50).nullish(),
    icon: z.string().max(50).nullish(),
    trialDays: z.number().int().min(0).optional(),
    metadata: z.record(z.string(), z.unknown()).nullish(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export type UpdateTierInput = z.infer<typeof updateTierSchema>;

export const createSubscriptionSchema = z.object({
  userId: z.string().min(1),
  tierId: z.string().min(1),
  /** Start of the first billing period; defaults to now. */
  startDate: z.coerce.date().optional(),
  /**
   * Explicit trial control, overriding the tier's trialDays. 0 skips the
   * trial even when the tier offers one.
   */
  trialDays: z.number().int().min(0).optional(),
  /** Explicit trial end; implies a trial regardless of trialDays. */
  trialEnd: z.coerce.date().nullish(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;

/** Body for renew/pause/resume/past-due/expire — an optional treasurer note. */
export const lifecycleActionSchema = z.object({
  reason: z.string().max(500).optional(),
});

export type LifecycleActionInput = z.infer<typeof lifecycleActionSchema>;

export const cancelSubscriptionSchema = z.object({
  /** true: keep the subscription running, cancel at period end. false (default): cancel now. */
  atPeriodEnd: z.boolean().default(false),
  reason: z.string().max(500).optional(),
});

/** Input shape callers provide (defaults not yet applied). */
export type CancelSubscriptionInput = z.input<typeof cancelSubscriptionSchema>;

/** Invoice statuses — mirrors InvoiceStatus in src/db/schema/enums.ts. */
export const invoiceStatusSchema = z.enum(["ISSUED", "PAID", "VOID"]);

/**
 * C3: invoice creation. An invoice always bills exactly one subscription
 * (user + tier are derived from it). Omitted `items` produces a single
 * default line item from the tier's price (see invoice.service).
 */
export const invoiceItemInputSchema = z.object({
  description: z.string().trim().min(1).max(500),
  quantity: z.number().int().positive().default(1),
  unitPrice: moneyString,
});

export const createInvoiceSchema = z.object({
  subscriptionId: z.string().min(1),
  items: z.array(invoiceItemInputSchema).min(1).optional(),
  notes: z.string().max(2000).optional(),
  dueDate: z.coerce.date().optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type InvoiceItemInput = z.infer<typeof invoiceItemInputSchema>;

/**
 * C3: manual payment recording. Amounts stay string-mode; the service
 * rejects overpayment and payments against non-ISSUED invoices.
 */
export const recordPaymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: moneyString,
  paymentMethod: z.string().trim().min(1).max(100).optional(),
  reason: z.string().max(500).optional(),
});

export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;

/** Shared pagination for finance list endpoints (docs/api/conventions.md). */
export const pageSchema = z.coerce.number().int().min(1).default(1);
export const limitSchema = z.coerce.number().int().min(1).max(100).default(20);

export const invoiceListQuerySchema = z.object({
  userId: z.string().min(1).optional(),
  subscriptionId: z.string().min(1).optional(),
  status: invoiceStatusSchema.optional(),
  page: pageSchema,
  limit: limitSchema,
});

export type InvoiceListQuery = z.infer<typeof invoiceListQuerySchema>;

export const paymentListQuerySchema = z.object({
  invoiceId: z.string().min(1).optional(),
  userId: z.string().min(1).optional(),
  subscriptionId: z.string().min(1).optional(),
  page: pageSchema,
  limit: limitSchema,
});

export type PaymentListQuery = z.infer<typeof paymentListQuerySchema>;

/**
 * UI-16: budget category form schema. `allocatedAmount` is coerced from the
 * number input, and `subcategories` defaults to an empty list so the field
 * array can start from nothing.
 */
export const budgetSubcategorySchema = z.object({
  name: z.string().trim().min(1, "Subcategory name is required").max(100),
  allocatedAmount: z.number().min(0, "Amount must not be negative"),
});

export const budgetCategorySchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(100),
  period: z.string().min(1, "Select a budget period"),
  description: z.string().max(500).optional().or(z.literal("")),
  allocatedAmount: z.coerce.number().min(0, "Amount must not be negative"),
  color: z.string().min(1, "Pick a color"),
  subcategories: z.array(budgetSubcategorySchema).default([]),
});

export type BudgetCategoryFormValues = z.infer<typeof budgetCategorySchema>;
