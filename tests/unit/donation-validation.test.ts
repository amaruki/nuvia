/**
 * Donation validation schemas (zod behavior only — no database). Covers the
 * create schema's money/enum/date rules, the update schema's partiality,
 * and the list query's pagination coercion.
 */

import { describe, expect, test } from "bun:test";

import {
  donationAmountSchema,
  donationCreateSchema,
  donationListQuerySchema,
  donationStatusSchema,
  donationTypeSchema,
  donationUpdateSchema,
  donorTypeSchema,
} from "@/lib/validation/donation.validation";

const VALID_DONATION = {
  donorName: "Jane Doe",
  donorEmail: "jane@example.com",
  donorType: "individual",
  donationType: "one_time",
  amount: "250.00",
};

describe("donationCreateSchema", () => {
  test("accepts a minimal valid donation", () => {
    const parsed = donationCreateSchema.safeParse(VALID_DONATION);
    expect(parsed.success).toBe(true);
  });

  test("applies the documented defaults", () => {
    const parsed = donationCreateSchema.safeParse({
      donorName: "Jane Doe",
      donorEmail: "jane@example.com",
      amount: "10.00",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.donorType).toBe("individual");
      expect(parsed.data.donationType).toBe("one_time");
      expect(parsed.data.currency).toBe("USD");
      expect(parsed.data.status).toBe("pending");
      expect(parsed.data.receiptSent).toBe(false);
    }
  });

  test("requires donor name and a valid email", () => {
    expect(donationCreateSchema.safeParse({ ...VALID_DONATION, donorName: "" }).success).toBe(
      false,
    );
    expect(donationCreateSchema.safeParse({ ...VALID_DONATION, donorName: "   " }).success).toBe(
      false,
    );
    expect(
      donationCreateSchema.safeParse({ ...VALID_DONATION, donorEmail: "not-an-email" }).success,
    ).toBe(false);
    expect(donationCreateSchema.safeParse({ ...VALID_DONATION, donorEmail: "" }).success).toBe(
      false,
    );
  });

  test("covers every donor type and rejects unknown ones", () => {
    for (const donorType of ["individual", "organization", "anonymous"]) {
      expect(donorTypeSchema.safeParse(donorType).success).toBe(true);
    }
    expect(donorTypeSchema.safeParse("corporation").success).toBe(false);
  });

  test("covers every donation type and rejects unknown ones", () => {
    for (const donationType of ["one_time", "recurring", "pledge"]) {
      expect(donationTypeSchema.safeParse(donationType).success).toBe(true);
    }
    expect(donationTypeSchema.safeParse("monthly").success).toBe(false);
  });

  test("covers every status and rejects unknown ones", () => {
    for (const status of ["pending", "completed", "failed", "refunded", "pledged"]) {
      expect(donationStatusSchema.safeParse(status).success).toBe(true);
    }
    expect(donationStatusSchema.safeParse("cancelled").success).toBe(false);
    expect(donationCreateSchema.safeParse({ ...VALID_DONATION, status: "cancelled" }).success).toBe(
      false,
    );
  });

  test("rejects a non-positive or malformed amount", () => {
    for (const amount of ["0", "0.00", "-5.00", "abc", "1.234", "1,000.00", "", 250]) {
      expect(donationAmountSchema.safeParse(amount).success).toBe(false);
      expect(donationCreateSchema.safeParse({ ...VALID_DONATION, amount }).success).toBe(false);
    }
  });

  test("accepts decimal-string amounts up to numeric(10,2)", () => {
    for (const amount of ["0.01", "5", "99999999.99"]) {
      expect(donationAmountSchema.safeParse(amount).success).toBe(true);
    }
    // 9 integer digits overflow numeric(10,2) with two fraction digits.
    expect(donationAmountSchema.safeParse("999999999.99").success).toBe(false);
  });

  test("currency must be a 3-letter code", () => {
    expect(donationCreateSchema.safeParse({ ...VALID_DONATION, currency: "USD" }).success).toBe(
      true,
    );
    expect(donationCreateSchema.safeParse({ ...VALID_DONATION, currency: "DOLLAR" }).success).toBe(
      false,
    );
  });

  test("donationDate accepts ISO dates and datetimes, rejects junk", () => {
    expect(
      donationCreateSchema.safeParse({ ...VALID_DONATION, donationDate: "2026-02-10" }).success,
    ).toBe(true);
    expect(
      donationCreateSchema.safeParse({
        ...VALID_DONATION,
        donationDate: "2026-02-10T14:30:00.000Z",
      }).success,
    ).toBe(true);
    expect(
      donationCreateSchema.safeParse({ ...VALID_DONATION, donationDate: "last tuesday" }).success,
    ).toBe(false);
  });
});

describe("donationUpdateSchema (partial)", () => {
  test("each mutable field is independently optional", () => {
    expect(donationUpdateSchema.safeParse({ status: "completed" }).success).toBe(true);
    expect(donationUpdateSchema.safeParse({ notes: "Matched by employer" }).success).toBe(true);
    expect(donationUpdateSchema.safeParse({ receiptSent: true }).success).toBe(true);
    expect(donationUpdateSchema.safeParse({ campaign: "Annual fund" }).success).toBe(true);
  });

  test("accepts several fields at once", () => {
    const parsed = donationUpdateSchema.safeParse({
      status: "pledged",
      campaign: "Building fund",
      notes: null,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.status).toBe("pledged");
      expect(parsed.data.notes).toBeNull();
    }
  });

  test("rejects an empty update", () => {
    const parsed = donationUpdateSchema.safeParse({});
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(
        parsed.error.issues.some((issue) => issue.message.includes("At least one field")),
      ).toBe(true);
    }
  });

  test("rejects unknown statuses and oversized notes", () => {
    expect(donationUpdateSchema.safeParse({ status: "cancelled" }).success).toBe(false);
    expect(donationUpdateSchema.safeParse({ notes: "x".repeat(2001) }).success).toBe(false);
  });

  test("refuses the immutable money fields", () => {
    // zod strips keys the schema does not name (amount, donorName, ...);
    // with nothing mutable left, the "at least one field" refine rejects,
    // so a PATCH carrying only immutable fields is a 422, not a rewrite.
    const parsed = donationUpdateSchema.safeParse({ amount: "1.00", donorName: "X" });
    expect(parsed.success).toBe(false);
  });
});

describe("donationListQuerySchema", () => {
  test("coerces page/limit strings and applies defaults", () => {
    const parsed = donationListQuerySchema.safeParse({ page: "2", limit: "50" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.page).toBe(2);
      expect(parsed.data.limit).toBe(50);
      expect(parsed.data.status).toBeUndefined();
    }

    const defaults = donationListQuerySchema.safeParse({});
    expect(defaults.success).toBe(true);
    if (defaults.success) {
      expect(defaults.data.page).toBe(1);
      expect(defaults.data.limit).toBe(20);
    }
  });

  test("rejects out-of-range pagination", () => {
    expect(donationListQuerySchema.safeParse({ page: "0" }).success).toBe(false);
    expect(donationListQuerySchema.safeParse({ limit: "500" }).success).toBe(false);
    expect(donationListQuerySchema.safeParse({ limit: "0" }).success).toBe(false);
  });

  test("validates the optional status filter", () => {
    expect(donationListQuerySchema.safeParse({ status: "pledged" }).success).toBe(true);
    expect(donationListQuerySchema.safeParse({ status: "bogus" }).success).toBe(false);
  });
});
