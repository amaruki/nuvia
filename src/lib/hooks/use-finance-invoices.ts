"use client";

/**
 * C4: invoices dashboard hook backed by the real finance services.
 *
 * Listing comes from GET /api/v1/finance/reports/invoices (invoices joined to
 * member, tier and line items). Actions go through the landed C3 endpoints:
 *   POST /api/v1/finance/payments            — record a payment
 *   POST /api/v1/finance/invoices/:id/void   — void (cancel) an invoice
 *
 * Invoice statuses map onto the dashboard's as: ISSUED -> sent (or overdue
 * once the due date passes), PAID -> paid, VOID -> cancelled. There are no
 * draft invoices and no email delivery step — those mock actions report that
 * honestly instead of pretending.
 */

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import type {
  Invoice,
  InvoiceFilterOptions,
  InvoicePayment,
  InvoiceStatistics,
} from "@/types/finance.types";

/** Wire shape of src/lib/services/finance-report.service.ts InvoiceClientRow. */
interface InvoiceClientRow {
  invoiceId: string;
  invoiceNumber: string | null;
  subscriptionId: string;
  memberId: string | null;
  memberName: string | null;
  memberEmail: string | null;
  tierId: string | null;
  tierName: string | null;
  amount: string;
  paid: string;
  balance: string;
  issuedAt: string;
  dueDate: string | null;
  status: "sent" | "paid" | "overdue" | "cancelled";
  items: { description: string; quantity: number; unitPrice: string }[];
}

/** Wire shape of the membership_payments rows returned by /finance/payments. */
interface PaymentRow {
  id: string;
  invoiceId: string | null;
  amount: string;
  currency: string;
  status: string;
  paymentMethod: string | null;
  paymentProvider: string | null;
  providerTxId: string | null;
  paidAt: string | null;
  createdAt: string;
}

const toInvoice = (row: InvoiceClientRow): Invoice => {
  const issueDate = new Date(row.issuedAt);
  return {
    id: row.invoiceId,
    invoiceNumber: row.invoiceNumber ?? row.invoiceId.slice(0, 8).toUpperCase(),
    clientId: row.memberId ?? "",
    clientName: row.memberName ?? row.memberEmail ?? "Unknown member",
    clientEmail: row.memberEmail ?? "",
    items: row.items.map((item, index) => {
      const unitPrice = Number.parseFloat(item.unitPrice);
      return {
        id: `${row.invoiceId}:${index}`,
        description: item.description,
        quantity: item.quantity,
        unitPrice,
        total: unitPrice * item.quantity,
      };
    }),
    subtotal: Number.parseFloat(row.amount),
    taxAmount: 0,
    totalAmount: Number.parseFloat(row.amount),
    currency: "USD",
    status: row.status,
    issueDate,
    dueDate: row.dueDate ? new Date(row.dueDate) : issueDate,
    paidAmount: Number.parseFloat(row.paid),
    createdAt: issueDate,
    updatedAt: issueDate,
  };
};

const toInvoicePayment = (row: PaymentRow): InvoicePayment => ({
  id: row.id,
  invoiceId: row.invoiceId ?? "",
  amount: Number.parseFloat(row.amount),
  paymentDate: new Date(row.paidAt ?? row.createdAt),
  paymentMethod: row.paymentMethod ?? "manual",
  transactionId: row.providerTxId ?? row.id,
  status:
    row.status === "COMPLETED"
      ? "completed"
      : row.status === "FAILED"
        ? "failed"
        : row.status === "REFUNDED"
          ? "refunded"
          : "pending",
  processedBy: row.paymentProvider ?? "manual",
  createdAt: new Date(row.createdAt),
});

function computeStatistics(invoices: Invoice[]): InvoiceStatistics {
  const totalAmount = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
  const paidAmount = invoices.reduce((sum, invoice) => sum + (invoice.paidAmount ?? 0), 0);
  const open = invoices.filter((invoice) => invoice.status === "sent");
  const overdue = invoices.filter((invoice) => invoice.status === "overdue");
  const inThirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const byMonth = new Map<string, { amount: number; collected: number }>();
  for (const invoice of invoices) {
    const key = `${invoice.issueDate.getFullYear()}-${String(invoice.issueDate.getMonth() + 1).padStart(2, "0")}`;
    const bucket = byMonth.get(key) ?? { amount: 0, collected: 0 };
    bucket.amount += invoice.totalAmount;
    bucket.collected += invoice.paidAmount ?? 0;
    byMonth.set(key, bucket);
  }

  const byClient = new Map<
    string,
    { clientName: string; invoiceCount: number; totalAmount: number; paidAmount: number }
  >();
  for (const invoice of invoices) {
    const bucket = byClient.get(invoice.clientId) ?? {
      clientName: invoice.clientName,
      invoiceCount: 0,
      totalAmount: 0,
      paidAmount: 0,
    };
    bucket.invoiceCount += 1;
    bucket.totalAmount += invoice.totalAmount;
    bucket.paidAmount += invoice.paidAmount ?? 0;
    byClient.set(invoice.clientId, bucket);
  }

  return {
    totalInvoices: invoices.length,
    totalAmount,
    paidAmount,
    pendingAmount: open.reduce(
      (sum, invoice) => sum + invoice.totalAmount - (invoice.paidAmount ?? 0),
      0,
    ),
    overdueAmount: overdue.reduce(
      (sum, invoice) => sum + invoice.totalAmount - (invoice.paidAmount ?? 0),
      0,
    ),
    collectionRate: totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0,
    overdueCount: overdue.length,
    upcomingInvoices: open.filter((invoice) => invoice.dueDate <= inThirtyDays).length,
    monthlyTrend: Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, bucket]) => ({ month, amount: bucket.amount, collected: bucket.collected })),
    clientBreakdown: Array.from(byClient.entries()).map(([clientId, bucket]) => ({
      clientId,
      clientName: bucket.clientName,
      invoiceCount: bucket.invoiceCount,
      totalAmount: bucket.totalAmount,
      paidAmount: bucket.paidAmount,
    })),
  };
}

