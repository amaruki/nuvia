"use client";

import { useMemo, useState } from "react";
import { Landmark } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { format, formatDistanceToNow } from "date-fns";

import {
  DataTable,
  DataTableColumnHeader,
  DataTablePagination,
  DataTableSearch,
  DataTableViewOptions,
} from "@/components/data-table";
import { DueDetailsModal } from "@/components/finance/due-details-modal";
import { Badge } from "@/components/ui/badge";
import type { MemberDue } from "@/types/finance";

import { DueActionsMenu } from "./due-actions-menu";
import { DueStatusBadge } from "./due-badges";
import { formatCurrencyExact, isOverdue, validatePaymentAmount } from "./helpers";
import { PaymentDialog } from "./payment-dialog";
import type { DuesTableState, DuesTableProps } from "./types";

export function DuesTable({
  dues,
  total,
  totalPages,
  payments,
  loading,
  error,
  onRecordPayment,
  onSendReminder,
  onUpdateStatus,
  onRefresh,
  tableState,
}: DuesTableProps) {
  const [selectedDue, setSelectedDue] = useState<MemberDue | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");

  const handleViewDetails = (due: MemberDue) => {
    setSelectedDue(due);
    setDetailsModalOpen(true);
  };

  const handleRecordPayment = (due: MemberDue) => {
    setSelectedDue(due);
    setPaymentAmount(due.balanceAmount.toString());
    setPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = () => {
    if (!selectedDue || !paymentMethod) return;
    const validationError = validatePaymentAmount(paymentAmount, selectedDue.balanceAmount);
    if (validationError) return;
    onRecordPayment(selectedDue.id, parseFloat(paymentAmount), paymentMethod);
    setPaymentDialogOpen(false);
    setSelectedDue(null);
    setPaymentAmount("");
    setPaymentMethod("");
  };

  const columns = useMemo<ColumnDef<MemberDue>[]>(
    () => [
      {
        id: "memberName",
        accessorKey: "memberName",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Member" className="justify-start" />
        ),
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <span className="font-medium">{row.original.memberName}</span>
            <span className="block text-xs text-muted-foreground">{row.original.memberEmail}</span>
          </div>
        ),
      },
      {
        id: "membershipTier",
        accessorKey: "membershipTier",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Tier" />,
        cell: ({ row }) => <Badge variant="outline">{row.original.membershipTier}</Badge>,
      },
      {
        id: "dueAmount",
        accessorFn: (row) => row.dueAmount,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Due Amount" className="justify-end" />
        ),
        cell: ({ row }) => (
          <span className="block text-right font-medium tabular-nums">
            {formatCurrencyExact(row.original.dueAmount)}
          </span>
        ),
      },
      {
        id: "paidAmount",
        accessorFn: (row) => row.paidAmount,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Paid" className="justify-end" />
        ),
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">
            {formatCurrencyExact(row.original.paidAmount)}
          </span>
        ),
      },
      {
        id: "balanceAmount",
        accessorFn: (row) => row.balanceAmount,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Balance" className="justify-end" />
        ),
        cell: ({ row }) => (
          <span
            className={`block text-right tabular-nums ${
              row.original.balanceAmount > 0 ? "font-medium" : ""
            }`}
          >
            {formatCurrencyExact(row.original.balanceAmount)}
          </span>
        ),
      },
      {
        id: "dueDate",
        accessorFn: (row) => row.dueDate.getTime(),
        header: ({ column }) => <DataTableColumnHeader column={column} title="Due Date" />,
        cell: ({ row }) => {
          const overdue = isOverdue(row.original.dueDate, row.original.status);
          return (
            <div
              className="space-y-0.5"
              title={`Due ${formatDistanceToNow(row.original.dueDate, { addSuffix: true })}`}
            >
              <span className={`tabular-nums ${overdue ? "text-red-600" : ""}`}>
                {format(row.original.dueDate, "MMM d, yyyy")}
              </span>
              <span className="block text-xs text-muted-foreground">
                {formatDistanceToNow(row.original.dueDate, { addSuffix: true })}
              </span>
            </div>
          );
        },
      },
      {
        id: "status",
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => <DueStatusBadge status={row.original.status} />,
      },
      {
        id: "actions",
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DueActionsMenu
              due={row.original}
              onViewDetails={handleViewDetails}
              onRecordPayment={handleRecordPayment}
              onSendReminder={onSendReminder}
              onUpdateStatus={onUpdateStatus}
            />
          </div>
        ),
      },
    ],
    [onSendReminder, onUpdateStatus],
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={dues}
        loading={loading}
        error={error}
        onRetry={onRefresh}
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
        columnFilters={tableState.state.columnFilters}
        onColumnFiltersChange={(updater) =>
          tableState.setColumnFilters(
            typeof updater === "function" ? updater(tableState.state.columnFilters) : updater,
          )
        }
        caption="Membership dues ledger"
        emptyTitle="No dues found"
        emptyDescription="Adjust the search or wait for the next billing cycle."
        emptyIcon={<Landmark className="h-8 w-8" />}
        toolbar={(table) => (
          <>
            <DataTableSearch
              value={tableState.state.globalFilter}
              onValueChange={tableState.setGlobalFilter}
              placeholder="Search dues…"
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

      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        due={selectedDue}
        amount={paymentAmount}
        onAmountChange={setPaymentAmount}
        method={paymentMethod}
        onMethodChange={setPaymentMethod}
        onSubmit={handlePaymentSubmit}
      />

      <DueDetailsModal
        due={selectedDue}
        payments={payments}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        onRecordPayment={onRecordPayment}
        onSendReminder={onSendReminder}
      />
    </>
  );
}
