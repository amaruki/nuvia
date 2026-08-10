/**
 * Middleware-path auth coverage (Phase 8, guardrail 8).
 *
 * The UI-41 gap passed two older tests at once: handler-level tests called
 * the route directly (bypassing src/proxy.ts entirely), and
 * tests/auth-route-coverage.test.ts regex-matched source text and accepted a
 * docblock mention of requirePermission. The plan item is explicit:
 * route-auth coverage must exercise requests through the middleware, not
 * handler calls that bypass it.
 *
 * These tests import the real `proxy` from src/proxy.ts and run constructed
 * NextRequest objects through it, so the assertions cover the middleware
 * code path itself: authenticate(), isRoleAllowedForPath(), the public
 * endpoint exemptions (including the UI-41 Stripe webhook path), and the
 * API auth middleware's 401 for a missing session (the exact status comes
 * from AuthResponseFactory.authError() in src/lib/auth/common.ts, which
 * src/lib/auth/middleware.ts returns via authenticate()).
 *
 * No live session is needed for the unauthenticated assertions: better-auth's
 * getSession returns null for a request without a session cookie and never
 * touches the database on that path. The ONE authenticated stretch test at
 * the bottom mints a real session cookie through better-auth's own sign-up
 * handler (the same seam tests/demo-mode.test.ts uses) and cleans up after
 * itself; it requires the shared test database like the rest of the suite.
 */

import { afterAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/db/client";
import { account, activeDevice, session, user, userLoginActivity } from "@/db/schema";
import { proxy } from "@/proxy";
import { testIp } from "./helpers";

const BASE = "http://localhost:3112";

/**
 * Build a request exactly the way the task pins it. Every request carries a
 * unique x-forwarded-for so the Redis-backed /api/** rate-limit bucket
 * (keyed by client IP, ADR-0003) never accumulates across repeated runs.
 * Six call sites share this shape on purpose.
 */
function makeRequest(pathname: string, init?: RequestInit): NextRequest {
  const headers = new Headers(init?.headers);
  headers.set("x-forwarded-for", testIp());
  return new NextRequest(new URL(pathname, BASE), {
    method: init?.method,
    headers,
    body: init?.body,
  });
}

/**
 * NextResponse.next() signals pass-through via this internal header; the
 * same idiom tests/stripe-webhook-middleware.test.ts already relies on.
 * Six call sites share the check on purpose.
 */
function isPassthrough(response: Response): boolean {
  return response.headers.get("x-middleware-next") === "1";
}

describe("proxy middleware: unauthenticated dashboard requests go to login", () => {
  test("GET /dashboard/finance/dues redirects to /auth/login preserving the path", async () => {
    const response = await proxy(makeRequest("/dashboard/finance/dues"));

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    expect(isPassthrough(response)).toBe(false);

    const location = response.headers.get("location");
    expect(location).not.toBeNull();
    const target = new URL(location!, BASE);
    expect(target.pathname).toBe("/auth/login");
    expect(target.searchParams.get("redirectTo")).toBe("/dashboard/finance/dues");
  });

  test("GET /dashboard gets the same login redirect", async () => {
    const response = await proxy(makeRequest("/dashboard"));

    expect(response.status).toBeGreaterThanOrEqual(300);
    expect(response.status).toBeLessThan(400);
    expect(isPassthrough(response)).toBe(false);

    const location = response.headers.get("location");
    expect(location).not.toBeNull();
    const target = new URL(location!, BASE);
    expect(target.pathname).toBe("/auth/login");
    expect(target.searchParams.get("redirectTo")).toBe("/dashboard");
  });
});

describe("proxy middleware: public paths pass through", () => {
  test("GET /events (public page) is a NextResponse.next() passthrough, not a redirect", async () => {
    const response = await proxy(makeRequest("/events"));

    expect(isPassthrough(response)).toBe(true);
    expect(response.headers.get("location")).toBeNull();
    expect(response.status).toBeLessThan(300);
  });

  test("POST /api/v1/webhooks/stripe without session passes through (UI-41 exemption, real code path)", async () => {
    const response = await proxy(makeRequest("/api/v1/webhooks/stripe", { method: "POST" }));

    // The exemption lives in isPublicEndpoint() inside src/proxy.ts; without
    // it the auth middleware would answer 401 before signature verification
    // could run, which is exactly the UI-41 outage.
    expect(isPassthrough(response)).toBe(true);
    expect(response.status).not.toBe(401);
  });

  test("/api/v1/auth/login passes through (anonymous-by-design)", async () => {
    const response = await proxy(makeRequest("/api/v1/auth/login", { method: "POST" }));

    expect(isPassthrough(response)).toBe(true);
    expect(response.status).not.toBe(401);
  });
});

describe("proxy middleware: protected API paths without a session", () => {
  test("GET /api/v1/members answers the auth middleware's 401", async () => {
    const response = await proxy(makeRequest("/api/v1/members"));

    // Pinned against src/lib/auth/middleware.ts: authenticate() fails with
    // AuthResponseFactory.authError(), which is a 401 (not a 403) per
    // src/lib/auth/common.ts.
    expect(isPassthrough(response)).toBe(false);
    expect(response.status).toBe(401);

    const body = (await response.json()) as { success: boolean };
    expect(body.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Stretch: ONE authenticated dashboard request through the real middleware.
// tests/demo-mode.test.ts already shows the cheap seam: sign up through
// better-auth's own HTTP handler, take the Set-Cookie headers, done. No new
// auth plumbing; the fixture user is deleted again in afterAll.
// ---------------------------------------------------------------------------

async function signUpAndMintCookie(): Promise<{ cookie: string; userId: string }> {
  const stamp = Date.now();
  const email = `middleware-auth-${stamp}-${Math.floor(Math.random() * 1e6)}@example.test`;
  const response = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": testIp() },
      body: JSON.stringify({
        email,
        password: "Middleware-Auth-Test-Password-1!",
        name: "Middleware Auth Test",
        username: `mwauth${stamp}${Math.floor(Math.random() * 1e6)}`,
      }),
    }),
  );
  const body = (await response.json()) as { user?: { id: string } };
  if (!body.user?.id) {
    throw new Error(`sign-up through better-auth failed with status ${response.status}`);
  }
  const cookie = response.headers
    .getSetCookie()
    .map((entry) => entry.split(";")[0])
    .join("; ");
  return { cookie, userId: body.user.id };
}

/** Same cleanup idiom tests/demo-mode.test.ts uses for its fixture users. */
async function deleteUserCompletely(userId: string): Promise<void> {
  await db.delete(userLoginActivity).where(eq(userLoginActivity.userId, userId));
  await db.delete(session).where(eq(session.userId, userId));
  await db.delete(account).where(eq(account.userId, userId));
  await db.delete(activeDevice).where(eq(activeDevice.userId, userId));
  await db.delete(user).where(eq(user.id, userId));
}

describe("proxy middleware: authenticated dashboard request (stretch)", () => {
  let fixtureUserId: string | null = null;

  afterAll(async () => {
    if (fixtureUserId) {
      await deleteUserCompletely(fixtureUserId);
    }
  });

  test("a minted session cookie passes GET /dashboard through the middleware", async () => {
    const { cookie, userId } = await signUpAndMintCookie();
    fixtureUserId = userId;

    const response = await proxy(
      new NextRequest(new URL("/dashboard", BASE), {
        headers: { cookie, "x-forwarded-for": testIp() },
      }),
    );

    // Signed-up users get the schema-default "user" role, which
    // navigation-data.ts allows on /dashboard, so the role gate passes and
    // the middleware continues to the page instead of redirecting.
    expect(response.status).toBe(200);
    expect(isPassthrough(response)).toBe(true);
    expect(response.headers.get("location")).toBeNull();
  }, 30_000);
});
