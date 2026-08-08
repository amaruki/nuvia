import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { user } from "@/db/schema";
import { PUT } from "@/app/api/v1/auth/profile/route";
import { testIp } from "./helpers";

async function signUp(email: string) {
  const res = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": testIp() },
      body: JSON.stringify({
        email,
        password: "Sup3r-Secret-Passw0rd!",
        name: "Profile Test",
        username: `profile-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
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

async function updateProfile(cookie: string, body: unknown) {
  return PUT(
    new Request("http://localhost:3000/api/v1/auth/profile", {
      method: "PUT",
      headers: { "content-type": "application/json", cookie },
      body: JSON.stringify(body),
    }) as never,
  );
}

// The route used to forward the raw request body to better-auth's
// updateUser. These pin down the hardened whitelist behavior.
describe("PUT /api/v1/auth/profile", () => {
  test("updates whitelisted fields", async () => {
    const email = `profile-ok-${Date.now()}@example.test`;
    const { cookie } = await signUp(email);

    const res = await updateProfile(cookie, {
      name: "Renamed By Test",
      bio: "A short bio.",
    });
    expect(res.status).toBe(200);

    const row = await db.query.user.findFirst({ where: eq(user.email, email) });
    expect(row?.name).toBe("Renamed By Test");
    expect(row?.bio).toBe("A short bio.");
  });

  test("strips fields outside the whitelist — role cannot be self-assigned", async () => {
    const email = `profile-esc-${Date.now()}@example.test`;
    const { cookie } = await signUp(email);

    // role is the juicy one: updateUser honors additionalFields, and role
    // is one, marked input:false in auth.ts. The whitelist strips it
    // before it even gets that far, along with anything else undeclared.
    const res = await updateProfile(cookie, {
      name: "Honest Name",
      role: "superadmin",
      emailVerified: true,
      passwordHash: "attacker-controlled-hash",
    });
    expect(res.status).toBe(200);

    const row = await db.query.user.findFirst({ where: eq(user.email, email) });
    expect(row?.role).toBe("user");
    expect(row?.emailVerified).toBe(false);
    expect(row?.name).toBe("Honest Name");
  });

  test("rejects an invalid field value instead of passing it through", async () => {
    const email = `profile-invalid-${Date.now()}@example.test`;
    const { cookie } = await signUp(email);

    const res = await updateProfile(cookie, {
      bio: "x".repeat(501), // schema caps bio at 500
    });
    expect(res.status).toBe(422);
    expect(res.headers.get("content-type")).toContain("application/problem+json");
  });
});
