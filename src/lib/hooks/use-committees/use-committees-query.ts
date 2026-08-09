"use client";

import { useQuery } from "@tanstack/react-query";

import type { CommitteeFilterOptions } from "@/types/committee";

import { fetchAllPages } from "../fetch-all-pages";

import { COMMITTEES_API_PATH, COMMITTEES_QUERY_KEY } from "./constants";
import { toCommitteeUi } from "./hydrate-committee";
import type { WireCommittee } from "./types";

/** Maps dashboard filters onto the committees list query params. */
export function committeesFilterParams(filters: CommitteeFilterOptions): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.status && filters.status.length > 0) params.set("status", filters.status.join(","));
  if (filters.type && filters.type.length > 0) params.set("type", filters.type.join(","));
  if (filters.authorityLevel && filters.authorityLevel.length > 0) {
    params.set("authorityLevel", filters.authorityLevel.join(","));
  }
  if (filters.leadershipRole && filters.leadershipRole.length > 0) {
    params.set("leadershipRole", filters.leadershipRole.join(","));
  }
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  if (filters.memberCountRange) {
    params.set("memberCountMin", String(filters.memberCountRange.min));
    params.set("memberCountMax", String(filters.memberCountRange.max));
  }
  return params;
}

/**
 * Committees list for the dashboard: drains every page (UI-09 C3, the old
 * single-page limit=100 cap is gone) with server-side filtering, then
 * hydrates the wire rows to UI dates.
 */
export function useCommitteesQuery(filters: CommitteeFilterOptions) {
  return useQuery({
    queryKey: [...COMMITTEES_QUERY_KEY, "full-list", filters],
    queryFn: async () => {
      const wires = await fetchAllPages<WireCommittee>(
        COMMITTEES_API_PATH,
        committeesFilterParams(filters),
      );
      return wires.map(toCommitteeUi);
    },
  });
}
