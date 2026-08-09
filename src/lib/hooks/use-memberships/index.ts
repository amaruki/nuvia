"use client";

/**
 * Membership directory hook — backlog B1 (Members on real data).
 *
 * Backed by the members API (`GET /api/v1/members`) instead of generated mock
 * data. The directory vocabulary is mapped onto real data:
 * - `MembershipStatus` (UI) <- derived member status per ADR-0014 (API),
 * - `MembershipTier`  (UI) <- subscription tier name / member role suffix.
 *
 * Fields with no backing column yet (location, company, committees, skills,
 * phone) stay empty. Filters for criteria the API does not support are
 * applied client-side, so they filter against those empty values until the
 * schema grows the columns.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";

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

  const query = useInfiniteQuery({
    queryKey: [
      "members-directory",
      debouncedSearch,
      memberStatusParams,
      sort.field,
      sort.direction,
      pageSize,
    ],
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams();
      params.set("page", String(pageParam));
      params.set("limit", String(pageSize));
      if (debouncedSearch) params.set("search", debouncedSearch);
      for (const status of memberStatusParams) params.append("memberStatus", status);
      params.set("sortBy", API_SORT_BY_FIELD[sort.field]);
      params.set("sortOrder", sort.direction);
      return fetchMembersPage(params);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.totalPages ? lastPage.meta.page + 1 : undefined,
  });

  const fetchedMembers = useMemo(
    () => (query.data?.pages ?? []).flatMap((page) => page.data.members).map(toMembershipProfile),
    [query.data],
  );

  // Client-side filters for criteria the members API does not support yet.
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

  const updateFilters = useCallback((newFilters: MembershipFilter) => {
    setFilters(newFilters);
  }, []);

  const updateSort = useCallback((newSort: MembershipSort) => {
    setSort(newSort);
  }, []);

  const loadMore = useCallback(() => {
    if (query.hasNextPage && !query.isFetchingNextPage) {
      void query.fetchNextPage();
    }
  }, [query.hasNextPage, query.isFetchingNextPage, query.fetchNextPage]);

  const refresh = useCallback(() => {
    void query.refetch();
  }, [query.refetch]);

  const reset = useCallback(() => {
    setFilters(initialFilters);
    setSort(initialSort);
  }, [initialFilters, initialSort]);

  return {
    members,
    isLoading: query.isLoading,
    error: query.error,
    total: query.data?.pages[0]?.meta.total ?? 0,
    hasMore: query.hasNextPage,
    filters,
    sort,
    page: query.data?.pages.length ?? 1,
    updateFilters,
    updateSort,
    loadMore,
    refresh,
    reset,
  };
}
