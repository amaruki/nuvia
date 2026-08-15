import type { BudgetCategory, BudgetTransaction } from "@/types/finance";

import type { BudgetOverviewSummary } from "./types";

/** Rounds money sums to cents so float drift never reaches the cards. */
const roundCents = (value: number) => Math.round(value * 100) / 100;

/** Compares money in integer cents so float noise never flips a band. */
const isOverBudget = (category: BudgetCategory) =>
  Math.round(category.spentAmount * 100) > Math.round(category.allocatedAmount * 100);

/**
 * Overview figures are derived client-side from the categories list and the
 * bounded transaction window, never invented and never fetched from a
 * separate endpoint.
 *
 * totalSpent comes from the categories' server-computed spent amounts (the
 * exact sum of ALL approved expense transactions), so it stays exact even
 * beyond the window cap; only approvedExpenseCount is window-bounded (see
 * STATISTICS_WINDOW_LIMIT).
 */
export function buildBudgetOverview(
  categories: BudgetCategory[],
  windowTransactions: BudgetTransaction[],
): BudgetOverviewSummary {
  const totalBudget = roundCents(categories.reduce((sum, c) => sum + c.allocatedAmount, 0));
  const totalSpent = roundCents(categories.reduce((sum, c) => sum + c.spentAmount, 0));
  const totalRemaining = roundCents(totalBudget - totalSpent);

  return {
    totalBudget,
    totalSpent,
    totalRemaining,
    percentageUsed: totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 1000) / 10 : 0,
    categoryCount: categories.length,
    overBudgetCount: categories.filter(isOverBudget).length,
    approvedExpenseCount: windowTransactions.filter(
      (t) => t.status === "approved" && t.type === "expense",
    ).length,
  };
}
