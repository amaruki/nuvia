/**
 * Backlog C4 split — ledger consistency after voiding, exercised against
 * the shared test database (real tables, real enums).
 *
 * Covers voiding an ISSUED invoice removing it from the open ledger and
 * surfacing it as cancelled in the dues ledger.
 *
 * Because the test database is shared (other suites record payments while
 * this one runs), the balance assertion is a before/after delta scoped to
 * this file's member. Every row this file creates is removed in afterAll;
 * names carry a unique suffix so runs never collide.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { listDuesLedger } from "@/lib/services/finance-report.service";
import { createInvoice, voidInvoice } from "@/lib/services/invoice.service";
import { listSubscriptions } from "@/lib/services/subscription.service";
import { actor, createDashboardFixture, minor, tomorrow } from "./fixtures";

const fixture = createDashboardFixture();

let userA: string; // basic member
let basicTierId: string;

beforeAll(async () => {
  ({ userA, basicTierId } = await fixture.seed());
});

afterAll(async () => {
  await fixture.cleanup();
});

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
