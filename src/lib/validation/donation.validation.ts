/**
 * Donation request schemas (donations dashboard completion). Zod is the
 * source of truth for both the API routes and the record/edit form sheet
 * (CODING_STANDARD §3.2, §4.3).
 *
 * Amounts stay decimal strings fitting numeric(10,2) — the same string-mode
 * money discipline as the rest of the finance API (ADR-0015 §5).
 */

import { z } from "zod";

import { limitSchema, moneyString, pageSchema } from "./finance.validation";

/** Donor kind — mirrors DonorType in src/db/schema/donations.ts. */
export const donorTypeSchema = z.enum(["individual", "organization", "anonymous"]);

/** Shape of the gift — mirrors DonationType in src/db/schema/donations.ts. */
export const donationTypeSchema = z.enum(["one_time", "recurring", "pledge"]);

/** Donation lifecycle — mirrors DonationStatus in src/db/schema/donations.ts. */
export const donationStatusSchema = z.enum([
  "pending",
  "completed",
  "failed",
  "refunded",
  "pledged",
]);

/**
 * A positive money string: moneyString rejects negatives and non-decimals,
 * and a donation of exactly zero is never a donation.
 */
export const donationAmountSchema = moneyString.refine((value) => Number.parseFloat(value) > 0, {
  message: "Amount must be greater than zero",
});

/**
 * Record a donation. `donationDate` accepts any ISO 8601 date/datetime
 * string (the form's date input sends YYYY-MM-DD); when omitted, the
 * column's defaultNow() dates the donation at insertion time.
 */
export const donationCreateSchema = z.object({
  donorName: z
    .string()
    .trim()
    .min(1, "Donor name is required")
    .max(200, "Donor name must be at most 200 characters"),
  donorEmail: z.email("Enter a valid donor email address"),
  donorType: donorTypeSchema.default("individual"),
  donationType: donationTypeSchema.default("one_time"),
  campaign: z.string().trim().max(200, "Campaign must be at most 200 characters").optional(),
  amount: donationAmountSchema,
  currency: z.string().trim().length(3, "Currency must be a 3-letter ISO code").default("USD"),
  status: donationStatusSchema.default("pending"),
  paymentMethod: z
    .string()
    .trim()
    .max(100, "Payment method must be at most 100 characters")
    .optional(),
  transactionId: z
    .string()
    .trim()
    .max(200, "Transaction ID must be at most 200 characters")
    .optional(),
  donationDate: z
    .string()
    .trim()
    .refine((value) => !Number.isNaN(Date.parse(value)), "Donation date must be an ISO 8601 date")
    .optional(),
  receiptSent: z.boolean().default(false),
  notes: z.string().trim().max(2000, "Notes must be at most 2000 characters").optional(),
});

export type DonationCreateInput = z.infer<typeof donationCreateSchema>;

/**
 * PATCH shape: only the mutable fields. Donor identity, amount, currency
 * and the donation date are immutable once recorded — money records are
 * corrected by new rows (refunds), not by rewriting history. No
 * `.default()` anywhere: a default here would silently overwrite stored
 * values the client never sent. `notes`/`campaign` accept null to clear.
 */
export const donationUpdateSchema = z
  .object({
    status: donationStatusSchema.optional(),
    notes: z.string().trim().max(2000, "Notes must be at most 2000 characters").nullish(),
    receiptSent: z.boolean().optional(),
    campaign: z.string().trim().max(200, "Campaign must be at most 200 characters").nullish(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export type DonationUpdateInput = z.infer<typeof donationUpdateSchema>;

/** List query: page/limit conventions + an optional status filter. */
export const donationListQuerySchema = z.object({
  page: pageSchema,
  limit: limitSchema,
  status: donationStatusSchema.optional(),
});

export type DonationListQuery = z.infer<typeof donationListQuerySchema>;
