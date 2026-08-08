/**
 * Invoice service (backlog C3).
 *
 * Scope decision ("single billing service — your call"): invoicing is split
 * into TWO services by aggregate. This file owns the invoice aggregate
 * (header + line items + void lifecycle); payment.service.ts owns payment
 * recording and provider-webhook processing. Both are thin, audited, and
 * route-free, mirroring how membership-tier.service.ts and
 * subscription.service.ts split the C2 domain.
 *
 * Money rule (ADR-0015 §5): everything in and out of this service is
 * numeric(10,2) string mode. Line-item extension uses integer minor-unit
 * arithmetic via toMinorUnits/toAmountString so no float math ever touches
 * money; minor units never appear in the service's public signatures.
 *
 * Audit rule (PRINCIPLES.md "Fast vs. auditable"): every privileged mutation
 * writes its auth_logs entry in the SAME db.transaction as the row change.
 */

import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { authLog, membershipInvoice, membershipInvoiceItem } from "@/db/schema";
import type { MembershipInvoice, MembershipInvoiceItem } from "@/db/schema";
import { BusinessLogicError, NotFoundError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { toAmountString, toMinorUnits } from "@/lib/payments/gateway";
import { getTier } from "@/lib/services/membership-tier.service";
import { getSubscription, type ActorContext } from "@/lib/services/subscription.service";
import type { CreateInvoiceInput, InvoiceListQuery } from "@/lib/validation/finance.validation";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Invoice + its line items, the shape every read endpoint returns. */
export interface InvoiceWithItems extends MembershipInvoice {
  items: MembershipInvoiceItem[];
}

const MAX_NUMBER_ATTEMPTS = 3;

/** Same-transaction audit, mirroring subscription.service's writeAudit. */
async function writeAudit(
  tx: Tx,
  entry: {
    userId: string;
    eventType: string;
    message: string;
    severity?: string;
    metadata: Record<string, unknown>;
    actor: ActorContext;
  },
): Promise<void> {
  await tx.insert(authLog).values({
    userId: entry.userId,
    eventType: entry.eventType,
    severity: entry.severity ?? "INFO",
    message: entry.message,
    ipAddress: entry.actor.ipAddress,
    userAgent: entry.actor.userAgent,
    metadata: { ...entry.metadata, actorId: entry.actor.actorId, reason: entry.actor.reason },
  });
}

/** Human-readable, collision-resistant-enough invoice number: INV-YYYY-XXXXXX. */
export function nextInvoiceNumber(date: Date = new Date()): string {
  const [random] = crypto.getRandomValues(new Uint32Array(1));
  const suffix = (random % 36 ** 6).toString(36).padStart(6, "0").toUpperCase();
  return `INV-${date.getUTCFullYear()}-${suffix}`;
}

/**
 * Create an invoice for exactly one subscription. The user and tier are
 * derived from the subscription — an invoice never bills a user directly.
 *
 * Omitted `items` produce a single default line item from the tier price
 * ("Membership dues — <tier> (<cycle>)"), so the common path is one call.
 */
export async function createInvoice(
  input: CreateInvoiceInput,
  actor: ActorContext,
): Promise<InvoiceWithItems> {
  const subscription = await getSubscription(input.subscriptionId);
  const tier = await getTier(subscription.tierId);

  const items = input.items ?? [
    {
      description: `Membership dues — ${tier.displayName} (${tier.billingCycle})`,
      quantity: 1,
      unitPrice: tier.price,
    },
  ];

  // Exact integer math: extend each line in minor units, sum, render back.
  const subtotalMinor = items.reduce(
    (sum, item) => sum + item.quantity * toMinorUnits(item.unitPrice),
    0,
  );
  const lineItems = items.map((item) => ({
    description: item.description,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    amount: toAmountString(item.quantity * toMinorUnits(item.unitPrice)),
  }));

  const subtotal = toAmountString(subtotalMinor);

  let attempt = 0;
  for (;;) {
    attempt += 1;
    try {
      return await db.transaction(async (tx) => {
        const invoiceNumber = nextInvoiceNumber();
        const [row] = await tx
          .insert(membershipInvoice)
          .values({
            invoiceNumber,
            userId: subscription.userId,
            subscriptionId: subscription.id,
            tierId: tier.id,
            status: "ISSUED",
            currency: "USD",
            subtotal,
            taxAmount: "0",
            totalAmount: subtotal,
            paidAmount: "0",
            dueDate: input.dueDate ?? null,
            notes: input.notes ?? null,
          })
          .returning();

        const itemRows = await tx
          .insert(membershipInvoiceItem)
          .values(
            lineItems.map((item) => ({
              invoiceId: row.id,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              amount: item.amount,
            })),
          )
          .returning();

        await writeAudit(tx, {
          userId: subscription.userId,
          eventType: "INVOICE_CREATED",
          message: `Invoice ${invoiceNumber} issued for ${subtotal} USD`,
          metadata: {
            invoiceId: row.id,
            invoiceNumber,
            subscriptionId: subscription.id,
            tierId: tier.id,
            totalAmount: subtotal,
            itemCount: lineItems.length,
          },
          actor,
        });

        return { ...row, items: itemRows };
      });
    } catch (error) {
      const code =
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        typeof error.code === "string"
          ? error.code
          : undefined;
      if (code === "23505" && attempt < MAX_NUMBER_ATTEMPTS) {
        logger.warn(`Invoice number collision (attempt ${attempt}); regenerating`);
        continue;
      }
      throw error;
    }
  }
}

/** One invoice with its line items; NotFoundError when absent. */
export async function getInvoice(id: string): Promise<InvoiceWithItems> {
  const invoice = await db.query.membershipInvoice.findFirst({
    where: eq(membershipInvoice.id, id),
    with: { items: true },
  });

  if (!invoice) {
    throw new NotFoundError("Invoice", id);
  }

  return invoice;
}

/** Filtered, newest-first list with standard pagination meta. */
export async function listInvoices(
  query: InvoiceListQuery,
): Promise<{ invoices: MembershipInvoice[]; total: number }> {
  const conditions = [
    query.userId ? eq(membershipInvoice.userId, query.userId) : undefined,
    query.subscriptionId ? eq(membershipInvoice.subscriptionId, query.subscriptionId) : undefined,
    query.status ? eq(membershipInvoice.status, query.status) : undefined,
  ].filter(Boolean);
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db.query.membershipInvoice.findMany({
      where,
      orderBy: desc(membershipInvoice.createdAt),
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    }),
    db.select({ total: count() }).from(membershipInvoice).where(where),
  ]);

  return { invoices: rows, total };
}

/**
 * Void an ISSUED invoice. PAID invoices are immutable (money already
 * recorded against them) and re-voiding a VOID invoice is a 409, not a
 * silent no-op — callers must see the state collision.
 */
export async function voidInvoice(id: string, actor: ActorContext): Promise<MembershipInvoice> {
  const invoice = await db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(membershipInvoice)
      .where(eq(membershipInvoice.id, id))
      .for("update");

    if (!current) {
      throw new NotFoundError("Invoice", id);
    }
    if (current.status !== "ISSUED") {
      throw new BusinessLogicError(
        `Invoice ${current.invoiceNumber} is ${current.status}; only ISSUED invoices can be voided`,
        "INVOICE_NOT_VOIDABLE",
      );
    }

    const [row] = await tx
      .update(membershipInvoice)
      .set({ status: "VOID" })
      .where(eq(membershipInvoice.id, id))
      .returning();

    await writeAudit(tx, {
      userId: current.userId,
      eventType: "INVOICE_VOIDED",
      message: `Invoice ${current.invoiceNumber} voided`,
      metadata: { invoiceId: current.id, invoiceNumber: current.invoiceNumber },
      actor,
    });

    return row;
  });

  return invoice;
}
