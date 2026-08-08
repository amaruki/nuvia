/**
 * Backlog C3 — invoice creation, payment recording, and the Stripe adapter,
 * exercised against the shared test database (real tables, real enums).
 *
 * Coverage:
 * - invoice.service: issuance with default/custom line items, exact
 *   minor-unit math, listing + filters, the ISSUED→VOID transition,
 * - payment.service: manual (treasurer) recording with the single-
 *   transaction ledger write, partial payments, overpayment/state guards,
 * - the Stripe adapter against a mocked SDK surface (no network ever):
 *   checkout params, signature verification errors, event mapping, state
 *   tables, charge queries,
 * - verified-webhook processing end to end: renewal, invoice
 *   reconciliation, idempotency, failure compensation,
 * - the C3 error codes' RFC 9457 mapping.
 *
 * Every row this file creates is removed in afterAll; names carry a unique
 * suffix so runs never collide.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { and, count, eq } from "drizzle-orm";
import type Stripe from "stripe";
import { problemFromFinanceError } from "@/app/api/v1/finance/_lib/helpers";
import { db } from "@/db/client";
import {
  authLog,
  membershipInvoice,
  membershipPayment,
  membershipTier,
  membershipTransaction,
  membershipWebhookEvent,
  user,
} from "@/db/schema";
import { BusinessLogicError, NotFoundError } from "@/lib/errors";
import {
  GatewayError,
  toMinorUnits,
  type PaymentGateway,
  type VerifiedWebhookEvent,
} from "@/lib/payments/gateway";
import { StripeGateway, stripeEventMeta } from "@/lib/payments/stripe";
import {
  createInvoice,
  getInvoice,
  listInvoices,
  voidInvoice,
} from "@/lib/services/invoice.service";
import { createTier } from "@/lib/services/membership-tier.service";
import {
  getPayment,
  listPayments,
  processGatewayWebhook,
  recordPayment,
} from "@/lib/services/payment.service";
import {
  cancelSubscription,
  createSubscription,
  getSubscription,
  type ActorContext,
} from "@/lib/services/subscription.service";
import {
  createInvoiceSchema,
  invoiceListQuerySchema,
  recordPaymentSchema,
} from "@/lib/validation/finance.validation";

const suffix = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const actor: ActorContext = { actorId: "system:c3-invoice-payment-test" };

const createdUserIds: string[] = [];
const createdTierIds: string[] = [];
const claimedWebhookEvents: { provider: string; eventId: string }[] = [];

async function createTestUser(): Promise<string> {
  const stamp = suffix();
  const [row] = await db
    .insert(user)
    .values({
      username: `c3-${stamp}`,
      email: `c3-${stamp}@example.test`,
      name: "C3 Invoice Payment Test",
      role: "user",
      emailVerified: false,
    })
    .returning({ id: user.id });

  createdUserIds.push(row.id);
  return row.id;
}

async function auditCount(eventType: string, userId?: string): Promise<number> {
  const conditions = [eq(authLog.eventType, eventType)];
  if (userId) conditions.push(eq(authLog.userId, userId));
  const [row] = await db
    .select({ n: count() })
    .from(authLog)
    .where(and(...conditions));
  return row.n;
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
  if (code !== undefined && err instanceof GatewayError) {
    expect(err.code).toBe(code);
  }
}

afterAll(async () => {
  // Webhook idempotency claims have no FK; remove them explicitly. Users
  // cascade everything else (subscriptions, invoices, items, payments,
  // transactions, audit rows); tiers go last.
  for (const claim of claimedWebhookEvents) {
    await db
      .delete(membershipWebhookEvent)
      .where(
        and(
          eq(membershipWebhookEvent.provider, claim.provider),
          eq(membershipWebhookEvent.eventId, claim.eventId),
        ),
      );
  }
  for (const id of createdUserIds) {
    await db.delete(user).where(eq(user.id, id));
  }
  for (const id of createdTierIds) {
    await db.delete(membershipTier).where(eq(membershipTier.id, id));
  }
});

describe("invoice issuance (invoice.service)", () => {
  let memberId: string;
  let tierId: string;
  let subscriptionId: string;

  beforeAll(async () => {
    memberId = await createTestUser();
    const tier = await createTier({
      name: `c3-invoice-${suffix()}`,
      displayName: "C3 Invoice Tier",
      price: "12.00",
      billingCycle: "monthly",
    });
    tierId = tier.id;
    createdTierIds.push(tier.id);

    const created = await createSubscription({ userId: memberId, tierId, trialDays: 0 }, actor);
    subscriptionId = created.subscription.id;
  });

  test("issues an ISSUED invoice with a default line item from the tier", async () => {
    const invoice = await createInvoice({ subscriptionId }, actor);

    expect(invoice.status).toBe("ISSUED");
    expect(invoice.invoiceNumber).toMatch(/^INV-\d{4}-[0-9A-Z]{6}$/);
    expect(invoice.userId).toBe(memberId);
    expect(invoice.subscriptionId).toBe(subscriptionId);
    expect(invoice.tierId).toBe(tierId);
    expect(invoice.currency).toBe("USD");
    expect(invoice.subtotal).toBe("12.00");
    expect(invoice.taxAmount).toBe("0.00");
    expect(invoice.totalAmount).toBe("12.00");
    expect(invoice.paidAmount).toBe("0.00");

    expect(invoice.items).toHaveLength(1);
    expect(invoice.items[0].quantity).toBe(1);
    expect(invoice.items[0].unitPrice).toBe("12.00");
    expect(invoice.items[0].amount).toBe("12.00");
    expect(invoice.items[0].description).toContain("C3 Invoice Tier");

    expect(await auditCount("INVOICE_CREATED", memberId)).toBeGreaterThanOrEqual(1);
  });

  test("custom items are extended and summed in exact integer minor units", async () => {
    const invoice = await createInvoice(
      {
        subscriptionId,
        items: [
          { description: "Stickers", quantity: 3, unitPrice: "19.99" },
          { description: "Postage", quantity: 1, unitPrice: "0.10" },
        ],
      },
      actor,
    );

    // 3 × 1999 + 10 = 6007 minor units — no float drift.
    expect(invoice.items[0].amount).toBe("59.97");
    expect(invoice.items[1].amount).toBe("0.10");
    expect(invoice.subtotal).toBe("60.07");
    expect(invoice.totalAmount).toBe("60.07");
  });

  test("rejects an unknown subscription", async () => {
    await expectRejects(
      () => createInvoice({ subscriptionId: "missing-subscription" }, actor),
      undefined,
      NotFoundError,
    );
  });

  test("getInvoice returns items; unknown id rejects", async () => {
    const created = await createInvoice({ subscriptionId }, actor);
    const fetched = await getInvoice(created.id);
    expect(fetched.invoiceNumber).toBe(created.invoiceNumber);
    expect(fetched.items).toHaveLength(1);

    await expectRejects(() => getInvoice("missing-invoice"), undefined, NotFoundError);
  });

  test("listInvoices filters by subscription/user/status and paginates", async () => {
    await createInvoice({ subscriptionId }, actor);
    await createInvoice({ subscriptionId }, actor);

    const page1 = await listInvoices({ subscriptionId, page: 1, limit: 2 });
    expect(page1.invoices).toHaveLength(2);
    expect(page1.total).toBeGreaterThanOrEqual(4);

    const page2 = await listInvoices({ subscriptionId, page: 2, limit: 2 });
    expect(page2.invoices.length).toBeGreaterThanOrEqual(1);
    expect(page2.invoices[0].id).not.toBe(page1.invoices[0].id);

    const byUser = await listInvoices({ userId: memberId, page: 1, limit: 100 });
    expect(byUser.total).toBe(page1.total);

    const issued = await listInvoices({ subscriptionId, status: "ISSUED", page: 1, limit: 100 });
    expect(issued.invoices.length).toBeGreaterThanOrEqual(1);
    for (const invoice of issued.invoices) {
      expect(invoice.status).toBe("ISSUED");
    }
  });

  test("voidInvoice moves ISSUED → VOID with an audit row", async () => {
    const invoice = await createInvoice({ subscriptionId }, actor);
    const voided = await voidInvoice(invoice.id, actor);

    expect(voided.status).toBe("VOID");
    expect(voided.invoiceNumber).toBe(invoice.invoiceNumber);
    expect(await auditCount("INVOICE_VOIDED", memberId)).toBeGreaterThanOrEqual(1);

    // Re-voiding surfaces the state collision instead of no-opping.
    await expectRejects(() => voidInvoice(invoice.id, actor), "INVOICE_NOT_VOIDABLE");
  });

  test("voiding a PAID invoice is rejected; unknown id rejects", async () => {
    const invoice = await createInvoice({ subscriptionId }, actor);
    await recordPayment({ invoiceId: invoice.id, amount: "12.00" }, actor);

    await expectRejects(() => voidInvoice(invoice.id, actor), "INVOICE_NOT_VOIDABLE");
    await expectRejects(() => voidInvoice("missing-invoice", actor), undefined, NotFoundError);
  });
});

describe("manual payment recording (payment.service)", () => {
  let memberId: string;
  let subscriptionId: string;
  let settledInvoiceId: string;

  beforeAll(async () => {
    memberId = await createTestUser();
    const tier = await createTier({
      name: `c3-payment-${suffix()}`,
      displayName: "C3 Payment Tier",
      price: "12.00",
      billingCycle: "monthly",
    });
    createdTierIds.push(tier.id);

    const created = await createSubscription(
      { userId: memberId, tierId: tier.id, trialDays: 0 },
      actor,
    );
    subscriptionId = created.subscription.id;
  });

  test("records a full payment: ledger row, payment row, PAID invoice, audit", async () => {
    const invoice = await createInvoice({ subscriptionId }, actor);
    const result = await recordPayment(
      {
        invoiceId: invoice.id,
        amount: "12.00",
        paymentMethod: "bank_transfer",
        reason: "check 123",
      },
      actor,
    );
    settledInvoiceId = invoice.id;

    expect(result.invoice.status).toBe("PAID");
    expect(result.invoice.paidAmount).toBe("12.00");

    expect(result.payment.status).toBe("COMPLETED");
    expect(result.payment.amount).toBe("12.00");
    expect(result.payment.invoiceId).toBe(invoice.id);
    expect(result.payment.transactionId).toBe(result.transaction.id);
    expect(result.payment.paymentMethod).toBe("bank_transfer");
    expect(result.payment.paymentProvider).toBe("manual");
    expect(result.payment.providerTxId).toStartWith("manual_");
    expect(result.payment.metadata).toEqual({ reason: "check 123" });

    expect(result.transaction.status).toBe("COMPLETED");
    expect(result.transaction.amount).toBe("12.00");
    expect(result.transaction.subscriptionId).toBe(subscriptionId);
    expect(result.transaction.description).toContain(invoice.invoiceNumber);

    // The ledger row is really there (same db.transaction wrote it).
    const [ledgerRow] = await db
      .select()
      .from(membershipTransaction)
      .where(eq(membershipTransaction.id, result.transaction.id));
    expect(ledgerRow.providerTxId).toBe(result.payment.providerTxId);

    expect(await auditCount("PAYMENT_RECORDED", memberId)).toBeGreaterThanOrEqual(1);
  });

  test("partial payments keep ISSUED until the invoice is settled", async () => {
    const invoice = await createInvoice(
      { subscriptionId, items: [{ description: "Bundle", quantity: 3, unitPrice: "10.00" }] },
      actor,
    );

    const first = await recordPayment({ invoiceId: invoice.id, amount: "10.00" }, actor);
    expect(first.invoice.status).toBe("ISSUED");
    expect(first.invoice.paidAmount).toBe("10.00");

    const second = await recordPayment({ invoiceId: invoice.id, amount: "20.00" }, actor);
    expect(second.invoice.status).toBe("PAID");
    expect(second.invoice.paidAmount).toBe("30.00");
  });

  test("overpayment is rejected and writes nothing", async () => {
    const invoice = await createInvoice({ subscriptionId }, actor);

    await expectRejects(
      () => recordPayment({ invoiceId: invoice.id, amount: "12.01" }, actor),
      "OVERPAYMENT_NOT_ALLOWED",
    );

    const { payments, total } = await listPayments({ invoiceId: invoice.id, page: 1, limit: 10 });
    expect(total).toBe(0);
    expect(payments).toHaveLength(0);

    // Nothing was paid either.
    const fresh = await getInvoice(invoice.id);
    expect(fresh.status).toBe("ISSUED");
    expect(fresh.paidAmount).toBe("0.00");
  });

  test("payments against PAID and VOID invoices are rejected", async () => {
    await expectRejects(
      () => recordPayment({ invoiceId: settledInvoiceId, amount: "1.00" }, actor),
      "INVOICE_NOT_PAYABLE",
    );

    const invoice = await createInvoice({ subscriptionId }, actor);
    await voidInvoice(invoice.id, actor);
    await expectRejects(
      () => recordPayment({ invoiceId: invoice.id, amount: "1.00" }, actor),
      "INVOICE_NOT_PAYABLE",
    );
  });

  test("unknown invoice rejects", async () => {
    await expectRejects(
      () => recordPayment({ invoiceId: "missing-invoice", amount: "1.00" }, actor),
      undefined,
      NotFoundError,
    );
  });

  test("listPayments filters; getPayment round-trips and rejects unknown", async () => {
    const listed = await listPayments({ subscriptionId, page: 1, limit: 100 });
    expect(listed.total).toBeGreaterThanOrEqual(3);
    for (const payment of listed.payments) {
      expect(payment.subscriptionId).toBe(subscriptionId);
    }

    const fetched = await getPayment(listed.payments[0].id);
    expect(fetched.id).toBe(listed.payments[0].id);

    await expectRejects(() => getPayment("missing-payment"), undefined, NotFoundError);
  });
});

describe("C3 error codes map to RFC 9457 problems", () => {
  test("state collisions answer 409, other business errors 400, missing rows 404", () => {
    expect(
      problemFromFinanceError(new BusinessLogicError("x", "OVERPAYMENT_NOT_ALLOWED"), "t").status,
    ).toBe(409);
    expect(
      problemFromFinanceError(new BusinessLogicError("x", "INVOICE_NOT_PAYABLE"), "t").status,
    ).toBe(409);
    expect(
      problemFromFinanceError(new BusinessLogicError("x", "INVOICE_NOT_VOIDABLE"), "t").status,
    ).toBe(409);
    expect(problemFromFinanceError(new BusinessLogicError("x", "SOMETHING_ELSE"), "t").status).toBe(
      400,
    );
    expect(problemFromFinanceError(new NotFoundError("Invoice", "id"), "t").status).toBe(404);
  });
});

describe("Stripe adapter — mocked SDK, no network", () => {
  /**
   * Test seam: builds a StripeGateway whose entire SDK surface is mocked.
   * The adapter's own logic (validation, mapping, error wrapping) runs for
   * real; only the network client is fake.
   */
  function buildMockedStripeGateway(
    handlers: {
      createSession?: (params: Stripe.Checkout.SessionCreateParams) => Stripe.Checkout.Session;
      constructEvent?: (payload: string, header: string, secret: string) => Stripe.Event;
      retrieveIntent?: (id: string) => Stripe.PaymentIntent;
      retrieveCharge?: (id: string) => Stripe.Charge;
    } = {},
  ) {
    const calls = {
      sessions: [] as Stripe.Checkout.SessionCreateParams[],
      intents: [] as string[],
      charges: [] as string[],
    };

    const gateway = new StripeGateway({
      apiKey: "sk_test_fake_key",
      webhookSecret: "whsec_fake_secret",
      client: {
        checkout: {
          sessions: {
            create: async (params) => {
              calls.sessions.push(params);
              if (!handlers.createSession) throw new Error("unexpected checkout call");
              return handlers.createSession(params);
            },
          },
        },
        webhooks: {
          constructEvent: (payload, header, secret) => {
            if (!handlers.constructEvent) throw new Error("signature check failed");
            return handlers.constructEvent(payload, header, secret);
          },
        },
        paymentIntents: {
          retrieve: async (id) => {
            calls.intents.push(id);
            if (!handlers.retrieveIntent) throw new Error("no such intent");
            return handlers.retrieveIntent(id);
          },
        },
        charges: {
          retrieve: async (id) => {
            calls.charges.push(id);
            if (!handlers.retrieveCharge) throw new Error("no such charge");
            return handlers.retrieveCharge(id);
          },
        },
      },
    });

    return { gateway, calls };
  }

  function stripeEvent(type: string, object: Record<string, unknown>): Stripe.Event {
    return { id: `evt_${suffix()}`, type, data: { object } } as unknown as Stripe.Event;
  }

  test("constructor rejects when STRIPE_SECRET_KEY is missing", () => {
    // The parsed env may legitimately carry a key in some environments; the
    // guard only applies where the boot-time check is the real protection.
    if (process.env.STRIPE_SECRET_KEY) return;

    const err: unknown = (() => {
      try {
        return new StripeGateway();
      } catch (error) {
        return error;
      }
    })();
    expect(err).toBeInstanceOf(GatewayError);
    expect((err as GatewayError).code).toBe("MISSING_CREDENTIALS");
  });

  test("createCheckout builds a payment-mode session in minor units", async () => {
    const { gateway, calls } = buildMockedStripeGateway({
      createSession: () =>
        ({
          id: "cs_test_1",
          url: "https://checkout.stripe.test/sess_1",
          payment_intent: "pi_test_1",
          status: "open",
        }) as unknown as Stripe.Checkout.Session,
    });

    const result = await gateway.createCheckout({
      userId: "user-1",
      subscriptionId: "sub-1",
      tierId: "tier-1",
      tierName: "Gold",
      amountMinor: 1200,
      currency: "usd",
      returnUrl: "https://app.test/return",
    });

    expect(result.checkoutUrl).toBe("https://checkout.stripe.test/sess_1");
    expect(result.providerTxId).toBe("pi_test_1");
    expect(result.providerState).toBe("open");

    expect(calls.sessions).toHaveLength(1);
    const params = calls.sessions[0];
    expect(params.mode).toBe("payment");
    expect(params.client_reference_id).toBe("user-1");
    expect(params.metadata?.subscriptionId).toBe("sub-1");
    expect(params.metadata?.tierId).toBe("tier-1");
    expect(params.success_url).toBe("https://app.test/return");
    expect(params.cancel_url).toBe("https://app.test/return");

    const line = params.line_items?.[0];
    expect(line?.quantity).toBe(1);
    expect(line?.price_data?.unit_amount).toBe(1200);
    expect(line?.price_data?.currency).toBe("usd");
    expect(line?.price_data?.product_data?.name).toBe("Gold");
  });

  test("createCheckout rejects non-positive minor amounts before any provider call", async () => {
    const { gateway, calls } = buildMockedStripeGateway();
    await expectRejects(
      () =>
        gateway.createCheckout({
          userId: "u",
          subscriptionId: "s",
          tierId: "t",
          tierName: "X",
          amountMinor: 0,
          currency: "usd",
        }),
      "INVALID_AMOUNT",
      GatewayError,
    );
    expect(calls.sessions).toHaveLength(0);
  });

  test("createCheckout wraps provider failures in PROVIDER_ERROR", async () => {
    const { gateway } = buildMockedStripeGateway({
      createSession: () => {
        throw new Error("stripe is down");
      },
    });

    const err: unknown = await gateway
      .createCheckout({
        userId: "u",
        subscriptionId: "s",
        tierId: "t",
        tierName: "X",
        amountMinor: 500,
        currency: "usd",
      })
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(GatewayError);
    expect((err as GatewayError).code).toBe("PROVIDER_ERROR");
  });

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

