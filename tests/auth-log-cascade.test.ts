import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { authLog, user } from "@/db/schema";

// auth_logs.user_id references users.id with ON DELETE CASCADE
// (src/db/schema/auth.ts). Without the cascade, better-auth's deleteUser
// hard-delete fails with a foreign-key violation for any user whose role
// was ever changed — the audit trail meant to record a change would block
// the self-service account deletion that follows it. This exercises the
// FK directly rather than through better-auth, which needs a live request
// lifecycle.
describe("auth_logs.user_id cascade", () => {
  test("deleting a user removes their audit-log rows", async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const [row] = await db
      .insert(user)
      .values({
        username: `cascade-test-${suffix}`,
        email: `cascade-test-${suffix}@example.test`,
        name: "Cascade Test",
        role: "member",
        emailVerified: false,
      })
      .returning({ id: user.id });

    await db.insert(authLog).values({
      userId: row.id,
      eventType: "ROLE_CHANGE",
      severity: "INFO",
      message: "Role changed from member to staff",
    });

    const before = await db.query.authLog.findFirst({ where: eq(authLog.userId, row.id) });
    expect(before).toBeDefined();

    await db.delete(user).where(eq(user.id, row.id));

    const after = await db.query.authLog.findFirst({ where: eq(authLog.userId, row.id) });
    expect(after).toBeUndefined();
  });
});
