/**
 * Budget store: categories with allocations and the transactions recorded
 * against them. A category holds an allocated amount; transactions are the
 * spend/income/refund entries a treasurer records per category. Only
 * approved expense transactions count toward a category's spent amount (the
 * aggregation lives in src/lib/services/budget.service.ts).
 *
 * Budget periods and subcategories are deliberately out of scope: the store
 * tracks categories and transactions only.
 *
 * Amounts are numeric(10,2) string mode end to end, like the rest of the
 * finance schema (ADR-0015 §5).
 */

import { relations } from "drizzle-orm";
import { index, numeric, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./users";

/** Direction of a budget transaction. */
export const budgetTransactionTypeEnum = pgEnum("budget_transaction_type", [
  "expense",
  "income",
  "refund",
]);

/**
 * Approval lifecycle of a budget transaction. Only `approved` expenses are
 * summed into a category's spent amount; `pending` and `rejected` rows stay
 * visible in the ledger but never move the numbers.
 */
export const budgetTransactionStatusEnum = pgEnum("budget_transaction_status", [
  "pending",
  "approved",
  "rejected",
]);

export const budgetCategory = pgTable("budget_categories", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  color: text("color").notNull(),
  allocatedAmount: numeric("allocated_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const budgetTransaction = pgTable(
  "budget_transactions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    categoryId: text("category_id")
      .notNull()
      .references(() => budgetCategory.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
    type: budgetTransactionTypeEnum("type").notNull(),
    status: budgetTransactionStatusEnum("status").notNull().default("pending"),
    vendor: text("vendor"),
    receiptUrl: text("receipt_url"),
    notes: text("notes"),
    /** User who approved the transaction; null until approval. */
    approvedBy: text("approved_by").references(() => user.id, { onDelete: "set null" }),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("budget_transactions_category_idx").on(table.categoryId),
    index("budget_transactions_status_idx").on(table.status),
    index("budget_transactions_date_idx").on(table.date),
  ],
);

export const budgetCategoryRelations = relations(budgetCategory, ({ many }) => ({
  transactions: many(budgetTransaction),
}));

export const budgetTransactionRelations = relations(budgetTransaction, ({ one }) => ({
  category: one(budgetCategory, {
    fields: [budgetTransaction.categoryId],
    references: [budgetCategory.id],
  }),
  approver: one(user, {
    fields: [budgetTransaction.approvedBy],
    references: [user.id],
  }),
}));

export type BudgetCategory = typeof budgetCategory.$inferSelect;
export type BudgetTransaction = typeof budgetTransaction.$inferSelect;
export type BudgetTransactionType = BudgetTransaction["type"];
export type BudgetTransactionStatus = BudgetTransaction["status"];
