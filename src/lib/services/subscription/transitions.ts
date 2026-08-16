/**
 * Single-row transitions over the shared applyTransition write path:
 * pause, resume, past-due, and expire. Expire never terminates a
 * subscription still inside its paid period — that is what cancel is for.
 */

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipSubscription } from "@/db/schema";
import type { MembershipSubscription } from "@/db/schema";
import { BusinessLogicError } from "@/lib/errors";
import { syncMemberStatusFromSubscription } from "@/lib/services/membership-status.service";
import { writeAudit } from "./audit";
import { getSubscription } from "./queries";
import { assertTransition, type LifecycleAction } from "./state-machine";
import type { ActorContext, LifecycleResult, SubscriptionStatus } from "./types";

interface TransitionSpec {
  action: LifecycleAction;
  toStatus: SubscriptionStatus;
  eventType: string;
  severity?: string;
  message: string;
  /** Extra column sets (e.g. canceledAt) folded into the status update. */
  extraSets?: Partial<typeof membershipSubscription.$inferInsert>;
}

/** Shared write path for single-row transitions: row + audit in one tx, then sync. */
async function applyTransition(
  current: MembershipSubscription,
  actor: ActorContext,
  spec: TransitionSpec,
): Promise<LifecycleResult> {
  const subscription = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(membershipSubscription)
      .set({ status: spec.toStatus, ...spec.extraSets })
      .where(eq(membershipSubscription.id, current.id))
      .returning();

    await writeAudit(tx, {
      userId: current.userId,
      eventType: spec.eventType,
      severity: spec.severity,
      message: spec.message,
      metadata: {
        subscriptionId: current.id,
        tierId: current.tierId,
        fromStatus: current.status,
        toStatus: spec.toStatus,
        action: spec.action,
      },
      actor,
    });

    return row;
  });

  const memberSync = await syncMemberStatusFromSubscription(current.userId);
  return { subscription, member: memberSync };
}

/** Pause an ACTIVE subscription; the member keeps their account, loses the member role. */
export async function pauseSubscription(
  subscriptionId: string,
  actor: ActorContext,
): Promise<LifecycleResult> {
  const current = await getSubscription(subscriptionId);
  assertTransition("pause", current.status);

  return applyTransition(current, actor, {
    action: "pause",
    toStatus: "PAUSED",
    eventType: "SUBSCRIPTION_PAUSED",
    message: `Subscription paused (${current.status} -> PAUSED)`,
  });
}

/** Resume a PAUSED subscription back to ACTIVE. */
export async function resumeSubscription(
  subscriptionId: string,
  actor: ActorContext,
): Promise<LifecycleResult> {
  const current = await getSubscription(subscriptionId);
  assertTransition("resume", current.status);

  return applyTransition(current, actor, {
    action: "resume",
    toStatus: "ACTIVE",
    eventType: "SUBSCRIPTION_RESUMED",
    message: `Subscription resumed (${current.status} -> ACTIVE)`,
  });
}

/** A payment failed: move to PAST_DUE and start the grace window (ADR-0014 §4). */
export async function markSubscriptionPastDue(
  subscriptionId: string,
  actor: ActorContext,
): Promise<LifecycleResult> {
  const current = await getSubscription(subscriptionId);
  assertTransition("mark-past-due", current.status);

  return applyTransition(current, actor, {
    action: "mark-past-due",
    toStatus: "PAST_DUE",
    eventType: "SUBSCRIPTION_PAST_DUE",
    severity: "WARN",
    message: `Subscription marked past due (${current.status} -> PAST_DUE)`,
  });
}

/**
 * Move a subscription whose entitlement has run out to its terminal state.
 * - stale ACTIVE/TRIALING (period already ended) -> CANCELED (janitor sweep),
 * - CANCELED -> grace ends immediately (period end cut to now),
 * - PAST_DUE -> UNPAID (retries exhausted; UNPAID confers no grace).
 * Refuses to expire a subscription still inside its paid period — cancel it.
 */
export async function expireSubscription(
  subscriptionId: string,
  actor: ActorContext,
): Promise<LifecycleResult> {
  const current = await getSubscription(subscriptionId);
  assertTransition("expire", current.status);

  const now = new Date();
  const periodEnd = current.currentPeriodEnd;

  if (current.status === "ACTIVE" || current.status === "TRIALING") {
    // TRIALING rows lapse at the trial anchor (trial_end, falling back to
    // period end) — the same anchor deriveMemberStatus uses — so the raw
    // status stops drifting from the derived one the moment the trial is
    // over (issue #15). ACTIVE rows lapse at the period end.
    const anchor = current.status === "TRIALING" ? (current.trialEnd ?? periodEnd) : periodEnd;
    if (anchor === null || now.getTime() <= anchor.getTime()) {
      throw new BusinessLogicError(
        "Subscription is still inside its paid period; cancel it instead of expiring it",
        "SUBSCRIPTION_STILL_ENTITLED",
      );
    }

    return applyTransition(current, actor, {
      action: "expire",
      toStatus: "CANCELED",
      eventType: "SUBSCRIPTION_EXPIRED",
      severity: "WARN",
      message: `Subscription expired (stale ${current.status} -> CANCELED)`,
      extraSets: { canceledAt: current.canceledAt ?? now },
    });
  }

  if (current.status === "CANCELED") {
    const cutGraceShort = periodEnd === null || now.getTime() < periodEnd.getTime();
    return applyTransition(current, actor, {
      action: "expire",
      toStatus: "CANCELED",
      eventType: "SUBSCRIPTION_EXPIRED",
      severity: "WARN",
      message: cutGraceShort
        ? "Subscription expired: remaining grace period ended early"
        : "Subscription expired (period already ended)",
      extraSets: cutGraceShort ? { currentPeriodEnd: now } : undefined,
    });
  }

  // PENDING_PAYMENT — the join funnel's checkout was never confirmed. This is
  // the janitor path for abandoned checkouts (issue #19): terminate the row
  // without ever granting entitlement. No money was taken, so there is no
  // grace and no period to cut short.
  if (current.status === "PENDING_PAYMENT") {
    return applyTransition(current, actor, {
      action: "expire",
      toStatus: "CANCELED",
      eventType: "SUBSCRIPTION_EXPIRED",
      severity: "WARN",
      message: "Abandoned checkout expired (PENDING_PAYMENT -> CANCELED, no payment confirmed)",
      // Null the speculative period end: nothing was paid, so the CANCELED
      // row must derive `expired`, never `in_grace`.
      extraSets: { canceledAt: now, currentPeriodEnd: null },
    });
  }

  // PAST_DUE — retries exhausted; UNPAID confers no grace (ADR-0014).
  return applyTransition(current, actor, {
    action: "expire",
    toStatus: "UNPAID",
    eventType: "SUBSCRIPTION_EXPIRED",
    severity: "WARN",
    message: `Subscription expired (${current.status} -> UNPAID, retries exhausted)`,
  });
}
