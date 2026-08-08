/**
 * Backlog C3 — invoice.service: issuance with default/custom line items,
 * exact minor-unit math, listing + filters, and the ISSUED→VOID transition,
 * exercised against the shared test database (real tables, real enums).
 * One part of the split tests/invoice-payment.test.ts; shared setup lives
 * in ./fixtures.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { NotFoundError } from "@/lib/errors";
import {
  createInvoice,
  getInvoice,
  listInvoices,
  voidInvoice,
} from "@/lib/services/invoice.service";
import { recordPayment } from "@/lib/services/payment.service";
import {
  actor,
  auditCount,
  cleanupTestData,
  createTestSubscription,
  createTestTier,
  expectRejects,
} from "./fixtures";

afterAll(cleanupTestData);

describe("invoice issuance (invoice.service)", () => {
  let memberId: string;
  let tierId: string;
  let subscriptionId: string;

  beforeAll(async () => {
    tierId = await createTestTier("c3-invoice", "C3 Invoice Tier");
    ({ memberId, subscriptionId } = await createTestSubscription(tierId));
  });

  test("issues an ISSUED invoice with a default line item from the tier", async () => {
    const invoice = await createInvoice({ subscriptionId }, actor);

    expect(invoice.status).toBe("ISSUED");
    expect(invoice.invoiceNumber).toMatch(/^INV-\d{4}-[0-9A-Z]{6}$/);
    expect(invoice.userId).toBe(memberId);
    expect(invoice.subscriptionId).toBe(subscriptionId);
    expect(invoice.tierId).toBe(tierId);
    expect(invoice.currency).toBe("USD");
    expect(invoice.subtotal).toBe("12.00");
    expect(invoice.taxAmount).toBe("0.00");
    expect(invoice.totalAmount).toBe("12.00");
    expect(invoice.paidAmount).toBe("0.00");

    expect(invoice.items).toHaveLength(1);
    expect(invoice.items[0].quantity).toBe(1);
    expect(invoice.items[0].unitPrice).toBe("12.00");
    expect(invoice.items[0].amount).toBe("12.00");
    expect(invoice.items[0].description).toContain("C3 Invoice Tier");

    expect(await auditCount("INVOICE_CREATED", memberId)).toBeGreaterThanOrEqual(1);
  });

  test("custom items are extended and summed in exact integer minor units", async () => {
    const invoice = await createInvoice(
      {
        subscriptionId,
        items: [
          { description: "Stickers", quantity: 3, unitPrice: "19.99" },
          { description: "Postage", quantity: 1, unitPrice: "0.10" },
        ],
      },
      actor,
    );

    // 3 × 1999 + 10 = 6007 minor units — no float drift.
    expect(invoice.items[0].amount).toBe("59.97");
    expect(invoice.items[1].amount).toBe("0.10");
    expect(invoice.subtotal).toBe("60.07");
    expect(invoice.totalAmount).toBe("60.07");
  });

  test("rejects an unknown subscription", async () => {
    await expectRejects(
      () => createInvoice({ subscriptionId: "missing-subscription" }, actor),
      undefined,
      NotFoundError,
    );
  });

  test("getInvoice returns items; unknown id rejects", async () => {
    const created = await createInvoice({ subscriptionId }, actor);
    const fetched = await getInvoice(created.id);
    expect(fetched.invoiceNumber).toBe(created.invoiceNumber);
    expect(fetched.items).toHaveLength(1);

    await expectRejects(() => getInvoice("missing-invoice"), undefined, NotFoundError);
  });

  test("listInvoices filters by subscription/user/status and paginates", async () => {
    await createInvoice({ subscriptionId }, actor);
    await createInvoice({ subscriptionId }, actor);

    const page1 = await listInvoices({ subscriptionId, page: 1, limit: 2 });
    expect(page1.invoices).toHaveLength(2);
    expect(page1.total).toBeGreaterThanOrEqual(4);

    const page2 = await listInvoices({ subscriptionId, page: 2, limit: 2 });
    expect(page2.invoices.length).toBeGreaterThanOrEqual(1);
    expect(page2.invoices[0].id).not.toBe(page1.invoices[0].id);

    const byUser = await listInvoices({ userId: memberId, page: 1, limit: 100 });
    expect(byUser.total).toBe(page1.total);

    const issued = await listInvoices({ subscriptionId, status: "ISSUED", page: 1, limit: 100 });
    expect(issued.invoices.length).toBeGreaterThanOrEqual(1);
    for (const invoice of issued.invoices) {
      expect(invoice.status).toBe("ISSUED");
    }
  });

  test("voidInvoice moves ISSUED → VOID with an audit row", async () => {
    const invoice = await createInvoice({ subscriptionId }, actor);
    const voided = await voidInvoice(invoice.id, actor);

    expect(voided.status).toBe("VOID");
    expect(voided.invoiceNumber).toBe(invoice.invoiceNumber);
    expect(await auditCount("INVOICE_VOIDED", memberId)).toBeGreaterThanOrEqual(1);

    // Re-voiding surfaces the state collision instead of no-opping.
    await expectRejects(() => voidInvoice(invoice.id, actor), "INVOICE_NOT_VOIDABLE");
  });

  test("voiding a PAID invoice is rejected; unknown id rejects", async () => {
    const invoice = await createInvoice({ subscriptionId }, actor);
    await recordPayment({ invoiceId: invoice.id, amount: "12.00" }, actor);

    await expectRejects(() => voidInvoice(invoice.id, actor), "INVOICE_NOT_VOIDABLE");
    await expectRejects(() => voidInvoice("missing-invoice", actor), undefined, NotFoundError);
  });
});
