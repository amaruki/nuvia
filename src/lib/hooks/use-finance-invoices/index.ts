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
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiClientError } from "@/lib/api-client";
import type { Invoice, InvoiceFilterOptions } from "@/types/finance";

import { FINANCE_QUERY_KEY } from "./constants";
import { applyInvoiceFilters } from "./invoice-filters";
import { buildInvoiceStatistics } from "./invoice-statistics";
import type { UseFinanceInvoicesReturn } from "./types";
import { useInvoiceMutations } from "./use-invoice-mutations";
import { useInvoicesQuery, usePaymentsQuery } from "./use-invoice-queries";

export function useFinanceInvoices(): UseFinanceInvoicesReturn {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<InvoiceFilterOptions>({});

  const invoicesQuery = useInvoicesQuery();
  const paymentsQuery = usePaymentsQuery();

  const invalidateFinance = () => queryClient.invalidateQueries({ queryKey: FINANCE_QUERY_KEY });

  const { recordPaymentMutation, voidInvoiceMutation } = useInvoiceMutations({
    invalidate: invalidateFinance,
  });

  const invoices = useMemo(
    () => applyInvoiceFilters(invoicesQuery.data ?? [], filters),
    [invoicesQuery.data, filters],
  );

  const payments = useMemo(() => paymentsQuery.data ?? [], [paymentsQuery.data]);

  const statistics = useMemo(() => buildInvoiceStatistics(invoices), [invoices]);

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
