/**
 * Finance request schemas (backlog C2). Zod is the source of truth for
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
