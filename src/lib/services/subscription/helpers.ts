/**
 * Billing-period math and the live-status set. Billing periods are
 * fixed-length windows (ADR-0014): 30 days monthly, 365 yearly, lifetime
 * has no period end. No calendar arithmetic, no ambiguity.
 */

import { BusinessLogicError } from "@/lib/errors";
import type { SubscriptionStatus } from "./types";

export const MS_PER_DAY = 86_400_000;

/** Statuses in which a user counts as having a live subscription. */
export const LIVE_STATUSES: readonly SubscriptionStatus[] = [
  "ACTIVE",
  "TRIALING",
  "PAST_DUE",
  "PAUSED",
];

export function periodEndFor(billingCycle: string, start: Date): Date | null {
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
