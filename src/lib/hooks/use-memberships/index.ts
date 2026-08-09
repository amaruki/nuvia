"use client";

/**
 * Membership directory hook — backlog B1 (Members on real data), UI-09 Tier A.
 *
 * Backed by the members API (`GET /api/v1/members`) with TRUE server-side
 * pagination: one page per query (`page`/`limit` params), no infinite
 * load-more accumulation. The directory vocabulary is mapped onto real data:
 * - `MembershipStatus` (UI) <- derived member status per ADR-0014 (API),
 * - `MembershipTier`  (UI) <- subscription tier name / member role suffix.
 *
 * Fields with no backing column yet (location, company, committees, skills,
 * phone) stay empty. Filters for criteria the API does not support are
 * applied client-side to the loaded page, so they filter against those
 * empty values until the schema grows the columns.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

import type { MembershipFilter, MembershipSort } from "@/types/membership.types";

import { API_SORT_BY_FIELD, UI_STATUS_TO_MEMBER_STATUSES } from "./constants";
import { toMembershipProfile } from "./hydrate-member";
import { fetchMembersPage } from "./members-api";
import type { UseMembershipsOptions, UseMembershipsReturn } from "./types";

export { fetchMembersPage } from "./members-api";
export type { MemberApiItem, MembersPage } from "./members-api";
export { useMembershipFilters } from "./use-membership-filters";

export function useMemberships({
  initialFilters = {},
  initialSort = { field: "name", direction: "asc" },
  pageSize = 12,
}: UseMembershipsOptions = {}): UseMembershipsReturn {
  const [filters, setFilters] = useState<MembershipFilter>(initialFilters);
  const [sort, setSort] = useState<MembershipSort>(initialSort);
  const [page, setPage] = useState(1);

  // Debounce the search box so typing does not fire a request per keystroke.
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search ?? "");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search ?? ""), 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const memberStatusParams = useMemo(
    () => [
      ...new Set(
        (filters.statuses ?? []).flatMap((status) => UI_STATUS_TO_MEMBER_STATUSES[status]),
      ),
    ],
    [filters.statuses],
  );

  const query = useQuery({
    queryKey: [
      "members-directory",
      debouncedSearch,
      memberStatusParams,
      sort.field,
      sort.direction,
      pageSize,
      page,
    ],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(pageSize));
      if (debouncedSearch) params.set("search", debouncedSearch);
      for (const status of memberStatusParams) params.append("memberStatus", status);
      params.set("sortBy", API_SORT_BY_FIELD[sort.field]);
      params.set("sortOrder", sort.direction);
      return fetchMembersPage(params);
    },
    placeholderData: keepPreviousData,
  });

  const fetchedMembers = useMemo(
    () => (query.data?.data.members ?? []).map(toMembershipProfile),
    [query.data],
  );

  // Client-side filters for criteria the members API does not support yet
  // (they apply to the loaded page, mirroring the previous behavior).
  const members = useMemo(() => {
    // Loop-invariant: lowercased location filters change with `filters`, not per member.
    const locationsLower = filters.locations?.map((location) => location.toLowerCase());
    return fetchedMembers.filter((member) => {
      if (filters.tiers?.length && !filters.tiers.includes(member.membershipTier)) return false;
      if (
        locationsLower?.length &&
        !locationsLower.some((location) => member.location.toLowerCase().includes(location))
      ) {
        return false;
      }
      if (
        filters.committees?.length &&
        !filters.committees.some((committee) => (member.committees ?? []).includes(committee))
      ) {
        return false;
      }
      if (
        filters.skills?.length &&
        !filters.skills.some((skill) => (member.skills ?? []).includes(skill))
      ) {
        return false;
      }
      return true;
    });
  }, [fetchedMembers, filters]);

  // Filter/sort changes always restart at page one; paging keeps the query.
  const updateFilters = useCallback((newFilters: MembershipFilter) => {
    setFilters(newFilters);
    setPage(1);
  }, []);

  const updateSort = useCallback((newSort: MembershipSort) => {
    setSort(newSort);
    setPage(1);
  }, []);

  const changePage = useCallback((nextPage: number) => {
    if (nextPage >= 1) setPage(nextPage);
  }, []);

  const refresh = useCallback(() => {
    void query.refetch();
  }, [query.refetch]);

  const reset = useCallback(() => {
    setFilters(initialFilters);
    setSort(initialSort);
    setPage(1);
  }, [initialFilters, initialSort]);

  const meta = query.data?.meta;

  return {
    members,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    total: meta?.total ?? 0,
    totalPages: meta?.totalPages ?? 1,
    page: meta?.page ?? page,
    pageSize,
    filters,
    sort,
    updateFilters,
    updateSort,
    setPage: changePage,
    refresh,
    reset,
  };
}
