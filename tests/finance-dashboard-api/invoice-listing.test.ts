/**
 * Backlog C4 split — invoice listing for the dashboard of the finance
 * dashboard's read-only reporting service (listInvoicesForClient), exercised
 * against the shared test database (real tables, real enums).
 *
 * Covers derived sent/overdue statuses with line items and per-user
 * filtering.
 *
 * Because the test database is shared (other suites record payments while
 * this one runs), every assertion is scoped to this file's seeded rows.
 * Every row this file creates is removed in afterAll; names carry a unique
 * suffix so runs never collide.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { listInvoicesForClient } from "@/lib/services/finance-report.service";
import { createDashboardFixture } from "./fixtures";

const fixture = createDashboardFixture();

let userA: string; // basic member
let userB: string; // pro member
let emailB: string;
let invoiceAId: string; // basic, paid in full (10.00)
let invoiceBId: string; // pro, partial (15.00 of 25.00) -> "partial"/"sent"
let invoiceCId: string; // pro, unpaid, due yesterday -> "overdue"

beforeAll(async () => {
  ({ userA, userB, emailB, invoiceAId, invoiceBId, invoiceCId } = await fixture.seed());
});

afterAll(async () => {
  await fixture.cleanup();
});

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
