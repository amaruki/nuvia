"use client";

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";

import {
  DUES_LEDGER_QUERY_KEY,
  DUES_PAGE_LIMIT,
  DUES_REPORT_PATH,
  PAYMENTS_API_PATH,
  PAYMENTS_QUERY_KEY,
} from "./constants";
import { hydrateDuePayment, hydrateMemberDue } from "./hydrate-due";
import type { DuesLedgerRow, PaymentRow } from "./types";

/**
 * Dues ledger: one page of the finance report computed from membership
 * invoices, hydrated client-side; filtering and statistics happen in memory,
 * so the query itself takes no filters.
 */
export function useDuesLedgerQuery() {
  return useQuery({
    queryKey: DUES_LEDGER_QUERY_KEY,
    queryFn: async () => {
      const { data } = await apiFetch<{ rows: DuesLedgerRow[]; meta: { total: number } }>(
        `${DUES_REPORT_PATH}?limit=${DUES_PAGE_LIMIT}`,
      );
      return data.rows.map(hydrateMemberDue);
    },
  });
}

/** Recorded membership payments shown alongside the dues ledger. */
export function usePaymentsQuery() {
  return useQuery({
    queryKey: PAYMENTS_QUERY_KEY,
    queryFn: async () => {
      const { data } = await apiFetch<{ payments: PaymentRow[]; total: number }>(
        `${PAYMENTS_API_PATH}?limit=${DUES_PAGE_LIMIT}`,
      );
      return data.payments.map(hydrateDuePayment);
    },
  });
}
