import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { user } from "@/db/schema";
import { proxy } from "@/proxy";
import { testIp } from "./helpers";

async function signUpWithRole(role: string) {
  const email = `dashboard-access-${role}-${Date.now()}@example.test`;
  const res = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": testIp() },
      body: JSON.stringify({
        email,
        password: "Sup3r-Secret-Passw0rd!",
        name: "Dashboard Access Test",
        username: `dashboard-access-${role}-${Date.now()}`,
      }),
    }),
  );
  const body = (await res.json()) as { user: { id: string } };
  const cookie = res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");

  await db.update(user).set({ role }).where(eq(user.id, body.user.id));

  return { cookie, userId: body.user.id };
}

function dashboardRequest(pathname: string, cookie: string) {
  return new NextRequest(`http://localhost:3000${pathname}`, {
    headers: { cookie },
  });
}

describe("proxy() dashboard role gate", () => {
  test("a plain member is redirected away from an admin-only section", async () => {
    const { cookie } = await signUpWithRole("member");
    const res = await proxy(dashboardRequest("/dashboard/users/roles", cookie));

    expect(res.status).toBe(307);
    const location = new URL(res.headers.get("location")!);
    expect(location.pathname).toBe("/dashboard");
    expect(location.searchParams.get("error")).toBe("forbidden");
  });

  test("an admin can reach the same admin-only section", async () => {
    const { cookie } = await signUpWithRole("admin");
    const res = await proxy(dashboardRequest("/dashboard/users/roles", cookie));

    expect(res.status).toBe(200);
  });

  test("superadmin passes sections whose nav role lists omit it", async () => {
    // navigation-data.ts leaves "superadmin" out of most role lists
    // (finance entirely, users sub-pages, and more). The gate must not
    // lock the one role out that has to reach everything.
    const { cookie, userId } = await signUpWithRole("superadmin");

    try {
      const finance = await proxy(dashboardRequest("/dashboard/finance", cookie));
      expect(finance.status).toBe(200);

      const financeReports = await proxy(dashboardRequest("/dashboard/finance/reports", cookie));
      expect(financeReports.status).toBe(200);

      const userRoles = await proxy(dashboardRequest("/dashboard/users/roles", cookie));
      expect(userRoles.status).toBe(200);
    } finally {
      // Other test files assert global superadmin counts, so this row
      // must not outlive the test.
      await db.delete(user).where(eq(user.id, userId));
    }
  });

  test("a plain member can reach a page open to every role", async () => {
    const { cookie } = await signUpWithRole("member");
    const res = await proxy(dashboardRequest("/dashboard/profile", cookie));

    expect(res.status).toBe(200);
  });

  test("an unauthenticated request is redirected to login, not the role gate", async () => {
    const res = await proxy(new NextRequest("http://localhost:3000/dashboard/users/roles"));

    expect(res.status).toBe(307);
    const location = new URL(res.headers.get("location")!);
    expect(location.pathname).toBe("/auth/login");
  });
});
