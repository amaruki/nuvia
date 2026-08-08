"use client";

/**
 * D2: committees dashboard hook backed by the real committees API.
 *
 * Data comes from GET /api/v1/committees (server-side filtering, paginated;
 * the dashboard pulls a full page of 100). Writes go through the same
 * resource: POST /api/v1/committees, PATCH/DELETE /api/v1/committees/:id.
 *
 * The API serializes dates as ISO strings; `toCommitteeUi` converts them to
 * Date objects to satisfy the UI contract in src/types/committee/.
 * Statistics are computed client-side from the fetched committees — nothing
 * is invented.
 */

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import type {
  Committee,
  CommitteeActionItem,
  CommitteeCharter,
  CommitteeFilterOptions,
  CommitteeFormData,
  CommitteeLeadership,
  CommitteeMeeting,
  CommitteeMember,
  CommitteeMonthlyTrend,
  CommitteeOverallStatistics,
  CommitteePerformance,
  CommitteeStatus,
  CommitteeType,
  CommitteeTypeBreakdown,
} from "@/types/committee";

// ---------------------------------------------------------------------------
// Wire → UI mapping (ISO date strings → Date)
// ---------------------------------------------------------------------------

/** Wire shape returned by /api/v1/committees: Committee with ISO date strings. */
export interface WireCommittee extends Omit<
  Committee,
  "createdAt" | "updatedAt" | "charter" | "leadership" | "members" | "meetings"
> {
  createdAt: string;
  updatedAt: string;
  charter: Omit<CommitteeCharter, "approvalDate" | "lastReviewed" | "nextReview"> & {
    approvalDate: string;
    lastReviewed: string;
    nextReview: string;
  };
  leadership: (Omit<CommitteeLeadership, "startDate" | "endDate"> & {
    startDate: string;
    endDate?: string;
  })[];
  members: (Omit<CommitteeMember, "joinDate" | "endDate"> & {
    joinDate: string;
    endDate?: string;
  })[];
  meetings: (Omit<CommitteeMeeting, "date" | "actionItems"> & {
    date: string;
    actionItems?: (Omit<CommitteeActionItem, "dueDate"> & { dueDate: string })[];
  })[];
}

/** ISO strings from the API parse to Date; unparseable values fall back to epoch. */
function parseDate(value: string): Date {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date(0) : parsed;
}

export function toCommitteeUi(raw: WireCommittee): Committee {
  return {
    ...raw,
    createdAt: parseDate(raw.createdAt),
    updatedAt: parseDate(raw.updatedAt),
    charter: {
      ...raw.charter,
      approvalDate: parseDate(raw.charter.approvalDate),
      lastReviewed: parseDate(raw.charter.lastReviewed),
      nextReview: parseDate(raw.charter.nextReview),
    },
    leadership: raw.leadership.map(({ startDate, endDate, ...rest }) => ({
      ...rest,
      startDate: parseDate(startDate),
      ...(endDate ? { endDate: parseDate(endDate) } : {}),
    })),
    members: raw.members.map(({ joinDate, endDate, ...rest }) => ({
      ...rest,
      joinDate: parseDate(joinDate),
      ...(endDate ? { endDate: parseDate(endDate) } : {}),
    })),
    meetings: raw.meetings.map(({ date, actionItems, ...rest }) => ({
      ...rest,
      date: parseDate(date),
      ...(actionItems
        ? {
            actionItems: actionItems.map(({ dueDate, ...itemRest }) => ({
              ...itemRest,
              dueDate: parseDate(dueDate),
            })),
          }
        : {}),
    })),
  };
}

// ---------------------------------------------------------------------------
// Client-side statistics (computed from the fetched page — never invented)
// ---------------------------------------------------------------------------

