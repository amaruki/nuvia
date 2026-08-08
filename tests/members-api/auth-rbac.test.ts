/**
 * B1 — Members API: route authorization gate (RFC 9457).
 * Part of the split members suite in tests/members-api/.
 *
 * No fixtures needed: both routes reject unauthenticated requests before
 * any data access, so this file runs against the shared database without
 * seeding a cohort.
 */

import { describe, expect, test } from "bun:test";
import { GET as listMembersRoute } from "@/app/api/v1/members/route";
import { GET as memberDetailRoute } from "@/app/api/v1/members/[id]/route";

describe("members routes — authorization gate (RFC 9457)", () => {
  test("GET /api/v1/members rejects unauthenticated requests", async () => {
    const response = await listMembersRoute(
      new Request("http://localhost/api/v1/members") as never,
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("content-type")).toContain("application/problem+json");
    const body = await response.json();
    expect(body.status).toBe(401);
    expect(body.type).toContain("/problems/authentication-required");
  });

  test("GET /api/v1/members/[id] rejects unauthenticated requests", async () => {
    const response = await memberDetailRoute(
      new Request("http://localhost/api/v1/members/x") as never,
      {
        params: Promise.resolve({ id: crypto.randomUUID() }),
      },
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("content-type")).toContain("application/problem+json");
    const body = await response.json();
    expect(body.status).toBe(401);
  });
});
