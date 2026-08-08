/**
 * Subscription lifecycle engine over the real `membership_subscriptions`
 * table (backlog C2, per ADR-0014 §Design).
 *
 * State machine over membership_status_enum
 * (ACTIVE | TRIALING | CANCELED | PAST_DUE | UNPAID | PAUSED):
 *
 *   create ─► TRIALING (tier.trialDays > 0) or ACTIVE
 *   renew ──────────► ACTIVE          from TRIALING | ACTIVE | PAST_DUE (new row)
 *   cancel ─────────► CANCELED        from ACTIVE | TRIALING | PAST_DUE | PAUSED | UNPAID
 *   cancel@EOP ─────► (status kept, cancel_at_period_end = true) from ACTIVE | TRIALING
 *   pause ──────────► PAUSED          from ACTIVE
 *   resume ─────────► ACTIVE          from PAUSED
 *   past-due ───────► PAST_DUE        from ACTIVE | TRIALING (payment failed; grace starts)
 *   expire ─────────► CANCELED        from stale ACTIVE/TRIALING (period ran out; janitor)
 *                     CANCELED        from CANCELED (grace cut short immediately)
 *                     UNPAID          from PAST_DUE (retries exhausted; no grace)
 *
 * Every transition follows the same discipline:
 *   (a) validate the from-status against the table above,
 *   (b) write the row change AND the auth_logs audit entry in ONE
 *       db.transaction — the audit is never best-effort,
 *   (c) call syncMemberStatusFromSubscription (A3) afterwards so the user's
 *       role tracks the subscription immediately.
 *
 * Design decisions:
 * - Renewals create a NEW row (ADR-0014: the newest row governs; old rows
 *   stay immutable as the audit trail). The new period starts when the
 *   current entitlement runs out, or now when it already lapsed.
 * - Billing periods are fixed-length windows: 30 days monthly, 365 yearly,
 *   lifetime has no period end. No calendar arithmetic, no ambiguity.
 * - Expire never terminates a subscription that is still inside a paid
 *   period — that is what cancel is for.
 */

import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { authLog, membershipSubscription, membershipTier, user } from "@/db/schema";
import type { MembershipSubscription } from "@/db/schema";
import { BusinessLogicError, NotFoundError } from "@/lib/errors";
import {
  syncMemberStatusFromSubscription,
  type MemberStatusSyncResult,
} from "@/lib/services/membership-status.service";
import type { CreateSubscriptionInput } from "@/lib/validation/finance.validation";

export type SubscriptionStatus = MembershipSubscription["status"];

/** The subscription insert shape drizzle derives from the schema. */
type SubscriptionInsert = typeof membershipSubscription.$inferInsert;

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

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const MS_PER_DAY = 86_400_000;

/** Statuses in which a user counts as having a live subscription. */
const LIVE_STATUSES: readonly SubscriptionStatus[] = ["ACTIVE", "TRIALING", "PAST_DUE", "PAUSED"];

type LifecycleAction =
  | "renew"
  | "cancel"
  | "cancel-at-period-end"
  | "pause"
  | "resume"
  | "mark-past-due"
  | "expire";

const LEGAL_FROM_STATES: Record<LifecycleAction, readonly SubscriptionStatus[]> = {
  renew: ["TRIALING", "ACTIVE", "PAST_DUE"],
  cancel: ["ACTIVE", "TRIALING", "PAST_DUE", "PAUSED", "UNPAID"],
  "cancel-at-period-end": ["ACTIVE", "TRIALING"],
  pause: ["ACTIVE"],
  resume: ["PAUSED"],
  "mark-past-due": ["ACTIVE", "TRIALING"],
  expire: ["ACTIVE", "TRIALING", "CANCELED", "PAST_DUE"],
};

function assertTransition(action: LifecycleAction, status: SubscriptionStatus): void {
  if (!LEGAL_FROM_STATES[action].includes(status)) {
    throw new BusinessLogicError(
      `Cannot ${action} a subscription in status ${status}`,
      "INVALID_TRANSITION",
    );
  }
}

/** Billing periods are fixed-length windows; lifetime has no period end. */
function periodEndFor(billingCycle: string, start: Date): Date | null {
  switch (billingCycle) {
    case "monthly":
      return new Date(start.getTime() + 30 * MS_PER_DAY);
    case "yearly":
      return new Date(start.getTime() + 365 * MS_PER_DAY);
    case "lifetime":
      return null;
    default:
      throw new BusinessLogicError(
        `Unknown billing cycle: ${billingCycle}`,
        "INVALID_BILLING_CYCLE",
      );
  }
}

async function writeAudit(
  tx: Tx,
  entry: {
    userId: string;
    eventType: string;
    message: string;
    severity?: string;
    metadata: Record<string, unknown>;
    actor: ActorContext;
  },
): Promise<void> {
  await tx.insert(authLog).values({
    userId: entry.userId,
    eventType: entry.eventType,
    severity: entry.severity ?? "INFO",
    message: entry.message,
    ipAddress: entry.actor.ipAddress,
    userAgent: entry.actor.userAgent,
    metadata: { ...entry.metadata, actorId: entry.actor.actorId, reason: entry.actor.reason },
  });
}

export async function getSubscription(id: string): Promise<MembershipSubscription> {
  const subscription = await db.query.membershipSubscription.findFirst({
    where: eq(membershipSubscription.id, id),
  });

  if (!subscription) throw new NotFoundError("MembershipSubscription", id);
  return subscription;
}

export interface SubscriptionFilters {
  userId?: string;
  status?: SubscriptionStatus;
  tierId?: string;
  limit?: number;
  offset?: number;
}

/** Newest subscriptions first; filter by user, status, or tier. */
export async function listSubscriptions(
  filters: SubscriptionFilters = {},
): Promise<MembershipSubscription[]> {
  const conditions = [];
  if (filters.userId) conditions.push(eq(membershipSubscription.userId, filters.userId));
  if (filters.status) conditions.push(eq(membershipSubscription.status, filters.status));
  if (filters.tierId) conditions.push(eq(membershipSubscription.tierId, filters.tierId));

  return db.query.membershipSubscription.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: desc(membershipSubscription.createdAt),
    limit: filters.limit ?? 50,
    offset: filters.offset ?? 0,
  });
}

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
): Promise<LifecycleResult> {
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

  const subscription = await db.transaction(async (tx) => {
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

    return row;
  });

  const memberSync = await syncMemberStatusFromSubscription(current.userId);
  return { subscription, member: memberSync };
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

interface TransitionSpec {
  action: LifecycleAction;
  toStatus: SubscriptionStatus;
  eventType: string;
  severity?: string;
  message: string;
  extraSets?: Partial<SubscriptionInsert>;
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
    if (periodEnd === null || now.getTime() <= periodEnd.getTime()) {
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

  // PAST_DUE — retries exhausted; UNPAID confers no grace (ADR-0014).
  return applyTransition(current, actor, {
    action: "expire",
    toStatus: "UNPAID",
    eventType: "SUBSCRIPTION_EXPIRED",
    severity: "WARN",
    message: `Subscription expired (${current.status} -> UNPAID, retries exhausted)`,
  });
}
