/**
 * Shared member directory types — the listing params/result shapes and the
 * member detail shape, all exposing the derived member status (ADR-0014),
 * never a stored one.
 */

import type { MembershipSubscription } from "@/db/schema";
import type { MemberStatus } from "../membership-status.service";
import type { SORT_COLUMNS } from "./columns";

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