describe("verified-webhook processing end to end (payment.service)", () => {
  let tierId: string;
  const { gateway: mockedStripe } = (() => {
    // The adapter's real state-mapping code runs; only the SDK is mocked.
    const gateway = new StripeGateway({
      apiKey: "sk_test_fake_key",
      webhookSecret: "whsec_fake_secret",
      client: {
        checkout: { sessions: { create: async () => ({}) as Stripe.Checkout.Session } },
        webhooks: { constructEvent: () => ({}) as Stripe.Event },
        paymentIntents: { retrieve: async () => ({}) as Stripe.PaymentIntent },
        charges: { retrieve: async () => ({}) as Stripe.Charge },
      },
    });
    return { gateway };
  })();

  beforeAll(async () => {
    const tier = await createTier({
      name: `c3-webhook-${suffix()}`,
      displayName: "C3 Webhook Tier",
      price: "12.00",
      billingCycle: "monthly",
    });
    tierId = tier.id;
    createdTierIds.push(tier.id);
  });

  async function freshActiveSubscription(): Promise<{ memberId: string; subscriptionId: string }> {
    const memberId = await createTestUser();
    const created = await createSubscription({ userId: memberId, tierId, trialDays: 0 }, actor);
    return { memberId, subscriptionId: created.subscription.id };
  }

  test("checkout.session.completed renews, writes the ledger, settles the invoice", async () => {
    const { memberId, subscriptionId } = await freshActiveSubscription();
    const invoice = await createInvoice({ subscriptionId }, actor);
    const eventId = `evt_${suffix()}`;
    claimedWebhookEvents.push({ provider: "stripe", eventId });

    const event: VerifiedWebhookEvent = {
      providerTxId: "pi_evt_1",
      providerState: "complete",
      subscriptionId,
      raw: { amount_total: 1200, currency: "usd" },
    };

    const result = await processGatewayWebhook(
      event,
      { eventId, eventType: "checkout.session.completed" },
      actor,
      mockedStripe,
    );

    expect(result.duplicate).toBe(false);
    expect(result.action).toBe("renewed");
    expect(result.transactionId).toBeDefined();
    // Renewal swaps in a new row (ADR-0014).
    expect(result.subscriptionId).not.toBe(subscriptionId);
    const renewed = await getSubscription(result.subscriptionId!);
    expect(renewed.status).toBe("ACTIVE");
    expect(renewed.metadata).toEqual({ renewedFrom: subscriptionId });

    // Ledger row from the webhook.
    const [ledgerRow] = await db
      .select()
      .from(membershipTransaction)
      .where(eq(membershipTransaction.id, result.transactionId!));
    expect(ledgerRow.status).toBe("COMPLETED");
    expect(ledgerRow.amount).toBe("12.00");
    expect(ledgerRow.providerTxId).toBe("pi_evt_1");
    expect(ledgerRow.paymentProvider).toBe("stripe");

    // Invoice reconciliation crossed the renewal row swap: the invoice was
    // issued against the OLD subscription row and still settled.
    const settled = await getInvoice(invoice.id);
    expect(settled.status).toBe("PAID");
    expect(settled.paidAmount).toBe("12.00");

    const { payments } = await listPayments({ invoiceId: invoice.id, page: 1, limit: 10 });
    expect(payments).toHaveLength(1);
    expect(payments[0].paymentProvider).toBe("stripe");
    expect(payments[0].transactionId).toBe(result.transactionId ?? null);

    expect(await auditCount("WEBHOOK_PROCESSED", memberId)).toBe(1);
  });

  test("duplicate delivery is a no-op", async () => {
    const { subscriptionId } = await freshActiveSubscription();
    const eventId = `evt_${suffix()}`;
    claimedWebhookEvents.push({ provider: "stripe", eventId });

    const event: VerifiedWebhookEvent = {
      providerTxId: "pi_dup_1",
      providerState: "complete",
      subscriptionId,
      raw: { amount_total: 1200, currency: "usd" },
    };
    const context = { eventId, eventType: "checkout.session.completed" };

    const first = await processGatewayWebhook(event, context, actor, mockedStripe);
    expect(first.duplicate).toBe(false);

    const second = await processGatewayWebhook(event, context, actor, mockedStripe);
    expect(second.duplicate).toBe(true);
    expect(second.action).toBe("none");

    const [txCount] = await db
      .select({ n: count() })
      .from(membershipTransaction)
      .where(eq(membershipTransaction.providerTxId, "pi_dup_1"));
    expect(txCount.n).toBe(1);
  });

  test("failed payment marks the subscription PAST_DUE with a FAILED ledger row", async () => {
    const { subscriptionId } = await freshActiveSubscription();
    const eventId = `evt_${suffix()}`;
    claimedWebhookEvents.push({ provider: "stripe", eventId });

    const result = await processGatewayWebhook(
      { providerTxId: "pi_fail_1", providerState: "failed", subscriptionId, raw: { amount: 1200 } },
      { eventId, eventType: "payment_intent.payment_failed" },
      actor,
      mockedStripe,
    );

    expect(result.action).toBe("past-due");
    const subscription = await getSubscription(result.subscriptionId!);
    expect(subscription.status).toBe("PAST_DUE");

    const [ledgerRow] = await db
      .select()
      .from(membershipTransaction)
      .where(eq(membershipTransaction.id, result.transactionId!));
    expect(ledgerRow.status).toBe("FAILED");
  });

  test("canceled payment intent cancels the subscription", async () => {
    const { subscriptionId } = await freshActiveSubscription();
    const eventId = `evt_${suffix()}`;
    claimedWebhookEvents.push({ provider: "stripe", eventId });

    const result = await processGatewayWebhook(
      {
        providerTxId: "pi_cancel_1",
        providerState: "canceled",
        subscriptionId,
        raw: { amount: 1200 },
      },
      { eventId, eventType: "payment_intent.canceled" },
      actor,
      mockedStripe,
    );

    expect(result.action).toBe("canceled");
    const subscription = await getSubscription(result.subscriptionId!);
    expect(subscription.status).toBe("CANCELED");

    const [ledgerRow] = await db
      .select()
      .from(membershipTransaction)
      .where(eq(membershipTransaction.id, result.transactionId!));
    expect(ledgerRow.status).toBe("CANCELED");
  });

  test("a refund alone records a REFUNDED ledger row without touching the subscription", async () => {
    const { subscriptionId } = await freshActiveSubscription();
    const eventId = `evt_${suffix()}`;
    claimedWebhookEvents.push({ provider: "stripe", eventId });

    const result = await processGatewayWebhook(
      {
        providerTxId: "ch_refund_1",
        providerState: "refunded",
        subscriptionId,
        raw: { amount: 1200 },
      },
      { eventId, eventType: "charge.refunded" },
      actor,
      mockedStripe,
    );

    expect(result.action).toBe("recorded");
    const subscription = await getSubscription(subscriptionId);
    expect(subscription.status).toBe("ACTIVE");

    const [ledgerRow] = await db
      .select()
      .from(membershipTransaction)
      .where(eq(membershipTransaction.id, result.transactionId!));
    expect(ledgerRow.status).toBe("REFUNDED");
  });

  test("orphaned events are audited, claimed, and answered without writes", async () => {
    const eventId = `evt_${suffix()}`;
    claimedWebhookEvents.push({ provider: "stripe", eventId });
    const orphansBefore = await auditCount("WEBHOOK_ORPHANED");

    const result = await processGatewayWebhook(
      {
        providerTxId: "pi_orphan",
        providerState: "complete",
        subscriptionId: "missing-sub",
        raw: {},
      },
      { eventId, eventType: "checkout.session.completed" },
      actor,
      mockedStripe,
    );

    expect(result.action).toBe("none");
    expect(result.transactionId).toBeUndefined();
    expect(await auditCount("WEBHOOK_ORPHANED")).toBe(orphansBefore + 1);

    // The claim row persists by design, so retries stay no-ops.
    const retry = await processGatewayWebhook(
      {
        providerTxId: "pi_orphan",
        providerState: "complete",
        subscriptionId: "missing-sub",
        raw: {},
      },
      { eventId, eventType: "checkout.session.completed" },
      actor,
      mockedStripe,
    );
    expect(retry.duplicate).toBe(true);
  });

  test("lifecycle collisions are swallowed; the ledger row still lands", async () => {
    const { subscriptionId } = await freshActiveSubscription();
    await cancelSubscription(subscriptionId, actor);
    const eventId = `evt_${suffix()}`;
    claimedWebhookEvents.push({ provider: "stripe", eventId });

    const result = await processGatewayWebhook(
      {
        providerTxId: "pi_late_1",
        providerState: "complete",
        subscriptionId,
        raw: { amount: 1200 },
      },
      { eventId, eventType: "checkout.session.completed" },
      actor,
      mockedStripe,
    );

    // Renewal is illegal for a canceled subscription, but the event is
    // genuinely processed — no infinite provider retries.
    expect(result.action).toBe("recorded");
    const [ledgerRow] = await db
      .select()
      .from(membershipTransaction)
      .where(eq(membershipTransaction.id, result.transactionId!));
    expect(ledgerRow.status).toBe("COMPLETED");
  });

  test("processing failure releases the idempotency claim for the retry", async () => {
    const { subscriptionId } = await freshActiveSubscription();
    const eventId = `evt_${suffix()}`;
    claimedWebhookEvents.push({ provider: "stripe", eventId });

    const brokenGateway: PaymentGateway = {
      provider: "stripe",
      createCheckout: async () => ({
        checkoutUrl: null,
        providerTxId: null,
        providerState: "open",
      }),
      verifyWebhook: async () => {
        throw new GatewayError("not used", "WEBHOOKS_NOT_SUPPORTED");
      },
      getChargeStatus: async () => {
        throw new GatewayError("not used", "QUERY_NOT_SUPPORTED");
      },
      toTransactionStatus: () => {
        throw new GatewayError("boom", "UNKNOWN_STATE");
      },
      toSubscriptionStatus: () => null,
    };

    const event: VerifiedWebhookEvent = {
      providerTxId: "pi_retry_1",
      providerState: "complete",
      subscriptionId,
      raw: { amount_total: 1200 },
    };
    const context = { eventId, eventType: "checkout.session.completed" };

    await expectRejects(
      () => processGatewayWebhook(event, context, actor, brokenGateway),
      "UNKNOWN_STATE",
      GatewayError,
    );

    // The compensating delete gave the claim back...
    const claim = await db.query.membershipWebhookEvent.findFirst({
      where: and(
        eq(membershipWebhookEvent.provider, "stripe"),
        eq(membershipWebhookEvent.eventId, eventId),
      ),
    });
    expect(claim).toBeUndefined();

    // ...so the provider's retry (now hitting a healthy mapping) succeeds.
    const retry = await processGatewayWebhook(event, context, actor, mockedStripe);
    expect(retry.duplicate).toBe(false);
    expect(retry.action).toBe("renewed");
  });
});

