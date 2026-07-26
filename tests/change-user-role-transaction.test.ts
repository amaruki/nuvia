import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { user, authLog } from "@/db/schema";

async function createTestUser(role: string) {
  const [row] = await db
    .insert(user)
    .values({
      username: `txn-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      email: `txn-test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`,
      name: "Transaction Test",
      role,
      emailVerified: false,
    })
    .returning({ id: user.id });

  return row.id;
}

// changeUserRole (rbac.ts) wraps the role update and its audit-log insert
// in one db.transaction specifically so a failure between them can't
// silently drop the audit trail (docs/adr/0009). This exercises that same
// two-statement shape directly, forcing the second statement to fail via
// a genuine foreign-key violation (authLog.userId must reference an
// existing user), since changeUserRole's own validation makes a natural
// failure unreachable through its public API.
describe("changeUserRole's transaction", () => {
  test("rolls back the role update if the audit-log insert fails", async () => {
    const userId = await createTestUser("member");

    let threw = false;
    try {
      await db.transaction(async (tx) => {
        await tx.update(user).set({ role: "admin" }).where(eq(user.id, userId));

        await tx.insert(authLog).values({
          userId: "00000000-0000-0000-0000-000000000000", // doesn't exist -> FK violation
          eventType: "ROLE_CHANGE",
          severity: "INFO",
          message: "Role changed from member to admin",
        });
      });
    } catch {
      threw = true;
    }

    expect(threw).toBe(true);

    const row = await db.query.user.findFirst({ where: eq(user.id, userId) });
    expect(row?.role).toBe("member");
  });

  test("commits both statements when neither fails", async () => {
    const userId = await createTestUser("member");

    await db.transaction(async (tx) => {
      await tx.update(user).set({ role: "admin" }).where(eq(user.id, userId));

      await tx.insert(authLog).values({
        userId,
        eventType: "ROLE_CHANGE",
        severity: "INFO",
        message: "Role changed from member to admin",
      });
    });

    const row = await db.query.user.findFirst({ where: eq(user.id, userId) });
    expect(row?.role).toBe("admin");

    const logRow = await db.query.authLog.findFirst({ where: eq(authLog.userId, userId) });
    expect(logRow).toBeDefined();
  });
});
