"use client";

import { useMemo } from "react";
import { FileText } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { format, formatDistanceToNow } from "date-fns";

import {
  DataTable,
  DataTableColumnHeader,
  DataTablePagination,
  DataTableSearch,
  DataTableViewOptions,
} from "@/components/data-table";
import { InvoiceDetailsModal } from "@/components/finance/invoice-details-modal";
import type { Invoice } from "@/types/finance";

import { formatCurrencyExact, getBalanceAmount, getPaidAmount } from "./helpers";
import { InvoiceActionsMenu } from "./invoice-actions-menu";
import PaymentDialog from "./payment-dialog";
import InvoiceStatusBadge from "./status-badge";
import type { InvoicesTableProps } from "./types";
import { useInvoicesTableState } from "./use-invoices-table-state";

export function InvoicesTable({
  invoices,
  total,
  totalPages,
  payments,
  loading,
  error,
  onViewDetails,
  onRecordPayment,
  onSendInvoice,
  onSendReminder,
  onRefresh,
  tableState,
}: InvoicesTableProps) {
  const {
    selectedInvoice,
    detailsModalOpen,
    setDetailsModalOpen,
    paymentDialogOpen,
    setPaymentDialogOpen,
    paymentAmount,
    setPaymentAmount,
    paymentMethod,
    setPaymentMethod,
    handleViewDetails,
    handleRecordPayment,
    handlePaymentSubmit,
  } = useInvoicesTableState({
    onRecordPayment: (invoiceId, amount, paymentMethod) => {
      onRecordPayment?.(invoiceId, amount, paymentMethod);
    },
  });

  const columns = useMemo<ColumnDef<Invoice>[]>(
    () => [
      {
        id: "invoiceNumber",
        accessorKey: "invoiceNumber",
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Invoice" className="justify-start" />
        ),
        cell: ({ row }) => (
          <div className="space-y-0.5">
            <span className="font-medium tabular-nums">{row.original.invoiceNumber}</span>
            <span className="block text-xs text-muted-foreground">
              Issued {format(row.original.createdAt, "MMM d, yyyy")}
            </span>
          </div>
        ),
      },
      {
        id: "clientName",
        accessorKey: "clientName",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Client" />,
        cell: ({ row }) => <span>{row.original.clientName}</span>,
      },
      {
        id: "amount",
        accessorFn: (row) => row.totalAmount,
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Amount" className="justify-end" />
        ),
        cell: ({ row }) => (
          <span className="block text-right font-medium tabular-nums">
            {formatCurrencyExact(row.original.totalAmount)}
          </span>
        ),
      },
      {
        id: "paidAmount",
        accessorFn: (row) => getPaidAmount(row),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Paid" className="justify-end" />
        ),
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">
            {formatCurrencyExact(getPaidAmount(row.original))}
          </span>
        ),
      },
      {
        id: "balance",
        accessorFn: (row) => getBalanceAmount(row),
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title="Balance" className="justify-end" />
        ),
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">
            {formatCurrencyExact(getBalanceAmount(row.original))}
          </span>
        ),
      },
      {
        id: "dueDate",
        accessorFn: (row) => row.dueDate?.getTime() ?? 0,
        header: ({ column }) => <DataTableColumnHeader column={column} title="Due Date" />,
        cell: ({ row }) =>
          row.original.dueDate ? (
            <div
              className="space-y-0.5"
              title={`Due ${formatDistanceToNow(row.original.dueDate, { addSuffix: true })}`}
            >
              <span className="tabular-nums">{format(row.original.dueDate, "MMM d, yyyy")}</span>
              <span className="block text-xs text-muted-foreground">
                {formatDistanceToNow(row.original.dueDate, { addSuffix: true })}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "status",
        accessorKey: "status",
        header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
        cell: ({ row }) => <InvoiceStatusBadge invoice={row.original} />,
      },
      {
        id: "actions",
        enableSorting: false,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <InvoiceActionsMenu
              invoice={row.original}
              onViewDetails={(invoice) => {
                handleViewDetails(invoice);
                onViewDetails?.(invoice);
              }}
              onRecordPayment={(invoice) => handleRecordPayment(invoice)}
              onSendInvoice={(invoice) => onSendInvoice?.(invoice.id)}
              onSendReminder={(invoice, type) => onSendReminder?.(invoice.id, type)}
            />
          </div>
        ),
      },
    ],
    [handleViewDetails, handleRecordPayment, onViewDetails, onSendInvoice, onSendReminder],
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={invoices}
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
        caption="Membership invoices"
        emptyTitle="No invoices found"
        emptyDescription="Adjust the search or record the first invoice of the period."
        emptyIcon={<FileText className="h-8 w-8" />}
        toolbar={(table) => (
          <>
            <DataTableSearch
              value={tableState.state.globalFilter}
              onValueChange={tableState.setGlobalFilter}
              placeholder="Search invoices…"
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

      <InvoiceDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        invoice={selectedInvoice}
        payments={payments}
        onRecordPayment={(invoiceId, amount, paymentMethod) =>
          onRecordPayment?.(invoiceId, amount, paymentMethod)
        }
        onSendReminder={(invoiceId, type) => onSendReminder?.(invoiceId, type)}
      />

      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        invoice={selectedInvoice}
        amount={paymentAmount}
        onAmountChange={setPaymentAmount}
        method={paymentMethod}
        onMethodChange={setPaymentMethod}
        onSubmit={handlePaymentSubmit}
      />
    </>
  );
}

export default InvoicesTable;
