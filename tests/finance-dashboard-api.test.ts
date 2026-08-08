/**
 * Backlog C4 — the finance dashboard's read-only reporting service,
 * exercised against the shared test database (real tables, real enums).
 *
 * Coverage:
 * - getRevenueByPeriod: continuous monthly buckets over COMPLETED
 *   transactions, exact minor-unit sums, window filtering,
 * - getRevenueByTier: revenue grouped by billed tier,
 * - getOutstandingSummary: ISSUED receivables with the overdue split,
 * - getFinanceReportSummary: the combined dashboard payload,
 * - listDuesLedger: derived dues statuses (paid/partial/overdue) plus
 *   member/tier join columns and pagination,
 * - listInvoicesForClient: sent/overdue derivation, line items, userId
 *   filter,
 * - describeConfiguredGateway: env-driven status that never leaks
 *   credential values.
 *
 * Because the test database is shared (other suites record payments while
 * this one runs), every aggregate assertion is a DELTA against a baseline
 * captured before seeding. Every row this file creates is removed in
 * afterAll; names carry a unique suffix so runs never collide.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { and, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipTier, membershipTransaction, user } from "@/db/schema";
import { env } from "@/lib/env";
import { toMinorUnits } from "@/lib/payments/gateway";
import {
  describeConfiguredGateway,
  getFinanceReportSummary,
  getOutstandingSummary,
  getRevenueByPeriod,
  getRevenueByTier,
  listDuesLedger,
  listInvoicesForClient,
} from "@/lib/services/finance-report.service";
import { createInvoice, voidInvoice } from "@/lib/services/invoice.service";
import { createTier } from "@/lib/services/membership-tier.service";
import { recordPayment } from "@/lib/services/payment.service";
import {
  createSubscription,
  listSubscriptions,
  type ActorContext,
} from "@/lib/services/subscription.service";

const suffix = (): string => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const actor: ActorContext = { actorId: "system:c4-finance-dashboard-test" };

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

afterAll(async () => {
  // Users cascade subscriptions, invoices, items, payments and transactions;
  // tiers go last.
  for (const id of createdUserIds) {
    await db.delete(user).where(eq(user.id, id));
  }
  for (const id of createdTierIds) {
    await db.delete(membershipTier).where(eq(membershipTier.id, id));
  }
});

// Baselines MUST be captured before the fixture seeds, so the deltas below
// measure exactly what this suite adds to the shared database.
beforeAll(async () => {
  baselinePeriods = await getRevenueByPeriod({ months: 3 });
  baselineOutstanding = await getOutstandingSummary();
});

// --- fixtures ---------------------------------------------------------------

const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

let userA: string; // basic member
let userB: string; // pro member
let emailA: string;
let emailB: string;
let basicTierId: string;
let basicTierName: string;
let proTierId: string;
let proTierName: string;
let invoiceAId: string; // basic, paid in full (10.00)
let invoiceBId: string; // pro, partial (15.00 of 25.00) -> "partial"/"sent"
let invoiceCId: string; // pro, unpaid, due yesterday -> "overdue"

beforeAll(async () => {
  userA = await createTestUser("C4 Basic Member");
  userB = await createTestUser("C4 Pro Member");
  const [rowA] = await db.select({ email: user.email }).from(user).where(eq(user.id, userA));
  const [rowB] = await db.select({ email: user.email }).from(user).where(eq(user.id, userB));
  emailA = rowA.email;
  emailB = rowB.email;

  const basic = await createTier({
    name: `c4-basic-${suffix()}`,
    displayName: "C4 Basic Tier",
    price: "10.00",
    billingCycle: "monthly",
  });
  basicTierId = basic.id;
  basicTierName = basic.name;
  createdTierIds.push(basic.id);

  const pro = await createTier({
    name: `c4-pro-${suffix()}`,
    displayName: "C4 Pro Tier",
    price: "25.00",
    billingCycle: "monthly",
  });
  proTierId = pro.id;
  proTierName = pro.name;
  createdTierIds.push(pro.id);

  const subA = await createSubscription(
    { userId: userA, tierId: basicTierId, trialDays: 0 },
    actor,
  );
  const subB = await createSubscription({ userId: userB, tierId: proTierId, trialDays: 0 }, actor);

  // Invoice A: basic member, paid in full -> PAID, COMPLETED transaction now.
  const a = await createInvoice({ subscriptionId: subA.subscription.id, dueDate: tomorrow }, actor);
  invoiceAId = a.id;
  await recordPayment({ invoiceId: invoiceAId, amount: "10.00", paymentMethod: "manual" }, actor);

  // Invoice B: pro member, partial payment -> ISSUED with 10.00 balance.
  const b = await createInvoice({ subscriptionId: subB.subscription.id, dueDate: tomorrow }, actor);
  invoiceBId = b.id;
  await recordPayment({ invoiceId: invoiceBId, amount: "15.00", paymentMethod: "manual" }, actor);

  // Invoice C: pro member, unpaid and already due -> overdue.
  const c = await createInvoice(
    { subscriptionId: subB.subscription.id, dueDate: yesterday },
    actor,
  );
  invoiceCId = c.id;

  // One COMPLETED ledger transaction dated the first of last month so the
  // monthly window has a non-current-month data point (5.00, basic tier).
  const firstOfLastMonth = new Date();
  firstOfLastMonth.setUTCDate(1);
  firstOfLastMonth.setUTCMonth(firstOfLastMonth.getUTCMonth() - 1);
  await db.insert(membershipTransaction).values({
    userId: userA,
    subscriptionId: subA.subscription.id,
    tierId: basicTierId,
    amount: "5.00",
    currency: "USD",
    status: "COMPLETED",
    paymentMethod: "manual",
    paymentProvider: "manual",
    providerTxId: `c4-direct-${suffix()}`,
    description: "Direct C4 test transaction",
    createdAt: firstOfLastMonth,
  });
});

// --- baselines --------------------------------------------------------------

let baselinePeriods: { period: string; revenue: string; transactionCount: number }[];
let baselineOutstanding: {
  invoiceCount: number;
  outstandingAmount: string;
  overdueCount: number;
  overdueAmount: string;
};

const minor = (amount: string): number => toMinorUnits(amount);
const periodRevenueDelta = (
  rows: { period: string; revenue: string }[],
  period: string,
): number => {
  const after = rows.find((row) => row.period === period);
  const before = baselinePeriods.find((row) => row.period === period);
  return minor(after?.revenue ?? "0.00") - minor(before?.revenue ?? "0.00");
};

const currentPeriodKey = (offsetMonths: number): string => {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - offsetMonths);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
};

// --- revenue aggregates -------------------------------------------------------

describe("getRevenueByPeriod", () => {
  test("renders a continuous monthly series with the seeded revenue deltas", async () => {
    const rows = await getRevenueByPeriod({ months: 3 });
    expect(rows).toHaveLength(3);
    // Oldest first, continuous.
    expect(rows[0].period).toBe(currentPeriodKey(2));
    expect(rows[2].period).toBe(currentPeriodKey(0));

    // This month: at least 10.00 (invoice A) + 15.00 (invoice B partial);
    // concurrent suites may add more, so deltas are lower bounds.
    expect(periodRevenueDelta(rows, currentPeriodKey(0))).toBeGreaterThanOrEqual(2500);
    // Last month: at least the 5.00 direct transaction.
    expect(periodRevenueDelta(rows, currentPeriodKey(1))).toBeGreaterThanOrEqual(500);
  });

  test("counts only completed transactions", async () => {
    const rows = await getRevenueByPeriod({ months: 3 });
    const current = rows.find((row) => row.period === currentPeriodKey(0));
    const baselineCurrent = baselinePeriods.find((row) => row.period === currentPeriodKey(0));
    const countDelta = (current?.transactionCount ?? 0) - (baselineCurrent?.transactionCount ?? 0);
    expect(countDelta).toBeGreaterThanOrEqual(2);
  });

  test("clamps the window to at least one month", async () => {
    const rows = await getRevenueByPeriod({ months: 0 });
    expect(rows.length).toBeGreaterThanOrEqual(1);
  });
});

describe("getRevenueByTier", () => {
  test("splits the seeded revenue across tiers", async () => {
    const rows = await getRevenueByTier({ months: 3 });

    const basic = rows.find((row) => row.tierId === basicTierId);
    const pro = rows.find((row) => row.tierId === proTierId);
    expect(basic).toBeDefined();
    expect(pro).toBeDefined();
    expect(basic?.tierName).toBe(basicTierName);
    expect(pro?.tierName).toBe(proTierName);
    // basic: 10.00 (invoice A) + 5.00 (direct) = 15.00; pro: 15.00 (partial).
    expect(minor(basic?.revenue ?? "0.00")).toBeGreaterThanOrEqual(1500);
    expect(minor(pro?.revenue ?? "0.00")).toBeGreaterThanOrEqual(1500);
  });

  test("attributes this suite's completed revenue exactly per tier", async () => {
    // Race-free exactness: sum the COMPLETED ledger rows this suite owns.
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCMonth(start.getUTCMonth() - 2);
    const rows = await db
      .select({ tierId: membershipTransaction.tierId, amount: membershipTransaction.amount })
      .from(membershipTransaction)
      .where(
        and(
          inArray(membershipTransaction.userId, [userA, userB]),
          eq(membershipTransaction.status, "COMPLETED"),
          gte(membershipTransaction.createdAt, start),
        ),
      );
    const totals = new Map<string, number>();
    for (const row of rows) {
      const key = row.tierId ?? "none";
      totals.set(key, (totals.get(key) ?? 0) + minor(row.amount));
    }
    // basic: 10.00 (invoice A) + 5.00 (direct); pro: 15.00 (partial payment).
    expect(totals.get(basicTierId)).toBe(1500);
    expect(totals.get(proTierId)).toBe(1500);

    // And the service output covers those rows.
    const byTier = await getRevenueByTier({ months: 3 });
    const basic = byTier.find((row) => row.tierId === basicTierId);
    const pro = byTier.find((row) => row.tierId === proTierId);
    expect(minor(basic?.revenue ?? "0.00")).toBeGreaterThanOrEqual(totals.get(basicTierId) ?? 0);
    expect(minor(pro?.revenue ?? "0.00")).toBeGreaterThanOrEqual(totals.get(proTierId) ?? 0);
  });
});

// --- receivables --------------------------------------------------------------

describe("getOutstandingSummary", () => {
  test("reports the seeded receivables delta with the overdue split", async () => {
    const after = await getOutstandingSummary();

    // B (balance 10.00) + C (25.00) are ISSUED; A is PAID. Concurrent suites
    // can add open invoices while this one runs, so deltas are lower bounds.
    expect(after.invoiceCount - baselineOutstanding.invoiceCount).toBeGreaterThanOrEqual(2);
    expect(
      minor(after.outstandingAmount) - minor(baselineOutstanding.outstandingAmount),
    ).toBeGreaterThanOrEqual(3500);
    expect(after.overdueCount - baselineOutstanding.overdueCount).toBeGreaterThanOrEqual(1);
    expect(
      minor(after.overdueAmount) - minor(baselineOutstanding.overdueAmount),
    ).toBeGreaterThanOrEqual(2500);
  });

  test("attributes this suite's receivables exactly per member", async () => {
    // Race-free exactness: rows scoped to this suite's members.
    const forB = await listInvoicesForClient({ userId: userB, limit: 100 });
    const openB = forB.rows.filter(
      (row) => row.invoiceId === invoiceBId || row.invoiceId === invoiceCId,
    );
    expect(openB).toHaveLength(2);
    const openMinor = openB.reduce((sum, row) => sum + minor(row.balance), 0);
    expect(openMinor).toBe(3500);
    const overdueMinor = openB
      .filter((row) => row.status === "overdue")
      .reduce((sum, row) => sum + minor(row.balance), 0);
    expect(overdueMinor).toBe(2500);

    const forA = await listInvoicesForClient({ userId: userA, limit: 100 });
    const rowA = forA.rows.find((row) => row.invoiceId === invoiceAId);
    expect(rowA?.status).toBe("paid");
    expect(minor(rowA?.balance ?? "0.00")).toBe(0);
  });
});

describe("getFinanceReportSummary", () => {
  test("combines every aggregate with window metadata", async () => {
    const summary = await getFinanceReportSummary({ months: 3 });

    expect(summary.months).toBe(3);
    expect(summary.revenueByPeriod).toHaveLength(3);
    expect(new Date(summary.generatedAt).getTime()).not.toBeNaN();

    const periodTotal = summary.revenueByPeriod.reduce((sum, row) => sum + minor(row.revenue), 0);
    expect(minor(summary.totals.revenue)).toBe(periodTotal);
    const countTotal = summary.revenueByPeriod.reduce((sum, row) => sum + row.transactionCount, 0);
    expect(summary.totals.completedTransactionCount).toBe(countTotal);

    // Structural check on the outstanding block (its global counts move while
    // concurrent suites run; exact membership is asserted per-member instead).
    expect(summary.outstanding.invoiceCount).toBeGreaterThanOrEqual(2);
    expect(minor(summary.outstanding.outstandingAmount)).toBeGreaterThanOrEqual(0);
    expect(minor(summary.outstanding.overdueAmount)).toBeGreaterThanOrEqual(0);
  });
});

// --- dues ledger ----------------------------------------------------------------

describe("listDuesLedger", () => {
  test("derives paid/partial/overdue statuses with member and tier joins", async () => {
    const all = await listDuesLedger({ status: "all", limit: 100 });
    expect(all.total).toBeGreaterThanOrEqual(3);

    const rowA = all.rows.find((row) => row.invoiceId === invoiceAId);
    const rowB = all.rows.find((row) => row.invoiceId === invoiceBId);
    const rowC = all.rows.find((row) => row.invoiceId === invoiceCId);
    expect(rowA).toBeDefined();
    expect(rowB).toBeDefined();
    expect(rowC).toBeDefined();

    // Join columns.
    expect(rowA?.memberEmail).toBe(emailA);
    expect(rowA?.tierName).toBe(basicTierName);
    expect(rowB?.memberEmail).toBe(emailB);
    expect(rowC?.tierName).toBe(proTierName);

    // Amounts + derived statuses.
    expect(rowA?.status).toBe("paid");
    expect(rowA?.amount).toBe("10.00");
    expect(rowA?.paid).toBe("10.00");
    expect(rowA?.balance).toBe("0.00");

    expect(rowB?.status).toBe("partial");
    expect(rowB?.amount).toBe("25.00");
    expect(rowB?.paid).toBe("15.00");
    expect(rowB?.balance).toBe("10.00");

    expect(rowC?.status).toBe("overdue");
    expect(rowC?.balance).toBe("25.00");
  });

  test("filters by status and paginates", async () => {
    const overdue = await listDuesLedger({ status: "overdue", limit: 100 });
    expect(overdue.rows.some((row) => row.invoiceId === invoiceCId)).toBe(true);
    expect(overdue.rows.some((row) => row.invoiceId === invoiceAId)).toBe(false);

    const paid = await listDuesLedger({ status: "paid", limit: 100 });
    expect(paid.rows.some((row) => row.invoiceId === invoiceAId)).toBe(true);

    const partial = await listDuesLedger({ status: "partial", limit: 100 });
    expect(partial.rows.some((row) => row.invoiceId === invoiceBId)).toBe(true);

    // Pagination: limit 1 returns one row but the full filtered total.
    const paged = await listDuesLedger({ status: "all", page: 1, limit: 1 });
    expect(paged.rows).toHaveLength(1);
    expect(paged.total).toBeGreaterThanOrEqual(3);
  });
});

// --- invoice listing for the dashboard ------------------------------------------

describe("listInvoicesForClient", () => {
  test("derives sent/overdue and includes line items", async () => {
    const sent = await listInvoicesForClient({ status: "sent", limit: 100 });
    const overdue = await listInvoicesForClient({ status: "overdue", limit: 100 });
    const paid = await listInvoicesForClient({ status: "paid", limit: 100 });

    expect(sent.rows.some((row) => row.invoiceId === invoiceBId)).toBe(true);
    expect(sent.rows.some((row) => row.invoiceId === invoiceCId)).toBe(false);
    expect(overdue.rows.some((row) => row.invoiceId === invoiceCId)).toBe(true);
    expect(paid.rows.some((row) => row.invoiceId === invoiceAId)).toBe(true);

    const rowB = sent.rows.find((row) => row.invoiceId === invoiceBId);
    expect(rowB?.items).toHaveLength(1);
    expect(rowB?.items[0]?.unitPrice).toBe("25.00");
    expect(rowB?.items[0]?.quantity).toBe(1);
    expect(rowB?.balance).toBe("10.00");
    expect(rowB?.memberEmail).toBe(emailB);
  });

  test("filters by user", async () => {
    const forB = await listInvoicesForClient({ userId: userB, limit: 100 });
    expect(forB.rows.length).toBeGreaterThanOrEqual(2);
    expect(forB.rows.every((row) => row.memberId === userB)).toBe(true);

    const forA = await listInvoicesForClient({ userId: userA, limit: 100 });
    expect(forA.rows.some((row) => row.invoiceId === invoiceBId)).toBe(false);
  });
});

// --- gateway status ----------------------------------------------------------------

describe("describeConfiguredGateway", () => {
  test("mirrors the deployment env without leaking credential values", () => {
    const gateway = describeConfiguredGateway();

    expect(gateway.provider).toBe(env.PAYMENT_GATEWAY);
    expect(gateway.status).toBe("active");
    expect(gateway.displayName.length).toBeGreaterThan(0);

    const serialized = JSON.stringify(gateway);
    if (env.PAYMENT_GATEWAY === "stripe") {
      expect(gateway.webhookEndpoint).toBe("/api/v1/webhooks/stripe");
      expect(typeof gateway.secretKeyConfigured).toBe("boolean");
      expect(typeof gateway.webhookSecretConfigured).toBe("boolean");
      if (env.STRIPE_SECRET_KEY) expect(serialized).not.toContain(env.STRIPE_SECRET_KEY);
      if (env.STRIPE_WEBHOOK_SECRET) {
        expect(serialized).not.toContain(env.STRIPE_WEBHOOK_SECRET);
      }
    } else {
      expect(gateway.webhookEndpoint).toBeNull();
      expect(gateway.secretKeyConfigured).toBeNull();
      expect(gateway.webhookSecretConfigured).toBeNull();
    }
  });
});

// --- voiding keeps the aggregates honest ---------------------------------------------

describe("ledger consistency after void", () => {
  test("voiding an ISSUED invoice removes it from the open ledger", async () => {
    // Race-free: sum only this suite's open ledger rows.
    const openBalanceForUserA = async (): Promise<number> => {
      const ledger = await listDuesLedger({ status: "all", limit: 100 });
      return ledger.rows
        .filter(
          (row) =>
            row.memberId === userA &&
            (row.status === "pending" || row.status === "partial" || row.status === "overdue"),
        )
        .reduce((sum, row) => sum + minor(row.balance), 0);
    };

    // Seed a throwaway invoice on the basic subscription.
    const subs = await listSubscriptions({ userId: userA });
    const basicSub = subs.find((sub) => sub.tierId === basicTierId);
    expect(basicSub).toBeDefined();

    const before = await openBalanceForUserA();
    const invoice = await createInvoice({ subscriptionId: basicSub!.id, dueDate: tomorrow }, actor);
    expect(await openBalanceForUserA()).toBe(before + 1000);

    await voidInvoice(invoice.id, actor);
    expect(await openBalanceForUserA()).toBe(before);

    // The voided invoice shows as cancelled in the dues ledger.
    const cancelled = await listDuesLedger({ status: "cancelled", limit: 100 });
    expect(cancelled.rows.some((row) => row.invoiceId === invoice.id)).toBe(true);
  });
});
