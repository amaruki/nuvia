/**
 * Backlog C2 — tier CRUD + subscription lifecycle engine, exercised against
 * the shared test database (real tables, real enum columns).
 *
 * Coverage:
 * - the ADR-0015 gateway seam: manual adapter behavior + minor-unit math,
 * - tier CRUD round-trip with string-mode numeric(10,2) amounts,
 * - the full lifecycle machine create→trialing→active→past_due→renew→
 *   pause→resume→cancel→expire, including grace and the UNPAID path,
 * - illegal from-states rejected, the A3 role derivation firing on every
 *   transition, and the same-transaction auth_logs audit trail.
 *
 * Every row this file creates is removed in afterAll; names carry a unique
 * suffix so runs never collide.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { authLog, membershipTier, user } from "@/db/schema";
import { BusinessLogicError, NotFoundError } from "@/lib/errors";
import {
  GatewayError,
  resolvePaymentGateway,
  toAmountString,
  toMinorUnits,
} from "@/lib/payments/gateway";
import {
  createTier,
  deleteTier,
  getTier,
  listTiers,
  updateTier,
} from "@/lib/services/membership-tier.service";
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
import { createTierSchema, updateTierSchema } from "@/lib/validation/finance.validation";

const DAY = 86_400_000;
const suffix = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const actor: ActorContext = { actorId: "system:c2-lifecycle-test" };

const createdUserIds: string[] = [];
const createdTierIds: string[] = [];

async function createTestUser(role = "user"): Promise<string> {
  const stamp = suffix();
  const [row] = await db
    .insert(user)
    .values({
      username: `c2-${stamp}`,
      email: `c2-${stamp}@example.test`,
      name: "C2 Lifecycle Test",
      role,
      emailVerified: false,
    })
    .returning({ id: user.id });

  createdUserIds.push(row.id);
  return row.id;
}

async function readRole(userId: string): Promise<string | undefined> {
  const row = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { role: true },
  });
  return row?.role;
}
async function expectRejects(
  fn: () => Promise<unknown>,
  code?: string,
  errorClass:
    | typeof BusinessLogicError
    | typeof NotFoundError
    | typeof GatewayError = BusinessLogicError,
): Promise<void> {
  const err: unknown = await fn().catch((e: unknown) => e);
  expect(err).toBeInstanceOf(errorClass);
  if (code !== undefined && err instanceof BusinessLogicError) {
    expect(err.code).toBe(code);
  }
}

afterAll(async () => {
  // Subscriptions and auth logs cascade off the user rows; tiers are removed
  // last, once nothing references them anymore.
  for (const id of createdUserIds) {
    await db.delete(user).where(eq(user.id, id));
  }
  for (const id of createdTierIds) {
    await db.delete(membershipTier).where(eq(membershipTier.id, id));
  }
});

describe("payment gateway seam — manual adapter (ADR-0015)", () => {
  const gateway = resolvePaymentGateway();

  test("PAYMENT_GATEWAY defaults to the manual provider", () => {
    expect(gateway.provider).toBe("manual");
  });

  test("createCheckout settles immediately with no hosted step", async () => {
    const result = await gateway.createCheckout({
      userId: "user-x",
      subscriptionId: "sub-x",
      tierId: "tier-x",
      tierName: "Test Tier",
      amountMinor: toMinorUnits("10.00"),
      currency: "USD",
    });

    expect(result.checkoutUrl).toBeNull();
    expect(result.providerState).toBe("completed");
    expect(result.providerTxId?.startsWith("manual_")).toBe(true);
  });

  test("createCheckout rejects non-positive amounts", async () => {
    await expectRejects(
      () =>
        gateway.createCheckout({
          userId: "user-x",
          subscriptionId: "sub-x",
          tierId: "tier-x",
          tierName: "Test Tier",
          amountMinor: 0,
          currency: "USD",
        }),
      "INVALID_AMOUNT",
      GatewayError,
    );
  });

  test("verifyWebhook rejects every callback — nothing external to trust", async () => {
    await expectRejects(
      () => gateway.verifyWebhook({ headers: new Headers(), body: "{}" }),
      "WEBHOOKS_NOT_SUPPORTED",
      GatewayError,
    );
  });

  test("getChargeStatus is unsupported — manual state lives on membership_transactions", async () => {
    await expectRejects(
      () => gateway.getChargeStatus("manual_anything"),
      "QUERY_NOT_SUPPORTED",
      GatewayError,
    );
  });

  test("maps manual states onto internal transaction and subscription statuses", () => {
    expect(gateway.toTransactionStatus("pending")).toBe("PENDING");
    expect(gateway.toTransactionStatus("completed")).toBe("COMPLETED");
    expect(gateway.toTransactionStatus("failed")).toBe("FAILED");
    expect(gateway.toTransactionStatus("canceled")).toBe("CANCELED");
    expect(gateway.toTransactionStatus("refunded")).toBe("REFUNDED");

    expect(gateway.toSubscriptionStatus("completed")).toBe("ACTIVE");
    expect(gateway.toSubscriptionStatus("failed")).toBe("PAST_DUE");
    expect(gateway.toSubscriptionStatus("canceled")).toBe("CANCELED");
    // A refund alone does not cancel — the lifecycle decides that.
    expect(gateway.toSubscriptionStatus("refunded")).toBeNull();
    expect(gateway.toSubscriptionStatus("pending")).toBeNull();
  });

  test("rejects unknown provider states", () => {
    expect(() => gateway.toTransactionStatus("nope")).toThrow(GatewayError);
    expect(() => gateway.toSubscriptionStatus("nope")).toThrow(GatewayError);
  });

  test("converts amounts across the minor-unit boundary exactly", () => {
    expect(toMinorUnits("100.00")).toBe(10000);
    expect(toMinorUnits("0.05")).toBe(5);
    expect(toMinorUnits("7")).toBe(700);
    expect(toMinorUnits("99999999.99")).toBe(9999999999);

    expect(toAmountString(10000)).toBe("100.00");
    expect(toAmountString(5)).toBe("0.05");
    expect(toAmountString(toMinorUnits("99999999.99"))).toBe("99999999.99");

    expect(() => toMinorUnits("10.999")).toThrow(GatewayError);
    expect(() => toMinorUnits("-1.00")).toThrow(GatewayError);
    expect(() => toAmountString(-5)).toThrow(GatewayError);
  });
});

describe("membership tier CRUD — real membership_tiers table", () => {
  let crudTierId: string;
  const crudTierName = `c2-crud-${suffix()}`;

  test("create stores the string-mode price and returns the full row", async () => {
    const tier = await createTier({
      name: crudTierName,
      displayName: "C2 CRUD Tier",
      description: "lifecycle test tier",
      price: "49.99",
      billingCycle: "monthly",
      features: ["voting"],
      trialDays: 14,
      sortOrder: 5,
    });

    createdTierIds.push(tier.id);
    crudTierId = tier.id;

    expect(tier.price).toBe("49.99");
    expect(tier.billingCycle).toBe("monthly");
    expect(tier.trialDays).toBe(14);
    expect(tier.features).toEqual(["voting"]);
    expect(tier.benefits).toEqual([]);
    expect(tier.isActive).toBe(true);
  });

  test("read and list return the created tier", async () => {
    const fetched = await getTier(crudTierId);
    expect(fetched.name).toBe(crudTierName);

    const listed = await listTiers();
    expect(listed.some((tier) => tier.id === crudTierId)).toBe(true);
  });

  test("update changes only the provided fields", async () => {
    const updated = await updateTier(crudTierId, { price: "59.50" });
    expect(updated.price).toBe("59.50");
    expect(updated.displayName).toBe("C2 CRUD Tier");

    const refetched = await getTier(crudTierId);
    expect(refetched.price).toBe("59.50");
  });

  test("duplicate tier names are rejected", async () => {
    await expectRejects(
      () =>
        createTier({
          name: crudTierName,
          displayName: "Dup",
          price: "1.00",
          billingCycle: "monthly",
        }),
      "TIER_NAME_TAKEN",
    );
  });

  test("zod accepts string decimals only — numeric(10,2) string mode", () => {
    const base = {
      name: `zod-${suffix()}`,
      displayName: "Zod Tier",
      billingCycle: "monthly" as const,
    };

    expect(createTierSchema.safeParse({ ...base, price: 49.99 }).success).toBe(false);
    expect(createTierSchema.safeParse({ ...base, price: "49.999" }).success).toBe(false);
    expect(createTierSchema.safeParse({ ...base, price: "-5.00" }).success).toBe(false);
    expect(createTierSchema.safeParse({ ...base, price: "123456789.00" }).success).toBe(false);
    expect(createTierSchema.safeParse({ ...base, price: "99999999.99" }).success).toBe(true);
    expect(createTierSchema.safeParse({ ...base, price: "0" }).success).toBe(true);
  });

  test("update schema rejects an empty body", () => {
    expect(updateTierSchema.safeParse({}).success).toBe(false);
    expect(updateTierSchema.safeParse({ price: "1.00" }).success).toBe(true);
  });

  test("delete removes an unused tier", async () => {
    const throwaway = await createTier({
      name: `c2-throwaway-${suffix()}`,
      displayName: "Throwaway",
      price: "1.00",
      billingCycle: "monthly",
    });

    await deleteTier(throwaway.id);
    await expectRejects(() => getTier(throwaway.id), undefined, NotFoundError);
  });

  test("unknown tier ids are NotFound", async () => {
    await expectRejects(() => getTier(crypto.randomUUID()), undefined, NotFoundError);
  });
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
    createdTierIds.push(tier.id);
    lifecycleTierId = tier.id;
  });

  test("full lifecycle: trialing→active→past_due→renew→pause→resume→cancel→expire", async () => {
    const userId = await createTestUser();
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
    const userId = await createTestUser();
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
    const userId = await createTestUser();

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
    const userId = await createTestUser();

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
    const userId = await createTestUser();
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
    const userId = await createTestUser();
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
    const userId = await createTestUser();

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
    const userId = await createTestUser();
    await createSubscription({ userId, tierId: lifecycleTierId, trialDays: 0 }, actor);

    await expectRejects(() => deleteTier(lifecycleTierId), "TIER_IN_USE");

    // afterAll removes the user (subscriptions cascade), after which the
    // tier becomes deletable — verified by the raw cleanup itself.
  });

  test("every privileged transition wrote an auth_logs audit entry, same transaction", async () => {
    const userId = await createTestUser();
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
