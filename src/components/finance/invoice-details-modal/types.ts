import type { LucideIcon } from "lucide-react";
import type { Invoice, InvoicePayment } from "@/types/finance";

export interface InvoiceDetailsModalProps {
  invoice: Invoice | null;
  payments: InvoicePayment[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecordPayment: (invoiceId: string, amount: number, paymentMethod: string) => void;
  onSendReminder: (invoiceId: string, type: "email" | "sms" | "in_app") => void;
}

export interface InvoiceStatusMeta {
  variant: "default" | "secondary" | "destructive" | "outline";
  icon: LucideIcon;
  text: string;
  color: string;
}
