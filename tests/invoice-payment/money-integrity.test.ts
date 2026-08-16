/**
 * Money-integrity regression suite (issues #20/#21/#24/#26):
 *
 *  - #24 one Stripe checkout charge fans out as checkout.session.completed +
 *    payment_intent.succeeded + charge.succeeded; only the session-completed
 *    event may renew the subscription and settle the ledger, and the ledger
 *    itself is idempotent per webhook event id (retry cannot double-settle).
 *  - #20 renewSubscription is idempotent per source row — concurrent
 *    double-renewals produce exactly ONE renewal row.
 *  - #21 a PAUSED subscription cannot open a renewal checkout (the state
 *    machine would refuse its success webhook).
 *  - #26 recordPayment validates inside the locked transaction — concurrent
 *    full recordings serialize and exactly one succeeds.
 */

import { afterAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  membershipInvoice,
  membershipPayment,
  membershipSubscription,
  membershipTransaction,
} from "@/db/schema";
import { BusinessLogicError } from "@/lib/errors";
import { GatewayError, toMinorUnits } from "@/lib/payments/gateway";
import { processGatewayWebhook } from "@/lib/services/payment.service";
import { pauseSubscription, renewSubscription } from "@/lib/services/subscription.service";
import { recordPayment } from "@/lib/services/payment.service";
import { createInvoice } from "@/lib/services/invoice.service";
import { renewMembershipCheckout } from "@/lib/services/membership-join.service";
import {
  actor,
  auditCount,
  buildNoopStripeGateway,
  cleanupTestData,
  createTestSubscription,
  createTestTier,
  suffix,
  trackWebhookEvent,
} from "./fixtures";

afterAll(cleanupTestData);

const mockedStripe = buildNoopStripeGateway();

