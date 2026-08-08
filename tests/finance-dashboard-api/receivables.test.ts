/**
 * Backlog C4 split — receivables of the finance dashboard's read-only
 * reporting service (getOutstandingSummary, getFinanceReportSummary),
 * exercised against the shared test database (real tables, real enums).
 *
 * Covers ISSUED receivables with the overdue split as a baseline delta,
 * race-free exact per-member attribution, and the combined dashboard
 * payload with its window metadata.
 *
 * Because the test database is shared (other suites record payments while
 * this one runs), every aggregate assertion is a DELTA against a baseline
 * captured before seeding. Every row this file creates is removed in
 * afterAll; names carry a unique suffix so runs never collide.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  getFinanceReportSummary,
  getOutstandingSummary,
  listInvoicesForClient,
  type OutstandingSummary,
} from "@/lib/services/finance-report.service";
import { createDashboardFixture, minor } from "./fixtures";

const fixture = createDashboardFixture();

let baselineOutstanding: OutstandingSummary;

let userA: string; // basic member
let userB: string; // pro member
let invoiceAId: string; // basic, paid in full (10.00)
let invoiceBId: string; // pro, partial (15.00 of 25.00) -> "partial"/"sent"
let invoiceCId: string; // pro, unpaid, due yesterday -> "overdue"

beforeAll(async () => {
  // Baselines MUST be captured before the fixture seeds, so the deltas below
  // measure exactly what this file adds to the shared database.
  baselineOutstanding = await getOutstandingSummary();
  ({ userA, userB, invoiceAId, invoiceBId, invoiceCId } = await fixture.seed());
});

afterAll(async () => {
  await fixture.cleanup();
});

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
