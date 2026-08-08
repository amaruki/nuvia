"use client";

/**
 * Chapters dashboard hook — real API (backlog D1).
 *
 * Reads /api/v1/chapters through apiFetch (docs/api/conventions.md) and
 * keeps the exact surface the mock-era hook served the dashboard pages:
 * client-side filtering, derived statistics, and optimistic state updates
 * fed by the server's responses. Dates arrive as ISO strings over JSON and
 * are hydrated here, at the wire boundary.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import { logger } from "@/lib/logger";
import type {
  Chapter,
  ChapterFilterOptions,
  ChapterFormData,
  ChapterLeadership,
  ChapterMonthlyTrend,
  ChapterOverallStatistics,
  ChapterPerformance,
  ChapterRegionalBreakdown,
  ChapterStatus,
} from "@/types/chapter.types";

const round1 = (value: number): number => Math.round(value * 10) / 10;

// ---------------------------------------------------------------------------
// Wire-shape hydration
// ---------------------------------------------------------------------------

type RawLeadership = Omit<ChapterLeadership, "startDate" | "endDate"> & {
  startDate: string;
  endDate?: string | null;
};

type RawChapter = Omit<Chapter, "establishedDate" | "createdAt" | "updatedAt" | "leadership"> & {
  establishedDate: string;
  createdAt: string;
  updatedAt: string;
  leadership: RawLeadership[];
};

function toDate(value: string | null | undefined, fallback: Date): Date {
  if (!value) return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function hydrateChapter(raw: RawChapter): Chapter {
  const createdAt = toDate(raw.createdAt, new Date());
  return {
    ...raw,
    establishedDate: toDate(raw.establishedDate, createdAt),
    createdAt,
    updatedAt: toDate(raw.updatedAt, createdAt),
    leadership: (raw.leadership ?? []).map((leader) => ({
      ...leader,
      startDate: toDate(leader.startDate, createdAt),
      endDate: leader.endDate ? toDate(leader.endDate, createdAt) : undefined,
    })),
  };
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiClientError) return error.message;
  return fallback;
}

// ---------------------------------------------------------------------------
// Derived statistics (replaces the mock-era mockChapterStatistics)
// ---------------------------------------------------------------------------

function computeChapterStatistics(chapters: Chapter[]): ChapterOverallStatistics {
  const totalChapters = chapters.length;
  const countStatus = (status: ChapterStatus): number =>
    chapters.filter((chapter) => chapter.status === status).length;

  const totalMembers = chapters.reduce((sum, chapter) => sum + chapter.memberCount, 0);
  const totalEvents = chapters.reduce((sum, chapter) => sum + chapter.events.length, 0);
  const totalRevenue = chapters.reduce((sum, chapter) => sum + chapter.finances.totalRevenue, 0);
  const memberGrowthRate =
    totalChapters === 0
      ? 0
      : round1(
          chapters.reduce((sum, chapter) => sum + chapter.metrics.memberGrowthRate, 0) /
            totalChapters,
        );

  const topPerformingChapters: ChapterPerformance[] = chapters
    .map((chapter) => ({
      chapterId: chapter.id,
      chapterName: chapter.displayName,
      location: `${chapter.location.city}, ${chapter.location.state}`,
      memberCount: chapter.memberCount,
      growthRate: chapter.metrics.memberGrowthRate,
      eventCount: chapter.events.length,
      attendanceRate: chapter.metrics.eventAttendanceRate,
      revenue: chapter.finances.totalRevenue,
      engagementScore: chapter.metrics.engagementScore,
    }))
    .sort((a, b) => b.engagementScore - a.engagementScore || b.memberCount - a.memberCount);

  const byRegion = new Map<string, Chapter[]>();
  for (const chapter of chapters) {
    const key = chapter.location.region || "Unassigned";
    const bucket = byRegion.get(key);
    if (bucket) bucket.push(chapter);
    else byRegion.set(key, [chapter]);
  }
  const regionalBreakdown: ChapterRegionalBreakdown[] = [...byRegion.entries()].map(
    ([region, members]) => {
      const memberCount = members.reduce((sum, chapter) => sum + chapter.memberCount, 0);
      const countryCounts = new Map<string, number>();
      for (const chapter of members) {
        const country = chapter.location.country || "Unknown";
        countryCounts.set(country, (countryCounts.get(country) ?? 0) + 1);
      }
      const country = [...countryCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Unknown";
      return {
        region,
        country,
        chapterCount: members.length,
        memberCount,
        averageMembersPerChapter: round1(memberCount / members.length),
        totalRevenue: members.reduce((sum, chapter) => sum + chapter.finances.totalRevenue, 0),
      };
    },
  );

  const trendByMonth = new Map<
    string,
    Omit<ChapterMonthlyTrend, "attendanceRate"> & { attendanceTotal: number }
  >();
  for (const chapter of chapters) {
    for (const point of chapter.metrics.monthlyTrend) {
      const existing = trendByMonth.get(point.month);
      if (existing) {
        existing.memberCount += point.memberCount;
        existing.eventCount += point.eventCount;
        existing.attendanceTotal += point.attendanceRate;
        existing.revenue += point.revenue;
      } else {
        trendByMonth.set(point.month, {
          month: point.month,
          memberCount: point.memberCount,
          eventCount: point.eventCount,
          attendanceTotal: point.attendanceRate,
          revenue: point.revenue,
        });
      }
    }
  }
  const monthlyTrend: ChapterMonthlyTrend[] = [...trendByMonth.values()].map(
    ({ attendanceTotal, ...point }) => ({ ...point, attendanceRate: round1(attendanceTotal) }),
  );

  return {
    totalChapters,
    activeChapters: countStatus("active"),
    inactiveChapters: countStatus("inactive"),
    pendingChapters: countStatus("pending"),
    suspendedChapters: countStatus("suspended"),
    totalMembers,
    averageMembersPerChapter: totalChapters === 0 ? 0 : round1(totalMembers / totalChapters),
    totalEvents,
    totalRevenue,
    memberGrowthRate,
    topPerformingChapters,
    regionalBreakdown,
    monthlyTrend,
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useChapters() {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [statistics, setStatistics] = useState<ChapterOverallStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ChapterFilterOptions>({});

  const applyChapters = useCallback((next: Chapter[]) => {
    setChapters(next);
    setStatistics(computeChapterStatistics(next));
  }, []);

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      const envelope = await apiFetch<RawChapter[]>("/api/v1/chapters?page=1&limit=100");
      applyChapters((envelope.data ?? []).map(hydrateChapter));
      setError(null);
    } catch (err) {
      setError(toErrorMessage(err, "Failed to load chapter data"));
      logger.error("Error loading chapter data", err);
    } finally {
      setLoading(false);
    }
  }, [applyChapters]);

  useEffect(() => {
    void refreshData();
  }, [refreshData]);

  // Client-side filtering (the API accepts the same filters server-side).
  const filteredChapters = useMemo(() => {
    // Loop-invariant: the lowercased query depends on filters, not on the chapter.
    const searchLower = filters.search?.toLowerCase();
    return chapters.filter((chapter) => {
      if (filters.status && !filters.status.includes(chapter.status)) return false;
      if (filters.region && !filters.region.includes(chapter.location.region)) return false;
      if (filters.country && !filters.country.includes(chapter.location.country)) return false;
      if (filters.memberCountRange) {
        const { min, max } = filters.memberCountRange;
        if (chapter.memberCount < min || chapter.memberCount > max) return false;
      }
      if (filters.leadershipRole && filters.leadershipRole.length > 0) {
        const hasRole = chapter.leadership.some((leader) =>
          filters.leadershipRole!.includes(leader.role),
        );
        if (!hasRole) return false;
      }
      if (searchLower) {
        return (
          chapter.displayName.toLowerCase().includes(searchLower) ||
          chapter.name.toLowerCase().includes(searchLower) ||
          chapter.location.city.toLowerCase().includes(searchLower) ||
          chapter.location.state.toLowerCase().includes(searchLower) ||
          (chapter.description && chapter.description.toLowerCase().includes(searchLower))
        );
      }
      return true;
    });
  }, [chapters, filters]);

  const updateFilters = useCallback((newFilters: Partial<ChapterFilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const addChapter = useCallback(async (chapterData: ChapterFormData): Promise<Chapter> => {
    try {
      const envelope = await apiFetch<RawChapter>("/api/v1/chapters", {
        method: "POST",
        body: JSON.stringify(chapterData),
      });
      const created = hydrateChapter(envelope.data);
      setChapters((prev) => {
        const next = [...prev, created];
        setStatistics(computeChapterStatistics(next));
        return next;
      });
      return created;
    } catch (err) {
      setError(toErrorMessage(err, "Failed to add chapter"));
      logger.error("Error adding chapter", err);
      throw err;
    }
  }, []);

  const updateChapter = useCallback(
    async (id: string, chapterData: Partial<ChapterFormData>): Promise<void> => {
      try {
        const envelope = await apiFetch<RawChapter>(`/api/v1/chapters/${id}`, {
          method: "PATCH",
          body: JSON.stringify(chapterData),
        });
        const updated = hydrateChapter(envelope.data);
        setChapters((prev) => {
          const next = prev.map((chapter) => (chapter.id === id ? updated : chapter));
          setStatistics(computeChapterStatistics(next));
          return next;
        });
      } catch (err) {
        setError(toErrorMessage(err, "Failed to update chapter"));
        logger.error("Error updating chapter", err);
        throw err;
      }
    },
    [],
  );

  const deleteChapter = useCallback(async (id: string): Promise<void> => {
    try {
      await apiFetch<{ id: string; deleted: boolean }>(`/api/v1/chapters/${id}`, {
        method: "DELETE",
      });
      setChapters((prev) => {
        const next = prev.filter((chapter) => chapter.id !== id);
        setStatistics(computeChapterStatistics(next));
        return next;
      });
    } catch (err) {
      setError(toErrorMessage(err, "Failed to delete chapter"));
      logger.error("Error deleting chapter", err);
      throw err;
    }
  }, []);

  const toggleChapterStatus = useCallback(
    async (id: string, status: ChapterStatus): Promise<void> => {
      try {
        const envelope = await apiFetch<RawChapter>(`/api/v1/chapters/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ status }),
        });
        const updated = hydrateChapter(envelope.data);
        setChapters((prev) => {
          const next = prev.map((chapter) => (chapter.id === id ? updated : chapter));
          setStatistics(computeChapterStatistics(next));
          return next;
        });
      } catch (err) {
        setError(toErrorMessage(err, "Failed to update chapter status"));
        logger.error("Error toggling chapter status", err);
        throw err;
      }
    },
    [],
  );

  return {
    chapters: filteredChapters,
    statistics,
    loading,
    error,
    filters,
    updateFilters,
    clearFilters,
    refreshData,
    addChapter,
    updateChapter,
    deleteChapter,
    toggleChapterStatus,
  };
}
