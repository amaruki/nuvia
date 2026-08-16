/**
 * The lifecycle state machine over membership_status_enum
 * (ACTIVE | TRIALING | CANCELED | PAST_DUE | UNPAID | PAUSED):
 *
 *   create ─► TRIALING (tier.trialDays > 0) or ACTIVE   (mutations.ts)
 *   renew ──────────► ACTIVE          from TRIALING | ACTIVE | PAST_DUE (new row)
 *   cancel ─────────► CANCELED        from ACTIVE | TRIALING | PAST_DUE | PAUSED | UNPAID
 *   cancel@EOP ─────► (status kept, cancel_at_period_end = true) from ACTIVE | TRIALING
 *   pause ──────────► PAUSED          from ACTIVE
 *   resume ─────────► ACTIVE          from PAUSED
 *   activate ───────► ACTIVE          from PENDING_PAYMENT (verified checkout webhook)
 *   past-due ───────► PAST_DUE        from ACTIVE | TRIALING (payment failed; grace starts)
 *   expire ─────────► CANCELED        from stale ACTIVE/TRIALING (period ran out; janitor)
 *                     CANCELED        from CANCELED (grace cut short immediately)
 *                     UNPAID          from PAST_DUE (retries exhausted; no grace)
 *
 * Every write path validates the from-status here before touching the row.
 */

import { BusinessLogicError } from "@/lib/errors";
import type { SubscriptionStatus } from "./types";

export type LifecycleAction =
  | "renew"
  | "cancel"
  | "cancel-at-period-end"
  | "pause"
  | "resume"
  | "activate"
  | "mark-past-due"
  | "expire";

const LEGAL_FROM_STATES: Record<LifecycleAction, readonly SubscriptionStatus[]> = {
  renew: ["TRIALING", "ACTIVE", "PAST_DUE"],
  cancel: ["ACTIVE", "TRIALING", "PAST_DUE", "PAUSED", "UNPAID", "PENDING_PAYMENT"],
  "cancel-at-period-end": ["ACTIVE", "TRIALING"],
  pause: ["ACTIVE"],
  resume: ["PAUSED"],
  activate: ["PENDING_PAYMENT"],
  "mark-past-due": ["ACTIVE", "TRIALING"],
  expire: ["ACTIVE", "TRIALING", "CANCELED", "PAST_DUE", "PENDING_PAYMENT"],
};

/**
 * Statuses from which a renewal is legal. Exported so callers that gate a
 * renewal checkout (membership-join) refuse the SAME set the state machine
 * enforces — a PAUSED or CANCELED subscription must never open a checkout
 * whose success webhook would then be refused and settle money it cannot
 * apply (issue #21).
 */
export const RENEWABLE_STATUSES: readonly SubscriptionStatus[] = LEGAL_FROM_STATES.renew;

export function assertTransition(action: LifecycleAction, status: SubscriptionStatus): void {
  if (!LEGAL_FROM_STATES[action].includes(status)) {
    throw new BusinessLogicError(
      `Cannot ${action} a subscription in status ${status}`,
      "INVALID_TRANSITION",
    );
  }
}

/** Every status in membership_status_enum, for graph completeness checks. */
export const SUBSCRIPTION_STATUSES: readonly SubscriptionStatus[] = [
  "ACTIVE",
  "TRIALING",
  "CANCELED",
  "PAST_DUE",
  "UNPAID",
  "PAUSED",
  "PENDING_PAYMENT",
];

/** Target for every action except expire (which branches per from-status). */
const ACTION_TARGET: Partial<Record<LifecycleAction, SubscriptionStatus>> = {
  renew: "ACTIVE",
  cancel: "CANCELED",
  pause: "PAUSED",
  resume: "ACTIVE",
  activate: "ACTIVE",
  "mark-past-due": "PAST_DUE",
};

/** expire's target depends on the from-status (see expireSubscription). */
const EXPIRE_TARGET: Partial<Record<SubscriptionStatus, SubscriptionStatus>> = {
  ACTIVE: "CANCELED",
  TRIALING: "CANCELED",
  CANCELED: "CANCELED",
  PAST_DUE: "UNPAID",
  PENDING_PAYMENT: "CANCELED",
};

/**
 * Derived status graph: from-status -> statuses the lifecycle can move it
 * to. Two intentional exclusions:
 * - `cancel-at-period-end` is not an edge: it keeps the current status and
 *   only schedules the future cancel.
 * - Self-loops are dropped (expire on CANCELED cuts the grace period short
 *   but never changes the status), so terminal statuses stay honest.
 * Issue #17's status-graph regression test asserts no status is a dead end
 * here.
 */
export const SUBSCRIPTION_TRANSITIONS: Record<SubscriptionStatus, readonly SubscriptionStatus[]> =
  (() => {
    const graph = new Map<SubscriptionStatus, Set<SubscriptionStatus>>(
      SUBSCRIPTION_STATUSES.map((status) => [status, new Set<SubscriptionStatus>()]),
    );
    for (const [action, sources] of Object.entries(LEGAL_FROM_STATES) as Array<
      [LifecycleAction, readonly SubscriptionStatus[]]
    >) {
      if (action === "cancel-at-period-end") continue;
      for (const from of sources) {
        const to = action === "expire" ? EXPIRE_TARGET[from] : ACTION_TARGET[action];
        if (to && to !== from) graph.get(from)!.add(to);
      }
    }
    const record = {} as Record<SubscriptionStatus, readonly SubscriptionStatus[]>;
    for (const status of SUBSCRIPTION_STATUSES) {
      record[status] = [...graph.get(status)!];
    }
    return record;
  })();

/**
 * Same-row terminal statuses. CANCELED ends the row's own lifecycle;
 * re-subscribing is the membership-join funnel creating a NEW row, never a
 * transition out of CANCELED (renew is legal from TRIALING/ACTIVE/PAST_DUE
 * only).
 */
export const TERMINAL_SUBSCRIPTION_STATUSES: readonly SubscriptionStatus[] = ["CANCELED"];
