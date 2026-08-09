/**
 * UI-34 — member-scoped finance reads + pay-now.
 *
 * The backoffice finance API (/api/v1/finance/invoices, gated on
 * finance:read) is org-wide; there is no member-facing /dues endpoint, so
 * this service reads the same tables filtered by the session user's id
 * INSIDE every query and projects only allow-listed fields (types.ts).
 *
 * Pay-now reuses the UI-33 gateway-adapter discipline:
 *  - stripe track — a hosted checkout for exactly the invoice's outstanding
 *    balance; the verified webhook reconciles it against the invoice
 *    (payment/webhook/ledger.ts), so the result stays "pending" until then.
 *  - manual track — no gateway means no online payment. Guidance only: NO
 *    ManualGateway.createCheckout call (it settles "completed" immediately
 *    and would fake a success), NO ledger writes, paymentStatus "unpaid".
 */

import { and, count, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipInvoice, membershipTier } from "@/db/schema";
import type { MembershipInvoice } from "@/db/schema";
import { BusinessLogicError, NotFoundError } from "@/lib/errors";
import {
  GatewayError,
  resolvePaymentGateway,
  toAmountString,
  toMinorUnits,
  type PaymentGateway,
} from "@/lib/payments/gateway";
import { getTier } from "@/lib/services/membership-tier.service";
import type { ActorContext } from "@/lib/services/subscription.service";
import type {
  MemberFinanceSummary,
  MemberInvoiceDetailDto,
  MemberInvoiceDto,
  MemberInvoiceQuery,
  MemberPayNowResult,
  MemberPayTrack,
} from "./types";

/**
 * Honest offline-payment copy for deployments without a configured gateway.
 * No amounts are fabricated here — the invoice already shows its own
 * balance; this text only explains how payment actually happens.
 */
export const MANUAL_PAY_GUIDANCE: readonly string[] = [
  "Online payment is not set up for this organization yet.",
  "Dues are collected manually: pay by bank transfer or check, then the finance team records your payment against the invoice.",
  "You will not be charged on this website, and no payment has been recorded yet.",
];

/** Same decision rule as the join funnel: only Stripe is self-serve. */
export function selectPayTrack(gateway: PaymentGateway = resolvePaymentGateway()): MemberPayTrack {
  return gateway.provider === "stripe" ? "stripe" : "manual";
}

function toInvoiceDto(invoice: MembershipInvoice, tierName: string): MemberInvoiceDto {
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    currency: invoice.currency,
    subtotal: invoice.subtotal,
    taxAmount: invoice.taxAmount,
    totalAmount: invoice.totalAmount,
    paidAmount: invoice.paidAmount,
    outstandingAmount: toAmountString(
      Math.max(0, toMinorUnits(invoice.totalAmount) - toMinorUnits(invoice.paidAmount)),
    ),
    tierName,
    dueDate: invoice.dueDate ? invoice.dueDate.toISOString() : null,
    createdAt: invoice.createdAt.toISOString(),
  };
}

async function tierNames(tierIds: string[]): Promise<Map<string, string>> {
  if (tierIds.length === 0) return new Map();
  const rows = await db
    .select({ id: membershipTier.id, displayName: membershipTier.displayName })
    .from(membershipTier)
    .where(inArray(membershipTier.id, [...new Set(tierIds)]));
  return new Map(rows.map((row) => [row.id, row.displayName]));
}

/** The member's own invoices, newest first — never anyone else's rows. */
export async function listMemberInvoices(
  userId: string,
  query: MemberInvoiceQuery = {},
): Promise<{ invoices: MemberInvoiceDto[]; total: number }> {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const where =
    query.status !== undefined
      ? and(eq(membershipInvoice.userId, userId), eq(membershipInvoice.status, query.status))
      : eq(membershipInvoice.userId, userId);

  const [rows, [{ total }]] = await Promise.all([
    db.query.membershipInvoice.findMany({
      where,
      orderBy: desc(membershipInvoice.createdAt),
      limit,
      offset: (page - 1) * limit,
    }),
    db.select({ total: count() }).from(membershipInvoice).where(where),
  ]);

  const names = await tierNames(rows.map((row) => row.tierId));
  const invoices = rows.map((row) => toInvoiceDto(row, names.get(row.tierId) ?? "Membership"));
  return { invoices, total };
}

