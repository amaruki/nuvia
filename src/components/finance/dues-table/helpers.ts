import type { MemberDue } from "@/types/finance";

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const isOverdue = (dueDate: Date, status: MemberDue["status"]) => {
  return status === "pending" && new Date(dueDate) < new Date();
};
