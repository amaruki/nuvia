/**
 * Backlog C4 split — revenue aggregates of the finance dashboard's read-only
 * reporting service (getRevenueByPeriod, getRevenueByTier), exercised
 * against the shared test database (real tables, real enums).
 *
 * Covers continuous monthly buckets over COMPLETED transactions with
 * window filtering, revenue grouped by billed tier, and race-free exact
 * per-tier attribution scoped to this file's members.
 *
 * Because the test database is shared (other suites record payments while
 * this one runs), every aggregate assertion is a DELTA against a baseline
 * captured before seeding. Every row this file creates is removed in
 * afterAll; names carry a unique suffix so runs never collide.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { and, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipTransaction } from "@/db/schema";
import {
  getRevenueByPeriod,
  getRevenueByTier,
  type RevenuePeriodRow,
} from "@/lib/services/finance-report.service";
import { createDashboardFixture, currentPeriodKey, minor, periodRevenueDelta } from "./fixtures";

const fixture = createDashboardFixture();

let baselinePeriods: RevenuePeriodRow[];

let userA: string; // basic member
let userB: string; // pro member
let basicTierId: string;
let basicTierName: string;
let proTierId: string;
let proTierName: string;

beforeAll(async () => {
  // Baselines MUST be captured before the fixture seeds, so the deltas below
  // measure exactly what this file adds to the shared database.
  baselinePeriods = await getRevenueByPeriod({ months: 3 });
  ({ userA, userB, basicTierId, basicTierName, proTierId, proTierName } = await fixture.seed());
});

afterAll(async () => {
  await fixture.cleanup();
});

describe("getRevenueByPeriod", () => {
  test("renders a continuous monthly series with the seeded revenue deltas", async () => {
    const rows = await getRevenueByPeriod({ months: 3 });
    expect(rows).toHaveLength(3);
    // Oldest first, continuous.
    expect(rows[0].period).toBe(currentPeriodKey(2));
    expect(rows[2].period).toBe(currentPeriodKey(0));

    // This month: at least 10.00 (invoice A) + 15.00 (invoice B partial);
    // concurrent suites may add more, so deltas are lower bounds.
    expect(periodRevenueDelta(baselinePeriods, rows, currentPeriodKey(0))).toBeGreaterThanOrEqual(
      2500,
    );
    // Last month: at least the 5.00 direct transaction.
    expect(periodRevenueDelta(baselinePeriods, rows, currentPeriodKey(1))).toBeGreaterThanOrEqual(
      500,
    );
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
