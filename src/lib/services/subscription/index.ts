/**
 * Subscription lifecycle engine over the real `membership_subscriptions`
 * table (backlog C2, per ADR-0014 §Design). Split from
 * src/lib/services/subscription.service.ts, which stays as a re-export
 * shim so `@/lib/services/subscription.service` keeps resolving.
 *
 * Every transition follows the same discipline:
 *   (a) validate the from-status against the machine (state-machine.ts),
 *   (b) write the row change AND the auth_logs audit entry in ONE
 *       db.transaction — the audit is never best-effort (audit.ts),
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

export type {
  ActorContext,
  LifecycleResult,
  SubscriptionFilters,
  SubscriptionStatus,
} from "./types";
export { getSubscription, listSubscriptions } from "./queries";
export {
  activateSubscription,
  cancelSubscription,
  createSubscription,
  renewSubscription,
} from "./mutations";
export {
  expireSubscription,
  markSubscriptionPastDue,
  pauseSubscription,
  resumeSubscription,
} from "./transitions";
export { CHECKOUT_ABANDON_HOURS, sweepExpiredSubscriptions } from "./sweeper";
