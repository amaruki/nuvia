import type { Invoice, InvoicePayment } from "@/types/finance";

export type ReminderType = "email" | "sms" | "in_app";

export interface InvoicesTableProps {
  invoices: Invoice[];
  payments: InvoicePayment[];
  onRecordPayment: (invoiceId: string, amount: number, paymentMethod: string) => void;
  onSendReminder: (invoiceId: string, type: ReminderType) => void;
  onUpdateStatus: (invoiceId: string, status: Invoice["status"]) => void;
  onSendInvoice: (invoiceId: string) => void;
}

export interface InvoiceItemActions {
  onViewDetails: (invoice: Invoice) => void;
  onRecordPayment: (invoice: Invoice) => void;
  onSendInvoice: (invoiceId: string) => void;
  onSendReminder: (invoiceId: string, type: ReminderType) => void;
}
