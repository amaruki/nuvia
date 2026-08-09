/**
 * Member overview aggregates — counts of non-deleted users with status
 * derived from the newest subscription (ADR-0014), never stored.
 */

import { and, eq, gte, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { user } from "@/db/schema";
import { derivedMemberStatusSql, latestSubscriptionPerUser } from "../member/helpers";
import { startOfUtcMonth } from "./helpers";
import type { MemberOverviewStats } from "./types";

/**
 * Member counts for the overview. Each non-deleted user's derived status
 * (the SQL mirror of the ADR-0014 derivation on their newest subscription)
 * is scanned and bucketed in JS — the same aggregate style finance-report
 * uses. New-member buckets are UTC-month windows over users.createdAt.
 */
export async function getMemberOverviewStats(opts?: { now?: Date }): Promise<MemberOverviewStats> {
  const now = opts?.now ?? new Date();
  const monthStart = startOfUtcMonth(now);
  const lastMonthStart = new Date(
    Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() - 1, 1),
  );

  const latest = latestSubscriptionPerUser();
  const statusExpr = derivedMemberStatusSql(latest, now);

  const [memberStatuses, recentJoiners] = await Promise.all([
    db
      .select({ status: statusExpr })
      .from(user)
      .leftJoin(latest, eq(latest.userId, user.id))
      .where(isNull(user.deletedAt)),
    db
      .select({ createdAt: user.createdAt })
      .from(user)
      .where(and(isNull(user.deletedAt), gte(user.createdAt, lastMonthStart))),
  ]);

  let totalMembers = 0;
  let activeMembers = 0;
  let expiredMemberships = 0;
  for (const row of memberStatuses) {
    totalMembers += 1;
    if (row.status === "active" || row.status === "trialing") activeMembers += 1;
    if (row.status === "expired") expiredMemberships += 1;
  }

  let newMembersThisMonth = 0;
  let newMembersLastMonth = 0;
  for (const joiner of recentJoiners) {
    if (joiner.createdAt >= monthStart) newMembersThisMonth += 1;
    else if (joiner.createdAt >= lastMonthStart) newMembersLastMonth += 1;
  }

  return {
    totalMembers,
    activeMembers,
    newMembersThisMonth,
    newMembersLastMonth,
    expiredMemberships,
  };
}
