"use client";

/**
 * C4: invoices dashboard hook backed by the real finance services.
 *
 * The table list comes from GET /api/v1/finance/reports/invoices with real
 * page/limit params (URL-synced pagination). Statistics, overview cards and
 * the recent/upcoming lists use a bounded window of the newest
 * STATISTICS_WINDOW_LIMIT rows — the endpoint caps `limit` at 100 — so the
 * cap is stated instead of silent. Actions go through the landed C3
 * endpoints:
 *   POST /api/v1/finance/payments            — record a payment
 *   POST /api/v1/finance/invoices/:id/void   — void (cancel) an invoice
 *
 * Invoice statuses map onto the dashboard's as: ISSUED -> sent (or overdue
 * once the due date passes), PAID -> paid, VOID -> cancelled. There are no
 * draft invoices and no email delivery step — those mock actions report that
 * honestly instead of pretending.
 */

import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiClientError } from "@/lib/api-client";
import type { Invoice } from "@/types/finance";

import { FINANCE_QUERY_KEY } from "./constants";
import { buildInvoiceStatistics } from "./invoice-statistics";
import type { UseFinanceInvoicesOptions, UseFinanceInvoicesReturn } from "./types";
import { useInvoiceMutations } from "./use-invoice-mutations";
import { useInvoicesQuery, useInvoicesWindowQuery, usePaymentsQuery } from "./use-invoice-queries";

function errorMessage(error: unknown): string {
  return error instanceof ApiClientError ? error.message : "Failed to load invoices";
}

export function useFinanceInvoices({
  page,
  pageSize,
}: UseFinanceInvoicesOptions): UseFinanceInvoicesReturn {
  const queryClient = useQueryClient();

  const invoicesQuery = useInvoicesQuery({ page, pageSize });
  const windowQuery = useInvoicesWindowQuery();
  const paymentsQuery = usePaymentsQuery();

  const invalidateFinance = () => queryClient.invalidateQueries({ queryKey: FINANCE_QUERY_KEY });

  const { recordPaymentMutation, voidInvoiceMutation } = useInvoiceMutations({
    invalidate: invalidateFinance,
  });

  const invoices = useMemo(() => invoicesQuery.data?.invoices ?? [], [invoicesQuery.data]);
  const total = invoicesQuery.data?.meta.total ?? 0;
  const totalPages = invoicesQuery.data?.meta.totalPages ?? 0;

  const statisticsRows = useMemo(() => windowQuery.data ?? [], [windowQuery.data]);
  const statistics = useMemo(() => buildInvoiceStatistics(statisticsRows), [statisticsRows]);

  const payments = useMemo(() => paymentsQuery.data ?? [], [paymentsQuery.data]);

  const recordPayment = (invoiceId: string, amount: number, paymentMethod: string) => {
    if (amount <= 0) {
      toast.error("Payment amount must be greater than zero");
      return;
    }
    recordPaymentMutation.mutate({ invoiceId, amount, paymentMethod });
  };

  const updateInvoiceStatus = (invoiceId: string, status: Invoice["status"]) => {
    const invoice =
      invoices.find((candidate) => candidate.id === invoiceId) ??
      statisticsRows.find((candidate) => candidate.id === invoiceId);
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

  return {
    invoices,
    total,
    totalPages,
    loading: invoicesQuery.isPending || windowQuery.isPending || paymentsQuery.isPending,
    fetching: invoicesQuery.isFetching,
    error: invoicesQuery.error
      ? errorMessage(invoicesQuery.error)
      : windowQuery.error
        ? errorMessage(windowQuery.error)
        : paymentsQuery.error
          ? errorMessage(paymentsQuery.error)
          : null,
    statisticsRows,
    statistics,
    payments,
    recordPayment,
    updateInvoiceStatus,
    sendReminder,
    sendInvoice,
    refreshData,
  };
}