describe("money integrity — webhook fan-out and renewal idempotency", () => {
  test("#24 one charge: three COMPLETED webhooks renew exactly once and settle once", async () => {
    const tierId = await createTestTier("mi-fanout", "MI Fanout Tier");
    const { subscriptionId } = await createTestSubscription(tierId);
    const charge = `pi_fanout_${suffix()}`;

    // 1) checkout.session.completed — the settlement event.
    const evtSettle = `evt_settle_${suffix()}`;
    trackWebhookEvent("stripe", evtSettle);
    const settleResult = await processGatewayWebhook(
      { providerTxId: charge, providerState: "complete", subscriptionId, raw: { amount: 1200 } },
      { eventId: evtSettle, eventType: "checkout.session.completed" },
      actor,
      mockedStripe,
    );
    expect(settleResult.action).toBe("renewed");
    expect(settleResult.transactionId).toBeDefined();

    // 2) payment_intent.succeeded — fan-out sibling: audited, no renewal, no ledger.
    const duplicatesBefore = await auditCount("WEBHOOK_INFORMATIONAL_DUPLICATE");
    const evtIntent = `evt_intent_${suffix()}`;
    trackWebhookEvent("stripe", evtIntent);
    const intentResult = await processGatewayWebhook(
      { providerTxId: charge, providerState: "succeeded", subscriptionId, raw: { amount: 1200 } },
      { eventId: evtIntent, eventType: "payment_intent.succeeded" },
      actor,
      mockedStripe,
    );
    expect(intentResult.action).toBe("none");
    expect(intentResult.transactionId).toBeUndefined();

    // 3) charge.succeeded — same treatment.
    const evtCharge = `evt_charge_${suffix()}`;
    trackWebhookEvent("stripe", evtCharge);
    const chargeResult = await processGatewayWebhook(
      { providerTxId: charge, providerState: "succeeded", subscriptionId, raw: { amount: 1200 } },
      { eventId: evtCharge, eventType: "charge.succeeded" },
      actor,
      mockedStripe,
    );
    expect(chargeResult.action).toBe("none");
    expect(chargeResult.transactionId).toBeUndefined();
    expect(await auditCount("WEBHOOK_INFORMATIONAL_DUPLICATE")).toBe(duplicatesBefore + 2);

    // Exactly ONE renewal row for the source, exactly ONE ledger settlement.
    const renewals = await db
      .select()
      .from(membershipSubscription)
      .where(eq(membershipSubscription.status, "ACTIVE"))
      .then((rows) =>
        rows.filter(
          (r) => (r.metadata as { renewedFrom?: string } | null)?.renewedFrom === subscriptionId,
        ),
      );
    expect(renewals).toHaveLength(1);

    const ledgerRows = await db
      .select()
      .from(membershipTransaction)
      .where(eq(membershipTransaction.providerTxId, charge));
    expect(ledgerRows).toHaveLength(1);
    expect(ledgerRows[0].status).toBe("COMPLETED");
  });

  test("adversarial round 4: a FAILED attempt never suppresses the later COMPLETED settlement of the same charge", async () => {
    // Adversarial probe 1: a failed payment attempt writes an informational
    // FAILED ledger row for the intent; the retry then succeeds with the
    // SAME providerTxId. The charge-level dedupe is scoped to prior
    // COMPLETED rows, so the COMPLETED settlement must still land.
    const tierId = await createTestTier("mi-failed-then-success", "MI Retry Tier");
    const { subscriptionId } = await createTestSubscription(tierId);
    const charge = `pi_retry_${suffix()}`;

    // 1) payment_intent.payment_failed — FAILED ledger row only.
    const evtFailed = `evt_failed_${suffix()}`;
    trackWebhookEvent("stripe", evtFailed);
    const failedResult = await processGatewayWebhook(
      { providerTxId: charge, providerState: "failed", subscriptionId, raw: { amount: 1200 } },
      { eventId: evtFailed, eventType: "payment_intent.payment_failed" },
      actor,
      mockedStripe,
    );
    expect(failedResult.action).toBe("past-due");

    // 2) checkout.session.completed on the SAME charge — must settle COMPLETED.
    const evtSettle = `evt_settle_retry_${suffix()}`;
    trackWebhookEvent("stripe", evtSettle);
    const settleResult = await processGatewayWebhook(
      { providerTxId: charge, providerState: "complete", subscriptionId, raw: { amount: 1200 } },
      { eventId: evtSettle, eventType: "checkout.session.completed" },
      actor,
      mockedStripe,
    );
    expect(settleResult.action).toBe("renewed");
    expect(settleResult.transactionId).toBeDefined();

    // 3) A second COMPLETED replay of the same charge is refused BEFORE the
    //    lifecycle by the charge-level settlement guard (issue #19/#24).
    const dupesBefore = await auditCount("WEBHOOK_CHARGE_ALREADY_SETTLED");
    const evtReplay = `evt_settle_replay_${suffix()}`;
    trackWebhookEvent("stripe", evtReplay);
    const replayResult = await processGatewayWebhook(
      { providerTxId: charge, providerState: "complete", subscriptionId, raw: { amount: 1200 } },
      { eventId: evtReplay, eventType: "checkout.session.completed" },
      actor,
      mockedStripe,
    );
    expect(replayResult.action).toBe("none");
    expect(await auditCount("WEBHOOK_CHARGE_ALREADY_SETTLED")).toBe(dupesBefore + 1);

    const ledgerRows = await db
      .select()
      .from(membershipTransaction)
      .where(eq(membershipTransaction.providerTxId, charge));
    const completed = ledgerRows.filter((r) => r.status === "COMPLETED");
    expect(completed).toHaveLength(1);
    expect(completed[0].metadata).toMatchObject({ webhookEventId: evtSettle });
  });

  test("#20 renewSubscription twice for one source: second call is a no-op (applied=false)", async () => {
    const tierId = await createTestTier("mi-idempotent", "MI Idempotent Tier");
    const { subscriptionId } = await createTestSubscription(tierId);

    const first = await renewSubscription(subscriptionId, actor);
    expect(first.applied).toBe(true);

    const second = await renewSubscription(subscriptionId, actor);
    expect(second.applied).toBe(false);
    expect(second.subscription.id).toBe(first.subscription.id);

    const renewals = await db
      .select()
      .from(membershipSubscription)
      .then((rows) =>
        rows.filter(
          (r) => (r.metadata as { renewedFrom?: string } | null)?.renewedFrom === subscriptionId,
        ),
      );
    expect(renewals).toHaveLength(1);
  });

  test("#20 concurrent double renewal lands exactly one row (row-lock serialization)", async () => {
    const tierId = await createTestTier("mi-race", "MI Race Tier");
    const { subscriptionId } = await createTestSubscription(tierId);

    const [a, b] = await Promise.all([
      renewSubscription(subscriptionId, actor),
      renewSubscription(subscriptionId, actor),
    ]);

    // One applied, one deduped — in either order.
    expect(a.applied !== b.applied).toBe(true);
    expect(a.subscription.id).toBe(b.subscription.id);

    const renewals = await db
      .select()
      .from(membershipSubscription)
      .then((rows) =>
        rows.filter(
          (r) => (r.metadata as { renewedFrom?: string } | null)?.renewedFrom === subscriptionId,
        ),
      );
    expect(renewals).toHaveLength(1);
  });

  test("#21 PAUSED subscription cannot open a renewal checkout", async () => {
    const tierId = await createTestTier("mi-paused", "MI Paused Tier");
    const { memberId, subscriptionId } = await createTestSubscription(tierId);
    await pauseSubscription(subscriptionId, actor);

    await expect(
      renewMembershipCheckout({ userId: memberId, subscriptionId }, actor),
    ).rejects.toMatchObject({ code: "RENEWAL_NOT_AVAILABLE" });
    expect(GatewayError).toBeDefined();
  });
});

