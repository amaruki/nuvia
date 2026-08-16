/**
 * The row-creating mutations: create, renew, and cancel. Each writes the
 * row change AND the auth_logs audit entry in ONE db.transaction, then
 * runs the A3 member-status sync so the user's role tracks immediately.
 */

import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipSubscription, membershipTier, user } from "@/db/schema";
import { BusinessLogicError, NotFoundError } from "@/lib/errors";
import { syncMemberStatusFromSubscription } from "@/lib/services/membership-status.service";
import type { CreateSubscriptionInput } from "@/lib/validation/finance.validation";
import { writeAudit } from "./audit";
import { LIVE_STATUSES, MS_PER_DAY, periodEndFor } from "./helpers";
import { getSubscription } from "./queries";
import { assertTransition } from "./state-machine";
import type { ActorContext, LifecycleResult, RenewalResult, SubscriptionStatus } from "./types";

/**
 * Create a subscription on an active tier. Starts TRIALING when a trial is
 * configured (tier trialDays, or explicit trialDays/trialEnd), ACTIVE
 * otherwise. One live subscription per user — the newest row governs
 * (ADR-0014), so an existing live row would be shadowed by this one.
 */
export async function createSubscription(
  input: CreateSubscriptionInput,
  actor: ActorContext,
): Promise<LifecycleResult> {
  const member = await db.query.user.findFirst({
    where: eq(user.id, input.userId),
    columns: { id: true },
  });
  if (!member) throw new NotFoundError("User", input.userId);

  const tier = await db.query.membershipTier.findFirst({
    where: eq(membershipTier.id, input.tierId),
  });
  if (!tier) throw new NotFoundError("MembershipTier", input.tierId);
  if (!tier.isActive) {
    throw new BusinessLogicError(
      `Tier "${tier.name}" is not active for new subscriptions`,
      "TIER_INACTIVE",
    );
  }

  const live = await db.query.membershipSubscription.findFirst({
    where: and(
      eq(membershipSubscription.userId, input.userId),
      inArray(membershipSubscription.status, [...LIVE_STATUSES]),
    ),
    orderBy: desc(membershipSubscription.createdAt),
  });
  if (live) {
    throw new BusinessLogicError(
      "User already has a live subscription",
      "SUBSCRIPTION_ALREADY_ACTIVE",
    );
  }

  const start = input.startDate ?? new Date();
  const trialDays = input.trialDays ?? tier.trialDays;
  const trialEnd =
    input.trialEnd ?? (trialDays > 0 ? new Date(start.getTime() + trialDays * MS_PER_DAY) : null);
  const status: SubscriptionStatus =
    trialEnd !== null && trialEnd.getTime() > start.getTime() ? "TRIALING" : "ACTIVE";

  const subscription = await db.transaction(async (tx) => {
    const [row] = await tx
      .insert(membershipSubscription)
      .values({
        userId: input.userId,
        tierId: tier.id,
        status,
        currentPeriodStart: start,
        currentPeriodEnd: periodEndFor(tier.billingCycle, start),
        trialStart: trialEnd !== null ? start : null,
        trialEnd,
        metadata: input.metadata ?? null,
      })
      .returning();

    await writeAudit(tx, {
      userId: input.userId,
      eventType: "SUBSCRIPTION_CREATED",
      message: `Subscription created on tier "${tier.name}" (${status})`,
      metadata: { subscriptionId: row.id, tierId: tier.id, status },
      actor,
    });

    return row;
  });

  const memberSync = await syncMemberStatusFromSubscription(input.userId);
  return { subscription, member: memberSync };
}

/**
 * Renew a TRIALING/ACTIVE/PAST_DUE subscription: a NEW ACTIVE row whose
 * period starts when the current entitlement runs out (or now when it
 * already lapsed). The old row stays untouched as the audit trail.
 */
