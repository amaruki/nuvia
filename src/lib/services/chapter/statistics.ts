/**
 * Chapter statistics seam.
 *
 * The metrics/finances fields have no backing tables yet and render as
 * neutral defaults — the same staging pattern the event service uses for
 * not-yet-modeled fields. Real statistics queries land here once the
 * metrics/finance tables exist.
 */

import type { ChapterFinances, ChapterMetrics } from "@/types/chapter.types";

/** Neutral placeholder until the metrics tables land. */
export const NEUTRAL_METRICS: ChapterMetrics = {
  memberGrowthRate: 0,
  eventAttendanceRate: 0,
  financialHealth: "fair",
  engagementScore: 0,
  retentionRate: 0,
  newMembersThisMonth: 0,
  activeMembersThisMonth: 0,
  monthlyTrend: [],
};

/** Neutral placeholder until the finance tables land. */
export const NEUTRAL_FINANCES: ChapterFinances = {
  totalRevenue: 0,
  totalExpenses: 0,
  netIncome: 0,
  budget: 0,
  budgetUtilization: 0,
  monthlyRevenue: [],
  monthlyExpenses: [],
};
