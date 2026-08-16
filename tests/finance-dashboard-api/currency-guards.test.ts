/**
 * Currency guards (issue #27, finding 2). Three distinct defects the
 * finding documented, each pinned here:
 *
 *  1. Aggregates mixed currencies face-value — a EUR COMPLETED row was added
 *     to the USD headline. getRevenueByPeriod / getRevenueByTier /
 *     getOutstandingSummary now EXCLUDE foreign rows and surface the count.
 *  2. toMinorUnits hardcoded x100 — a zero-decimal tier (JPY 10,000) would
 *     have been charged 100x. Conversion is now currency-aware.
 *  3. Donation currency accepted any 3-char string — now validated ISO 4217.
 *
 * The test database is shared, so aggregate assertions are DELTAS against a
 * baseline captured before seeding; every row this file creates is removed
 * in afterAll.
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipTier, membershipTransaction, user } from "@/db/schema";
import {
  BASE_CURRENCY,
  currencyExponent,
  toAmountString,
  toMinorUnits,
} from "@/lib/payments/gateway";
import {
  countExcludedForeignTransactions,
  getRevenueByPeriod,
  getRevenueByTier,
} from "@/lib/services/finance-report.service";
import { createSubscription, type ActorContext } from "@/lib/services/subscription.service";
import { donationCreateSchema } from "@/lib/validation/donation.validation";
import { minor, currentPeriodKey } from "./fixtures";

const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const createdUserIds: string[] = [];
const createdTierIds: string[] = [];
const actor: ActorContext = { actorId: "system:currency-guard-test" };

async function createTestUser(name: string): Promise<string> {
  const [row] = await db
    .insert(user)
    .values({
      username: `cur-${stamp}`,
      email: `cur-${stamp}@example.test`,
      name,
      role: "user",
      emailVerified: false,
    })
    .returning({ id: user.id });
  createdUserIds.push(row.id);
  return row.id;
}

describe("toMinorUnits / toAmountString currency awareness", () => {
  test("USD keeps 2-decimal minor units", () => {
    expect(toMinorUnits("10.00", "USD")).toBe(1000);
    expect(toAmountString(1000, "USD")).toBe("10.00");
  });

  test("zero-decimal JPY converts 1:1 (no 100x inflation)", () => {
    // The latent bug: 10,000 yen would have become 1,000,000 minor units.
    expect(currencyExponent("JPY")).toBe(0);
    expect(toMinorUnits("10000", "JPY")).toBe(10000);
    expect(toAmountString(10000, "JPY")).toBe("10000");
  });

  test("three-decimal BHD uses 3 minor digits", () => {
    expect(currencyExponent("BHD")).toBe(3);
    expect(toMinorUnits("10.500", "BHD")).toBe(10500);
    expect(toAmountString(10500, "BHD")).toBe("10.500");
  });

  test("rejects fractions beyond the currency's exponent", () => {
    expect(() => toMinorUnits("10.500", "USD")).toThrow();
    expect(() => toMinorUnits("10.5", "JPY")).toThrow();
  });
});

describe("donation currency validation", () => {
  test("accepts a valid ISO code", () => {
    const parsed = donationCreateSchema.safeParse({
      donorName: "Test",
      donorEmail: "d@example.test",
      amount: "10.00",
      currency: "EUR",
    });
    expect(parsed.success).toBe(true);
  });

  test("rejects non-alpha / wrong-length codes", () => {
    for (const bad of ["US", "USDD", "U$D", "123"]) {
      const parsed = donationCreateSchema.safeParse({
        donorName: "Test",
        donorEmail: "d@example.test",
        amount: "10.00",
        currency: bad,
      });
      expect(parsed.success).toBe(false);
    }
  });
});

describe("revenue aggregates exclude foreign currency", () => {
  let baselineForeignCount: number;
  let baseTierId: string;

  beforeAll(async () => {
    baselineForeignCount = await countExcludedForeignTransactions({ months: 3 });

    const ownerId = await createTestUser("Currency Guard Member");
    const [tier] = await db
      .insert(membershipTier)
      .values({
        name: `cur-tier-${stamp}`,
        displayName: "Currency Tier",
        price: "10.00",
        billingCycle: "monthly",
        features: [],
        benefits: [],
        permissions: [],
      })
      .returning();
    createdTierIds.push(tier.id);
    baseTierId = tier.id;

    // A subscription so transactions satisfy the NOT NULL subscription_id.
    const sub = await createSubscription({ userId: ownerId, tierId: tier.id, trialDays: 0 }, actor);
    const subscriptionId = sub.subscription.id;

    // A USD row that SHOULD count.
    await db.insert(membershipTransaction).values({
      userId: ownerId,
      subscriptionId,
      tierId: tier.id,
      amount: "7.00",
      currency: "USD",
      status: "COMPLETED",
      paymentMethod: "manual",
      paymentProvider: "manual",
      providerTxId: `cur-usd-${stamp}`,
      description: "USD test row",
    });
    // A EUR row that MUST be excluded, not mixed face-value into USD.
    await db.insert(membershipTransaction).values({
      userId: ownerId,
      subscriptionId,
      tierId: tier.id,
      amount: "999.99",
      currency: "EUR",
      status: "COMPLETED",
      paymentMethod: "manual",
      paymentProvider: "manual",
      providerTxId: `cur-eur-${stamp}`,
      description: "EUR test row",
    });
  });

  afterAll(async () => {
    for (const id of createdUserIds) {
      await db.delete(user).where(eq(user.id, id));
    }
    for (const id of createdTierIds) {
      await db.delete(membershipTier).where(eq(membershipTier.id, id));
    }
  });

  test("countExcludedForeignTransactions grows by exactly the seeded EUR row", async () => {
    const after = await countExcludedForeignTransactions({ months: 3 });
    expect(after - baselineForeignCount).toBe(1);
  });

  test("foreign amount never lands in the monthly USD headline", async () => {
    const rows = await getRevenueByPeriod({ months: 1 });
    const current = rows.find((row) => row.period === currentPeriodKey(0));
    // The EUR 999.99 would be 99999 minor units; if mixed it would dominate.
    // The USD headline delta must NOT include it.
    expect(minor(current?.revenue ?? "0.00")).toBeLessThan(99999);
  });

  test("the tier bucket excludes the foreign transaction", async () => {
    const rows = await getRevenueByTier({ months: 1 });
    const bucket = rows.find((row) => row.tierId === baseTierId);
    // Only the 7.00 USD row belongs; the EUR 999.99 must not be mixed in.
    expect(minor(bucket?.revenue ?? "0.00")).toBeLessThan(99999);
  });

  test("base currency is USD", () => {
    expect(BASE_CURRENCY).toBe("USD");
  });
});
