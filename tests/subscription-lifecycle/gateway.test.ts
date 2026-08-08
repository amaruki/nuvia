/**
 * Backlog C2 split — the ADR-0015 gateway seam: manual adapter behavior and
 * minor-unit math. Pure unit coverage; creates no database rows.
 */

import { describe, expect, test } from "bun:test";
import {
  GatewayError,
  resolvePaymentGateway,
  toAmountString,
  toMinorUnits,
} from "@/lib/payments/gateway";
import { expectRejects } from "./helpers";

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
