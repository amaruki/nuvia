export interface BudgetCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
  status: "on-track" | "warning" | "over-budget";
  subcategories?: BudgetSubcategory[];
}

export interface BudgetSubcategory {
  id: string;
  name: string;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
}

export interface BudgetPeriod {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  status: "active" | "upcoming" | "completed";
  categories: BudgetCategory[];
}

export interface BudgetTransaction {
  id: string;
  categoryId: string;
  subcategoryId?: string;
  description: string;
  amount: number;
  date: Date;
  type: "expense" | "income" | "refund";
  status: "pending" | "approved" | "rejected";
  vendor?: string;
  receiptUrl?: string;
  notes?: string;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface BudgetOverview {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  percentageUsed: number;
  periodComparison: {
    currentPeriod: number;
    previousPeriod: number;
    change: number;
    changePercentage: number;
  };
  topCategories: BudgetCategory[];
  recentTransactions: BudgetTransaction[];
}

export interface BudgetFilterOptions {
  period: string;
  category: string;
  status: string;
  dateRange: {
    start: Date;
    end: Date;
  };
}

export interface BudgetAnalytics {
  spendingTrends: Array<{
    month: string;
    amount: number;
    budget: number;
  }>;
  categoryBreakdown: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
  monthlyComparison: Array<{
    month: string;
    currentYear: number;
    previousYear: number;
  }>;
  varianceAnalysis: Array<{
    category: string;
    budgeted: number;
    actual: number;
    variance: number;
    variancePercentage: number;
  }>;
}
