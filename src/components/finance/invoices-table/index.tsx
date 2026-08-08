"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InvoiceDetailsModal } from "../invoice-details-modal";
import InvoiceCard from "./invoice-card";
import InvoiceRow from "./invoice-row";
import PaymentDialog from "./payment-dialog";
import type { InvoicesTableProps } from "./types";
import { useInvoicesTableState } from "./use-invoices-table-state";

export function InvoicesTable({
  invoices,
  payments,
  onRecordPayment,
  onSendReminder,
  onSendInvoice,
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
  } = useInvoicesTableState({ onRecordPayment });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Manage client invoices and billing</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <InvoiceRow
                    key={invoice.id}
                    invoice={invoice}
                    onViewDetails={handleViewDetails}
                    onRecordPayment={handleRecordPayment}
                    onSendInvoice={onSendInvoice}
                    onSendReminder={onSendReminder}
                  />
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {invoices.map((invoice) => (
              <InvoiceCard
                key={invoice.id}
                invoice={invoice}
                onViewDetails={handleViewDetails}
                onRecordPayment={handleRecordPayment}
                onSendInvoice={onSendInvoice}
                onSendReminder={onSendReminder}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
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

      {/* Invoice Details Modal */}
      <InvoiceDetailsModal
        invoice={selectedInvoice}
        payments={payments}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        onRecordPayment={onRecordPayment}
        onSendReminder={onSendReminder}
      />
    </>
  );
}
