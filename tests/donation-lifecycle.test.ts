/**
 * Integration tests for the donation lifecycle guards (issue #27,
 * finding 3): duplicate transaction_id dedupe at the DB layer and the
 * status transition table in src/lib/services/donation/lifecycle.ts.
 *
 * Before this fix, createDonation had no dedupe and updateDonation
 * accepted any status on any PATCH — a refunded gift could be flipped
 * back to pending and counted in revenue twice.
 */
import { afterAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { donation } from "@/db/schema";
import { BusinessLogicError } from "@/lib/errors";
import { createDonation, getDonation, updateDonation } from "@/lib/services/donation.service";
import { DONATION_TRANSITIONS } from "@/lib/services/donation/lifecycle";

const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const createdIds: string[] = [];

/** Minimal valid donation input; each test overrides what it exercises.
 * Service-level input is the zod OUTPUT shape, so fields with schema
 * defaults must be spelled out here. */
const baseInput = {
  donorName: `Donation Guard Test ${suffix}`,
  donorEmail: `donation-guard-${suffix}@example.com`,
  donorType: "individual" as const,
  donationType: "one_time" as const,
  amount: "25.00",
  currency: "USD",
  status: "pending" as const,
  receiptSent: false,
};

async function expectConflict(fn: () => Promise<unknown>, code: string): Promise<void> {
  try {
    await fn();
    throw new Error("expected a BusinessLogicError but the call succeeded");
  } catch (error) {
    expect(error).toBeInstanceOf(BusinessLogicError);
    expect((error as BusinessLogicError).code).toBe(code);
  }
}

describe("donation duplicate transaction dedupe (issue #27)", () => {
  afterAll(async () => {
    for (const id of createdIds) {
      await db.delete(donation).where(eq(donation.id, id));
    }
  });

  test("rejects a second donation with the same transaction ID", async () => {
    const first = await createDonation({
      ...baseInput,
      status: "completed",
      transactionId: `dedupe-${suffix}`,
    });
    createdIds.push(first.id as string);

    await expectConflict(
      () => createDonation({ ...baseInput, transactionId: `dedupe-${suffix}` }),
      "DONATION_DUPLICATE_TRANSACTION",
    );
  });

  test("allows multiple donations without a transaction ID", async () => {
    for (let i = 0; i < 2; i++) {
      const row = await createDonation({ ...baseInput, status: "pending" });
      createdIds.push(row.id as string);
    }
  });
});

describe("donation status transitions (issue #27)", () => {
  afterAll(async () => {
    for (const id of createdIds) {
      await db.delete(donation).where(eq(donation.id, id));
    }
  });

  async function createWithStatus(status: (typeof donation.status.enumValues)[number]) {
    const row = await createDonation({ ...baseInput, status });
    createdIds.push(row.id as string);
    return row;
  }

  test("legal moves succeed: pledged->pending->completed->refunded", async () => {
    const row = await createWithStatus("pledged");

    const pending = await updateDonation(row.id as string, { status: "pending" });
    expect(pending.status).toBe("pending");

    const completed = await updateDonation(row.id as string, { status: "completed" });
    expect(completed.status).toBe("completed");

    const refunded = await updateDonation(row.id as string, { status: "refunded" });
    expect(refunded.status).toBe("refunded");
  });

  test("refunded is terminal: no resurrection to pending", async () => {
    const row = await createWithStatus("completed");
    await updateDonation(row.id as string, { status: "refunded" });

    await expectConflict(
      () => updateDonation(row.id as string, { status: "pending" }),
      "INVALID_TRANSITION",
    );
  });

  test("completed cannot go back to pending (double count risk)", async () => {
    const row = await createWithStatus("completed");

    await expectConflict(
      () => updateDonation(row.id as string, { status: "pending" }),
      "INVALID_TRANSITION",
    );
  });

  test("failed payments can be retried via pending", async () => {
    const row = await createWithStatus("failed");

    const retried = await updateDonation(row.id as string, { status: "pending" });
    expect(retried.status).toBe("pending");
  });

  test("same-status PATCH is a no-op, not an error", async () => {
    const row = await createWithStatus("completed");

    const same = await updateDonation(row.id as string, { status: "completed" });
    expect(same.status).toBe("completed");
  });

  test("transition table covers every enum value", () => {
    const statuses = ["pending", "completed", "failed", "refunded", "pledged"] as const;
    for (const status of statuses) {
      expect(Object.keys(DONATION_TRANSITIONS)).toContain(status);
    }
    expect(DONATION_TRANSITIONS.refunded).toEqual([]);
  });
});
