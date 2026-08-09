/**
 * Demo mode (UI-39 — docs/planning/03-frontend-improvement-plan.md L137-141).
 *
 * Red-first coverage for all three stages:
 *
 *   Stage 1 — scripts/seed-demo.ts seeds audience-facing content THROUGH the
 *             existing services: organization singleton, membership tiers,
 *             events (PUBLISHED/REGISTRATION_OPEN/IN_PROGRESS ×
 *             PUBLIC/MEMBERS_ONLY), PUBLISHED job postings with live
 *             deadlines, PUBLISHED articles + one ANNOUNCEMENT, forum
 *             categories with PUBLISHED posts, ACTIVE chapters/committees,
 *             courses + one ACTIVE certificate.
 *   Stage 2 — "Explore the demo" CTA in the landing hero + demo label in the
 *             footer, both gated on DEMO_MODE, both stating that data resets
 *             daily. No Docs links.
 *   Stage 3 — disposable demo account (never a seeded admin), crypto-random
 *             rotating password printed to stdout, dedicated rate-limited
 *             login route, dashboard banner on every dashboard page, and the
 *             demo role denied on settings/payments/webhooks/backup/tools
 *             style paths.
 */
/* oxlint-disable no-console — the seed prints the rotated credential to stdout by design. */
import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { and, eq, inArray, like, notInArray } from "drizzle-orm";
import { NextRequest } from "next/server";
import type { ReactElement } from "react";

import { HeroSection } from "@/app/_components/hero-section";
import { SiteFooter } from "@/app/_components/site-footer";
import { POST as demoLoginPost } from "@/app/api/v1/demo/login/route";
import { DemoBanner } from "@/app/dashboard/_components/demo-banner";
import { db } from "@/db/client";
import {
  account,
  activeDevice,
  certificate,
  chapter,
  committee,
  content,
  course,
  customRole,
  event,
  forumPost,
  jobPosting,
  membershipTier,
  session,
  user,
  userLoginActivity,
} from "@/db/schema";
import { auth } from "@/lib/auth";
import { isRoleAllowedForPath } from "@/lib/dashboard-access";
import { DEMO_ROLE, DEMO_USER_EMAIL } from "@/lib/demo";
import { isDemoMode } from "@/lib/env";
import { RATE_LIMITS } from "@/lib/rate-limit";
import { getOrganization } from "@/lib/services/organization.service";
import { isPredefinedRole } from "@/types/dashboard.types";
import { proxy } from "@/proxy";
import { resetDemo, seedDemo, wipeDemo, type DemoSeedResult } from "../scripts/seed-demo";
import { testIp } from "./helpers";

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function setDemoMode(on: boolean): void {
  if (on) process.env.DEMO_MODE = "true";
  else delete process.env.DEMO_MODE;
}

/** Recursively walk a React element tree, visiting every element. */
function walkReact(
  node: unknown,
  visit: (element: ReactElement<Record<string, unknown>>) => void,
): void {
  if (node === null || node === undefined || typeof node === "boolean") return;
  if (Array.isArray(node)) {
    for (const child of node) walkReact(child, visit);
    return;
  }
  if (typeof node !== "object") return;
  const element = node as ReactElement<Record<string, unknown>>;
  visit(element);
  const children = element.props?.children;
  if (children !== undefined) walkReact(children, visit);
}

function collectText(node: unknown): string {
  let text = "";
  const walk = (n: unknown): void => {
    if (n === null || n === undefined || typeof n === "boolean") return;
    if (typeof n === "string" || typeof n === "number") {
      text += `${n} `;
      return;
    }
    if (Array.isArray(n)) {
      for (const child of n) walk(child);
      return;
    }
    if (typeof n !== "object") return;
    walk((n as ReactElement<Record<string, unknown>>).props?.children);
  };
  walk(node);
  return text;
}

function collectHrefs(node: unknown): string[] {
  const hrefs: string[] = [];
  walkReact(node, (element) => {
    const href = element.props?.href;
    if (typeof href === "string") hrefs.push(href);
  });
  return hrefs;
}

