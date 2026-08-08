import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { createEmailVerificationToken } from "better-auth/api";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { user } from "@/db/schema";
import { POST } from "@/app/api/v1/auth/verify-email/route";
import { testIp } from "./helpers";

async function verify(token: unknown, ip = testIp()) {
  return POST(
    new Request("http://localhost:3000/api/v1/auth/verify-email", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify(typeof token === "undefined" ? {} : { token }),
    }) as never,
  );
}

async function signUp(email: string) {
  const res = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": testIp() },
      body: JSON.stringify({
        email,
        password: "Sup3r-Secret-Passw0rd!",
        name: "Verify Me",
        username: `verify-me-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      }),
    }),
  );

  if (!res.ok) {
    throw new Error(`sign-up failed: ${res.status}`);
  }
}

// The previous implementation was a placeholder that returned success for
// any input without verifying anything. These pin down the hardened
// behavior: nothing short of a valid signed token produces a success.
describe("POST /api/v1/auth/verify-email", () => {
  test("rejects a request with no token", async () => {
    const res = await verify(undefined);

    expect(res.status).toBe(422);
    expect(res.headers.get("content-type")).toContain("application/problem+json");
  });

  test("rejects a forged token instead of pretending it verified", async () => {
    const res = await verify("forged-token-that-is-not-a-real-jwt");

    expect(res.ok).toBe(false);
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.headers.get("content-type")).toContain("application/problem+json");

    const body = (await res.json()) as { title?: string };
    expect(body.title).toBe("Email verification failed");
  });

  test("a valid token flips the user's emailVerified flag", async () => {
    const email = `verify-email-${Date.now()}@example.test`;
    await signUp(email);

    const before = await db.query.user.findFirst({ where: eq(user.email, email) });
    expect(before?.emailVerified).toBe(false);

    // Same secret and signing scheme better-auth itself uses, so this is
    // a genuine end-to-end check of the route, not a mock.
    const token = await createEmailVerificationToken(
      process.env.BETTER_AUTH_SECRET!,
      email,
      undefined,
      300,
    );

    const res = await verify(token);
    expect(res.status).toBe(200);

    const after = await db.query.user.findFirst({ where: eq(user.email, email) });
    expect(after?.emailVerified).toBe(true);

    // Cleanup: this user has no auth_logs/sessions worth keeping.
    await db.delete(user).where(eq(user.id, after!.id));
  });
});
