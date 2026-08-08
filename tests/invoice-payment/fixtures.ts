/**
 * Shared fixtures for the C3 invoice/payment test parts (the *.test.ts
 * siblings in this folder). Every row created through these helpers is
 * tracked and removed by `cleanupTestData`, which each part registers in
 * its own `afterAll`; names carry a unique suffix so runs never collide.
 */

import { and, count, eq } from "drizzle-orm";
import type Stripe from "stripe";
import { expect } from "bun:test";
import { db } from "@/db/client";
import { authLog, membershipTier, membershipWebhookEvent, user } from "@/db/schema";
import { BusinessLogicError, NotFoundError } from "@/lib/errors";
import { GatewayError } from "@/lib/payments/gateway";
import { StripeGateway } from "@/lib/payments/stripe";
import { createTier } from "@/lib/services/membership-tier.service";
import { createSubscription, type ActorContext } from "@/lib/services/subscription.service";

export const suffix = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
export const actor: ActorContext = { actorId: "system:c3-invoice-payment-test" };

const createdUserIds: string[] = [];
const createdTierIds: string[] = [];
const claimedWebhookEvents: { provider: string; eventId: string }[] = [];

export async function createTestUser(): Promise<string> {
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

export async function createTestTier(namePrefix: string, displayName: string): Promise<string> {
  const tier = await createTier({
    name: `${namePrefix}-${suffix()}`,
    displayName,
    price: "12.00",
    billingCycle: "monthly",
  });
  createdTierIds.push(tier.id);
  return tier.id;
}

export async function createTestSubscription(
  tierId: string,
): Promise<{ memberId: string; subscriptionId: string }> {
  const memberId = await createTestUser();
  const created = await createSubscription({ userId: memberId, tierId, trialDays: 0 }, actor);
  return { memberId, subscriptionId: created.subscription.id };
}

export function trackWebhookEvent(provider: string, eventId: string): void {
  claimedWebhookEvents.push({ provider, eventId });
}

export async function auditCount(eventType: string, userId?: string): Promise<number> {
  const conditions = [eq(authLog.eventType, eventType)];
  if (userId) conditions.push(eq(authLog.userId, userId));
  const [row] = await db
    .select({ n: count() })
    .from(authLog)
    .where(and(...conditions));
  return row.n;
}

export async function expectRejects(
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

export async function cleanupTestData(): Promise<void> {
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
  claimedWebhookEvents.length = 0;
  createdUserIds.length = 0;
  createdTierIds.length = 0;
}

/**
 * Test seam: builds a StripeGateway whose entire SDK surface is mocked.
 * The adapter's own logic (validation, mapping, error wrapping) runs for
 * real; only the network client is fake.
 */
export function buildMockedStripeGateway(
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

export function stripeEvent(type: string, object: Record<string, unknown>): Stripe.Event {
  return { id: `evt_${suffix()}`, type, data: { object } } as unknown as Stripe.Event;
}

/**
 * A StripeGateway whose real state-mapping code runs while every SDK call
 * is a no-op; used to drive `processGatewayWebhook` end to end.
 */
export function buildNoopStripeGateway(): StripeGateway {
  return new StripeGateway({
    apiKey: "sk_test_fake_key",
    webhookSecret: "whsec_fake_secret",
    client: {
      checkout: { sessions: { create: async () => ({}) as Stripe.Checkout.Session } },
      webhooks: { constructEvent: () => ({}) as Stripe.Event },
      paymentIntents: { retrieve: async () => ({}) as Stripe.PaymentIntent },
      charges: { retrieve: async () => ({}) as Stripe.Charge },
    },
  });
}
