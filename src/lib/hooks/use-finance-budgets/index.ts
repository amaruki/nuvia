"use client";

/**
 * Budget dashboard hook backed by the real budget store
 * (budget_categories + budget_transactions).
 *
 * The table list comes from GET /api/v1/finance/budget-transactions with
 * real page/limit params (URL-synced pagination). The overview cards use
 * the categories list (server-computed spend, exact) plus a bounded window
 * of the newest STATISTICS_WINDOW_LIMIT transactions — the endpoint caps
 * `limit` at 100 — so the cap is stated instead of silent. Actions go
 * through:
 *   POST  /api/v1/finance/budgets                  — create a category
 *   POST  /api/v1/finance/budget-transactions      — record a transaction
 *   PATCH /api/v1/finance/budget-transactions/:id  — status/notes update
 */

import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { ApiClientError } from "@/lib/api-client";

import { buildBudgetOverview } from "./build-budget-overview";
import { FINANCE_QUERY_KEY } from "./constants";
import type {
  BudgetCategoryInput,
  BudgetTransactionInput,
  BudgetTransactionStatusInput,
  UseFinanceBudgetsOptions,
  UseFinanceBudgetsReturn,
} from "./types";
import { useBudgetMutations } from "./use-budget-mutations";
import {
  useBudgetCategoriesQuery,
  useBudgetTransactionsQuery,
  useBudgetTransactionsWindowQuery,
} from "./use-budget-queries";

function errorMessage(error: unknown): string {
  return error instanceof ApiClientError ? error.message : "Failed to load the budget";
}

export function useFinanceBudgets({
  page,
  pageSize,
}: UseFinanceBudgetsOptions): UseFinanceBudgetsReturn {
  const queryClient = useQueryClient();

  const transactionsQuery = useBudgetTransactionsQuery({ page, pageSize });
  const categoriesQuery = useBudgetCategoriesQuery();
  const windowQuery = useBudgetTransactionsWindowQuery();

  const invalidateFinance = () => queryClient.invalidateQueries({ queryKey: FINANCE_QUERY_KEY });

  const { createCategoryMutation, recordTransactionMutation, updateTransactionMutation } =
    useBudgetMutations({ invalidate: invalidateFinance });

  const transactions = useMemo(
    () => transactionsQuery.data?.transactions ?? [],
    [transactionsQuery.data],
  );
  const total = transactionsQuery.data?.meta.total ?? 0;
  const totalPages = transactionsQuery.data?.meta.totalPages ?? 0;

  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const windowRows = useMemo(() => windowQuery.data ?? [], [windowQuery.data]);
  const overview = useMemo(
    () => buildBudgetOverview(categories, windowRows),
    [categories, windowRows],
  );

  const loading = transactionsQuery.isPending || categoriesQuery.isPending;
  const fetching = transactionsQuery.isFetching;
  const error = transactionsQuery.error
    ? errorMessage(transactionsQuery.error)
    : categoriesQuery.error
      ? errorMessage(categoriesQuery.error)
      : null;

  const createCategory = (input: BudgetCategoryInput) => createCategoryMutation.mutateAsync(input);

  const recordTransaction = (input: BudgetTransactionInput) =>
    recordTransactionMutation.mutateAsync(input);

  const updateTransaction = (id: string, input: BudgetTransactionStatusInput) =>
    updateTransactionMutation.mutateAsync({ id, input });

  const refreshData = () => {
    void invalidateFinance();
  };

  return {
    transactions,
    total,
    totalPages,
    loading,
    fetching,
    error,
    categories,
    overview,
    createCategory,
    recordTransaction,
    updateTransaction,
    refreshData,
  };
}
