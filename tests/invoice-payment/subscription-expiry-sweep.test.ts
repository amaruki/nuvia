/**
 * Issue #15 regression suite — subscriptions expire automatically.
 *
 * sweepExpiredSubscriptions moves every stale row to its terminal state:
 * ACTIVE/TRIALING past their anchor -> CANCELED, CANCELED past grace ->
 * grace cut short, PAST_DUE past retry grace -> UNPAID, abandoned
 * PENDING_PAYMENT checkouts -> CANCELED. Entitled rows are untouched, and
 * the sweep is idempotent.
 */

import { afterAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipSubscription } from "@/db/schema";
import {
  cancelSubscription,
  createSubscription,
  markSubscriptionPastDue,
  sweepExpiredSubscriptions,
} from "@/lib/services/subscription.service";
import { actor, cleanupTestData, createTestTier, createTestUser } from "./fixtures";

afterAll(cleanupTestData);

const MS_PER_DAY = 86_400_000;
const daysAgo = (n: number): Date => new Date(Date.now() - n * MS_PER_DAY);

describe("issue #15 — automatic subscription expiry sweep", () => {
  test("stale ACTIVE monthly subscription is canceled by the sweep", async () => {
    const tierId = await createTestTier("i15-stale", "I15 Stale Tier");
    const memberId = await createTestUser();
    // Started 40 days ago on a monthly tier: the 30-day period ended 10 days ago.
    const { subscription } = await createSubscription(
      { userId: memberId, tierId, trialDays: 0, startDate: daysAgo(40) },
      actor,
    );
    expect(subscription.status).toBe("ACTIVE");

    const result = await sweepExpiredSubscriptions(actor);

    expect(result.expired).toBeGreaterThan(0);
    const outcome = result.outcomes.find((o) => o.subscriptionId === subscription.id);
    expect(outcome?.toStatus).toBe("CANCELED");
    expect(outcome?.skippedReason).toBeNull();
  });

  test("stale TRIALING subscription lapses at the trial anchor", async () => {
    const tierId = await createTestTier("i15-trial", "I15 Trial Tier");
    const memberId = await createTestUser();
    // Trial ended 5 days ago; the sweep keys off the trial anchor.
    const { subscription } = await createSubscription(
      { userId: memberId, tierId, trialDays: 7, startDate: daysAgo(12) },
      actor,
    );
    expect(subscription.status).toBe("TRIALING");

    const result = await sweepExpiredSubscriptions(actor);
    const outcome = result.outcomes.find((o) => o.subscriptionId === subscription.id);
    expect(outcome?.toStatus).toBe("CANCELED");
  });

  test("CANCELED rows are deliberately NOT swept (grace is clock-derived)", async () => {
    // Sweeping CANCELED rows would re-expire them and SET period_end = now
    // on rows whose period end is null — flipping abandoned checkouts from
    // 'expired' back into 'in_grace'. Grace ends on the clock instead.
    const tierId = await createTestTier("i15-grace", "I15 Grace Tier");
    const memberId = await createTestUser();
    const { subscription } = await createSubscription(
      { userId: memberId, tierId, trialDays: 0, startDate: daysAgo(40) },
      actor,
    );
    await cancelSubscription(subscription.id, actor);

    const result = await sweepExpiredSubscriptions(actor);
    expect(result.outcomes.find((o) => o.subscriptionId === subscription.id)).toBeUndefined();

    const [fresh] = await db
      .select()
      .from(membershipSubscription)
      .where(eq(membershipSubscription.id, subscription.id));
    expect(fresh.status).toBe("CANCELED");
  });

  test("PAST_DUE subscription past retry grace becomes UNPAID", async () => {
    const tierId = await createTestTier("i15-pastdue", "I15 PastDue Tier");
    const memberId = await createTestUser();
    const { subscription } = await createSubscription(
      { userId: memberId, tierId, trialDays: 0, startDate: daysAgo(40) },
      actor,
    );
    await markSubscriptionPastDue(subscription.id, actor);

    const result = await sweepExpiredSubscriptions(actor);
    const outcome = result.outcomes.find((o) => o.subscriptionId === subscription.id);
    expect(outcome?.toStatus).toBe("UNPAID");
  });

  test("entitled ACTIVE and TRIALING rows survive the sweep", async () => {
    const tierId = await createTestTier("i15-live", "I15 Live Tier");
    const memberId = await createTestUser();
    const { subscription: active } = await createSubscription(
      { userId: memberId, tierId, trialDays: 0 },
      actor,
    );
    const memberId2 = await createTestUser();
    const { subscription: trialing } = await createSubscription(
      { userId: memberId2, tierId, trialDays: 30 },
      actor,
    );

    const result = await sweepExpiredSubscriptions(actor);

    expect(result.outcomes.find((o) => o.subscriptionId === active.id)).toBeUndefined();
    expect(result.outcomes.find((o) => o.subscriptionId === trialing.id)).toBeUndefined();

    const [freshActive] = await db
      .select()
      .from(membershipSubscription)
      .where(eq(membershipSubscription.id, active.id));
    expect(freshActive.status).toBe("ACTIVE");
    const [freshTrialing] = await db
      .select()
      .from(membershipSubscription)
      .where(eq(membershipSubscription.id, trialing.id));
    expect(freshTrialing.status).toBe("TRIALING");
  });

  test("abandoned PENDING_PAYMENT checkout older than 24h is swept", async () => {
    const tierId = await createTestTier("i15-abandon", "I15 Abandon Tier");
    const memberId = await createTestUser();
    const { subscription } = await createSubscription(
      { userId: memberId, tierId, trialDays: 0, pendingPayment: true },
      actor,
    );
    // Backdate the row past the abandon window.
    await db
      .update(membershipSubscription)
      .set({ createdAt: daysAgo(2) })
      .where(eq(membershipSubscription.id, subscription.id));

    const result = await sweepExpiredSubscriptions(actor);
    const outcome = result.outcomes.find((o) => o.subscriptionId === subscription.id);
    expect(outcome?.toStatus).toBe("CANCELED");

    const [fresh] = await db
      .select()
      .from(membershipSubscription)
      .where(eq(membershipSubscription.id, subscription.id));
    expect(fresh.currentPeriodEnd).toBeNull();
  });

  test("fresh PENDING_PAYMENT checkout is NOT swept", async () => {
    const tierId = await createTestTier("i15-fresh", "I15 Fresh Tier");
    const memberId = await createTestUser();
    const { subscription } = await createSubscription(
      { userId: memberId, tierId, trialDays: 0, pendingPayment: true },
      actor,
    );

    const result = await sweepExpiredSubscriptions(actor);
    expect(result.outcomes.find((o) => o.subscriptionId === subscription.id)).toBeUndefined();

    const [fresh] = await db
      .select()
      .from(membershipSubscription)
      .where(eq(membershipSubscription.id, subscription.id));
    expect(fresh.status).toBe("PENDING_PAYMENT");
  });

  test("the sweep is idempotent: a second run finds nothing new", async () => {
    const tierId = await createTestTier("i15-idem", "I15 Idem Tier");
    const memberId = await createTestUser();
    await createSubscription(
      { userId: memberId, tierId, trialDays: 0, startDate: daysAgo(40) },
      actor,
    );

    const first = await sweepExpiredSubscriptions(actor);
    const second = await sweepExpiredSubscriptions(actor);

    expect(first.expired).toBeGreaterThan(0);
    expect(second.expired).toBe(0);
  });
});
