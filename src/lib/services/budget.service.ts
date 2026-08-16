/**
 * Budget service: categories with allocations and the transactions recorded
 * against them (budget_categories + budget_transactions store).
 *
 * Spent amounts are derived, never stored: a category's spent amount is the
 * sum of its APPROVED EXPENSE transactions (pending/rejected rows and
 * income/refund rows never move the number). Money stays numeric(10,2)
 * string mode; arithmetic happens in minor units (ADR-0015 §5).
 */

import { and, count, desc, eq, sql, sum } from "drizzle-orm";
import { db } from "@/db/client";
import {
  budgetCategory,
  budgetTransaction,
  type BudgetCategory as BudgetCategoryRow,
  type BudgetTransaction as BudgetTransactionRow,
} from "@/db/schema";
import { BusinessLogicError, NotFoundError } from "@/lib/errors";
import { toAmountString, toMinorUnits } from "@/lib/payments/gateway";
import type {
  BudgetCategoryCreateInput,
  BudgetCategoryListQuery,
  BudgetTransactionCreateInput,
  BudgetTransactionListQuery,
  BudgetTransactionUpdateInput,
} from "@/lib/validation/budget.validation";
import type { ActorContext } from "@/lib/services/subscription.service";
import { writeAudit } from "./payment/audit";

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

type BudgetTx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Issue #27 (finding 5): approval guardrail. Computes the category's spent
 * approved-expense total (excluding `excludeTransactionId`, the row being
 * re-evaluated on an update) and refuses to approve an expense that would
 * push the category past its allocation. Income and refund rows never
 * consume budget, so only expense approvals reach this check.
 *
 * Runs inside the caller's transaction so the category row can be locked
 * (SELECT ... FOR UPDATE) — two concurrent approvals can no longer both
 * read "enough remaining" and then double-commit.
 */
