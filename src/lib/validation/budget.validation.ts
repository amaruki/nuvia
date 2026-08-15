/**
 * Budget request schemas (budget_categories + budget_transactions store).
 * Zod is the source of truth for the /api/v1/finance/budgets and
 * /api/v1/finance/budget-transactions routes and for the dashboard form
 * sheets; the DB tables live in src/db/schema/budgets.ts.
 *
 * Amounts stay numeric(10,2) string mode (ADR-0015 §5). Form schemas coerce
 * the number input; API schemas accept decimal strings only.
 */

import { z } from "zod";

import { limitSchema, moneyString, pageSchema } from "./finance.validation";

/** Mirrors budgetTransactionTypeEnum in src/db/schema/budgets.ts. */
export const budgetTransactionTypeSchema = z.enum(["expense", "income", "refund"]);

/** Mirrors budgetTransactionStatusEnum in src/db/schema/budgets.ts. */
export const budgetTransactionStatusSchema = z.enum(["pending", "approved", "rejected"]);

/** A money string that is strictly positive: recorded amounts are never zero. */
export const positiveMoneyString = moneyString.refine(
  (value) => Number.parseFloat(value) > 0,
  "Amount must be greater than zero",
);

/** Optional free text: an empty string is treated as "not provided". */
const optionalText = (max: number) =>
  z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().trim().max(max).optional(),
  );

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export const budgetCategoryCreateSchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(100),
  description: optionalText(500),
  color: z.string().min(1, "Pick a color").max(50),
  allocatedAmount: moneyString,
});

export type BudgetCategoryCreateInput = z.infer<typeof budgetCategoryCreateSchema>;

/**
 * Category form sheet schema: `allocatedAmount` is coerced from the number
 * input, so the form works in numbers and the mutation renders the money
 * string for the API.
 */
export const budgetCategoryFormSchema = z.object({
  name: z.string().trim().min(1, "Category name is required").max(100),
  description: z.string().max(500).optional().or(z.literal("")),
  color: z.string().min(1, "Pick a color").max(50),
  allocatedAmount: z.coerce.number().min(0, "Amount must not be negative"),
});

export type BudgetCategoryFormValues = z.infer<typeof budgetCategoryFormSchema>;
export type BudgetCategoryFormInput = z.input<typeof budgetCategoryFormSchema>;

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

export const budgetTransactionCreateSchema = z.object({
  categoryId: z.string().min(1, "Category is required"),
  description: z.string().trim().min(1, "Description is required").max(500),
  amount: positiveMoneyString,
  /** Defaults to now in the service when omitted. */
  date: z.coerce.date().optional(),
  type: budgetTransactionTypeSchema,
  status: budgetTransactionStatusSchema.default("pending"),
  vendor: optionalText(200),
  receiptUrl: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().url("Receipt must be a valid URL").max(2048).optional(),
  ),
  notes: optionalText(2000),
});

export type BudgetTransactionCreateInput = z.infer<typeof budgetTransactionCreateSchema>;

/**
 * Transaction form sheet schema (record mode): amounts coerce from the
 * number input and the date field stays a YYYY-MM-DD string until the
 * mutation renders it for the API.
 */
export const budgetTransactionFormSchema = z.object({
  categoryId: z.string().min(1, "Pick a category"),
  description: z.string().trim().min(1, "Description is required").max(500),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  date: z.string().min(1, "Pick a date"),
  type: budgetTransactionTypeSchema,
  status: budgetTransactionStatusSchema.default("pending"),
  vendor: z.string().trim().max(200).optional().or(z.literal("")),
  receiptUrl: z.string().url("Receipt must be a valid URL").max(2048).optional().or(z.literal("")),
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export type BudgetTransactionFormValues = z.infer<typeof budgetTransactionFormSchema>;
export type BudgetTransactionFormInput = z.input<typeof budgetTransactionFormSchema>;

/**
 * PATCH shape for a transaction: status drives the approval flow (approving
 * records who/when in the service) and notes stay editable. Every field
 * optional, no .default() — a default here would silently overwrite stored
 * values the client never sent.
 */
export const budgetTransactionUpdateSchema = z
  .object({
    status: budgetTransactionStatusSchema.optional(),
    notes: optionalText(2000),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field must be provided",
  });

export type BudgetTransactionUpdateInput = z.infer<typeof budgetTransactionUpdateSchema>;

/** Edit-mode form schema for the transaction sheet (status + notes only). */
export const budgetTransactionEditFormSchema = z.object({
  status: budgetTransactionStatusSchema,
  notes: z.string().max(2000).optional().or(z.literal("")),
});

export type BudgetTransactionEditFormValues = z.infer<typeof budgetTransactionEditFormSchema>;
export type BudgetTransactionEditFormInput = z.input<typeof budgetTransactionEditFormSchema>;

// ---------------------------------------------------------------------------
// List queries (docs/api/conventions.md pagination)
// ---------------------------------------------------------------------------

export const budgetCategoryListQuerySchema = z.object({
  page: pageSchema,
  limit: limitSchema,
});

export type BudgetCategoryListQuery = z.infer<typeof budgetCategoryListQuerySchema>;

export const budgetTransactionListQuerySchema = z.object({
  type: budgetTransactionTypeSchema.optional(),
  status: budgetTransactionStatusSchema.optional(),
  categoryId: z.string().min(1).optional(),
  page: pageSchema,
  limit: limitSchema,
});

export type BudgetTransactionListQuery = z.infer<typeof budgetTransactionListQuerySchema>;
