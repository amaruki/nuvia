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
  status: "pending" | "paid" | "overdue" | "partial" | "cancelled";
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
  status: "completed" | "pending" | "failed" | "refunded";
  processedBy: string;
  notes?: string;
  createdAt: Date;
}

export interface DueReminder {
  id: string;
  dueId: string;
  reminderType: "email" | "sms" | "in_app";
  scheduledDate: Date;
  sentDate?: Date;
  status: "scheduled" | "sent" | "failed";
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

// Invoice related types
export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled" | "refunded";
  issueDate: Date;
  dueDate: Date;
  paidDate?: Date;
  paidAmount?: number;
  paymentMethod?: string;
  transactionId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category?: string;
  serviceType?: string;
}

export interface InvoicePayment {
  id: string;
  invoiceId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  transactionId: string;
  status: "completed" | "pending" | "failed" | "refunded";
  processedBy: string;
  notes?: string;
  createdAt: Date;
}

export interface InvoiceStatistics {
  totalInvoices: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  collectionRate: number;
  overdueCount: number;
  upcomingInvoices: number;
  monthlyTrend: Array<{
    month: string;
    amount: number;
    collected: number;
  }>;
  clientBreakdown: Array<{
    clientId: string;
    clientName: string;
    invoiceCount: number;
    totalAmount: number;
    paidAmount: number;
  }>;
}

export interface InvoiceFilterOptions {
  status?: string[];
  client?: string[];
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

export interface InvoiceFormData {
  clientId: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    category?: string;
    serviceType?: string;
  }>;
  issueDate: Date;
  dueDate: Date;
  notes?: string;
  currency?: string;
}

