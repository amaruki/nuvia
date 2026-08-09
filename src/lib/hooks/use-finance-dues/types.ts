import type { DueFilterOptions, DuePayment, DueStatistics, MemberDue } from "@/types/finance";

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

export interface UseFinanceDuesReturn {
  // Data
  dues: MemberDue[];
  payments: DuePayment[];
  /** No reminders table exists in the schema; the dashboard shows none. */
  reminders: never[];
  statistics: DueStatistics;
  loading: boolean;
  error: string | null;
  filters: DueFilterOptions;

  // Actions
  updateDueStatus: (dueId: string, status: MemberDue["status"]) => void;
  recordPayment: (dueId: string, amount: number, paymentMethod: string) => void;
  sendReminder: (dueId: string, type: "email" | "sms" | "in_app") => void;

  // Filter and refresh operations
  refreshData: () => void;
  updateFilters: (next: Partial<DueFilterOptions>) => void;
  clearFilters: () => void;
}
