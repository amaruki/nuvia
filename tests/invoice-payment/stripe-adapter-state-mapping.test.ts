/**
 * Backlog C3 — the Stripe adapter against a mocked SDK surface (no network
 * ever): state-mapping tables, charge queries, and raw event metadata.
 * One part of the split tests/invoice-payment.test.ts; the mocked-gateway
 * seam lives in ./fixtures.
 */

import { describe, expect, test } from "bun:test";
import type Stripe from "stripe";
import { GatewayError } from "@/lib/payments/gateway";
import { stripeEventMeta } from "@/lib/payments/stripe";
import { buildMockedStripeGateway, expectRejects } from "./fixtures";

describe("Stripe adapter — mocked SDK, no network", () => {
  test("state tables map Stripe states onto internal statuses", () => {
    const { gateway } = buildMockedStripeGateway();

    expect(gateway.toTransactionStatus("complete")).toBe("COMPLETED");
    expect(gateway.toTransactionStatus("succeeded")).toBe("COMPLETED");
    expect(gateway.toTransactionStatus("failed")).toBe("FAILED");
    expect(gateway.toTransactionStatus("canceled")).toBe("CANCELED");
    expect(gateway.toTransactionStatus("expired")).toBe("CANCELED");
    expect(gateway.toTransactionStatus("refunded")).toBe("REFUNDED");
    expect(gateway.toTransactionStatus("requires_action")).toBe("PENDING");

    expect(gateway.toSubscriptionStatus("complete")).toBe("ACTIVE");
    expect(gateway.toSubscriptionStatus("failed")).toBe("PAST_DUE");
    expect(gateway.toSubscriptionStatus("canceled")).toBe("CANCELED");
    // Refunds alone never change the subscription (parity with manual).
    expect(gateway.toSubscriptionStatus("refunded")).toBeNull();
    expect(gateway.toSubscriptionStatus("expired")).toBeNull();

    expect(() => gateway.toTransactionStatus("nonsense")).toThrow(GatewayError);
    expect(() => gateway.toSubscriptionStatus("nonsense")).toThrow(GatewayError);
  });

  test("getChargeStatus routes by id prefix and wraps failures", async () => {
    const { gateway, calls } = buildMockedStripeGateway({
      retrieveCharge: () =>
        ({
          id: "ch_1",
          amount: 1000,
          amount_refunded: 0,
          refunded: false,
          status: "succeeded",
        }) as unknown as Stripe.Charge,
      retrieveIntent: (id) => {
        if (id !== "pi_1") throw new Error("no such intent");
        return {
          id: "pi_1",
          amount: 2000,
          status: "requires_action",
        } as unknown as Stripe.PaymentIntent;
      },
    });

    const charge = await gateway.getChargeStatus("ch_1");
    expect(charge.providerState).toBe("succeeded");
    expect(charge.amountMinor).toBe(1000);
    expect(calls.charges).toEqual(["ch_1"]);
    expect(calls.intents).toHaveLength(0);

    const intent = await gateway.getChargeStatus("pi_1");
    expect(intent.providerState).toBe("requires_action");
    expect(intent.amountMinor).toBe(2000);
    expect(calls.intents).toEqual(["pi_1"]);

    await expectRejects(
      () => gateway.getChargeStatus("pi_missing"),
      "CHARGE_QUERY_FAILED",
      GatewayError,
    );
  });

  test("stripeEventMeta extracts id/type from raw payloads only", () => {
    expect(stripeEventMeta({ id: "evt_1", type: "charge.succeeded" })).toEqual({
      id: "evt_1",
      type: "charge.succeeded",
    });
    expect(stripeEventMeta({ id: 42, type: "x" })).toBeNull();
    expect(stripeEventMeta(null)).toBeNull();
  });
});
