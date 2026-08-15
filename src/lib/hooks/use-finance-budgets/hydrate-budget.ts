import type { BudgetCategory, BudgetTransaction } from "@/types/finance";

import type { BudgetCategoryRow, BudgetTransactionRow } from "./types";

/**
 * Hydrates a budget API category row into the dashboard's BudgetCategory
 * shape. Spend figures arrive precomputed from the service; the status band
 * compares cents directly so a zero-allocation category with spend is
 * honestly over budget (percentageUsed alone cannot express that case).
 */
export function hydrateBudgetCategory(row: BudgetCategoryRow): BudgetCategory {
  const spentCents = Math.round(Number.parseFloat(row.spentAmount) * 100);
  const allocatedCents = Math.round(Number.parseFloat(row.allocatedAmount) * 100);
  const overBudget = spentCents > allocatedCents;
  const status = overBudget ? "over-budget" : row.percentageUsed >= 80 ? "warning" : "on-track";

  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    color: row.color,
    allocatedAmount: Number.parseFloat(row.allocatedAmount),
    spentAmount: Number.parseFloat(row.spentAmount),
    remainingAmount: Number.parseFloat(row.remainingAmount),
    percentageUsed: row.percentageUsed,
    status,
  };
}

/** Hydrates a budget API transaction row into the dashboard's shape. */
export function hydrateBudgetTransaction(row: BudgetTransactionRow): BudgetTransaction {
  return {
    id: row.id,
    categoryId: row.categoryId,
    description: row.description,
    amount: Number.parseFloat(row.amount),
    date: new Date(row.date),
    type: row.type,
    status: row.status,
    vendor: row.vendor ?? undefined,
    receiptUrl: row.receiptUrl ?? undefined,
    notes: row.notes ?? undefined,
    approvedBy: row.approvedBy ?? undefined,
    approvedAt: row.approvedAt ? new Date(row.approvedAt) : undefined,
  };
}
