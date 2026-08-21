import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";

const readSource = (file: string) => readFileSync(path.join(process.cwd(), file), "utf8");

describe("authentication server-action rate limits", () => {
  test("credential actions check their named bucket before Better Auth", () => {
    const source = readSource("src/lib/actions/auth.actions/credentials.ts");

    expect(source.indexOf('checkRouteRateLimit(requestHeaders, "login")')).toBeLessThan(
      source.indexOf("auth.api.signInEmail"),
    );
    expect(source.indexOf('checkRouteRateLimit(requestHeaders, "signup")')).toBeLessThan(
      source.indexOf("auth.api.signUpEmail"),
    );
  });

  test("password actions check every named bucket", () => {
    const source = readSource("src/lib/actions/auth.actions/password.ts");

    for (const route of ["forgotPassword", "resetPassword", "changePassword"]) {
      expect(source).toContain(`rateLimitPasswordAction("${route}")`);
    }
  });
});
