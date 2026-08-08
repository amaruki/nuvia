"use client";

/**
 * C4: dues dashboard hook backed by the real finance services.
 *
 * Data comes from GET /api/v1/finance/reports/dues (the dues ledger computed
 * from membership invoices) and GET /api/v1/finance/payments (C3 payment
 * records). Writing goes through the landed C3 endpoints:
 *   POST /api/v1/finance/payments            — record a payment
 *   POST /api/v1/finance/invoices/:id/void   — void (cancel) an invoice
 *
 * There is no reminders store in the schema, so `reminders` is always empty
 * and sendReminder reports that honestly instead of faking a send.
 */

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import type { DueFilterOptions, DuePayment, DueStatistics, MemberDue } from "@/types/finance.types";

/** Wire shape of src/lib/services/finance-report.service.ts DuesLedgerRow. */
interface DuesLedgerRow {
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
  status: MemberDue["status"];
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

const toMemberDue = (row: DuesLedgerRow): MemberDue => {
  const issuedAt = new Date(row.issuedAt);
  return {
    id: row.invoiceId,
    memberId: row.memberId ?? "",
    memberName: row.memberName ?? row.memberEmail ?? "Unknown member",
    memberEmail: row.memberEmail ?? "",
    membershipTier: row.tierName ?? "—",
    dueAmount: Number.parseFloat(row.amount),
    paidAmount: Number.parseFloat(row.paid),
    balanceAmount: Number.parseFloat(row.balance),
    dueDate: row.dueDate ? new Date(row.dueDate) : issuedAt,
    status: row.status,
    createdAt: issuedAt,
    updatedAt: issuedAt,
  };
};

const toDuePayment = (row: PaymentRow): DuePayment => ({
  id: row.id,
  dueId: row.invoiceId ?? "",
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

function computeStatistics(dues: MemberDue[]): DueStatistics {
  const totalAmount = dues.reduce((sum, due) => sum + due.dueAmount, 0);
  const collectedAmount = dues.reduce((sum, due) => sum + due.paidAmount, 0);
  const open = dues.filter((due) => due.status === "pending" || due.status === "partial");
  const overdue = dues.filter((due) => due.status === "overdue");
  const inThirtyDays = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const byMonth = new Map<string, { amount: number; collected: number }>();
  for (const due of dues) {
    const key = `${due.dueDate.getFullYear()}-${String(due.dueDate.getMonth() + 1).padStart(2, "0")}`;
    const bucket = byMonth.get(key) ?? { amount: 0, collected: 0 };
    bucket.amount += due.dueAmount;
    bucket.collected += due.paidAmount;
    byMonth.set(key, bucket);
  }

  const byTier = new Map<string, { count: number; amount: number; collected: number }>();
  for (const due of dues) {
    const bucket = byTier.get(due.membershipTier) ?? { count: 0, amount: 0, collected: 0 };
    bucket.count += 1;
    bucket.amount += due.dueAmount;
    bucket.collected += due.paidAmount;
    byTier.set(due.membershipTier, bucket);
  }

  return {
    totalDues: dues.length,
    totalAmount,
    collectedAmount,
    pendingAmount: open.reduce((sum, due) => sum + due.balanceAmount, 0),
    overdueAmount: overdue.reduce((sum, due) => sum + due.balanceAmount, 0),
    collectionRate: totalAmount > 0 ? Math.round((collectedAmount / totalAmount) * 100) : 0,
    overdueCount: overdue.length,
    upcomingDues: open.filter((due) => due.dueDate <= inThirtyDays).length,
    monthlyTrend: Array.from(byMonth.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, bucket]) => ({ month, amount: bucket.amount, collected: bucket.collected })),
    tierBreakdown: Array.from(byTier.entries()).map(([tier, bucket]) => ({
      tier,
      count: bucket.count,
      amount: bucket.amount,
      collected: bucket.collected,
    })),
  };
}

function applyFilters(dues: MemberDue[], filters: DueFilterOptions): MemberDue[] {
  // Loop-invariant: lowercase the search needle once per pass, not per row.
  const needle = filters.search?.toLowerCase();
  return dues.filter((due) => {
    if (filters.status?.length && !filters.status.includes(due.status)) return false;
    if (filters.tier?.length && !filters.tier.includes(due.membershipTier)) return false;
    if (filters.dateRange) {
      if (due.dueDate < filters.dateRange.start || due.dueDate > filters.dateRange.end) {
        return false;
      }
    }
    if (filters.amountRange) {
      if (due.dueAmount < filters.amountRange.min) return false;
      if (filters.amountRange.max > 0 && due.dueAmount > filters.amountRange.max) return false;
    }
    if (needle) {
      const haystack = `${due.memberName} ${due.memberEmail} ${due.membershipTier}`.toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    return true;
  });
}

export function useFinanceDues() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<DueFilterOptions>({});

  const ledgerQuery = useQuery({
    queryKey: ["finance", "dues-ledger"],
    queryFn: async () => {
      const { data } = await apiFetch<{ rows: DuesLedgerRow[]; meta: { total: number } }>(
        "/api/v1/finance/reports/dues?limit=100",
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
        { method: "POST", body: JSON.stringify({ reason: "Voided from the dues dashboard" }) },
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

  const dues = useMemo(() => {
    const rows = ledgerQuery.data ?? [];
    return applyFilters(rows.map(toMemberDue), filters);
  }, [ledgerQuery.data, filters]);

  const payments = useMemo(
    () => (paymentsQuery.data ?? []).map(toDuePayment),
    [paymentsQuery.data],
  );

  const statistics = useMemo(() => computeStatistics(dues), [dues]);

  const recordPayment = (dueId: string, amount: number, paymentMethod: string) => {
    if (amount <= 0) {
      toast.error("Payment amount must be greater than zero");
      return;
    }
    recordPaymentMutation.mutate({ invoiceId: dueId, amount, paymentMethod });
  };

  const updateDueStatus = (dueId: string, status: MemberDue["status"]) => {
    const due = dues.find((d) => d.id === dueId);
    if (!due) return;

    if (status === "paid") {
      if (due.balanceAmount <= 0) {
        toast.info("This due is already fully paid");
        return;
      }
      recordPaymentMutation.mutate({
        invoiceId: dueId,
        amount: due.balanceAmount,
        paymentMethod: "manual",
      });
      return;
    }

    if (status === "cancelled") {
      voidInvoiceMutation.mutate(dueId);
      return;
    }

    toast.info(
      "Dues status is derived from invoice payments and due dates — record a payment or void the invoice instead.",
    );
  };

  const sendReminder = (_dueId: string, _type: "email" | "sms" | "in_app") => {
    toast.info("Automated reminders are not wired to an email outbox yet — no reminder was sent.");
  };

  const refreshData = () => {
    invalidateFinance();
  };

  const updateFilters = (next: Partial<DueFilterOptions>) => {
    setFilters((current) => ({ ...current, ...next }));
  };

  const clearFilters = () => setFilters({});

  return {
    dues,
    payments,
    /** No reminders table exists in the schema; the dashboard shows none. */
    reminders: [] as never[],
    statistics,
    loading: ledgerQuery.isPending || paymentsQuery.isPending,
    error: ledgerQuery.error
      ? ledgerQuery.error instanceof ApiClientError
        ? ledgerQuery.error.message
        : "Failed to load member dues"
      : paymentsQuery.error
        ? paymentsQuery.error instanceof ApiClientError
          ? paymentsQuery.error.message
          : "Failed to load member dues"
        : null,
    filters,
    updateDueStatus,
    recordPayment,
    sendReminder,
    refreshData,
    updateFilters,
    clearFilters,
  };
}