function computeStatistics(committees: Committee[]): CommitteeOverallStatistics {
  const totalCommittees = committees.length;
  const countByStatus = (status: CommitteeStatus) =>
    committees.filter((c) => c.status === status).length;

  const totalMembers = committees.reduce((sum, c) => sum + c.metrics.memberCount, 0);
  const totalMeetings = committees.reduce((sum, c) => sum + c.meetings.length, 0);
  const totalDeliverables = committees.reduce((sum, c) => sum + c.metrics.deliverablesCount, 0);
  const goalCompletionRate =
    totalCommittees === 0
      ? 0
      : committees.reduce((sum, c) => sum + c.metrics.goalCompletionRate, 0) / totalCommittees;

  const topPerformingCommittees: CommitteePerformance[] = [...committees]
    .sort((a, b) => b.metrics.impactScore - a.metrics.impactScore)
    .map((c) => ({
      committeeId: c.id,
      committeeName: c.displayName,
      type: c.type,
      memberCount: c.metrics.memberCount,
      meetingAttendanceRate: c.metrics.meetingAttendanceRate,
      goalCompletionRate: c.metrics.goalCompletionRate,
      deliverablesCount: c.metrics.deliverablesCount,
      impactScore: c.metrics.impactScore,
      satisfactionScore: c.metrics.satisfactionScore,
    }));

  const byType = new Map<CommitteeType, Committee[]>();
  for (const c of committees) {
    const list = byType.get(c.type) ?? [];
    list.push(c);
    byType.set(c.type, list);
  }
  const typeBreakdown: CommitteeTypeBreakdown[] = [...byType.entries()].map(([type, list]) => {
    const memberCount = list.reduce((sum, c) => sum + c.metrics.memberCount, 0);
    return {
      type,
      committeeCount: list.length,
      memberCount,
      averageMembersPerCommittee: memberCount / list.length,
      totalDeliverables: list.reduce((sum, c) => sum + c.metrics.deliverablesCount, 0),
      averageImpactScore: list.reduce((sum, c) => sum + c.metrics.impactScore, 0) / list.length,
    };
  });

  return {
    totalCommittees,
    activeCommittees: countByStatus("active"),
    inactiveCommittees: countByStatus("inactive"),
    pendingCommittees: countByStatus("pending"),
    suspendedCommittees: countByStatus("suspended"),
    totalMembers,
    averageMembersPerCommittee: totalCommittees === 0 ? 0 : totalMembers / totalCommittees,
    totalMeetings,
    totalDeliverables,
    goalCompletionRate,
    topPerformingCommittees,
    typeBreakdown,
    monthlyTrend: aggregateMonthlyTrend(committees),
  };
}

/** Sums each committee's monthly trend into one series, sorted by month key. */
function aggregateMonthlyTrend(committees: Committee[]): CommitteeMonthlyTrend[] {
  const byMonth = new Map<
    string,
    {
      memberCount: number;
      meetingCount: number;
      attendanceRates: number[];
      goalsCompleted: number;
      deliverablesCompleted: number;
    }
  >();
  for (const committee of committees) {
    for (const trend of committee.metrics.monthlyTrend) {
      const bucket = byMonth.get(trend.month) ?? {
        memberCount: 0,
        meetingCount: 0,
        attendanceRates: [],
        goalsCompleted: 0,
        deliverablesCompleted: 0,
      };
      bucket.memberCount += trend.memberCount;
      bucket.meetingCount += trend.meetingCount;
      bucket.attendanceRates.push(trend.attendanceRate);
      bucket.goalsCompleted += trend.goalsCompleted;
      bucket.deliverablesCompleted += trend.deliverablesCompleted;
      byMonth.set(trend.month, bucket);
    }
  }
  return [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, bucket]) => ({
      month,
      memberCount: bucket.memberCount,
      meetingCount: bucket.meetingCount,
      attendanceRate:
        bucket.attendanceRates.length === 0
          ? 0
          : bucket.attendanceRates.reduce((sum, rate) => sum + rate, 0) /
            bucket.attendanceRates.length,
      goalsCompleted: bucket.goalsCompleted,
      deliverablesCompleted: bucket.deliverablesCompleted,
    }));
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

function committeesQueryPath(filters: CommitteeFilterOptions): string {
  const params = new URLSearchParams({ limit: "100" });
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
  return `/api/v1/committees?${params.toString()}`;
}

export function useCommittees() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<CommitteeFilterOptions>({});

  const listQuery = useQuery({
    queryKey: ["committees", "list", filters],
    queryFn: async () => {
      const { data } = await apiFetch<WireCommittee[]>(committeesQueryPath(filters));
      return data.map(toCommitteeUi);
    },
  });

  const invalidateCommittees = () => queryClient.invalidateQueries({ queryKey: ["committees"] });

  const createMutation = useMutation({
    mutationFn: async (input: CommitteeFormData) => {
      const { data } = await apiFetch<WireCommittee>("/api/v1/committees", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return toCommitteeUi(data);
    },
    onSuccess: () => {
      toast.success("Committee created");
      invalidateCommittees();
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to create committee");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CommitteeFormData> }) => {
      const { data } = await apiFetch<WireCommittee>(`/api/v1/committees/${id}`, {
        method: "PATCH",
        body: JSON.stringify(updates),
      });
      return toCommitteeUi(data);
    },
    onSuccess: () => {
      toast.success("Committee updated");
      invalidateCommittees();
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to update committee");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/v1/committees/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      toast.success("Committee deleted");
      invalidateCommittees();
    },
    onError: (error) => {
      toast.error(error instanceof ApiClientError ? error.message : "Failed to delete committee");
    },
  });

  const committees = useMemo(() => listQuery.data ?? [], [listQuery.data]);
  const statistics = useMemo(() => computeStatistics(committees), [committees]);

  const addCommittee = async (data: CommitteeFormData) => {
    await createMutation.mutateAsync(data);
  };

  const updateCommittee = async (id: string, updates: Partial<CommitteeFormData>) => {
    await updateMutation.mutateAsync({ id, updates });
  };

  const deleteCommittee = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const toggleCommitteeStatus = async (id: string, status: "active" | "inactive") => {
    await updateMutation.mutateAsync({ id, updates: { status } });
  };

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
