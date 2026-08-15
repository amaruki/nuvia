"use client";

import { useMutation } from "@tanstack/react-query";

import { apiFetch } from "@/lib/api-client";

import { DONATIONS_API_PATH } from "./constants";
import type { DonationCreatePayload, DonationUpdatePayload, DonationWireRow } from "./types";

interface UseDonationMutationsDeps {
  /** Invalidates the shared finance cache after a successful action. */
  invalidate: () => Promise<void>;
}

/**
 * Donation actions: POST /finance/donations and PATCH /finance/donations/:id.
 * Toast-free by design — the form sheet reports success/failure inline and
 * the kebab status action supplies its own mutate callbacks, so no surface
 * double-toasts. Both invalidate the finance query cache on success.
 */
export function useDonationMutations({ invalidate }: UseDonationMutationsDeps) {
  const createDonationMutation = useMutation({
    mutationFn: async (input: DonationCreatePayload) => {
      const { data } = await apiFetch<{ donation: DonationWireRow }>(DONATIONS_API_PATH, {
        method: "POST",
        body: JSON.stringify(input),
      });
      return data.donation;
    },
    onSuccess: () => {
      void invalidate();
    },
  });

  const updateDonationMutation = useMutation({
    mutationFn: async ({ id, input }: { id: string; input: DonationUpdatePayload }) => {
      const { data } = await apiFetch<{ donation: DonationWireRow }>(
        `${DONATIONS_API_PATH}/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify(input),
        },
      );
      return data.donation;
    },
    onSuccess: () => {
      void invalidate();
    },
  });

  return { createDonationMutation, updateDonationMutation };
}
