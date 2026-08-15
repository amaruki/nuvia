/**
 * Deployment probe — GET /api/v1/health (docs/DEPLOYMENT_PLAN.md §Health
 * checks).
 *
 * Requires the integration stack: a reachable Postgres and Redis (the
 * probe round-trips both, so a down dependency changes the assertion).
 */
import { describe, expect, test } from "bun:test";

import { GET } from "@/app/api/v1/health/route";

describe("GET /api/v1/health", () => {
  test("answers 200 with ok status when Postgres and Redis both answer", async () => {
    const response = await GET();
    const body = (await response.json()) as {
      status: string;
      checks: { database: { reachable: boolean }; redis: { reachable: boolean } };
    };

    expect(response.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.checks.database.reachable).toBe(true);
    expect(body.checks.redis.reachable).toBe(true);
  });

  test("leaks no versions, configuration, or error detail in the body", async () => {
    const response = await GET();
    const text = await response.text();

    // The honesty contract: reachability booleans only.
    expect(text).not.toContain("postgresql");
    expect(text).not.toContain("redis://");
    expect(text).not.toContain("ECONN");
    expect(text).not.toContain("password");
  });

  test("needs no session — orchestrators poll it anonymously", async () => {
    // The handler takes no request at all: it never reads auth headers.
    // This asserts the public contract structurally.
    expect(GET.length).toBe(0);
  });
});
