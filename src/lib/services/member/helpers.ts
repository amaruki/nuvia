/**
 * Query-building and batch-loading helpers for the member directory — the
 * shared WHERE clause, the newest-subscription-per-user subquery with its
 * SQL mirror of the A3 status derivation (ADR-0014), and the two per-page
 * batch loads (newest subscriptions, tier display names).
 */

import { and, asc, desc, ilike, inArray, isNull, or, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { db } from "@/db/client";
import {
  membershipSubscription,
  membershipTier,
  user,
  type MembershipSubscription,
} from "@/db/schema";
import { PAST_DUE_GRACE_DAYS, type MemberStatus } from "../membership-status.service";

/** Shared WHERE clause: not soft-deleted, plus optional search/role filters. */
export function baseWhere(search?: string, roles?: string[]) {
  const clauses = [isNull(user.deletedAt)];
  if (search) {
    clauses.push(
      or(
        ilike(user.name, `%${search}%`),
        ilike(user.username, `%${search}%`),
        ilike(user.email, `%${search}%`),
      )!,
    );
  }
  if (roles && roles.length > 0) {
    clauses.push(inArray(user.role, roles));
  }
  return and(...clauses)!;
}

/**
 * The newest subscription per user as an SQL subquery — the same "newest row
 * governs" selection ADR-0014 and `latestSubscriptionsByUser` use (createdAt
 * desc, id tiebreak), carrying only the columns the derivation reads.
 */
export function latestSubscriptionPerUser() {
  return db
    .selectDistinctOn([membershipSubscription.userId], {
      userId: membershipSubscription.userId,
      status: membershipSubscription.status,
      currentPeriodEnd: membershipSubscription.currentPeriodEnd,
      trialEnd: membershipSubscription.trialEnd,
    })
    .from(membershipSubscription)
    .orderBy(
      asc(membershipSubscription.userId),
      desc(membershipSubscription.createdAt),
      desc(membershipSubscription.id),
    )
    .as("latest_subscription");
}

/** The `latestSubscriptionPerUser` fields the status derivation reads. */
export interface LatestSubscriptionColumns {
  userId: AnyPgColumn;
  status: AnyPgColumn;
  currentPeriodEnd: AnyPgColumn;
  trialEnd: AnyPgColumn;
}

/**
 * SQL mirror of `deriveMemberStatus` (ADR-0014): member status is derived,
 * never stored, so a status filter must re-express the derivation to run in
 * the database. Must stay in lockstep with the pure function — same snapshot
 * columns, same comparisons, same `PAST_DUE_GRACE_DAYS` window. `now` is
 * bound as a parameter so the SQL filter and the JS derivation on the
 * returned page evaluate the same instant. The status column is the closed
 * `MembershipStatus` enum, so the trailing `else` only collects the expired
 * outcomes.
 */
export function derivedMemberStatusSql(
  latest: LatestSubscriptionColumns,
  now: Date,
): SQL<MemberStatus> {
  const trialAnchor = sql`coalesce(${latest.trialEnd}, ${latest.currentPeriodEnd})`;
  const graceEnd = sql`${latest.currentPeriodEnd} + ${PAST_DUE_GRACE_DAYS} * interval '1 day'`;
  // postgres.js rejects a raw Date parameter here, so bind the same instant
  // as ISO text; the untyped parameter resolves against the timestamptz side.
  const nowIso = now.toISOString();
  return sql<MemberStatus>`
    case
      when ${latest.userId} is null then 'none'
      when ${latest.status} = 'ACTIVE' and (${latest.currentPeriodEnd} is null or ${nowIso} <= ${latest.currentPeriodEnd}) then 'active'
      when ${latest.status} = 'TRIALING' and (${trialAnchor} is null or ${nowIso} <= ${trialAnchor}) then 'trialing'
      when ${latest.status} = 'CANCELED' and ${latest.currentPeriodEnd} is not null and ${nowIso} <= ${latest.currentPeriodEnd} then 'in_grace'
      when ${latest.status} = 'PAST_DUE' and (${latest.currentPeriodEnd} is null or ${nowIso} <= ${graceEnd}) then 'in_grace'
      when ${latest.status} = 'PAUSED' then 'paused'
      when ${latest.status} = 'PENDING_PAYMENT' then 'none'
      else 'expired'
    end
  `;
}

/**
 * The newest subscription per user (ordered by createdAt, id as tiebreak),
 * keyed by userId — one query per page of users.
 */
export async function latestSubscriptionsByUser(userIds: string[]) {
  const map = new Map<string, MembershipSubscription>();
  if (userIds.length === 0) return map;
  const rows = await db
    .select()
    .from(membershipSubscription)
    .where(inArray(membershipSubscription.userId, userIds))
    .orderBy(desc(membershipSubscription.createdAt), desc(membershipSubscription.id));
  for (const row of rows) {
    if (!map.has(row.userId)) map.set(row.userId, row);
  }
  return map;
}

/** tier id -> tier display name, one query for the page's tiers. */
export async function tierNamesByIds(tierIds: Array<string | null>) {
  const ids = [...new Set(tierIds.filter((id): id is string => id !== null))];
  const map = new Map<string, string>();
  if (ids.length === 0) return map;
  const rows = await db
    .select({ id: membershipTier.id, name: membershipTier.name })
    .from(membershipTier)
    .where(inArray(membershipTier.id, ids));
  for (const row of rows) map.set(row.id, row.name);
  return map;
}
