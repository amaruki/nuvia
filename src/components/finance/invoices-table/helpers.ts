import { AlertCircle, CheckCircle, Clock, CreditCard, FileText, Send, XCircle } from "lucide-react";
import type { Invoice } from "@/types/finance";

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getStatusBadge = (status: Invoice["status"]) => {
  switch (status) {
    case "paid":
      return { variant: "default" as const, icon: CheckCircle, text: "Paid" };
    case "sent":
      return { variant: "secondary" as const, icon: Send, text: "Sent" };
    case "overdue":
      return { variant: "destructive" as const, icon: AlertCircle, text: "Overdue" };
    case "draft":
      return { variant: "outline" as const, icon: FileText, text: "Draft" };
    case "cancelled":
      return { variant: "outline" as const, icon: XCircle, text: "Cancelled" };
    case "refunded":
      return { variant: "outline" as const, icon: CreditCard, text: "Refunded" };
    default:
      return { variant: "secondary" as const, icon: Clock, text: status };
  }
};

export const isOverdue = (dueDate: Date, status: Invoice["status"]) => {
  return status === "sent" && new Date(dueDate) < new Date();
};

export const getBalanceAmount = (invoice: Invoice) => {
  return invoice.totalAmount - (invoice.paidAmount || 0);
};
