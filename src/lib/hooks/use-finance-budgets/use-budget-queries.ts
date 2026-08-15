"use client";

import { useQuery } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";

import {
  BUDGET_CATEGORIES_QUERY_KEY,
  BUDGET_TRANSACTIONS_API_PATH,
  BUDGET_TRANSACTIONS_QUERY_KEY,
  BUDGET_WINDOW_QUERY_KEY,
  BUDGETS_API_PATH,
  STATISTICS_WINDOW_LIMIT,
} from "./constants";
import { hydrateBudgetCategory, hydrateBudgetTransaction } from "./hydrate-budget";
import type { BudgetCategoryRow, BudgetTransactionRow } from "./types";

/** Pagination metadata returned by the budget list endpoints. */
export interface BudgetListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Server pagination params for the transactions table query. */
export interface BudgetTransactionListParams {
  page: number;
  pageSize: number;
}

/**
 * Transactions table list: one server-paginated page. Page and page size
 * come from the URL-synced table state, so the full list is reachable — no
 * silent row cap.
 */
export function useBudgetTransactionsQuery({ page, pageSize }: BudgetTransactionListParams) {
  return useQuery({
    queryKey: [...BUDGET_TRANSACTIONS_QUERY_KEY, { page, pageSize }],
    queryFn: async () => {
      const { data } = await apiFetch<{
        transactions: BudgetTransactionRow[];
        meta: BudgetListMeta;
      }>(`${BUDGET_TRANSACTIONS_API_PATH}?page=${page}&limit=${pageSize}`);
      return { transactions: data.transactions.map(hydrateBudgetTransaction), meta: data.meta };
    },
  });
}

/**
 * Budget categories for the overview cards and form selects. Fixed at the
 * newest STATISTICS_WINDOW_LIMIT rows — the endpoint caps `limit` at 100 —
 * a documented cap; category spend figures come precomputed from the
 * service, so they describe every transaction regardless of this window.
 */
export function useBudgetCategoriesQuery() {
  return useQuery({
    queryKey: BUDGET_CATEGORIES_QUERY_KEY,
    queryFn: async () => {
      const { data } = await apiFetch<{ categories: BudgetCategoryRow[] }>(
        `${BUDGETS_API_PATH}?page=1&limit=${STATISTICS_WINDOW_LIMIT}`,
      );
      return data.categories.map(hydrateBudgetCategory);
    },
  });
}

/**
 * Bounded aggregate window for the overview cards. Fixed at the newest
 * STATISTICS_WINDOW_LIMIT transactions while the table above paginates over
 * the full list. See STATISTICS_WINDOW_LIMIT for the stated cap.
 */
export function useBudgetTransactionsWindowQuery() {
  return useQuery({
    queryKey: BUDGET_WINDOW_QUERY_KEY,
    queryFn: async () => {
      const { data } = await apiFetch<{ transactions: BudgetTransactionRow[] }>(
        `${BUDGET_TRANSACTIONS_API_PATH}?page=1&limit=${STATISTICS_WINDOW_LIMIT}`,
      );
      return data.transactions.map(hydrateBudgetTransaction);
    },
  });
}

/** One transaction by id for the edit sheet's shareable ?transaction=<id> deep links. */
export function useBudgetTransactionQuery(id: string | null) {
  return useQuery({
    queryKey: [...BUDGET_TRANSACTIONS_QUERY_KEY, "detail", id],
    queryFn: async () => {
      const { data } = await apiFetch<{ transaction: BudgetTransactionRow }>(
        `${BUDGET_TRANSACTIONS_API_PATH}/${id}`,
      );
      return hydrateBudgetTransaction(data.transaction);
    },
    enabled: id !== null,
  });
}
