"use client";

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";

import {
  INVOICES_QUERY_KEY,
  INVOICES_REPORT_PATH,
  INVOICES_WINDOW_QUERY_KEY,
  PAYMENTS_API_PATH,
  PAYMENTS_QUERY_KEY,
  PAYMENTS_RECENT_LIMIT,
  STATISTICS_WINDOW_LIMIT,
} from "./constants";
import { hydrateInvoice, hydratePayment } from "./hydrate-invoice";
import type { InvoiceClientRow, PaymentRow } from "./types";

/** Pagination metadata returned by the finance report endpoints. */
export interface ReportListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Server pagination params for the invoices table query. */
export interface InvoiceListParams {
  page: number;
  pageSize: number;
}

/**
 * Invoices table list: one server-paginated page of the finance report join,
 * hydrated client-side. Page and page size come from the URL-synced table
 * state, so the full list is reachable — no silent row cap.
 */
export function useInvoicesQuery({ page, pageSize }: InvoiceListParams) {
  return useQuery({
    queryKey: [...INVOICES_QUERY_KEY, { page, pageSize }],
    queryFn: async () => {
      const { data } = await apiFetch<{ rows: InvoiceClientRow[]; meta: ReportListMeta }>(
        `${INVOICES_REPORT_PATH}?page=${page}&limit=${pageSize}`,
      );
      return { invoices: data.rows.map(hydrateInvoice), meta: data.meta };
    },
  });
}

/**
 * Bounded aggregate window for statistics, overview cards and the
 * recent/upcoming lists. Fixed at the newest STATISTICS_WINDOW_LIMIT rows —
 * the report endpoint caps `limit` at 100 — while the table above paginates
 * over the full list. See STATISTICS_WINDOW_LIMIT for the stated cap.
 */
export function useInvoicesWindowQuery() {
  return useQuery({
    queryKey: INVOICES_WINDOW_QUERY_KEY,
    queryFn: async () => {
      const { data } = await apiFetch<{ rows: InvoiceClientRow[] }>(
        `${INVOICES_REPORT_PATH}?page=1&limit=${STATISTICS_WINDOW_LIMIT}`,
      );
      return data.rows.map(hydrateInvoice);
    },
  });
}

/**
 * Recorded membership payments shown alongside invoices: the most recent
 * PAYMENTS_RECENT_LIMIT records (documented cap, newest-first).
 */
export function usePaymentsQuery() {
  return useQuery({
    queryKey: PAYMENTS_QUERY_KEY,
    queryFn: async () => {
      const { data } = await apiFetch<{ payments: PaymentRow[]; total: number }>(
        `${PAYMENTS_API_PATH}?page=1&limit=${PAYMENTS_RECENT_LIMIT}`,
      );
      return data.payments.map(hydratePayment);
    },
  });
}
