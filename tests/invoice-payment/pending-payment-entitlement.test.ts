/**
 * Issue #19 regression suite — join grants NO entitlement before payment.
 *
 * The old funnel created the subscription ACTIVE at checkout time, so an
 * abandoned checkout left a fully entitled member (role included) who never
 * paid. The funnel now creates the row PENDING_PAYMENT; the verified
 * checkout.session.completed webhook is the only path that activates it.
 */

import { afterAll, describe, expect, test } from "bun:test";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipSubscription, membershipTransaction, user } from "@/db/schema";
import {
  deriveMemberStatus,
  syncMemberStatusFromSubscription,
} from "@/lib/services/membership-status.service";
import { processGatewayWebhook } from "@/lib/services/payment.service";
import {
  activateSubscription,
  cancelSubscription,
  createSubscription,
} from "@/lib/services/subscription.service";
import { expireSubscription } from "@/lib/services/subscription.service";
import {
  actor,
  buildNoopStripeGateway,
  cleanupTestData,
  createTestTier,
  createTestUser,
  suffix,
  trackWebhookEvent,
} from "./fixtures";

afterAll(cleanupTestData);

const mockedStripe = buildNoopStripeGateway();

async function latestSubscription(userId: string) {
  const rows = await db.query.membershipSubscription.findMany({
    where: eq(membershipSubscription.userId, userId),
    orderBy: [desc(membershipSubscription.createdAt)],
  });
  return rows[0] ?? null;
}

