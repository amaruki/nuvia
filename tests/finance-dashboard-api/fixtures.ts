/**
 * Shared fixture for the C4 finance-dashboard reporting tests, split out of
 * tests/finance-dashboard-api.test.ts. Each test file owns one
 * createDashboardFixture() instance and seeds it in its own beforeAll, so
 * cleanup registries never leak between files sharing bun's single module
 * cache; unique suffixes keep concurrent runs from colliding.
 *
 * The seeded scenario:
 * - userA on a 10.00 basic tier, userB on a 25.00 pro tier,
 * - invoice A: basic member, paid in full -> PAID + COMPLETED transaction,
 * - invoice B: pro member, 15.00 of 25.00 paid -> "partial"/"sent",
 * - invoice C: pro member, unpaid, due yesterday -> "overdue",
 * - one direct COMPLETED transaction (5.00, basic tier) dated the first of
 *   last month so the monthly window has a non-current-month data point.
 *
 * Because the test database is shared (other suites record payments while
 * these run), aggregate assertions in the test files are DELTAS against
 * baselines captured BEFORE seed(). Every row the fixture creates is removed
 * by cleanup(); deleting the users cascades subscriptions, invoices, items,
 * payments and transactions, and the tiers go last.
 */

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipTier, membershipTransaction, user } from "@/db/schema";
import { toMinorUnits } from "@/lib/payments/gateway";
import type { RevenuePeriodRow } from "@/lib/services/finance-report.service";
import { createInvoice } from "@/lib/services/invoice.service";
import { createTier } from "@/lib/services/membership-tier.service";
import { recordPayment } from "@/lib/services/payment.service";
import { createSubscription, type ActorContext } from "@/lib/services/subscription.service";

const suffix = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
export const actor: ActorContext = { actorId: "system:c4-finance-dashboard-test" };

export const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

/** Minor-unit conversion shared by every delta/exact-sum assertion. */
export const minor = (amount: string): number => toMinorUnits(amount);

export const currentPeriodKey = (offsetMonths: number): string => {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - offsetMonths);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

/** Revenue delta for one monthly bucket against a pre-seed baseline. */
export const periodRevenueDelta = (
  baseline: RevenuePeriodRow[],
  rows: { period: string; revenue: string }[],
  period: string,
): number => {
  const after = rows.find((row) => row.period === period);
  const before = baseline.find((row) => row.period === period);
  return minor(after?.revenue ?? "0.00") - minor(before?.revenue ?? "0.00");
};

/** The seeded C4 scenario a test file asserts against. */
export interface DashboardScenario {
  userA: string; // basic member
  userB: string; // pro member
  emailA: string;
  emailB: string;
  basicTierId: string;
  basicTierName: string;
  proTierId: string;
  proTierName: string;
  invoiceAId: string; // basic, paid in full (10.00)
  invoiceBId: string; // pro, partial (15.00 of 25.00) -> "partial"/"sent"
  invoiceCId: string; // pro, unpaid, due yesterday -> "overdue"
}

export interface DashboardFixture {
  seed(): Promise<DashboardScenario>;
  cleanup(): Promise<void>;
}

export function createDashboardFixture(): DashboardFixture {
  const createdUserIds: string[] = [];
  const createdTierIds: string[] = [];

  async function createTestUser(name: string): Promise<string> {
    const stamp = suffix();
    const [row] = await db
      .insert(user)
      .values({
        username: `c4-${stamp}`,
        email: `c4-${stamp}@example.test`,
        name,
        role: "user",
        emailVerified: false,
      })
      .returning({ id: user.id });

    createdUserIds.push(row.id);
    return row.id;
  }

  async function seed(): Promise<DashboardScenario> {
    const userA = await createTestUser("C4 Basic Member");
    const userB = await createTestUser("C4 Pro Member");
    const [rowA] = await db.select({ email: user.email }).from(user).where(eq(user.id, userA));
    const [rowB] = await db.select({ email: user.email }).from(user).where(eq(user.id, userB));

    const basic = await createTier({
      name: `c4-basic-${suffix()}`,
      displayName: "C4 Basic Tier",
      price: "10.00",
      billingCycle: "monthly",
    });
    createdTierIds.push(basic.id);

    const pro = await createTier({
      name: `c4-pro-${suffix()}`,
      displayName: "C4 Pro Tier",
      price: "25.00",
      billingCycle: "monthly",
    });
    createdTierIds.push(pro.id);

    const subA = await createSubscription({ userId: userA, tierId: basic.id, trialDays: 0 }, actor);
    const subB = await createSubscription({ userId: userB, tierId: pro.id, trialDays: 0 }, actor);

    // Invoice A: basic member, paid in full -> PAID, COMPLETED transaction now.
    const invoiceA = await createInvoice(
      { subscriptionId: subA.subscription.id, dueDate: tomorrow },
      actor,
    );
    await recordPayment(
      { invoiceId: invoiceA.id, amount: "10.00", paymentMethod: "manual" },
      actor,
    );

    // Invoice B: pro member, partial payment -> ISSUED with 10.00 balance.
    const invoiceB = await createInvoice(
      { subscriptionId: subB.subscription.id, dueDate: tomorrow },
      actor,
    );
    await recordPayment(
      { invoiceId: invoiceB.id, amount: "15.00", paymentMethod: "manual" },
      actor,
    );

    // Invoice C: pro member, unpaid and already due -> overdue.
    const invoiceC = await createInvoice(
      { subscriptionId: subB.subscription.id, dueDate: yesterday },
      actor,
    );

    // One COMPLETED ledger transaction dated the first of last month so the
    // monthly window has a non-current-month data point (5.00, basic tier).
    const firstOfLastMonth = new Date();
    firstOfLastMonth.setUTCDate(1);
    firstOfLastMonth.setUTCMonth(firstOfLastMonth.getUTCMonth() - 1);
    await db.insert(membershipTransaction).values({
      userId: userA,
      subscriptionId: subA.subscription.id,
      tierId: basic.id,
      amount: "5.00",
      currency: "USD",
      status: "COMPLETED",
      paymentMethod: "manual",
      paymentProvider: "manual",
      providerTxId: `c4-direct-${suffix()}`,
      description: "Direct C4 test transaction",
      createdAt: firstOfLastMonth,
    });

    return {
      userA,
      userB,
      emailA: rowA.email,
      emailB: rowB.email,
      basicTierId: basic.id,
      basicTierName: basic.name,
      proTierId: pro.id,
      proTierName: pro.name,
      invoiceAId: invoiceA.id,
      invoiceBId: invoiceB.id,
      invoiceCId: invoiceC.id,
    };
  }

  async function cleanup(): Promise<void> {
    // Users cascade subscriptions, invoices, items, payments and transactions;
    // tiers go last.
    for (const id of createdUserIds) {
      await db.delete(user).where(eq(user.id, id));
    }
    for (const id of createdTierIds) {
      await db.delete(membershipTier).where(eq(membershipTier.id, id));
    }
  }

  return { seed, cleanup };
}
