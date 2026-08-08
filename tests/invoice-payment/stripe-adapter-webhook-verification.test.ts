/**
 * Backlog C3 — the Stripe adapter against a mocked SDK surface (no network
 * ever): webhook signature verification and event mapping.
 * One part of the split tests/invoice-payment.test.ts; the mocked-gateway
 * seam lives in ./fixtures.
 */

import { describe, expect, test } from "bun:test";
import { GatewayError } from "@/lib/payments/gateway";
import { buildMockedStripeGateway, expectRejects, stripeEvent } from "./fixtures";

describe("Stripe adapter — mocked SDK, no network", () => {
  test("verifyWebhook rejects a missing signature header", async () => {
    const { gateway } = buildMockedStripeGateway();
    await expectRejects(
      () => gateway.verifyWebhook({ headers: new Headers(), body: "{}" }),
      "WEBHOOK_SIGNATURE_MISSING",
      GatewayError,
    );
  });

  test("verifyWebhook rejects an invalid signature", async () => {
    const { gateway } = buildMockedStripeGateway();
    await expectRejects(
      () =>
        gateway.verifyWebhook({
          headers: new Headers({ "stripe-signature": "t=1,v1=bad" }),
          body: "{}",
        }),
      "WEBHOOK_SIGNATURE_INVALID",
      GatewayError,
    );
  });

  test("verifyWebhook maps checkout.session.completed from session metadata", async () => {
    const { gateway } = buildMockedStripeGateway({
      constructEvent: () =>
        stripeEvent("checkout.session.completed", {
          id: "cs_9",
          object: "checkout.session",
          payment_intent: "pi_9",
          payment_status: "paid",
          status: "complete",
          amount_total: 1200,
          currency: "usd",
          metadata: { subscriptionId: "sub-9" },
        }),
    });

    const event = await gateway.verifyWebhook({
      headers: new Headers({ "stripe-signature": "t=1,v1=ok" }),
      body: "raw-bytes",
    });

    expect(event.providerTxId).toBe("pi_9");
    expect(event.providerState).toBe("complete");
    expect(event.subscriptionId).toBe("sub-9");
  });

  test("verifyWebhook maps charge.refunded full vs partial", async () => {
    const make = (amountRefunded: number) =>
      buildMockedStripeGateway({
        constructEvent: () =>
          stripeEvent("charge.refunded", {
            id: "ch_1",
            object: "charge",
            amount: 1000,
            amount_refunded: amountRefunded,
            metadata: { subscriptionId: "sub-1" },
          }),
      }).gateway;

    const full = await make(1000).verifyWebhook({
      headers: new Headers({ "stripe-signature": "s" }),
      body: "b",
    });
    expect(full.providerState).toBe("refunded");

    const partial = await make(400).verifyWebhook({
      headers: new Headers({ "stripe-signature": "s" }),
      body: "b",
    });
    expect(partial.providerState).toBe("partially_refunded");
  });

  test("verifyWebhook maps failure, cancellation, and provider-invoice events", async () => {
    const cases: { type: string; object: Record<string, unknown>; state: string; txId: string }[] =
      [
        {
          type: "payment_intent.payment_failed",
          object: { id: "pi_f", amount: 1200, metadata: { subscriptionId: "s1" } },
          state: "failed",
          txId: "pi_f",
        },
        {
          type: "payment_intent.canceled",
          object: { id: "pi_c", amount: 1200, metadata: { subscriptionId: "s1" } },
          state: "canceled",
          txId: "pi_c",
        },
        {
          type: "charge.succeeded",
          object: { id: "ch_s", amount: 1200, metadata: { subscriptionId: "s1" } },
          state: "succeeded",
          txId: "ch_s",
        },
        {
          type: "invoice.paid",
          object: { id: "in_p", metadata: { subscriptionId: "s1" } },
          state: "paid",
          txId: "in_p",
        },
        {
          type: "invoice.payment_failed",
          object: { id: "in_f", metadata: { subscriptionId: "s1" } },
          state: "failed",
          txId: "in_f",
        },
      ];

    for (const testCase of cases) {
      const { gateway } = buildMockedStripeGateway({
        constructEvent: () => stripeEvent(testCase.type, testCase.object),
      });
      const event = await gateway.verifyWebhook({
        headers: new Headers({ "stripe-signature": "s" }),
        body: "b",
      });
      expect(event.providerState).toBe(testCase.state);
      expect(event.providerTxId).toBe(testCase.txId);
      expect(event.subscriptionId).toBe("s1");
    }
  });

  test("unsupported event types reject with WEBHOOK_EVENT_UNSUPPORTED", async () => {
    const { gateway } = buildMockedStripeGateway({
      constructEvent: () => stripeEvent("customer.created", { id: "cus_1" }),
    });
    await expectRejects(
      () => gateway.verifyWebhook({ headers: new Headers({ "stripe-signature": "s" }), body: "b" }),
      "WEBHOOK_EVENT_UNSUPPORTED",
      GatewayError,
    );
  });
});
