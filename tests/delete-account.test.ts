import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { user } from "@/db/schema";

async function signUp(email: string, password: string) {
  const res = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        name: "Delete Me",
        username: `delete-me-${Date.now()}`,
      }),
    }),
  );

  const body = (await res.json()) as { user?: { id: string } };
  const cookie = res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");

  if (!res.ok || !body.user) {
    throw new Error(`sign-up failed: ${res.status} ${JSON.stringify(body)}`);
  }

  return { userId: body.user.id, cookie };
}

async function signInOk(email: string, password: string) {
  const res = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-in/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),
  );
  return res.ok;
}

describe("DELETE /api/v1/auth/delete-account", () => {
  test("removes the user row and a second login with the same credentials fails", async () => {
    const email = `delete-account-${Date.now()}@example.test`;
    const password = "Sup3r-Secret-Passw0rd!";

    const { userId, cookie } = await signUp(email, password);

    expect(await signInOk(email, password)).toBe(true);

    const deleteRes = await import("@/app/api/v1/auth/delete-account/route").then(({ DELETE }) =>
      DELETE(
        new Request("http://localhost:3000/api/v1/auth/delete-account", {
          method: "DELETE",
          headers: { cookie },
        }) as never,
      ),
    );
    expect(deleteRes.status).toBe(200);

    const row = await db.query.user.findFirst({ where: eq(user.id, userId) });
    expect(row).toBeUndefined();

    expect(await signInOk(email, password)).toBe(false);
  });
});