/** Outstanding balance + counts, computed from the member's own invoices. */
export async function getMemberFinanceSummary(userId: string): Promise<MemberFinanceSummary> {
  const rows = await db
    .select({
      status: membershipInvoice.status,
      totalAmount: membershipInvoice.totalAmount,
      paidAmount: membershipInvoice.paidAmount,
    })
    .from(membershipInvoice)
    .where(eq(membershipInvoice.userId, userId));

  let outstandingMinorTotal = 0;
  let paidMinorTotal = 0;
  const invoiceCounts = { issued: 0, paid: 0, void: 0 };

  for (const row of rows) {
    paidMinorTotal += toMinorUnits(row.paidAmount);
    if (row.status === "ISSUED") {
      invoiceCounts.issued += 1;
      outstandingMinorTotal += Math.max(
        0,
        toMinorUnits(row.totalAmount) - toMinorUnits(row.paidAmount),
      );
    } else if (row.status === "PAID") {
      invoiceCounts.paid += 1;
    } else {
      invoiceCounts.void += 1;
    }
  }

  return {
    outstandingBalance: toAmountString(outstandingMinorTotal),
    outstandingInvoiceCount: invoiceCounts.issued,
    totalPaid: toAmountString(paidMinorTotal),
    invoiceCounts,
  };
}

/**
 * One of the member's own invoices with line items. A foreign or unknown id
 * is the SAME NotFoundError — never confirm to member A that member B's
 * invoice exists.
 */
export async function getMemberInvoice(
  userId: string,
  invoiceId: string,
): Promise<MemberInvoiceDetailDto> {
  const invoice = await db.query.membershipInvoice.findFirst({
    where: and(eq(membershipInvoice.id, invoiceId), eq(membershipInvoice.userId, userId)),
    with: { items: true },
  });

  if (!invoice) {
    throw new NotFoundError("Invoice", invoiceId);
  }

  const tier = await getTier(invoice.tierId);
  const { items, ...row } = invoice;
  return {
    ...toInvoiceDto(row, tier.displayName),
    items: items.map((item) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.amount,
    })),
  };
}

export interface PayMemberInvoiceInput {
  userId: string;
  invoiceId: string;
  /** Where the provider sends the member back after hosted checkout. */
  returnUrl?: string;
  /** Test seam; production resolves from PAYMENT_GATEWAY. */
  gateway?: PaymentGateway;
}

/**
 * Open payment for one of the member's own ISSUED invoices. Ownership and
 * state are validated before any provider call; a foreign invoice is a 404,
 * a settled/void one a state collision. The amount charged is the
 * invoice's own outstanding balance — never a fabricated figure.
 */
export async function payMemberInvoice(
  input: PayMemberInvoiceInput,
  _actor: ActorContext,
): Promise<MemberPayNowResult> {
  const gateway = input.gateway ?? resolvePaymentGateway();

  const invoice = await db.query.membershipInvoice.findFirst({
    where: and(
      eq(membershipInvoice.id, input.invoiceId),
      eq(membershipInvoice.userId, input.userId),
    ),
  });
  if (!invoice) {
    throw new NotFoundError("Invoice", input.invoiceId);
  }

  const due = toMinorUnits(invoice.totalAmount) - toMinorUnits(invoice.paidAmount);
  if (invoice.status !== "ISSUED" || due <= 0) {
    throw new BusinessLogicError(
      `Invoice ${invoice.invoiceNumber} is ${invoice.status}; only ISSUED invoices with an outstanding balance can be paid`,
      "INVOICE_NOT_PAYABLE",
    );
  }

  if (selectPayTrack(gateway) === "manual") {
    return {
      track: "manual",
      paymentStatus: "unpaid",
      invoiceId: invoice.id,
      checkoutUrl: null,
      providerTxId: null,
      guidance: MANUAL_PAY_GUIDANCE,
    };
  }

  const tier = await getTier(invoice.tierId);
  const checkout = await gateway.createCheckout({
    userId: input.userId,
    subscriptionId: invoice.subscriptionId,
    tierId: invoice.tierId,
    tierName: tier.displayName,
    amountMinor: due,
    currency: invoice.currency,
    description: `Payment for invoice ${invoice.invoiceNumber}`,
    returnUrl: input.returnUrl,
    metadata: {
      invoiceId: invoice.id,
      subscriptionId: invoice.subscriptionId,
      tierId: invoice.tierId,
    },
  });

  if (!checkout.checkoutUrl) {
    throw new GatewayError("The gateway produced no hosted checkout URL", "CHECKOUT_FAILED");
  }

  return {
    track: "stripe",
    paymentStatus: "pending",
    invoiceId: invoice.id,
    checkoutUrl: checkout.checkoutUrl,
    providerTxId: checkout.providerTxId,
  };
}
