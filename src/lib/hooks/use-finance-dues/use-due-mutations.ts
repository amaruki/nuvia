"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { apiFetch, ApiClientError } from "@/lib/api-client";

import { INVOICES_API_PATH, PAYMENTS_API_PATH } from "./constants";
import type { RecordPaymentInput } from "./types";

interface UseDueMutationsDeps {
  /** Invalidates the shared finance cache after a successful action. */
  invalidate: () => Promise<void>;
}

/**
 * C3-backed dues actions: record a payment (POST /finance/payments) and
 * void an invoice (POST /finance/invoices/:id/void). Both invalidate the
 * finance query cache on success and surface API errors as toasts.
 */
export function useDueMutations({ invalidate }: UseDueMutationsDeps) {
  const recordPaymentMutation = useMutation({
    mutationFn: async (input: RecordPaymentInput) => {
      const { data } = await apiFetch<{ payment: unknown }>(PAYMENTS_API_PATH, {
        method: "POST",
        body: JSON.stringify({
          invoiceId: input.invoiceId,
          amount: input.amount.toFixed(2),
          paymentMethod: input.paymentMethod,
        }),
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Payment recorded");
      void invalidate();
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to record payment");
    },
  });

  const voidInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      const { data } = await apiFetch<{ invoice: unknown }>(
        `${INVOICES_API_PATH}/${invoiceId}/void`,
        {
          method: "POST",
          body: JSON.stringify({ reason: "Voided from the dues dashboard" }),
        },
      );
      return data;
    },
    onSuccess: () => {
      toast.success("Invoice voided");
      void invalidate();
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to void invoice");
    },
  });

  return { recordPaymentMutation, voidInvoiceMutation };
}
