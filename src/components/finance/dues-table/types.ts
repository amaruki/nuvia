import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";

import type { DataTableUrlState } from "@/hooks/use-data-table-state";
import type { DuePayment, MemberDue } from "@/types/finance";

/** URL-synced table state owned by the dues page. */
export interface DuesTableState {
  state: DataTableUrlState;
  setSorting: (sorting: SortingState) => void;
  setGlobalFilter: (value: string) => void;
  setColumnFilters: (filters: ColumnFiltersState) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
}

export interface DuesTableProps {
  /** One server-paginated page of the dues ledger. */
  dues: MemberDue[];
  /** Total rows across all pages (from the report meta). */
  total: number;
  /** Total pages (from the report meta). */
  totalPages: number;
  /** Recorded payments window, shown in the details modal. */
  payments: DuePayment[];
  /** True while a page fetch/refetch is in flight (skeleton rows). */
  loading?: boolean;
  error?: string | null;
  onRecordPayment: (dueId: string, amount: number, paymentMethod: string) => void;
  onSendReminder: (dueId: string, type: "email" | "sms" | "in_app") => void;
  onUpdateStatus: (dueId: string, status: MemberDue["status"]) => void;
  onRefresh?: () => void;
  /** URL-synced table state owned by the page (sort/search/pagination). */
  tableState: DuesTableState;
}
