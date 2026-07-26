import { describe, expect, test } from "bun:test";
import { z } from "zod";
import { problemResponse, problems, successResponse, validationProblem } from "@/lib/http";
import { POST as login } from "@/app/api/v1/auth/login/route";
import { testIp } from "./helpers";

describe("problemResponse", () => {
  test("emits application/problem+json with the RFC 9457 members", async () => {
    const res = problemResponse(problems.insufficientPermission("Requires events:publish"));
    expect(res.status).toBe(403);
    expect(res.headers.get("content-type")).toBe("application/problem+json");

    const body = await res.json();
    expect(body.type).toContain("/problems/insufficient-permission");
    expect(body.title).toBe("Insufficient permission");
    expect(body.status).toBe(403);
    expect(body.detail).toBe("Requires events:publish");
  });

  test("validationProblem carries a field/message errors extension", async () => {
    const schema = z.object({ email: z.string().email() });
    const parsed = schema.safeParse({ email: "not-an-email" });
    if (parsed.success) throw new Error("expected validation to fail");

    const res = problemResponse(validationProblem(parsed.error));
    expect(res.status).toBe(422);

    const body = await res.json();
    expect(Array.isArray(body.errors)).toBe(true);
    expect(body.errors[0]).toHaveProperty("field");
    expect(body.errors[0]).toHaveProperty("message");
  });
});

describe("successResponse", () => {
  test("wraps data in the { data, meta } envelope", async () => {
    const res = successResponse({ id: "abc" });
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.data).toEqual({ id: "abc" });
    expect(body.meta.version).toBe("v1");
    expect(typeof body.meta.timestamp).toBe("string");
  });
});

describe("a real route's error response", () => {
  test("login with bad credentials returns a Problem, not an ad-hoc shape", async () => {
    const res = await login(
      new Request("http://localhost:3000/api/v1/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": testIp() },
        body: JSON.stringify({
          emailOrUsername: "no-such-user@example.test",
          password: "whatever-wrong-password",
        }),
      }) as never,
    );

    expect(res.headers.get("content-type")).toBe("application/problem+json");
    const body = await res.json();
    expect(body.status).toBe(res.status);
    expect(typeof body.type).toBe("string");
    expect(typeof body.title).toBe("string");
  });
});
