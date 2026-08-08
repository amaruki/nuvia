export interface IncomeStatementData {
  revenue: {
    totalRevenue: number;
    operatingRevenue: number;
    nonOperatingRevenue: number;
    breakdown: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
  };
  expenses: {
    totalExpenses: number;
    operatingExpenses: number;
    nonOperatingExpenses: number;
    breakdown: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
  };
  netIncome: number;
  grossProfit: number;
  operatingIncome: number;
  ebitda: number;
  periodComparison: {
    currentPeriod: number;
    previousPeriod: number;
    change: number;
    changePercentage: number;
  };
}

export interface BalanceSheetData {
  assets: {
    totalAssets: number;
    currentAssets: number;
    nonCurrentAssets: number;
    breakdown: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
  };
  liabilities: {
    totalLiabilities: number;
    currentLiabilities: number;
    nonCurrentLiabilities: number;
    breakdown: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
  };
  equity: {
    totalEquity: number;
    breakdown: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
  };
  periodComparison: {
    currentPeriod: number;
    previousPeriod: number;
    change: number;
    changePercentage: number;
  };
}

export interface CashFlowData {
  operatingActivities: {
    netIncome: number;
    adjustments: number;
    changesInWorkingCapital: number;
    netCashFromOperations: number;
  };
  investingActivities: {
    capitalExpenditures: number;
    investments: number;
    netCashFromInvesting: number;
  };
  financingActivities: {
    debtIssuance: number;
    debtRepayment: number;
    equityIssuance: number;
    dividendsPaid: number;
    netCashFromFinancing: number;
  };
  netChangeInCash: number;
  cashAtBeginning: number;
  cashAtEnd: number;
  periodComparison: {
    currentPeriod: number;
    previousPeriod: number;
    change: number;
    changePercentage: number;
  };
}

export interface BudgetVsActualData {
  categories: Array<{
    id: string;
    name: string;
    budgeted: number;
    actual: number;
    variance: number;
    variancePercentage: number;
    status: "under_budget" | "on_track" | "over_budget";
    subcategories?: Array<{
      name: string;
      budgeted: number;
      actual: number;
      variance: number;
      variancePercentage: number;
    }>;
  }>;
  totalBudgeted: number;
  totalActual: number;
  totalVariance: number;
  totalVariancePercentage: number;
  periodComparison: {
    currentPeriod: number;
    previousPeriod: number;
    change: number;
    changePercentage: number;
  };
}

export interface TaxDocumentData {
  taxYear: number;
  taxType: "income_tax" | "sales_tax" | "property_tax" | "payroll_tax" | "other";
  totalTaxableIncome: number;
  totalTax: number;
  taxPaid: number;
  taxDue: number;
  deductions: Array<{
    category: string;
    amount: number;
    description: string;
  }>;
  credits: Array<{
    category: string;
    amount: number;
    description: string;
  }>;
  filingStatus: string;
  filedAt?: Date;
  confirmedAt?: Date;
}

export interface AuditTrailData {
  auditPeriod: {
    startDate: Date;
    endDate: Date;
  };
  auditedBy: string;
  auditType: "internal" | "external" | "compliance";
  status: "in_progress" | "completed" | "findings_identified" | "resolved";
  findings: Array<{
    id: string;
    category: string;
    severity: "low" | "medium" | "high" | "critical";
    description: string;
    recommendation: string;
    status: "open" | "in_progress" | "resolved";
    resolvedAt?: Date;
  }>;
  complianceScore: number;
  riskAssessment: {
    overall: "low" | "medium" | "high";
    financial: "low" | "medium" | "high";
    operational: "low" | "medium" | "high";
    compliance: "low" | "medium" | "high";
  };
  reportUrl?: string;
}