// Donation related types
export interface Donation {
  id: string;
  donorId: string;
  donorName: string;
  donorEmail: string;
  donorType: "individual" | "organization" | "anonymous";
  donationType: "one_time" | "recurring" | "pledge";
  campaign?: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded" | "pledged";
  paymentMethod?: string;
  transactionId?: string;
  donationDate: Date;
  receiptSent: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DonationCampaign {
  id: string;
  name: string;
  description: string;
  goalAmount: number;
  raisedAmount: number;
  startDate: Date;
  endDate?: Date;
  status: "active" | "completed" | "cancelled" | "upcoming";
  category: string;
  featured: boolean;
  createdAt: Date;
}

export interface DonationPayment {
  id: string;
  donationId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  transactionId: string;
  status: "completed" | "pending" | "failed" | "refunded";
  processedBy: string;
  notes?: string;
  createdAt: Date;
}

export interface DonationStatistics {
  totalDonations: number;
  totalAmount: number;
  completedAmount: number;
  pendingAmount: number;
  pledgedAmount: number;
  averageDonation: number;
  donorCount: number;
  recurringDonorCount: number;
  monthlyTrend: Array<{
    month: string;
    amount: number;
    count: number;
  }>;
  campaignBreakdown: Array<{
    campaignId: string;
    campaignName: string;
    amount: number;
    count: number;
  }>;
  donorTypeBreakdown: Array<{
    donorType: string;
    amount: number;
    count: number;
  }>;
}

export interface DonationFilterOptions {
  status?: string[];
  donorType?: string[];
  donationType?: string[];
  campaign?: string[];
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

export interface DonationFormData {
  donorId: string;
  donorType: "individual" | "organization" | "anonymous";
  donationType: "one_time" | "recurring" | "pledge";
  campaign?: string;
  amount: number;
  currency?: string;
  notes?: string;
  sendReceipt?: boolean;
  sendThankYou?: boolean;
}

// Financial Reports related types
export interface FinancialReport {
  id: string;
  title: string;
  description: string;
  type:
    | "income_statement"
    | "balance_sheet"
    | "cash_flow"
    | "budget_vs_actual"
    | "tax_document"
    | "audit_trail";
  period: string;
  startDate: Date;
  endDate: Date;
  status: "draft" | "pending_review" | "approved" | "published" | "archived";
  generatedBy: string;
  generatedAt: Date;
  reviewedBy?: string;
  reviewedAt?: Date;
  publishedAt?: Date;
  fileUrl?: string;
  fileSize?: number;
  downloadCount: number;
  tags: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportSection {
  id: string;
  reportId: string;
  title: string;
  order: number;
  type: "table" | "chart" | "text" | "summary";
  content: any; // Dynamic content based on type
  createdAt: Date;
}

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

export interface ReportStatistics {
  totalReports: number;
  publishedReports: number;
  draftReports: number;
  pendingReviewReports: number;
  archivedReports: number;
  totalDownloads: number;
  reportsByType: Array<{
    type: string;
    count: number;
    downloads: number;
  }>;
  reportsByPeriod: Array<{
    period: string;
    count: number;
    downloads: number;
  }>;
  recentActivity: Array<{
    reportId: string;
    reportTitle: string;
    action: string;
    performedBy: string;
    performedAt: Date;
  }>;
  monthlyTrend: Array<{
    month: string;
    generated: number;
    downloaded: number;
  }>;
}

export interface ReportFilterOptions {
  type?: string[];
  status?: string[];
  period?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  generatedBy?: string[];
  tags?: string[];
  search?: string;
}

export interface ReportFormData {
  title: string;
  description: string;
  type:
    | "income_statement"
    | "balance_sheet"
    | "cash_flow"
    | "budget_vs_actual"
    | "tax_document"
    | "audit_trail";
  period: string;
  startDate: Date;
  endDate: Date;
  tags: string[];
  notes?: string;
}

// Payment Gateway related types
export interface PaymentGateway {
  id: string;
  name: string;
  provider: "stripe" | "paypal" | "square" | "adyen" | "razorpay" | "mollie" | "other";
  displayName: string;
  description?: string;
  status: "active" | "inactive" | "testing" | "error";
  environment: "sandbox" | "production";
  currencies: string[];
  supportedPaymentMethods: PaymentMethod[];
  transactionFees: TransactionFee[];
  webhookUrl?: string;
  apiKey?: string; // Only for display purposes, never expose actual keys
  apiSecret?: string; // Only for display purposes, never expose actual keys
  merchantId?: string;
  accountId?: string;
  isDefault: boolean;
  isEnabled: boolean;
  configuration: GatewayConfiguration;
  statistics: GatewayStatistics;
  createdAt: Date;
  updatedAt: Date;
  lastTestedAt?: Date;
  createdBy: string;
  updatedBy?: string;
}

export interface PaymentMethod {
  id: string;
  type:
    | "credit_card"
    | "debit_card"
    | "bank_transfer"
    | "digital_wallet"
    | "cryptocurrency"
    | "buy_now_pay_later";
  name: string;
  displayName: string;
  isEnabled: boolean;
  supportedNetworks?: string[]; // e.g., ['visa', 'mastercard', 'amex']
  icon?: string;
}

export interface TransactionFee {
  id: string;
  type: "fixed" | "percentage" | "tiered" | "mixed";
  name: string;
  description?: string;
  amount?: number; // For fixed fees
  percentage?: number; // For percentage fees
  minAmount?: number; // Minimum fee amount
  maxAmount?: number; // Maximum fee amount
  tiers?: FeeTier[]; // For tiered fees
  currency: string;
  appliesTo: string[]; // Payment method types this applies to
  isActive: boolean;
}

export interface FeeTier {
  fromAmount: number;
  toAmount?: number;
  fee: number;
  feeType: "fixed" | "percentage";
}

export interface GatewayConfiguration {
  allowPartialPayments: boolean;
  requireCvv: boolean;
  require3ds: boolean;
  autoCapture: boolean;
  settlementDelay: number; // in hours
  refundPolicy: "full" | "partial" | "none";
  disputeManagement: boolean;
  fraudDetection: boolean;
  recurringPayments: boolean;
  subscriptionSupport: boolean;
  maxTransactionAmount: number;
  minTransactionAmount: number;
  dailyTransactionLimit: number;
  monthlyTransactionLimit: number;
  webhookRetries: number;
  timeoutDuration: number; // in seconds
}

export interface GatewayStatistics {
  totalTransactions: number;
  totalVolume: number;
  successRate: number;
  averageTransactionValue: number;
  totalFees: number;
  chargebackCount: number;
  refundCount: number;
  dailyTransactions: Array<{
    date: string;
    count: number;
    volume: number;
  }>;
  monthlyTransactions: Array<{
    month: string;
    count: number;
    volume: number;
  }>;
  paymentMethodBreakdown: Array<{
    method: string;
    count: number;
    volume: number;
  }>;
  errorRates: Array<{
    errorType: string;
    count: number;
    percentage: number;
  }>;
}

export interface GatewayTransaction {
  id: string;
  gatewayId: string;
  gatewayName: string;
  transactionId: string;
  externalTransactionId?: string;
  amount: number;
  currency: string;
  status:
    | "pending"
    | "processing"
    | "completed"
    | "failed"
    | "cancelled"
    | "refunded"
    | "chargeback";
  paymentMethod: string;
  paymentMethodType: string;
  customerEmail?: string;
  customerName?: string;
  description?: string;
  feeAmount: number;
  netAmount: number;
  refundAmount?: number;
  chargebackAmount?: number;
  errorReason?: string;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface GatewayTestResult {
  gatewayId: string;
  testType: "connection" | "payment" | "webhook" | "refund";
  status: "success" | "failed" | "warning";
  message: string;
  details?: any;
  testedAt: Date;
  duration: number; // in milliseconds
}

export interface GatewayOverallStatistics {
  totalGateways: number;
  activeGateways: number;
  inactiveGateways: number;
  testingGateways: number;
  errorGateways: number;
  totalTransactions: number;
  totalVolume: number;
  averageSuccessRate: number;
  totalFees: number;
  gatewayBreakdown: Array<{
    gatewayId: string;
    gatewayName: string;
    provider: string;
    status: string;
    transactionCount: number;
    volume: number;
    successRate: number;
    fees: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    transactionCount: number;
    volume: number;
    successRate: number;
  }>;
  paymentMethodUsage: Array<{
    method: string;
    count: number;
    percentage: number;
  }>;
}

export interface GatewayFilterOptions {
  status?: string[];
  provider?: string[];
  environment?: string[];
  currency?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

export interface GatewayFormData {
  name: string;
  provider: "stripe" | "paypal" | "square" | "adyen" | "razorpay" | "mollie" | "other";
  displayName: string;
  description?: string;
  environment: "sandbox" | "production";
  currencies: string[];
  apiKey?: string;
  apiSecret?: string;
  merchantId?: string;
  accountId?: string;
  webhookUrl?: string;
  isDefault: boolean;
  isEnabled: boolean;
  configuration: Partial<GatewayConfiguration>;
  transactionFees: Partial<TransactionFee>[];
}