export async function renewSubscription(
  subscriptionId: string,
  actor: ActorContext,
): Promise<RenewalResult> {
  const current = await getSubscription(subscriptionId);
  assertTransition("renew", current.status);

  const tier = await db.query.membershipTier.findFirst({
    where: eq(membershipTier.id, current.tierId),
  });
  if (!tier) throw new NotFoundError("MembershipTier", current.tierId);

  const now = new Date();
  // Converting trials start billing at trial end; renewals at period end.
  const anchor =
    current.status === "TRIALING"
      ? (current.trialEnd ?? current.currentPeriodEnd)
      : current.currentPeriodEnd;
  const start = anchor !== null && anchor.getTime() > now.getTime() ? anchor : now;

  const outcome = await db.transaction(async (tx) => {
    // Serialize renewals of THIS source row so the read-then-insert below is
    // race-free. Two concurrent renewals of the same source (webhook fan-out
    // firing checkout.session.completed + payment_intent.succeeded +
    // charge.succeeded for ONE charge, or a double-clicked admin renew)
    // queue on this lock.
    await tx
      .select({ id: membershipSubscription.id })
      .from(membershipSubscription)
      .where(eq(membershipSubscription.id, current.id))
      .for("update");

    // Idempotency guard (issue #24/#20): a source row may produce AT MOST one
    // renewal row. If this source already has one, the event is a duplicate —
    // return the existing renewal and signal `applied: false` so callers do
    // not settle fresh revenue for a charge that already bought its period.
    const [existing] = await tx
      .select()
      .from(membershipSubscription)
      .where(sql`${membershipSubscription.metadata}->>'renewedFrom' = ${current.id}`)
      .limit(1);
    if (existing) {
      return { row: existing, applied: false };
    }

    const [row] = await tx
      .insert(membershipSubscription)
      .values({
        userId: current.userId,
        tierId: current.tierId,
        status: "ACTIVE",
        currentPeriodStart: start,
        currentPeriodEnd: periodEndFor(tier.billingCycle, start),
        trialStart: null,
        trialEnd: null,
        metadata: { renewedFrom: current.id },
      })
      .returning();

    await writeAudit(tx, {
      userId: current.userId,
      eventType: "SUBSCRIPTION_RENEWED",
      message: `Subscription renewed (${current.status} -> ACTIVE, new row)`,
      metadata: {
        subscriptionId: row.id,
        renewedFrom: current.id,
        fromStatus: current.status,
        toStatus: "ACTIVE",
      },
      actor,
    });

    return { row, applied: true };
  });

  // A3 member-status sync is idempotent (pure derivation of the newest row),
  // so running it for duplicate events is harmless; the `applied` flag tells
  // callers whether fresh entitlement/revenue landed.
  const memberSync = await syncMemberStatusFromSubscription(current.userId);
  return { subscription: outcome.row, member: memberSync, applied: outcome.applied };
}

/**
 * Cancel. Immediate by default (status -> CANCELED, grace until period end);
 * `atPeriodEnd: true` keeps the subscription running and only sets
 * cancel_at_period_end.
 */
export async function cancelSubscription(
  subscriptionId: string,
  actor: ActorContext,
  options: { atPeriodEnd?: boolean } = {},
): Promise<LifecycleResult> {
  const current = await getSubscription(subscriptionId);
  const atPeriodEnd = options.atPeriodEnd ?? false;
  assertTransition(atPeriodEnd ? "cancel-at-period-end" : "cancel", current.status);

  const subscription = await db.transaction(async (tx) => {
    const [row] = await tx
      .update(membershipSubscription)
      .set(
        atPeriodEnd
          ? { cancelAtPeriodEnd: true }
          : { status: "CANCELED", canceledAt: new Date(), cancelAtPeriodEnd: false },
      )
      .where(eq(membershipSubscription.id, subscriptionId))
      .returning();

    await writeAudit(tx, {
      userId: current.userId,
      eventType: atPeriodEnd ? "SUBSCRIPTION_CANCEL_SCHEDULED" : "SUBSCRIPTION_CANCELED",
      message: atPeriodEnd
        ? `Subscription scheduled to cancel at period end (${current.currentPeriodEnd?.toISOString() ?? "no period end"})`
        : `Subscription canceled (${current.status} -> CANCELED)`,
      metadata: {
        subscriptionId,
        atPeriodEnd,
        fromStatus: current.status,
        toStatus: row.status,
      },
      actor,
    });

    return row;
  });

  const memberSync = await syncMemberStatusFromSubscription(current.userId);
  return { subscription, member: memberSync };
}
