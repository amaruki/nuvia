/**
 * Budget validation schemas (zod behavior only, no database). Covers the
 * category and transaction create schemas' money/enum rules, the PATCH
 * schema's partiality, the form schemas' coercion, and the list queries'
 * pagination and filter validation.
 */

import { describe, expect, test } from "bun:test";

import {
  budgetCategoryCreateSchema,
  budgetCategoryFormSchema,
  budgetCategoryListQuerySchema,
  budgetTransactionCreateSchema,
  budgetTransactionEditFormSchema,
  budgetTransactionFormSchema,
  budgetTransactionListQuerySchema,
  budgetTransactionStatusSchema,
  budgetTransactionTypeSchema,
  budgetTransactionUpdateSchema,
} from "@/lib/validation/budget.validation";

const VALID_CATEGORY = {
  name: "Events",
  color: "var(--chart-1)",
  allocatedAmount: "1200.00",
};

const VALID_TRANSACTION = {
  categoryId: "cat-1",
  description: "Conference venue deposit",
  amount: "450.00",
  type: "expense",
};

describe("budget enums", () => {
  test("accept only the mirrored enum values", () => {
    expect(budgetTransactionTypeSchema.safeParse("expense").success).toBe(true);
    expect(budgetTransactionTypeSchema.safeParse("income").success).toBe(true);
    expect(budgetTransactionTypeSchema.safeParse("refund").success).toBe(true);
    expect(budgetTransactionTypeSchema.safeParse("transfer").success).toBe(false);

    expect(budgetTransactionStatusSchema.safeParse("pending").success).toBe(true);
    expect(budgetTransactionStatusSchema.safeParse("approved").success).toBe(true);
    expect(budgetTransactionStatusSchema.safeParse("rejected").success).toBe(true);
    expect(budgetTransactionStatusSchema.safeParse("voided").success).toBe(false);
  });
});

describe("budgetCategoryCreateSchema", () => {
  test("accepts a valid category and trims the name", () => {
    const parsed = budgetCategoryCreateSchema.safeParse({ ...VALID_CATEGORY, name: "  Events " });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.name).toBe("Events");
      expect(parsed.data.description).toBeUndefined();
    }
  });

  test("requires name, color, and a money-string allocation", () => {
    expect(budgetCategoryCreateSchema.safeParse({ ...VALID_CATEGORY, name: "" }).success).toBe(
      false,
    );
    expect(budgetCategoryCreateSchema.safeParse({ ...VALID_CATEGORY, color: "" }).success).toBe(
      false,
    );
    expect(
      budgetCategoryCreateSchema.safeParse({ ...VALID_CATEGORY, allocatedAmount: "1200" }).success,
    ).toBe(true);
    expect(
      budgetCategoryCreateSchema.safeParse({ ...VALID_CATEGORY, allocatedAmount: "-5.00" }).success,
    ).toBe(false);
    expect(
      budgetCategoryCreateSchema.safeParse({ ...VALID_CATEGORY, allocatedAmount: "12.345" })
        .success,
    ).toBe(false);
    expect(
      budgetCategoryCreateSchema.safeParse({ ...VALID_CATEGORY, allocatedAmount: "abc" }).success,
    ).toBe(false);
  });

  test("treats an empty description as omitted", () => {
    const parsed = budgetCategoryCreateSchema.safeParse({
      ...VALID_CATEGORY,
      description: "",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.description).toBeUndefined();
    }
  });
});

describe("budgetCategoryFormSchema", () => {
  test("coerces the allocation from a number input", () => {
    const parsed = budgetCategoryFormSchema.safeParse({
      name: "Events",
      color: "var(--chart-1)",
      allocatedAmount: 1200,
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.allocatedAmount).toBe(1200);
    }
  });

  test("rejects negative allocations", () => {
    expect(
      budgetCategoryFormSchema.safeParse({
        name: "Events",
        color: "var(--chart-1)",
        allocatedAmount: -1,
      }).success,
    ).toBe(false);
  });
});

