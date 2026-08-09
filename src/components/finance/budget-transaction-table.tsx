"use client";

import { useMemo } from "react";
import { Edit, Eye, MoreHorizontal, Receipt, Trash2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { format, formatDistanceToNow } from "date-fns";

import {
  DataTable,
  DataTableColumnHeader,
  DataTablePagination,
  DataTableSearch,
  DataTableViewOptions,
} from "@/components/data-table";
import { useDataTableState } from "@/hooks/use-data-table-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BudgetTransaction } from "@/types/finance";

interface BudgetTransactionTableProps {
  transactions: BudgetTransaction[];
  onView?: (transaction: BudgetTransaction) => void;
  onEdit?: (transaction: BudgetTransaction) => void;
  onDelete?: (transaction: BudgetTransaction) => void;
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
  onView,
  onEdit,
  onDelete,
}: BudgetTransactionTableProps) {
  const tableState = useDataTableState({ defaultPageSize: 20 });
  const { page, pageSize, globalFilter, sorting } = tableState.state;

  // Client-mode table: filter and sort in memory, then slice the page.
  const filtered = useMemo(() => {
    const query = globalFilter.trim().toLowerCase();
    const searched = query
      ? transactions.filter(
          (transaction) =>
            transaction.description.toLowerCase().includes(query) ||
            transaction.categoryId.toLowerCase().includes(query) ||
            (transaction.vendor ?? "").toLowerCase().includes(query),
        )
      : transactions;

    const [{ id, desc } = { id: "date", desc: true }] = sorting;
    const sorted = [...searched].sort((a, b) => {
      const valueOf = (transaction: BudgetTransaction): number | string => {
        switch (id) {
          case "description":
            return transaction.description.toLowerCase();
          case "categoryId":
            return transaction.categoryId.toLowerCase();
          case "amount":
            return transaction.amount;
          case "status":
            return transaction.status;
          default:
            return transaction.date.getTime();
        }
      };
      const left = valueOf(a);
      const right = valueOf(b);
      const compared = left < right ? -1 : left > right ? 1 : 0;
      return desc ? -compared : compared;
    });

    return sorted;
  }, [transactions, globalFilter, sorting]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPage = Math.min(page, pageCount);
  const pageRows = useMemo(
    () => filtered.slice((clampedPage - 1) * pageSize, clampedPage * pageSize),
    [filtered, clampedPage, pageSize],
  );

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
        id: "categoryId",
        accessorKey: "categoryId",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Category" />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {row.original.categoryId}
            </Badge>
            {row.original.subcategoryId && (
              <Badge variant="secondary" className="text-xs">
                {row.original.subcategoryId}
              </Badge>
            )}
          </div>
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
                {onView && (
                  <DropdownMenuItem onClick={() => onView(row.original)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                )}
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
                {onDelete && (
                  <DropdownMenuItem
                    onClick={() => onDelete(row.original)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ],
    [onView, onEdit, onDelete],
  );

  return (
    <DataTable
      columns={columns}
      data={pageRows}
      getRowId={(row) => row.id}
      manualSorting
      sorting={tableState.state.sorting}
      onSortingChange={(updater) =>
        tableState.setSorting(
          typeof updater === "function" ? updater(tableState.state.sorting) : updater,
        )
      }
      manualFiltering
      globalFilter={tableState.state.globalFilter}
      onGlobalFilterChange={(updater) =>
        tableState.setGlobalFilter(
          typeof updater === "function" ? updater(tableState.state.globalFilter) : updater,
        )
      }
      caption="Budget transactions"
      emptyTitle="No transactions found"
      emptyDescription="Adjust the search or record the first transaction."
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
          page={clampedPage}
          pageCount={pageCount}
          total={filtered.length}
          pageSize={pageSize}
          onPageChange={tableState.setPage}
          onPageSizeChange={tableState.setPageSize}
        />
      }
    />
  );
}
