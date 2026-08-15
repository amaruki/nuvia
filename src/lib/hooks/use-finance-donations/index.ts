"use client";

/**
 * Donations dashboard hook backed by the real donations store.
 *
 * The table list comes from GET /api/v1/finance/donations with real
 * page/limit params (URL-synced pagination). Statistics and the overview
 * cards use a bounded window of the newest STATISTICS_WINDOW_LIMIT rows —
 * the endpoint caps `limit` at 100 — so the cap is stated instead of
 * silent. Actions go through the landed endpoints:
 *   POST  /api/v1/finance/donations        — record a donation
 *   PATCH /api/v1/finance/donations/:id    — update status/notes/campaign
 *
 * Mutations stay toast-free: the form sheet reports success/failure inline
 * (§4.4) and the kebab status action supplies its own mutate callbacks.
 * There is no donation payments store yet — payment recording and receipt
 * delivery are not wired anywhere instead of pretending.
 */

import { useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { ApiClientError } from "@/lib/api-client";
import type { Donation } from "@/types/finance";

import { buildDonationStatistics } from "./build-donation-statistics";
import { FINANCE_QUERY_KEY } from "./constants";
import type {
  DonationCreatePayload,
  DonationUpdatePayload,
  UseFinanceDonationsOptions,
  UseFinanceDonationsReturn,
} from "./types";
import { useDonationMutations } from "./use-donation-mutations";
import { useDonationsQuery, useDonationsWindowQuery } from "./use-donation-queries";

function errorMessage(error: unknown): string {
  return error instanceof ApiClientError ? error.message : "Failed to load donations";
}

export function useFinanceDonations({
  page,
  pageSize,
}: UseFinanceDonationsOptions): UseFinanceDonationsReturn {
  const queryClient = useQueryClient();

  const donationsQuery = useDonationsQuery({ page, pageSize });
  const windowQuery = useDonationsWindowQuery();

  const invalidateFinance = () => queryClient.invalidateQueries({ queryKey: FINANCE_QUERY_KEY });

  const { createDonationMutation, updateDonationMutation } = useDonationMutations({
    invalidate: invalidateFinance,
  });

  const donations = useMemo(() => donationsQuery.data?.donations ?? [], [donationsQuery.data]);
  const total = donationsQuery.data?.meta.total ?? 0;
  const totalPages = donationsQuery.data?.meta.totalPages ?? 0;

  const statisticsRows = useMemo(() => windowQuery.data ?? [], [windowQuery.data]);
  const statistics = useMemo(() => buildDonationStatistics(statisticsRows), [statisticsRows]);

  const createDonation = async (input: DonationCreatePayload) => {
    await createDonationMutation.mutateAsync(input);
  };

  const updateDonation = async (id: string, input: DonationUpdatePayload) => {
    await updateDonationMutation.mutateAsync({ id, input });
  };

  const updateDonationStatus = (donationId: string, status: Donation["status"]) => {
    updateDonationMutation.mutate(
      { id: donationId, input: { status } },
      {
        onSuccess: () => toast.success("Donation status updated"),
        onError: (error) =>
          toast.error(
            error instanceof ApiClientError ? error.message : "Failed to update donation",
          ),
      },
    );
  };

  const refreshData = () => {
    void invalidateFinance();
  };

  return {
    donations,
    total,
    totalPages,
    loading: donationsQuery.isPending || windowQuery.isPending,
    fetching: donationsQuery.isFetching,
    error: donationsQuery.error
      ? errorMessage(donationsQuery.error)
      : windowQuery.error
        ? errorMessage(windowQuery.error)
        : null,
    statisticsRows,
    statistics,
    createDonation,
    updateDonation,
    updateDonationStatus,
    refreshData,
  };
}
