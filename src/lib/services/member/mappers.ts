/**
 * Row-to-response mappers for the member directory — subscription rows to
 * their public summary/history shapes, and a user row plus its newest
 * subscription to a directory list item with the status derived in JS
 * (ADR-0014).
 */

import type { MembershipSubscription } from "@/db/schema";
import { deriveMemberStatus } from "../membership-status.service";
import type { UserRow } from "./columns";
import type { MemberListItem, MemberSubscriptionSummary, SubscriptionHistoryEntry } from "./types";

export function toSubscriptionSummary(
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

export function toHistoryEntry(
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

export function toListItem(
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
