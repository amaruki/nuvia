/**
 * Membership status derivation — implements docs/adr/0014-member-status-from-subscription.md.
 *
 * Member status is DERIVED from the membership subscription lifecycle and is
 * never stored independently: `membership_subscriptions` is the single source
 * of truth, and `deriveMemberStatus(subscription, now)` is a pure function of
 * that row and a timestamp. `syncMemberStatusFromSubscription(userId)` is the
 * db-backed application of the rule: it derives the status and keeps
 * `users.role` honest per the ADR's role-sync rules.
 */

import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { authLog, membershipSubscription, user, type MembershipSubscription } from "@/db/schema";
import { NotFoundError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { invalidateUserSessionCaches } from "@/lib/session-cache";

/**
 * The four role values that mark a User as a Member — the "Member" definition
 * in CONTEXT.md. Derivation only ever moves users between these roles and the
 * bare `user` role; every other role is untouched by subscription state.
 */
export const MEMBER_TIER_ROLES = [
  "member",
  "member_student",
  "member_professional",
  "member_corporate",
] as const;

export type MemberTierRole = (typeof MEMBER_TIER_ROLES)[number];

/**
 * Derived, never stored. `in_grace` = entitlement winding down (canceled but
 * paid through the period, or past due inside the retry grace window).
 */
export type MemberStatus = "active" | "trialing" | "in_grace" | "paused" | "expired" | "none";

export type SubscriptionStatus = MembershipSubscription["status"];

/** The columns the pure derivation reads — nothing else matters to it. */
export type SubscriptionSnapshot = Pick<
  MembershipSubscription,
  "status" | "currentPeriodEnd" | "trialEnd"
>;

/**
 * Grace window for `PAST_DUE` subscriptions, measured from the end of the
 * current billing period: payment retries keep membership alive this long.
 * A constant for now; making it deployer-configurable is follow-up work
 * (ADR-0014, Consequences).
 */
export const PAST_DUE_GRACE_DAYS = 7;

const MS_PER_DAY = 86_400_000;

/** Statuses that confer membership and so keep member-tier roles in place. */
function isEntitled(status: MemberStatus): boolean {
  return status === "active" || status === "trialing" || status === "in_grace";
}

/**
 * Pure derivation rule (ADR-0014 mapping table). `null` means the user has no
 * subscription row. `now` is injected so the rule is testable with fixed
 * timestamps; the clock is authoritative over a stale status value.
 */
export function deriveMemberStatus(
  subscription: SubscriptionSnapshot | null,
  now: Date,
): MemberStatus {
  if (subscription === null) return "none";

  switch (subscription.status) {
    case "ACTIVE": {
      const periodEnd = subscription.currentPeriodEnd;
      if (periodEnd === null || now.getTime() <= periodEnd.getTime()) return "active";
      return "expired";
    }
    case "TRIALING": {
      const anchor = subscription.trialEnd ?? subscription.currentPeriodEnd;
      if (anchor === null || now.getTime() <= anchor.getTime()) return "trialing";
      return "expired";
    }
    case "CANCELED": {
      const periodEnd = subscription.currentPeriodEnd;
      if (periodEnd !== null && now.getTime() <= periodEnd.getTime()) return "in_grace";
      return "expired";
    }
    case "PAST_DUE": {
      const periodEnd = subscription.currentPeriodEnd;
      if (periodEnd === null) return "in_grace";
      const graceEnd = periodEnd.getTime() + PAST_DUE_GRACE_DAYS * MS_PER_DAY;
      return now.getTime() <= graceEnd ? "in_grace" : "expired";
    }
    case "UNPAID":
      // Every payment attempt for the period failed — no entitlement, no grace.
      return "expired";
    case "PAUSED":
      return "paused";
    default: {
      // Compile-time exhaustiveness: a new enum value must update the mapping.
      const unhandled: never = subscription.status;
      throw new Error(`Unknown subscription status: ${String(unhandled)}`);
    }
  }
}

/**
 * Role-sync rule (ADR-0014). Answers: given the user's current role and their
 * derived member status, what should their role be?
 *
 * - Entitled + bare `user` role → upgrade to the default `member` role.
 * - Entitled + existing member-tier role → keep the specific tier.
 * - Not entitled + member-tier role → downgrade to `user`.
 * - Any other role (staff, governance, moderator, custom) → never touched.
 */
export function deriveRoleFromMemberStatus(
  currentRole: string,
  memberStatus: MemberStatus,
): string {
  if (isEntitled(memberStatus)) {
    return currentRole === "user" ? "member" : currentRole;
  }
  if (isMemberTierRole(currentRole)) return "user";
  return currentRole;
}

export function isMemberTierRole(role: string): role is MemberTierRole {
  return (MEMBER_TIER_ROLES as readonly string[]).includes(role);
}

export interface MemberStatusSyncResult {
  userId: string;
  memberStatus: MemberStatus;
  subscriptionId: string | null;
  previousRole: string;
  role: string;
  roleChanged: boolean;
}

/**
 * Apply the derivation for one user: read their newest subscription row,
 * derive the member status, and sync `users.role` per the role-sync rules.
 * A role change and its audit-log entry land in one transaction — the
 * privileged-mutation rule (docs/PRINCIPLES.md, ADR-0009). Idempotent:
 * running it twice in a row changes nothing the second time.
 */
export async function syncMemberStatusFromSubscription(
  userId: string,
): Promise<MemberStatusSyncResult> {
  const existingUser = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { role: true },
  });

  if (!existingUser) {
    throw new NotFoundError("User", userId);
  }

  // The newest subscription row governs (ADR-0014): renewals and
  // re-subscriptions create new rows rather than mutating old ones.
  const subscription = await db.query.membershipSubscription.findFirst({
    where: eq(membershipSubscription.userId, userId),
    orderBy: desc(membershipSubscription.createdAt),
  });

  const memberStatus = deriveMemberStatus(
    subscription
      ? {
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
          trialEnd: subscription.trialEnd,
        }
      : null,
    new Date(),
  );

  const role = deriveRoleFromMemberStatus(existingUser.role, memberStatus);

  if (role === existingUser.role) {
    return {
      userId,
      memberStatus,
      subscriptionId: subscription?.id ?? null,
      previousRole: existingUser.role,
      role,
      roleChanged: false,
    };
  }

  await db.transaction(async (tx) => {
    await tx.update(user).set({ role }).where(eq(user.id, userId));

    await tx.insert(authLog).values({
      userId,
      eventType: "ROLE_CHANGE",
      severity: "INFO",
      message: `Role changed from ${existingUser.role} to ${role} (derived member status: ${memberStatus})`,
      metadata: {
        previousRole: existingUser.role,
        newRole: role,
        changedBy: "system:membership-status-sync",
        reason: "Member status derived from subscription lifecycle (ADR-0014)",
        memberStatus,
        subscriptionId: subscription?.id ?? null,
      },
    });
  });

  // Match changeUserRole's best-effort invalidation so a demotion takes
  // effect immediately instead of after the session-cache TTL.
  try {
    await invalidateUserSessionCaches(userId);
  } catch (cacheError) {
    logger.warn("Failed to invalidate session cache after membership status sync", cacheError);
  }

  return {
    userId,
    memberStatus,
    subscriptionId: subscription?.id ?? null,
    previousRole: existingUser.role,
    role,
    roleChanged: true,
  };
}
