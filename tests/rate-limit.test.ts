import { describe, expect, test } from "bun:test";
import { Redis } from "ioredis";
import {
  checkRateLimit,
  checkRouteRateLimit,
  RATE_LIMITS,
  _resetClientForTests,
} from "@/lib/rate-limit";
import { env } from "@/lib/env";
import { POST as login } from "@/app/api/v1/auth/login/route";
import { testIp } from "./helpers";

describe("checkRateLimit", () => {
  test("returns 429-worthy `limited: true` once the threshold is exceeded", async () => {
    const key = `test-threshold-${Date.now()}`;
    const config = { windowSeconds: 60, max: 3 };

    const results = [];
    for (let i = 0; i < 5; i++) {
      results.push(await checkRateLimit(key, config));
    }

    expect(results.slice(0, 3).every((r) => !r.limited)).toBe(true);
    expect(results.slice(3).every((r) => r.limited)).toBe(true);
  });

  test("state survives a simulated process restart (lives in Redis, not memory)", async () => {
    const key = `test-restart-${Date.now()}`;
    const config = { windowSeconds: 60, max: 2 };

    await checkRateLimit(key, config);
    await checkRateLimit(key, config);

    // Simulate this module being loaded fresh in a new process: drop the
    // module-level client singleton and force a brand new connection.
    _resetClientForTests();

    const afterRestart = await checkRateLimit(key, config);
    expect(afterRestart.limited).toBe(true);

    // Prove it independently: read the same key with a bare, unrelated
    // ioredis connection this module never touched.
    if (env.REDIS_URL) {
      const independentClient = new Redis(env.REDIS_URL);
      const count = await independentClient.zcard(`nuvia:ratelimit:${key}`);
      expect(count).toBeGreaterThanOrEqual(2);
      await independentClient.quit();
    }
  });

  test("each key gets its own independent window (ip + route isolation)", async () => {
    const config = { windowSeconds: 60, max: 1 };
    const keyA = `test-isolation-a-${Date.now()}`;
    const keyB = `test-isolation-b-${Date.now()}`;

    const a1 = await checkRateLimit(keyA, config);
    const a2 = await checkRateLimit(keyA, config);
    const b1 = await checkRateLimit(keyB, config);

    expect(a1.limited).toBe(false);
    expect(a2.limited).toBe(true);
    expect(b1.limited).toBe(false);
  });

  test("RATE_LIMITS covers every auth endpoint ADR-0003 names", () => {
    expect(RATE_LIMITS.login).toBeDefined();
    expect(RATE_LIMITS.signup).toBeDefined();
    expect(RATE_LIMITS.forgotPassword).toBeDefined();
    expect(RATE_LIMITS.resetPassword).toBeDefined();
    expect(RATE_LIMITS.changePassword).toBeDefined();
  });

  test("named route checks use the trusted client IP and route bucket", async () => {
    const ip = testIp();
    const requestHeaders = new Headers({ "x-forwarded-for": ip });
    const results = [];

    for (let i = 0; i <= RATE_LIMITS.login.max; i++) {
      results.push(await checkRouteRateLimit(requestHeaders, "login"));
    }

    expect(results.at(-1)?.limited).toBe(true);
  });
});

describe("POST /api/v1/auth/login", () => {
  test("returns a 429 Problem with Retry-After once the same IP exceeds the limit", async () => {
    const ip = testIp();
    const attempt = () =>
      login(
        new Request("http://localhost:3000/api/v1/auth/login", {
          method: "POST",
          headers: { "content-type": "application/json", "x-forwarded-for": ip },
          body: JSON.stringify({
            emailOrUsername: "no-such-user@example.test",
            password: "wrong-password",
          }),
        }) as never,
      );

    // RATE_LIMITS.login allows 5 per window — the 6th from the same IP
    // must be rejected before the route even calls better-auth.
    let last;
    for (let i = 0; i < 6; i++) {
      last = await attempt();
    }

    expect(last!.status).toBe(429);
    expect(last!.headers.get("content-type")).toBe("application/problem+json");
    expect(last!.headers.get("retry-after")).toBeTruthy();

    const body = await last!.json();
    expect(body.status).toBe(429);
  });
});
