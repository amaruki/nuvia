"use client";

import { useMutation } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";

import { BUDGET_TRANSACTIONS_API_PATH, BUDGETS_API_PATH } from "./constants";
import type {
  BudgetCategoryInput,
  BudgetCategoryRow,
  BudgetTransactionInput,
  BudgetTransactionRow,
  BudgetTransactionStatusInput,
} from "./types";

interface UseBudgetMutationsDeps {
  /** Invalidates the shared finance cache after a successful action. */
  invalidate: () => Promise<void>;
}

/**
 * Budget actions: create a category (POST /finance/budgets), record a
 * transaction (POST /finance/budget-transactions) and update a
 * transaction's status/notes (PATCH /finance/budget-transactions/:id).
 * All invalidate the finance query cache on success; the form sheets own
 * the success toast and the failure alert, so these stay silent.
 */
export function useBudgetMutations({ invalidate }: UseBudgetMutationsDeps) {
  const createCategoryMutation = useMutation({
    mutationFn: async (input: BudgetCategoryInput) => {
      const { data } = await apiFetch<{ category: BudgetCategoryRow }>(BUDGETS_API_PATH, {
        method: "POST",
        body: JSON.stringify(input),
      });
      return data.category;
    },
    onSuccess: () => {
      void invalidate();
    },
  });

  const recordTransactionMutation = useMutation({
    mutationFn: async (input: BudgetTransactionInput) => {
      const { data } = await apiFetch<{ transaction: BudgetTransactionRow }>(
        BUDGET_TRANSACTIONS_API_PATH,
        {
          method: "POST",
          body: JSON.stringify(input),
        },
      );
      return data.transaction;
    },
    onSuccess: () => {
      void invalidate();
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: BudgetTransactionStatusInput }) => {
      const { data } = await apiFetch<{ transaction: BudgetTransactionRow }>(
        `${BUDGET_TRANSACTIONS_API_PATH}/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify(input),
        },
      );
      return data.transaction;
    },
    onSuccess: () => {
      void invalidate();
    },
  });

  return { createCategoryMutation, recordTransactionMutation, updateTransactionMutation };
}
