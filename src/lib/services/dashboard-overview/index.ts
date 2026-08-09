/**
 * Dashboard overview service (UI-01) — the real aggregates behind the
 * overview widgets, replacing the fake stats the dashboard shipped with.
 *
 * Members are counted with derived status (ADR-0014); money is
 * numeric(10,2) string amounts summed in minor units (ADR-0015 §5), reusing
 * the finance-report aggregates so the overview and the reports page agree.
 * There are deliberately no visitor/analytics aggregates: the schema tracks
 * none, and the dashboard renders an honest empty state instead.
 */

export type {
  DashboardOverview,
  EventOverviewStats,
  FinanceOverviewStats,
  MemberOverviewStats,
} from "./types";
export { changePercent, startOfUtcMonth } from "./helpers";
export { getMemberOverviewStats } from "./members";
export { getEventOverviewStats } from "./events";
export { getFinanceOverviewStats } from "./finance";

import { getEventOverviewStats } from "./events";
import { getFinanceOverviewStats } from "./finance";
import { getMemberOverviewStats } from "./members";
import type { DashboardOverview } from "./types";

/** One call for the overview route: every section, computed in parallel. */
export async function getDashboardOverview(opts?: { now?: Date }): Promise<DashboardOverview> {
  const [members, events, finance] = await Promise.all([
    getMemberOverviewStats(opts),
    getEventOverviewStats(opts),
    getFinanceOverviewStats(opts),
  ]);
  return { members, events, finance };
}
