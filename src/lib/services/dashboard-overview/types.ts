/**
 * Dashboard overview aggregate shapes (UI-01). Every figure here is computed
 * from live data — members via derived status (ADR-0014), money as
 * numeric(10,2) string amounts summed in minor units (ADR-0015).
 */

/** Member counts for the overview, derived live per ADR-0014. */
export interface MemberOverviewStats {
  /** Non-deleted users. */
  totalMembers: number;
  /** Derived status active + trialing. */
  activeMembers: number;
  /** Users created in the current UTC month. */
  newMembersThisMonth: number;
  /** Users created in the previous UTC month (trend baseline). */
  newMembersLastMonth: number;
  /** Derived status expired (lapsed newest subscription). */
  expiredMemberships: number;
}

/** Event counts for the overview. */
export interface EventOverviewStats {
  /** Every event row, all statuses. */
  totalEvents: number;
  /** Live-status events starting at or after now. */
  upcomingEvents: number;
  /** Upcoming events starting within the next 7 days. */
  eventsThisWeek: number;
}

/** Finance overview — money fields are numeric(10,2) string amounts. */
export interface FinanceOverviewStats {
  /** Sum of all COMPLETED transactions, all time. */
  totalRevenue: string;
  /** COMPLETED transactions in the current UTC month. */
  monthlyRevenue: string;
  /** COMPLETED transactions in the previous UTC month. */
  previousMonthRevenue: string;
  /** Percent change current vs previous month; null with no prior revenue. */
  monthlyRevenueChangePercent: number | null;
  /** Open balance on ISSUED invoices (totalAmount - paidAmount). */
  pendingPayments: string;
  /** Portion of pendingPayments past its due date. */
  overduePayments: string;
  /** ACTIVE subscriptions with a current (or open-ended) period. */
  activeSubscriptions: number;
  /** Subscriptions created in the current UTC month. */
  newSubscriptionsThisMonth: number;
  /** Subscriptions created in the previous UTC month. */
  newSubscriptionsLastMonth: number;
}

/** The full overview payload the dashboard route returns. */
export interface DashboardOverview {
  members: MemberOverviewStats;
  events: EventOverviewStats;
  finance: FinanceOverviewStats;
}
