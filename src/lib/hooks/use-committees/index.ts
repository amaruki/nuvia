"use client";

/**
 * D2: committees dashboard hook backed by the real committees API.
 *
 * Data comes from GET /api/v1/committees (server-side filtering; the full
 * dataset is drained page by page via fetchAllPages, UI-09 C3). Writes go
 * through the same resource: POST /api/v1/committees, PATCH/DELETE
 * /api/v1/committees/:id.
 *
 * The API serializes dates as ISO strings; `toCommitteeUi` converts them to
 * Date objects to satisfy the UI contract in src/types/committee/.
 * Statistics are computed client-side from the fetched committees — nothing
 * is invented.
 */

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import type { CommitteeFilterOptions } from "@/types/committee";

import { ApiClientError } from "@/lib/api-client";

import { computeStatistics } from "./committee-statistics";
import { COMMITTEES_QUERY_KEY } from "./constants";
import { useCommitteeMutations } from "./use-committee-mutations";
import { useCommitteesQuery } from "./use-committees-query";

export { toCommitteeUi } from "./hydrate-committee";
export type { WireCommittee } from "./types";

export function useCommittees() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<CommitteeFilterOptions>({});

  const listQuery = useCommitteesQuery(filters);

  const invalidateCommittees = () =>
    queryClient.invalidateQueries({ queryKey: COMMITTEES_QUERY_KEY });

  const { addCommittee, updateCommittee, deleteCommittee, toggleCommitteeStatus } =
    useCommitteeMutations({ invalidate: invalidateCommittees });

  const committees = useMemo(() => listQuery.data ?? [], [listQuery.data]);
  const statistics = useMemo(() => computeStatistics(committees), [committees]);

  return {
    // Data
    committees,
    statistics,
    loading: listQuery.isPending,
    error: listQuery.error
      ? listQuery.error instanceof ApiClientError
        ? listQuery.error.message
        : "Failed to fetch committees. Please try again."
      : null,
    filters,

    // Computed
    activeCommittees: useMemo(
      () => committees.filter((committee) => committee.status === "active"),
      [committees],
    ),
    inactiveCommittees: useMemo(
      () => committees.filter((committee) => committee.status === "inactive"),
      [committees],
    ),
    pendingCommittees: useMemo(
      () => committees.filter((committee) => committee.status === "pending"),
      [committees],
    ),

    // Actions
    updateFilters: (newFilters: Partial<CommitteeFilterOptions>) => {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    },
    clearFilters: () => setFilters({}),
    refreshData: invalidateCommittees,
    addCommittee,
    updateCommittee,
    deleteCommittee,
    toggleCommitteeStatus,
  };
}
