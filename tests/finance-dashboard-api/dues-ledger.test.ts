/**
 * Backlog C4 split — the dues ledger of the finance dashboard's read-only
 * reporting service (listDuesLedger), exercised against the shared test
 * database (real tables, real enums).
 *
 * Covers derived paid/partial/overdue statuses with member and tier joins,
 * status filtering, and pagination.
 *
 * Because the test database is shared (other suites record payments while
 * this one runs), every assertion is scoped to this file's seeded rows.
 * Every row this file creates is removed in afterAll; names carry a unique
 * suffix so runs never collide.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { listDuesLedger } from "@/lib/services/finance-report.service";
import { createDashboardFixture } from "./fixtures";

const fixture = createDashboardFixture();

let emailA: string;
let emailB: string;
let basicTierName: string;
let proTierName: string;
let invoiceAId: string; // basic, paid in full (10.00)
let invoiceBId: string; // pro, partial (15.00 of 25.00) -> "partial"/"sent"
let invoiceCId: string; // pro, unpaid, due yesterday -> "overdue"

beforeAll(async () => {
  ({ emailA, emailB, basicTierName, proTierName, invoiceAId, invoiceBId, invoiceCId } =
    await fixture.seed());
});

afterAll(async () => {
  await fixture.cleanup();
});

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
