/**
 * Backlog C3 — payment.service manual (treasurer) recording: the
 * single-transaction ledger write, partial payments, overpayment/state
 * guards, exercised against the shared test database.
 * One part of the split tests/invoice-payment.test.ts; shared setup lives
 * in ./fixtures.
 */

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipTransaction } from "@/db/schema";
import { NotFoundError } from "@/lib/errors";
import { createInvoice, getInvoice, voidInvoice } from "@/lib/services/invoice.service";
import { getPayment, listPayments, recordPayment } from "@/lib/services/payment.service";
import {
  actor,
  auditCount,
  cleanupTestData,
  createTestSubscription,
  createTestTier,
  expectRejects,
} from "./fixtures";

afterAll(cleanupTestData);

describe("manual payment recording (payment.service)", () => {
  let memberId: string;
  let subscriptionId: string;
  let settledInvoiceId: string;

  beforeAll(async () => {
    const tierId = await createTestTier("c3-payment", "C3 Payment Tier");
    ({ memberId, subscriptionId } = await createTestSubscription(tierId));
  });

  test("records a full payment: ledger row, payment row, PAID invoice, audit", async () => {
    const invoice = await createInvoice({ subscriptionId }, actor);
    const result = await recordPayment(
      {
        invoiceId: invoice.id,
        amount: "12.00",
        paymentMethod: "bank_transfer",
        reason: "check 123",
      },
      actor,
    );
    settledInvoiceId = invoice.id;

    expect(result.invoice.status).toBe("PAID");
    expect(result.invoice.paidAmount).toBe("12.00");

    expect(result.payment.status).toBe("COMPLETED");
    expect(result.payment.amount).toBe("12.00");
    expect(result.payment.invoiceId).toBe(invoice.id);
    expect(result.payment.transactionId).toBe(result.transaction.id);
    expect(result.payment.paymentMethod).toBe("bank_transfer");
    expect(result.payment.paymentProvider).toBe("manual");
    expect(result.payment.providerTxId).toStartWith("manual_");
    expect(result.payment.metadata).toEqual({ reason: "check 123" });

    expect(result.transaction.status).toBe("COMPLETED");
    expect(result.transaction.amount).toBe("12.00");
    expect(result.transaction.subscriptionId).toBe(subscriptionId);
    expect(result.transaction.description).toContain(invoice.invoiceNumber);

    // The ledger row is really there (same db.transaction wrote it).
    const [ledgerRow] = await db
      .select()
      .from(membershipTransaction)
      .where(eq(membershipTransaction.id, result.transaction.id));
    expect(ledgerRow.providerTxId).toBe(result.payment.providerTxId);

    expect(await auditCount("PAYMENT_RECORDED", memberId)).toBeGreaterThanOrEqual(1);
  });

  test("partial payments keep ISSUED until the invoice is settled", async () => {
    const invoice = await createInvoice(
      { subscriptionId, items: [{ description: "Bundle", quantity: 3, unitPrice: "10.00" }] },
      actor,
    );

    const first = await recordPayment({ invoiceId: invoice.id, amount: "10.00" }, actor);
    expect(first.invoice.status).toBe("ISSUED");
    expect(first.invoice.paidAmount).toBe("10.00");

    const second = await recordPayment({ invoiceId: invoice.id, amount: "20.00" }, actor);
    expect(second.invoice.status).toBe("PAID");
    expect(second.invoice.paidAmount).toBe("30.00");
  });

  test("overpayment is rejected and writes nothing", async () => {
    const invoice = await createInvoice({ subscriptionId }, actor);

    await expectRejects(
      () => recordPayment({ invoiceId: invoice.id, amount: "12.01" }, actor),
      "OVERPAYMENT_NOT_ALLOWED",
    );

    const { payments, total } = await listPayments({ invoiceId: invoice.id, page: 1, limit: 10 });
    expect(total).toBe(0);
    expect(payments).toHaveLength(0);

    // Nothing was paid either.
    const fresh = await getInvoice(invoice.id);
    expect(fresh.status).toBe("ISSUED");
    expect(fresh.paidAmount).toBe("0.00");
  });

  test("payments against PAID and VOID invoices are rejected", async () => {
    await expectRejects(
      () => recordPayment({ invoiceId: settledInvoiceId, amount: "1.00" }, actor),
      "INVOICE_NOT_PAYABLE",
    );

    const invoice = await createInvoice({ subscriptionId }, actor);
    await voidInvoice(invoice.id, actor);
    await expectRejects(
      () => recordPayment({ invoiceId: invoice.id, amount: "1.00" }, actor),
      "INVOICE_NOT_PAYABLE",
    );
  });

  test("unknown invoice rejects", async () => {
    await expectRejects(
      () => recordPayment({ invoiceId: "missing-invoice", amount: "1.00" }, actor),
      undefined,
      NotFoundError,
    );
  });

  test("listPayments filters; getPayment round-trips and rejects unknown", async () => {
    const listed = await listPayments({ subscriptionId, page: 1, limit: 100 });
    expect(listed.total).toBeGreaterThanOrEqual(3);
    for (const payment of listed.payments) {
      expect(payment.subscriptionId).toBe(subscriptionId);
    }

    const fetched = await getPayment(listed.payments[0].id);
    expect(fetched.id).toBe(listed.payments[0].id);

    await expectRejects(() => getPayment("missing-payment"), undefined, NotFoundError);
  });
});
