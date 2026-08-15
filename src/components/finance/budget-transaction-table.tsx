"use client";

import { useMemo } from "react";
import { Edit, MoreHorizontal, Receipt, Wallet } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";
import { format, formatDistanceToNow } from "date-fns";

import {
  DataTable,
  DataTableColumnHeader,
  DataTablePagination,
  DataTableSearch,
  DataTableViewOptions,
} from "@/components/data-table";
import type { DataTableUrlState } from "@/hooks/use-data-table-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BudgetTransaction } from "@/types/finance";

/** URL-synced table state owned by the budget page. */
export interface BudgetTransactionsTableState {
  state: DataTableUrlState;
  setSorting: (sorting: SortingState) => void;
  setGlobalFilter: (value: string) => void;
  setColumnFilters: (filters: ColumnFiltersState) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
}

interface BudgetTransactionTableProps {
  /** One server-paginated page of transactions. */
  transactions: BudgetTransaction[];
  /** Total rows across all pages (from the endpoint meta). */
  total: number;
  /** Total pages (from the endpoint meta). */
  totalPages: number;
  /** True while a page fetch/refetch is in flight (skeleton rows). */
  loading?: boolean;
  error?: string | null;
  onEdit?: (transaction: BudgetTransaction) => void;
  onRefresh?: () => void;
  /** URL-synced table state owned by the budget page. */
  tableState: BudgetTransactionsTableState;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const TYPE_COLORS: Record<string, string> = {
  income: "text-green-600",
  refund: "text-blue-600",
  expense: "text-red-600",
};

const STATUS_BADGES: Record<
  string,
  { variant: "default" | "secondary" | "destructive" | "outline"; text: string }
> = {
  approved: { variant: "default", text: "Approved" },
  pending: { variant: "secondary", text: "Pending" },
  rejected: { variant: "destructive", text: "Rejected" },
};

export function BudgetTransactionTable({
  transactions,
  total,
  totalPages,
  loading,
  error,
  onEdit,
  onRefresh,
  tableState,
}: BudgetTransactionTableProps) {
  const columns = useMemo<ColumnDef<BudgetTransaction>[]>(
    () => [
      {
        id: "date",
        accessorFn: (row) => row.date.getTime(),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Date" />,
        cell: ({ row }) => (
          <div
            className="space-y-0.5"
            title={formatDistanceToNow(row.original.date, { addSuffix: true })}
          >
            <span className="font-medium tabular-nums">
              {format(row.original.date, "MMM d, yyyy")}
            </span>
            <span className="block text-xs text-muted-foreground">
              {formatDistanceToNow(row.original.date, { addSuffix: true })}
            </span>
          </div>
        ),
      },
      {
        id: "description",
        accessorKey: "description",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-medium">{row.original.description}</p>
            {row.original.notes && (
              <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                {row.original.notes}
              </p>
            )}
          </div>
        ),
      },
      {
        id: "type",
        accessorKey: "type",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
        cell: ({ row }) => (
          <span className={`font-medium capitalize ${TYPE_COLORS[row.original.type] ?? ""}`}>
            {row.original.type}
          </span>
        ),
      },
      {
        id: "amount",
        accessorFn: (row) => row.amount,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Amount" className="justify-end" />
        ),
        cell: ({ row }) => (
          <span
            className={`block text-right font-medium tabular-nums ${
              TYPE_COLORS[row.original.type] ?? "text-red-600"
            }`}
          >
            {row.original.type === "income" || row.original.type === "refund" ? "+" : "-"}
            {formatCurrency(row.original.amount)}
          </span>
        ),
      },
      {
        id: "status",
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => {
          const badge = STATUS_BADGES[row.original.status] ?? {
            variant: "outline" as const,
            text: row.original.status,
          };
          return <Badge variant={badge.variant}>{badge.text}</Badge>;
        },
      },
      {
        id: "vendor",
        accessorFn: (row) => row.vendor ?? "",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Vendor" />,
        cell: ({ row }) =>
          row.original.vendor || <span className="text-muted-foreground">N/A</span>,
      },
      {
        id: "actions",
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  aria-label={`Actions for transaction ${row.original.description}`}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {row.original.receiptUrl && (
                  <DropdownMenuItem asChild>
                    <a href={row.original.receiptUrl} target="_blank" rel="noopener noreferrer">
                      <Receipt className="mr-2 h-4 w-4" />
                      View Receipt
                    </a>
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={() => onEdit(row.original)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [onEdit],
  );

  return (
    /*
     * The transactions endpoint takes only type/status/categoryId plus
     * page/limit, no search or sort params, so the `?q=` search and the
     * column sort toggles apply client-side to the loaded page (stated, not
     * silent). Pagination stays server-driven via the endpoint meta.
     */
    <DataTable
      columns={columns}
      data={transactions}
      loading={loading}
      error={error}
      onRetry={onRefresh}
      getRowId={(row) => row.id}
      sorting={tableState.state.sorting}
      onSortingChange={(updater) =>
        tableState.setSorting(
          typeof updater === "function" ? updater(tableState.state.sorting) : updater,
        )
      }
      globalFilter={tableState.state.globalFilter}
      onGlobalFilterChange={(updater) =>
        tableState.setGlobalFilter(
          typeof updater === "function" ? updater(tableState.state.globalFilter) : updater,
        )
      }
      columnFilters={tableState.state.columnFilters}
      onColumnFiltersChange={(updater) =>
        tableState.setColumnFilters(
          typeof updater === "function" ? updater(tableState.state.columnFilters) : updater,
        )
      }
      caption="Budget transactions"
      emptyTitle="No transactions found"
      emptyDescription="Adjust the search or record the first transaction."
      emptyIcon={<Wallet className="h-8 w-8" />}
      toolbar={(table) => (
        <>
          <DataTableSearch
            value={tableState.state.globalFilter}
            onValueChange={tableState.setGlobalFilter}
            placeholder="Search transactions…"
          />
          <DataTableViewOptions table={table} />
        </>
      )}
      pagination={
        <DataTablePagination
          page={tableState.state.page}
          pageCount={totalPages}
          total={total}
          pageSize={tableState.state.pageSize}
          loading={loading}
          onPageChange={tableState.setPage}
          onPageSizeChange={tableState.setPageSize}
        />
      }
    />
  );
}

export default BudgetTransactionTable;
