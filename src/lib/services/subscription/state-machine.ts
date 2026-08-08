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

export function assertTransition(action: LifecycleAction, status: SubscriptionStatus): void {
  if (!LEGAL_FROM_STATES[action].includes(status)) {
    throw new BusinessLogicError(
      `Cannot ${action} a subscription in status ${status}`,
      "INVALID_TRANSITION",
    );
  }
}
