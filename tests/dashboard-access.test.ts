import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { navigationData, type NavItemData } from "@/lib/navigation-data";
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

  test("superadmin passes sections through the explicit role lists", async () => {
    // dashboard-access.ts has no superadmin special case: these paths
    // pass because navigation-data.ts names "superadmin" in each role
    // list (finance entirely, users sub-pages, and more used to omit it,
    // which a since-removed special case papered over).
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

  test("superadmin is allowed on a sample path from every section", async () => {
    // Every section's role list now names superadmin, so one superadmin
    // must reach a sample of every section — including the paths that
    // used to rely on the removed special case (finance, memberships,
    // events registrations, users sub-pages, and the rest below).
    const { cookie, userId } = await signUpWithRole("superadmin");

    const sectionPaths = [
      "/dashboard",
      "/dashboard/users/roles",
      "/dashboard/users/security",
      "/dashboard/memberships",
      "/dashboard/memberships/tiers",
      "/dashboard/events",
      "/dashboard/events/registrations",
      "/dashboard/finance",
      "/dashboard/finance/reports",
      "/dashboard/finance/gateways",
      "/dashboard/organization",
      "/dashboard/organization/budget",
      "/dashboard/content",
      "/dashboard/content/media",
      "/dashboard/learning/admin",
      "/dashboard/forums/moderation",
      "/dashboard/jobs",
      "/dashboard/awards/programs",
      "/dashboard/communications/newsletters",
      "/dashboard/analytics/financial",
      "/dashboard/settings/system",
      "/dashboard/tools/database",
      "/dashboard/profile",
    ];

    try {
      for (const path of sectionPaths) {
        const res = await proxy(dashboardRequest(path, cookie));
        expect({ path, status: res.status }).toEqual({ path, status: 200 });
      }
    } finally {
      // Other test files assert global superadmin counts, so this row
      // must not outlive the test.
      await db.delete(user).where(eq(user.id, userId));
    }
  });

  test("roles absent from a section's list are still denied", async () => {
    const { cookie } = await signUpWithRole("member");

    const finance = await proxy(dashboardRequest("/dashboard/finance", cookie));
    expect(finance.status).toBe(307);
    const financeLocation = new URL(finance.headers.get("location")!);
    expect(financeLocation.pathname).toBe("/dashboard");
    expect(financeLocation.searchParams.get("error")).toBe("forbidden");

    const memberships = await proxy(dashboardRequest("/dashboard/memberships", cookie));
    expect(memberships.status).toBe(307);

    const financialAnalytics = await proxy(
      dashboardRequest("/dashboard/analytics/financial", cookie),
    );
    expect(financialAnalytics.status).toBe(307);
  });

  test("listed roles keep their access after the cleanup", async () => {
    const { cookie } = await signUpWithRole("treasurer");

    const finance = await proxy(dashboardRequest("/dashboard/finance", cookie));
    expect(finance.status).toBe(200);

    const reports = await proxy(dashboardRequest("/dashboard/finance/reports", cookie));
    expect(reports.status).toBe(200);

    // treasurer is not on the user-management lists — the gate stays
    // purely list-driven, with no special case in either direction.
    const userRoles = await proxy(dashboardRequest("/dashboard/users/roles", cookie));
    expect(userRoles.status).toBe(307);
  });
});

describe("navigation-data.ts role lists", () => {
  test("every nav role list names superadmin", () => {
    // The gate and the sidebar have no superadmin special case, so the
    // data itself must name superadmin wherever it names any role.
    const withRoles: NavItemData[] = [];
    const pending: NavItemData[] = [...navigationData];
    while (pending.length > 0) {
      const item = pending.pop()!;
      if (item.roles) withRoles.push(item);
      if (item.subItems) pending.push(...item.subItems);
    }

    expect(withRoles.length).toBeGreaterThan(50);
    const missing = withRoles.filter((item) => !item.roles?.includes("superadmin"));
    expect(missing.map((item) => item.path)).toEqual([]);
  });
});
