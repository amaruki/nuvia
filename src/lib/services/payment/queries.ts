/**
 * Payment reads — filtered, newest-first list with pagination meta, and
 * single-payment fetch.
 */

import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipPayment } from "@/db/schema";
import type { MembershipPayment } from "@/db/schema";
import { NotFoundError } from "@/lib/errors";
import type { PaymentListQuery } from "@/lib/validation/finance.validation";

/** Filtered, newest-first payment list with standard pagination meta. */
export async function listPayments(
  query: PaymentListQuery,
): Promise<{ payments: MembershipPayment[]; total: number }> {
  const conditions = [
    query.invoiceId ? eq(membershipPayment.invoiceId, query.invoiceId) : undefined,
    query.userId ? eq(membershipPayment.userId, query.userId) : undefined,
    query.subscriptionId ? eq(membershipPayment.subscriptionId, query.subscriptionId) : undefined,
  ].filter(Boolean);
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [{ total }]] = await Promise.all([
    db.query.membershipPayment.findMany({
      where,
      orderBy: desc(membershipPayment.createdAt),
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    }),
    db.select({ total: count() }).from(membershipPayment).where(where),
  ]);

  return { payments: rows, total };
}

export async function getPayment(id: string): Promise<MembershipPayment> {
  const payment = await db.query.membershipPayment.findFirst({
    where: eq(membershipPayment.id, id),
  });

  if (!payment) {
    throw new NotFoundError("Payment", id);
  }

  return payment;
}
