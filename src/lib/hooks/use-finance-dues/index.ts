"use client";

/**
 * C4: dues dashboard hook backed by the real finance services.
 *
 * The table ledger comes from GET /api/v1/finance/reports/dues with real
 * page/limit params (URL-synced pagination). Statistics, overview cards and
 * the recent/upcoming lists use a bounded window of the newest
 * STATISTICS_WINDOW_LIMIT rows — the endpoint caps `limit` at 100 — so the
 * cap is stated instead of silent. Payments come from GET
 * /api/v1/finance/payments (C3 payment records). Writing goes through the
 * landed C3 endpoints:
 *   POST /api/v1/finance/payments            — record a payment
 *   POST /api/v1/finance/invoices/:id/void   — void (cancel) an invoice
 *
 * There is no reminders store in the schema, so `reminders` is always empty
 * and sendReminder reports that honestly instead of faking a send.
 */

import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiClientError } from "@/lib/api-client";
import type { MemberDue } from "@/types/finance";

import { FINANCE_QUERY_KEY } from "./constants";
import { buildDueStatistics } from "./due-statistics";
import type { UseFinanceDuesOptions, UseFinanceDuesReturn } from "./types";
import { useDueMutations } from "./use-due-mutations";
import { useDuesLedgerQuery, useDuesWindowQuery, usePaymentsQuery } from "./use-due-queries";

function errorMessage(error: unknown): string {
  return error instanceof ApiClientError ? error.message : "Failed to load member dues";
}

export function useFinanceDues({ page, pageSize }: UseFinanceDuesOptions): UseFinanceDuesReturn {
  const queryClient = useQueryClient();

  const ledgerQuery = useDuesLedgerQuery({ page, pageSize });
  const windowQuery = useDuesWindowQuery();
  const paymentsQuery = usePaymentsQuery();

  const invalidateFinance = () => queryClient.invalidateQueries({ queryKey: FINANCE_QUERY_KEY });

  const { recordPaymentMutation, voidInvoiceMutation } = useDueMutations({
    invalidate: invalidateFinance,
  });

  const dues = useMemo(() => ledgerQuery.data?.dues ?? [], [ledgerQuery.data]);
  const total = ledgerQuery.data?.meta.total ?? 0;
  const totalPages = ledgerQuery.data?.meta.totalPages ?? 0;

  const statisticsRows = useMemo(() => windowQuery.data ?? [], [windowQuery.data]);
  const statistics = useMemo(() => buildDueStatistics(statisticsRows), [statisticsRows]);

  const payments = useMemo(() => paymentsQuery.data ?? [], [paymentsQuery.data]);

  const recordPayment = (dueId: string, amount: number, paymentMethod: string) => {
    if (amount <= 0) {
      toast.error("Payment amount must be greater than zero");
      return;
    }
    recordPaymentMutation.mutate({ invoiceId: dueId, amount, paymentMethod });
  };

  const updateDueStatus = (dueId: string, status: MemberDue["status"]) => {
    const due = dues.find((d) => d.id === dueId) ?? statisticsRows.find((d) => d.id === dueId);
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

  return {
    dues,
    total,
    totalPages,
    loading: ledgerQuery.isPending || windowQuery.isPending || paymentsQuery.isPending,
    fetching: ledgerQuery.isFetching,
    error: ledgerQuery.error
      ? errorMessage(ledgerQuery.error)
      : windowQuery.error
        ? errorMessage(windowQuery.error)
        : paymentsQuery.error
          ? errorMessage(paymentsQuery.error)
          : null,
    statisticsRows,
    statistics,
    payments,
    /** No reminders table exists in the schema; the dashboard shows none. */
    reminders: [] as never[],
    updateDueStatus,
    recordPayment,
    sendReminder,
    refreshData,
  };
}
