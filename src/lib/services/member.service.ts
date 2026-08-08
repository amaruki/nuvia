/**
 * Member directory service — backlog B1 (Members on real data).
 *
 * Serves the member directory API (`/api/v1/members`) from the database:
 * users joined with their newest `membership_subscription`, with the member
 * status derived through the A3 derivation (ADR-0014). This service IMPORTS
 * `deriveMemberStatus` and never re-derives status ad hoc.
 *
 * Permission mapping (authoritative note lives on the routes):
 * - list   -> `memberships:read` (membership-flavored directory listing)
 * - detail -> `users:read` (item exposes user-management data plus
 *   subscription history)
 */

import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  or,
} from "drizzle-orm";
import { db } from "@/db/client";
import {
  membershipSubscription,
  membershipTier,
  user,
  type MembershipSubscription,
  type User,
} from "@/db/schema";
import { NotFoundError } from "@/lib/errors";
import {
  deriveMemberStatus,
  type MemberStatus,
} from "./membership-status.service";

/** Columns this service reads from the users table. */
const userColumns = {
  id: user.id,
  username: user.username,
  email: user.email,
  name: user.name,
  firstName: user.firstName,
  lastName: user.lastName,
  image: user.image,
  profilePhoto: user.profilePhoto,
  bio: user.bio,
  role: user.role,
  emailVerified: user.emailVerified,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
};
/** The subset of user columns this service selects. */
type UserRow = Pick<
  User,
  | "id"
  | "username"
  | "email"
  | "name"
  | "firstName"
  | "lastName"
  | "image"
  | "profilePhoto"
  | "bio"
  | "role"
  | "emailVerified"
  | "createdAt"
  | "updatedAt"
>;

/** Sort fields the member listing understands. */
const SORT_COLUMNS = {
  name: user.name,
  username: user.username,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
} as const;

export type MemberSortField = keyof typeof SORT_COLUMNS;

export interface MemberListParams {
  page: number;
  limit: number;
  /** Case-insensitive fragment match over name, username and email. */
  search?: string;
  /** User-role filter (repeatable). */
  roles?: string[];
  /** Derived member-status filter (repeatable). */
  memberStatuses?: MemberStatus[];
  sortBy?: MemberSortField;
  sortOrder?: "asc" | "desc";
}

/** Latest subscription of a member as exposed by the directory listing. */
export interface MemberSubscriptionSummary {
  id: string;
  status: MembershipSubscription["status"];
  tierId: string | null;
  tierName: string | null;
  currentPeriodStart: Date;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
}

export interface MemberListItem {
  id: string;
  username: string;
  email: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  image: string | null;
  role: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  /** Derived — see ADR-0014 / `deriveMemberStatus`. Never stored. */
  memberStatus: MemberStatus;
  /** The user's newest subscription, or null when they never had one. */
  subscription: MemberSubscriptionSummary | null;
}

