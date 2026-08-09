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

/** Money columns show cents exactly; the rounded variant stays for cards. */
export const formatCurrencyExact = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Validates a payment amount input. Returns an error message, or null when
 * the value is a positive amount with at most two decimal places that does
 * not exceed the outstanding balance.
 */
export function validatePaymentAmount(raw: string, balance: number | null): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return "Enter a payment amount.";

  const amount = Number(trimmed);
  if (!Number.isFinite(amount)) return "Enter a valid number.";
  if (amount <= 0) return "Amount must be greater than zero.";

  const [, decimals] = trimmed.split(".");
  if (decimals && decimals.length > 2) return "Amount can have at most two decimal places.";

  if (balance !== null && amount > balance + 0.0001) {
    return `Amount exceeds the outstanding balance (${formatCurrencyExact(balance)}).`;
  }

  return null;
}

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

export const getPaidAmount = (invoice: Invoice) => {
  return invoice.paidAmount || 0;
};
export const getBalanceAmount = (invoice: Invoice) => {
  return invoice.totalAmount - (invoice.paidAmount || 0);
};
