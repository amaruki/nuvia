/**
 * Donation service — CRUD over the real `donations` table.
 *
 * Every function is a single-row read or write, so no `db.transaction()`
 * wrappers are needed yet (CODING_STANDARD §5.2 applies once a mutation
 * spans multiple writes, e.g. donation + payment record). Amounts are
 * numeric(10,2) string mode end to end — the zod schemas
 * (src/lib/validation/donation.validation.ts) only accept string decimals.
 */

import { count, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { donation, type Donation } from "@/db/schema";
import { BusinessLogicError, NotFoundError } from "@/lib/errors";
import { assertDonationTransition } from "@/lib/services/donation/lifecycle";
import type {
  DonationCreateInput,
  DonationListQuery,
  DonationUpdateInput,
} from "@/lib/validation/donation.validation";

/** True when the driver error carries the postgres unique_violation code.
 * Drizzle wraps the postgres.js error, so the code can live several cause
 * levels down — walk the chain instead of reading the top level only. */
function isUniqueViolation(error: unknown): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 5 && current !== null && typeof current === "object"; depth += 1) {
    if ((current as { code?: unknown }).code === "23505") return true;
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}

/** Filtered, newest-first page with the total for pagination meta. */
export async function listDonations(
  query: DonationListQuery,
): Promise<{ donations: Donation[]; total: number }> {
  const where = query.status ? eq(donation.status, query.status) : undefined;

  const [donations, totalRows] = await Promise.all([
    db.query.donation.findMany({
      where,
      orderBy: [desc(donation.donationDate), desc(donation.createdAt)],
      limit: query.limit,
      offset: (query.page - 1) * query.limit,
    }),
    db.select({ value: count() }).from(donation).where(where),
  ]);

  return { donations, total: totalRows[0]?.value ?? 0 };
}

/** One donation; NotFoundError when absent. */
export async function getDonation(id: string): Promise<Donation> {
  const row = await db.query.donation.findFirst({
    where: eq(donation.id, id),
  });

  if (!row) throw new NotFoundError("Donation", id);
  return row;
}

/**
 * Record a donation. `donationDate` omitted means "now" via the column
 * default; an empty-string campaign never reaches the DB as "".
 *
 * Issue #27 (finding 3): the partial unique index on transaction_id is the
 * last line of defense against double-recording one payment; a collision is
 * a business conflict, not an unexpected error.
 */
export async function createDonation(input: DonationCreateInput): Promise<Donation> {
  try {
    const [row] = await db
      .insert(donation)
      .values({
        donorName: input.donorName,
        donorEmail: input.donorEmail,
        donorType: input.donorType,
        donationType: input.donationType,
        campaign: input.campaign || null,
        amount: input.amount,
        currency: input.currency,
        status: input.status,
        paymentMethod: input.paymentMethod || null,
        transactionId: input.transactionId || null,
        donationDate: input.donationDate ? new Date(input.donationDate) : undefined,
        receiptSent: input.receiptSent,
        notes: input.notes || null,
      })
      .returning();
    return row;
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new BusinessLogicError(
        `A donation with transaction ID '${input.transactionId}' is already recorded`,
        "DONATION_DUPLICATE_TRANSACTION",
      );
    }
    throw error;
  }
}

/**
 * Update the mutable fields only (status/notes/receiptSent/campaign — the
 * zod update schema refuses everything else). Undefined keys are skipped
 * by drizzle's .set(); explicit nulls clear `notes`/`campaign`.
 *
 * Issue #27 (finding 3): status changes follow the lifecycle table in
 * src/lib/services/donation/lifecycle.ts — no resurrecting refunded gifts.
 */
export async function updateDonation(id: string, input: DonationUpdateInput): Promise<Donation> {
  const existing = await getDonation(id);

  if (input.status !== undefined) {
    assertDonationTransition(existing.status, input.status);
  }

  const [row] = await db
    .update(donation)
    .set({
      status: input.status,
      notes: input.notes ?? undefined,
      receiptSent: input.receiptSent,
      campaign: input.campaign ?? undefined,
    })
    .where(eq(donation.id, id))
    .returning();
  return row;
}
