"use client";

/**
 * D4: awards dashboard hooks backed by the real awards API.
 *
 * Data comes from GET /api/v1/awards/programs and GET
 * /api/v1/awards/nominations (server-side filtering and pagination). The
 * caller owns page/pageSize (via useDataTableState) and passes derived
 * filters; both hooks return the envelope meta (total, totalPages) so the
 * DataTable pagination footer reflects the server totals. The dashboard
 * list pages are read-only, so no mutations are exposed — writes stay on
 * the API surface until an award form lands.
 *
 * The API serializes dates as ISO strings; `toAwardProgramUi` /
 * `toAwardNominationUi` convert them to Date objects to satisfy the UI
 * contract in src/types/award.types.ts. Statistics are computed client-side
 * from the fetched rows — nothing is invented.
 */

import { useMemo } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import type {
  AwardCategory,
  AwardNomination,
  AwardNominationFilterOptions,
  AwardNominationOverallStatistics,
  AwardProgram,
  AwardProgramFilterOptions,
  AwardProgramOverallStatistics,
} from "@/types/award.types";

// ---------------------------------------------------------------------------
// Wire → UI mapping (ISO date strings → Date)
// ---------------------------------------------------------------------------

/** Wire shape returned by /api/v1/awards/programs: ISO date strings. */
export interface WireAwardProgram extends Omit<
  AwardProgram,
  "createdAt" | "updatedAt" | "openDate" | "closeDate" | "awardDate"
> {
  createdAt: string;
  updatedAt: string;
  openDate?: string;
  closeDate?: string;
  awardDate?: string;
}

/** Wire shape returned by /api/v1/awards/nominations: ISO date strings. */
export interface WireAwardNomination extends Omit<AwardNomination, "createdAt" | "updatedAt"> {
  createdAt: string;
  updatedAt: string;
}