describe("budgetTransactionCreateSchema", () => {
  test("accepts a minimal transaction and defaults status to pending", () => {
    const parsed = budgetTransactionCreateSchema.safeParse(VALID_TRANSACTION);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.status).toBe("pending");
      expect(parsed.data.date).toBeUndefined();
      expect(parsed.data.vendor).toBeUndefined();
      expect(parsed.data.receiptUrl).toBeUndefined();
      expect(parsed.data.notes).toBeUndefined();
    }
  });

  test("coerces an ISO date string", () => {
    const parsed = budgetTransactionCreateSchema.safeParse({
      ...VALID_TRANSACTION,
      date: "2025-03-14T10:00:00.000Z",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.date).toBeInstanceOf(Date);
    }
  });

  test("requires a strictly positive money-string amount", () => {
    expect(
      budgetTransactionCreateSchema.safeParse({ ...VALID_TRANSACTION, amount: "0" }).success,
    ).toBe(false);
    expect(
      budgetTransactionCreateSchema.safeParse({ ...VALID_TRANSACTION, amount: "0.00" }).success,
    ).toBe(false);
    expect(
      budgetTransactionCreateSchema.safeParse({ ...VALID_TRANSACTION, amount: "-10.00" }).success,
    ).toBe(false);
    expect(
      budgetTransactionCreateSchema.safeParse({ ...VALID_TRANSACTION, amount: "ten" }).success,
    ).toBe(false);
  });

  test("requires category, description, and a valid type", () => {
    expect(
      budgetTransactionCreateSchema.safeParse({ ...VALID_TRANSACTION, categoryId: "" }).success,
    ).toBe(false);
    expect(
      budgetTransactionCreateSchema.safeParse({ ...VALID_TRANSACTION, description: "" }).success,
    ).toBe(false);
    expect(
      budgetTransactionCreateSchema.safeParse({ ...VALID_TRANSACTION, type: "transfer" }).success,
    ).toBe(false);
  });

  test("validates the receipt URL and treats empty optionals as omitted", () => {
    expect(
      budgetTransactionCreateSchema.safeParse({
        ...VALID_TRANSACTION,
        receiptUrl: "not-a-url",
      }).success,
    ).toBe(false);

    const parsed = budgetTransactionCreateSchema.safeParse({
      ...VALID_TRANSACTION,
      receiptUrl: "",
      vendor: "",
      notes: "",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.receiptUrl).toBeUndefined();
      expect(parsed.data.vendor).toBeUndefined();
      expect(parsed.data.notes).toBeUndefined();
    }
  });
});

describe("budgetTransactionFormSchema", () => {
  test("accepts form-shaped values with a number amount and date string", () => {
    const parsed = budgetTransactionFormSchema.safeParse({
      categoryId: "cat-1",
      description: "Snacks",
      amount: 12.5,
      date: "2025-03-14",
      type: "expense",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.status).toBe("pending");
    }
  });

  test("rejects zero amounts and empty dates", () => {
    expect(
      budgetTransactionFormSchema.safeParse({
        categoryId: "cat-1",
        description: "Snacks",
        amount: 0,
        date: "2025-03-14",
        type: "expense",
      }).success,
    ).toBe(false);
    expect(
      budgetTransactionFormSchema.safeParse({
        categoryId: "cat-1",
        description: "Snacks",
        amount: 5,
        date: "",
        type: "expense",
      }).success,
    ).toBe(false);
  });
});

describe("budgetTransactionUpdateSchema", () => {
  test("accepts a status-only or notes-only update", () => {
    expect(budgetTransactionUpdateSchema.safeParse({ status: "approved" }).success).toBe(true);
    expect(budgetTransactionUpdateSchema.safeParse({ notes: "Receipt verified" }).success).toBe(
      true,
    );
  });

  test("rejects an empty update and unknown statuses", () => {
    expect(budgetTransactionUpdateSchema.safeParse({}).success).toBe(false);
    expect(budgetTransactionUpdateSchema.safeParse({ status: "voided" }).success).toBe(false);
  });
});

describe("budgetTransactionEditFormSchema", () => {
  test("requires a known status", () => {
    expect(
      budgetTransactionEditFormSchema.safeParse({ status: "approved", notes: "" }).success,
    ).toBe(true);
    expect(budgetTransactionEditFormSchema.safeParse({ status: "nope" }).success).toBe(false);
  });
});

describe("list query schemas", () => {
  test("coerce pagination params with defaults", () => {
    const parsed = budgetTransactionListQuerySchema.safeParse({});
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.page).toBe(1);
      expect(parsed.data.limit).toBe(20);
      expect(parsed.data.type).toBeUndefined();
      expect(parsed.data.status).toBeUndefined();
      expect(parsed.data.categoryId).toBeUndefined();
    }

    const explicit = budgetCategoryListQuerySchema.safeParse({ page: "3", limit: "50" });
    expect(explicit.success).toBe(true);
    if (explicit.success) {
      expect(explicit.data.page).toBe(3);
      expect(explicit.data.limit).toBe(50);
    }
  });

  test("clamp and reject invalid pagination", () => {
    expect(budgetCategoryListQuerySchema.safeParse({ page: "0" }).success).toBe(false);
    expect(budgetTransactionListQuerySchema.safeParse({ limit: "101" }).success).toBe(false);
    expect(budgetTransactionListQuerySchema.safeParse({ limit: "0" }).success).toBe(false);
  });

  test("validate filter enums", () => {
    expect(
      budgetTransactionListQuerySchema.safeParse({ type: "income", status: "approved" }).success,
    ).toBe(true);
    expect(budgetTransactionListQuerySchema.safeParse({ type: "transfer" }).success).toBe(false);
    expect(budgetTransactionListQuerySchema.safeParse({ status: "voided" }).success).toBe(false);
    expect(budgetTransactionListQuerySchema.safeParse({ categoryId: "" }).success).toBe(false);
  });
});
