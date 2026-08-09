import type { DuePayment, DueStatistics, MemberDue } from "@/types/finance";

// ---------------------------------------------------------------------------
// Wire shapes (ISO dates, decimal strings) returned by the finance API
// ---------------------------------------------------------------------------

/** Wire shape of src/lib/services/finance-report.service.ts DuesLedgerRow. */
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
  issuedAt: string;
  dueDate: string | null;
  status: MemberDue["status"];
}

/** Wire shape of the membership_payments rows returned by /finance/payments. */
export interface PaymentRow {
  id: string;
  invoiceId: string | null;
  amount: string;
  currency: string;
  status: string;
  paymentMethod: string | null;
  paymentProvider: string | null;
  providerTxId: string | null;
  paidAt: string | null;
  createdAt: string;
}

/** Input accepted by the record-payment mutation. */
export interface RecordPaymentInput {
  invoiceId: string;
  amount: number;
  paymentMethod: string;
}

// ---------------------------------------------------------------------------
// Hook contract
// ---------------------------------------------------------------------------

export interface UseFinanceDuesOptions {
  /** 1-based page of the dues table. */
  page: number;
  /** Rows per page requested from the report endpoint. */
  pageSize: number;
}

export interface UseFinanceDuesReturn {
  // Table data (one server-paginated page)
  dues: MemberDue[];
  total: number;
  totalPages: number;
  /** Initial load gate for the whole page. */
  loading: boolean;
  /** True while a table page/refetch is in flight (skeleton rows). */
  fetching: boolean;
  error: string | null;

  // Aggregate window (newest STATISTICS_WINDOW_LIMIT rows, documented cap)
  statisticsRows: MemberDue[];
  statistics: DueStatistics;

  // Payments window (most recent records, documented cap)
  payments: DuePayment[];
  /** No reminders table exists in the schema; the dashboard shows none. */
  reminders: never[];

  // Actions
  updateDueStatus: (dueId: string, status: MemberDue["status"]) => void;
  recordPayment: (dueId: string, amount: number, paymentMethod: string) => void;
  sendReminder: (dueId: string, type: "email" | "sms" | "in_app") => void;
  refreshData: () => void;
}