/** ISO strings from the API parse to Date; unparseable values fall back to epoch. */
function parseDate(value: string): Date {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

function parseOptionalDate(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  return parseDate(value);
}

export function toAwardProgramUi(raw: WireAwardProgram): AwardProgram {
  return {
    ...raw,
    createdAt: parseDate(raw.createdAt),
    updatedAt: parseDate(raw.updatedAt),
    openDate: parseOptionalDate(raw.openDate),
    closeDate: parseOptionalDate(raw.closeDate),
    awardDate: parseOptionalDate(raw.awardDate),
  };
}

export function toAwardNominationUi(raw: WireAwardNomination): AwardNomination {
  return {
    ...raw,
    createdAt: parseDate(raw.createdAt),
    updatedAt: parseDate(raw.updatedAt),
  };
}

// ---------------------------------------------------------------------------
// Client-side statistics (computed from the fetched page — never invented)
// ---------------------------------------------------------------------------

function computeProgramStatistics(programs: AwardProgram[]): AwardProgramOverallStatistics {
  const countByStatus = (status: AwardProgram["status"]) =>
    programs.filter((program) => program.status === status).length;

  const categoryTotals: Partial<Record<AwardCategory, number>> = {};
  for (const program of programs) {
    categoryTotals[program.category] = (categoryTotals[program.category] ?? 0) + 1;
  }
  const categoryBreakdown = Object.entries(categoryTotals)
    .map(([category, count]) => ({ category: category as AwardCategory, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalPrograms: programs.length,
    openPrograms: countByStatus("open"),
    closedPrograms: countByStatus("closed"),
    draftPrograms: countByStatus("draft"),
    archivedPrograms: countByStatus("archived"),
    totalNominations: programs.reduce((sum, program) => sum + program.nominationCount, 0),
    categoryBreakdown,
  };
}

function computeNominationStatistics(
  nominations: AwardNomination[],
): AwardNominationOverallStatistics {
  const countByStatus = (status: AwardNomination["status"]) =>
    nominations.filter((nomination) => nomination.status === status).length;

  return {
    totalNominations: nominations.length,
    pending: countByStatus("pending"),
    underReview: countByStatus("under_review"),
    approved: countByStatus("approved"),
    rejected: countByStatus("rejected"),
  };
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function awardProgramsQueryPath(
  filters: AwardProgramFilterOptions,
  page: number,
  limit: number,
): string {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (filters.status && filters.status.length > 0) params.set("status", filters.status.join(","));
  if (filters.category && filters.category.length > 0) {
    params.set("category", filters.category.join(","));
  }
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  return `/api/v1/awards/programs?${params.toString()}`;
}

export interface UseAwardProgramsResult {
  programs: AwardProgram[];
  statistics: AwardProgramOverallStatistics;
  total: number;
  totalPages: number;
  loading: boolean;
  isFetching: boolean;
  error: string | null;
  refreshData: () => void;
}

export function useAwardPrograms(
  filters: AwardProgramFilterOptions,
  page: number,
  pageSize: number,
): UseAwardProgramsResult {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["awards", "programs", filters, page, pageSize],
    queryFn: () => apiFetch<WireAwardProgram[]>(awardProgramsQueryPath(filters, page, pageSize)),
    placeholderData: keepPreviousData,
  });

  const invalidatePrograms = () => queryClient.invalidateQueries({ queryKey: ["awards"] });

  const programs = useMemo(
    () => (listQuery.data?.data ?? []).map(toAwardProgramUi),
    [listQuery.data],
  );
  const statistics = useMemo(() => computeProgramStatistics(programs), [programs]);
  const meta = listQuery.data?.meta;

  return {
    programs,
    statistics,
    total: meta?.total ?? 0,
    totalPages: Math.max(1, meta?.totalPages ?? 1),
    loading: listQuery.isPending,
    isFetching: listQuery.isFetching,
    error: listQuery.error
      ? listQuery.error instanceof ApiClientError
        ? listQuery.error.message
        : "Failed to fetch award programs. Please try again."
      : null,
    refreshData: invalidatePrograms,
  };
}

function awardNominationsQueryPath(
  filters: AwardNominationFilterOptions,
  page: number,
  limit: number,
): string {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("limit", String(limit));
  if (filters.status && filters.status.length > 0) params.set("status", filters.status.join(","));
  if (filters.programId) params.set("programId", filters.programId);
  if (filters.search?.trim()) params.set("search", filters.search.trim());
  return `/api/v1/awards/nominations?${params.toString()}`;
}

export interface UseAwardNominationsResult {
  nominations: AwardNomination[];
  statistics: AwardNominationOverallStatistics;
  total: number;
  totalPages: number;
  loading: boolean;
  isFetching: boolean;
  error: string | null;
  refreshData: () => void;
}

export function useAwardNominations(
  filters: AwardNominationFilterOptions,
  page: number,
  pageSize: number,
): UseAwardNominationsResult {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: ["awards", "nominations", filters, page, pageSize],
    queryFn: () =>
      apiFetch<WireAwardNomination[]>(awardNominationsQueryPath(filters, page, pageSize)),
    placeholderData: keepPreviousData,
  });

  const invalidateNominations = () => queryClient.invalidateQueries({ queryKey: ["awards"] });

  const nominations = useMemo(
    () => (listQuery.data?.data ?? []).map(toAwardNominationUi),
    [listQuery.data],
  );
  const statistics = useMemo(() => computeNominationStatistics(nominations), [nominations]);
  const meta = listQuery.data?.meta;

  return {
    nominations,
    statistics,
    total: meta?.total ?? 0,
    totalPages: Math.max(1, meta?.totalPages ?? 1),
    loading: listQuery.isPending,
    isFetching: listQuery.isFetching,
    error: listQuery.error
      ? listQuery.error instanceof ApiClientError
        ? listQuery.error.message
        : "Failed to fetch nominations. Please try again."
      : null,
    refreshData: invalidateNominations,
  };
}
