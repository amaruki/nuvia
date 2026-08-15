/**
 * Budget service: categories with allocations and the transactions recorded
 * against them (budget_categories + budget_transactions store).
 *
 * Spent amounts are derived, never stored: a category's spent amount is the
 * sum of its APPROVED EXPENSE transactions (pending/rejected rows and
 * income/refund rows never move the number). Money stays numeric(10,2)
 * string mode; arithmetic happens in minor units (ADR-0015 §5).
 */

import { and, count, desc, eq, sum } from "drizzle-orm";
import { db } from "@/db/client";
import {
  budgetCategory,
  budgetTransaction,
  type BudgetCategory as BudgetCategoryRow,
  type BudgetTransaction as BudgetTransactionRow,
} from "@/db/schema";
import { NotFoundError } from "@/lib/errors";
import { toAmountString, toMinorUnits } from "@/lib/payments/gateway";
import type {
  BudgetCategoryCreateInput,
  BudgetCategoryListQuery,
  BudgetTransactionCreateInput,
  BudgetTransactionListQuery,
  BudgetTransactionUpdateInput,
} from "@/lib/validation/budget.validation";
import type { ActorContext } from "@/lib/services/subscription.service";

/** A category row plus its derived spend, the shape every read endpoint returns. */
export interface BudgetCategoryWithUsage extends BudgetCategoryRow {
  /** Sum of approved expense transactions, money string. */
  spentAmount: string;
  /** allocated - spent; negative when the category is over budget. */
  remainingAmount: string;
  /** spent / allocated as a percentage, one decimal, 0 when nothing allocated. */
  percentageUsed: number;
}

/** toAmountString rejects negatives; remaining amounts legitimately go below zero. */
function signedAmountString(minorUnits: number): string {
  return minorUnits < 0 ? `-${toAmountString(-minorUnits)}` : toAmountString(minorUnits);
}

/** Approved-expense totals per category, in minor units. */
async function spentMinorByCategory(): Promise<Map<string, number>> {
  const rows = await db
    .select({
      categoryId: budgetTransaction.categoryId,
      spent: sum(budgetTransaction.amount),
    })
    .from(budgetTransaction)
    .where(and(eq(budgetTransaction.status, "approved"), eq(budgetTransaction.type, "expense")))
    .groupBy(budgetTransaction.categoryId);

  return new Map(rows.map((row) => [row.categoryId, toMinorUnits(row.spent ?? "0")]));
}

function withUsage(category: BudgetCategoryRow, spentMinor: number): BudgetCategoryWithUsage {
  const allocatedMinor = toMinorUnits(category.allocatedAmount);
  const remainingMinor = allocatedMinor - spentMinor;
  const percentageUsed =
    allocatedMinor > 0
      ? Math.round((spentMinor / allocatedMinor) * 1000) / 10
      : spentMinor > 0
        ? 100
        : 0;

  return {
    ...category,
    spentAmount: toAmountString(spentMinor),
    remainingAmount: signedAmountString(remainingMinor),
    percentageUsed,
  };
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

/** Categories with their derived spend, newest first, paginated. */
export async function listBudgetCategories(
  query: BudgetCategoryListQuery,
): Promise<{ categories: BudgetCategoryWithUsage[]; total: number }> {
  const [rows, [{ total }], spent] = await Promise.all([
    db.query.budgetCategory.findMany({
      orderBy: desc(budgetCategory.createdAt),
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    }),
    db.select({ total: count() }).from(budgetCategory),
    spentMinorByCategory(),
  ]);

  return {
    categories: rows.map((category) => withUsage(category, spent.get(category.id) ?? 0)),
    total,
  };
}

/** Create a category; it starts with zero spend. */
export async function createBudgetCategory(
  input: BudgetCategoryCreateInput,
): Promise<BudgetCategoryWithUsage> {
  const [row] = await db
    .insert(budgetCategory)
    .values({
      name: input.name,
      description: input.description ?? null,
      color: input.color,
      allocatedAmount: input.allocatedAmount,
    })
    .returning();

  return withUsage(row, 0);
}

// ---------------------------------------------------------------------------
// Transactions
// ---------------------------------------------------------------------------

/** Filtered, newest-first transaction list with standard pagination meta. */
export async function listBudgetTransactions(
  query: BudgetTransactionListQuery,
): Promise<{ transactions: BudgetTransactionRow[]; total: number }> {
  const conditions = [
    query.type ? eq(budgetTransaction.type, query.type) : undefined,
    query.status ? eq(budgetTransaction.status, query.status) : undefined,
    query.categoryId ? eq(budgetTransaction.categoryId, query.categoryId) : undefined,
  ].filter(Boolean);
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db.query.budgetTransaction.findMany({
      where,
      orderBy: [desc(budgetTransaction.date), desc(budgetTransaction.createdAt)],
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    }),
    db.select({ total: count() }).from(budgetTransaction).where(where),
  ]);

  return { transactions: rows, total };
}

/** One transaction; NotFoundError when absent. */
export async function getBudgetTransaction(id: string): Promise<BudgetTransactionRow> {
  const transaction = await db.query.budgetTransaction.findFirst({
    where: eq(budgetTransaction.id, id),
  });

  if (!transaction) {
    throw new NotFoundError("Budget transaction", id);
  }

  return transaction;
}

/**
 * Record a transaction against an existing category. Recording with status
 * `approved` attributes the approval to the acting user right away.
 */
export async function createBudgetTransaction(
  input: BudgetTransactionCreateInput,
  actor: ActorContext,
): Promise<BudgetTransactionRow> {
  const category = await db.query.budgetCategory.findFirst({
    where: eq(budgetCategory.id, input.categoryId),
  });
  if (!category) {
    throw new NotFoundError("Budget category", input.categoryId);
  }

  const approved = input.status === "approved";
  const [row] = await db
    .insert(budgetTransaction)
    .values({
      categoryId: input.categoryId,
      description: input.description,
      amount: input.amount,
      date: input.date ?? new Date(),
      type: input.type,
      status: input.status,
      vendor: input.vendor ?? null,
      receiptUrl: input.receiptUrl ?? null,
      notes: input.notes ?? null,
      approvedBy: approved ? actor.actorId : null,
      approvedAt: approved ? new Date() : null,
    })
    .returning();

  return row;
}

/**
 * Update status and/or notes. Approving records the actor and timestamp;
 * moving back to pending or rejected clears them, so the approval fields
 * always describe the current state.
 */
export async function updateBudgetTransaction(
  id: string,
  input: BudgetTransactionUpdateInput,
  actor: ActorContext,
): Promise<BudgetTransactionRow> {
  await getBudgetTransaction(id);

  const patch: Partial<typeof budgetTransaction.$inferInsert> = {};
  if (input.notes !== undefined) {
    patch.notes = input.notes;
  }
  if (input.status !== undefined) {
    patch.status = input.status;
    patch.approvedBy = input.status === "approved" ? actor.actorId : null;
    patch.approvedAt = input.status === "approved" ? new Date() : null;
  }

  const [row] = await db
    .update(budgetTransaction)
    .set(patch)
    .where(eq(budgetTransaction.id, id))
    .returning();

  return row;
}
