/**
 * Public shapes of the subscription lifecycle engine — the status union,
 * the audit-trail actor, the transition result, and list filters.
 */

import type { MembershipSubscription } from "@/db/schema";
import type { MemberStatusSyncResult } from "@/lib/services/membership-status.service";

export type SubscriptionStatus = MembershipSubscription["status"];

/** Who caused a transition — for the audit trail. */
export interface ActorContext {
  /** Acting user id, or a "system:*" identifier for machine-driven transitions. */
  actorId: string;
  /** Optional treasurer note; lands in the audit metadata. */
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface LifecycleResult {
  subscription: MembershipSubscription;
  /** Outcome of the A3 member-status sync that ran right after the write. */
  member: MemberStatusSyncResult;
}

export interface SubscriptionFilters {
  userId?: string;
  status?: SubscriptionStatus;
  tierId?: string;
  limit?: number;
  offset?: number;
}
