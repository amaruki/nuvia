import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import path from "node:path";

const readSource = (file: string) => readFileSync(path.join(process.cwd(), file), "utf8");

describe("authentication server-action token boundary", () => {
  test("the login result never serializes the Better Auth token", () => {
    const action = readSource("src/lib/actions/auth.actions/credentials.ts");
    const responseType = readSource("src/types/auth.types.ts");
    const authResponse = responseType
      .split("export type AuthResponse =", 2)[1]
      ?.split("// Password reset response type", 1)[0];

    expect(action).not.toContain("result.token");
    expect(authResponse).not.toContain("accessToken");
    expect(authResponse).not.toContain("refreshToken");
  });
});
