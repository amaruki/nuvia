import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { user } from "@/db/schema";
import { getCurrentUser, requirePermission } from "@/lib/rbac";
import { testIp } from "./helpers";

async function signUpWithRole(role: string) {
  const res = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": testIp() },
      body: JSON.stringify({
        email: `rbac-test-${role}-${Date.now()}@example.test`,
        password: "Sup3r-Secret-Passw0rd!",
        name: "RBAC Test",
        username: `rbac-test-${role}-${Date.now()}`,
      }),
    }),
  );
  const body = (await res.json()) as { user: { id: string } };
  const cookie = res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");

  await db.update(user).set({ role }).where(eq(user.id, body.user.id));

  return { userId: body.user.id, cookie };
}

describe("getCurrentUser", () => {
  test("the returned role matches what's actually in the database, not a stale session value", async () => {
    const { userId, cookie } = await signUpWithRole("member");

    // Change the role directly in the DB after the session was created —
    // getCurrentUser must reflect the current row, not whatever role
    // existed at sign-up time.
    await db.update(user).set({ role: "admin" }).where(eq(user.id, userId));

    const currentUser = await getCurrentUser(new Headers({ cookie }));
    expect(currentUser?.role).toBe("admin");
  });

  test("returns null without a valid session", async () => {
    const currentUser = await getCurrentUser(new Headers());
    expect(currentUser).toBeNull();
  });
});

describe("requirePermission", () => {
  test("denies without a session", async () => {
    const result = await requirePermission("users:read", new Headers());

    expect(result.success).toBe(false);
    expect(result.error?.status).toBe(401);
  });

  test("denies a member lacking the permission", async () => {
    const { cookie } = await signUpWithRole("member");

    const result = await requirePermission("users:create", new Headers({ cookie }));

    expect(result.success).toBe(false);
    expect(result.error?.status).toBe(403);
  });

  test("allows an admin with the permission", async () => {
    const { cookie } = await signUpWithRole("admin");

    const result = await requirePermission("users:create", new Headers({ cookie }));

    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
  });
});
