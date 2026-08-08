/**
 * Member directory queries — the paginated listing (whose derived-status
 * filter runs in SQL) and the member detail read.
 */

import { and, asc, count, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipSubscription, user } from "@/db/schema";
import { NotFoundError } from "@/lib/errors";
import { deriveMemberStatus } from "../membership-status.service";
import { SORT_COLUMNS, userColumns } from "./columns";
import {
  baseWhere,
  derivedMemberStatusSql,
  latestSubscriptionPerUser,
  latestSubscriptionsByUser,
  tierNamesByIds,
} from "./helpers";
import { toHistoryEntry, toListItem } from "./mappers";
import type { MemberDetail, MemberListParams, MemberListResult, MemberSortField } from "./types";

/**
 * Paginated member directory listing.
 *
 * Member status is derived, never stored (ADR-0014), but the derivation is a
 * pure function of the newest subscription row and `now`, so the status
 * filter is re-expressed in SQL (`derivedMemberStatusSql`): both paths push
 * filtering, sorting and paging into the database and derive status in JS
 * only for the returned page.
 */
export async function listMembers(params: MemberListParams): Promise<MemberListResult> {
  const page = Number.isFinite(params.page) ? Math.max(1, Math.floor(params.page)) : 1;
  const limit = Number.isFinite(params.limit)
    ? Math.min(100, Math.max(1, Math.floor(params.limit)))
    : 20;
  const sortBy: MemberSortField = params.sortBy ?? "createdAt";
  const sortOrder = params.sortOrder === "asc" ? "asc" : "desc";
  const where = baseWhere(params.search, params.roles);
  const now = new Date();

  if (params.memberStatuses && params.memberStatuses.length > 0) {
    // Filtering, sorting and paging all run in SQL here: the status
    // predicate is the derivation mirrored (derivedMemberStatusSql), so no
    // candidate rows beyond the page are shipped to the app.
    const latest = latestSubscriptionPerUser();
    const statusFilter = and(
      where,
      inArray(derivedMemberStatusSql(latest, now), params.memberStatuses),
    )!;
    const joinOn = eq(latest.userId, user.id);
    const direction = sortOrder === "asc" ? asc : desc;
    const [{ value: total }] = await db
      .select({ value: count() })
      .from(user)
      .leftJoin(latest, joinOn)
      .where(statusFilter);
    const rows = await db
      .select(userColumns)
      .from(user)
      .leftJoin(latest, joinOn)
      .where(statusFilter)
      .orderBy(direction(SORT_COLUMNS[sortBy]))
      .limit(limit)
      .offset((page - 1) * limit);
    const latestSubs = await latestSubscriptionsByUser(rows.map((row) => row.id));
    const tierNames = await tierNamesByIds([...latestSubs.values()].map((sub) => sub.tierId));
    return {
      members: rows.map((row) => toListItem(row, latestSubs.get(row.id) ?? null, tierNames, now)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  const [{ value: total }] = await db.select({ value: count() }).from(user).where(where);
  const direction = sortOrder === "asc" ? asc : desc;
  const rows = await db
    .select(userColumns)
    .from(user)
    .where(where)
    .orderBy(direction(SORT_COLUMNS[sortBy]))
    .limit(limit)
    .offset((page - 1) * limit);
  const latest = await latestSubscriptionsByUser(rows.map((row) => row.id));
  const tierNames = await tierNamesByIds([...latest.values()].map((sub) => sub.tierId));
  return {
    members: rows.map((row) => toListItem(row, latest.get(row.id) ?? null, tierNames, now)),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Member detail: user record, derived member status and full subscription
 * history (newest first). Throws NotFoundError for unknown or soft-deleted
 * users.
 */
export async function getMemberDetail(userId: string): Promise<MemberDetail> {
  const rows = await db
    .select(userColumns)
    .from(user)
    .where(and(eq(user.id, userId), isNull(user.deletedAt)));
  if (rows.length === 0) throw new NotFoundError("User", userId);
  const row = rows[0];

  const subs = await db
    .select()
    .from(membershipSubscription)
    .where(eq(membershipSubscription.userId, userId))
    .orderBy(desc(membershipSubscription.createdAt), desc(membershipSubscription.id));
  const tierNames = await tierNamesByIds(subs.map((sub) => sub.tierId));
  const subscriptionHistory = subs.map((sub) => toHistoryEntry(sub, tierNames));
  const newest = subs[0] ?? null;

  return {
    user: {
      id: row.id,
      username: row.username,
      email: row.email,
      name: row.name ?? "",
      firstName: row.firstName,
      lastName: row.lastName,
      image: row.image ?? row.profilePhoto,
      bio: row.bio,
      role: row.role,
      emailVerified: row.emailVerified,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    },
    memberStatus: deriveMemberStatus(
      newest
        ? {
            status: newest.status,
            currentPeriodEnd: newest.currentPeriodEnd,
            trialEnd: newest.trialEnd,
          }
        : null,
      new Date(),
    ),
    currentSubscription: subscriptionHistory[0] ?? null,
    subscriptionHistory,
  };
}
