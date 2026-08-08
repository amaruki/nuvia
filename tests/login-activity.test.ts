import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { user, userLoginActivity } from "@/db/schema";
import { resolveLoginIdentifier } from "@/lib/auth/login-activity";
import { POST as LOGIN } from "@/app/api/v1/auth/login/route";
import { GET as GET_ACTIVITIES } from "@/app/api/v1/auth/login-activities/route";
import { testIp } from "./helpers";

async function signUp(email: string, username: string) {
  const res = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": testIp() },
      body: JSON.stringify({
        email,
        password: "Sup3r-Secret-Passw0rd!",
        name: "Login Activity Test",
        username,
      }),
    }),
  );

  const cookie = res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");

  if (!res.ok) {
    throw new Error(`sign-up failed: ${res.status}`);
  }

  return { cookie };
}

async function login(emailOrUsername: string, password: string) {
  return LOGIN(
    new Request("http://localhost:3000/api/v1/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": testIp() },
      body: JSON.stringify({ emailOrUsername, password }),
    }) as never,
  );
}

describe("resolveLoginIdentifier", () => {
  test("emails pass through lowercased", async () => {
    expect(await resolveLoginIdentifier("Someone@Example.TEST")).toBe("someone@example.test");
  });

  test("an unknown identifier comes back unchanged (no existence oracle)", async () => {
    expect(await resolveLoginIdentifier(`ghost-${Date.now()}`)).toMatch(/^ghost-/);
  });
});

describe("username sign-in", () => {
  test("a user can sign in with their username, not just their email", async () => {
    const suffix = `${Date.now()}`;
    const email = `username-login-${suffix}@example.test`;
    const username = `uname_login_${suffix}`;

    await signUp(email, username);

    const byUsername = await login(username, "Sup3r-Secret-Passw0rd!");
    expect(byUsername.status).toBe(200);
  });
});

describe("login activity recording and retrieval", () => {
  test("a successful and a failed attempt both land in the caller's own feed", async () => {
    const suffix = `${Date.now()}`;
    const email = `login-activity-${suffix}@example.test`;
    const username = `activity_${suffix}`;

    const { cookie } = await signUp(email, username);

    // One success, one wrong-password failure.
    expect((await login(email, "Sup3r-Secret-Passw0rd!")).status).toBe(200);
    expect((await login(email, "Wr0ng-Password!")).status).toBe(401);

    const res = await GET_ACTIVITIES(
      new Request("http://localhost:3000/api/v1/auth/login-activities?page=1&limit=10", {
        headers: { cookie },
      }) as never,
    );
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      data: {
        activities: Array<{ successful: boolean; ipAddress: string }>;
        pagination: { total: number };
      };
    };

    // Sign-up auto-signs in through better-auth's own path (no activity
    // row), so the feed holds exactly the two attempts made above.
    expect(body.data.pagination.total).toBe(2);
    expect(body.data.activities.map((a) => a.successful).sort()).toEqual([false, true]);

    // Cleanup: keep the shared database free of this test's users.
    const row = await db.query.user.findFirst({ where: eq(user.email, email) });
    if (row) {
      await db.delete(userLoginActivity).where(eq(userLoginActivity.userId, row.id));
      await db.delete(user).where(eq(user.id, row.id));
    }
  });
});
