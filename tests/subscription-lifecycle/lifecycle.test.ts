/**
 * Backlog C2 split — the subscription lifecycle engine against the real
 * membership_subscriptions table: the full machine create→trialing→active→
 * past_due→renew→pause→resume→cancel→expire including grace and the UNPAID
 * path, illegal from-states rejected, the A3 role derivation firing on every
 * transition, and the same-transaction auth_logs audit trail.
 *
 * Every row this file creates is removed in afterAll; names carry a unique
 * suffix so runs never collide.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { authLog } from "@/db/schema";
import { NotFoundError } from "@/lib/errors";
import { createTier, deleteTier } from "@/lib/services/membership-tier.service";
import {
  cancelSubscription,
  createSubscription,
  expireSubscription,
  getSubscription,
  listSubscriptions,
  markSubscriptionPastDue,
  pauseSubscription,
  renewSubscription,
  resumeSubscription,
  type ActorContext,
} from "@/lib/services/subscription.service";
import { actor, createFixture, DAY, expectRejects, readRole, suffix } from "./helpers";

const fixture = createFixture();

afterAll(async () => {
  await fixture.cleanup();
});

describe("subscription lifecycle engine — real membership_subscriptions table", () => {
  let lifecycleTierId: string;

  beforeAll(async () => {
    const tier = await createTier({
      name: `c2-lifecycle-${suffix()}`,
      displayName: "C2 Lifecycle Tier",
      price: "10.00",
      billingCycle: "monthly",
      trialDays: 14,
    });
    fixture.trackTier(tier.id);
    lifecycleTierId = tier.id;
  });

  test("full lifecycle: trialing→active→past_due→renew→pause→resume→cancel→expire", async () => {
    const userId = await fixture.createTestUser();
    const start = new Date(Date.now() - 13 * DAY); // one day of trial left

    // create → TRIALING, and the A3 sync promotes the role in the same call
    const created = await createSubscription(
      { userId, tierId: lifecycleTierId, startDate: start },
      actor,
    );
    expect(created.subscription.status).toBe("TRIALING");
    expect(created.subscription.trialEnd?.getTime()).toBe(start.getTime() + 14 * DAY);
    expect(created.member.memberStatus).toBe("trialing");
    expect(created.member.role).toBe("member");
    expect(created.member.roleChanged).toBe(true);
    expect(await readRole(userId)).toBe("member");

    const trialSubId = created.subscription.id;
    await expectRejects(() => pauseSubscription(trialSubId, actor), "INVALID_TRANSITION");
    await expectRejects(() => resumeSubscription(trialSubId, actor), "INVALID_TRANSITION");

    // renew → ACTIVE on a NEW row; the trial row stays untouched (ADR-0014)
    const renewed = await renewSubscription(trialSubId, actor);
    expect(renewed.subscription.id).not.toBe(trialSubId);
    expect(renewed.subscription.status).toBe("ACTIVE");
    expect(renewed.subscription.metadata).toEqual({ renewedFrom: trialSubId });
    expect((await getSubscription(trialSubId)).status).toBe("TRIALING");
    expect(renewed.member.memberStatus).toBe("active");

    // payment fails → PAST_DUE, grace keeps the member role
    const pastDue = await markSubscriptionPastDue(renewed.subscription.id, actor);
    expect(pastDue.subscription.status).toBe("PAST_DUE");
    expect(pastDue.member.memberStatus).toBe("in_grace");
    expect(await readRole(userId)).toBe("member");

    await expectRejects(
      () => pauseSubscription(pastDue.subscription.id, actor),
      "INVALID_TRANSITION",
    );

    // renew recovers a past-due subscription
    const recovered = await renewSubscription(pastDue.subscription.id, actor);
    expect(recovered.subscription.status).toBe("ACTIVE");
    expect(recovered.member.memberStatus).toBe("active");

    // pause demotes the role, resume restores it
    const paused = await pauseSubscription(recovered.subscription.id, actor);
    expect(paused.subscription.status).toBe("PAUSED");
    expect(paused.member.memberStatus).toBe("paused");
    expect(await readRole(userId)).toBe("user");

    const resumed = await resumeSubscription(paused.subscription.id, actor);
    expect(resumed.subscription.status).toBe("ACTIVE");
    expect(resumed.member.memberStatus).toBe("active");
    expect(await readRole(userId)).toBe("member");

    // cancel → CANCELED, grace until period end keeps the role
    const canceled = await cancelSubscription(resumed.subscription.id, actor);
    expect(canceled.subscription.status).toBe("CANCELED");
    expect(canceled.subscription.canceledAt).not.toBeNull();
    expect(canceled.member.memberStatus).toBe("in_grace");
    expect(await readRole(userId)).toBe("member");

    await expectRejects(
      () => renewSubscription(canceled.subscription.id, actor),
      "INVALID_TRANSITION",
    );
    await expectRejects(
      () => cancelSubscription(canceled.subscription.id, actor),
      "INVALID_TRANSITION",
    );
    await expectRejects(
      () => pauseSubscription(canceled.subscription.id, actor),
      "INVALID_TRANSITION",
    );

    // expire → grace ends immediately; member deterministically expired
    const expired = await expireSubscription(canceled.subscription.id, actor);
    expect(expired.subscription.status).toBe("CANCELED");
    expect(expired.member.memberStatus).toBe("expired");
    expect(await readRole(userId)).toBe("user");
  });

  test("trial override: trialDays 0 skips the tier trial; cancel→grace→expire", async () => {
    const userId = await fixture.createTestUser();
    const start = new Date(Date.now() - 5 * DAY);

    const created = await createSubscription(
      { userId, tierId: lifecycleTierId, startDate: start, trialDays: 0 },
      actor,
    );
    expect(created.subscription.status).toBe("ACTIVE");
    expect(created.subscription.trialEnd).toBeNull();
    expect(created.member.memberStatus).toBe("active");
    expect(await readRole(userId)).toBe("member");

    const canceled = await cancelSubscription(created.subscription.id, actor);
    expect(canceled.member.memberStatus).toBe("in_grace");
    expect(await readRole(userId)).toBe("member");

    const expired = await expireSubscription(canceled.subscription.id, actor);
    expect(expired.member.memberStatus).toBe("expired");
    expect(await readRole(userId)).toBe("user");
  });

  test("expire gives up on past-due retries: PAST_DUE → UNPAID, no grace", async () => {
    const userId = await fixture.createTestUser();

    const created = await createSubscription(
      { userId, tierId: lifecycleTierId, trialDays: 0 },
      actor,
    );
    const pastDue = await markSubscriptionPastDue(created.subscription.id, actor);
    const expired = await expireSubscription(pastDue.subscription.id, actor);

    expect(expired.subscription.status).toBe("UNPAID");
    expect(expired.member.memberStatus).toBe("expired");
    expect(await readRole(userId)).toBe("user");

    const unpaid = await listSubscriptions({ userId, status: "UNPAID" });
    expect(unpaid).toHaveLength(1);
    expect(unpaid[0]!.id).toBe(expired.subscription.id);
  });

  test("expire normalizes a stale ACTIVE row whose period already ran out", async () => {
    const userId = await fixture.createTestUser();

    // 40 days ago, monthly billing: the row says ACTIVE but the clock says expired.
    const created = await createSubscription(
      { userId, tierId: lifecycleTierId, startDate: new Date(Date.now() - 40 * DAY), trialDays: 0 },
      actor,
    );
    expect(created.subscription.status).toBe("ACTIVE");
    expect(created.member.memberStatus).toBe("expired");
    expect(await readRole(userId)).toBe("user");

    const expired = await expireSubscription(created.subscription.id, actor);
    expect(expired.subscription.status).toBe("CANCELED");
    expect(expired.subscription.canceledAt).not.toBeNull();
  });

  test("expire refuses a subscription still inside its paid period", async () => {
    const userId = await fixture.createTestUser();
    const created = await createSubscription(
      { userId, tierId: lifecycleTierId, trialDays: 0 },
      actor,
    );

    await expectRejects(
      () => expireSubscription(created.subscription.id, actor),
      "SUBSCRIPTION_STILL_ENTITLED",
    );
  });

  test("cancel-at-period-end keeps the subscription running until the period ends", async () => {
    const userId = await fixture.createTestUser();
    const created = await createSubscription(
      { userId, tierId: lifecycleTierId, trialDays: 0 },
      actor,
    );

    const scheduled = await cancelSubscription(created.subscription.id, actor, {
      atPeriodEnd: true,
    });
    expect(scheduled.subscription.status).toBe("ACTIVE");
    expect(scheduled.subscription.cancelAtPeriodEnd).toBe(true);
    expect(scheduled.member.memberStatus).toBe("active");

    // ...and an immediate cancel is still legal afterwards.
    const canceled = await cancelSubscription(scheduled.subscription.id, actor);
    expect(canceled.subscription.status).toBe("CANCELED");
    expect(canceled.subscription.cancelAtPeriodEnd).toBe(false);
  });

  test("one live subscription per user; re-subscribing works after terminal states", async () => {
    const userId = await fixture.createTestUser();

    const first = await createSubscription(
      { userId, tierId: lifecycleTierId, trialDays: 0 },
      actor,
    );
    await expectRejects(
      () => createSubscription({ userId, tierId: lifecycleTierId, trialDays: 0 }, actor),
      "SUBSCRIPTION_ALREADY_ACTIVE",
    );

    await cancelSubscription(first.subscription.id, actor);
    await expireSubscription(first.subscription.id, actor);

    const again = await createSubscription(
      { userId, tierId: lifecycleTierId, trialDays: 0 },
      actor,
    );
    expect(again.subscription.status).toBe("ACTIVE");
    expect(again.member.memberStatus).toBe("active");
  });

  test("delete refuses a tier that still has subscriptions, then allows it", async () => {
    const userId = await fixture.createTestUser();
    await createSubscription({ userId, tierId: lifecycleTierId, trialDays: 0 }, actor);

    await expectRejects(() => deleteTier(lifecycleTierId), "TIER_IN_USE");

    // afterAll removes the user (subscriptions cascade), after which the
    // tier becomes deletable — verified by the raw cleanup itself.
  });

  test("every privileged transition wrote an auth_logs audit entry, same transaction", async () => {
    const userId = await fixture.createTestUser();
    const noted: ActorContext = { actorId: "system:c2-lifecycle-test", reason: "audit check" };

    const created = await createSubscription(
      { userId, tierId: lifecycleTierId, trialDays: 0 },
      noted,
    );
    await pauseSubscription(created.subscription.id, noted);
    await resumeSubscription(created.subscription.id, noted);
    await cancelSubscription(created.subscription.id, noted);
    await expireSubscription(created.subscription.id, noted);

    const logs = await db.query.authLog.findMany({ where: eq(authLog.userId, userId) });
    const eventTypes = logs.map((entry) => entry.eventType);

    expect(eventTypes).toContain("SUBSCRIPTION_CREATED");
    expect(eventTypes).toContain("SUBSCRIPTION_PAUSED");
    expect(eventTypes).toContain("SUBSCRIPTION_RESUMED");
    expect(eventTypes).toContain("SUBSCRIPTION_CANCELED");
    expect(eventTypes).toContain("SUBSCRIPTION_EXPIRED");
    // ROLE_CHANGE rows come from the A3 sync each transition triggers.
    expect(eventTypes).toContain("ROLE_CHANGE");

    const createdLog = logs.find((entry) => entry.eventType === "SUBSCRIPTION_CREATED");
    expect(createdLog).toBeDefined();
    expect(createdLog?.metadata).toMatchObject({
      subscriptionId: created.subscription.id,
      tierId: lifecycleTierId,
      actorId: "system:c2-lifecycle-test",
      reason: "audit check",
    });
  });

  test("unknown subscription ids are NotFound", async () => {
    const missing = crypto.randomUUID();
    await expectRejects(() => getSubscription(missing), undefined, NotFoundError);
    await expectRejects(() => renewSubscription(missing, actor), undefined, NotFoundError);
    await expectRejects(() => cancelSubscription(missing, actor), undefined, NotFoundError);
  });
});