export interface MemberListResult {
  members: MemberListItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** One subscription row as exposed by the member detail endpoint. */
export interface SubscriptionHistoryEntry {
  id: string;
  status: MembershipSubscription["status"];
  tierId: string | null;
  tierName: string | null;
  currentPeriodStart: Date;
  currentPeriodEnd: Date | null;
  trialStart: Date | null;
  trialEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  createdAt: Date;
}

export interface MemberDetailUser {
  id: string;
  username: string;
  email: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  image: string | null;
  bio: string | null;
  role: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MemberDetail {
  user: MemberDetailUser;
  /** Derived — see ADR-0014 / `deriveMemberStatus`. Never stored. */
  memberStatus: MemberStatus;
  /** The newest subscription, or null when the user never had one. */
  currentSubscription: SubscriptionHistoryEntry | null;
  /** All subscriptions, newest first. */
  subscriptionHistory: SubscriptionHistoryEntry[];
}

/** Shared WHERE clause: not soft-deleted, plus optional search/role filters. */
function baseWhere(search?: string, roles?: string[]) {
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
 * The newest subscription per user (ordered by createdAt, id as tiebreak),
 * keyed by userId — one query per page of users.
 */
async function latestSubscriptionsByUser(userIds: string[]) {
  const map = new Map<string, MembershipSubscription>();
  if (userIds.length === 0) return map;
  const rows = await db
    .select()
    .from(membershipSubscription)
    .where(inArray(membershipSubscription.userId, userIds))
    .orderBy(
      desc(membershipSubscription.createdAt),
      desc(membershipSubscription.id),
    );
  for (const row of rows) {
    if (!map.has(row.userId)) map.set(row.userId, row);
  }
  return map;
}

/** tier id -> tier display name, one query for the page's tiers. */
async function tierNamesByIds(tierIds: Array<string | null>) {
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

function toSubscriptionSummary(
  sub: MembershipSubscription,
  tierNames: Map<string, string>,
): MemberSubscriptionSummary {
  return {
    id: sub.id,
    status: sub.status,
    tierId: sub.tierId,
    tierName: sub.tierId ? (tierNames.get(sub.tierId) ?? null) : null,
    currentPeriodStart: sub.currentPeriodStart,
    currentPeriodEnd: sub.currentPeriodEnd,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    createdAt: sub.createdAt,
  };
}

function toHistoryEntry(
  sub: MembershipSubscription,
  tierNames: Map<string, string>,
): SubscriptionHistoryEntry {
  return {
    id: sub.id,
    status: sub.status,
    tierId: sub.tierId,
    tierName: sub.tierId ? (tierNames.get(sub.tierId) ?? null) : null,
    currentPeriodStart: sub.currentPeriodStart,
    currentPeriodEnd: sub.currentPeriodEnd,
    trialStart: sub.trialStart,
    trialEnd: sub.trialEnd,
    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    canceledAt: sub.canceledAt,
    createdAt: sub.createdAt,
  };
}

function toListItem(
  row: UserRow,
  sub: MembershipSubscription | null,
  tierNames: Map<string, string>,
  now: Date,
): MemberListItem {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    name: row.name ?? "",
    firstName: row.firstName,
    lastName: row.lastName,
    image: row.image ?? row.profilePhoto,
    role: row.role,
    emailVerified: row.emailVerified,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    memberStatus: deriveMemberStatus(
      sub
        ? {
            status: sub.status,
            currentPeriodEnd: sub.currentPeriodEnd,
            trialEnd: sub.trialEnd,
          }
        : null,
      now,
    ),
    subscription: sub ? toSubscriptionSummary(sub, tierNames) : null,
  };
}

function compareMembers(
  a: MemberListItem,
  b: MemberListItem,
  sortBy: MemberSortField,
): number {
  const value = (item: MemberListItem): string | number => {
    switch (sortBy) {
      case "name":
        return item.name;
      case "username":
        return item.username;
      case "email":
        return item.email;
      case "role":
        return item.role;
      case "createdAt":
        return item.createdAt.getTime();
    }
  };
  const av = value(a);
  const bv = value(b);
  if (av < bv) return -1;
  if (av > bv) return 1;
  return 0;
}

/**
 * Paginated member directory listing.
 *
 * Member status is a derived value (ADR-0014), so a status filter cannot be
 * pushed into SQL: the filtered path loads the candidate users plus their
 * newest subscriptions, derives the status with `deriveMemberStatus`, filters
 * and pages in memory. Without a status filter we page in SQL and derive only
 * for the page.
 */
export async function listMembers(
  params: MemberListParams,
): Promise<MemberListResult> {
  const page = Number.isFinite(params.page)
    ? Math.max(1, Math.floor(params.page))
    : 1;
  const limit = Number.isFinite(params.limit)
    ? Math.min(100, Math.max(1, Math.floor(params.limit)))
    : 20;
  const sortBy: MemberSortField = params.sortBy ?? "createdAt";
  const sortOrder = params.sortOrder === "asc" ? "asc" : "desc";
  const where = baseWhere(params.search, params.roles);
  const now = new Date();

  if (params.memberStatuses && params.memberStatuses.length > 0) {
    const rows = await db.select(userColumns).from(user).where(where);
    const latest = await latestSubscriptionsByUser(rows.map((row) => row.id));
    const tierNames = await tierNamesByIds(
      [...latest.values()].map((sub) => sub.tierId),
    );
    const wanted = new Set<MemberStatus>(params.memberStatuses);
    const matched = rows
      .map((row) => toListItem(row, latest.get(row.id) ?? null, tierNames, now))
      .filter((item) => wanted.has(item.memberStatus));
    matched.sort(
      (a, b) => (sortOrder === "asc" ? 1 : -1) * compareMembers(a, b, sortBy),
    );
    const total = matched.length;
    const totalPages = Math.ceil(total / limit);
    return {
      members: matched.slice((page - 1) * limit, page * limit),
      total,
      page,
      limit,
      totalPages,
    };
  }

  const [{ value: total }] = await db
    .select({ value: count() })
    .from(user)
    .where(where);
  const direction = sortOrder === "asc" ? asc : desc;
  const rows = await db
    .select(userColumns)
    .from(user)
    .where(where)
    .orderBy(direction(SORT_COLUMNS[sortBy]))
    .limit(limit)
    .offset((page - 1) * limit);
  const latest = await latestSubscriptionsByUser(rows.map((row) => row.id));
  const tierNames = await tierNamesByIds(
    [...latest.values()].map((sub) => sub.tierId),
  );
  return {
    members: rows.map((row) =>
      toListItem(row, latest.get(row.id) ?? null, tierNames, now),
    ),
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
    .orderBy(
      desc(membershipSubscription.createdAt),
      desc(membershipSubscription.id),
    );
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
