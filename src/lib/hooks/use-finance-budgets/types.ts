import type { BudgetCategory, BudgetTransaction } from "@/types/finance";

// ---------------------------------------------------------------------------
// Wire shapes (ISO dates, decimal strings) returned by the budget API
// ---------------------------------------------------------------------------

/** Wire shape of GET /api/v1/finance/budgets category rows. */
export interface BudgetCategoryRow {
  id: string;
  name: string;
  description: string | null;
  color: string;
  allocatedAmount: string;
  spentAmount: string;
  remainingAmount: string;
  percentageUsed: number;
  createdAt: string;
  updatedAt: string;
}

/** Wire shape of /api/v1/finance/budget-transactions rows. */
export interface BudgetTransactionRow {
  id: string;
  categoryId: string;
  description: string;
  amount: string;
  date: string;
  type: "expense" | "income" | "refund";
  status: "pending" | "approved" | "rejected";
  vendor: string | null;
  receiptUrl: string | null;
  notes: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Mutation inputs (API request bodies)
// ---------------------------------------------------------------------------

export interface BudgetCategoryInput {
  name: string;
  description?: string;
  color: string;
  /** Money string, e.g. "1200.00". */
  allocatedAmount: string;
}

export interface BudgetTransactionInput {
  categoryId: string;
  description: string;
  /** Money string, e.g. "45.99". */
  amount: string;
  /** ISO date; omitted records the transaction as of now. */
  date?: string;
  type: BudgetTransactionRow["type"];
  status?: BudgetTransactionRow["status"];
  vendor?: string;
  receiptUrl?: string;
  notes?: string;
}

export interface BudgetTransactionStatusInput {
  status?: BudgetTransactionRow["status"];
  notes?: string;
}

// ---------------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------------

/**
 * Overview-card figures built client-side from the categories list (whose
 * spent amounts the service derives exactly) plus the bounded transaction
 * window. Never fetched from a separate endpoint and never invented.
 */
export interface BudgetOverviewSummary {
  /** Sum of all category allocations. */
  totalBudget: number;
  /** Sum of all categories' approved-expense spend. */
  totalSpent: number;
  /** totalBudget - totalSpent; negative when over budget overall. */
  totalRemaining: number;
  /** totalSpent / totalBudget as a percentage, one decimal. */
  percentageUsed: number;
  categoryCount: number;
  /** Categories whose spend exceeds their allocation. */
  overBudgetCount: number;
  /** Approved expense rows inside the aggregate window (documented cap). */
  approvedExpenseCount: number;
}

// ---------------------------------------------------------------------------
// Hook contract
// ---------------------------------------------------------------------------

export interface UseFinanceBudgetsOptions {
  /** 1-based page of the transactions table. */
  page: number;
  /** Rows per page requested from the transactions endpoint. */
  pageSize: number;
}

export interface UseFinanceBudgetsReturn {
  // Table data (one server-paginated page)
  transactions: BudgetTransaction[];
  total: number;
  totalPages: number;
  /** Initial load gate for the whole page. */
  loading: boolean;
  /** True while a table page/refetch is in flight (skeleton rows). */
  fetching: boolean;
  error: string | null;

  // Categories (windowed at STATISTICS_WINDOW_LIMIT, documented cap)
  categories: BudgetCategory[];

  // Overview cards
  overview: BudgetOverviewSummary;

  // Actions (resolve with the stored row; throw ApiClientError on failure)
  createCategory: (input: BudgetCategoryInput) => Promise<BudgetCategoryRow>;
  recordTransaction: (input: BudgetTransactionInput) => Promise<BudgetTransactionRow>;
  updateTransaction: (
    id: string,
    input: BudgetTransactionStatusInput,
  ) => Promise<BudgetTransactionRow>;
  refreshData: () => void;
}