describe("issue #19 — no entitlement before payment", () => {
  test("pending join creates no entitlement: status PENDING_PAYMENT, member status none, role untouched", async () => {
    const tierId = await createTestTier("i19-pending", "I19 Pending Tier");
    const memberId = await createTestUser();

    const { subscription, member } = await createSubscription(
      { userId: memberId, tierId, trialDays: 0, pendingPayment: true },
      actor,
    );

    expect(subscription.status).toBe("PENDING_PAYMENT");
    // A3 sync ran but derived NO entitlement — the role must stay `user`.
    expect(member.memberStatus).toBe("none");
    expect(member.role).toBe("user");
    expect(member.roleChanged).toBe(false);

    // The pure derivation agrees: PENDING_PAYMENT is never entitled.
    expect(deriveMemberStatus(subscription, new Date())).toBe("none");

    const [freshUser] = await db.select().from(user).where(eq(user.id, memberId)).limit(1);
    expect(freshUser.role).toBe("user");
  });

  test("admin-created subscriptions still start entitled (pendingPayment defaults false)", async () => {
    const tierId = await createTestTier("i19-admin", "I19 Admin Tier");
    const memberId = await createTestUser();

    const { subscription, member } = await createSubscription(
      { userId: memberId, tierId, trialDays: 0 },
      actor,
    );

    expect(subscription.status).toBe("ACTIVE");
    expect(member.memberStatus).toBe("active");
  });

  test("the success webhook activates the SAME row in place and grants the role", async () => {
    const tierId = await createTestTier("i19-activate", "I19 Activate Tier");
    const memberId = await createTestUser();
    const { subscription } = await createSubscription(
      { userId: memberId, tierId, trialDays: 0, pendingPayment: true },
      actor,
    );
    const charge = `pi_i19_${suffix()}`;

    const eventId = `evt_i19_${suffix()}`;
    trackWebhookEvent("stripe", eventId);
    const result = await processGatewayWebhook(
      {
        providerTxId: charge,
        providerState: "complete",
        subscriptionId: subscription.id,
        raw: { amount: 1200 },
      },
      { eventId, eventType: "checkout.session.completed" },
      actor,
      mockedStripe,
    );

    expect(result.action).toBe("activated");

    // Exactly ONE row for the member — activation is in place, no stacking.
    const fresh = await latestSubscription(memberId);
    expect(fresh?.id).toBe(subscription.id);
    expect(fresh?.status).toBe("ACTIVE");

    // Entitlement and member role arrive only now.
    const [freshUser] = await db.select().from(user).where(eq(user.id, memberId)).limit(1);
    expect(freshUser.role).toBe("member");
    expect(deriveMemberStatus(fresh!, new Date())).toBe("active");
  });

  test("repeat success events are idempotent: one entitlement, one ledger row", async () => {
    const tierId = await createTestTier("i19-repeat", "I19 Repeat Tier");
    const memberId = await createTestUser();
    const { subscription } = await createSubscription(
      { userId: memberId, tierId, trialDays: 0, pendingPayment: true },
      actor,
    );
    const charge = `pi_i19rep_${suffix()}`;

    const evtA = `evt_i19a_${suffix()}`;
    trackWebhookEvent("stripe", evtA);
    const first = await processGatewayWebhook(
      {
        providerTxId: charge,
        providerState: "complete",
        subscriptionId: subscription.id,
        raw: { amount: 1200 },
      },
      { eventId: evtA, eventType: "checkout.session.completed" },
      actor,
      mockedStripe,
    );
    expect(first.action).toBe("activated");

    // A distinct event id crediting the SAME charge must not grant again —
    // the charge-level guard vetoes it BEFORE any lifecycle runs.
    const evtB = `evt_i19b_${suffix()}`;
    trackWebhookEvent("stripe", evtB);
    const second = await processGatewayWebhook(
      {
        providerTxId: charge,
        providerState: "complete",
        subscriptionId: subscription.id,
        raw: { amount: 1200 },
      },
      { eventId: evtB, eventType: "checkout.session.completed" },
      actor,
      mockedStripe,
    );
    expect(second.action).toBe("none");
    expect(second.transactionId).toBeUndefined();

    // Same row ACTIVE, single ledger settlement for the whole charge.
    const fresh = await latestSubscription(memberId);
    expect(fresh?.status).toBe("ACTIVE");
    const ledgers = await db
      .select()
      .from(membershipTransaction)
      .where(eq(membershipTransaction.providerTxId, charge));
    expect(ledgers).toHaveLength(1);
  });

  test("activateSubscription rejects late activation of a non-pending row", async () => {
    const tierId = await createTestTier("i19-late", "I19 Late Tier");
    const memberId = await createTestUser();
    const { subscription } = await createSubscription(
      { userId: memberId, tierId, trialDays: 0, pendingPayment: true },
      actor,
    );
    await expireSubscription(subscription.id, actor);

    // The row is CANCELED now; a late activation must be refused.
    await expect(activateSubscription(subscription.id, actor)).rejects.toMatchObject({
      code: "INVALID_TRANSITION",
    });

    const fresh = await latestSubscription(memberId);
    expect(fresh?.status).toBe("CANCELED");
  });

  test("abandoned checkout expires to CANCELED with NO grace", async () => {
    const tierId = await createTestTier("i19-expire", "I19 Expire Tier");
    const memberId = await createTestUser();
    const { subscription } = await createSubscription(
      { userId: memberId, tierId, trialDays: 0, pendingPayment: true },
      actor,
    );

    const { subscription: expired } = await expireSubscription(subscription.id, actor);
    expect(expired.status).toBe("CANCELED");
    // The speculative period end is nulled: nothing paid, no grace window.
    expect(expired.currentPeriodEnd).toBeNull();
    expect(deriveMemberStatus(expired, new Date())).toBe("expired");

    // A late success webhook cannot resurrect it.
    const charge = `pi_i19dead_${suffix()}`;
    const eventId = `evt_i19dead_${suffix()}`;
    trackWebhookEvent("stripe", eventId);
    const result = await processGatewayWebhook(
      {
        providerTxId: charge,
        providerState: "complete",
        subscriptionId: subscription.id,
        raw: { amount: 1200 },
      },
      { eventId, eventType: "checkout.session.completed" },
      actor,
      mockedStripe,
    );
    expect(result.action).toBe("recorded");
    const fresh = await latestSubscription(memberId);
    expect(fresh?.status).toBe("CANCELED");

    const [freshUser] = await db.select().from(user).where(eq(user.id, memberId)).limit(1);
    expect(freshUser.role).toBe("user");
  });

  test("cancel of a pending checkout grants no grace either", async () => {
    const tierId = await createTestTier("i19-cancel", "I19 Cancel Tier");
    const memberId = await createTestUser();
    const { subscription } = await createSubscription(
      { userId: memberId, tierId, trialDays: 0, pendingPayment: true },
      actor,
    );

    const { subscription: canceled } = await cancelSubscription(subscription.id, actor);
    expect(canceled.status).toBe("CANCELED");
    expect(canceled.currentPeriodEnd).toBeNull();
    expect(deriveMemberStatus(canceled, new Date())).toBe("expired");
  });

  test("an entitled member can still renew after activation (funnel unchanged)", async () => {
    const tierId = await createTestTier("i19-renew", "I19 Renew Tier");
    const memberId = await createTestUser();
    const { subscription } = await createSubscription(
      { userId: memberId, tierId, trialDays: 0, pendingPayment: true },
      actor,
    );

    const { subscription: activated } = await activateSubscription(subscription.id, actor);
    expect(activated.status).toBe("ACTIVE");

    // Sync is idempotent — running it again changes nothing.
    const again = await syncMemberStatusFromSubscription(memberId);
    expect(again.memberStatus).toBe("active");
  });
});