async function assertExpenseWithinBudget(
  tx: BudgetTx,
  categoryId: string,
  amountMinor: number,
  excludeTransactionId?: string,
): Promise<{ allocatedMinor: number; spentMinor: number; remainingMinor: number }> {
  // Lock the category row so concurrent approvals serialize here.
  const [category] = await tx
    .select()
    .from(budgetCategory)
    .where(eq(budgetCategory.id, categoryId))
    .for("update");
  if (!category) {
    throw new NotFoundError("Budget category", categoryId);
  }

  const conditions = [
    eq(budgetTransaction.categoryId, categoryId),
    eq(budgetTransaction.status, "approved"),
    eq(budgetTransaction.type, "expense"),
  ];
  if (excludeTransactionId) {
    conditions.push(sql`${budgetTransaction.id} != ${excludeTransactionId}`);
  }
  const [spentRow] = await tx
    .select({ spent: sum(budgetTransaction.amount) })
    .from(budgetTransaction)
    .where(and(...conditions));

  const allocatedMinor = toMinorUnits(category.allocatedAmount);
  const spentMinor = toMinorUnits(spentRow?.spent ?? "0");
  const remainingMinor = allocatedMinor - spentMinor;

  if (amountMinor > remainingMinor) {
    throw new BusinessLogicError(
      `Approval exceeds the "${category.name}" budget: ${toAmountString(amountMinor)} requested but only ${signedAmountString(remainingMinor)} remains`,
      "BUDGET_EXCEEDED",
    );
  }

  return { allocatedMinor, spentMinor, remainingMinor };
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
 * Record a transaction against an existing category. Recording an EXPENSE
 * with status `approved` is a budget commitment, so it runs through the
 * issue #27 guardrail: the approval is rejected if it would push the
 * category past its allocation. Both the approval fields and the audit
 * entry land in ONE transaction with the row (ADR-0009).
 */
export async function createBudgetTransaction(
  input: BudgetTransactionCreateInput,
  actor: ActorContext,
): Promise<BudgetTransactionRow> {
  const approved = input.status === "approved";
  const amountMinor = toMinorUnits(input.amount);

  return db.transaction(async (tx) => {
    const [category] = await tx
      .select({ id: budgetCategory.id, name: budgetCategory.name })
      .from(budgetCategory)
      .where(eq(budgetCategory.id, input.categoryId))
      .limit(1);
    if (!category) {
      throw new NotFoundError("Budget category", input.categoryId);
    }

    // Guardrail: an expense that starts life approved must fit the budget.
    // Pending/rejected rows and income/refund rows never consume budget, so
    // they skip the check (an expense is re-checked when it is approved).
    if (approved && input.type === "expense") {
      const { allocatedMinor, spentMinor, remainingMinor } = await assertExpenseWithinBudget(
        tx,
        input.categoryId,
        amountMinor,
      );
      await writeAudit(tx, {
        userId: null,
        eventType: "BUDGET_APPROVAL",
        severity: "INFO",
        message: `Approved expense ${toAmountString(amountMinor)} against "${category.name}" (${toAmountString(spentMinor)} of ${toAmountString(allocatedMinor)} spent before)`,
        metadata: {
          categoryId: input.categoryId,
          amount: input.amount,
          spentBefore: toAmountString(spentMinor),
          allocated: toAmountString(allocatedMinor),
          remainingAfter: signedAmountString(remainingMinor - amountMinor),
        },
        actor,
      });
    }

    const [row] = await tx
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
  });
}

/**
 * Update status and/or notes. Approving records the actor and timestamp;
 * moving back to pending or rejected clears them, so the approval fields
 * always describe the current state.
 *
 * Issue #27 (finding 5): approving an EXPENSE is a budget commitment — the
 * approval is rejected when it would exceed the category allocation, and
 * every approval (and rejection of an over-budget approval) is audited in
 * the same transaction.
 */
export async function updateBudgetTransaction(
  id: string,
  input: BudgetTransactionUpdateInput,
  actor: ActorContext,
): Promise<BudgetTransactionRow> {
  const becomingApproved = input.status === "approved";

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(budgetTransaction)
      .where(eq(budgetTransaction.id, id))
      .for("update");
    if (!existing) {
      throw new NotFoundError("Budget transaction", id);
    }

    // Re-check the budget only when this PATCH actually commits an expense
    // (a pending/rejected expense moving to approved). The row's own amount
    // is excluded from the spent total so re-approving the same row is a
    // no-op, not a false over-budget error.
    if (becomingApproved && existing.type === "expense") {
      const amountMinor = toMinorUnits(existing.amount);
      const { allocatedMinor, spentMinor, remainingMinor } = await assertExpenseWithinBudget(
        tx,
        existing.categoryId,
        amountMinor,
        existing.id,
      );
      const [category] = await tx
        .select({ name: budgetCategory.name })
        .from(budgetCategory)
        .where(eq(budgetCategory.id, existing.categoryId));
      await writeAudit(tx, {
        userId: null,
        eventType: "BUDGET_APPROVAL",
        severity: "INFO",
        message: `Approved expense ${toAmountString(amountMinor)} (${existing.id}) against "${category?.name ?? existing.categoryId}" (${toAmountString(spentMinor)} of ${toAmountString(allocatedMinor)} spent before)`,
        metadata: {
          transactionId: existing.id,
          categoryId: existing.categoryId,
          amount: existing.amount,
          spentBefore: toAmountString(spentMinor),
          allocated: toAmountString(allocatedMinor),
          remainingAfter: signedAmountString(remainingMinor - amountMinor),
        },
        actor,
      });
    }

    const patchValues: Partial<typeof budgetTransaction.$inferInsert> = {};
    if (input.notes !== undefined) {
      patchValues.notes = input.notes;
    }
    if (input.status !== undefined) {
      patchValues.status = input.status;
      patchValues.approvedBy = input.status === "approved" ? actor.actorId : null;
      patchValues.approvedAt = input.status === "approved" ? new Date() : null;
    }

    const [row] = await tx
      .update(budgetTransaction)
      .set(patchValues)
      .where(eq(budgetTransaction.id, id))
      .returning();

    return row;
  });
}
