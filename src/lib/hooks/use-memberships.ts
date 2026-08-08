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
import { z } from "zod";
import { MembershipStatus, MembershipTier } from "@/types/membership.types";
import type { MembershipFilter, MembershipProfile, MembershipSort } from "@/types/membership.types";

interface UseMembershipsOptions {
  initialFilters?: MembershipFilter;
  initialSort?: MembershipSort;
  pageSize?: number;
}

interface UseMembershipsReturn {
  members: MembershipProfile[];
  isLoading: boolean;
  error: Error | null;
  total: number;
  hasMore: boolean;
  filters: MembershipFilter;
  sort: MembershipSort;
  page: number;
  updateFilters: (filters: MembershipFilter) => void;
  updateSort: (sort: MembershipSort) => void;
  loadMore: () => void;
  refresh: () => void;
  reset: () => void;
}

/** JSON shape of a member row served by GET /api/v1/members — mirrors the
 * member service's `MemberListItem` (dates arrive as ISO strings). */
const memberApiItemSchema = z.object({
  id: z.string(),
  username: z.string(),
  email: z.string(),
  name: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  image: z.string().nullable(),
  bio: z.string().nullable(),
  role: z.string(),
  emailVerified: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  memberStatus: z.enum(["active", "trialing", "in_grace", "paused", "expired", "none"]),
  subscription: z
    .object({
      id: z.string(),
      status: z.string(),
      tierId: z.string().nullable(),
      tierName: z.string().nullable(),
      currentPeriodStart: z.string(),
      currentPeriodEnd: z.string().nullable(),
      cancelAtPeriodEnd: z.boolean(),
      createdAt: z.string(),
    })
    .nullable(),
});

export type MemberApiItem = z.infer<typeof memberApiItemSchema>;

const membersPageSchema = z.object({
  data: z.object({ members: z.array(memberApiItemSchema) }),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export type MembersPage = z.infer<typeof membersPageSchema>;

const problemSchema = z.object({
  detail: z.string().optional(),
  title: z.string().optional(),
});

/** Fetch and validate one page of the member directory. */
export async function fetchMembersPage(query: URLSearchParams): Promise<MembersPage> {
  const response = await fetch(`/api/v1/members?${query.toString()}`);
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const parsedProblem = problemSchema.safeParse(body);
    const message =
      (parsedProblem.success && (parsedProblem.data.detail ?? parsedProblem.data.title)) ||
      "Failed to load members";
    throw new Error(message);
  }
  return membersPageSchema.parse(body);
}

/**
 * Directory status (UI vocabulary) -> derived member statuses (API
 * vocabulary). A CANCELED subscription derives in_grace (paid through) or
 * expired, so both map onto it; ACTIVE covers every entitled derivation.
 */
const UI_STATUS_TO_MEMBER_STATUSES: Record<
  MembershipStatus,
  readonly MemberApiItem["memberStatus"][]
> = {
  [MembershipStatus.ACTIVE]: ["active", "trialing", "in_grace"],
  [MembershipStatus.EXPIRED]: ["expired"],
  [MembershipStatus.PENDING]: ["none"],
  [MembershipStatus.SUSPENDED]: ["paused"],
  [MembershipStatus.CANCELLED]: ["in_grace", "expired"],
};

const MEMBER_STATUS_TO_UI_STATUS: Record<MemberApiItem["memberStatus"], MembershipStatus> = {
  active: MembershipStatus.ACTIVE,
  trialing: MembershipStatus.ACTIVE,
  in_grace: MembershipStatus.ACTIVE,
  paused: MembershipStatus.SUSPENDED,
  expired: MembershipStatus.EXPIRED,
  none: MembershipStatus.PENDING,
};

/**
 * MembershipSort field -> API sortBy column. Fields with no real column yet
 * fall back to name ordering rather than faking a sort.
 */
const API_SORT_BY_FIELD: Record<MembershipSort["field"], string> = {
  name: "name",
  membershipStartDate: "createdAt",
  membershipEndDate: "name",
  membershipTier: "name",
  location: "name",
  company: "name",
};

/** Tier from the subscription's tier name, falling back to the member role
 * suffix (member_student -> student, etc.) and finally BASIC. */
function tierForMember(member: MemberApiItem): MembershipTier {
  switch (member.subscription?.tierName?.toLowerCase()) {
    case MembershipTier.PROFESSIONAL:
      return MembershipTier.PROFESSIONAL;
    case MembershipTier.CORPORATE:
      return MembershipTier.CORPORATE;
    case MembershipTier.STUDENT:
      return MembershipTier.STUDENT;
    case MembershipTier.VIP:
      return MembershipTier.VIP;
    case MembershipTier.PREMIUM:
      return MembershipTier.PREMIUM;
    case MembershipTier.BASIC:
      return MembershipTier.BASIC;
    default:
      break;
  }
  switch (member.role) {
    case "member_corporate":
      return MembershipTier.CORPORATE;
    case "member_professional":
      return MembershipTier.PROFESSIONAL;
    case "member_student":
      return MembershipTier.STUDENT;
    default:
      return MembershipTier.BASIC;
  }
}

function toMembershipProfile(member: MemberApiItem): MembershipProfile {
  const nameParts = member.name.split(" ");
  const sub = member.subscription;
  return {
    id: member.id,
    username: member.username,
    email: member.email,
    firstName: member.firstName ?? nameParts[0] ?? "",
    lastName: member.lastName ?? nameParts.slice(1).join(" "),
    avatar: member.image ?? undefined,
    profilePhoto: member.image ?? undefined,
    bio: member.bio ?? undefined,
    location: "", // no location column in the users schema yet
    membershipTier: tierForMember(member),
    membershipStatus: MEMBER_STATUS_TO_UI_STATUS[member.memberStatus],
    membershipStartDate: sub ? new Date(sub.currentPeriodStart) : new Date(member.createdAt),
    membershipEndDate: sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null,
    applicationDate: new Date(member.createdAt),
    lastRenewalDate: sub ? new Date(sub.createdAt) : undefined,
    memberId: `M-${member.id.replace(/-/g, "").slice(0, 6).toUpperCase()}`,
    joinDate: new Date(member.createdAt),
  };
}

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
  const members = useMemo(
    () =>
      fetchedMembers.filter((member) => {
        if (filters.tiers?.length && !filters.tiers.includes(member.membershipTier)) return false;
        if (
          filters.locations?.length &&
          !filters.locations.some((location) =>
            member.location.toLowerCase().includes(location.toLowerCase()),
          )
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
      }),
    [fetchedMembers, filters],
  );

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

// Helper hook for filter state management
export function useMembershipFilters(initialFilters: MembershipFilter = {}) {
  const [filters, setFilters] = useState<MembershipFilter>(initialFilters);

  const updateFilters = useCallback((newFilters: MembershipFilter) => {
    setFilters(newFilters);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const hasActiveFilters = useCallback(() => {
    return Object.keys(filters).some((key) => {
      const value = filters[key as keyof MembershipFilter];
      return (
        value !== undefined && value !== null && (Array.isArray(value) ? value.length > 0 : true)
      );
    });
  }, [filters]);

  return {
    filters,
    updateFilters,
    clearFilters,
    hasActiveFilters: hasActiveFilters(),
  };
}
