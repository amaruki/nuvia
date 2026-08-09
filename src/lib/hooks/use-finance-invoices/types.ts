import type {
  Invoice,
  InvoiceFilterOptions,
  InvoicePayment,
  InvoiceStatistics,
} from "@/types/finance";

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

export interface UseFinanceInvoicesReturn {
  // Data
  invoices: Invoice[];
  payments: InvoicePayment[];
  statistics: InvoiceStatistics;
  loading: boolean;
  error: string | null;
  filters: InvoiceFilterOptions;

  // Actions
  recordPayment: (invoiceId: string, amount: number, paymentMethod: string) => void;
  updateInvoiceStatus: (invoiceId: string, status: Invoice["status"]) => void;
  sendReminder: (invoiceId: string, type: "email" | "sms" | "in_app") => void;
  sendInvoice: (invoiceId: string) => void;

  // Filter and refresh operations
  refreshData: () => void;
  updateFilters: (next: Partial<InvoiceFilterOptions>) => void;
  clearFilters: () => void;
}