function demoLoginRequest(body: Record<string, unknown>, ip: string): NextRequest {
  return new NextRequest("http://localhost:3000/api/v1/demo/login", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

async function signUpWithRole(role: string): Promise<{ cookie: string; userId: string }> {
  const email = `demo-mode-${role}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.test`;
  const res = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": testIp() },
      body: JSON.stringify({
        email,
        password: "Demo-Mode-Test-Password-1!",
        name: "Demo Mode Test User",
        username: `demomode${Date.now()}${Math.floor(Math.random() * 1e6)}`,
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

async function deleteUserCompletely(userId: string): Promise<void> {
  await db.delete(userLoginActivity).where(eq(userLoginActivity.userId, userId));
  await db.delete(session).where(eq(session.userId, userId));
  await db.delete(account).where(eq(account.userId, userId));
  await db.delete(activeDevice).where(eq(activeDevice.userId, userId));
  await db.delete(user).where(eq(user.id, userId));
}

const FORBIDDEN_DEMO_PATHS = [
  "/dashboard/settings/general",
  "/dashboard/settings/security",
  "/dashboard/tools",
  "/dashboard/tools/database",
  "/dashboard/tools/backup",
  "/dashboard/users",
  "/dashboard/users/roles",
  "/dashboard/finance",
  "/dashboard/finance/gateways",
  "/dashboard/analytics",
  "/dashboard/communications",
  "/dashboard/memberships",
  "/dashboard/memberships/tiers",
  "/dashboard/memberships/directory",
];

const ALLOWED_DEMO_PATHS = [
  "/dashboard",
  "/dashboard/my",
  "/dashboard/events/calendar",
  "/dashboard/content/articles",
  "/dashboard/content/announcements",
  "/dashboard/learning/courses",
  "/dashboard/learning/my-courses",
  "/dashboard/learning/certifications",
  "/forums",
  "/dashboard/jobs",
  "/dashboard/awards/nominate",
  "/dashboard/organization/chapters",
  "/dashboard/organization/committees",
  "/dashboard/profile",
  "/dashboard/preferences",
];

// ---------------------------------------------------------------------------
// stage 3 — env flag + role shape (no DB)
// ---------------------------------------------------------------------------

describe("isDemoMode()", () => {
  test("reads DEMO_MODE lazily on every call", () => {
    delete process.env.DEMO_MODE;
    expect(isDemoMode()).toBe(false);
    process.env.DEMO_MODE = "false";
    expect(isDemoMode()).toBe(false);
    process.env.DEMO_MODE = "1";
    expect(isDemoMode()).toBe(false);
    process.env.DEMO_MODE = "true";
    expect(isDemoMode()).toBe(true);
    delete process.env.DEMO_MODE;
    expect(isDemoMode()).toBe(false);
  });
});

describe("demo role shape", () => {
  test("the demo role is not a predefined role", () => {
    expect(isPredefinedRole(DEMO_ROLE)).toBe(false);
  });

  test("a dedicated demoLogin rate limit exists and is strict", () => {
    const config = RATE_LIMITS.demoLogin;
    expect(config).toBeDefined();
    expect(config.max).toBeLessThanOrEqual(10);
    expect(config.windowSeconds).toBeGreaterThanOrEqual(60);
  });
});

describe("demo role gate (dashboard-access)", () => {
  test("demo is denied on every sensitive dashboard path", () => {
    for (const path of FORBIDDEN_DEMO_PATHS) {
      expect({ path, allowed: isRoleAllowedForPath(path, DEMO_ROLE) }).toEqual({
        path,
        allowed: false,
      });
    }
  });

  test("demo is allowed on the audience-facing dashboard paths", () => {
    for (const path of ALLOWED_DEMO_PATHS) {
      expect({ path, allowed: isRoleAllowedForPath(path, DEMO_ROLE) }).toEqual({
        path,
        allowed: true,
      });
    }
  });

  test("demo denial does not loosen any existing role's access", () => {
    // A plain member keeps being denied on admin paths.
    expect(isRoleAllowedForPath("/dashboard/settings/general", "member")).toBe(false);
    expect(isRoleAllowedForPath("/dashboard/finance", "member")).toBe(false);
    // Admins keep their access.
    expect(isRoleAllowedForPath("/dashboard/settings/general", "admin")).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// stage 2 — landing surfaces
// ---------------------------------------------------------------------------

describe("landing demo surfaces (stage 2)", () => {
  test("hero hides the demo CTA when DEMO_MODE is off", () => {
    setDemoMode(false);
    const text = collectText(HeroSection());
    expect(text.toLowerCase()).not.toContain("explore the demo");
  });

  test("hero shows an 'Explore the demo' CTA pointing at the login page when DEMO_MODE is on", () => {
    setDemoMode(true);
    const hero = HeroSection();
    const text = collectText(hero);
    expect(text.toLowerCase()).toContain("explore the demo");
    expect(text.toLowerCase()).toContain("resets daily");
    // The CTA goes to the login page — never to Docs.
    const hrefs = collectHrefs(hero);
    expect(hrefs).toContain("/auth/login");
    expect(hrefs.filter((href) => href.includes("/docs"))).toEqual([]);
  });

  test("footer hides the demo label when DEMO_MODE is off", () => {
    setDemoMode(false);
    const text = collectText(SiteFooter());
    expect(text.toLowerCase()).not.toContain("demo instance");
  });

  test("footer shows a demo label stating data resets daily when DEMO_MODE is on", () => {
    setDemoMode(true);
    const text = collectText(SiteFooter());
    expect(text.toLowerCase()).toContain("demo instance");
    expect(text.toLowerCase()).toContain("resets daily");
    // The docs portal (UI-40) is public regardless of demo mode; the
    // orchestrator wires its footer link centrally.
    expect(collectHrefs(SiteFooter())).toContain("/docs");
  });
});

describe("DemoBanner (stage 3)", () => {
  test("renders nothing when DEMO_MODE is off", () => {
    setDemoMode(false);
    expect(DemoBanner()).toBeNull();
  });

  test("renders a status banner stating data resets daily when DEMO_MODE is on", () => {
    setDemoMode(true);
    const banner = DemoBanner();
    expect(banner).not.toBeNull();
    const text = collectText(banner).toLowerCase();
    expect(text).toContain("demo");
    expect(text).toContain("resets daily");
  });
});

// ---------------------------------------------------------------------------
// stage 1 — seed-demo content
// ---------------------------------------------------------------------------

describe("seed-demo (stage 1)", () => {
  let seeded: DemoSeedResult;
  let printedLines: string[] = [];

  beforeAll(() => {
    setDemoMode(true);
  });

  test("refuses to run when DEMO_MODE is off", async () => {
    setDemoMode(false);
    try {
      await expect(seedDemo()).rejects.toThrow(/DEMO_MODE/);
    } finally {
      setDemoMode(true);
    }
  });

  test("seeds audience-facing content through the existing services", async () => {
    const originalLog = console.log;
    console.log = (...args: unknown[]) => {
      printedLines.push(args.map(String).join(" "));
    };
    try {
      seeded = await seedDemo();
    } finally {
      console.log = originalLog;
    }

    // Credential shape: crypto-random, strong, printed to stdout.
    expect(seeded.email).toBe(DEMO_USER_EMAIL);
    expect(seeded.password.length).toBeGreaterThanOrEqual(16);
    expect(seeded.password).toMatch(/[A-Z]/);
    expect(seeded.password).toMatch(/[a-z]/);
    expect(seeded.password).toMatch(/[0-9]/);
    const printedPasswordLines = printedLines.filter((line) => line.includes(seeded.password));
    expect(printedPasswordLines.length).toBe(1);

    // The disposable account exists, with the demo role — and it is the ONLY
    // privileged-looking account in the demo namespace.
    const demoUsers = await db
      .select({ id: user.id, role: user.role })
      .from(user)
      .where(eq(user.email, DEMO_USER_EMAIL));
    expect(demoUsers.length).toBe(1);
    expect(demoUsers[0].role).toBe(DEMO_ROLE);

    const privilegedInNamespace = await db
      .select({ id: user.id })
      .from(user)
      .where(
        and(
          like(user.email, "%@nuvia.test"),
          notInArray(user.role, ["member", "moderator", DEMO_ROLE]),
        ),
      );
    expect(privilegedInNamespace).toEqual([]);

    // Custom role row: read-only permissions, nothing admin-flavored.
    const roleRows = await db
      .select({ permissions: customRole.permissions, isActive: customRole.isActive })
      .from(customRole)
      .where(eq(customRole.name, DEMO_ROLE));
    expect(roleRows.length).toBe(1);
    expect(roleRows[0].isActive).toBe(true);
    const permissions = roleRows[0].permissions as string[];
    expect(permissions.length).toBeGreaterThan(0);
    expect(permissions.every((p) => p.endsWith(":read"))).toBe(true);
    for (const forbidden of [
      "users:",
      "memberships:",
      "finance:",
      "analytics:",
      "communications:",
      "system:",
    ]) {
      expect(permissions.filter((p) => p.startsWith(forbidden))).toEqual([]);
    }

    // Organization singleton carries demo branding.
    const org = await getOrganization();
    expect(org.name.toLowerCase()).toContain("demo");

    // Membership tiers.
    const tiers = await db
      .select({ name: membershipTier.name })
      .from(membershipTier)
      .where(like(membershipTier.name, "demo-%"));
    expect(tiers.length).toBeGreaterThanOrEqual(3);

    // Events: the three statuses × both visibilities.
    const events = await db
      .select({ status: event.status, visibility: event.visibility })
      .from(event)
      .where(like(event.slug, "demo-%"));
    expect(events.length).toBeGreaterThanOrEqual(4);
    const statuses = new Set(events.map((e) => e.status));
    expect(statuses.has("PUBLISHED")).toBe(true);
    expect(statuses.has("REGISTRATION_OPEN")).toBe(true);
    expect(statuses.has("IN_PROGRESS")).toBe(true);
    const visibilities = new Set(events.map((e) => e.visibility));
    expect(visibilities.has("PUBLIC")).toBe(true);
    expect(visibilities.has("MEMBERS_ONLY")).toBe(true);

    // Job postings: published with a live deadline.
    const jobs = await db
      .select({
        status: jobPosting.status,
        applicationDeadline: jobPosting.applicationDeadline,
        publishedAt: jobPosting.publishedAt,
      })
      .from(jobPosting)
      .where(like(jobPosting.slug, "demo-%"));
    expect(jobs.length).toBeGreaterThanOrEqual(2);
    for (const job of jobs) {
      expect(job.status).toBe("PUBLISHED");
      expect(job.publishedAt).not.toBeNull();
      expect(job.applicationDeadline?.getTime()).toBeGreaterThan(Date.now());
    }

    // Content: published articles plus exactly one published announcement.
    const items = await db
      .select({ type: content.type, status: content.status })
      .from(content)
      .where(like(content.slug, "demo-%"));
    const articles = items.filter((item) => item.type === "ARTICLE");
    const announcements = items.filter((item) => item.type === "ANNOUNCEMENT");
    expect(articles.length).toBeGreaterThanOrEqual(2);
    expect(articles.every((item) => item.status === "PUBLISHED")).toBe(true);
    expect(announcements.length).toBe(1);
    expect(announcements[0].status).toBe("PUBLISHED");

    // Forums: at least one PUBLISHED post by a demo-namespace author.
    const posts = await db
      .select({ status: forumPost.status, userId: forumPost.userId })
      .from(forumPost)
      .where(like(forumPost.title, "Demo:%"));
    expect(posts.length).toBeGreaterThanOrEqual(2);
    expect(posts.every((post) => post.status === "PUBLISHED")).toBe(true);
    const authorIds = [...new Set(posts.map((post) => post.userId))];
    const authors = await db
      .select({ email: user.email })
      .from(user)
      .where(inArray(user.id, authorIds));
    expect(authors.every((author) => author.email.endsWith("@nuvia.test"))).toBe(true);

    // Chapters + committees are ACTIVE.
    const chapters = await db
      .select({ status: chapter.status })
      .from(chapter)
      .where(like(chapter.name, "demo-%"));
    expect(chapters.length).toBeGreaterThanOrEqual(1);
    expect(chapters.every((c) => c.status === "ACTIVE")).toBe(true);

    const committees = await db
      .select({ status: committee.status })
      .from(committee)
      .where(like(committee.name, "demo-%"));
    expect(committees.length).toBeGreaterThanOrEqual(1);
    expect(committees.every((c) => c.status === "active")).toBe(true);

    // Learning: at least one course and one ACTIVE certificate.
    const courses = await db
      .select({ id: course.id })
      .from(course)
      .where(like(course.title, "Demo:%"));
    expect(courses.length).toBeGreaterThanOrEqual(1);
    const certificates = await db
      .select({ status: certificate.status, studentEmail: certificate.studentEmail })
      .from(certificate)
      .where(like(certificate.studentEmail, "%@nuvia.test"));
    expect(certificates.length).toBeGreaterThanOrEqual(1);
    expect(certificates.every((c) => c.status === "ACTIVE")).toBe(true);
  }, 30000);

  test("is idempotent on re-run", async () => {
    const before = await db.select({ id: event.id }).from(event).where(like(event.slug, "demo-%"));
    await seedDemo();
    const after = await db.select({ id: event.id }).from(event).where(like(event.slug, "demo-%"));
    expect(after.length).toBe(before.length);
  }, 30000);
});

// ---------------------------------------------------------------------------
// stage 3 — demo login route
// ---------------------------------------------------------------------------

describe("demo login route (stage 3)", () => {
  let credentials: { email: string; password: string };

  beforeAll(async () => {
    setDemoMode(true);
    // The seed describe ran first; grab the current credential by signing in
    // through the route itself is circular, so re-seed deterministically.
    const seeded = await seedDemo();
    credentials = { email: seeded.email, password: seeded.password };
  }, 30000);

  test("returns a problem (not a session) when DEMO_MODE is off", async () => {
    setDemoMode(false);
    try {
      const res = await demoLoginPost(
        demoLoginRequest(
          { emailOrUsername: credentials.email, password: credentials.password },
          testIp(),
        ),
      );
      expect(res.status).toBe(404);
      const body = (await res.json()) as { type: string };
      expect(body.type).toContain("not-found");
    } finally {
      setDemoMode(true);
    }
  });

  test("rejects a wrong password with a login-failed problem", async () => {
    const res = await demoLoginPost(
      demoLoginRequest(
        { emailOrUsername: credentials.email, password: "Wrong-Password-123!" },
        testIp(),
      ),
    );
    expect(res.status).toBe(401);
    const body = (await res.json()) as { type: string; title: string };
    expect(body.type).toContain("login-failed");
  });

  test("refuses to sign in any account that is not the demo account", async () => {
    // Create a real admin-role account, then try to use it through the demo
    // endpoint. The role gate must fire regardless of password correctness.
    const { userId } = await signUpWithRole("admin");
    const adminRow = await db
      .select({ email: user.email })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);
    try {
      const res = await demoLoginPost(
        demoLoginRequest(
          { emailOrUsername: adminRow[0].email, password: "Any-Password-123!" },
          testIp(),
        ),
      );
      expect(res.status).toBe(403);
      const body = (await res.json()) as { type: string };
      expect(body.type).toContain("demo-account-unavailable");
    } finally {
      await deleteUserCompletely(userId);
    }
  });

  test("signs in the demo account and sets a session cookie", async () => {
    const res = await demoLoginPost(
      demoLoginRequest(
        { emailOrUsername: credentials.email, password: credentials.password },
        testIp(),
      ),
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { user: { email: string; role?: string } } };
    expect(body.data.user.email).toBe(DEMO_USER_EMAIL);
    const cookies = res.headers.getSetCookie();
    expect(cookies.some((cookie) => cookie.startsWith("nuvia-auth.session_token="))).toBe(true);
  });

  test("rate-limits repeated demo login attempts per IP", async () => {
    const ip = testIp();
    const limit = RATE_LIMITS.demoLogin.max;
    let last: Response | undefined;
    for (let attempt = 0; attempt <= limit; attempt += 1) {
      last = await demoLoginPost(
        demoLoginRequest(
          { emailOrUsername: credentials.email, password: "Wrong-Password-123!" },
          ip,
        ),
      );
    }
    expect(last!.status).toBe(429);
    expect(last!.headers.get("retry-after")).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// stage 3 — proxy integration for the demo role
// ---------------------------------------------------------------------------

describe("proxy role gate for the demo account", () => {
  test("a demo-role session is bounced off sensitive pages and passes audience pages", async () => {
    setDemoMode(true);
    const { cookie, userId } = await signUpWithRole(DEMO_ROLE);
    try {
      const forbidden = await proxy(
        new NextRequest("http://localhost:3000/dashboard/settings/general", {
          headers: { cookie },
        }),
      );
      expect(forbidden.status).toBe(307);
      const location = new URL(forbidden.headers.get("location")!);
      expect(location.pathname).toBe("/dashboard");
      expect(location.searchParams.get("error")).toBe("forbidden");

      const allowed = await proxy(
        new NextRequest("http://localhost:3000/dashboard/events/calendar", {
          headers: { cookie },
        }),
      );
      expect(allowed.status).toBe(200);
    } finally {
      await deleteUserCompletely(userId);
    }
  });
});

// ---------------------------------------------------------------------------
// reset + rotation
// ---------------------------------------------------------------------------

describe("reset-demo rotates the credential", () => {
  test("resetDemo() wipes, reseeds and rotates the password", async () => {
    setDemoMode(true);
    const before = await seedDemo();
    const rotated = await resetDemo();

    expect(rotated.password).not.toBe(before.password);
    expect(rotated.email).toBe(DEMO_USER_EMAIL);

    // Old credential no longer works; the new one does.
    const oldRes = await demoLoginPost(
      demoLoginRequest({ emailOrUsername: rotated.email, password: before.password }, testIp()),
    );
    expect(oldRes.status).toBe(401);

    const newRes = await demoLoginPost(
      demoLoginRequest({ emailOrUsername: rotated.email, password: rotated.password }, testIp()),
    );
    expect(newRes.status).toBe(200);

    // Content survived the reset (it was rebuilt).
    const events = await db.select({ id: event.id }).from(event).where(like(event.slug, "demo-%"));
    expect(events.length).toBeGreaterThanOrEqual(4);
  }, 30000);
});

// ---------------------------------------------------------------------------
// cleanup — leave the shared test database without demo residue
// ---------------------------------------------------------------------------

afterAll(async () => {
  setDemoMode(true);
  await wipeDemo();
  setDemoMode(false);
});
