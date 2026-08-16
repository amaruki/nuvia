/**
 * Integration tests for the budget approval guardrail (issue #27,
 * finding 5). Before this fix, both write paths accepted status:"approved"
 * verbatim — three $900 approvals against a $1,000 category committed
 * $2,700 with no signal and no audit record.
 *
 * Guarded behaviour:
 * - an expense approval (create or update) is rejected when it would push
 *   the category past its allocation (BusinessLogicError BUDGET_EXCEEDED),
 * - the spent total excludes the row under re-evaluation on updates, so
 *   re-approving the same row is a no-op,
 * - income/refund rows and pending/rejected expenses never hit the check,
 * - every approval writes a BUDGET_APPROVAL audit entry (auth_logs).
 */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { authLog, budgetCategory, budgetTransaction, user } from "@/db/schema";
import { BusinessLogicError } from "@/lib/errors";
import {
  createBudgetCategory,
  createBudgetTransaction,
  getBudgetTransaction,
  updateBudgetTransaction,
} from "@/lib/services/budget.service";
import type { ActorContext } from "@/lib/services/subscription.service";

const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const createdCategoryIds: string[] = [];
const createdTransactionIds: string[] = [];
const createdUserIds: string[] = [];
let actor: ActorContext;

beforeAll(async () => {
  // approvedBy is a user FK — the actor must be a real user row.
  const [row] = await db
    .insert(user)
    .values({
      username: `budget-${stamp}`,
      email: `budget-${stamp}@example.test`,
      name: "Budget Guard Test Approver",
      role: "admin",
      emailVerified: false,
    })
    .returning({ id: user.id });
  createdUserIds.push(row.id);
  actor = { actorId: row.id, reason: "budget guardrail integration test" };
});

afterAll(async () => {
  // Deleting the category cascades its transactions (schema FK).
  for (const id of createdCategoryIds) {
    await db.delete(budgetCategory).where(eq(budgetCategory.id, id));
  }
  for (const id of createdUserIds) {
    await db.delete(user).where(eq(user.id, id));
  }
});

async function makeCategory(allocated: string): Promise<string> {
  const category = await createBudgetCategory({
    name: `budget-guard-${stamp}-${createdCategoryIds.length}`,
    color: "#000000",
    allocatedAmount: allocated,
  });
  createdCategoryIds.push(category.id);
  return category.id;
}

async function expectBudgetExceeded(fn: () => Promise<unknown>): Promise<void> {
  try {
    await fn();
    throw new Error("expected a BusinessLogicError but the call succeeded");
  } catch (error) {
    expect(error).toBeInstanceOf(BusinessLogicError);
    expect((error as BusinessLogicError).code).toBe("BUDGET_EXCEEDED");
  }
}

describe("budget approval guardrail (issue #27)", () => {
  test("an expense approval within budget succeeds and is audited", async () => {
    const categoryId = await makeCategory("1000.00");

    const row = await createBudgetTransaction(
      {
        categoryId,
        description: "Venue deposit",
        amount: "400.00",
        type: "expense",
        status: "approved",
      },
      actor,
    );
    createdTransactionIds.push(row.id);
    expect(row.status).toBe("approved");
    expect(row.approvedBy).toBe(actor.actorId);
    expect(row.approvedAt).not.toBeNull();

    const [audit] = await db
      .select()
      .from(authLog)
      .where(and(eq(authLog.eventType, "BUDGET_APPROVAL")))
      .orderBy()
      .limit(200);
    expect(audit).toBeDefined();
  });

  test("a create-path approval that exceeds the allocation is rejected", async () => {
    const categoryId = await makeCategory("1000.00");

    await expectBudgetExceeded(() =>
      createBudgetTransaction(
        {
          categoryId,
          description: "Over-budget expense",
          amount: "1500.00",
          type: "expense",
          status: "approved",
        },
        actor,
      ),
    );
  });

  test("stacked approvals cannot exceed the allocation", async () => {
    const categoryId = await makeCategory("1000.00");

    // Two $600 approvals against $1,000: the first lands, the second must
    // be rejected (the finding's scenario: repeated approvals silently
    // committing more than the category holds).
    const first = await createBudgetTransaction(
      {
        categoryId,
        description: "First commitment",
        amount: "600.00",
        type: "expense",
        status: "approved",
      },
      actor,
    );
    createdTransactionIds.push(first.id);

    await expectBudgetExceeded(() =>
      createBudgetTransaction(
        {
          categoryId,
          description: "Second commitment",
          amount: "600.00",
          type: "expense",
          status: "approved",
        },
        actor,
      ),
    );
  });

  test("an update-path approval that exceeds the allocation is rejected", async () => {
    const categoryId = await makeCategory("1000.00");

    // A pending expense that does not fit the budget.
    const pending = await createBudgetTransaction(
      {
        categoryId,
        description: "Big pending expense",
        amount: "1200.00",
        type: "expense",
        status: "pending",
      },
      actor,
    );
    createdTransactionIds.push(pending.id);

    await expectBudgetExceeded(() =>
      updateBudgetTransaction(pending.id, { status: "approved" }, actor),
    );

    // The row must remain pending after the rejected approval.
    const after = await getBudgetTransaction(pending.id);
    expect(after.status).toBe("pending");
  });

  test("re-approving the same expense is a no-op (self-exclusion)", async () => {
    const categoryId = await makeCategory("1000.00");

    const row = await createBudgetTransaction(
      {
        categoryId,
        description: "Exactly-at-limit expense",
        amount: "1000.00",
        type: "expense",
        status: "approved",
      },
      actor,
    );
    createdTransactionIds.push(row.id);

    // Approving it again must not fail: the row's own amount is excluded
    // from the spent total during the re-check.
    const same = await updateBudgetTransaction(row.id, { status: "approved" }, actor);
    expect(same.status).toBe("approved");
  });

  test("income and refund rows skip the budget check", async () => {
    const categoryId = await makeCategory("100.00");

    const income = await createBudgetTransaction(
      {
        categoryId,
        description: "Sponsorship income",
        amount: "5000.00",
        type: "income",
        status: "approved",
      },
      actor,
    );
    createdTransactionIds.push(income.id);
    expect(income.status).toBe("approved");

    const refund = await createBudgetTransaction(
      {
        categoryId,
        description: "Vendor refund",
        amount: "9999.99",
        type: "refund",
        status: "approved",
      },
      actor,
    );
    createdTransactionIds.push(refund.id);
    expect(refund.status).toBe("approved");
  });

  test("a pending expense does not consume budget until approved", async () => {
    const categoryId = await makeCategory("1000.00");

    const pending = await createBudgetTransaction(
      {
        categoryId,
        description: "Pending big expense",
        amount: "900.00",
        type: "expense",
        status: "pending",
      },
      actor,
    );
    createdTransactionIds.push(pending.id);

    // Pending rows are not spend — a full $1,000 approval still fits.
    const full = await createBudgetTransaction(
      {
        categoryId,
        description: "Full allocation commit",
        amount: "1000.00",
        type: "expense",
        status: "approved",
      },
      actor,
    );
    createdTransactionIds.push(full.id);

    // But now approving the pending $900 would exceed the allocation.
    await expectBudgetExceeded(() =>
      updateBudgetTransaction(pending.id, { status: "approved" }, actor),
    );
  });
});
