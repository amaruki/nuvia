/**
 * Shared finance report types — revenue/receivables aggregate shapes, the
 * dashboard-facing dues ledger and invoice row shapes, and the
 * deployment-configured gateway status.
 */

// ---------------------------------------------------------------------------
// Revenue + receivables
// ---------------------------------------------------------------------------

/** Monthly revenue bucket computed from COMPLETED membership transactions. */
export interface RevenuePeriodRow {
  /** Calendar month key, e.g. "2025-06". */
  period: string;
  /** Sum of completed transaction amounts, string-mode. */
  revenue: string;
  transactionCount: number;
}

/** Revenue grouped by the tier each transaction was billed for. */
export interface RevenueByTierRow {
  tierId: string;
  tierName: string;
  revenue: string;
  transactionCount: number;
}

/** Receivables still open on ISSUED invoices. */
export interface OutstandingSummary {
  invoiceCount: number;
  /** Sum of (totalAmount - paidAmount) across ISSUED invoices. */
  outstandingAmount: string;
  overdueCount: number;
  overdueAmount: string;
}

export interface FinanceReportSummary {
  generatedAt: string;
  /** Window (in months) the revenue aggregates cover. */
  months: number;
  totals: {
    revenue: string;
    completedTransactionCount: number;
  };
  revenueByPeriod: RevenuePeriodRow[];
  revenueByTier: RevenueByTierRow[];
  outstanding: OutstandingSummary;
}

// ---------------------------------------------------------------------------
// Dues ledger + invoice listings
// ---------------------------------------------------------------------------

/**
 * Dashboard-facing dues status. Derived from the real invoice columns:
 * PAID -> "paid", VOID -> "cancelled", ISSUED splits into "overdue"
 * (due date in the past), "partial" (paidAmount > 0) and "pending".
 */
export type DuesUiStatus = "pending" | "partial" | "paid" | "overdue" | "cancelled";

export interface DuesLedgerRow {
  invoiceId: string;
  invoiceNumber: string | null;
  subscriptionId: string;
  memberId: string | null;
  memberName: string | null;
  memberEmail: string | null;
  tierId: string | null;
  tierName: string | null;
  amount: string;
  paid: string;
  balance: string;
  issuedAt: Date;
  dueDate: Date | null;
  status: DuesUiStatus;
}

/** Invoice row shaped for the dashboard, with member/tier context + items. */
export interface InvoiceClientRow {
  invoiceId: string;
  invoiceNumber: string | null;
  subscriptionId: string;
  memberId: string | null;
  memberName: string | null;
  memberEmail: string | null;
  tierId: string | null;
  tierName: string | null;
  amount: string;
  paid: string;
  balance: string;
  issuedAt: Date;
  dueDate: Date | null;
  /** "sent" = ISSUED and not overdue; "overdue" = ISSUED past dueDate. */
  status: "sent" | "paid" | "overdue" | "cancelled";
  items: { description: string; quantity: number; unitPrice: string }[];
}

export interface ListResult<T> {
  rows: T[];
  total: number;
}

export interface DuesLedgerQuery {
  status?: DuesUiStatus | "all";
  page?: number;
  limit?: number;
}

export interface InvoiceClientQuery {
  status?: "sent" | "paid" | "overdue" | "cancelled" | "all";
  userId?: string;
  page?: number;
  limit?: number;
}

// ---------------------------------------------------------------------------
// Gateway status
// ---------------------------------------------------------------------------

/**
 * Deployment-configured gateway, safe to expose: provider + status +
 * booleans about credential presence. NEVER secret values.
 */
export interface ConfiguredGatewayStatus {
  provider: "manual" | "stripe";
  displayName: string;
  status: "active";
  description: string;
  /** Where provider webhooks land, when applicable. */
  webhookEndpoint: string | null;
  /** Stripe only: secret key present in the deployment env. */
  secretKeyConfigured: boolean | null;
  /** Stripe only: webhook signing secret present in the deployment env. */
  webhookSecretConfigured: boolean | null;
}
