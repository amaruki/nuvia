import type {
  Committee,
  CommitteeMonthlyTrend,
  CommitteeOverallStatistics,
  CommitteePerformance,
  CommitteeStatus,
  CommitteeType,
  CommitteeTypeBreakdown,
} from "@/types/committee";

// ---------------------------------------------------------------------------
// Client-side statistics (computed from the fetched page — never invented)
// ---------------------------------------------------------------------------

export function computeStatistics(committees: Committee[]): CommitteeOverallStatistics {
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
