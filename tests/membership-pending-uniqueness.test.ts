import { afterAll, describe, expect, test } from "bun:test";
import { and, eq } from "drizzle-orm";
import type Stripe from "stripe";
import { db } from "@/db/client";
import { membershipSubscription } from "@/db/schema";
import { BusinessLogicError } from "@/lib/errors";
import { joinMembership } from "@/lib/services/membership-join.service";
import { buildMockedStripeGateway } from "./invoice-payment/fixtures";
import { createFunnelFixtures } from "./membership-funnel/fixtures";

const fx = createFunnelFixtures();
const SYSTEM_ACTOR = { actorId: "system:pending-uniqueness" };

afterAll(fx.cleanup);

describe("membership pending-payment uniqueness", () => {
  test("allows only one pending checkout per user under concurrency", async () => {
    const { userId } = await fx.signUp("stripe-joiner-concurrent");
    const tierId = await fx.seedTier({ displayName: `Concurrent ${fx.RUN_ID}`, price: "49.00" });
    const first = buildMockedStripeGateway({
      createSession: () =>
        ({
          id: `cs_first_${fx.RUN_ID}`,
          url: "https://checkout.stripe.test/first",
        }) as Stripe.Checkout.Session,
    });
    const second = buildMockedStripeGateway({
      createSession: () =>
        ({
          id: `cs_second_${fx.RUN_ID}`,
          url: "https://checkout.stripe.test/second",
        }) as Stripe.Checkout.Session,
    });

    const results = await Promise.allSettled([
      joinMembership({ userId, tierId, gateway: first.gateway }, SYSTEM_ACTOR),
      joinMembership({ userId, tierId, gateway: second.gateway }, SYSTEM_ACTOR),
    ]);
    const pending = await db.query.membershipSubscription.findMany({
      where: and(
        eq(membershipSubscription.userId, userId),
        eq(membershipSubscription.status, "PENDING_PAYMENT"),
      ),
    });

    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    const rejected = results.find((result) => result.status === "rejected");
    expect(rejected?.reason).toBeInstanceOf(BusinessLogicError);
    expect(pending).toHaveLength(1);
    expect(first.calls.sessions.length + second.calls.sessions.length).toBe(1);
  });
});
