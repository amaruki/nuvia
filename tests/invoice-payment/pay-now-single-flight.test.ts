/**
 * Issue #27 (finding 4) — pay-now single-flight guard.
 *
 * Before this fix, every pay-now click minted a fresh independently
 * payable Stripe session for the full outstanding balance: hit pay-now
 * five times, complete two, and the second completion charges against an
 * already-PAID invoice (double charge, manual reconciliation). The guard
 * serializes pay-now on the invoice row and reuses an open checkout for
 * the same balance within the TTL.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import type Stripe from "stripe";
import { BusinessLogicError } from "@/lib/errors";
import { createInvoice } from "@/lib/services/invoice.service";
import { recordPayment } from "@/lib/services/payment.service";
import { payMemberInvoice } from "@/lib/services/finance";
import {
  actor,
  buildMockedStripeGateway,
  cleanupTestData,
  createTestSubscription,
  createTestTier,
} from "./fixtures";

afterAll(cleanupTestData);

describe("pay-now single-flight (issue #27, finding 4)", () => {
  let tierId: string;
  let memberId: string;
  let subscriptionId: string;

  const mocked = buildMockedStripeGateway({
    createSession: () =>
      ({
        id: `cs_sf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        payment_intent: `pi_sf_${Date.now()}`,
        url: `https://checkout.stripe.com/c/pay/cs_sf_${Date.now()}`,
      }) as Stripe.Checkout.Session,
  });

  beforeAll(async () => {
    tierId = await createTestTier("sf-guard", "Single Flight Tier");
    const created = await createTestSubscription(tierId);
    memberId = created.memberId;
    subscriptionId = created.subscriptionId;
  });

  test("a repeat pay-now reuses the open checkout — one session for N clicks", async () => {
    const invoice = await createInvoice({ subscriptionId }, actor);

    const first = await payMemberInvoice(
      { userId: memberId, invoiceId: invoice.id, gateway: mocked.gateway },
      actor,
    );
    expect(first.track).toBe("stripe");
    if (first.track !== "stripe") throw new Error("unreachable");

    const sessionsBefore = mocked.calls.sessions.length;

    // Click storm: five more pay-now calls, sequential and concurrent.
    const repeats = await Promise.all([
      payMemberInvoice({ userId: memberId, invoiceId: invoice.id, gateway: mocked.gateway }, actor),
      payMemberInvoice({ userId: memberId, invoiceId: invoice.id, gateway: mocked.gateway }, actor),
      payMemberInvoice({ userId: memberId, invoiceId: invoice.id, gateway: mocked.gateway }, actor),
      payMemberInvoice({ userId: memberId, invoiceId: invoice.id, gateway: mocked.gateway }, actor),
      payMemberInvoice({ userId: memberId, invoiceId: invoice.id, gateway: mocked.gateway }, actor),
    ]);

    // Every call returns the SAME checkout — none of them minted a new one.
    for (const repeat of repeats) {
      expect(repeat.track).toBe("stripe");
      if (repeat.track !== "stripe") throw new Error("unreachable");
      expect(repeat.checkoutUrl).toBe(first.checkoutUrl);
    }
    expect(mocked.calls.sessions.length).toBe(sessionsBefore);
  });

  test("a balance change invalidates the cached checkout and mints a fresh one", async () => {
    const invoice = await createInvoice({ subscriptionId }, actor);

    const first = await payMemberInvoice(
      { userId: memberId, invoiceId: invoice.id, gateway: mocked.gateway },
      actor,
    );
    if (first.track !== "stripe") throw new Error("unreachable");

    // A partial payment lands (manual track), shrinking the balance.
    await recordPayment({ invoiceId: invoice.id, amount: "5.00", paymentMethod: "test" }, actor);

    const sessionsBefore = mocked.calls.sessions.length;
    const second = await payMemberInvoice(
      { userId: memberId, invoiceId: invoice.id, gateway: mocked.gateway },
      actor,
    );
    if (second.track !== "stripe") throw new Error("unreachable");

    // The old session is for the OLD balance — a new one must be minted for
    // the reduced outstanding amount (7.00 of 12.00).
    expect(mocked.calls.sessions.length).toBe(sessionsBefore + 1);
    const session = mocked.calls.sessions[mocked.calls.sessions.length - 1];
    expect(session.line_items?.[0]?.price_data?.unit_amount).toBe(700);
    expect(second.checkoutUrl).not.toBe(first.checkoutUrl);
  });

  test("paying off the invoice makes further pay-now refuse, cached session or not", async () => {
    const invoice = await createInvoice({ subscriptionId }, actor);
    await payMemberInvoice(
      { userId: memberId, invoiceId: invoice.id, gateway: mocked.gateway },
      actor,
    );

    // Settle the invoice in full.
    await recordPayment({ invoiceId: invoice.id, amount: "12.00", paymentMethod: "test" }, actor);

    const err = await payMemberInvoice(
      { userId: memberId, invoiceId: invoice.id, gateway: mocked.gateway },
      actor,
    ).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(BusinessLogicError);
    expect((err as BusinessLogicError).code).toBe("INVOICE_NOT_PAYABLE");
  });
});
