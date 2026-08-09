/**
 * Membership analytics aggregates (UI-23), read-only.
 *
 * Member status is never stored — it is derived from the latest
 * subscription per user (ADR-0014) — so this read reuses the exact same SQL
 * derivation the member directory uses (derivedMemberStatusSql). Growth is
 * bucketed by UTC calendar month over `user.created_at` for the trailing
 * twelve months; tier distribution counts ACTIVE subscriptions grouped by
 * tier. No row here is scored, predicted, or invented.
 */

import { and, count, eq, gte, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipSubscription, user } from "@/db/schema";
import { derivedMemberStatusSql, latestSubscriptionPerUser } from "@/lib/services/member/helpers";
import type { MemberStatus } from "@/lib/services/membership-status.service";

/** 12 calendar months including the current one. */
export const GROWTH_WINDOW_MONTHS = 12;

/** Every derived status, in display order. */
const MEMBER_STATUSES = ["active", "trialing", "in_grace", "paused", "expired", "none"] as const;

export interface MonthlyGrowthPoint {
  /** "YYYY-MM" UTC calendar month. */
  month: string;
  newMembers: number;
}

export interface TierSlice {
  tierId: string;
  tierName: string;
  tierLabel: string;
  activeSubscriptions: number;
}

export interface MembershipAnalytics {
  statusCounts: Record<MemberStatus, number>;
  /** All non-deleted accounts (the denominator for the status breakdown). */
  totalAccounts: number;
  monthlyGrowth: MonthlyGrowthPoint[];
  tierDistribution: TierSlice[];
  totalActiveSubscriptions: number;
}

export async function getMembershipAnalytics(now: Date = new Date()): Promise<MembershipAnalytics> {
  const windowStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (GROWTH_WINDOW_MONTHS - 1), 1),
  );
  const latest = latestSubscriptionPerUser();
  const statusExpr = derivedMemberStatusSql(latest, now);

  const [statusRows, createdRows, activePerTierRows, activeTotalRows, tierRows] = await Promise.all(
    [
      db
        .select({ status: statusExpr })
        .from(user)
        .where(isNull(user.deletedAt))
        .leftJoin(latest, eq(user.id, latest.userId)),
      db
        .select({ createdAt: user.createdAt })
        .from(user)
        .where(and(isNull(user.deletedAt), gte(user.createdAt, windowStart))),
      db
        .select({
          tierId: membershipSubscription.tierId,
          n: count(),
        })
        .from(membershipSubscription)
        .where(eq(membershipSubscription.status, "ACTIVE"))
        .groupBy(membershipSubscription.tierId),
      db
        .select({ n: count() })
        .from(membershipSubscription)
        .where(eq(membershipSubscription.status, "ACTIVE")),
      db.query.membershipTier.findMany(),
    ],
  );

  const statusCounts = Object.fromEntries(MEMBER_STATUSES.map((status) => [status, 0])) as Record<
    MemberStatus,
    number
  >;
  for (const row of statusRows) {
    if ((MEMBER_STATUSES as readonly string[]).includes(row.status)) {
      statusCounts[row.status as MemberStatus] += 1;
    }
  }

  // Bucket by UTC month in JS — same approach as the main dashboard's
  // signups card, which keeps month boundaries unambiguous across
  // timestamptz rows.
  const growthByMonth = new Map<string, number>();
  for (const row of createdRows) {
    const key = `${row.createdAt.getUTCFullYear()}-${String(row.createdAt.getUTCMonth() + 1).padStart(2, "0")}`;
    growthByMonth.set(key, (growthByMonth.get(key) ?? 0) + 1);
  }
  const monthlyGrowth: MonthlyGrowthPoint[] = [];
  for (let i = GROWTH_WINDOW_MONTHS - 1; i >= 0; i--) {
    const monthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const key = `${monthDate.getUTCFullYear()}-${String(monthDate.getUTCMonth() + 1).padStart(2, "0")}`;
    monthlyGrowth.push({ month: key, newMembers: growthByMonth.get(key) ?? 0 });
  }

  const activeByTier = new Map(activePerTierRows.map((row) => [row.tierId, row.n]));
  const tierDistribution: TierSlice[] = tierRows
    .map((tier) => ({
      tierId: tier.id,
      tierName: tier.name,
      tierLabel: tier.displayName ?? tier.name,
      activeSubscriptions: activeByTier.get(tier.id) ?? 0,
    }))
    .sort(
      (a, b) =>
        b.activeSubscriptions - a.activeSubscriptions || a.tierName.localeCompare(b.tierName),
    );

  return {
    statusCounts,
    totalAccounts: statusRows.length,
    monthlyGrowth,
    tierDistribution,
    totalActiveSubscriptions: activeTotalRows[0]?.n ?? 0,
  };
}
