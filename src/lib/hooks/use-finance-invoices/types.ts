import type { Invoice, InvoicePayment, InvoiceStatistics } from "@/types/finance";

// ---------------------------------------------------------------------------
// Wire shapes (ISO dates, decimal strings) returned by the finance API
// ---------------------------------------------------------------------------

/** Wire shape of src/lib/services/finance-report.service.ts InvoiceClientRow. */
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
  issuedAt: string;
  dueDate: string | null;
  status: "sent" | "paid" | "overdue" | "cancelled";
  items: { description: string; quantity: number; unitPrice: string }[];
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

export interface UseFinanceInvoicesOptions {
  /** 1-based page of the invoices table. */
  page: number;
  /** Rows per page requested from the report endpoint. */
  pageSize: number;
}

export interface UseFinanceInvoicesReturn {
  // Table data (one server-paginated page)
  invoices: Invoice[];
  total: number;
  totalPages: number;
  /** Initial load gate for the whole page. */
  loading: boolean;
  /** True while a table page/refetch is in flight (skeleton rows). */
  fetching: boolean;
  error: string | null;

  // Aggregate window (newest STATISTICS_WINDOW_LIMIT rows, documented cap)
  statisticsRows: Invoice[];
  statistics: InvoiceStatistics;

  // Payments window (most recent records, documented cap)
  payments: InvoicePayment[];

  // Actions
  recordPayment: (invoiceId: string, amount: number, paymentMethod: string) => void;
  updateInvoiceStatus: (invoiceId: string, status: Invoice["status"]) => void;
  sendReminder: (invoiceId: string, type: "email" | "sms" | "in_app") => void;
  sendInvoice: (invoiceId: string) => void;
  refreshData: () => void;
}
