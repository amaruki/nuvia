/**
 * Manual (treasurer) payment recording against ISSUED invoices (backlog C3).
 */

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipInvoice, membershipPayment, membershipTransaction } from "@/db/schema";
import { BusinessLogicError } from "@/lib/errors";
import { toAmountString, toMinorUnits } from "@/lib/payments/gateway";
import { getInvoice } from "@/lib/services/invoice.service";
import type { ActorContext } from "@/lib/services/subscription.service";
import type { RecordPaymentInput } from "@/lib/validation/finance.validation";
import { writeAudit } from "./audit";
import type { RecordedPayment } from "./types";

/**
 * Record a manual (treasurer) payment against an ISSUED invoice.
 *
 * One db.transaction writes the membership_transactions ledger row, the
 * membership_payments row, the invoice's paidAmount/status update, and the
 * audit entry — either everything lands or nothing does. Overpayment and
 * payments against PAID/VOID invoices are rejected before any write.
 */
export async function recordPayment(
  input: RecordPaymentInput,
  actor: ActorContext,
): Promise<RecordedPayment> {
  const invoice = await getInvoice(input.invoiceId);

  if (invoice.status !== "ISSUED") {
    throw new BusinessLogicError(
      `Invoice ${invoice.invoiceNumber} is ${invoice.status}; only ISSUED invoices accept payments`,
      "INVOICE_NOT_PAYABLE",
    );
  }

  const amountMinor = toMinorUnits(input.amount);
  if (amountMinor <= 0) {
    throw new BusinessLogicError("Payment amount must be greater than zero", "INVALID_AMOUNT");
  }

  const totalMinor = toMinorUnits(invoice.totalAmount);
  const paidMinor = toMinorUnits(invoice.paidAmount);
  const outstandingMinor = totalMinor - paidMinor;

  if (amountMinor > outstandingMinor) {
    throw new BusinessLogicError(
      `Payment of ${input.amount} exceeds the outstanding ${toAmountString(outstandingMinor)} on invoice ${invoice.invoiceNumber}`,
      "OVERPAYMENT_NOT_ALLOWED",
    );
  }

  const providerTxId = `manual_${crypto.randomUUID()}`;
  const paymentMethod = input.paymentMethod ?? "manual";

  const result = await db.transaction(async (tx) => {
    const [transaction] = await tx
      .insert(membershipTransaction)
      .values({
        userId: invoice.userId,
        subscriptionId: invoice.subscriptionId,
        tierId: invoice.tierId,
        amount: input.amount,
        currency: invoice.currency,
        status: "COMPLETED",
        paymentMethod,
        paymentProvider: "manual",
        providerTxId,
        description: `Payment for invoice ${invoice.invoiceNumber}`,
      })
      .returning();

    const [payment] = await tx
      .insert(membershipPayment)
      .values({
        invoiceId: invoice.id,
        userId: invoice.userId,
        subscriptionId: invoice.subscriptionId,
        transactionId: transaction.id,
        amount: input.amount,
        currency: invoice.currency,
        status: "COMPLETED",
        paymentMethod,
        paymentProvider: "manual",
        providerTxId,
        paidAt: new Date(),
        metadata: input.reason ? { reason: input.reason } : null,
      })
      .returning();

    const newPaidMinor = paidMinor + amountMinor;
    const settled = newPaidMinor >= totalMinor;
    const [updatedInvoice] = await tx
      .update(membershipInvoice)
      .set({
        paidAmount: toAmountString(newPaidMinor),
        status: settled ? "PAID" : "ISSUED",
      })
      .where(eq(membershipInvoice.id, invoice.id))
      .returning();

    await writeAudit(tx, {
      userId: invoice.userId,
      eventType: "PAYMENT_RECORDED",
      message: `Recorded ${input.amount} ${invoice.currency} against invoice ${invoice.invoiceNumber}${settled ? " — invoice settled" : ""}`,
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        paymentId: payment.id,
        transactionId: transaction.id,
        amount: input.amount,
        paidAmount: updatedInvoice.paidAmount,
        settled,
      },
      actor,
    });

    return { payment, transaction, invoice: updatedInvoice };
  });

  return result;
}
