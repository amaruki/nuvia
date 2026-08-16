/**
 * Subscription expiry sweeper (issue #15).
 *
 * Moves stale subscriptions to their terminal state without a human:
 *
 *  - ACTIVE/TRIALING whose period (or trial anchor) already ended -> CANCELED
 *  - CANCELED whose grace window (period end) already passed -> grace cut
 *  - PAST_DUE whose retry grace (period end + PAST_DUE_GRACE_DAYS) passed
 *    -> UNPAID
 *  - PENDING_PAYMENT checkouts abandoned for CHECKOUT_ABANDON_HOURS -> CANCELED
 *
 * Every candidate goes through expireSubscription, which re-validates the
 * from-status and runs the A3 member-status sync — so member roles are
 * revoked by the same sweep that terminates the row. The sweep is
 * idempotent: a second run over the same rows is a no-op, and a row that a
 * concurrent admin action moved in between selection and expiry is skipped
 * (INVALID_TRANSITION collected, never thrown).
 *
 * Invoked by scripts/sweep-subscriptions.ts (cron / deploy pipeline) and by
 * POST /api/v1/finance/subscriptions/sweep (treasurer action).
 */

import { and, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipSubscription } from "@/db/schema";
import { BusinessLogicError } from "@/lib/errors";
import { PAST_DUE_GRACE_DAYS } from "@/lib/services/membership-status.service";
import { expireSubscription } from "./transitions";
import type { ActorContext } from "./types";

/** Abandoned-checkout window: pending rows older than this are swept. */
export const CHECKOUT_ABANDON_HOURS = 24;

export interface SweepOutcome {
  subscriptionId: string;
  userId: string;
  fromStatus: string;
  toStatus: string | null;
  /** Null when expired cleanly; the error code when skipped. */
  skippedReason: string | null;
}

export interface SweepResult {
  now: string;
  considered: number;
  expired: number;
  skipped: number;
  outcomes: SweepOutcome[];
}

export async function sweepExpiredSubscriptions(
  actor: ActorContext,
  now: Date = new Date(),
): Promise<SweepResult> {
  const graceCutoff = new Date(now.getTime() - PAST_DUE_GRACE_DAYS * 86_400_000);
  const abandonCutoff = new Date(now.getTime() - CHECKOUT_ABANDON_HOURS * 3_600_000);

  // postgres.js rejects raw Date parameters against timestamptz columns, so
  // every cutoff is bound as ISO text (same trick as derivedMemberStatusSql).
  const nowIso = now.toISOString();
  const graceCutoffIso = graceCutoff.toISOString();
  const abandonCutoffIso = abandonCutoff.toISOString();

  // One wide net, then expireSubscription re-validates each row individually.
  // TRIALING rows lapse at the trial anchor (coalesce(trial_end,
  // current_period_end)); everything else at current_period_end.
  //
  // Deliberately NOT in the net: CANCELED rows. CANCELED is already terminal
  // and its grace is clock-derived (deriveMemberStatus) — re-expiring a
  // CANCELED row whose period end is null would SET period_end = now, which
  // flips an abandoned-checkout row from 'expired' back into 'in_grace'.
  // Treasurers can still cut grace short via the manual expire route.
  const candidates = await db
    .select()
    .from(membershipSubscription)
    .where(
      or(
        and(
          sql`${membershipSubscription.status} = 'ACTIVE'`,
          sql`${membershipSubscription.currentPeriodEnd} < ${nowIso}`,
        ),
        and(
          sql`${membershipSubscription.status} = 'TRIALING'`,
          sql`coalesce(${membershipSubscription.trialEnd}, ${membershipSubscription.currentPeriodEnd}) < ${nowIso}`,
        ),
        and(
          sql`${membershipSubscription.status} = 'PAST_DUE'`,
          or(
            sql`${membershipSubscription.currentPeriodEnd} < ${graceCutoffIso}`,
            isNull(membershipSubscription.currentPeriodEnd),
          ),
        ),
        and(
          sql`${membershipSubscription.status} = 'PENDING_PAYMENT'`,
          sql`${membershipSubscription.createdAt} < ${abandonCutoffIso}`,
        ),
      ),
    );

  const outcomes: SweepOutcome[] = [];
  let expired = 0;

  for (const candidate of candidates) {
    try {
      const { subscription } = await expireSubscription(candidate.id, actor);
      expired += 1;
      outcomes.push({
        subscriptionId: candidate.id,
        userId: candidate.userId,
        fromStatus: candidate.status,
        toStatus: subscription.status,
        skippedReason: null,
      });
    } catch (error) {
      // A concurrent admin action (renew, cancel, manual expire) may have
      // moved the row between selection and expiry. Skip it — the sweep is
      // advisory, never forceful.
      const code = error instanceof BusinessLogicError ? error.code : "SWEEP_UNEXPECTED_ERROR";
      outcomes.push({
        subscriptionId: candidate.id,
        userId: candidate.userId,
        fromStatus: candidate.status,
        toStatus: null,
        skippedReason: code,
      });
    }
  }

  return {
    now: now.toISOString(),
    considered: candidates.length,
    expired,
    skipped: candidates.length - expired,
    outcomes,
  };
}
