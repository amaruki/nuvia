"use client";

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";

import {
  DUES_LEDGER_QUERY_KEY,
  DUES_REPORT_PATH,
  DUES_WINDOW_QUERY_KEY,
  PAYMENTS_API_PATH,
  PAYMENTS_QUERY_KEY,
  PAYMENTS_RECENT_LIMIT,
  STATISTICS_WINDOW_LIMIT,
} from "./constants";
import { hydrateDuePayment, hydrateMemberDue } from "./hydrate-due";
import type { DuesLedgerRow, PaymentRow } from "./types";

/** Pagination metadata returned by the finance report endpoints. */
export interface ReportListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Server pagination params for the dues table query. */
export interface DuesListParams {
  page: number;
  pageSize: number;
}

/**
 * Dues table ledger: one server-paginated page of the finance report
 * computed from membership invoices, hydrated client-side. Page and page
 * size come from the URL-synced table state, so the full ledger is
 * reachable — no silent row cap.
 */
export function useDuesLedgerQuery({ page, pageSize }: DuesListParams) {
  return useQuery({
    queryKey: [...DUES_LEDGER_QUERY_KEY, { page, pageSize }],
    queryFn: async () => {
      const { data } = await apiFetch<{ rows: DuesLedgerRow[]; meta: ReportListMeta }>(
        `${DUES_REPORT_PATH}?page=${page}&limit=${pageSize}`,
      );
      return { dues: data.rows.map(hydrateMemberDue), meta: data.meta };
    },
  });
}

/**
 * Bounded aggregate window for statistics, overview cards and the
 * recent/upcoming lists. Fixed at the newest STATISTICS_WINDOW_LIMIT rows —
 * the report endpoint caps `limit` at 100 — while the table above paginates
 * over the full ledger. See STATISTICS_WINDOW_LIMIT for the stated cap.
 */
export function useDuesWindowQuery() {
  return useQuery({
    queryKey: DUES_WINDOW_QUERY_KEY,
    queryFn: async () => {
      const { data } = await apiFetch<{ rows: DuesLedgerRow[] }>(
        `${DUES_REPORT_PATH}?page=1&limit=${STATISTICS_WINDOW_LIMIT}`,
      );
      return data.rows.map(hydrateMemberDue);
    },
  });
}

/**
 * Recorded membership payments shown alongside the dues ledger: the most
 * recent PAYMENTS_RECENT_LIMIT records (documented cap, newest-first).
 */
export function usePaymentsQuery() {
  return useQuery({
    queryKey: PAYMENTS_QUERY_KEY,
    queryFn: async () => {
      const { data } = await apiFetch<{ payments: PaymentRow[]; total: number }>(
        `${PAYMENTS_API_PATH}?page=1&limit=${PAYMENTS_RECENT_LIMIT}`,
      );
      return data.payments.map(hydrateDuePayment);
    },
  });
}