describe("money integrity — manual payment recording race (#26)", () => {
  test("two concurrent full recordings serialize: exactly one succeeds", async () => {
    const tierId = await createTestTier("mi-record", "MI Record Tier");
    const { subscriptionId } = await createTestSubscription(tierId);
    const invoice = await createInvoice({ subscriptionId }, actor);

    const outcomes = await Promise.allSettled([
      recordPayment({ invoiceId: invoice.id, amount: invoice.totalAmount }, actor),
      recordPayment({ invoiceId: invoice.id, amount: invoice.totalAmount }, actor),
    ]);

    const successes = outcomes.filter((o) => o.status === "fulfilled");
    const failures = outcomes.filter((o) => o.status === "rejected");
    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
    const reason = (failures[0] as PromiseRejectedResult).reason;
    expect(reason).toBeInstanceOf(BusinessLogicError);
    // The loser observes the invoice AFTER the winner settled it: either
    // the balance check (OVERPAYMENT_NOT_ALLOWED) or the status check
    // (INVOICE_NOT_PAYABLE) rejects it — both prove no double payment landed.
    expect(["OVERPAYMENT_NOT_ALLOWED", "INVOICE_NOT_PAYABLE"]).toContain(
      (reason as BusinessLogicError).code,
    );

    // The invoice is paid exactly once — never overpaid.
    const [freshInvoice] = await db
      .select()
      .from(membershipInvoice)
      .where(eq(membershipInvoice.id, invoice.id))
      .limit(1);
    expect(toMinorUnits(freshInvoice.paidAmount)).toBe(toMinorUnits(invoice.totalAmount));

    const payments = await db
      .select()
      .from(membershipPayment)
      .where(eq(membershipPayment.invoiceId, invoice.id));
    expect(payments).toHaveLength(1);
  });
});

describe("money integrity — adversarial round 1 breaks", () => {
  test("renewal TOCTOU: a pause committed in the pre-transaction gap vetoes the renewal", async () => {
    // Deterministic reproduction of the adversarial A7 break: the old code
    // ran assertTransition on the pre-transaction read, so a pause committed
    // after the read but before the transaction slipped through and still
    // stacked a renewal row on a PAUSED subscription.
    const tierId = await createTestTier("mi-toctou", "MI TOCTOU Tier");
    const { memberId, subscriptionId } = await createTestSubscription(tierId);

    await expect(
      renewSubscription(subscriptionId, actor, {
        beforeTransaction: async () => {
          await pauseSubscription(subscriptionId, actor);
        },
      }),
    ).rejects.toMatchObject({ code: "INVALID_TRANSITION" });

    // No renewal row may exist for a source that was paused mid-flight.
    const rows = await db
      .select()
      .from(membershipSubscription)
      .where(eq(membershipSubscription.userId, memberId));
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("PAUSED");
  });

  test("same provider charge, two distinct event ids settles the ledger exactly once", async () => {
    // Adversarial break: ledger idempotency keyed only on webhookEventId let
    // two distinct event ids crediting ONE provider charge both settle. The
    // provider+provider_tx_id dedupe key must return the first settlement.
    const tierId = await createTestTier("mi-dualsettle", "MI Dual Settle Tier");
    const { memberId, subscriptionId } = await createTestSubscription(tierId);
    const charge = `pi_dualsettle_${suffix()}`;

    const evtA = `evt_dual_a_${suffix()}`;
    trackWebhookEvent("stripe", evtA);
    const first = await processGatewayWebhook(
      { providerTxId: charge, providerState: "complete", subscriptionId, raw: { amount: 1200 } },
      { eventId: evtA, eventType: "checkout.session.completed" },
      actor,
      mockedStripe,
    );

    const evtB = `evt_dual_b_${suffix()}`;
    trackWebhookEvent("stripe", evtB);
    const second = await processGatewayWebhook(
      { providerTxId: charge, providerState: "complete", subscriptionId, raw: { amount: 1200 } },
      { eventId: evtB, eventType: "checkout.session.completed" },
      actor,
      mockedStripe,
    );

    expect(first.action).toBe("renewed");
    expect(second.action).toBe("none");

    // Exactly ONE ledger row and ONE renewal row for the whole charge.
    const ledgers = await db
      .select()
      .from(membershipTransaction)
      .where(eq(membershipTransaction.providerTxId, charge));
    expect(ledgers).toHaveLength(1);
    expect(ledgers[0].status).toBe("COMPLETED");

    const rows = await db
      .select()
      .from(membershipSubscription)
      .where(eq(membershipSubscription.userId, memberId));
    const renewals = rows.filter(
      (r) => (r.metadata as { renewedFrom?: string } | null)?.renewedFrom === subscriptionId,
    );
    expect(renewals).toHaveLength(1);
  });
});
