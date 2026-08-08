import { AlertCircle, CheckCircle, Clock, CreditCard, FileText, Send, XCircle } from "lucide-react";
import type { Invoice } from "@/types/finance";
import type { InvoiceStatusMeta } from "./types";

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const getStatusBadge = (status: Invoice["status"]): InvoiceStatusMeta => {
  switch (status) {
    case "paid":
      return {
        variant: "default",
        icon: CheckCircle,
        text: "Paid",
        color: "text-green-600",
      };
    case "sent":
      return { variant: "secondary", icon: Send, text: "Sent", color: "text-blue-600" };
    case "overdue":
      return {
        variant: "destructive",
        icon: AlertCircle,
        text: "Overdue",
        color: "text-red-600",
      };
    case "draft":
      return {
        variant: "outline",
        icon: FileText,
        text: "Draft",
        color: "text-gray-600",
      };
    case "cancelled":
      return {
        variant: "outline",
        icon: XCircle,
        text: "Cancelled",
        color: "text-gray-600",
      };
    case "refunded":
      return {
        variant: "outline",
        icon: CreditCard,
        text: "Refunded",
        color: "text-orange-600",
      };
    default:
      return { variant: "secondary", icon: Clock, text: status, color: "text-gray-600" };
  }
};
