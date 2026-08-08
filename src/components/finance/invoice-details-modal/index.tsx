"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { FileText } from "lucide-react";
import type { InvoiceDetailsModalProps } from "./types";
import { getStatusBadge } from "./helpers";
import { ClientInfoSection } from "./client-info-section";
import { InvoiceInfoSection } from "./invoice-info-section";
import { InvoiceItemsSection } from "./invoice-items-section";
import { PaymentHistorySection } from "./payment-history-section";
import { ModalActions } from "./modal-actions";

export function InvoiceDetailsModal({
  invoice,
  payments,
  open,
  onOpenChange,
  onRecordPayment,
  onSendReminder,
}: InvoiceDetailsModalProps) {
  if (!invoice) return null;

  const statusMeta = getStatusBadge(invoice.status);
  const balanceAmount = invoice.totalAmount - (invoice.paidAmount || 0);
  const isOverdue = invoice.status === "sent" && new Date(invoice.dueDate) < new Date();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 shrink-0" />
            Invoice Details
          </DialogTitle>
          <DialogDescription>View detailed information about this invoice</DialogDescription>
        </DialogHeader>

        <Separator />

        <div className="space-y-6">
          <ClientInfoSection invoice={invoice} statusMeta={statusMeta} />

          <Separator />

          <InvoiceInfoSection
            invoice={invoice}
            balanceAmount={balanceAmount}
            isOverdue={isOverdue}
          />

          <Separator />

          <InvoiceItemsSection invoice={invoice} />

          <Separator />

          <PaymentHistorySection invoiceId={invoice.id} payments={payments} />

          <ModalActions
            invoice={invoice}
            balanceAmount={balanceAmount}
            onRecordPayment={onRecordPayment}
            onSendReminder={onSendReminder}
            onOpenChange={onOpenChange}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
