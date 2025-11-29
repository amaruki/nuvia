export interface BudgetCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
  status: 'on-track' | 'warning' | 'over-budget';
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
  status: 'active' | 'upcoming' | 'completed';
  categories: BudgetCategory[];
}

export interface BudgetTransaction {
  id: string;
  categoryId: string;
  subcategoryId?: string;
  description: string;
  amount: number;
  date: Date;
  type: 'expense' | 'income' | 'refund';
  status: 'pending' | 'approved' | 'rejected';
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

export interface BudgetFormData {
  categoryId?: string;
  name: string;
  description?: string;
  allocatedAmount: number;
  period: string;
  color: string;
  subcategories?: Array<{
    name: string;
    allocatedAmount: number;
  }>;
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

// Member Dues related types
export interface MemberDue {
  id: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  membershipTier: string;
  dueAmount: number;
  paidAmount: number;
  balanceAmount: number;
  dueDate: Date;
  paidDate?: Date;
  status: 'pending' | 'paid' | 'overdue' | 'partial' | 'cancelled';
  paymentMethod?: string;
  transactionId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DuePayment {
  id: string;
  dueId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  transactionId: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  processedBy: string;
  notes?: string;
  createdAt: Date;
}

export interface DueReminder {
  id: string;
  dueId: string;
  reminderType: 'email' | 'sms' | 'in_app';
  scheduledDate: Date;
  sentDate?: Date;
  status: 'scheduled' | 'sent' | 'failed';
  template: string;
  recipient: string;
  createdAt: Date;
}

export interface DueStatistics {
  totalDues: number;
  totalAmount: number;
  collectedAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  collectionRate: number;
  overdueCount: number;
  upcomingDues: number;
  monthlyTrend: Array<{
    month: string;
    amount: number;
    collected: number;
  }>;
  tierBreakdown: Array<{
    tier: string;
    count: number;
    amount: number;
    collected: number;
  }>;
}

export interface DueFilterOptions {
  status?: string[];
  tier?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  amountRange?: {
    min: number;
    max: number;
  };
  search?: string;
}

export interface DueFormData {
  memberId: string;
  membershipTier: string;
  dueAmount: number;
  dueDate: Date;
  notes?: string;
}