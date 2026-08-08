import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { user } from "@/db/schema";
import { testIp } from "./helpers";

async function signUp(email: string, password: string) {
  const res = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": testIp() },
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
      headers: { "content-type": "application/json", "x-forwarded-for": testIp() },
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

  test("refuses to delete the last superadmin, and allows it once a second exists", async () => {
    const { DELETE } = await import("@/app/api/v1/auth/delete-account/route");
    const password = "Sup3r-Secret-Passw0rd!";

    const first = await signUp(`last-superadmin-${Date.now()}@example.test`, password);
    await db.update(user).set({ role: "superadmin" }).where(eq(user.id, first.userId));

    const refused = await DELETE(
      new Request("http://localhost:3000/api/v1/auth/delete-account", {
        method: "DELETE",
        headers: { cookie: first.cookie },
      }) as never,
    );
    expect(refused.status).toBe(409);

    // Still there.
    const row = await db.query.user.findFirst({ where: eq(user.id, first.userId) });
    expect(row).toBeDefined();

    // A second superadmin removes the lockout.
    const second = await signUp(`second-superadmin-${Date.now()}@example.test`, password);
    await db.update(user).set({ role: "superadmin" }).where(eq(user.id, second.userId));

    const allowed = await DELETE(
      new Request("http://localhost:3000/api/v1/auth/delete-account", {
        method: "DELETE",
        headers: { cookie: first.cookie },
      }) as never,
    );
    expect(allowed.status).toBe(200);

    // Cleanup: the second superadmin is now the only one, so delete them
    // through the same 409 guard path by first dropping them to member.
    await db.update(user).set({ role: "member" }).where(eq(user.id, second.userId));
    await db.delete(user).where(eq(user.id, second.userId));
  });
});
