export interface OpenInvoiceRow {
  invoiceId: string;
  invoiceNumber: string | null;
  memberName: string | null;
  memberEmail: string | null;
  tierName: string | null;
  amount: string;
  paid: string;
  balance: string;
  dueDate: string | null;
  status: "sent" | "overdue";
}

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
