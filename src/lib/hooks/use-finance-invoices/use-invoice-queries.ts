"use client";

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";

import {
  INVOICES_PAGE_LIMIT,
  INVOICES_QUERY_KEY,
  INVOICES_REPORT_PATH,
  PAYMENTS_API_PATH,
  PAYMENTS_QUERY_KEY,
} from "./constants";
import { hydrateInvoice, hydratePayment } from "./hydrate-invoice";
import type { InvoiceClientRow, PaymentRow } from "./types";

/**
 * Invoices dashboard list: one page of the finance report join, hydrated
 * client-side; filtering and statistics happen in memory, so the query
 * itself takes no filters.
 */
export function useInvoicesQuery() {
  return useQuery({
    queryKey: INVOICES_QUERY_KEY,
    queryFn: async () => {
      const { data } = await apiFetch<{ rows: InvoiceClientRow[]; meta: { total: number } }>(
        `${INVOICES_REPORT_PATH}?limit=${INVOICES_PAGE_LIMIT}`,
      );
      return data.rows.map(hydrateInvoice);
    },
  });
}

/** Recorded membership payments shown alongside the invoices list. */
export function usePaymentsQuery() {
  return useQuery({
    queryKey: PAYMENTS_QUERY_KEY,
    queryFn: async () => {
      const { data } = await apiFetch<{ payments: PaymentRow[]; total: number }>(
        `${PAYMENTS_API_PATH}?limit=${INVOICES_PAGE_LIMIT}`,
      );
      return data.payments.map(hydratePayment);
    },
  });
}
