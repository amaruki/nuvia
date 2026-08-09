import type { MemberDue } from "@/types/finance";

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

export const isOverdue = (dueDate: Date, status: MemberDue["status"]) => {
  return status === "pending" && new Date(dueDate) < new Date();
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
