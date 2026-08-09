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
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiClientError } from "@/lib/api-client";
import type { DueFilterOptions, MemberDue } from "@/types/finance";

import { FINANCE_QUERY_KEY } from "./constants";
import { applyDueFilters } from "./due-filters";
import { buildDueStatistics } from "./due-statistics";
import type { UseFinanceDuesReturn } from "./types";
import { useDueMutations } from "./use-due-mutations";
import { useDuesLedgerQuery, usePaymentsQuery } from "./use-due-queries";

export function useFinanceDues(): UseFinanceDuesReturn {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<DueFilterOptions>({});

  const ledgerQuery = useDuesLedgerQuery();
  const paymentsQuery = usePaymentsQuery();

  const invalidateFinance = () => queryClient.invalidateQueries({ queryKey: FINANCE_QUERY_KEY });

  const { recordPaymentMutation, voidInvoiceMutation } = useDueMutations({
    invalidate: invalidateFinance,
  });

  const dues = useMemo(
    () => applyDueFilters(ledgerQuery.data ?? [], filters),
    [ledgerQuery.data, filters],
  );

  const payments = useMemo(() => paymentsQuery.data ?? [], [paymentsQuery.data]);

  const statistics = useMemo(() => buildDueStatistics(dues), [dues]);

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
