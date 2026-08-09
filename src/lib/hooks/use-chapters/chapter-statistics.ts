import type {
  Chapter,
  ChapterMonthlyTrend,
  ChapterOverallStatistics,
  ChapterPerformance,
  ChapterRegionalBreakdown,
  ChapterStatus,
} from "@/types/chapter.types";

// ---------------------------------------------------------------------------
// Client-side statistics (computed from the fetched chapters — never invented)
// ---------------------------------------------------------------------------

const round1 = (value: number): number => Math.round(value * 10) / 10;

export function computeChapterStatistics(chapters: Chapter[]): ChapterOverallStatistics {
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
