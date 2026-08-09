"use client";

import { useQuery } from "@tanstack/react-query";

import type { CommitteeFilterOptions } from "@/types/committee";

import { apiFetch } from "@/lib/api-client";

import { COMMITTEES_API_PATH, COMMITTEES_PAGE_LIMIT, COMMITTEES_QUERY_KEY } from "./constants";
import { toCommitteeUi } from "./hydrate-committee";
import type { WireCommittee } from "./types";

/** Builds the filtered list URL; filters map to server-side query params. */
export function committeesQueryPath(filters: CommitteeFilterOptions): string {
  const params = new URLSearchParams({ limit: String(COMMITTEES_PAGE_LIMIT) });
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
  return `${COMMITTEES_API_PATH}?${params.toString()}`;
}

/**
 * Committees list for the dashboard: fetches a full page (limit 100) with
 * server-side filtering and hydrates the wire rows to UI dates.
 */
export function useCommitteesQuery(filters: CommitteeFilterOptions) {
  return useQuery({
    queryKey: [...COMMITTEES_QUERY_KEY, "list", filters],
    queryFn: async () => {
      const { data } = await apiFetch<WireCommittee[]>(committeesQueryPath(filters));
      return data.map(toCommitteeUi);
    },
  });
}