function applyFilters(invoices: Invoice[], filters: InvoiceFilterOptions): Invoice[] {
  // Loop-invariant: lowercase the search needle once per pass, not per row.
  const needle = filters.search?.toLowerCase();
  return invoices.filter((invoice) => {
    if (filters.status?.length && !filters.status.includes(invoice.status)) return false;
    if (filters.client?.length && !filters.client.includes(invoice.clientName)) return false;
    if (filters.dateRange) {
      if (
        invoice.issueDate < filters.dateRange.start ||
        invoice.issueDate > filters.dateRange.end
      ) {
        return false;
      }
    }
    if (filters.amountRange) {
      if (invoice.totalAmount < filters.amountRange.min) return false;
      if (filters.amountRange.max > 0 && invoice.totalAmount > filters.amountRange.max)
        return false;
    }
    if (needle) {
      const haystack =
        `${invoice.invoiceNumber} ${invoice.clientName} ${invoice.clientEmail}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

export function useFinanceInvoices() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<InvoiceFilterOptions>({});

  const invoicesQuery = useQuery({
    queryKey: ["finance", "dashboard-invoices"],
    queryFn: async () => {
      const { data } = await apiFetch<{ rows: InvoiceClientRow[]; meta: { total: number } }>(
        "/api/v1/finance/reports/invoices?limit=100",
      );
      return data.rows;
    },
  });

  const paymentsQuery = useQuery({
    queryKey: ["finance", "payments"],
    queryFn: async () => {
      const { data } = await apiFetch<{ payments: PaymentRow[]; total: number }>(
        "/api/v1/finance/payments?limit=100",
      );
      return data.payments;
    },
  });

  const invalidateFinance = () => queryClient.invalidateQueries({ queryKey: ["finance"] });

  const recordPaymentMutation = useMutation({
    mutationFn: async (input: { invoiceId: string; amount: number; paymentMethod: string }) => {
      const { data } = await apiFetch<{ payment: unknown }>("/api/v1/finance/payments", {
        method: "POST",
        body: JSON.stringify({
          invoiceId: input.invoiceId,
          amount: input.amount.toFixed(2),
          paymentMethod: input.paymentMethod,
        }),
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Payment recorded");
      invalidateFinance();
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to record payment");
    },
  });

  const voidInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { data } = await apiFetch<{ invoice: unknown }>(
        `/api/v1/finance/invoices/${invoiceId}/void`,
        { method: "POST", body: JSON.stringify({ reason: "Voided from the invoices dashboard" }) },
      );
      return data;
    },
    onSuccess: () => {
      toast.success("Invoice voided");
      invalidateFinance();
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to void invoice");
    },
  });

  const invoices = useMemo(() => {
    const rows = invoicesQuery.data ?? [];
    return applyFilters(rows.map(toInvoice), filters);
  }, [invoicesQuery.data, filters]);

  const payments = useMemo(
    () => (paymentsQuery.data ?? []).map(toInvoicePayment),
    [paymentsQuery.data],
  );

  const statistics = useMemo(() => computeStatistics(invoices), [invoices]);

  const recordPayment = (invoiceId: string, amount: number, paymentMethod: string) => {
    if (amount <= 0) {
      toast.error("Payment amount must be greater than zero");
      return;
    }
    recordPaymentMutation.mutate({ invoiceId, amount, paymentMethod });
  };

  const updateInvoiceStatus = (invoiceId: string, status: Invoice["status"]) => {
    const invoice = invoices.find((candidate) => candidate.id === invoiceId);
    if (!invoice) return;

    if (status === "paid") {
      const balance = invoice.totalAmount - (invoice.paidAmount ?? 0);
      if (balance <= 0) {
        toast.info("This invoice is already fully paid");
        return;
      }
      recordPaymentMutation.mutate({ invoiceId, amount: balance, paymentMethod: "manual" });
      return;
    }

    if (status === "cancelled") {
      voidInvoiceMutation.mutate(invoiceId);
      return;
    }

    toast.info(
      "Invoice status follows recorded payments and voids — record a payment or void the invoice instead.",
    );
  };

  const sendReminder = (_invoiceId: string, _type: "email" | "sms" | "in_app") => {
    toast.info("Email delivery is not wired up yet — no reminder was sent.");
  };

  const sendInvoice = (_invoiceId: string) => {
    toast.info(
      "Email delivery is not wired up yet — the invoice is already recorded on the ledger.",
    );
  };

  const refreshData = () => {
    invalidateFinance();
  };

  const updateFilters = (next: Partial<InvoiceFilterOptions>) => {
    setFilters((current) => ({ ...current, ...next }));
  };

  const clearFilters = () => setFilters({});

  return {
    invoices,
    payments,
    statistics,
    loading: invoicesQuery.isPending || paymentsQuery.isPending,
    error: invoicesQuery.error
      ? invoicesQuery.error instanceof ApiClientError
        ? invoicesQuery.error.message
        : "Failed to load invoices"
      : paymentsQuery.error
        ? paymentsQuery.error instanceof ApiClientError
          ? paymentsQuery.error.message
          : "Failed to load invoices"
        : null,
    filters,
    recordPayment,
    updateInvoiceStatus,
    sendReminder,
    sendInvoice,
    refreshData,
    updateFilters,
    clearFilters,
  };
}
