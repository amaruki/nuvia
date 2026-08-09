import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";

import type { DataTableUrlState } from "@/hooks/use-data-table-state";
import type { Invoice, InvoicePayment } from "@/types/finance";

export type ReminderType = "email" | "sms" | "in_app";

/** URL-synced table state owned by the invoices page. */
export interface InvoicesTableState {
  state: DataTableUrlState;
  setSorting: (sorting: SortingState) => void;
  setGlobalFilter: (value: string) => void;
  setColumnFilters: (filters: ColumnFiltersState) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
}

export interface InvoicesTableProps {
  /** One server-paginated page of invoices. */
  invoices: Invoice[];
  /** Total rows across all pages (from the report meta). */
  total: number;
  /** Total pages (from the report meta). */
  totalPages: number;
  /** Recorded payments window, shown in the details modal. */
  payments: InvoicePayment[];
  /** True while a page fetch/refetch is in flight (skeleton rows). */
  loading?: boolean;
  error?: string | null;
  onViewDetails?: (invoice: Invoice) => void;
  onRecordPayment?: (invoiceId: string, amount: number, paymentMethod: string) => void;
  onSendInvoice?: (invoiceId: string) => void;
  onSendReminder?: (invoiceId: string, type: ReminderType) => void;
  onRefresh?: () => void;
  /** URL-synced table state owned by the invoices page. */
  tableState: InvoicesTableState;
}
