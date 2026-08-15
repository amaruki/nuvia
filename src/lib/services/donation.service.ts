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
import { NotFoundError } from "@/lib/errors";
import type {
  DonationCreateInput,
  DonationListQuery,
  DonationUpdateInput,
} from "@/lib/validation/donation.validation";

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
 */
export async function createDonation(input: DonationCreateInput): Promise<Donation> {
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
}

/**
 * Update the mutable fields only (status/notes/receiptSent/campaign — the
 * zod update schema refuses everything else). Undefined keys are skipped
 * by drizzle's .set(); explicit nulls clear `notes`/`campaign`.
 */
export async function updateDonation(id: string, input: DonationUpdateInput): Promise<Donation> {
  await getDonation(id);

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