describe("C3 validation schemas", () => {
  test("recordPaymentSchema requires a money amount", () => {
    expect(recordPaymentSchema.safeParse({ invoiceId: "i", amount: "12.00" }).success).toBe(true);
    expect(recordPaymentSchema.safeParse({ invoiceId: "i", amount: "abc" }).success).toBe(false);
    expect(recordPaymentSchema.safeParse({ invoiceId: "", amount: "1.00" }).success).toBe(false);
  });

  test("createInvoiceSchema defaults item quantity to 1", () => {
    const parsed = createInvoiceSchema.safeParse({
      subscriptionId: "sub-1",
      items: [{ description: "Dues", unitPrice: "12.00" }],
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.items?.[0].quantity).toBe(1);
    }
  });

  test("list queries coerce page/limit strings", () => {
    const parsed = invoiceListQuerySchema.safeParse({ page: "2", limit: "50", status: "PAID" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.page).toBe(2);
      expect(parsed.data.limit).toBe(50);
      expect(parsed.data.status).toBe("PAID");
    }
    expect(invoiceListQuerySchema.safeParse({ limit: "500" }).success).toBe(false);
  });

  test("toMinorUnits stays exact across the adapter boundary", () => {
    expect(toMinorUnits("60.07")).toBe(6007);
    expect(toMinorUnits("0.10")).toBe(10);
  });
});
